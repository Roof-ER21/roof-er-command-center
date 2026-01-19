import { Router, Request, Response } from "express";
import { db } from "../../db.js";
import { users } from "../../../shared/schema.js";
import { eq, isNull } from "drizzle-orm";
import { generateEmployeeSlug } from "../../services/slug.js";

const router = Router();

// POST /api/hr/employees/generate-slugs - Generate slugs for all employees without one
router.post("/employees/generate-slugs", async (req: Request, res: Response) => {
  try {
    // Get all employees without slugs
    const employeesWithoutSlugs = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(users)
      .where(isNull(users.slug));

    const updates = [];

    for (const employee of employeesWithoutSlugs) {
      const slug = generateEmployeeSlug(employee.firstName, employee.lastName);

      await db
        .update(users)
        .set({ slug })
        .where(eq(users.id, employee.id));

      updates.push({
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName}`,
        slug,
      });
    }

    res.json({
      success: true,
      count: updates.length,
      updates,
    });
  } catch (error) {
    console.error("Generate slugs error:", error);
    res.status(500).json({ error: "Failed to generate slugs" });
  }
});

// PATCH /api/hr/employees/:id/public-profile - Update public profile settings
router.patch("/employees/:id/public-profile", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const {
      isPublicProfile,
      publicBio,
      publicPhone,
      publicEmail,
    } = req.body;

    const updates: any = {};

    if (typeof isPublicProfile === 'boolean') {
      updates.isPublicProfile = isPublicProfile;
    }
    if (publicBio !== undefined) {
      updates.publicBio = publicBio;
    }
    if (publicPhone !== undefined) {
      updates.publicPhone = publicPhone;
    }
    if (publicEmail !== undefined) {
      updates.publicEmail = publicEmail;
    }

    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.json(updated);
  } catch (error) {
    console.error("Update public profile error:", error);
    res.status(500).json({ error: "Failed to update public profile" });
  }
});

// GET /api/hr/employees/:id/profile-url - Get the public profile URL for an employee
router.get("/employees/:id/profile-url", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    const [employee] = await db
      .select({
        slug: users.slug,
        isPublicProfile: users.isPublicProfile,
      })
      .from(users)
      .where(eq(users.id, id));

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    if (!employee.slug) {
      // Generate slug if it doesn't exist
      const [userInfo] = await db
        .select({
          firstName: users.firstName,
          lastName: users.lastName,
        })
        .from(users)
        .where(eq(users.id, id));

      const slug = generateEmployeeSlug(userInfo.firstName, userInfo.lastName);

      await db
        .update(users)
        .set({ slug })
        .where(eq(users.id, id));

      return res.json({
        slug,
        url: `/team/${slug}`,
        isPublic: employee.isPublicProfile,
      });
    }

    res.json({
      slug: employee.slug,
      url: `/team/${employee.slug}`,
      isPublic: employee.isPublicProfile,
    });
  } catch (error) {
    console.error("Get profile URL error:", error);
    res.status(500).json({ error: "Failed to get profile URL" });
  }
});

export default router;
