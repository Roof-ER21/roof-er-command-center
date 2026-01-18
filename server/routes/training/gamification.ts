import { Router, Request, Response } from "express";
import { requireAuth, requireModuleAccess } from "../../middleware/auth.js";
import { db } from "../../db.js";
import {
  trainingProgress,
  trainingUserProgress,
  trainingAchievements,
  trainingStreaks,
  trainingXPHistory,
  users
} from "../../../shared/schema.js";
import { eq, and, desc, sql } from "drizzle-orm";
import { ACHIEVEMENTS } from "../../../shared/constants/achievements.js";
import {
  broadcastBadgeAchievement,
  broadcastTrainingMilestone,
} from "../../utils/achievement-broadcaster.js";

const router = Router();

// Apply auth and module access middleware
router.use(requireAuth);
router.use(requireModuleAccess('training'));

/**
 * Award XP for completing an action
 * POST /api/training/gamification/award-xp
 */
router.post("/award-xp", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const {
      xpAmount,
      action,
      metadata
    }: {
      xpAmount: number;
      action: 'module_complete' | 'quiz_score' | 'roleplay_session' | 'streak_bonus' | 'achievement';
      metadata?: Record<string, any>;
    } = req.body;

    if (!xpAmount || xpAmount <= 0) {
      return res.status(400).json({ success: false, error: "Invalid XP amount" });
    }

    // Get or create user progress
    let [userProgress] = await db
      .select()
      .from(trainingUserProgress)
      .where(eq(trainingUserProgress.userId, userId))
      .limit(1);

    if (!userProgress) {
      [userProgress] = await db
        .insert(trainingUserProgress)
        .values({
          userId,
          totalXP: 0,
          currentLevel: 1,
          completedModules: [],
          lastActivityAt: new Date(),
        })
        .returning();
    }

    // Calculate new XP and level
    const newTotalXP = userProgress.totalXP + xpAmount;
    const newLevel = calculateLevel(newTotalXP);
    const leveledUp = newLevel > userProgress.currentLevel;

    // Update progress
    await db
      .update(trainingUserProgress)
      .set({
        totalXP: newTotalXP,
        currentLevel: newLevel,
        lastActivityAt: new Date(),
      })
      .where(eq(trainingUserProgress.userId, userId));

    // Record XP history
    await db.insert(trainingXPHistory).values({
      userId,
      xpAmount,
      action,
      metadata: metadata || {},
      earnedAt: new Date(),
    });

    // Check for new achievements
    const newAchievements = await checkAchievements(userId, {
      totalXP: newTotalXP,
      action,
      metadata,
    });

    // Broadcast level up event
    if (leveledUp) {
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const userName = user ? (user.username || `User ${userId}`) : `User ${userId}`;

      broadcastTrainingMilestone({
        userId,
        userName,
        milestoneType: 'level_up',
        value: newLevel,
        title: `🎖️ Level ${newLevel} Achieved!`,
        description: `Reached level ${newLevel} with ${newTotalXP.toLocaleString()} total XP`,
      });
    }

    // Broadcast XP milestones (every 1000 XP)
    const previousMilestone = Math.floor(userProgress.totalXP / 1000) * 1000;
    const newMilestone = Math.floor(newTotalXP / 1000) * 1000;
    if (newMilestone > previousMilestone && newMilestone > 0) {
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const userName = user ? (user.username || `User ${userId}`) : `User ${userId}`;

      broadcastTrainingMilestone({
        userId,
        userName,
        milestoneType: 'xp',
        value: newMilestone,
        title: `⭐ ${newMilestone.toLocaleString()} XP Milestone!`,
        description: `Earned ${newMilestone.toLocaleString()} total experience points`,
      });
    }

    res.json({
      success: true,
      data: {
        xpAwarded: xpAmount,
        totalXP: newTotalXP,
        currentLevel: newLevel,
        leveledUp,
        newAchievements,
      },
    });
  } catch (error) {
    console.error("Award XP error:", error);
    res.status(500).json({ success: false, error: "Failed to award XP" });
  }
});

/**
 * Get user's achievements
 * GET /api/training/gamification/achievements
 */
router.get("/achievements", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    // Get unlocked achievements
    const unlocked = await db
      .select()
      .from(trainingAchievements)
      .where(eq(trainingAchievements.userId, userId))
      .orderBy(desc(trainingAchievements.unlockedAt));

    // Get user progress for locked achievements
    const [userProgress] = await db
      .select()
      .from(trainingUserProgress)
      .where(eq(trainingUserProgress.userId, userId))
      .limit(1);

    // Calculate progress for locked achievements
    const achievementsWithProgress = ACHIEVEMENTS.map(achievement => {
      const unlockedData = unlocked.find((u: { achievementId: string }) => u.achievementId === achievement.id);

      if (unlockedData) {
        return {
          ...achievement,
          unlocked: true,
          unlockedAt: unlockedData.unlockedAt,
          progress: 100,
        };
      }

      // Calculate progress for locked achievements
      let progress = 0;
      if (userProgress) {
        progress = calculateAchievementProgress(achievement, userProgress);
      }

      return {
        ...achievement,
        unlocked: false,
        progress,
      };
    });

    res.json({
      success: true,
      data: {
        achievements: achievementsWithProgress,
        unlockedCount: unlocked.length,
        totalCount: ACHIEVEMENTS.length,
      },
    });
  } catch (error) {
    console.error("Get achievements error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch achievements" });
  }
});

/**
 * Check and update streak status
 * POST /api/training/gamification/check-streak
 */
router.post("/check-streak", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    // Get or create streak record
    let [streak] = await db
      .select()
      .from(trainingStreaks)
      .where(eq(trainingStreaks.userId, userId))
      .limit(1);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!streak) {
      // Create new streak
      [streak] = await db
        .insert(trainingStreaks)
        .values({
          userId,
          currentStreak: 1,
          longestStreak: 1,
          lastActivityDate: today,
          freezesAvailable: 1,
        })
        .returning();

      return res.json({
        success: true,
        data: {
          currentStreak: 1,
          longestStreak: 1,
          freezesAvailable: 1,
          streakActive: true,
        },
      });
    }

    // Check if activity was already recorded today
    const lastActivity = new Date(streak.lastActivityDate);
    lastActivity.setHours(0, 0, 0, 0);

    if (lastActivity.getTime() === today.getTime()) {
      // Already counted today
      return res.json({
        success: true,
        data: {
          currentStreak: streak.currentStreak,
          longestStreak: streak.longestStreak,
          freezesAvailable: streak.freezesAvailable,
          streakActive: true,
        },
      });
    }

    // Check if streak continues (yesterday)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let newStreak = streak.currentStreak;
    let freezesUsed = 0;

    if (lastActivity.getTime() === yesterday.getTime()) {
      // Streak continues
      newStreak += 1;
    } else {
      // Check for freeze
      const daysSinceLastActivity = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceLastActivity <= 2 && streak.freezesAvailable > 0) {
        // Use freeze
        newStreak += 1;
        freezesUsed = 1;
      } else {
        // Streak broken
        newStreak = 1;
      }
    }

    // Update longest streak
    const longestStreak = Math.max(streak.longestStreak, newStreak);

    // Grant freeze every 7 days
    const freezesAvailable = Math.min(
      3,
      streak.freezesAvailable - freezesUsed + (newStreak % 7 === 0 ? 1 : 0)
    );

    // Update streak
    await db
      .update(trainingStreaks)
      .set({
        currentStreak: newStreak,
        longestStreak,
        lastActivityDate: today,
        freezesAvailable,
      })
      .where(eq(trainingStreaks.userId, userId));

    // Check for streak achievements
    await checkStreakAchievements(userId, newStreak);

    // Broadcast streak milestones (every 7 days)
    if (newStreak % 7 === 0 && newStreak > 0) {
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const userName = user ? (user.username || `User ${userId}`) : `User ${userId}`;

      broadcastTrainingMilestone({
        userId,
        userName,
        milestoneType: 'streak',
        value: newStreak,
        title: `🔥 ${newStreak}-Day Streak!`,
        description: `Maintained a ${newStreak}-day learning streak`,
      });
    }

    res.json({
      success: true,
      data: {
        currentStreak: newStreak,
        longestStreak,
        freezesAvailable,
        streakActive: true,
        freezeUsed: freezesUsed > 0,
      },
    });
  } catch (error) {
    console.error("Check streak error:", error);
    res.status(500).json({ success: false, error: "Failed to check streak" });
  }
});

/**
 * Get training leaderboard
 * GET /api/training/gamification/leaderboard
 */
router.get("/leaderboard", async (req: Request, res: Response) => {
  try {
    const { timeframe = 'all', limit = 50 } = req.query;

    // Get top users by XP
    const leaderboard = await db
      .select({
        userId: trainingUserProgress.userId,
        totalXP: trainingUserProgress.totalXP,
        currentLevel: trainingUserProgress.currentLevel,
        completedModules: trainingUserProgress.completedModules,
        lastActivityAt: trainingUserProgress.lastActivityAt,
      })
      .from(trainingUserProgress)
      .orderBy(desc(trainingUserProgress.totalXP))
      .limit(Number(limit));

    // Get current user's rank
    const userId = req.user?.id;
    let userRank = null;

    if (userId) {
      const allUsers = await db
        .select({ userId: trainingUserProgress.userId, totalXP: trainingUserProgress.totalXP })
        .from(trainingUserProgress)
        .orderBy(desc(trainingUserProgress.totalXP));

      const rankIndex = allUsers.findIndex((u: { userId: number; totalXP: number }) => u.userId === userId);
      if (rankIndex !== -1) {
        userRank = {
          rank: rankIndex + 1,
          totalUsers: allUsers.length,
        };
      }
    }

    res.json({
      success: true,
      data: {
        leaderboard,
        userRank,
      },
    });
  } catch (error) {
    console.error("Leaderboard error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch leaderboard" });
  }
});

/**
 * Helper: Calculate level from total XP
 * Formula: XP = 50 * level^2
 */
function calculateLevel(totalXP: number): number {
  if (totalXP <= 0) return 1;

  let level = 1;
  while (50 * Math.pow(level + 1, 2) <= totalXP) {
    level++;
  }
  return Math.min(50, level); // Cap at level 50
}

/**
 * Helper: Check for new achievements
 */
async function checkAchievements(
  userId: number,
  context: { totalXP: number; action: string; metadata?: any }
): Promise<any[]> {
  const newAchievements: any[] = [];

  // Get existing achievements
  const existing = await db
    .select()
    .from(trainingAchievements)
    .where(eq(trainingAchievements.userId, userId));

  const existingIds = new Set(existing.map((a: { achievementId: string }) => a.achievementId));

  // Get user progress
  const [progress] = await db
    .select()
    .from(trainingUserProgress)
    .where(eq(trainingUserProgress.userId, userId))
    .limit(1);

  if (!progress) return [];

  // Check each achievement
  for (const achievement of ACHIEVEMENTS) {
    if (existingIds.has(achievement.id)) continue;

    let shouldUnlock = false;

    switch (achievement.criteria.type) {
      case 'module_complete':
        if (progress.completedModules.length >= (achievement.criteria.value || 0)) {
          shouldUnlock = true;
        }
        break;

      case 'score':
        if (context.action === 'quiz_score' && context.metadata?.score >= (achievement.criteria.value || 0)) {
          if (!achievement.criteria.moduleId || context.metadata?.moduleId === achievement.criteria.moduleId) {
            shouldUnlock = true;
          }
        }
        break;

      case 'special':
        // XP milestones
        if (achievement.id.startsWith('xp_')) {
          const threshold = parseInt(achievement.id.split('_')[1]);
          if (context.totalXP >= threshold) {
            shouldUnlock = true;
          }
        }
        break;
    }

    if (shouldUnlock) {
      await db.insert(trainingAchievements).values({
        userId,
        achievementId: achievement.id,
        unlockedAt: new Date(),
      });

      newAchievements.push(achievement);

      // Broadcast badge achievement
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const userName = user ? (user.username || `User ${userId}`) : `User ${userId}`;

      broadcastBadgeAchievement({
        userId,
        userName,
        badgeName: achievement.name,
        badgeDescription: achievement.description,
        badgeIcon: achievement.icon,
        badgeRarity: achievement.rarity,
      });
    }
  }

  return newAchievements;
}

/**
 * Helper: Check for streak-based achievements
 */
async function checkStreakAchievements(userId: number, currentStreak: number): Promise<void> {
  const streakAchievements = ACHIEVEMENTS.filter(a => a.criteria.type === 'streak');

  const existing = await db
    .select()
    .from(trainingAchievements)
    .where(eq(trainingAchievements.userId, userId));

  const existingIds = new Set(existing.map((a: { achievementId: string }) => a.achievementId));

  for (const achievement of streakAchievements) {
    if (!existingIds.has(achievement.id) && currentStreak >= (achievement.criteria.value || 0)) {
      await db.insert(trainingAchievements).values({
        userId,
        achievementId: achievement.id,
        unlockedAt: new Date(),
      });

      // Broadcast streak badge achievement
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const userName = user ? (user.username || `User ${userId}`) : `User ${userId}`;

      broadcastBadgeAchievement({
        userId,
        userName,
        badgeName: achievement.name,
        badgeDescription: achievement.description,
        badgeIcon: achievement.icon,
        badgeRarity: achievement.rarity,
      });
    }
  }
}

/**
 * Helper: Calculate progress for locked achievement
 */
function calculateAchievementProgress(achievement: any, userProgress: any): number {
  switch (achievement.criteria.type) {
    case 'module_complete':
      return Math.min(100, Math.round((userProgress.completedModules.length / (achievement.criteria.value || 1)) * 100));

    case 'streak':
      // Would need to fetch streak data
      return 0;

    case 'special':
      if (achievement.id.startsWith('xp_')) {
        const threshold = parseInt(achievement.id.split('_')[1]);
        return Math.min(100, Math.round((userProgress.totalXP / threshold) * 100));
      }
      return 0;

    default:
      return 0;
  }
}

export default router;
