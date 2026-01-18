import { Router } from "express";
import { z } from "zod";
import { db } from "../../db";
import {
  candidates,
  interviews,
  users,
  hrAssignments,
} from "../../../shared/schema";
import { eq, and, desc, sql, inArray, gte, lte } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";

const router = Router();

// Validation schema for date range query parameters
const dateRangeSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  period: z.enum(["7d", "30d", "90d", "year", "all"]).optional(),
  assigneeId: z.string().optional(),
});

// Helper to calculate date range
function getDateRange(period?: string, startDate?: string, endDate?: string) {
  const now = new Date();
  let start = new Date();
  const end = endDate ? new Date(endDate) : now;

  if (startDate) {
    start = new Date(startDate);
  } else {
    switch (period) {
      case "7d":
        start.setDate(now.getDate() - 7);
        break;
      case "30d":
        start.setDate(now.getDate() - 30);
        break;
      case "90d":
        start.setDate(now.getDate() - 90);
        break;
      case "year":
        start.setFullYear(now.getFullYear() - 1);
        break;
      case "all":
        start = new Date("2020-01-01");
        break;
      default:
        start.setDate(now.getDate() - 30);
    }
  }

  return { start, end };
}

// GET /overview
router.get("/overview", async (req, res) => {
  try {
    const { period, startDate, endDate, assigneeId } = dateRangeSchema.parse(req.query);
    const { start, end } = getDateRange(period, startDate, endDate);

    // Build filters
    const filters = [
      gte(candidates.createdAt, start),
      lte(candidates.createdAt, end),
    ];

    if (assigneeId && assigneeId !== "all" && assigneeId !== "unassigned") {
      filters.push(eq(candidates.assignedTo, parseInt(assigneeId)));
    } else if (assigneeId === "unassigned") {
      filters.push(sql`${candidates.assignedTo} IS NULL`);
    }

    const filteredCandidates = await db.select().from(candidates).where(and(...filters));

    // Calculate metrics
    const totalCandidates = filteredCandidates.length;
    const activePipeline = filteredCandidates.filter((c) =>
      !["hired", "rejected"].includes(c.status)
    ).length;

    // Hired this month
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const allHired = await db.select().from(candidates).where(eq(candidates.status, "hired"));

    const hiredThisMonth = allHired.filter((c) => 
      new Date(c.updatedAt) >= thisMonthStart
    ).length;

    const hiredLastMonth = allHired.filter((c) => 
      new Date(c.updatedAt) >= lastMonthStart && new Date(c.updatedAt) <= lastMonthEnd
    ).length;

    // Avg days to hire
    const hiredInRange = filteredCandidates.filter(c => c.status === "hired");
    let avgDaysToHire = 0;
    if (hiredInRange.length > 0) {
      const totalDays = hiredInRange.reduce((sum, c) => {
        const diff = new Date(c.updatedAt).getTime() - new Date(c.createdAt).getTime();
        return sum + Math.ceil(diff / (1000 * 60 * 60 * 24));
      }, 0);
      avgDaysToHire = Math.round(totalDays / hiredInRange.length);
    }

    res.json({
      totalCandidates,
      activePipeline,
      hiredThisMonth,
      hiredLastMonth,
      avgDaysToHire,
      period: period || "30d",
    });
  } catch (error) {
    console.error("Analytics overview error:", error);
    res.status(500).json({ error: "Failed to fetch overview" });
  }
});

// GET /pipeline
router.get("/pipeline", async (req, res) => {
  try {
    const { period, startDate, endDate, assigneeId } = dateRangeSchema.parse(req.query);
    const { start, end } = getDateRange(period, startDate, endDate);

    const filters = [
      gte(candidates.createdAt, start),
      lte(candidates.createdAt, end),
    ];

    if (assigneeId && assigneeId !== "all" && assigneeId !== "unassigned") {
      filters.push(eq(candidates.assignedTo, parseInt(assigneeId)));
    } else if (assigneeId === "unassigned") {
      filters.push(sql`${candidates.assignedTo} IS NULL`);
    }

    const filteredCandidates = await db.select().from(candidates).where(and(...filters));
    const total = filteredCandidates.length || 1;

    const stages = {
      applied: filteredCandidates.filter(c => c.status === "new").length,
      screening: filteredCandidates.filter(c => c.status === "screening").length,
      interview: filteredCandidates.filter(c => c.status === "interview").length,
      offer: filteredCandidates.filter(c => c.status === "offer").length,
      hired: filteredCandidates.filter(c => c.status === "hired").length,
      dead: filteredCandidates.filter(c => c.status === "rejected").length, // Assuming rejected is dead
    };

    res.json({
      stages: {
        applied: { count: stages.applied, percentage: Math.round((stages.applied / total) * 100) },
        screening: { count: stages.screening, percentage: Math.round((stages.screening / total) * 100) },
        interview: { count: stages.interview, percentage: Math.round((stages.interview / total) * 100) },
        offer: { count: stages.offer, percentage: Math.round((stages.offer / total) * 100) },
        hired: { count: stages.hired, percentage: Math.round((stages.hired / total) * 100) },
        dead: { count: stages.dead },
      },
      total: filteredCandidates.length,
    });
  } catch (error) {
    console.error("Analytics pipeline error:", error);
    res.status(500).json({ error: "Failed to fetch pipeline" });
  }
});

// GET /recruiters
router.get("/recruiters", async (req, res) => {
  try {
    const { period, startDate, endDate, assigneeId } = dateRangeSchema.parse(req.query);
    const { start, end } = getDateRange(period, startDate, endDate);

    const filters = [
      gte(candidates.createdAt, start),
      lte(candidates.createdAt, end),
    ];

    const filteredCandidates = await db.select().from(candidates).where(and(...filters));
    const allUsers = await db.select().from(users);

    const assigneeMap = new Map<number | null, { assigned: number; hired: number; totalDays: number }>();

    filteredCandidates.forEach(c => {
      const aid = c.assignedTo;
      if (!assigneeMap.has(aid)) {
        assigneeMap.set(aid, { assigned: 0, hired: 0, totalDays: 0 });
      }
      const data = assigneeMap.get(aid)!;
      data.assigned++;
      if (c.status === "hired") {
        data.hired++;
        // Calculate days to hire logic here if needed
      }
    });

    const recruiters = [];
    for (const [aid, data] of assigneeMap.entries()) {
      if (aid === null) {
        recruiters.push({
          id: "unassigned",
          name: "Unassigned",
          candidatesAssigned: data.assigned,
          hiredCount: data.hired,
          hireRate: data.assigned > 0 ? Math.round((data.hired / data.assigned) * 100) : 0,
        });
      } else {
        const user = allUsers.find(u => u.id === aid);
        if (user) {
          recruiters.push({
            id: user.id.toString(),
            name: `${user.firstName} ${user.lastName}`,
            candidatesAssigned: data.assigned,
            hiredCount: data.hired,
            hireRate: data.assigned > 0 ? Math.round((data.hired / data.assigned) * 100) : 0,
          });
        }
      }
    }

    recruiters.sort((a, b) => b.candidatesAssigned - a.candidatesAssigned);

    res.json({ recruiters });
  } catch (error) {
    console.error("Analytics recruiters error:", error);
    res.status(500).json({ error: "Failed to fetch recruiters" });
  }
});

// GET /time-to-hire (Simple version)
router.get("/time-to-hire", async (req, res) => {
  try {
    const { period, startDate, endDate } = dateRangeSchema.parse(req.query);
    const { start, end } = getDateRange(period, startDate, endDate);

    const hiredCandidates = await db.select().from(candidates)
      .where(and(
        eq(candidates.status, "hired"),
        gte(candidates.updatedAt, start),
        lte(candidates.updatedAt, end)
      ));

    // Group by week
    const trendMap = new Map<string, { totalDays: number; count: number }>();
    
    hiredCandidates.forEach(c => {
      const diff = new Date(c.updatedAt).getTime() - new Date(c.createdAt).getTime();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      
      const date = new Date(c.updatedAt);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`; // Simplified for now
      
      if (!trendMap.has(key)) trendMap.set(key, { totalDays: 0, count: 0 });
      const data = trendMap.get(key)!;
      data.totalDays += days;
      data.count++;
    });

    const trend = Array.from(trendMap.entries()).map(([date, data]) => ({
      date,
      avgDays: Math.round(data.totalDays / data.count),
      hireCount: data.count
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    res.json({ trend, current: 0, previous: 0, change: 0 }); // Simplified
  } catch (error) {
    console.error("Analytics time-to-hire error:", error);
    res.status(500).json({ error: "Failed to fetch time-to-hire" });
  }
});

// GET /interviews (Simple version)
router.get("/interviews", async (req, res) => {
  try {
    const { period, startDate, endDate } = dateRangeSchema.parse(req.query);
    const { start, end } = getDateRange(period, startDate, endDate);

    const allInterviews = await db.select().from(interviews)
      .where(and(
        gte(interviews.scheduledAt, start),
        lte(interviews.scheduledAt, end)
      ));

    const byStatus = {
      scheduled: allInterviews.filter(i => i.status === "scheduled").length,
      completed: allInterviews.filter(i => i.status === "completed").length,
      cancelled: allInterviews.filter(i => i.status === "cancelled").length,
      noShow: allInterviews.filter(i => i.status === "no_show").length,
    };

    const byType = {
      phone: allInterviews.filter(i => i.type === "phone").length,
      video: allInterviews.filter(i => i.type === "video").length,
      inPerson: allInterviews.filter(i => i.type === "in_person").length,
      panel: allInterviews.filter(i => i.type === "panel").length,
    };

    res.json({
      total: allInterviews.length,
      byStatus,
      byType,
      completionRate: allInterviews.length > 0 ? Math.round((byStatus.completed / allInterviews.length) * 100) : 0,
    });
  } catch (error) {
    console.error("Analytics interviews error:", error);
    res.status(500).json({ error: "Failed to fetch interviews" });
  }
});

// GET /export/csv
router.get("/export/csv", async (req, res) => {
  try {
    const { type } = req.query; // 'current', 'archived', 'all'
    
    let filters = [];
    if (type === "current") {
      filters.push(eq(candidates.isArchived, false));
    } else if (type === "archived") {
      filters.push(eq(candidates.isArchived, true));
    }
    
    const data = await db.select().from(candidates).where(and(...filters));
    
    // Simple CSV generation
    const headers = ["ID", "First Name", "Last Name", "Email", "Position", "Status", "Source", "Rating", "Created At"];
    const rows = data.map(c => [
      c.id,
      c.firstName,
      c.lastName,
      c.email,
      c.position,
      c.status,
      c.source || "",
      c.rating || "",
      c.createdAt ? new Date(c.createdAt).toISOString() : ""
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="candidates-${type || 'all'}.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error("Export CSV error:", error);
    res.status(500).json({ error: "Failed to export CSV" });
  }
});

export default router;
