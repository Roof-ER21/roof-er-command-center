import { Router, Request, Response } from "express";
import { requireAuth, requireModuleAccess } from "../../middleware/auth.js";
import { db } from "../../db.js";
import { users, ptoRequests, candidates, equipment } from "../../../shared/schema.js";
import { eq, desc, and, sql } from "drizzle-orm";

const router = Router();

// Apply auth and module access middleware to all HR routes
router.use(requireAuth);
router.use(requireModuleAccess('hr'));

// Get HR dashboard metrics
router.get("/dashboard/metrics", async (req: Request, res: Response) => {
  try {
    // Get counts from database
    const [employeeCount] = await db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.isActive, true));

    const [pendingPtoCount] = await db.select({ count: sql<number>`count(*)` })
      .from(ptoRequests)
      .where(eq(ptoRequests.status, 'PENDING'));

    const [activeCandidateCount] = await db.select({ count: sql<number>`count(*)` })
      .from(candidates)
      .where(sql`${candidates.status} NOT IN ('rejected', 'hired')`);

    res.json({
      totalEmployees: Number(employeeCount?.count || 0),
      pendingPTO: Number(pendingPtoCount?.count || 0),
      openPositions: Number(activeCandidateCount?.count || 0),
      recentHires: 0,
      teamRevenue: 0,
      teamSignups: 0,
    });
  } catch (error) {
    console.error("HR metrics error:", error);
    res.json({
      totalEmployees: 0,
      pendingPTO: 0,
      openPositions: 0,
      recentHires: 0,
      teamRevenue: 0,
      teamSignups: 0,
    });
  }
});

// Get employees list
router.get("/employees", async (req: Request, res: Response) => {
  try {
    const allUsers = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      department: users.department,
      position: users.position,
      phone: users.phone,
      hireDate: users.hireDate,
      isActive: users.isActive,
      avatar: users.avatar,
    })
    .from(users)
    .where(eq(users.isActive, true))
    .orderBy(users.lastName);

    res.json(allUsers);
  } catch (error) {
    console.error("Employees fetch error:", error);
    res.json([]);
  }
});

// Get single employee
router.get("/employees/:id", async (req: Request, res: Response) => {
  try {
    const [employee] = await db.select()
      .from(users)
      .where(eq(users.id, parseInt(req.params.id)));

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const { passwordHash, pinHash, ...safeEmployee } = employee;
    res.json(safeEmployee);
  } catch (error) {
    console.error("Employee fetch error:", error);
    res.status(500).json({ error: "Failed to fetch employee" });
  }
});

// Get PTO requests
router.get("/pto", async (req: Request, res: Response) => {
  try {
    const requests = await db.select({
      id: ptoRequests.id,
      employeeId: ptoRequests.employeeId,
      startDate: ptoRequests.startDate,
      endDate: ptoRequests.endDate,
      days: ptoRequests.days,
      type: ptoRequests.type,
      reason: ptoRequests.reason,
      status: ptoRequests.status,
      createdAt: ptoRequests.createdAt,
    })
    .from(ptoRequests)
    .orderBy(desc(ptoRequests.createdAt));

    // Transform status to lowercase for frontend
    const formattedRequests = requests.map(r => ({
      ...r,
      status: r.status?.toLowerCase() || 'pending'
    }));

    res.json(formattedRequests);
  } catch (error) {
    console.error("PTO fetch error:", error);
    res.json([]);
  }
});

// Get candidates
router.get("/candidates", async (req: Request, res: Response) => {
  try {
    const allCandidates = await db.select()
      .from(candidates)
      .orderBy(desc(candidates.createdAt));

    res.json(allCandidates);
  } catch (error) {
    console.error("Candidates fetch error:", error);
    res.json([]);
  }
});

// Create employee
router.post("/employees", async (req: Request, res: Response) => {
  try {
    const { email, firstName, lastName, role, department, position, phone } = req.body;

    const [newUser] = await db.insert(users).values({
      email,
      firstName,
      lastName,
      role: role || 'EMPLOYEE',
      department,
      position,
      phone,
      hasHRAccess: false,
      hasLeaderboardAccess: false,
      hasTrainingAccess: true,
      hasFieldAccess: false,
    }).returning();

    const { passwordHash, pinHash, ...safeUser } = newUser;
    res.status(201).json(safeUser);
  } catch (error) {
    console.error("Create employee error:", error);
    res.status(500).json({ error: "Failed to create employee" });
  }
});

// Update employee
router.patch("/employees/:id", async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, role, department, position, phone, email } = req.body;

    const [updated] = await db.update(users)
      .set({
        firstName,
        lastName,
        role,
        department,
        position,
        phone,
        email,
        updatedAt: new Date(),
      })
      .where(eq(users.id, parseInt(req.params.id)))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const { passwordHash, pinHash, ...safeUser } = updated;
    res.json(safeUser);
  } catch (error) {
    console.error("Update employee error:", error);
    res.status(500).json({ error: "Failed to update employee" });
  }
});

// Delete employee (soft delete)
router.delete("/employees/:id", async (req: Request, res: Response) => {
  try {
    await db.update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, parseInt(req.params.id)));

    res.json({ success: true });
  } catch (error) {
    console.error("Delete employee error:", error);
    res.status(500).json({ error: "Failed to delete employee" });
  }
});

export default router;
