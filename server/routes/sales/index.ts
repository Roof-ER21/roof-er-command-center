import { Router, Request, Response } from "express";
import { requireAuth, requireModuleAccess } from "../../middleware/auth.js";
import { db } from "../../db.js";
import {
  salesPerformance,
  salesReps,
  users,
  playerProfiles,
  achievements,
  userAchievements,
} from "../../../shared/schema.js";
import { eq, desc, sql, and, gte } from "drizzle-orm";
import { wsHandlers } from "../../index.js";
import { selectUserColumns } from "../../utils/user-select.js";

const router = Router();

// Apply auth and leaderboard access middleware
router.use(requireAuth);
router.use(requireModuleAccess('leaderboard'));

// ============================================================================
// SALES PERFORMANCE ENDPOINTS
// ============================================================================

/**
 * GET /api/sales/performance
 * Get sales performance with filters (userId, month, year)
 */
router.get("/performance", async (req: Request, res: Response) => {
  try {
    const { userId, month, year } = req.query;

    let query = db.select().from(salesPerformance);

    const conditions = [];
    if (userId) conditions.push(eq(salesPerformance.userId, parseInt(userId as string)));
    if (month) conditions.push(eq(salesPerformance.month, parseInt(month as string)));
    if (year) conditions.push(eq(salesPerformance.year, parseInt(year as string)));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const results = await query.orderBy(desc(salesPerformance.createdAt));

    res.json({
      success: true,
      data: results.map(r => ({
        ...r,
        revenue: Number(r.revenue),
        target: Number(r.target),
        commission: Number(r.commission),
        commissionRate: Number(r.commissionRate),
      }))
    });
  } catch (error) {
    console.error("Get sales performance error:", error);
    res.status(500).json({ error: "Failed to fetch sales performance" });
  }
});

/**
 * POST /api/sales/performance
 * Log new sales performance entry
 */
router.post("/performance", async (req: Request, res: Response) => {
  try {
    const data = req.body;

    // Validate required fields
    if (!data.userId || !data.month || !data.year) {
      return res.status(400).json({ error: "userId, month, and year are required" });
    }

    // Calculate commission if revenue provided
    if (data.revenue && data.commissionRate) {
      data.commission = data.revenue * data.commissionRate;
    }

    const [newEntry] = await db.insert(salesPerformance).values({
      ...data,
      updatedAt: new Date(),
    }).returning();

    // Update leaderboard if sales rep linked
    if (data.salesRepId) {
      await updateLeaderboardFromSales(data.salesRepId, Number(data.revenue || 0));
    }

    res.status(201).json({
      success: true,
      data: {
        ...newEntry,
        revenue: Number(newEntry.revenue),
        target: Number(newEntry.target),
        commission: Number(newEntry.commission),
        commissionRate: Number(newEntry.commissionRate),
      }
    });
  } catch (error) {
    console.error("Create sales performance error:", error);
    res.status(500).json({ error: "Failed to create sales performance entry" });
  }
});

/**
 * PATCH /api/sales/performance/:id
 * Update performance entry
 */
router.patch("/performance/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const data = req.body;

    // Recalculate commission if revenue or rate changed
    if (data.revenue !== undefined || data.commissionRate !== undefined) {
      const [current] = await db.select().from(salesPerformance).where(eq(salesPerformance.id, id)).limit(1);
      if (current) {
        const revenue = data.revenue !== undefined ? data.revenue : current.revenue;
        const rate = data.commissionRate !== undefined ? data.commissionRate : current.commissionRate;
        data.commission = Number(revenue) * Number(rate);
      }
    }

    const [updated] = await db.update(salesPerformance)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(salesPerformance.id, id))
      .returning();

    // Update leaderboard if sales rep linked and revenue changed
    if (updated.salesRepId && data.revenue !== undefined) {
      await updateLeaderboardFromSales(updated.salesRepId, Number(updated.revenue || 0));
    }

    res.json({
      success: true,
      data: {
        ...updated,
        revenue: Number(updated.revenue),
        target: Number(updated.target),
        commission: Number(updated.commission),
        commissionRate: Number(updated.commissionRate),
      }
    });
  } catch (error) {
    console.error("Update sales performance error:", error);
    res.status(500).json({ error: "Failed to update sales performance entry" });
  }
});

/**
 * GET /api/sales/leaderboard
 * Get sales leaderboard (top performers by revenue)
 */
router.get("/leaderboard", async (req: Request, res: Response) => {
  try {
    const { month, year, limit = 10 } = req.query;
    const currentMonth = month ? parseInt(month as string) : new Date().getMonth() + 1;
    const currentYear = year ? parseInt(year as string) : new Date().getFullYear();

    // Get performance for current period grouped by user
    const performances = await db
      .select({
        userId: salesPerformance.userId,
        totalRevenue: sql<number>`SUM(${salesPerformance.revenue})`,
        totalDealsWon: sql<number>`SUM(${salesPerformance.dealsWon})`,
        totalCommission: sql<number>`SUM(${salesPerformance.commission})`,
      })
      .from(salesPerformance)
      .where(
        and(
          eq(salesPerformance.month, currentMonth),
          eq(salesPerformance.year, currentYear)
        )
      )
      .groupBy(salesPerformance.userId)
      .orderBy(desc(sql`SUM(${salesPerformance.revenue})`))
      .limit(parseInt(limit as string));

    // Get user details
    const userIds = performances.map(p => p.userId);
    const userDetails = await db
      .select()
      .from(users)
      .where(sql`${users.id} = ANY(${userIds})`);

    const leaderboard = performances.map((perf, index) => {
      const user = userDetails.find(u => u.id === perf.userId);
      return {
        rank: index + 1,
        userId: perf.userId,
        userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        avatar: user?.avatar || '👤',
        revenue: Number(perf.totalRevenue || 0),
        dealsWon: Number(perf.totalDealsWon || 0),
        commission: Number(perf.totalCommission || 0),
      };
    });

    res.json({
      success: true,
      data: leaderboard,
      period: { month: currentMonth, year: currentYear }
    });
  } catch (error) {
    console.error("Get sales leaderboard error:", error);
    res.status(500).json({ error: "Failed to fetch sales leaderboard" });
  }
});

/**
 * GET /api/sales/my-stats
 * Get current user's sales stats
 */
router.get("/my-stats", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId;
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    // Get this month's performance
    const [thisMonth] = await db
      .select({
        revenue: sql<number>`SUM(${salesPerformance.revenue})`,
        target: sql<number>`SUM(${salesPerformance.target})`,
        dealsWon: sql<number>`SUM(${salesPerformance.dealsWon})`,
        dealsPending: sql<number>`SUM(${salesPerformance.dealsPending})`,
        dealsLost: sql<number>`SUM(${salesPerformance.dealsLost})`,
        commission: sql<number>`SUM(${salesPerformance.commission})`,
      })
      .from(salesPerformance)
      .where(
        and(
          eq(salesPerformance.userId, userId),
          eq(salesPerformance.month, currentMonth),
          eq(salesPerformance.year, currentYear)
        )
      );

    // Get YTD performance
    const [ytd] = await db
      .select({
        revenue: sql<number>`SUM(${salesPerformance.revenue})`,
        dealsWon: sql<number>`SUM(${salesPerformance.dealsWon})`,
        commission: sql<number>`SUM(${salesPerformance.commission})`,
      })
      .from(salesPerformance)
      .where(
        and(
          eq(salesPerformance.userId, userId),
          eq(salesPerformance.year, currentYear)
        )
      );

    // Calculate rank
    const allPerformances = await db
      .select({
        userId: salesPerformance.userId,
        totalRevenue: sql<number>`SUM(${salesPerformance.revenue})`,
      })
      .from(salesPerformance)
      .where(
        and(
          eq(salesPerformance.month, currentMonth),
          eq(salesPerformance.year, currentYear)
        )
      )
      .groupBy(salesPerformance.userId)
      .orderBy(desc(sql`SUM(${salesPerformance.revenue})`));

    const rank = allPerformances.findIndex(p => p.userId === userId) + 1;

    res.json({
      success: true,
      data: {
        month: {
          revenue: Number(thisMonth?.revenue || 0),
          target: Number(thisMonth?.target || 0),
          dealsWon: Number(thisMonth?.dealsWon || 0),
          dealsPending: Number(thisMonth?.dealsPending || 0),
          dealsLost: Number(thisMonth?.dealsLost || 0),
          commission: Number(thisMonth?.commission || 0),
        },
        ytd: {
          revenue: Number(ytd?.revenue || 0),
          dealsWon: Number(ytd?.dealsWon || 0),
          commission: Number(ytd?.commission || 0),
        },
        rank: rank > 0 ? rank : null,
        totalParticipants: allPerformances.length,
      }
    });
  } catch (error) {
    console.error("Get my stats error:", error);
    res.status(500).json({ error: "Failed to fetch your sales stats" });
  }
});

/**
 * POST /api/sales/log-deal
 * Quick log a deal (won/lost/pending)
 */
router.post("/log-deal", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId;
    const { status, revenue, notes } = req.body;

    if (!status || !['won', 'lost', 'pending'].includes(status)) {
      return res.status(400).json({ error: "Valid status required (won/lost/pending)" });
    }

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    // Get or create this month's performance entry
    const [existing] = await db
      .select()
      .from(salesPerformance)
      .where(
        and(
          eq(salesPerformance.userId, userId),
          eq(salesPerformance.month, currentMonth),
          eq(salesPerformance.year, currentYear)
        )
      )
      .limit(1);

    const dealRevenue = Number(revenue || 0);

    if (existing) {
      // Update existing entry
      const updates: any = { updatedAt: new Date() };

      if (status === 'won') {
        updates.dealsWon = existing.dealsWon! + 1;
        updates.revenue = Number(existing.revenue) + dealRevenue;
        // Recalculate commission
        updates.commission = Number(existing.commission) + (dealRevenue * Number(existing.commissionRate));
      } else if (status === 'lost') {
        updates.dealsLost = existing.dealsLost! + 1;
      } else if (status === 'pending') {
        updates.dealsPending = existing.dealsPending! + 1;
      }

      if (notes) {
        updates.notes = existing.notes ? `${existing.notes}\n${notes}` : notes;
      }

      const [updated] = await db
        .update(salesPerformance)
        .set(updates)
        .where(eq(salesPerformance.id, existing.id))
        .returning();

      // Check for achievements
      if (status === 'won') {
        await checkSalesAchievements(userId, {
          monthlyRevenue: Number(updated.revenue),
          dealsWon: updated.dealsWon!,
        });
      }

      // Update leaderboard if sales rep linked
      if (updated.salesRepId) {
        await updateLeaderboardFromSales(updated.salesRepId, Number(updated.revenue));
      }

      res.json({
        success: true,
        message: `Deal ${status} logged successfully`,
        data: {
          ...updated,
          revenue: Number(updated.revenue),
          commission: Number(updated.commission),
        }
      });
    } else {
      // Create new entry
      const newData: any = {
        userId,
        month: currentMonth,
        year: currentYear,
        dealsWon: status === 'won' ? 1 : 0,
        dealsLost: status === 'lost' ? 1 : 0,
        dealsPending: status === 'pending' ? 1 : 0,
        revenue: status === 'won' ? dealRevenue : 0,
        commission: status === 'won' ? dealRevenue * 0.1 : 0, // Default 10%
        commissionRate: 0.1,
        notes,
      };

      const [created] = await db.insert(salesPerformance).values(newData).returning();

      // Check for first deal achievement
      if (status === 'won') {
        await checkSalesAchievements(userId, {
          monthlyRevenue: dealRevenue,
          dealsWon: 1,
        });
      }

      res.status(201).json({
        success: true,
        message: `Deal ${status} logged successfully`,
        data: {
          ...created,
          revenue: Number(created.revenue),
          commission: Number(created.commission),
        }
      });
    }
  } catch (error) {
    console.error("Log deal error:", error);
    res.status(500).json({ error: "Failed to log deal" });
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Update leaderboard points from sales
 */
async function updateLeaderboardFromSales(salesRepId: number, monthlyRevenue: number) {
  try {
    // Update sales rep monthly revenue
    await db.update(salesReps)
      .set({
        monthlyRevenue: monthlyRevenue.toString(),
        updatedAt: new Date(),
      })
      .where(eq(salesReps.id, salesRepId));

    // Update player profile points (10 points per $1000 revenue)
    const [profile] = await db
      .select()
      .from(playerProfiles)
      .where(eq(playerProfiles.salesRepId, salesRepId))
      .limit(1);

    if (profile) {
      const salesPoints = Math.floor(monthlyRevenue / 1000) * 10;

      await db.update(playerProfiles)
        .set({
          monthlyPoints: profile.monthlyPoints + salesPoints,
          seasonPoints: profile.seasonPoints + salesPoints,
          totalCareerPoints: profile.totalCareerPoints + salesPoints,
          updatedAt: new Date(),
        })
        .where(eq(playerProfiles.id, profile.id));
    }

    // Broadcast leaderboard update
    if (wsHandlers?.leaderboard) {
      const allReps = await db.select().from(salesReps).where(eq(salesReps.isActive, true));
      wsHandlers.leaderboard.broadcastLeaderboardRefresh(allReps);
    }
  } catch (error) {
    console.error("Update leaderboard from sales error:", error);
  }
}

/**
 * Check and award sales achievements
 */
async function checkSalesAchievements(userId: number, stats: { monthlyRevenue: number; dealsWon: number }) {
  try {
    const achievementsToAward = [];

    // First Deal achievement
    if (stats.dealsWon === 1) {
      achievementsToAward.push('first_deal');
    }

    // Revenue milestones
    if (stats.monthlyRevenue >= 10000 && stats.monthlyRevenue < 50000) {
      achievementsToAward.push('10k_club');
    } else if (stats.monthlyRevenue >= 50000) {
      achievementsToAward.push('50k_club');
    }

    // Deal count milestones
    if (stats.dealsWon >= 10) {
      achievementsToAward.push('closer');
    }

    // Award achievements
    for (const achievementName of achievementsToAward) {
      const [achievement] = await db
        .select()
        .from(achievements)
        .where(eq(achievements.name, achievementName))
        .limit(1);

      if (achievement) {
        // Check if already awarded
        const [existing] = await db
          .select()
          .from(userAchievements)
          .where(
            and(
              eq(userAchievements.userId, userId),
              eq(userAchievements.achievementId, achievement.id)
            )
          )
          .limit(1);

        if (!existing) {
          await db.insert(userAchievements).values({
            userId,
            achievementId: achievement.id,
          });

          // Broadcast achievement
          if (wsHandlers?.leaderboard) {
            const [user] = await db.select(selectUserColumns()).from(users).where(eq(users.id, userId)).limit(1);
            wsHandlers.leaderboard.celebrateAchievement({
              userId,
              userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
              achievementType: 'sales',
              title: achievement.name,
              description: achievement.description,
              icon: achievement.icon,
              timestamp: new Date().toISOString(),
            });
          }
        }
      }
    }
  } catch (error) {
    console.error("Check sales achievements error:", error);
  }
}

export default router;
