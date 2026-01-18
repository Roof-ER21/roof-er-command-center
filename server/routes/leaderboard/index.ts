import { Router, Request, Response } from "express";
import { requireAuth, requireModuleAccess } from "../../middleware/auth.js";
import { db } from "../../db.js";
import { salesReps, teams, territories, contests, contestParticipants } from "../../../shared/schema.js";
import { eq, desc, sql, asc } from "drizzle-orm";

const router = Router();

// Apply auth and module access middleware
router.use(requireAuth);
router.use(requireModuleAccess('leaderboard'));

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
    res.json({
      totalReps: 0,
      activeContests: 0,
      totalMonthlyRevenue: 0,
      totalYearlyRevenue: 0,
      averageMonthlyRevenue: 0,
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
    res.json([]);
  }
});

// Get teams
router.get("/teams", async (req: Request, res: Response) => {
  try {
    const allTeams = await db.select().from(teams).where(eq(teams.isActive, true));
    res.json(allTeams);
  } catch (error) {
    console.error("Teams fetch error:", error);
    res.json([]);
  }
});

// Get territories
router.get("/territories", async (req: Request, res: Response) => {
  try {
    const allTerritories = await db.select().from(territories).where(eq(territories.isActive, true));
    res.json(allTerritories);
  } catch (error) {
    console.error("Territories fetch error:", error);
    res.json([]);
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
    res.status(500).json({ success: false, error: "Failed to fetch leaderboard" });
  }
});

// Get contests
router.get("/contests", async (req: Request, res: Response) => {
  try {
    const allContests = await db.select().from(contests).orderBy(desc(contests.startDate));
    res.json(allContests);
  } catch (error) {
    console.error("Contests fetch error:", error);
    res.json([]);
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
    res.json([]);
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
    res.status(500).json({ success: false, error: "Failed to fetch stats" });
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
    res.status(500).json({ success: false, error: "Failed to fetch TV display data" });
  }
});

export default router;
