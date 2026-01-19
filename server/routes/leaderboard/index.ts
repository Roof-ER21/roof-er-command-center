import { Router, Request, Response } from "express";
import { requireAuth, requireModuleAccess } from "../../middleware/auth.js";
import { db } from "../../db.js";
import {
  salesReps,
  teams,
  territories,
  contests,
  contestParticipants,
  leaderboardSnapshots,
  badges,
  playerProfiles,
  playerBadges,
  users
} from "../../../shared/schema.js";
import { eq, desc, sql, asc, and, gte } from "drizzle-orm";
import { analyzeSalesRepUpdate } from "../../utils/sales-milestone-tracker.js";
import { broadcastContestAchievement } from "../../utils/achievement-broadcaster.js";
import { wsHandlers } from "../../index.js";
import { detectMilestones, awardMilestoneBadge, type SalesRepStats } from "./milestones.js";
import badgeRoutes from "./badge-routes.js";
import { selectUserColumns } from "../../utils/user-select.js";

const router = Router();

// Apply auth and module access middleware
router.use(requireAuth);
router.use(requireModuleAccess('leaderboard'));

// Mount badge routes
router.use(badgeRoutes);

// Get leaderboard stats
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const [totalReps] = await db.select({ count: sql<number>`count(*)` }).from(salesReps);
    const [activeContests] = await db.select({ count: sql<number>`count(*)` })
      .from(contests)
      .where(eq(contests.status, 'active'));

    const allReps = await db.select({
      monthlyRevenue: salesReps.monthlyRevenue,
      yearlyRevenue: salesReps.yearlyRevenue,
    }).from(salesReps);

    const totalMonthlyRevenue = allReps.reduce((sum, r) => sum + Number(r.monthlyRevenue || 0), 0);
    const totalYearlyRevenue = allReps.reduce((sum, r) => sum + Number(r.yearlyRevenue || 0), 0);

    res.json({
      totalReps: Number(totalReps?.count || 0),
      activeContests: Number(activeContests?.count || 0),
      totalMonthlyRevenue,
      totalYearlyRevenue,
      averageMonthlyRevenue: allReps.length ? totalMonthlyRevenue / allReps.length : 0,
    });
  } catch (error) {
    console.error("Leaderboard stats error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      error: "Failed to fetch leaderboard stats",
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

// Get sales reps (leaderboard) - supports /api/leaderboard/sales-reps and /api/sales-reps
router.get("/sales-reps", async (req: Request, res: Response) => {
  try {
    const reps = await db.select()
      .from(salesReps)
      .where(eq(salesReps.isActive, true))
      .orderBy(desc(salesReps.monthlyRevenue));

    // Add rank to each rep
    const rankedReps = reps.map((rep, index) => ({
      ...rep,
      rank: index + 1,
      monthlyRevenue: Number(rep.monthlyRevenue),
      yearlyRevenue: Number(rep.yearlyRevenue),
      allTimeRevenue: Number(rep.allTimeRevenue),
      monthlySignups: Number(rep.monthlySignups),
      yearlySignups: Number(rep.yearlySignups),
      goalProgress: Number(rep.goalProgress),
      monthlyGrowth: Number(rep.monthlyGrowth),
    }));

    res.json(rankedReps);
  } catch (error) {
    console.error("Sales reps fetch error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      error: "Failed to fetch sales reps",
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

// Get teams
router.get("/teams", async (req: Request, res: Response) => {
  try {
    const allTeams = await db.select().from(teams).where(eq(teams.isActive, true));
    res.json(allTeams);
  } catch (error) {
    console.error("Teams fetch error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      error: "Failed to fetch teams",
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

// Get territories
router.get("/territories", async (req: Request, res: Response) => {
  try {
    const allTerritories = await db.select().from(territories).where(eq(territories.isActive, true));
    res.json(allTerritories);
  } catch (error) {
    console.error("Territories fetch error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      error: "Failed to fetch territories",
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

// Get leaderboard
router.get("/", async (req: Request, res: Response) => {
  try {
    const reps = await db.select()
      .from(salesReps)
      .where(eq(salesReps.isActive, true))
      .orderBy(desc(salesReps.monthlyRevenue));

    res.json({
      success: true,
      data: {
        rankings: reps.map((rep, index) => ({
          rank: index + 1,
          name: rep.name,
          sales: Number(rep.monthlyRevenue),
          team: rep.team,
        })),
        lastUpdated: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error("Leaderboard error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      success: false,
      error: "Failed to fetch leaderboard",
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

// Get contests
router.get("/contests", async (req: Request, res: Response) => {
  try {
    const allContests = await db.select().from(contests).orderBy(desc(contests.startDate));
    res.json(allContests);
  } catch (error) {
    console.error("Contests fetch error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      error: "Failed to fetch contests",
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

// Get active contests
router.get("/contests/active", async (req: Request, res: Response) => {
  try {
    const activeContests = await db.select()
      .from(contests)
      .where(eq(contests.status, 'active'))
      .orderBy(desc(contests.startDate));
    res.json(activeContests);
  } catch (error) {
    console.error("Active contests fetch error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      error: "Failed to fetch active contests",
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

// Get contest leaderboard (participants with scores)
router.get("/contests/:id/leaderboard", async (req: Request, res: Response) => {
  try {
    const contestId = parseInt(req.params.id);

    // Get contest participants with sales rep details
    const participants = await db
      .select({
        id: contestParticipants.id,
        contestId: contestParticipants.contestId,
        salesRepId: contestParticipants.salesRepId,
        score: contestParticipants.score,
        rank: contestParticipants.rank,
        joinedAt: contestParticipants.joinedAt,
        name: salesReps.name,
        avatar: salesReps.avatar,
        team: salesReps.team,
      })
      .from(contestParticipants)
      .innerJoin(salesReps, eq(contestParticipants.salesRepId, salesReps.id))
      .where(eq(contestParticipants.contestId, contestId))
      .orderBy(desc(contestParticipants.score));

    // Add rank if not set
    const rankedParticipants = participants.map((p, index) => ({
      ...p,
      rank: p.rank || (index + 1),
      score: Number(p.score),
    }));

    res.json(rankedParticipants);
  } catch (error) {
    console.error("Contest leaderboard fetch error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      error: "Failed to fetch contest leaderboard",
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

// Create contest
router.post("/contests", async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const [newContest] = await db.insert(contests).values({
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
    }).returning();
    res.status(201).json(newContest);
  } catch (error) {
    console.error("Create contest error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      error: "Failed to create contest",
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

// Update contest
router.patch("/contests/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const data = req.body;
    if (data.startDate) data.startDate = new Date(data.startDate);
    if (data.endDate) data.endDate = new Date(data.endDate);

    const [updated] = await db.update(contests)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(contests.id, id))
      .returning();
    res.json(updated);
  } catch (error) {
    console.error("Update contest error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      error: "Failed to update contest",
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

// Calculate and finalize contest payout
router.post("/contests/:id/payout", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const [contest] = await db.select().from(contests).where(eq(contests.id, id)).limit(1);
    
    if (!contest) return res.status(404).json({ error: "Contest not found" });
    
    const participants = await db.select().from(contestParticipants).where(eq(contestParticipants.contestId, id));
    if (participants.length === 0) return res.status(400).json({ error: "No participants in this contest" });

    // Find winner
    participants.sort((a, b) => Number(b.score) - Number(a.score));
    const winner = participants[0];

    const [updated] = await db.update(contests)
      .set({
        status: 'completed',
        winnerId: winner.salesRepId,
        updatedAt: new Date()
      })
      .where(eq(contests.id, id))
      .returning();

    // Broadcast winner achievement
    const [winnerRep] = await db.select()
      .from(salesReps)
      .where(eq(salesReps.id, winner.salesRepId))
      .limit(1);

    if (winnerRep && winnerRep.userId) {
      const [winnerUser] = await db.select()
        .from(users)
        .where(eq(users.id, winnerRep.userId))
        .limit(1);

      const userName = winnerUser ? (winnerUser.username || winnerRep.name) : winnerRep.name;

      broadcastContestAchievement({
        userId: winnerRep.userId,
        userName,
        contestName: contest.title,
        placement: 1,
        prize: contest.prizes?.[0],
      });

      // Also broadcast for top 3 if they exist
      for (let i = 1; i < Math.min(3, participants.length); i++) {
        const participant = participants[i];
        const [rep] = await db.select().from(salesReps).where(eq(salesReps.id, participant.salesRepId)).limit(1);

        if (rep && rep.userId) {
          const [user] = await db.select(selectUserColumns()).from(users).where(eq(users.id, rep.userId)).limit(1);
          const name = user ? (user.username || rep.name) : rep.name;

          broadcastContestAchievement({
            userId: rep.userId,
            userName: name,
            contestName: contest.title,
            placement: i + 1,
          });
        }
      }
    }

    res.json({ success: true, contest: updated, winnerId: winner.salesRepId });
  } catch (error) {
    console.error("Contest payout error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      error: "Failed to process payout",
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

// Get user's sales stats
router.get("/my-stats", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId;
    // Find sales rep linked to user
    const [rep] = await db.select()
      .from(salesReps)
      .where(eq(salesReps.userId, userId));

    if (rep) {
      res.json({
        success: true,
        data: {
          rank: 1,
          totalSales: Number(rep.allTimeRevenue),
          monthSales: Number(rep.monthlyRevenue),
          weekSales: 0,
          bonusTier: rep.currentBonusTier,
          xp: 0,
        }
      });
    } else {
      res.json({
        success: true,
        data: { rank: 0, totalSales: 0, monthSales: 0, weekSales: 0, bonusTier: 0, xp: 0 }
      });
    }
  } catch (error) {
    console.error("Stats error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      success: false,
      error: "Failed to fetch stats",
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

// TV Display data
router.get("/tv-display", async (req: Request, res: Response) => {
  try {
    const reps = await db.select()
      .from(salesReps)
      .where(eq(salesReps.isActive, true))
      .orderBy(desc(salesReps.monthlyRevenue))
      .limit(10);

    res.json({
      success: true,
      data: {
        rankings: reps.map((rep, index) => ({
          rank: index + 1,
          name: rep.name,
          sales: Number(rep.monthlyRevenue),
          avatar: rep.avatar,
          team: rep.team,
        })),
        lastUpdated: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error("TV display error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      success: false,
      error: "Failed to fetch TV display data",
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

// Create player profile
router.post("/player-profiles", async (req: Request, res: Response) => {
  try {
    const { salesRepId } = req.body;

    if (!salesRepId) {
      return res.status(400).json({ error: "salesRepId is required" });
    }

    // Check if sales rep exists
    const [salesRep] = await db.select()
      .from(salesReps)
      .where(eq(salesReps.id, salesRepId))
      .limit(1);

    if (!salesRep) {
      return res.status(404).json({ error: "Sales rep not found" });
    }

    // Check if profile already exists
    const [existing] = await db.select()
      .from(playerProfiles)
      .where(eq(playerProfiles.salesRepId, salesRepId))
      .limit(1);

    if (existing) {
      return res.status(409).json({
        error: "Player profile already exists for this sales rep",
        profile: existing
      });
    }

    // Create new player profile with defaults
    const [newProfile] = await db.insert(playerProfiles)
      .values({
        salesRepId,
        playerLevel: 1,
        totalCareerPoints: 0,
        seasonPoints: 0,
        monthlyPoints: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: new Date().toISOString().split('T')[0],
      })
      .returning();

    res.status(201).json(newProfile);
  } catch (error) {
    console.error("Create player profile error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      error: "Failed to create player profile",
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

// Get player profile by sales rep ID
router.get("/player-profiles/:salesRepId", async (req: Request, res: Response) => {
  try {
    const salesRepId = parseInt(req.params.salesRepId);

    const [profile] = await db.select()
      .from(playerProfiles)
      .where(eq(playerProfiles.salesRepId, salesRepId))
      .limit(1);

    if (!profile) {
      return res.status(404).json({ error: "Player profile not found" });
    }

    res.json(profile);
  } catch (error) {
    console.error("Get player profile error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      error: "Failed to fetch player profile",
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

// Get full profile for a sales rep (history, badges, comparison)
router.get("/sales-reps/:id/full-profile", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { days = '30' } = req.query;
    const numDays = Math.min(Math.max(parseInt(days as string) || 30, 7), 90);

    // Get sales rep data
    const [salesRep] = await db.select()
      .from(salesReps)
      .where(eq(salesReps.id, id))
      .limit(1);

    if (!salesRep) {
      return res.status(404).json({ error: "Sales rep not found" });
    }

    // Get linked user if exists
    let linkedUser = null;
    if (salesRep.userId) {
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, salesRep.userId))
        .limit(1);
      linkedUser = user || null;
    }

    // Get player profile for gamification data
    const [playerProfile] = await db
      .select()
      .from(playerProfiles)
      .where(eq(playerProfiles.salesRepId, id));

    // Get leaderboard history (last N days)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - numDays);
    const startDateStr = startDate.toISOString().split('T')[0];

    const history = await db
      .select({
        id: leaderboardSnapshots.id,
        snapshotDate: leaderboardSnapshots.snapshotDate,
        rank: leaderboardSnapshots.rank,
        points: leaderboardSnapshots.points,
        monthlySignups: leaderboardSnapshots.monthlySignups,
        seasonId: leaderboardSnapshots.seasonId,
      })
      .from(leaderboardSnapshots)
      .where(
        and(
          eq(leaderboardSnapshots.salesRepId, id),
          gte(leaderboardSnapshots.snapshotDate, startDateStr)
        )
      )
      .orderBy(desc(leaderboardSnapshots.snapshotDate));

    // Get earned badges
    let earnedBadges: any[] = [];
    if (playerProfile) {
      earnedBadges = await db
        .select({
          id: badges.id,
          name: badges.name,
          description: badges.description,
          iconUrl: badges.iconUrl,
          category: badges.category,
          rarity: badges.rarity,
          earnedAt: playerBadges.earnedAt,
        })
        .from(playerBadges)
        .innerJoin(badges, eq(playerBadges.badgeId, badges.id))
        .where(eq(playerBadges.playerId, playerProfile.id))
        .orderBy(desc(playerBadges.earnedAt));
    }

    // Get all active reps for comparison
    const allReps = await db.select()
      .from(salesReps)
      .where(eq(salesReps.isActive, true));

    // Calculate current rank
    const sortedBySignups = [...allReps].sort(
      (a, b) => parseFloat(b.monthlySignups) - parseFloat(a.monthlySignups)
    );
    const currentRank = sortedBySignups.findIndex(r => r.id === id) + 1;

    // Team stats
    const teamReps = salesRep.team ? allReps.filter(r => r.team === salesRep.team) : [];
    const teamAvg = teamReps.length > 0 ? {
      signups: teamReps.reduce((sum, r) => sum + parseFloat(r.monthlySignups), 0) / teamReps.length,
      revenue: teamReps.reduce((sum, r) => sum + parseFloat(r.yearlyRevenue), 0) / teamReps.length,
    } : { signups: 0, revenue: 0 };

    // Top performer
    const topPerformer = sortedBySignups[0];

    // Calculate percentile
    const percentile = Math.round(((allReps.length - currentRank + 1) / allReps.length) * 100);

    // Calculate rank change from history
    let rankChange = 0;
    if (history.length >= 2) {
      const oldest = history[history.length - 1];
      const newest = history[0];
      rankChange = oldest.rank - newest.rank; // Positive = improved
    }

    res.json({
      rep: {
        ...salesRep,
        monthlyRevenue: Number(salesRep.monthlyRevenue),
        yearlyRevenue: Number(salesRep.yearlyRevenue),
        allTimeRevenue: Number(salesRep.allTimeRevenue),
        monthlySignups: salesRep.monthlySignups,
        yearlySignups: salesRep.yearlySignups,
        monthlySignupGoal: Number(salesRep.monthlySignupGoal),
        yearlyRevenueGoal: salesRep.yearlyRevenueGoal,
        goalProgress: salesRep.goalProgress,
        currentRank,
        totalPlayers: allReps.length,
      },
      user: linkedUser ? {
        id: linkedUser.id,
        username: linkedUser.username,
        role: linkedUser.role,
        displayName: linkedUser.firstName && linkedUser.lastName
          ? `${linkedUser.firstName} ${linkedUser.lastName}`
          : null,
        lastLoginAt: linkedUser.lastLoginAt,
        email: linkedUser.email,
      } : null,
      playerProfile: playerProfile ? {
        playerLevel: playerProfile.playerLevel,
        totalCareerPoints: playerProfile.totalCareerPoints,
        seasonPoints: playerProfile.seasonPoints,
        monthlyPoints: playerProfile.monthlyPoints,
        currentStreak: playerProfile.currentStreak,
        longestStreak: playerProfile.longestStreak,
      } : null,
      history,
      badges: earnedBadges,
      comparison: {
        teamAvg,
        topPerformer: topPerformer ? {
          name: topPerformer.name,
          signups: parseFloat(topPerformer.monthlySignups),
          revenue: parseFloat(topPerformer.yearlyRevenue),
        } : null,
        percentile,
        rankChange,
      },
    });
  } catch (error) {
    console.error('Error fetching full profile:', error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      error: "Failed to fetch full profile",
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

// ============================================================================
// POINTS & STREAKS SYSTEM
// ============================================================================

/**
 * Helper: Calculate points from sales activity
 * - Each signup = 100 points
 * - Each $1000 revenue = 50 points
 * - Bonus tier advancement = 500 points
 * - First place finish = 1000 points
 */
function calculatePointsFromActivity(activity: {
  signups?: number;
  revenue?: number;
  tierAdvancement?: boolean;
  firstPlaceFinish?: boolean;
}): number {
  let points = 0;

  if (activity.signups) {
    points += activity.signups * 100;
  }

  if (activity.revenue) {
    points += Math.floor(activity.revenue / 1000) * 50;
  }

  if (activity.tierAdvancement) {
    points += 500;
  }

  if (activity.firstPlaceFinish) {
    points += 1000;
  }

  return points;
}

/**
 * Helper: Calculate streak based on last activity date
 */
function calculateStreak(lastActivityDate: string | null, newActivityDate: string): {
  currentStreak: number;
  shouldReset: boolean;
  isConsecutive: boolean;
} {
  if (!lastActivityDate) {
    return { currentStreak: 1, shouldReset: false, isConsecutive: true };
  }

  const lastDate = new Date(lastActivityDate);
  const newDate = new Date(newActivityDate);

  // Reset time components for accurate day comparison
  lastDate.setHours(0, 0, 0, 0);
  newDate.setHours(0, 0, 0, 0);

  const diffTime = newDate.getTime() - lastDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Same day, no streak change
    return { currentStreak: 0, shouldReset: false, isConsecutive: false };
  } else if (diffDays === 1) {
    // Consecutive day, increment streak
    return { currentStreak: 1, shouldReset: false, isConsecutive: true };
  } else {
    // Gap > 1 day, reset streak
    return { currentStreak: 1, shouldReset: true, isConsecutive: false };
  }
}

/**
 * Award points to a player profile
 * POST /api/leaderboard/player-profiles/:id/award-points
 * Body: { points: number, reason: string, activity?: object }
 */
router.post("/player-profiles/:id/award-points", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { points, reason, activity } = req.body;

    if (!points || points < 0) {
      return res.status(400).json({ error: "Invalid points value" });
    }

    if (!reason) {
      return res.status(400).json({ error: "Reason is required" });
    }

    // Get current player profile
    const [profile] = await db
      .select()
      .from(playerProfiles)
      .where(eq(playerProfiles.id, id))
      .limit(1);

    if (!profile) {
      return res.status(404).json({ error: "Player profile not found" });
    }

    // Calculate points (from activity if provided, otherwise use direct points)
    let pointsToAward = points;
    if (activity) {
      pointsToAward = calculatePointsFromActivity(activity);
    }

    // Update all point fields
    const [updated] = await db
      .update(playerProfiles)
      .set({
        monthlyPoints: profile.monthlyPoints + pointsToAward,
        seasonPoints: profile.seasonPoints + pointsToAward,
        totalCareerPoints: profile.totalCareerPoints + pointsToAward,
        updatedAt: new Date(),
      })
      .where(eq(playerProfiles.id, id))
      .returning();

    res.json({
      success: true,
      pointsAwarded: pointsToAward,
      reason,
      profile: {
        monthlyPoints: updated.monthlyPoints,
        seasonPoints: updated.seasonPoints,
        totalCareerPoints: updated.totalCareerPoints,
      },
    });
  } catch (error) {
    console.error("Award points error:", error);
    res.status(500).json({ error: "Failed to award points" });
  }
});

/**
 * Record activity for a player (updates streak)
 * POST /api/leaderboard/player-profiles/:id/record-activity
 * Body: { activityDate?: string } (defaults to today)
 */
router.post("/player-profiles/:id/record-activity", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { activityDate } = req.body;

    const today = activityDate || new Date().toISOString().split('T')[0];

    // Get current player profile
    const [profile] = await db
      .select()
      .from(playerProfiles)
      .where(eq(playerProfiles.id, id))
      .limit(1);

    if (!profile) {
      return res.status(404).json({ error: "Player profile not found" });
    }

    // Calculate streak
    const streakCalc = calculateStreak(profile.lastActivityDate, today);

    let newCurrentStreak = profile.currentStreak;
    let newLongestStreak = profile.longestStreak;

    if (streakCalc.isConsecutive) {
      newCurrentStreak = profile.currentStreak + streakCalc.currentStreak;
    } else if (streakCalc.shouldReset) {
      newCurrentStreak = 1;
    }
    // If same day (streakCalc.currentStreak === 0), don't change streak

    // Update longest streak if current exceeds it
    if (newCurrentStreak > newLongestStreak) {
      newLongestStreak = newCurrentStreak;
    }

    // Update profile
    const [updated] = await db
      .update(playerProfiles)
      .set({
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        lastActivityDate: today,
        updatedAt: new Date(),
      })
      .where(eq(playerProfiles.id, id))
      .returning();

    res.json({
      success: true,
      activityRecorded: today,
      streakInfo: {
        wasConsecutive: streakCalc.isConsecutive,
        wasReset: streakCalc.shouldReset,
        currentStreak: updated.currentStreak,
        longestStreak: updated.longestStreak,
      },
    });
  } catch (error) {
    console.error("Record activity error:", error);
    res.status(500).json({ error: "Failed to record activity" });
  }
});

/**
 * Combined endpoint: Award points AND record activity in one call
 * POST /api/leaderboard/player-profiles/:id/update-performance
 * Body: { points: number, reason: string, activity?: object, recordActivity?: boolean }
 */
router.post("/player-profiles/:id/update-performance", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { points, reason, activity, recordActivity = true } = req.body;

    if (!points || points < 0) {
      return res.status(400).json({ error: "Invalid points value" });
    }

    if (!reason) {
      return res.status(400).json({ error: "Reason is required" });
    }

    // Get current player profile
    const [profile] = await db
      .select()
      .from(playerProfiles)
      .where(eq(playerProfiles.id, id))
      .limit(1);

    if (!profile) {
      return res.status(404).json({ error: "Player profile not found" });
    }

    // Calculate points
    let pointsToAward = points;
    if (activity) {
      pointsToAward = calculatePointsFromActivity(activity);
    }

    // Calculate streak if recording activity
    const today = new Date().toISOString().split('T')[0];
    let newCurrentStreak = profile.currentStreak;
    let newLongestStreak = profile.longestStreak;
    let streakInfo = null;

    if (recordActivity) {
      const streakCalc = calculateStreak(profile.lastActivityDate, today);

      if (streakCalc.isConsecutive) {
        newCurrentStreak = profile.currentStreak + streakCalc.currentStreak;
      } else if (streakCalc.shouldReset) {
        newCurrentStreak = 1;
      }

      if (newCurrentStreak > newLongestStreak) {
        newLongestStreak = newCurrentStreak;
      }

      streakInfo = {
        wasConsecutive: streakCalc.isConsecutive,
        wasReset: streakCalc.shouldReset,
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
      };
    }

    // Update profile with both points and streak
    const [updated] = await db
      .update(playerProfiles)
      .set({
        monthlyPoints: profile.monthlyPoints + pointsToAward,
        seasonPoints: profile.seasonPoints + pointsToAward,
        totalCareerPoints: profile.totalCareerPoints + pointsToAward,
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        lastActivityDate: recordActivity ? today : profile.lastActivityDate,
        updatedAt: new Date(),
      })
      .where(eq(playerProfiles.id, id))
      .returning();

    res.json({
      success: true,
      pointsAwarded: pointsToAward,
      reason,
      profile: {
        monthlyPoints: updated.monthlyPoints,
        seasonPoints: updated.seasonPoints,
        totalCareerPoints: updated.totalCareerPoints,
        currentStreak: updated.currentStreak,
        longestStreak: updated.longestStreak,
      },
      streakInfo,
    });
  } catch (error) {
    console.error("Update performance error:", error);
    res.status(500).json({ error: "Failed to update performance" });
  }
});

/**
 * Reset points for all players (monthly or seasonal)
 * POST /api/leaderboard/reset-points?type=monthly|seasonal
 * Use for cron jobs to reset at end of period
 */
router.post("/reset-points", async (req: Request, res: Response) => {
  try {
    const { type } = req.query;

    if (!type || (type !== 'monthly' && type !== 'seasonal')) {
      return res.status(400).json({ error: "Type must be 'monthly' or 'seasonal'" });
    }

    const updateData: any = { updatedAt: new Date() };

    if (type === 'monthly') {
      updateData.monthlyPoints = 0;
    } else if (type === 'seasonal') {
      updateData.seasonPoints = 0;
      updateData.monthlyPoints = 0; // Also reset monthly when resetting seasonal
    }

    // Update all player profiles
    const result = await db
      .update(playerProfiles)
      .set(updateData)
      .returning();

    res.json({
      success: true,
      type,
      playersUpdated: result.length,
      resetAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Reset points error:", error);
    res.status(500).json({ error: "Failed to reset points" });
  }
});

/**
 * Get player profile by sales rep ID
 * GET /api/leaderboard/player-profiles/by-rep/:salesRepId
 */
router.get("/player-profiles/by-rep/:salesRepId", async (req: Request, res: Response) => {
  try {
    const salesRepId = parseInt(req.params.salesRepId);

    const [profile] = await db
      .select()
      .from(playerProfiles)
      .where(eq(playerProfiles.salesRepId, salesRepId))
      .limit(1);

    if (!profile) {
      return res.status(404).json({ error: "Player profile not found" });
    }

    res.json(profile);
  } catch (error) {
    console.error("Get player profile error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      error: "Failed to fetch player profile",
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

/**
 * Create player profile for a sales rep
 * POST /api/leaderboard/player-profiles
 * Body: { salesRepId: number }
 */
router.post("/player-profiles", async (req: Request, res: Response) => {
  try {
    const { salesRepId } = req.body;

    if (!salesRepId) {
      return res.status(400).json({ error: "salesRepId is required" });
    }

    // Check if profile already exists
    const [existing] = await db
      .select()
      .from(playerProfiles)
      .where(eq(playerProfiles.salesRepId, salesRepId))
      .limit(1);

    if (existing) {
      return res.status(400).json({ error: "Player profile already exists for this sales rep" });
    }

    // Check if sales rep exists
    const [salesRep] = await db
      .select()
      .from(salesReps)
      .where(eq(salesReps.id, salesRepId))
      .limit(1);

    if (!salesRep) {
      return res.status(404).json({ error: "Sales rep not found" });
    }

    // Create new profile
    const [newProfile] = await db
      .insert(playerProfiles)
      .values({
        salesRepId,
        playerLevel: 1,
        totalCareerPoints: 0,
        seasonPoints: 0,
        monthlyPoints: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
      })
      .returning();

    res.status(201).json(newProfile);
  } catch (error) {
    console.error("Create player profile error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      error: "Failed to create player profile",
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

// ============================================
// MILESTONE DETECTION & BROADCASTING
// ============================================

// Update sales rep stats and detect milestones
router.post("/sales-reps/:id/update-stats", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;

    // Validate required fields
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: "Invalid update data" });
    }

    // Get current rep data (before update)
    const [currentRep] = await db.select()
      .from(salesReps)
      .where(eq(salesReps.id, id))
      .limit(1);

    if (!currentRep) {
      return res.status(404).json({ error: "Sales rep not found" });
    }

    // Get all reps to calculate old rank
    const allRepsBefore = await db.select()
      .from(salesReps)
      .where(eq(salesReps.isActive, true))
      .orderBy(desc(salesReps.monthlyRevenue));

    const oldRank = allRepsBefore.findIndex(r => r.id === id) + 1;

    // Update the sales rep
    const [updatedRep] = await db.update(salesReps)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(salesReps.id, id))
      .returning();

    // Get all reps to calculate new rank
    const allRepsAfter = await db.select()
      .from(salesReps)
      .where(eq(salesReps.isActive, true))
      .orderBy(desc(salesReps.monthlyRevenue));

    const newRank = allRepsAfter.findIndex(r => r.id === id) + 1;

    // Detect milestones
    const milestones = detectMilestones(
      {
        id: updatedRep.id,
        name: updatedRep.name,
        avatar: updatedRep.avatar,
        team: updatedRep.team,
        monthlyRevenue: updatedRep.monthlyRevenue,
        monthlySignups: updatedRep.monthlySignups,
        goalProgress: updatedRep.goalProgress,
        currentBonusTier: updatedRep.currentBonusTier,
      },
      {
        id: currentRep.id,
        name: currentRep.name,
        avatar: currentRep.avatar,
        team: currentRep.team,
        monthlyRevenue: currentRep.monthlyRevenue,
        monthlySignups: currentRep.monthlySignups,
        goalProgress: currentRep.goalProgress,
        currentBonusTier: currentRep.currentBonusTier,
      },
      newRank,
      oldRank
    );

    // Broadcast milestones via WebSocket
    if (milestones.length > 0) {
      console.log(`[Milestone] Detected ${milestones.length} milestone(s) for ${updatedRep.name}`);

      for (const milestone of milestones) {
        // Award badge for milestone
        await awardMilestoneBadge(id, milestone);

        // Broadcast achievement via WebSocket
        const achievement: any = {
          userId: updatedRep.userId || id,
          userName: updatedRep.name,
          achievementType: 'milestone',
          title: milestone.title,
          description: milestone.description,
          icon: milestone.emoji,
          timestamp: milestone.achievedAt,
          milestone, // Include full milestone data
        };

        // Broadcast to all connected clients
        if (wsHandlers?.leaderboard) {
          wsHandlers.leaderboard.celebrateAchievement(achievement);
          console.log(`[Milestone] Broadcasted achievement: ${milestone.title}`);
        }
      }
    }

    // Also broadcast leaderboard refresh
    if (wsHandlers?.leaderboard) {
      wsHandlers.leaderboard.broadcastLeaderboardRefresh(allRepsAfter);
    }

    res.json({
      success: true,
      rep: {
        ...updatedRep,
        monthlyRevenue: Number(updatedRep.monthlyRevenue),
        yearlyRevenue: Number(updatedRep.yearlyRevenue),
        allTimeRevenue: Number(updatedRep.allTimeRevenue),
        monthlySignups: Number(updatedRep.monthlySignups),
        yearlySignups: Number(updatedRep.yearlySignups),
        goalProgress: Number(updatedRep.goalProgress),
        monthlyGrowth: Number(updatedRep.monthlyGrowth),
        rank: newRank,
      },
      milestones: milestones.map(m => ({
        ...m,
        salesRep: {
          ...m.salesRep,
          monthlyRevenue: Number(m.salesRep.monthlyRevenue),
          monthlySignups: Number(m.salesRep.monthlySignups),
          goalProgress: Number(m.salesRep.goalProgress),
        }
      })),
      rankChange: oldRank - newRank, // Positive = improved
    });

  } catch (error) {
    console.error('[Milestone] Error updating sales rep stats:', error);
    res.status(500).json({ error: "Failed to update sales rep stats" });
  }
});

export default router;
