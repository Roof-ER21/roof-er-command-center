import { Router } from "express";
import { db } from "../../db";
import {
  ptoPolicies,
  users,
  departmentPtoSettings,
  companyPtoPolicy,
  insertPtoPolicySchema,
  insertDepartmentPtoSettingSchema,
} from "../../../shared/schema";
import { eq, inArray, and } from "drizzle-orm";
import { PTO_POLICY, getPtoAllocation } from "../../../shared/constants/pto-policy";

const router = Router();

// Get company-wide PTO policy
router.get("/company-policy", async (req, res) => {
  try {
    const [policy] = await db.select().from(companyPtoPolicy).limit(1);
    res.json(policy || null);
  } catch (error) {
    console.error("Fetch company policy error:", error);
    res.status(500).json({ error: "Failed to fetch company policy" });
  }
});

// Update company-wide PTO policy
router.put("/company-policy", async (req, res) => {
  try {
    const data = req.body;
    const [existing] = await db.select().from(companyPtoPolicy).limit(1);

    let updated;
    if (existing) {
      [updated] = await db.update(companyPtoPolicy)
        .set({ ...data, updatedAt: new Date(), lastUpdatedBy: req.user?.id })
        .where(eq(companyPtoPolicy.id, existing.id))
        .returning();
    } else {
      [updated] = await db.insert(companyPtoPolicy)
        .values({ ...data, lastUpdatedBy: req.user?.id })
        .returning();
    }

    // Update all users who inherit from company
    const baseVacation = updated.vacationDays;
    const baseSick = updated.sickDays;
    const basePersonal = updated.personalDays;
    const baseDays = updated.totalDays;

    const policiesToUpdate = await db.select().from(ptoPolicies)
      .where(eq(ptoPolicies.policyLevel, "COMPANY"));

    for (const policy of policiesToUpdate) {
      const totalDays = baseDays + (policy.additionalDays || 0);
      await db.update(ptoPolicies)
        .set({
          vacationDays: baseVacation + (policy.additionalDays || 0),
          sickDays: baseSick,
          personalDays: basePersonal,
          baseDays,
          totalDays,
          remainingDays: totalDays - (policy.usedDays || 0),
          updatedAt: new Date(),
        })
        .where(eq(ptoPolicies.id, policy.id));
    }

    res.json(updated);
  } catch (error) {
    console.error("Update company policy error:", error);
    res.status(500).json({ error: "Failed to update company policy" });
  }
});

// Get all department settings
router.get("/department-settings", async (req, res) => {
  try {
    const settings = await db.select().from(departmentPtoSettings);
    res.json(settings);
  } catch (error) {
    console.error("Fetch department settings error:", error);
    res.status(500).json({ error: "Failed to fetch department settings" });
  }
});

// Get individual policies
router.get("/individual-policies", async (req, res) => {
  try {
    const policies = await db.select().from(ptoPolicies);
    res.json(policies);
  } catch (error) {
    console.error("Fetch individual policies error:", error);
    res.status(500).json({ error: "Failed to fetch individual policies" });
  }
});

// Get PTO policy for specific employee
router.get("/employee/:employeeId", async (req, res) => {
  try {
    const employeeId = parseInt(req.params.employeeId);
    if (Number.isNaN(employeeId)) {
      return res.status(400).json({ error: "Invalid employee id" });
    }

    const [policy] = await db.select().from(ptoPolicies).where(eq(ptoPolicies.employeeId, employeeId)).limit(1);
    
    if (!policy) {
      // Return default values based on company policy if no specific policy exists
      const [company] = await db.select().from(companyPtoPolicy).limit(1);
      return res.json({
        employeeId,
        policyLevel: "COMPANY",
        vacationDays: company?.vacationDays || 10,
        sickDays: company?.sickDays || 5,
        personalDays: company?.personalDays || 2,
        totalDays: company?.totalDays || 17,
        remainingDays: company?.totalDays || 17,
        usedDays: 0
      });
    }
    
    res.json(policy);
  } catch (error) {
    console.error("Fetch employee policy error:", error);
    res.status(500).json({ error: "Failed to fetch employee policy" });
  }
});

// Update individual policy
router.put("/individual-policies/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = req.body;
    
    const [updated] = await db.update(ptoPolicies)
      .set({ 
        ...data, 
        updatedAt: new Date(),
        customizedBy: req.user?.id,
        customizationDate: new Date()
      })
      .where(eq(ptoPolicies.id, id))
      .returning();
      
    res.json(updated);
  } catch (error) {
    console.error("Update individual policy error:", error);
    res.status(500).json({ error: "Failed to update policy" });
  }
});

// Reset all balances
router.post("/admin/reset-all", async (req, res) => {
  try {
    const allActiveUsers = await db.select().from(users).where(eq(users.isActive, true));
    
    const results = { updated: 0, created: 0 };
    
    for (const employee of allActiveUsers) {
      const allocation = getPtoAllocation(employee.employmentType ?? undefined, employee.department ?? undefined);
      
      const [existing] = await db.select().from(ptoPolicies).where(eq(ptoPolicies.employeeId, employee.id));
      
      if (existing) {
        await db.update(ptoPolicies).set({
          vacationDays: allocation.vacationDays,
          sickDays: allocation.sickDays,
          personalDays: allocation.personalDays,
          totalDays: allocation.totalDays,
          baseDays: allocation.totalDays,
          remainingDays: allocation.totalDays - (existing.usedDays || 0),
          updatedAt: new Date(),
          notes: "System Reset"
        }).where(eq(ptoPolicies.id, existing.id));
        results.updated++;
      } else {
        await db.insert(ptoPolicies).values({
          employeeId: employee.id,
          policyLevel: "COMPANY",
          vacationDays: allocation.vacationDays,
          sickDays: allocation.sickDays,
          personalDays: allocation.personalDays,
          totalDays: allocation.totalDays,
          baseDays: allocation.totalDays,
          remainingDays: allocation.totalDays,
          notes: "System Initialized"
        });
        results.created++;
      }
    }
    
    res.json({ success: true, message: `Reset complete: ${results.updated} updated, ${results.created} created`, results });
  } catch (error) {
    console.error("Reset all PTO error:", error);
    res.status(500).json({ error: "Failed to reset all PTO" });
  }
});

export default router;
