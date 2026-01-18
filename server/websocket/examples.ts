/**
 * Examples of how to use WebSocket handlers from API endpoints
 *
 * Import the setupWebSocket return value in your server/index.ts
 * and use these patterns to emit real-time events
 */

import type {
  RankingUpdate,
  ContestEntry,
  AchievementEvent,
  XPGainEvent,
  LevelUpEvent,
  StreakUpdate,
  TrainingAchievement,
} from "./index";

/**
 * Example: Notify leaderboard update when a sale is recorded
 *
 * Usage in your sales API endpoint:
 */
export function exampleSaleRecorded(wsHandlers: any) {
  // After recording a sale in database, calculate new rankings
  const userId = 123;
  const newRank = 5;
  const previousRank = 7;

  const rankingUpdate: RankingUpdate = {
    userId,
    userName: "John Doe",
    previousRank,
    newRank,
    metric: "yearlyRevenue",
    value: 150000,
    timestamp: new Date(),
  };

  // Broadcast ranking update to all clients
  wsHandlers.leaderboard.broadcastRankingUpdate(rankingUpdate);

  // Also notify the specific user
  wsHandlers.leaderboard.notifyUserRankChange(userId, rankingUpdate);

  // If they moved into top 3, celebrate!
  if (newRank <= 3 && previousRank > 3) {
    const achievement: AchievementEvent = {
      userId,
      userName: "John Doe",
      achievementType: "rank",
      title: "Top Performer!",
      description: `Reached #${newRank} on the leaderboard`,
      icon: "🏆",
      timestamp: new Date(),
    };
    wsHandlers.leaderboard.celebrateAchievement(achievement);
  }
}

/**
 * Example: Notify contest entry when user joins a contest
 */
export function exampleContestEntry(wsHandlers: any) {
  const contestEntry: ContestEntry = {
    contestId: 1,
    userId: 123,
    userName: "John Doe",
    metric: "weeklySignups",
    value: 15,
    rank: 3,
    timestamp: new Date(),
  };

  wsHandlers.leaderboard.broadcastContestEntry(contestEntry);
}

/**
 * Example: Award XP after quiz completion
 */
export function exampleQuizCompleted(wsHandlers: any) {
  const userId = 123;
  const xpEarned = 50;
  const newTotal = 1250;

  const xpEvent: XPGainEvent = {
    userId,
    userName: "John Doe",
    amount: xpEarned,
    source: "Quiz: Sales Fundamentals",
    newTotal,
    timestamp: new Date(),
  };

  wsHandlers.training.notifyXPGain(xpEvent);

  // Check if this pushed them to a new level
  const currentLevel = Math.floor(newTotal / 500);
  const previousLevel = Math.floor((newTotal - xpEarned) / 500);

  if (currentLevel > previousLevel) {
    const levelUpEvent: LevelUpEvent = {
      userId,
      userName: "John Doe",
      previousLevel,
      newLevel: currentLevel,
      totalXP: newTotal,
      rewards: {
        badges: ["Sales Expert"],
        unlocks: ["Advanced Roleplay Scenarios"],
      },
      timestamp: new Date(),
    };

    wsHandlers.training.celebrateLevelUp(levelUpEvent);
  }

  // Also send quiz completion notification
  wsHandlers.training.notifyQuizComplete({
    userId,
    quizId: "quiz-123",
    score: 85,
    passed: true,
    xpEarned,
  });
}

/**
 * Example: Update daily login streak
 */
export function exampleDailyLogin(wsHandlers: any) {
  const userId = 123;
  const currentStreak = 7;

  const streakUpdate: StreakUpdate = {
    userId,
    userName: "John Doe",
    currentStreak,
    longestStreak: 14,
    streakType: "daily",
    milestone: currentStreak % 7 === 0 ? {
      reached: currentStreak,
      reward: "Weekly Warrior Badge",
    } : undefined,
    timestamp: new Date(),
  };

  wsHandlers.training.updateStreak(streakUpdate);

  // Award bonus XP for milestone
  if (streakUpdate.milestone) {
    const xpBonus: XPGainEvent = {
      userId,
      userName: "John Doe",
      amount: 100,
      source: "7-Day Streak Bonus",
      newTotal: 1350,
      timestamp: new Date(),
    };
    wsHandlers.training.notifyXPGain(xpBonus);
  }
}

/**
 * Example: Unlock achievement for completing all modules
 */
export function exampleAchievementUnlock(wsHandlers: any) {
  const achievement: TrainingAchievement = {
    userId: 123,
    userName: "John Doe",
    achievementId: "master-learner",
    title: "Master Learner",
    description: "Completed all training modules",
    category: "completion",
    rarity: "epic",
    xpBonus: 500,
    timestamp: new Date(),
  };

  wsHandlers.training.notifyAchievement(achievement);

  // Award bonus XP
  if (achievement.xpBonus) {
    const xpBonus: XPGainEvent = {
      userId: achievement.userId,
      userName: achievement.userName,
      amount: achievement.xpBonus,
      source: `Achievement: ${achievement.title}`,
      newTotal: 1850,
      timestamp: new Date(),
    };
    wsHandlers.training.notifyXPGain(xpBonus);
  }
}

/**
 * Example: Send AI roleplay response
 */
export function exampleRoleplayResponse(wsHandlers: any) {
  const sessionId = "session-abc123";

  wsHandlers.training.sendRoleplayResponse(sessionId, {
    message: "Great job handling that objection! Let's try a harder scenario.",
    metadata: {
      score: 85,
      feedback: "Excellent use of the SPIN questioning technique",
    },
  });
}

/**
 * Example: Broadcast team-wide notification
 */
export function exampleTeamNotification(wsHandlers: any) {
  const teamId = 5;

  wsHandlers.leaderboard.notifyTeam(teamId, "team:goal-reached", {
    teamName: "East Coast Team",
    goal: "Monthly Revenue Target",
    achievement: "$500K in monthly revenue",
    timestamp: new Date(),
  });
}

/**
 * Example: Full leaderboard refresh (e.g., after database migration)
 */
export function exampleFullRefresh(wsHandlers: any, rankings: any[]) {
  wsHandlers.leaderboard.broadcastLeaderboardRefresh(rankings);
}

/**
 * Example: Update TV display with specific data
 */
export function exampleTVDisplayUpdate(wsHandlers: any) {
  wsHandlers.leaderboard.updateTVDisplay({
    type: "celebration",
    message: "John Doe just closed a $50K deal!",
    duration: 5000,
  });
}

/**
 * Complete example: Sales endpoint with WebSocket notifications
 */
export async function exampleCreateSaleEndpoint(
  req: any,
  res: any,
  wsHandlers: any,
  db: any
) {
  try {
    const { userId, amount, type } = req.body;

    // 1. Create sale in database
    const sale = await db.sales.create({
      userId,
      amount,
      type,
      date: new Date(),
    });

    // 2. Update user's revenue totals
    const user = await db.users.findOne({ id: userId });
    const newRevenue = user.yearlyRevenue + amount;
    await db.users.update({ id: userId }, { yearlyRevenue: newRevenue });

    // 3. Recalculate rankings
    const allUsers = await db.users.findAll({ order: [["yearlyRevenue", "DESC"]] });
    const previousRank = allUsers.findIndex((u: any) => u.id === userId) + 1;
    const newRankIndex = allUsers.findIndex((u: any) => u.yearlyRevenue <= newRevenue);
    const newRank = newRankIndex === -1 ? allUsers.length : newRankIndex + 1;

    // 4. Send WebSocket notifications
    if (newRank !== previousRank) {
      const rankingUpdate: RankingUpdate = {
        userId,
        userName: user.name,
        previousRank,
        newRank,
        metric: "yearlyRevenue",
        value: newRevenue,
        timestamp: new Date(),
      };

      wsHandlers.leaderboard.broadcastRankingUpdate(rankingUpdate);
      wsHandlers.leaderboard.notifyUserRankChange(userId, rankingUpdate);

      // Celebrate top 3 achievement
      if (newRank <= 3 && previousRank > 3) {
        wsHandlers.leaderboard.celebrateAchievement({
          userId,
          userName: user.name,
          achievementType: "rank",
          title: "Top Performer",
          description: `Reached #${newRank} on the leaderboard!`,
          icon: "🏆",
          timestamp: new Date(),
        });
      }
    }

    // 5. Notify team
    if (user.teamId) {
      wsHandlers.leaderboard.notifyTeam(user.teamId, "team:sale-recorded", {
        userName: user.name,
        amount,
        type,
      });
    }

    res.json({ success: true, sale, newRank });
  } catch (error) {
    console.error("Error creating sale:", error);
    res.status(500).json({ error: "Failed to create sale" });
  }
}
