import { Router } from "express";
import { db } from "../../db";
import { ptoRequests, users } from "../../../shared/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

const router = Router();

router.get("/overview", async (req, res) => {
  try {
    const allRequests = await db.select().from(ptoRequests);
    const approvedRequests = allRequests.filter(r => r.status === "APPROVED");
    
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    
    const usedThisYear = approvedRequests.filter(r => new Date(r.startDate) >= yearStart).reduce((sum, r) => sum + Number(r.days), 0);
    
    // Simple grouped stats
    const byType = approvedRequests.reduce((acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + Number(r.days);
      return acc;
    }, {} as Record<string, number>);

    res.json({
      totalUsedDays: usedThisYear,
      byType,
      requestCount: allRequests.length,
      pendingCount: allRequests.filter(r => r.status === "PENDING").length
    });
  } catch (error) {
    console.error("PTO analytics overview error:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

router.get("/usage", async (req, res) => {
  try {
    const approvedRequests = await db.select().from(ptoRequests).where(eq(ptoRequests.status, "APPROVED"));
    const allUsers = await db.select().from(users);
    
    const usageByEmployee = approvedRequests.reduce((acc, r) => {
      const user = allUsers.find(u => u.id === r.employeeId);
      const name = user ? `${user.firstName} ${user.lastName}` : "Unknown";
      if (!acc[name]) acc[name] = 0;
      acc[name] += Number(r.days);
      return acc;
    }, {} as Record<string, number>);

    const sortedUsage = Object.entries(usageByEmployee)
      .map(([name, days]) => ({ name, days }))
      .sort((a, b) => b.days - a.days);

    res.json(sortedUsage);
  } catch (error) {
    console.error("PTO usage error:", error);
    res.status(500).json({ error: "Failed to fetch usage" });
  }
});

export default router;
