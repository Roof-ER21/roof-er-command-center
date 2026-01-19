import { Router, Request, Response } from "express";
import { db } from "../../db.js";
import { jobPostings } from "../../../shared/schema.js";
import { eq, desc } from "drizzle-orm";

const router = Router();

// Get all job postings (with optional status filter)
router.get("/", async (req: Request, res: Response) => {
  try {
    const statusFilter = req.query.status as string | undefined;

    let query = db.select().from(jobPostings);
    if (statusFilter && statusFilter !== 'all') {
      query = query.where(eq(jobPostings.status, statusFilter));
    }

    const allPostings = await query.orderBy(desc(jobPostings.createdAt));
    res.json(allPostings);
  } catch (error) {
    console.error("Job postings fetch error:", error);
    res.status(500).json({ error: "Failed to fetch job postings" });
  }
});

// Get single job posting
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const postingId = parseInt(req.params.id, 10);
    if (Number.isNaN(postingId)) {
      return res.status(400).json({ error: "Invalid job posting ID" });
    }

    const [posting] = await db.select()
      .from(jobPostings)
      .where(eq(jobPostings.id, postingId))
      .limit(1);

    if (!posting) {
      return res.status(404).json({ error: "Job posting not found" });
    }

    res.json(posting);
  } catch (error) {
    console.error("Job posting fetch error:", error);
    res.status(500).json({ error: "Failed to fetch job posting" });
  }
});

// Create job posting
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      title,
      department,
      location,
      employmentType,
      description,
      requirements,
      responsibilities,
      salaryMin,
      salaryMax,
      salaryType,
      status,
    } = req.body;

    if (!title || !department) {
      return res.status(400).json({ error: "Title and department are required" });
    }

    const userId = (req as any).user?.id;

    const [newPosting] = await db.insert(jobPostings).values({
      title,
      department,
      location: location || 'Vienna, VA',
      employmentType: employmentType || 'full_time',
      description,
      requirements,
      responsibilities,
      salaryMin: salaryMin ? parseFloat(salaryMin) : null,
      salaryMax: salaryMax ? parseFloat(salaryMax) : null,
      salaryType: salaryType || 'yearly',
      status: status || 'draft',
      createdBy: userId || null,
    }).returning();

    res.status(201).json(newPosting);
  } catch (error) {
    console.error("Create job posting error:", error);
    res.status(500).json({ error: "Failed to create job posting" });
  }
});

// Update job posting
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const postingId = parseInt(req.params.id, 10);
    if (Number.isNaN(postingId)) {
      return res.status(400).json({ error: "Invalid job posting ID" });
    }

    const {
      title,
      department,
      location,
      employmentType,
      description,
      requirements,
      responsibilities,
      salaryMin,
      salaryMax,
      salaryType,
      status,
    } = req.body;

    const update: Record<string, any> = { updatedAt: new Date() };
    if (title !== undefined) update.title = title;
    if (department !== undefined) update.department = department;
    if (location !== undefined) update.location = location;
    if (employmentType !== undefined) update.employmentType = employmentType;
    if (description !== undefined) update.description = description;
    if (requirements !== undefined) update.requirements = requirements;
    if (responsibilities !== undefined) update.responsibilities = responsibilities;
    if (salaryMin !== undefined) update.salaryMin = salaryMin ? parseFloat(salaryMin) : null;
    if (salaryMax !== undefined) update.salaryMax = salaryMax ? parseFloat(salaryMax) : null;
    if (salaryType !== undefined) update.salaryType = salaryType;
    if (status !== undefined) update.status = status;

    const [updated] = await db.update(jobPostings)
      .set(update)
      .where(eq(jobPostings.id, postingId))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Job posting not found" });
    }

    res.json(updated);
  } catch (error) {
    console.error("Update job posting error:", error);
    res.status(500).json({ error: "Failed to update job posting" });
  }
});

// Delete job posting
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const postingId = parseInt(req.params.id, 10);
    if (Number.isNaN(postingId)) {
      return res.status(400).json({ error: "Invalid job posting ID" });
    }

    const [deleted] = await db.delete(jobPostings)
      .where(eq(jobPostings.id, postingId))
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: "Job posting not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Delete job posting error:", error);
    res.status(500).json({ error: "Failed to delete job posting" });
  }
});

// Publish job posting
router.post("/:id/publish", async (req: Request, res: Response) => {
  try {
    const postingId = parseInt(req.params.id, 10);
    if (Number.isNaN(postingId)) {
      return res.status(400).json({ error: "Invalid job posting ID" });
    }

    const [updated] = await db.update(jobPostings)
      .set({
        status: 'active',
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(jobPostings.id, postingId))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Job posting not found" });
    }

    res.json(updated);
  } catch (error) {
    console.error("Publish job posting error:", error);
    res.status(500).json({ error: "Failed to publish job posting" });
  }
});

// Close job posting
router.post("/:id/close", async (req: Request, res: Response) => {
  try {
    const postingId = parseInt(req.params.id, 10);
    if (Number.isNaN(postingId)) {
      return res.status(400).json({ error: "Invalid job posting ID" });
    }

    const [updated] = await db.update(jobPostings)
      .set({
        status: 'closed',
        closedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(jobPostings.id, postingId))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Job posting not found" });
    }

    res.json(updated);
  } catch (error) {
    console.error("Close job posting error:", error);
    res.status(500).json({ error: "Failed to close job posting" });
  }
});

export default router;
