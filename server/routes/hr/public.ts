import { Router, Request, Response } from "express";
import { db } from "../../db.js";
import { contracts, contractTokens, equipment, equipmentSignatureTokens, users } from "../../../shared/schema.js";
import { eq, and, sql } from "drizzle-orm";

const router = Router();

// ============================================================================
// PUBLIC EMPLOYEE DIRECTORY (NO AUTH REQUIRED)
// ============================================================================

// GET /api/public/directory - List all public employees
router.get("/directory", async (req: Request, res: Response) => {
  try {
    const { department, search } = req.query;

    let query = db
      .select({
        id: users.id,
        slug: users.slug,
        firstName: users.firstName,
        lastName: users.lastName,
        position: users.position,
        department: users.department,
        avatar: users.avatar,
        publicBio: users.publicBio,
      })
      .from(users)
      .where(
        and(
          eq(users.isPublicProfile, true),
          eq(users.isActive, true)
        )
      );

    // Apply filters
    if (department && typeof department === 'string') {
      query = query.where(
        and(
          eq(users.isPublicProfile, true),
          eq(users.isActive, true),
          eq(users.department, department)
        )
      );
    }

    let employees = await query;

    // Apply search filter if provided
    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase();
      employees = employees.filter(emp =>
        emp.firstName.toLowerCase().includes(searchLower) ||
        emp.lastName.toLowerCase().includes(searchLower) ||
        (emp.position && emp.position.toLowerCase().includes(searchLower)) ||
        (emp.department && emp.department.toLowerCase().includes(searchLower))
      );
    }

    res.json(employees);
  } catch (error) {
    console.error("Public directory fetch error:", error);
    res.status(500).json({ error: "Directory lookup failed" });
  }
});

// GET /api/public/employees/:slug - Get single employee public profile
router.get("/employees/:slug", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const [employee] = await db
      .select({
        id: users.id,
        slug: users.slug,
        firstName: users.firstName,
        lastName: users.lastName,
        position: users.position,
        department: users.department,
        avatar: users.avatar,
        publicBio: users.publicBio,
        publicPhone: users.publicPhone,
        publicEmail: users.publicEmail,
      })
      .from(users)
      .where(
        and(
          eq(users.slug, slug),
          eq(users.isPublicProfile, true),
          eq(users.isActive, true)
        )
      );

    if (!employee) {
      return res.status(404).json({ error: "Employee profile not found" });
    }

    res.json(employee);
  } catch (error) {
    console.error("Public employee profile fetch error:", error);
    res.status(500).json({ error: "Profile lookup failed" });
  }
});

// GET /api/public/team/:department - Get team members by department
router.get("/team/:department", async (req: Request, res: Response) => {
  try {
    const { department } = req.params;

    const employees = await db
      .select({
        id: users.id,
        slug: users.slug,
        firstName: users.firstName,
        lastName: users.lastName,
        position: users.position,
        department: users.department,
        avatar: users.avatar,
        publicBio: users.publicBio,
      })
      .from(users)
      .where(
        and(
          eq(users.department, department),
          eq(users.isPublicProfile, true),
          eq(users.isActive, true)
        )
      );

    res.json(employees);
  } catch (error) {
    console.error("Public team fetch error:", error);
    res.status(500).json({ error: "Team lookup failed" });
  }
});

// GET /api/public/departments - Get list of departments with public employees
router.get("/departments", async (req: Request, res: Response) => {
  try {
    const result = await db
      .select({
        department: users.department,
        count: sql<number>`count(*)::int`,
      })
      .from(users)
      .where(
        and(
          eq(users.isPublicProfile, true),
          eq(users.isActive, true),
          sql`${users.department} IS NOT NULL`
        )
      )
      .groupBy(users.department);

    res.json(result);
  } catch (error) {
    console.error("Public departments fetch error:", error);
    res.status(500).json({ error: "Departments lookup failed" });
  }
});

// Public contract lookup
router.get("/contracts/:token", async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const [tokenRecord] = await db.select().from(contractTokens).where(eq(contractTokens.token, token));
    if (!tokenRecord) {
      return res.status(404).json({ error: "Invalid or expired contract link" });
    }

    const [contract] = await db.select().from(contracts).where(eq(contracts.id, tokenRecord.contractId));
    if (!contract) {
      return res.status(404).json({ error: "Contract not found" });
    }

    res.json({
      id: contract.id,
      title: contract.title,
      content: contract.content,
      status: contract.status,
    });
  } catch (error) {
    console.error("Public contract fetch error:", error);
    res.status(500).json({ error: "Contract lookup failed" });
  }
});

router.post("/contracts/:token/sign", async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { signature, signerName } = req.body;

    const [tokenRecord] = await db.select().from(contractTokens).where(eq(contractTokens.token, token));
    if (!tokenRecord) {
      return res.status(404).json({ error: "Invalid or expired contract link" });
    }

    const [updated] = await db.update(contracts)
      .set({
        status: "SIGNED",
        signedDate: new Date(),
        signature: signature || signerName || "Signed",
      })
      .where(eq(contracts.id, tokenRecord.contractId))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Contract not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Public contract sign error:", error);
    res.status(500).json({ error: "Contract signing failed" });
  }
});

// Public equipment signature lookup
router.get("/equipment/:token", async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const [tokenRecord] = await db.select()
      .from(equipmentSignatureTokens)
      .where(eq(equipmentSignatureTokens.token, token));

    if (!tokenRecord) {
      return res.status(404).json({ error: "Invalid equipment link" });
    }

    const equipmentItem = tokenRecord.equipmentId
      ? await db.select().from(equipment).where(eq(equipment.id, tokenRecord.equipmentId))
      : [];

    res.json({
      token: tokenRecord.token,
      type: tokenRecord.type,
      status: tokenRecord.status,
      equipment: equipmentItem[0] || null,
    });
  } catch (error) {
    console.error("Public equipment fetch error:", error);
    res.status(500).json({ error: "Equipment lookup failed" });
  }
});

router.post("/equipment/:token/sign", async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { signature, signerName, signerEmail, notes } = req.body;

    const [tokenRecord] = await db.select()
      .from(equipmentSignatureTokens)
      .where(eq(equipmentSignatureTokens.token, token));

    if (!tokenRecord) {
      return res.status(404).json({ error: "Invalid equipment link" });
    }

    await db.update(equipmentSignatureTokens)
      .set({
        signerName,
        signerEmail,
        signature: signature || signerName || "Signed",
        notes,
        status: "signed",
        signedAt: new Date(),
      })
      .where(eq(equipmentSignatureTokens.id, tokenRecord.id));

    res.json({ success: true });
  } catch (error) {
    console.error("Public equipment sign error:", error);
    res.status(500).json({ error: "Equipment signing failed" });
  }
});

export default router;
