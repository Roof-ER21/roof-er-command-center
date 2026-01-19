import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import { requireAuth, requireModuleAccess } from "../../middleware/auth.js";
import { db } from "../../db.js";
import {
  users,
  territories,
  ptoRequests,
  companyPtoPolicy,
  ptoPolicies,
  jobPostings,
  candidates,
  candidateNotes,
  employeeNotes,
  hrAssignments,
  interviews,
  interviewScorecards,
  equipment,
  inventory,
  contracts,
  onboardingTasks,
  onboardingRequirements,
  documents,
  documentAcknowledgements,
  documentAssignments,
  employeeReviews,
  attendanceSessions,
  attendanceCheckIns,
  meetingRooms,
  meetings,
  hrCalendarEvents,
  hrTasks,
  hrAiCriteria,
  scheduledReports,
  scheduledReportExecutions,
  onboardingTemplates,
  emailTemplates,
  coiDocuments,
  employeeAssignments,
  workflows,
  workflowSteps,
  workflowExecutions,
  workflowStepExecutions,
  contractTokens,
  equipmentSignatureTokens,
} from "../../../shared/schema.js";
import { randomBytes } from "crypto";
import { CronExpressionParser } from "cron-parser";
import { eq, desc, inArray, sql, and, or, gte, lte } from "drizzle-orm";
import recruitingAnalyticsRoutes from "./recruiting-analytics";
import jobPostingsRoutes from "./job-postings";
import ptoPoliciesRoutes from "./pto-policies";
import ptoAnalyticsRoutes from "./pto-analytics";
import offerLettersRoutes from "./offer-letters.js";
import {
  sendCandidateStatusEmail,
  sendInterviewScheduledEmail,
  sendOfferEmail,
  sendPTORequestNotification,
  sendPTORequestNotificationToApprovers,
  sendPTOApprovalEmail,
  sendPTODenialEmail,
  sendRejectionEmail,
  sendWithdrawalEmail,
  sendNoShowEmail,
} from "../../services/email.js";
import {
  getApproverUsers,
  canUserApprovePTORequest,
} from "../../services/pto-approval.js";
import {
  createOnboardingRequirements,
  getRequirementsByCategory,
  calculateCompletionPercentage,
  isRequirementOverdue,
} from "../../services/onboarding-requirements.js";
import {
  notifyApproversOfNewRequest,
  notifyEmployeeOfDecision,
} from "../../services/pto-notifications.js";
import { workflowExecutor } from "../../services/workflow-executor.js";
import { executeStatusAutomation } from "../../services/candidate-status-automation.js";
import hireRouter from "./hire-endpoint.js";
import { deductPtoBalance, restorePtoBalance } from "../../services/pto-balance.js";
import { getWinterRequirementStatus } from "../../services/pto-winter.js";
import {
  createPtoCalendarEvent,
  deletePtoCalendarEvent,
  syncPtoToCalendar,
} from "../../services/pto-calendar.js";
import { calculateBusinessDays } from "../../services/business-days.js";
import { validatePTORequest, calculatePTODays } from "../../services/pto-validation.js";
import { selectUserColumns } from "../../utils/user-select.js";

const router = Router();
const adminRoles = new Set([
  "SYSTEM_ADMIN",
  "HR_ADMIN",
  "GENERAL_MANAGER",
  "TERRITORY_MANAGER",
]);
const managerRoles = new Set([...adminRoles, "MANAGER", "TEAM_LEAD"]);

const canManageEmployees = (role?: string) => {
  if (!role) return false;
  return adminRoles.has(role.toUpperCase());
};

const canManageDocuments = (role?: string) => {
  if (!role) return false;
  return managerRoles.has(role.toUpperCase());
};

const getAllowedDocumentVisibilities = (role?: string) => {
  const normalizedRole = role?.toUpperCase();
  if (normalizedRole && adminRoles.has(normalizedRole)) {
    return null;
  }
  if (normalizedRole && managerRoles.has(normalizedRole)) {
    return new Set(["PUBLIC", "EMPLOYEE", "MANAGER"]);
  }
  return new Set(["PUBLIC", "EMPLOYEE"]);
};

const canAccessDocument = (visibility: string | null | undefined, role?: string) => {
  const allowed = getAllowedDocumentVisibilities(role);
  if (!allowed) return true;
  return allowed.has(visibility || "EMPLOYEE");
};

const contractTemplates = [
  {
    id: "employment-standard",
    name: "Employment Agreement",
    type: "EMPLOYMENT",
    content: "Standard employment agreement for Roof ER employees.",
    isActive: true,
  },
  {
    id: "contractor-standard",
    name: "Contractor Agreement",
    type: "CONTRACTOR",
    content: "Independent contractor agreement for field partners.",
    isActive: true,
  },
  {
    id: "nda-standard",
    name: "Non-Disclosure Agreement",
    type: "NDA",
    content: "Confidentiality and non-disclosure agreement template.",
    isActive: true,
  },
];

const getNextRunAt = (schedule: string) => {
  try {
    return CronExpressionParser.parse(schedule, { currentDate: new Date() }).next().toDate();
  } catch (error) {
    console.warn("Invalid schedule expression:", schedule);
    return null;
  }
};

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
      .where(and(
        eq(candidates.isArchived, false),
        sql`${candidates.status} NOT IN ('rejected', 'hired')`
      ));

    const totalEmployees = Number(employeeCount?.count || 0);
    res.json({
      totalEmployees,
      activeEmployees: totalEmployees,
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
      activeEmployees: 0,
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
    const includeInactive = req.query.includeInactive === "true";
    const selectFields = {
      id: users.id,
      email: users.email,
      username: users.username,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      department: users.department,
      position: users.position,
      employmentType: users.employmentType,
      phone: users.phone,
      hireDate: users.hireDate,
      isActive: users.isActive,
      avatar: users.avatar,
      hasHRAccess: users.hasHRAccess,
      hasTrainingAccess: users.hasTrainingAccess,
      hasFieldAccess: users.hasFieldAccess,
      hasLeaderboardAccess: users.hasLeaderboardAccess,
    };

    const query = includeInactive
      ? db.select(selectFields).from(users)
      : db.select(selectFields).from(users).where(eq(users.isActive, true));

    const allUsers = await query.orderBy(users.lastName);

    res.json(allUsers);
  } catch (error) {
    console.error("Employees fetch error:", error);
    res.json([]);
  }
});

// Create employee
router.post("/employees", async (req: Request, res: Response) => {
  try {
    if (!canManageEmployees(req.user?.role)) {
      return res.status(403).json({ error: "Not authorized to create employees" });
    }

    const {
      email,
      username,
      password,
      firstName,
      lastName,
      role,
      department,
      position,
      employmentType,
      hireDate,
      phone,
      address,
      emergencyContact,
      emergencyPhone,
      shirtSize,
      timezone,
      team,
      hasHRAccess,
      hasTrainingAccess,
      hasFieldAccess,
      hasLeaderboardAccess,
      isActive,
    } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: "Missing required employee fields" });
    }

    const normalizedEmail = email.toLowerCase();
    const existing = await db.select(selectUserColumns()).from(users).where(eq(users.email, normalizedEmail));
    if (existing.length > 0) {
      return res.status(400).json({ error: "Email already exists" });
    }

    if (username) {
      const existingUsername = await db.select(selectUserColumns()).from(users).where(eq(users.username, username));
      if (existingUsername.length > 0) {
        return res.status(400).json({ error: "Username already exists" });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const normalizedRole = typeof role === "string" ? role.toUpperCase() : "EMPLOYEE";

    const [newUser] = await db.insert(users).values({
      email: normalizedEmail,
      username,
      passwordHash,
      firstName,
      lastName,
      role: normalizedRole as any,
      department,
      position,
      employmentType,
      hireDate,
      phone,
      address,
      emergencyContact,
      emergencyPhone,
      shirtSize,
      timezone,
      team,
      hasHRAccess: typeof hasHRAccess === "boolean" ? hasHRAccess : true,
      hasTrainingAccess: typeof hasTrainingAccess === "boolean" ? hasTrainingAccess : undefined,
      hasFieldAccess: typeof hasFieldAccess === "boolean" ? hasFieldAccess : undefined,
      hasLeaderboardAccess: typeof hasLeaderboardAccess === "boolean" ? hasLeaderboardAccess : undefined,
      isActive: typeof isActive === "boolean" ? isActive : true,
    }).returning();

    // Auto-create onboarding requirements based on employment type
    if (employmentType === 'W2' || employmentType === '1099') {
      try {
        await createOnboardingRequirements(newUser.id, employmentType);
      } catch (error) {
        console.error("Failed to create onboarding requirements:", error);
        // Don't fail the whole request if onboarding requirements fail
      }
    }

    const { passwordHash: _, pinHash, ...safeUser } = newUser;
    res.status(201).json(safeUser);
  } catch (error) {
    console.error("Create employee error:", error);
    res.status(500).json({ error: "Failed to create employee" });
  }
});

// Update employee
router.patch("/employees/:id", async (req: Request, res: Response) => {
  try {
    if (!canManageEmployees(req.user?.role)) {
      return res.status(403).json({ error: "Not authorized to update employees" });
    }

    const employeeId = parseInt(req.params.id, 10);
    if (Number.isNaN(employeeId)) {
      return res.status(400).json({ error: "Invalid employee id" });
    }

    const {
      email,
      username,
      password,
      firstName,
      lastName,
      role,
      department,
      position,
      employmentType,
      hireDate,
      phone,
      address,
      emergencyContact,
      emergencyPhone,
      shirtSize,
      timezone,
      team,
      hasHRAccess,
      hasTrainingAccess,
      hasFieldAccess,
      hasLeaderboardAccess,
      isActive,
      terminationDate,
    } = req.body;

    if (email) {
      const normalizedEmail = email.toLowerCase();
      const existing = await db.select(selectUserColumns()).from(users).where(eq(users.email, normalizedEmail));
      if (existing.length > 0 && existing[0]?.id !== employeeId) {
        return res.status(400).json({ error: "Email already exists" });
      }
    }

    if (username) {
      const existingUsername = await db.select(selectUserColumns()).from(users).where(eq(users.username, username));
      if (existingUsername.length > 0 && existingUsername[0]?.id !== employeeId) {
        return res.status(400).json({ error: "Username already exists" });
      }
    }

    const update: Record<string, any> = { updatedAt: new Date() };
    if (email !== undefined) update.email = email.toLowerCase();
    if (username !== undefined) update.username = username;
    if (firstName !== undefined) update.firstName = firstName;
    if (lastName !== undefined) update.lastName = lastName;
    if (role !== undefined) update.role = typeof role === "string" ? role.toUpperCase() : role;
    if (department !== undefined) update.department = department;
    if (position !== undefined) update.position = position;
    if (employmentType !== undefined) update.employmentType = employmentType;
    if (hireDate !== undefined) update.hireDate = hireDate;
    if (phone !== undefined) update.phone = phone;
    if (address !== undefined) update.address = address;
    if (emergencyContact !== undefined) update.emergencyContact = emergencyContact;
    if (emergencyPhone !== undefined) update.emergencyPhone = emergencyPhone;
    if (shirtSize !== undefined) update.shirtSize = shirtSize;
    if (timezone !== undefined) update.timezone = timezone;
    if (team !== undefined) update.team = team;
    if (hasHRAccess !== undefined) update.hasHRAccess = !!hasHRAccess;
    if (hasTrainingAccess !== undefined) update.hasTrainingAccess = !!hasTrainingAccess;
    if (hasFieldAccess !== undefined) update.hasFieldAccess = !!hasFieldAccess;
    if (hasLeaderboardAccess !== undefined) update.hasLeaderboardAccess = !!hasLeaderboardAccess;
    if (isActive !== undefined) update.isActive = !!isActive;
    if (terminationDate !== undefined) update.terminationDate = terminationDate;

    if (password) {
      update.passwordHash = await bcrypt.hash(password, 10);
      update.mustChangePassword = false;
      update.lastPasswordChange = new Date();
    }

    const [updated] = await db.update(users)
      .set(update)
      .where(eq(users.id, employeeId))
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

// Employee Notes
router.get("/employees/:id/notes", async (req: Request, res: Response) => {
  try {
    const employeeId = parseInt(req.params.id, 10);
    if (Number.isNaN(employeeId)) {
      return res.status(400).json({ error: "Invalid employee id" });
    }

    const notes = await db.select().from(employeeNotes)
      .where(eq(employeeNotes.employeeId, employeeId))
      .orderBy(desc(employeeNotes.createdAt));

    res.json(notes);
  } catch (error) {
    console.error("Fetch employee notes error:", error);
    res.status(500).json({ error: "Failed to fetch employee notes" });
  }
});

router.post("/employees/:id/notes", async (req: Request, res: Response) => {
  try {
    const employeeId = parseInt(req.params.id, 10);
    if (Number.isNaN(employeeId)) {
      return res.status(400).json({ error: "Invalid employee id" });
    }

    const { content, type } = req.body;
    if (!content) {
      return res.status(400).json({ error: "Note content is required" });
    }

    const [note] = await db.insert(employeeNotes).values({
      employeeId,
      authorId: req.user?.id || 0,
      content,
      type: type || "GENERAL",
    }).returning();

    res.status(201).json(note);
  } catch (error) {
    console.error("Create employee note error:", error);
    res.status(500).json({ error: "Failed to create note" });
  }
});

router.delete("/employees/notes/:id", async (req: Request, res: Response) => {
  try {
    const noteId = parseInt(req.params.id, 10);
    if (Number.isNaN(noteId)) {
      return res.status(400).json({ error: "Invalid note id" });
    }

    const [note] = await db.select().from(employeeNotes).where(eq(employeeNotes.id, noteId));
    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    const canDelete = note.authorId === req.user?.id || adminRoles.has(req.user?.role || "");
    if (!canDelete) {
      return res.status(403).json({ error: "Not authorized to delete this note" });
    }

    await db.delete(employeeNotes).where(eq(employeeNotes.id, noteId));
    res.json({ success: true });
  } catch (error) {
    console.error("Delete employee note error:", error);
    res.status(500).json({ error: "Failed to delete note" });
  }
});

// Deactivate employee
router.delete("/employees/:id", async (req: Request, res: Response) => {
  try {
    if (!canManageEmployees(req.user?.role)) {
      return res.status(403).json({ error: "Not authorized to deactivate employees" });
    }

    const employeeId = parseInt(req.params.id, 10);
    if (Number.isNaN(employeeId)) {
      return res.status(400).json({ error: "Invalid employee id" });
    }

    const [updated] = await db.update(users)
      .set({
        isActive: false,
        terminationDate: new Date().toISOString().split("T")[0],
        updatedAt: new Date(),
      })
      .where(eq(users.id, employeeId))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const { passwordHash, pinHash, ...safeUser } = updated;
    res.json(safeUser);
  } catch (error) {
    console.error("Deactivate employee error:", error);
    res.status(500).json({ error: "Failed to deactivate employee" });
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

// PTO
router.use("/pto/policies", ptoPoliciesRoutes);
router.use("/pto/analytics", ptoAnalyticsRoutes);

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

// Create PTO request
router.post("/pto", async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, type, reason, employeeId: requestedEmployeeId, isHalfDay } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    let employeeId = userId;
    if (requestedEmployeeId && managerRoles.has(req.user?.role?.toUpperCase() || "")) {
      const parsedEmployeeId = parseInt(requestedEmployeeId, 10);
      if (Number.isNaN(parsedEmployeeId)) {
        return res.status(400).json({ error: "Invalid employee id" });
      }
      employeeId = parsedEmployeeId;
    }

    if (!startDate || !endDate || !reason) {
      return res.status(400).json({ error: "Missing required PTO fields" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
      return res.status(400).json({ error: "Invalid date range" });
    }

    // Run all PTO validations (eligibility, duplicates, conflicts, future date)
    const validationResult = await validatePTORequest(employeeId, start, end);
    if (!validationResult.isValid) {
      return res.status(400).json({
        error: validationResult.error,
        ...validationResult.details
      });
    }

    // Calculate days (use business days if not a half-day request)
    let days: number;
    if (isHalfDay) {
      // For half-day, validate it's a single day request
      const calendarDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (calendarDays > 1) {
        return res.status(400).json({ error: "Half-day requests are only valid for single-day periods" });
      }
      days = 0.5;
    } else {
      // Use business days calculation (excludes weekends and holidays)
      days = await calculatePTODays(start, end);
    }

    const [newRequest] = await db.insert(ptoRequests).values({
      employeeId,
      startDate,
      endDate,
      days,
      type: type || "VACATION",
      reason,
      status: "PENDING",
    }).returning();

    // Send email notification to appropriate approvers
    try {
      // Get employee details
      const [employee] = await db.select(selectUserColumns()).from(users).where(eq(users.id, employeeId)).limit(1);

      // Get designated approvers for this employee
      const approvers = await getApproverUsers(employeeId);

      if (employee && approvers.length > 0) {
        // Send in-app notifications to all approvers
        const approverIds = approvers.map(a => a.id);
        await notifyApproversOfNewRequest(newRequest, approverIds);

        // Send email to designated approvers only
        await sendPTORequestNotificationToApprovers(
          {
            firstName: employee.firstName,
            lastName: employee.lastName,
            email: employee.email,
            position: employee.position,
          },
          {
            id: newRequest.id,
            startDate: newRequest.startDate,
            endDate: newRequest.endDate,
            days: newRequest.days,
            type: newRequest.type,
            reason: newRequest.reason,
          },
          approvers.map(approver => ({
            firstName: approver.firstName,
            lastName: approver.lastName,
            email: approver.email,
          }))
        );
        console.log(`✅ Sent PTO request notification (email + in-app) to ${approvers.length} designated approver(s) for ${employee.email}`);
      } else if (employee) {
        console.warn(`⚠️  No approvers found for employee ${employee.email}`);
      }
    } catch (emailError) {
      // Log email error but don't fail the request
      console.error("Failed to send PTO request notifications:", emailError);
    }

    res.status(201).json({
      ...newRequest,
      status: newRequest.status?.toLowerCase() || "pending",
    });
  } catch (error) {
    console.error("Create PTO error:", error);
    res.status(500).json({ error: "Failed to create PTO request" });
  }
});

// Admin create PTO for employee
router.post("/pto/admin/create", async (req: Request, res: Response) => {
  try {
    // Only admin roles can create PTO for others
    const userRole = req.user?.role?.toUpperCase() || "";
    if (!["SYSTEM_ADMIN", "HR_ADMIN", "GENERAL_MANAGER"].includes(userRole)) {
      return res.status(403).json({ error: "Not authorized to create PTO for employees" });
    }

    const { employeeId, startDate, endDate, type, reason, autoApprove, isExempt } = req.body;

    if (!employeeId || !startDate || !endDate || !reason) {
      return res.status(400).json({ error: "Missing required fields: employeeId, startDate, endDate, reason" });
    }

    // Validate employee exists
    const [employee] = await db.select(selectUserColumns()).from(users).where(eq(users.id, employeeId)).limit(1);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
      return res.status(400).json({ error: "Invalid date range" });
    }

    // Calculate days (business days)
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Determine status
    const status = autoApprove ? "APPROVED" : "PENDING";

    const [newRequest] = await db.insert(ptoRequests).values({
      employeeId,
      startDate,
      endDate,
      days,
      type: type || "VACATION",
      reason,
      status,
      createdByAdmin: req.user?.id,
      isExempt: isExempt || false,
      reviewedBy: autoApprove ? req.user?.id : null,
      reviewedAt: autoApprove ? new Date() : null,
    }).returning();

    // Send email notification to employee
    try {
      const admin = {
        firstName: req.user?.firstName || "Admin",
        lastName: req.user?.lastName || "",
      };

      const requestData = {
        id: newRequest.id,
        startDate: newRequest.startDate,
        endDate: newRequest.endDate,
        days: newRequest.days,
        type: newRequest.type,
        isExempt: newRequest.isExempt,
        createdByAdmin: newRequest.createdByAdmin,
      };

      const employeeData = {
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
      };

      if (autoApprove) {
        await sendPTOApprovalEmail(employeeData, requestData, admin);
        console.log(`✅ Sent admin-created PTO approval email to ${employee.email}`);

        // Create calendar events for auto-approved PTO
        try {
          const calendarResult = await createPtoCalendarEvent(newRequest, employee);
          if (calendarResult.googleEventId || calendarResult.hrCalendarEventId) {
            // Update PTO request with calendar event IDs
            const updateData: any = {
              googleEventId: calendarResult.googleEventId || null,
              hrCalendarEventId: calendarResult.hrCalendarEventId || null,
              updatedAt: new Date(),
            };
            await db.update(ptoRequests)
              .set(updateData)
              .where(eq(ptoRequests.id, newRequest.id));
            console.log(`✅ Created calendar events for admin-created PTO request #${newRequest.id}`);
          }
        } catch (calendarError) {
          console.error("Failed to create calendar events for admin-created PTO:", calendarError);
        }
      } else {
        // Send notification that PTO was created and pending approval
        await sendPTORequestNotification(employeeData, requestData, { ...admin, email: employee.email });
        console.log(`✅ Sent admin-created PTO notification to ${employee.email}`);
      }
    } catch (emailError) {
      console.error("Failed to send admin-created PTO email notification:", emailError);
    }

    res.status(201).json({
      ...newRequest,
      status: newRequest.status?.toLowerCase() || "pending",
    });
  } catch (error) {
    console.error("Admin create PTO error:", error);
    res.status(500).json({ error: "Failed to create PTO request" });
  }
});

// Update PTO request status
router.patch("/pto/:id", async (req: Request, res: Response) => {
  try {
    if (!managerRoles.has(req.user?.role?.toUpperCase() || "")) {
      return res.status(403).json({ error: "Not authorized to update PTO requests" });
    }

    const requestId = parseInt(req.params.id);
    if (Number.isNaN(requestId)) {
      return res.status(400).json({ error: "Invalid PTO request id" });
    }

    const { status, isExempt } = req.body;
    if (!status) {
      return res.status(400).json({ error: "PTO status is required" });
    }

    const normalizedStatus = String(status).toUpperCase();
    if (!["APPROVED", "DENIED", "PENDING"].includes(normalizedStatus)) {
      return res.status(400).json({ error: "Invalid PTO status" });
    }

    // Get the PTO request to check employee
    const [existingRequest] = await db
      .select()
      .from(ptoRequests)
      .where(eq(ptoRequests.id, requestId))
      .limit(1);

    if (!existingRequest) {
      return res.status(404).json({ error: "PTO request not found" });
    }

    // Check if user is authorized to approve this specific request
    const userEmail = req.user?.email || "";
    const isAuthorized = await canUserApprovePTORequest(userEmail, existingRequest.employeeId);

    if (!isAuthorized) {
      return res.status(403).json({
        error: "You are not authorized to approve this request",
        message: "This request requires approval from designated approvers only"
      });
    }

    // Only SYSTEM_ADMIN, HR_ADMIN, or GENERAL_MANAGER can mark requests as exempt
    if (isExempt !== undefined && isExempt === true) {
      const userRole = req.user?.role?.toUpperCase() || "";
      if (!["SYSTEM_ADMIN", "HR_ADMIN", "GENERAL_MANAGER"].includes(userRole)) {
        return res.status(403).json({ error: "Only HR admins and General Managers can mark PTO as exempt" });
      }
    }

    // BALANCE VALIDATION: Check if employee has sufficient PTO balance before approving
    if (normalizedStatus === 'APPROVED' && !isExempt) {
      // Get employee's PTO policy
      const [policy] = await db.select()
        .from(ptoPolicies)
        .where(eq(ptoPolicies.employeeId, existingRequest.employeeId))
        .limit(1);

      if (policy) {
        // Get all pending requests for this employee (excluding current one)
        const pendingRequests = await db.select()
          .from(ptoRequests)
          .where(
            and(
              eq(ptoRequests.employeeId, existingRequest.employeeId),
              eq(ptoRequests.status, 'PENDING'),
              sql`${ptoRequests.id} != ${requestId}`
            )
          );

        // Calculate total pending days
        const totalPendingDays = pendingRequests.reduce((sum, req) => sum + (req.days || 0), 0);

        // Calculate required days (current request + pending)
        const requiredDays = (existingRequest.days || 0) + totalPendingDays;

        // Check if sufficient balance (considering type-specific allocations if needed)
        if (policy.remainingDays < requiredDays) {
          console.log(`❌ PTO approval blocked: Insufficient balance. Available: ${policy.remainingDays}, Required: ${requiredDays} (${existingRequest.days} current + ${totalPendingDays} pending)`);
          return res.status(400).json({
            error: "Insufficient PTO balance",
            available: policy.remainingDays,
            required: existingRequest.days,
            pending: totalPendingDays,
            message: `Employee has ${policy.remainingDays} days available, but needs ${requiredDays} days (${existingRequest.days} for this request + ${totalPendingDays} days pending)`
          });
        }

        console.log(`✅ Balance check passed: ${policy.remainingDays} days available, ${requiredDays} days required`);
      } else {
        console.warn(`⚠️ No PTO policy found for employee ${existingRequest.employeeId}, skipping balance check`);
      }
    }

    const updateData: any = {
      status: normalizedStatus as 'PENDING' | 'APPROVED' | 'DENIED',
      reviewedBy: req.user?.id || null,
      reviewedAt: new Date(),
      reviewNotes: req.body.reviewNotes || null,
    };

    // Add isExempt to update if provided
    if (isExempt !== undefined) {
      updateData.isExempt = isExempt;
    }

    const [updated] = await db.update(ptoRequests)
      .set(updateData)
      .where(eq(ptoRequests.id, requestId))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "PTO request not found" });
    }

    // Send email notification to employee
    try {
      // Get employee details
      const [employee] = await db.select(selectUserColumns()).from(users).where(eq(users.id, updated.employeeId)).limit(1);

      if (employee && req.user) {
        const approver = {
          firstName: req.user.firstName,
          lastName: req.user.lastName,
        };

        const requestData = {
          id: updated.id,
          startDate: updated.startDate,
          endDate: updated.endDate,
          days: updated.days,
          type: updated.type,
          isExempt: updated.isExempt,
          createdByAdmin: updated.createdByAdmin,
        };

        const employeeData = {
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
        };

        if (normalizedStatus === 'APPROVED') {
          // Send in-app notification
          await notifyEmployeeOfDecision(updated, 'approved', req.body.reviewNotes);

          // Send email
          await sendPTOApprovalEmail(employeeData, requestData, approver);
          console.log(`✅ Sent PTO approval notification (email + in-app) to ${employee.email}`);

          // Create calendar events for approved PTO
          try {
            const calendarResult = await createPtoCalendarEvent(updated, employee);
            if (calendarResult.googleEventId || calendarResult.hrCalendarEventId) {
              // Update PTO request with calendar event IDs
              const calendarUpdateData: any = {
                googleEventId: calendarResult.googleEventId || null,
                hrCalendarEventId: calendarResult.hrCalendarEventId || null,
                updatedAt: new Date(),
              };
              await db.update(ptoRequests)
                .set(calendarUpdateData)
                .where(eq(ptoRequests.id, updated.id));
              console.log(`✅ Created calendar events for PTO request #${updated.id}`);
            }
          } catch (calendarError) {
            console.error("Failed to create calendar events:", calendarError);
          }
        } else if (normalizedStatus === 'DENIED') {
          // Send in-app notification
          await notifyEmployeeOfDecision(updated, 'denied', req.body.reviewNotes);

          // Send email
          await sendPTODenialEmail(employeeData, requestData, approver, req.body.reviewNotes);
          console.log(`✅ Sent PTO denial notification (email + in-app) to ${employee.email}`);

          // Delete calendar events if they exist
          if (updated.googleEventId || updated.hrCalendarEventId) {
            try {
              await deletePtoCalendarEvent(
                updated.googleEventId,
                updated.hrCalendarEventId,
                employee.email
              );
              // Clear calendar event IDs from database
              const clearCalendarData: any = {
                googleEventId: null,
                hrCalendarEventId: null,
                updatedAt: new Date(),
              };
              await db.update(ptoRequests)
                .set(clearCalendarData)
                .where(eq(ptoRequests.id, updated.id));
              console.log(`✅ Deleted calendar events for PTO request #${updated.id}`);
            } catch (calendarError) {
              console.error("Failed to delete calendar events:", calendarError);
            }
          }
        }
      }
    } catch (emailError) {
      // Log email error but don't fail the request
      console.error("Failed to send PTO status email notification:", emailError);
    }

    res.json({
      ...updated,
      status: updated.status?.toLowerCase() || "pending",
    });
  } catch (error) {
    console.error("Update PTO error:", error);
    res.status(500).json({ error: "Failed to update PTO request" });
  }
});

// Manual PTO calendar sync endpoint
router.post("/pto/sync-calendar", async (req: Request, res: Response) => {
  try {
    // Only admin roles can manually trigger calendar sync
    const userRole = req.user?.role?.toUpperCase() || "";
    if (!["SYSTEM_ADMIN", "HR_ADMIN", "GENERAL_MANAGER"].includes(userRole)) {
      return res.status(403).json({ error: "Not authorized to sync PTO calendar" });
    }

    console.log(`🔧 Manual PTO calendar sync triggered by ${req.user?.email}`);

    const result = await syncPtoToCalendar();

    res.json({
      success: true,
      synced: result.synced,
      errors: result.errors,
      message: `Successfully synced ${result.synced} PTO requests to calendar${result.errors > 0 ? ` with ${result.errors} errors` : ''}`,
    });
  } catch (error) {
    console.error("Manual PTO calendar sync error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to sync PTO calendar",
    });
  }
});

// Get winter PTO requirement status for employee
router.get("/pto/winter-status/:employeeId", async (req: Request, res: Response) => {
  try {
    const employeeId = parseInt(req.params.employeeId);
    if (Number.isNaN(employeeId)) {
      return res.status(400).json({ error: "Invalid employee id" });
    }

    // Verify user has access to view this employee's data
    if (req.user?.id !== employeeId && !managerRoles.has(req.user?.role?.toUpperCase() || "")) {
      return res.status(403).json({ error: "Not authorized to view this employee's PTO status" });
    }

    const winterStatus = await getWinterRequirementStatus(employeeId);
    res.json(winterStatus);
  } catch (error) {
    console.error("Winter status fetch error:", error);
    res.status(500).json({ error: "Failed to fetch winter PTO status" });
  }
});

// Get candidates
router.get("/candidates", async (req: Request, res: Response) => {
  try {
    const includeArchived = req.query.includeArchived === "true";
    const query = includeArchived
      ? db.select().from(candidates)
      : db.select().from(candidates).where(eq(candidates.isArchived, false));

    const allCandidates = await query.orderBy(desc(candidates.createdAt));

    res.json(allCandidates);
  } catch (error) {
    console.error("Candidates fetch error:", error);
    res.json([]);
  }
});

// Create candidate
router.post("/candidates", async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, phone, position, jobPostingId, status, source, resumeUrl, rating, notes, assignedTo } = req.body;

    if (!firstName || !lastName || !email || !position) {
      return res.status(400).json({ error: "Missing required candidate fields" });
    }

    const [newCandidate] = await db.insert(candidates).values({
      firstName,
      lastName,
      email,
      phone,
      position,
      jobPostingId: jobPostingId ? parseInt(jobPostingId, 10) : null,
      status: status || "new",
      source,
      resumeUrl,
      rating: rating ? parseInt(rating, 10) : null,
      notes: notes || null,
      assignedTo: assignedTo ? parseInt(assignedTo, 10) : null,
      isArchived: false,
    }).returning();

    // Trigger CANDIDATE_CREATED workflows
    workflowExecutor.onCandidateCreated(newCandidate.id, (req as any).session?.userId).catch(err => {
      console.error('[Workflow] Failed to trigger candidate created workflows:', err);
    });

    res.status(201).json(newCandidate);
  } catch (error) {
    console.error("Create candidate error:", error);
    res.status(500).json({ error: "Failed to create candidate" });
  }
});

router.patch("/candidates/bulk", async (req: Request, res: Response) => {
  try {
    const { candidateIds, status, assignedTo, rating, archive } = req.body;
    if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
      return res.status(400).json({ error: "Candidate ids are required" });
    }

    const parsedIds = candidateIds
      .map((id: unknown) => parseInt(String(id), 10))
      .filter((id: number) => !Number.isNaN(id));

    if (parsedIds.length === 0) {
      return res.status(400).json({ error: "Candidate ids are required" });
    }

    const update: Record<string, any> = { updatedAt: new Date() };
    if (status !== undefined) update.status = status;
    if (assignedTo !== undefined) {
      update.assignedTo = assignedTo ? parseInt(assignedTo, 10) : null;
    }
    if (rating !== undefined) {
      update.rating = rating ? parseInt(rating, 10) : null;
    }
    if (archive !== undefined) {
      const archiveValue = Boolean(archive);
      update.isArchived = archiveValue;
      update.archivedAt = archiveValue ? new Date() : null;
    }

    if (Object.keys(update).length === 1) {
      return res.status(400).json({ error: "No updates provided" });
    }

    const updated = await db.update(candidates)
      .set(update)
      .where(inArray(candidates.id, parsedIds))
      .returning();

    res.json({ updated: updated.length });
  } catch (error) {
    console.error("Bulk candidate update error:", error);
    res.status(500).json({ error: "Failed to update candidates" });
  }
});

// Update candidate
router.patch("/candidates/:id", async (req: Request, res: Response) => {
  try {
    const candidateId = parseInt(req.params.id, 10);
    if (Number.isNaN(candidateId)) {
      return res.status(400).json({ error: "Invalid candidate id" });
    }

    // Get current candidate data to check for status changes
    const [currentCandidate] = await db.select().from(candidates)
      .where(eq(candidates.id, candidateId))
      .limit(1);

    if (!currentCandidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      position,
      jobPostingId,
      status,
      source,
      resumeUrl,
      rating,
      notes,
      assignedTo,
      referralName,
      isArchived,
    } = req.body;

    const update: Record<string, any> = { updatedAt: new Date() };
    if (firstName !== undefined) update.firstName = firstName;
    if (lastName !== undefined) update.lastName = lastName;
    if (email !== undefined) update.email = email;
    if (phone !== undefined) update.phone = phone;
    if (position !== undefined) update.position = position;
    if (jobPostingId !== undefined) {
      update.jobPostingId = jobPostingId ? parseInt(jobPostingId, 10) : null;
    }
    if (status !== undefined) update.status = status;
    if (source !== undefined) update.source = source;
    if (resumeUrl !== undefined) update.resumeUrl = resumeUrl;
    if (rating !== undefined) update.rating = rating ? parseInt(rating, 10) : null;
    if (notes !== undefined) update.notes = notes;
    if (assignedTo !== undefined) {
      update.assignedTo = assignedTo ? parseInt(assignedTo, 10) : null;
    }
    if (referralName !== undefined) update.referralName = referralName;
    if (isArchived !== undefined) {
      const archiveValue = Boolean(isArchived);
      update.isArchived = archiveValue;
      update.archivedAt = archiveValue ? new Date() : null;
    }

    const [updated] = await db.update(candidates)
      .set(update)
      .where(eq(candidates.id, candidateId))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    // Send email if status changed
    if (status !== undefined && status !== currentCandidate.status) {
      sendCandidateStatusEmail(updated, status, currentCandidate.status).catch(err => {
        console.error('Failed to send candidate status email:', err);
      });

      // Trigger CANDIDATE_STAGE_CHANGE workflows
      workflowExecutor.onCandidateStageChange(
        candidateId,
        currentCandidate.status,
        status,
        (req as any).session?.userId
      ).catch(err => {
        console.error('[Workflow] Failed to trigger candidate stage change workflows:', err);
      });

      // Execute DEAD/NO_SHOW automation for terminal statuses
      const deadStatuses = ['DEAD_BY_CANDIDATE', 'DEAD_BY_COMPANY', 'DEAD_COMPENSATION', 'DEAD_LOCATION', 'DEAD_TIMING', 'DEAD_QUALIFICATIONS', 'DEAD_CULTURE_FIT', 'DEAD_OTHER', 'rejected', 'NO_SHOW', 'no_show'];

      if (deadStatuses.includes(status)) {
        console.log(`🔄 Executing ${status} automation for candidate ${updated.id}`);
        executeStatusAutomation({
          candidateId: updated.id,
          newStatus: status,
          oldStatus: currentCandidate.status,
          reason: req.body.deadReason,
          interviewId: req.body.interviewId,
          googleEventId: req.body.googleEventId,
        }).catch(err => {
          console.error('Failed to execute status automation:', err);
        });
      }
    }

    // Send offer email if status changed to "offer"
    if (status === 'offer' && currentCandidate.status !== 'offer') {
      sendOfferEmail(updated, {
        position: updated.position,
      }).catch(err => {
        console.error('Failed to send offer email:', err);
      });
    }

    res.json(updated);
  } catch (error) {
    console.error("Update candidate error:", error);
    res.status(500).json({ error: "Failed to update candidate" });
  }
});

// Candidate Notes
router.get("/candidates/:id/notes", async (req: Request, res: Response) => {
  try {
    const candidateId = parseInt(req.params.id, 10);
    if (Number.isNaN(candidateId)) {
      return res.status(400).json({ error: "Invalid candidate id" });
    }

    const notes = await db.select().from(candidateNotes)
      .where(eq(candidateNotes.candidateId, candidateId))
      .orderBy(desc(candidateNotes.createdAt));

    res.json(notes);
  } catch (error) {
    console.error("Fetch candidate notes error:", error);
    res.status(500).json({ error: "Failed to fetch candidate notes" });
  }
});

router.post("/candidates/:id/notes", async (req: Request, res: Response) => {
  try {
    const candidateId = parseInt(req.params.id, 10);
    if (Number.isNaN(candidateId)) {
      return res.status(400).json({ error: "Invalid candidate id" });
    }

    const { content, type } = req.body;
    if (!content) {
      return res.status(400).json({ error: "Note content is required" });
    }

    const [note] = await db.insert(candidateNotes).values({
      candidateId,
      authorId: req.user?.id || 0, // Fallback should not happen with auth middleware
      content,
      type: type || "GENERAL",
    }).returning();

    res.status(201).json(note);
  } catch (error) {
    console.error("Create candidate note error:", error);
    res.status(500).json({ error: "Failed to create note" });
  }
});

router.delete("/candidates/notes/:id", async (req: Request, res: Response) => {
  try {
    const noteId = parseInt(req.params.id, 10);
    if (Number.isNaN(noteId)) {
      return res.status(400).json({ error: "Invalid note id" });
    }

    // Check ownership or admin status
    const [note] = await db.select().from(candidateNotes).where(eq(candidateNotes.id, noteId));
    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    const canDelete = note.authorId === req.user?.id || adminRoles.has(req.user?.role || "");
    if (!canDelete) {
      return res.status(403).json({ error: "Not authorized to delete this note" });
    }

    await db.delete(candidateNotes).where(eq(candidateNotes.id, noteId));
    res.json({ success: true });
  } catch (error) {
    console.error("Delete candidate note error:", error);
    res.status(500).json({ error: "Failed to delete note" });
  }
});

// Sourcer Assignments
router.get("/sourcers/available", async (req: Request, res: Response) => {
  try {
    // Return users with HR access or specific roles
    const availableUsers = await db.select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      role: users.role,
    }).from(users)
    .where(and(
      eq(users.isActive, true),
      // Filter for roles that can be sourcers or have HR access
      // or just return all active users like roof-hr does to allow anyone to be assigned
      eq(users.isActive, true) 
    ));

    // Calculate workload for each user
    const assignments = await db.select().from(hrAssignments).where(eq(hrAssignments.status, "ACTIVE"));
    const workloadMap = new Map<number, number>();
    assignments.forEach(a => {
      workloadMap.set(a.hrMemberId, (workloadMap.get(a.hrMemberId) || 0) + 1);
    });

    const usersWithWorkload = availableUsers.map(u => ({
      ...u,
      activeAssignments: workloadMap.get(u.id) || 0,
    })).sort((a, b) => {
      // Sort priority logic if needed, or just by assignments then name
      if (a.activeAssignments !== b.activeAssignments) {
        return a.activeAssignments - b.activeAssignments;
      }
      return (a.firstName || "").localeCompare(b.firstName || "");
    });

    res.json(usersWithWorkload);
  } catch (error) {
    console.error("Fetch available sourcers error:", error);
    res.status(500).json({ error: "Failed to fetch sourcers" });
  }
});

router.post("/candidates/:id/assign-sourcer", async (req: Request, res: Response) => {
  try {
    if (!managerRoles.has(req.user?.role || "") && req.user?.role !== "SOURCER") {
       // Allow managers and sourcers (self-assignment or peer) - checking roof-hr logic
       // roof-hr allowed lead sourcers. We'll stick to managerRoles for now or allow all HR users.
       // Let's use canManageEmployees check which is basically admin/manager
       // But wait, the prompt says "sourcer assignment controls".
       // For now, let's allow anyone with HR module access to assign if they are not just basic employees.
    }

    const candidateId = parseInt(req.params.id, 10);
    const { hrMemberId, role, notes } = req.body;
    const parsedHrMemberId = parseInt(hrMemberId, 10);

    if (Number.isNaN(candidateId) || Number.isNaN(parsedHrMemberId)) {
      return res.status(400).json({ error: "Invalid IDs" });
    }

    // Demote existing primary if this is a primary assignment
    if (role === "PRIMARY") {
      const existing = await db.select().from(hrAssignments)
        .where(and(
          eq(hrAssignments.assigneeId, candidateId),
          eq(hrAssignments.type, "CANDIDATE"),
          eq(hrAssignments.role, "PRIMARY"),
          eq(hrAssignments.status, "ACTIVE")
        ));
      
      for (const assignment of existing) {
        await db.update(hrAssignments)
          .set({ role: "SECONDARY", updatedAt: new Date() })
          .where(eq(hrAssignments.id, assignment.id));
      }

      // Update candidate assignedTo
      await db.update(candidates)
        .set({ assignedTo: parsedHrMemberId, status: "screening", updatedAt: new Date() })
        .where(eq(candidates.id, candidateId));
    }

    const [assignment] = await db.insert(hrAssignments).values({
      type: "CANDIDATE",
      assigneeId: candidateId,
      hrMemberId: parsedHrMemberId,
      assignedBy: req.user?.id,
      role: role || "PRIMARY",
      notes,
      status: "ACTIVE",
    }).returning();

    res.json(assignment);
  } catch (error) {
    console.error("Assign sourcer error:", error);
    res.status(500).json({ error: "Failed to assign sourcer" });
  }
});

router.post("/candidates/bulk-assign", async (req: Request, res: Response) => {
  try {
    const { candidateIds, sourcerIds } = req.body;
    if (!Array.isArray(candidateIds) || !Array.isArray(sourcerIds) || sourcerIds.length === 0) {
      return res.status(400).json({ error: "Invalid input" });
    }

    // Get sourcer workloads
    const activeAssignments = await db.select().from(hrAssignments)
      .where(and(
        eq(hrAssignments.status, "ACTIVE"),
        inArray(hrAssignments.hrMemberId, sourcerIds.map(id => parseInt(id)))
      ));
    
    const workloadMap = new Map<number, number>();
    sourcerIds.forEach(id => workloadMap.set(parseInt(id), 0));
    activeAssignments.forEach(a => {
      workloadMap.set(a.hrMemberId, (workloadMap.get(a.hrMemberId) || 0) + 1);
    });

    const sortedSourcers = sourcerIds.map(id => ({
      id: parseInt(id),
      load: workloadMap.get(parseInt(id)) || 0
    })).sort((a, b) => a.load - b.load);

    let sourcerIndex = 0;
    const assignments = [];

    for (const candId of candidateIds) {
      const candidateId = parseInt(candId);
      const sourcer = sortedSourcers[sourcerIndex];
      
      // Update candidate
      await db.update(candidates)
        .set({ assignedTo: sourcer.id, status: "screening", updatedAt: new Date() })
        .where(eq(candidates.id, candidateId));

      // Create assignment
      const [assignment] = await db.insert(hrAssignments).values({
        type: "CANDIDATE",
        assigneeId: candidateId,
        hrMemberId: sourcer.id,
        assignedBy: req.user?.id,
        role: "PRIMARY",
        status: "ACTIVE",
        notes: "Bulk auto-assignment",
      }).returning();

      assignments.push(assignment);
      
      // Update local load and rotate
      sourcer.load++;
      sourcerIndex = (sourcerIndex + 1) % sortedSourcers.length;
    }

    res.json({ success: true, count: assignments.length });
  } catch (error) {
    console.error("Bulk assign error:", error);
    res.status(500).json({ error: "Failed to bulk assign" });
  }
});

// AI Scoring - Score single candidate
router.post("/candidates/:id/score", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid candidate ID" });
    }

    // Get candidate
    const [candidate] = await db.select().from(candidates).where(eq(candidates.id, id));

    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    // Get active criteria
    const criteria = await db
      .select()
      .from(hrAiCriteria)
      .where(eq(hrAiCriteria.isActive, true))
      .orderBy(hrAiCriteria.id);

    if (criteria.length === 0) {
      return res.status(400).json({
        error: "No active scoring criteria found. Please configure criteria in Settings.",
      });
    }

    // Import AI scoring service
    const { AIScoringService } = await import('../../services/ai-scoring.js');
    const scoringService = new AIScoringService();

    // Score candidate
    const result = await scoringService.scoreCandidate(candidate, criteria);

    // Update candidate with score (convert 0-100 to 1-5 rating)
    const rating = Math.max(1, Math.min(5, Math.round(result.overallScore / 20)));
    await db
      .update(candidates)
      .set({
        rating,
        notes: candidate.notes
          ? `${candidate.notes}\n\n[AI Score ${new Date().toLocaleDateString()}]: ${result.summary}`
          : `[AI Score ${new Date().toLocaleDateString()}]: ${result.summary}`,
        updatedAt: new Date(),
      })
      .where(eq(candidates.id, id));

    res.json({
      success: true,
      candidateId: id,
      rating,
      ...result,
    });
  } catch (error) {
    console.error("AI scoring error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to score candidate",
    });
  }
});

// AI Scoring - Bulk score candidates
router.post("/candidates/bulk-score", async (req: Request, res: Response) => {
  try {
    const { candidateIds } = req.body;

    if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
      return res.status(400).json({ error: "Invalid candidate IDs. Must be a non-empty array." });
    }

    // Get candidates
    const candidatesData = await db
      .select()
      .from(candidates)
      .where(inArray(candidates.id, candidateIds.map(id => parseInt(id))));

    if (candidatesData.length === 0) {
      return res.status(404).json({ error: "No candidates found" });
    }

    // Get active criteria
    const criteria = await db
      .select()
      .from(hrAiCriteria)
      .where(eq(hrAiCriteria.isActive, true))
      .orderBy(hrAiCriteria.id);

    if (criteria.length === 0) {
      return res.status(400).json({
        error: "No active scoring criteria found. Please configure criteria in Settings.",
      });
    }

    // Import AI scoring service
    const { AIScoringService } = await import('../../services/ai-scoring.js');
    const scoringService = new AIScoringService();

    // Score all candidates
    const results = await scoringService.scoreCandidates(candidatesData, criteria);

    // Update candidates with scores
    const updates = [];
    for (const [candidateId, result] of results.entries()) {
      const candidate = candidatesData.find(c => c.id === candidateId);
      if (!candidate) continue;

      const rating = Math.max(1, Math.min(5, Math.round(result.overallScore / 20)));

      await db
        .update(candidates)
        .set({
          rating,
          notes: candidate.notes
            ? `${candidate.notes}\n\n[AI Score ${new Date().toLocaleDateString()}]: ${result.summary}`
            : `[AI Score ${new Date().toLocaleDateString()}]: ${result.summary}`,
          updatedAt: new Date(),
        })
        .where(eq(candidates.id, candidateId));

      updates.push({
        candidateId,
        rating,
        overallScore: result.overallScore,
        summary: result.summary,
      });
    }

    res.json({
      success: true,
      scored: updates.length,
      results: updates,
    });
  } catch (error) {
    console.error("Bulk AI scoring error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to score candidates",
    });
  }
});

// Bulk Email Campaign
router.post("/candidates/bulk-email", async (req: Request, res: Response) => {
  try {
    const { candidateIds, templateId, subject, customBody } = req.body;

    if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
      return res.status(400).json({ error: "Invalid candidate IDs. Must be a non-empty array." });
    }

    // Get candidates
    const candidatesData = await db
      .select()
      .from(candidates)
      .where(inArray(candidates.id, candidateIds.map(id => parseInt(id))));

    if (candidatesData.length === 0) {
      return res.status(404).json({ error: "No candidates found" });
    }

    // Get email template if provided
    let emailSubject = subject || "Update from Roof ER";
    let emailBody = customBody || "";

    if (templateId) {
      const [template] = await db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.id, parseInt(templateId)));

      if (template) {
        emailSubject = subject || template.subject;
        emailBody = customBody || template.body;
      }
    }

    let successCount = 0;
    let failureCount = 0;
    const results = [];

    // Send email to each candidate
    for (const candidate of candidatesData) {
      try {
        // Personalize email
        const personalizedSubject = emailSubject
          .replace(/\{firstName\}/g, candidate.firstName)
          .replace(/\{lastName\}/g, candidate.lastName)
          .replace(/\{position\}/g, candidate.position);

        const personalizedBody = emailBody
          .replace(/\{firstName\}/g, candidate.firstName)
          .replace(/\{lastName\}/g, candidate.lastName)
          .replace(/\{position\}/g, candidate.position);

        // Send using candidate status email function (repurposed for bulk)
        await sendCandidateStatusEmail(
          candidate,
          candidate.status,
          candidate.status
        );

        successCount++;
        results.push({
          candidateId: candidate.id,
          email: candidate.email,
          status: 'sent'
        });
      } catch (error) {
        console.error(`Failed to send email to ${candidate.email}:`, error);
        failureCount++;
        results.push({
          candidateId: candidate.id,
          email: candidate.email,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    res.json({
      success: true,
      sent: successCount,
      failed: failureCount,
      total: candidatesData.length,
      results
    });
  } catch (error) {
    console.error("Bulk email error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to send bulk emails",
    });
  }
});

// Interviews
router.get("/interviews", async (req: Request, res: Response) => {
  try {
    const candidateId = typeof req.query.candidateId === "string" ? parseInt(req.query.candidateId, 10) : undefined;
    const status = typeof req.query.status === "string" ? req.query.status : undefined;

    const filters = [];
    if (!Number.isNaN(candidateId) && candidateId !== undefined) {
      filters.push(eq(interviews.candidateId, candidateId));
    }
    if (status && status !== "all") {
      filters.push(eq(interviews.status, status as any));
    }

    const query = filters.length
      ? db.select().from(interviews).where(and(...filters))
      : db.select().from(interviews);

    const rows = await query.orderBy(desc(interviews.scheduledAt));

    const candidateIds = Array.from(new Set(rows.map((row) => row.candidateId)));
    const interviewerIds = Array.from(
      new Set(rows.map((row) => row.interviewerId).filter(Boolean) as number[])
    );

    const candidateRows = candidateIds.length
      ? await db.select({
          id: candidates.id,
          firstName: candidates.firstName,
          lastName: candidates.lastName,
          position: candidates.position,
        }).from(candidates).where(inArray(candidates.id, candidateIds))
      : [];

    const interviewerRows = interviewerIds.length
      ? await db.select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        }).from(users).where(inArray(users.id, interviewerIds))
      : [];

    const candidateLookup = new Map(candidateRows.map((row) => [
      row.id,
      { name: `${row.firstName} ${row.lastName}`, position: row.position },
    ]));
    const interviewerLookup = new Map(interviewerRows.map((row) => [
      row.id,
      `${row.firstName || ""} ${row.lastName || ""}`.trim() || row.email,
    ]));

    res.json(rows.map((row) => ({
      ...row,
      candidateName: candidateLookup.get(row.candidateId)?.name || "Unknown",
      candidatePosition: candidateLookup.get(row.candidateId)?.position || "",
      interviewerName: row.interviewerId ? interviewerLookup.get(row.interviewerId) || "Unassigned" : "Unassigned",
    })));
  } catch (error) {
    console.error("Interviews fetch error:", error);
    res.status(500).json({ error: "HR interviews error (500)" });
  }
});

router.post("/interviews", async (req: Request, res: Response) => {
  try {
    const {
      candidateId,
      interviewerId,
      scheduledAt,
      duration,
      type,
      status,
      location,
      meetingLink,
      rating,
      notes,
      feedback,
      recommendation,
    } = req.body;

    const parsedCandidateId = parseInt(candidateId, 10);
    if (Number.isNaN(parsedCandidateId) || !scheduledAt) {
      return res.status(400).json({ error: "Candidate and scheduled time are required" });
    }

    const scheduledDate = new Date(scheduledAt);
    if (Number.isNaN(scheduledDate.getTime())) {
      return res.status(400).json({ error: "Invalid interview date" });
    }

    const [newInterview] = await db.insert(interviews).values({
      candidateId: parsedCandidateId,
      interviewerId: interviewerId ? parseInt(interviewerId, 10) : null,
      scheduledAt: scheduledDate,
      duration: duration ? parseInt(duration, 10) : 60,
      type: type || "video",
      status: status || "scheduled",
      location,
      meetingLink,
      rating: rating ? parseInt(rating, 10) : null,
      notes,
      feedback,
      recommendation,
    }).returning();

    await db.update(candidates)
      .set({ status: "interview", updatedAt: new Date() })
      .where(and(eq(candidates.id, parsedCandidateId), sql`${candidates.status} NOT IN ('hired', 'rejected')`));

    // Send interview scheduled email
    const [candidate] = await db.select().from(candidates)
      .where(eq(candidates.id, parsedCandidateId))
      .limit(1);

    if (candidate) {
      sendInterviewScheduledEmail(candidate, newInterview).catch(err => {
        console.error('Failed to send interview scheduled email:', err);
      });
    }

    res.status(201).json(newInterview);
  } catch (error) {
    console.error("Create interview error:", error);
    res.status(500).json({ error: "HR interviews error (500)" });
  }
});

router.patch("/interviews/:id", async (req: Request, res: Response) => {
  try {
    const interviewId = parseInt(req.params.id, 10);
    if (Number.isNaN(interviewId)) {
      return res.status(400).json({ error: "Invalid interview id" });
    }

    const {
      interviewerId,
      scheduledAt,
      duration,
      type,
      status,
      location,
      meetingLink,
      rating,
      notes,
      feedback,
      recommendation,
    } = req.body;

    const update: Record<string, any> = { updatedAt: new Date() };
    if (interviewerId !== undefined) update.interviewerId = interviewerId ? parseInt(interviewerId, 10) : null;
    if (scheduledAt !== undefined) {
      const scheduledDate = new Date(scheduledAt);
      if (Number.isNaN(scheduledDate.getTime())) {
        return res.status(400).json({ error: "Invalid interview date" });
      }
      update.scheduledAt = scheduledDate;
    }
    if (duration !== undefined) update.duration = duration ? parseInt(duration, 10) : null;
    if (type !== undefined) update.type = type;
    if (status !== undefined) update.status = status;
    if (location !== undefined) update.location = location;
    if (meetingLink !== undefined) update.meetingLink = meetingLink;
    if (rating !== undefined) update.rating = rating ? parseInt(rating, 10) : null;
    if (notes !== undefined) update.notes = notes;
    if (feedback !== undefined) update.feedback = feedback;
    if (recommendation !== undefined) update.recommendation = recommendation;

    // Get current interview to check for status changes
    const [currentInterview] = await db.select().from(interviews)
      .where(eq(interviews.id, interviewId))
      .limit(1);

    if (!currentInterview) {
      return res.status(404).json({ error: "Interview not found" });
    }

    const [updated] = await db.update(interviews)
      .set(update)
      .where(eq(interviews.id, interviewId))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Interview not found" });
    }

    // Trigger INTERVIEW_COMPLETED workflows if status changed to "completed"
    if (status === 'completed' && currentInterview.status !== 'completed') {
      workflowExecutor.onInterviewCompleted(
        interviewId,
        updated.candidateId,
        (req as any).session?.userId
      ).catch(err => {
        console.error('[Workflow] Failed to trigger interview completed workflows:', err);
      });
    }

    // Send no-show email if status changed to "no_show"
    if (status === 'no_show' && currentInterview.status !== 'no_show') {
      const [candidate] = await db.select().from(candidates)
        .where(eq(candidates.id, updated.candidateId))
        .limit(1);

      if (candidate) {
        sendNoShowEmail(
          {
            id: candidate.id,
            firstName: candidate.firstName,
            lastName: candidate.lastName,
            email: candidate.email,
            position: candidate.position,
          },
          updated.scheduledAt.toISOString()
        ).catch(err => {
          console.error('Failed to send no-show email:', err);
        });
      }
    }

    res.json(updated);
  } catch (error) {
    console.error("Update interview error:", error);
    res.status(500).json({ error: "HR interviews error (500)" });
  }
});

router.delete("/interviews/:id", async (req: Request, res: Response) => {
  try {
    const interviewId = parseInt(req.params.id, 10);
    if (Number.isNaN(interviewId)) {
      return res.status(400).json({ error: "Invalid interview id" });
    }

    const [deleted] = await db.delete(interviews)
      .where(eq(interviews.id, interviewId))
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: "Interview not found" });
    }

    res.json(deleted);
  } catch (error) {
    console.error("Delete interview error:", error);
    res.status(500).json({ error: "HR interviews error (500)" });
  }
});

// Interview Scorecards
router.get("/scorecards", async (req: Request, res: Response) => {
  try {
    const scorecards = await db
      .select()
      .from(interviewScorecards)
      .where(eq(interviewScorecards.isActive, true))
      .orderBy(desc(interviewScorecards.createdAt));

    res.json(scorecards);
  } catch (error) {
    console.error("Fetch scorecards error:", error);
    res.status(500).json({ error: "Failed to fetch scorecards" });
  }
});

router.post("/scorecards", async (req: Request, res: Response) => {
  try {
    const { name, description, criteria, jobPostingId } = req.body;

    if (!name || !criteria || !Array.isArray(criteria)) {
      return res.status(400).json({ error: "Name and criteria are required" });
    }

    const [scorecard] = await db
      .insert(interviewScorecards)
      .values({
        name,
        description: description || null,
        criteria,
        jobPostingId: jobPostingId ? parseInt(jobPostingId) : null,
        createdBy: req.user?.id || null,
      })
      .returning();

    res.status(201).json(scorecard);
  } catch (error) {
    console.error("Create scorecard error:", error);
    res.status(500).json({ error: "Failed to create scorecard" });
  }
});

router.get("/scorecards/:id", async (req: Request, res: Response) => {
  try {
    const scorecardId = parseInt(req.params.id, 10);
    if (Number.isNaN(scorecardId)) {
      return res.status(400).json({ error: "Invalid scorecard id" });
    }

    const [scorecard] = await db
      .select()
      .from(interviewScorecards)
      .where(eq(interviewScorecards.id, scorecardId));

    if (!scorecard) {
      return res.status(404).json({ error: "Scorecard not found" });
    }

    res.json(scorecard);
  } catch (error) {
    console.error("Fetch scorecard error:", error);
    res.status(500).json({ error: "Failed to fetch scorecard" });
  }
});

router.patch("/scorecards/:id", async (req: Request, res: Response) => {
  try {
    const scorecardId = parseInt(req.params.id, 10);
    if (Number.isNaN(scorecardId)) {
      return res.status(400).json({ error: "Invalid scorecard id" });
    }

    const { name, description, criteria, isActive, jobPostingId } = req.body;

    const update: Record<string, any> = { updatedAt: new Date() };
    if (name !== undefined) update.name = name;
    if (description !== undefined) update.description = description;
    if (criteria !== undefined) update.criteria = criteria;
    if (isActive !== undefined) update.isActive = isActive;
    if (jobPostingId !== undefined) update.jobPostingId = jobPostingId ? parseInt(jobPostingId) : null;

    const [updated] = await db
      .update(interviewScorecards)
      .set(update)
      .where(eq(interviewScorecards.id, scorecardId))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Scorecard not found" });
    }

    res.json(updated);
  } catch (error) {
    console.error("Update scorecard error:", error);
    res.status(500).json({ error: "Failed to update scorecard" });
  }
});

router.delete("/scorecards/:id", async (req: Request, res: Response) => {
  try {
    const scorecardId = parseInt(req.params.id, 10);
    if (Number.isNaN(scorecardId)) {
      return res.status(400).json({ error: "Invalid scorecard id" });
    }

    // Soft delete by setting isActive to false
    const [deleted] = await db
      .update(interviewScorecards)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(interviewScorecards.id, scorecardId))
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: "Scorecard not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Delete scorecard error:", error);
    res.status(500).json({ error: "Failed to delete scorecard" });
  }
});

// Get equipment
router.get("/equipment", async (req: Request, res: Response) => {
  try {
    const items = await db.select().from(equipment).orderBy(desc(equipment.createdAt));
    res.json(items);
  } catch (error) {
    console.error("Equipment fetch error:", error);
    res.json([]);
  }
});

// Create equipment
router.post("/equipment", async (req: Request, res: Response) => {
  try {
    const {
      name,
      type,
      serialNumber,
      assignedTo,
      status,
      purchaseDate,
      purchasePrice,
      notes,
    } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: "Missing required equipment fields" });
    }

    const [newItem] = await db.insert(equipment).values({
      name,
      type,
      serialNumber,
      assignedTo,
      status: status || "available",
      purchaseDate,
      purchasePrice,
      notes,
    }).returning();

    res.status(201).json(newItem);
  } catch (error) {
    console.error("Create equipment error:", error);
    res.status(500).json({ error: "Failed to create equipment" });
  }
});

// ============================================================================
// INVENTORY ROUTES - Bulk consumable items (shirts, supplies, etc.)
// ============================================================================

// Get all inventory with optional filters
router.get("/inventory", async (req: Request, res: Response) => {
  try {
    const { category, lowStock } = req.query;

    let query = db.select().from(inventory);
    const conditions = [];

    // Filter by category if provided
    if (category && typeof category === 'string') {
      conditions.push(eq(inventory.category, category as any));
    }

    // Filter for low stock items if requested
    if (lowStock === 'true') {
      conditions.push(
        sql`${inventory.quantity} <= COALESCE(${inventory.reorderThreshold}, 0)`
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const items = await query.orderBy(desc(inventory.lastUpdated));
    res.json(items);
  } catch (error) {
    console.error("Inventory fetch error:", error);
    res.status(500).json({ error: "Failed to fetch inventory" });
  }
});

// Get inventory statistics by category
router.get("/inventory/stats", async (req: Request, res: Response) => {
  try {
    const stats = await db
      .select({
        category: inventory.category,
        totalItems: sql<number>`count(*)`,
        totalQuantity: sql<number>`sum(${inventory.quantity})`,
        lowStockCount: sql<number>`sum(case when ${inventory.quantity} <= COALESCE(${inventory.reorderThreshold}, 0) then 1 else 0 end)`,
      })
      .from(inventory)
      .groupBy(inventory.category);

    res.json(stats);
  } catch (error) {
    console.error("Inventory stats error:", error);
    res.status(500).json({ error: "Failed to fetch inventory statistics" });
  }
});

// Get single inventory item
router.get("/inventory/:id", async (req: Request, res: Response) => {
  try {
    const itemId = parseInt(req.params.id, 10);
    if (Number.isNaN(itemId)) {
      return res.status(400).json({ error: "Invalid inventory item ID" });
    }

    const [item] = await db
      .select()
      .from(inventory)
      .where(eq(inventory.id, itemId))
      .limit(1);

    if (!item) {
      return res.status(404).json({ error: "Inventory item not found" });
    }

    res.json(item);
  } catch (error) {
    console.error("Inventory item fetch error:", error);
    res.status(500).json({ error: "Failed to fetch inventory item" });
  }
});

// Create new inventory item
router.post("/inventory", async (req: Request, res: Response) => {
  try {
    const {
      name,
      category,
      color,
      size,
      quantity,
      location,
      notes,
      reorderThreshold,
    } = req.body;

    if (!name || !category) {
      return res.status(400).json({ error: "Name and category are required" });
    }

    if (quantity !== undefined && (typeof quantity !== 'number' || quantity < 0)) {
      return res.status(400).json({ error: "Quantity must be a non-negative number" });
    }

    const [newItem] = await db
      .insert(inventory)
      .values({
        name,
        category,
        color: color || null,
        size: size || null,
        quantity: quantity || 0,
        location: location || null,
        notes: notes || null,
        reorderThreshold: reorderThreshold || null,
      })
      .returning();

    res.status(201).json(newItem);
  } catch (error) {
    console.error("Create inventory error:", error);
    res.status(500).json({ error: "Failed to create inventory item" });
  }
});

// Update inventory item
router.put("/inventory/:id", async (req: Request, res: Response) => {
  try {
    const itemId = parseInt(req.params.id, 10);
    if (Number.isNaN(itemId)) {
      return res.status(400).json({ error: "Invalid inventory item ID" });
    }

    const {
      name,
      category,
      color,
      size,
      quantity,
      location,
      notes,
      reorderThreshold,
    } = req.body;

    if (quantity !== undefined && (typeof quantity !== 'number' || quantity < 0)) {
      return res.status(400).json({ error: "Quantity must be a non-negative number" });
    }

    const updateData: Record<string, any> = {
      lastUpdated: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (category !== undefined) updateData.category = category;
    if (color !== undefined) updateData.color = color;
    if (size !== undefined) updateData.size = size;
    if (quantity !== undefined) updateData.quantity = quantity;
    if (location !== undefined) updateData.location = location;
    if (notes !== undefined) updateData.notes = notes;
    if (reorderThreshold !== undefined) updateData.reorderThreshold = reorderThreshold;

    const [updated] = await db
      .update(inventory)
      .set(updateData)
      .where(eq(inventory.id, itemId))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Inventory item not found" });
    }

    res.json(updated);
  } catch (error) {
    console.error("Update inventory error:", error);
    res.status(500).json({ error: "Failed to update inventory item" });
  }
});

// Delete inventory item
router.delete("/inventory/:id", async (req: Request, res: Response) => {
  try {
    const itemId = parseInt(req.params.id, 10);
    if (Number.isNaN(itemId)) {
      return res.status(400).json({ error: "Invalid inventory item ID" });
    }

    const [deleted] = await db
      .delete(inventory)
      .where(eq(inventory.id, itemId))
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: "Inventory item not found" });
    }

    res.json({ success: true, message: "Inventory item deleted successfully" });
  } catch (error) {
    console.error("Delete inventory error:", error);
    res.status(500).json({ error: "Failed to delete inventory item" });
  }
});

// Bulk create/update inventory items
router.post("/inventory/bulk", async (req: Request, res: Response) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Items array is required and must not be empty" });
    }

    // Validate all items
    for (const item of items) {
      if (!item.name || !item.category) {
        return res.status(400).json({ error: "Each item must have name and category" });
      }
      if (item.quantity !== undefined && (typeof item.quantity !== 'number' || item.quantity < 0)) {
        return res.status(400).json({ error: "Quantity must be a non-negative number" });
      }
    }

    // Process items
    const results = [];
    for (const item of items) {
      if (item.id) {
        // Update existing item
        const [updated] = await db
          .update(inventory)
          .set({
            name: item.name,
            category: item.category,
            color: item.color || null,
            size: item.size || null,
            quantity: item.quantity || 0,
            location: item.location || null,
            notes: item.notes || null,
            reorderThreshold: item.reorderThreshold || null,
            lastUpdated: new Date(),
          })
          .where(eq(inventory.id, item.id))
          .returning();

        if (updated) {
          results.push({ action: 'updated', item: updated });
        }
      } else {
        // Create new item
        const [created] = await db
          .insert(inventory)
          .values({
            name: item.name,
            category: item.category,
            color: item.color || null,
            size: item.size || null,
            quantity: item.quantity || 0,
            location: item.location || null,
            notes: item.notes || null,
            reorderThreshold: item.reorderThreshold || null,
          })
          .returning();

        results.push({ action: 'created', item: created });
      }
    }

    res.status(201).json({
      success: true,
      message: `Processed ${results.length} items`,
      results,
    });
  } catch (error) {
    console.error("Bulk inventory operation error:", error);
    res.status(500).json({ error: "Failed to process bulk inventory operation" });
  }
});

// Get contracts
router.get("/contracts", async (req: Request, res: Response) => {
  try {
    const allContracts = await db.select().from(contracts).orderBy(desc(contracts.createdAt));

    const employeeIds = Array.from(
      new Set(allContracts.map((contract) => contract.employeeId).filter(Boolean) as number[])
    );
    const candidateIds = Array.from(
      new Set(allContracts.map((contract) => contract.candidateId).filter(Boolean) as number[])
    );

    const employeeRows = employeeIds.length
      ? await db.select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        }).from(users).where(inArray(users.id, employeeIds))
      : [];

    const candidateRows = candidateIds.length
      ? await db.select({
          id: candidates.id,
          firstName: candidates.firstName,
          lastName: candidates.lastName,
          email: candidates.email,
        }).from(candidates).where(inArray(candidates.id, candidateIds))
      : [];

    const employeeLookup = new Map(employeeRows.map((row) => [
      row.id,
      { name: `${row.firstName || ""} ${row.lastName || ""}`.trim(), email: row.email },
    ]));
    const candidateLookup = new Map(candidateRows.map((row) => [
      row.id,
      { name: `${row.firstName || ""} ${row.lastName || ""}`.trim(), email: row.email },
    ]));

    const formattedContracts = allContracts.map((contract) => {
      const recipient = contract.employeeId
        ? employeeLookup.get(contract.employeeId)
        : contract.candidateId
          ? candidateLookup.get(contract.candidateId)
          : null;

      return {
        id: contract.id,
        employeeId: contract.employeeId,
        candidateId: contract.candidateId,
        recipientName: recipient?.name || "Unknown",
        recipientEmail: recipient?.email || "",
        title: contract.title,
        status: contract.status,
        sentDate: contract.sentDate,
        signedDate: contract.signedDate,
        fileUrl: contract.fileUrl,
        createdAt: contract.createdAt,
      };
    });

    res.json(formattedContracts);
  } catch (error) {
    console.error("Contracts fetch error:", error);
    res.json([]);
  }
});

// Get contract templates
router.get("/contract-templates", async (req: Request, res: Response) => {
  res.json(contractTemplates);
});

// Create contract
router.post("/contracts", async (req: Request, res: Response) => {
  try {
    const { templateId, employeeId, candidateId } = req.body;
    const template = contractTemplates.find((item) => item.id === templateId && item.isActive);
    const parsedEmployeeId = employeeId ? parseInt(employeeId) : null;
    const parsedCandidateId = candidateId ? parseInt(candidateId) : null;

    if (!template) {
      return res.status(400).json({ error: "Invalid contract template" });
    }

    if (!employeeId && !candidateId) {
      return res.status(400).json({ error: "Employee or candidate is required" });
    }

    if ((employeeId && Number.isNaN(parsedEmployeeId)) || (candidateId && Number.isNaN(parsedCandidateId))) {
      return res.status(400).json({ error: "Invalid recipient identifier" });
    }

    const [newContract] = await db.insert(contracts).values({
      employeeId: parsedEmployeeId,
      candidateId: parsedCandidateId,
      title: template.name,
      content: template.content,
      status: "DRAFT",
    }).returning();

    res.status(201).json(newContract);
  } catch (error) {
    console.error("Create contract error:", error);
    res.status(500).json({ error: "Failed to create contract" });
  }
});

// Send contract
router.post("/contracts/:id/send", async (req: Request, res: Response) => {
  try {
    const contractId = parseInt(req.params.id);
    if (Number.isNaN(contractId)) {
      return res.status(400).json({ error: "Invalid contract id" });
    }

    const [updated] = await db.update(contracts)
      .set({ status: "SENT", sentDate: new Date(), updatedAt: new Date() })
      .where(eq(contracts.id, contractId))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Contract not found" });
    }

    res.json(updated);
  } catch (error) {
    console.error("Send contract error:", error);
    res.status(500).json({ error: "Failed to send contract" });
  }
});

// Documents
router.get("/documents", async (req: Request, res: Response) => {
  try {
    const category = typeof req.query.category === "string" ? req.query.category : undefined;
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const visibility = typeof req.query.visibility === "string" ? req.query.visibility : undefined;
    const search = typeof req.query.search === "string" ? req.query.search.toLowerCase() : "";

    const allDocuments = await db.select().from(documents).orderBy(desc(documents.createdAt));
    const filtered = allDocuments.filter((doc) => {
      if (!canAccessDocument(doc.visibility, req.user?.role)) return false;
      if (category && category !== "ALL" && doc.category !== category) return false;
      if (status && status !== "ALL" && doc.status !== status) return false;
      if (visibility && visibility !== "ALL" && doc.visibility !== visibility) return false;
      if (search) {
        const haystack = `${doc.name} ${doc.description || ""} ${(doc.tags || []).join(" ")}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });

    if (!req.user?.id || filtered.length === 0) {
      return res.json(filtered);
    }

    const docIds = filtered.map((doc) => doc.id);
    const acknowledgements = await db.select()
      .from(documentAcknowledgements)
      .where(and(eq(documentAcknowledgements.userId, req.user.id), inArray(documentAcknowledgements.documentId, docIds)));

    const ackedIds = new Set(acknowledgements.map((ack) => ack.documentId));
    res.json(filtered.map((doc) => ({ ...doc, acknowledged: ackedIds.has(doc.id) })));
  } catch (error) {
    console.error("Documents fetch error:", error);
    res.status(500).json({ error: "HR documents error (500)" });
  }
});

router.post("/documents", async (req: Request, res: Response) => {
  try {
    if (!canManageDocuments(req.user?.role)) {
      return res.status(403).json({ error: "Not authorized to create documents" });
    }

    const { name, description, category, type, fileUrl, fileSize, visibility, tags } = req.body;
    const createdBy = req.user?.id;

    if (!name || !fileUrl) {
      return res.status(400).json({ error: "Document name and file URL are required" });
    }

    const [newDocument] = await db.insert(documents).values({
      name,
      description,
      category: category || "OTHER",
      type: type || "OTHER",
      fileUrl,
      fileSize: fileSize || 0,
      visibility: visibility || "EMPLOYEE",
      tags: Array.isArray(tags) ? tags : [],
      createdBy,
      status: "DRAFT",
    }).returning();

    res.status(201).json(newDocument);
  } catch (error) {
    console.error("Create document error:", error);
    res.status(500).json({ error: "HR documents error (500)" });
  }
});

router.patch("/documents/:id", async (req: Request, res: Response) => {
  try {
    if (!canManageDocuments(req.user?.role)) {
      return res.status(403).json({ error: "Not authorized to update documents" });
    }

    const documentId = parseInt(req.params.id, 10);
    if (Number.isNaN(documentId)) {
      return res.status(400).json({ error: "Invalid document id" });
    }

    const { name, description, category, type, fileUrl, fileSize, visibility, tags, status } = req.body;
    const update: Record<string, any> = { updatedAt: new Date() };

    if (name !== undefined) update.name = name;
    if (description !== undefined) update.description = description;
    if (category !== undefined) update.category = category;
    if (type !== undefined) update.type = type;
    if (fileUrl !== undefined) update.fileUrl = fileUrl;
    if (fileSize !== undefined) update.fileSize = fileSize;
    if (visibility !== undefined) update.visibility = visibility;
    if (status !== undefined) update.status = status;
    if (tags !== undefined) update.tags = Array.isArray(tags) ? tags : [];

    const [updated] = await db.update(documents)
      .set(update)
      .where(eq(documents.id, documentId))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Document not found" });
    }

    res.json(updated);
  } catch (error) {
    console.error("Update document error:", error);
    res.status(500).json({ error: "HR documents error (500)" });
  }
});

router.get("/documents/:id/download", async (req: Request, res: Response) => {
  try {
    const documentId = parseInt(req.params.id);
    if (Number.isNaN(documentId)) {
      return res.status(400).json({ error: "Invalid document id" });
    }

    const [doc] = await db.select().from(documents).where(eq(documents.id, documentId));
    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }
    if (!canAccessDocument(doc.visibility, req.user?.role)) {
      return res.status(403).json({ error: "Not authorized to access document" });
    }

    await db.update(documents)
      .set({ downloadCount: (doc.downloadCount || 0) + 1, updatedAt: new Date() })
      .where(eq(documents.id, documentId));

    res.json({ fileUrl: doc.fileUrl });
  } catch (error) {
    console.error("Document download error:", error);
    res.status(500).json({ error: "HR documents error (500)" });
  }
});

router.post("/documents/:id/acknowledge", async (req: Request, res: Response) => {
  try {
    const documentId = parseInt(req.params.id);
    if (Number.isNaN(documentId)) {
      return res.status(400).json({ error: "Invalid document id" });
    }

    const { signature, notes } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const [doc] = await db.select().from(documents).where(eq(documents.id, documentId));
    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }
    if (!canAccessDocument(doc.visibility, req.user?.role)) {
      return res.status(403).json({ error: "Not authorized to access document" });
    }

    const existing = await db.select()
      .from(documentAcknowledgements)
      .where(and(eq(documentAcknowledgements.userId, userId), eq(documentAcknowledgements.documentId, documentId)));

    const acknowledgedAt = new Date();

    if (existing.length > 0) {
      await db.update(documentAssignments)
        .set({ status: "acknowledged", acknowledgedAt, updatedAt: new Date() })
        .where(and(eq(documentAssignments.documentId, documentId), eq(documentAssignments.userId, userId)));
      return res.json(existing[0]);
    }

    const [ack] = await db.insert(documentAcknowledgements).values({
      documentId,
      userId,
      signature,
      notes,
      acknowledgedAt,
    }).returning();

    await db.update(documentAssignments)
      .set({ status: "acknowledged", acknowledgedAt, updatedAt: new Date() })
      .where(and(eq(documentAssignments.documentId, documentId), eq(documentAssignments.userId, userId)));

    res.json(ack);
  } catch (error) {
    console.error("Document acknowledge error:", error);
    res.status(500).json({ error: "HR documents error (500)" });
  }
});

router.get("/documents/acknowledgements", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const isManagerView = canManageDocuments(req.user.role);
    const query = isManagerView
      ? db.select().from(documentAcknowledgements)
      : db.select().from(documentAcknowledgements).where(eq(documentAcknowledgements.userId, req.user.id));

    const ackRows = await query.orderBy(desc(documentAcknowledgements.acknowledgedAt));
    const documentIds = Array.from(new Set(ackRows.map((row) => row.documentId)));
    const userIds = Array.from(new Set(ackRows.map((row) => row.userId)));

    const documentRows = documentIds.length
      ? await db.select({
          id: documents.id,
          name: documents.name,
          visibility: documents.visibility,
          status: documents.status,
        }).from(documents).where(inArray(documents.id, documentIds))
      : [];

    const userRows = userIds.length
      ? await db.select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        }).from(users).where(inArray(users.id, userIds))
      : [];

    const documentLookup = new Map(documentRows.map((row) => [
      row.id,
      { name: row.name, visibility: row.visibility, status: row.status },
    ]));
    const userLookup = new Map(userRows.map((row) => [
      row.id,
      `${row.firstName || ""} ${row.lastName || ""}`.trim() || row.email,
    ]));

    const acknowledgements = ackRows.map((row) => ({
      ...row,
      documentName: documentLookup.get(row.documentId)?.name || "Document",
      documentVisibility: documentLookup.get(row.documentId)?.visibility || "EMPLOYEE",
      documentStatus: documentLookup.get(row.documentId)?.status || "DRAFT",
      userName: userLookup.get(row.userId) || "Employee",
    }));

    if (!isManagerView) {
      return res.json({ acknowledgements });
    }

    const summary = documentIds.map((docId) => {
      const docInfo = documentLookup.get(docId);
      const count = ackRows.filter((row) => row.documentId === docId).length;
      return {
        documentId: docId,
        name: docInfo?.name || "Document",
        visibility: docInfo?.visibility || "EMPLOYEE",
        status: docInfo?.status || "DRAFT",
        acknowledgedCount: count,
      };
    });

    const [employeeCount] = await db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.isActive, true));

    res.json({
      acknowledgements,
      summary,
      totalEmployees: Number(employeeCount?.count || 0),
    });
  } catch (error) {
    console.error("Document acknowledgements error:", error);
    res.status(500).json({ error: "HR documents error (500)" });
  }
});

router.get("/documents/assignments", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const isManagerView = canManageDocuments(req.user.role);
    const query = isManagerView
      ? db.select().from(documentAssignments)
      : db.select().from(documentAssignments).where(eq(documentAssignments.userId, req.user.id));

    const assignments = await query.orderBy(desc(documentAssignments.assignedAt));
    const documentIds = Array.from(new Set(assignments.map((row) => row.documentId)));
    const userIds = Array.from(new Set(assignments.map((row) => row.userId)));

    const documentRows = documentIds.length
      ? await db.select({
          id: documents.id,
          name: documents.name,
          visibility: documents.visibility,
          status: documents.status,
          fileUrl: documents.fileUrl,
        }).from(documents).where(inArray(documents.id, documentIds))
      : [];

    const userRows = userIds.length
      ? await db.select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        }).from(users).where(inArray(users.id, userIds))
      : [];

    const documentLookup = new Map(documentRows.map((row) => [
      row.id,
      {
        name: row.name,
        visibility: row.visibility,
        status: row.status,
        fileUrl: row.fileUrl,
      },
    ]));
    const userLookup = new Map(userRows.map((row) => [
      row.id,
      `${row.firstName || ""} ${row.lastName || ""}`.trim() || row.email,
    ]));

    const now = new Date();
    const payload = assignments.map((assignment) => {
      const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null;
      let status = assignment.status;
      if (assignment.acknowledgedAt) {
        status = "acknowledged";
      } else if (dueDate && dueDate.getTime() < now.getTime()) {
        status = "overdue";
      } else {
        status = "assigned";
      }

      return {
        ...assignment,
        status,
        documentName: documentLookup.get(assignment.documentId)?.name || "Document",
        documentVisibility: documentLookup.get(assignment.documentId)?.visibility || "EMPLOYEE",
        documentStatus: documentLookup.get(assignment.documentId)?.status || "DRAFT",
        documentFileUrl: documentLookup.get(assignment.documentId)?.fileUrl || null,
        userName: userLookup.get(assignment.userId) || "Employee",
      };
    });

    res.json({ assignments: payload });
  } catch (error) {
    console.error("Document assignments fetch error:", error);
    res.status(500).json({ error: "HR document assignments error (500)" });
  }
});

router.post("/documents/assignments", async (req: Request, res: Response) => {
  try {
    if (!canManageDocuments(req.user?.role)) {
      return res.status(403).json({ error: "Not authorized to assign documents" });
    }

    const { documentId, userIds, dueDate, assignAll } = req.body;
    const parsedDocumentId = parseInt(documentId, 10);

    if (Number.isNaN(parsedDocumentId)) {
      return res.status(400).json({ error: "Document id is required" });
    }

    const targetUserIds = assignAll
      ? (await db.select({ id: users.id }).from(users).where(eq(users.isActive, true))).map((row) => row.id)
      : Array.isArray(userIds)
        ? userIds.map((id) => parseInt(id, 10)).filter((id) => !Number.isNaN(id))
        : [];

    if (targetUserIds.length === 0) {
      return res.status(400).json({ error: "At least one employee is required" });
    }

    const existing = await db.select()
      .from(documentAssignments)
      .where(and(eq(documentAssignments.documentId, parsedDocumentId), inArray(documentAssignments.userId, targetUserIds)));

    const existingSet = new Set(existing.map((row) => row.userId));
    const assignedBy = req.user?.id || null;
    const parsedDueDate = dueDate ? new Date(dueDate) : null;
    if (parsedDueDate && Number.isNaN(parsedDueDate.getTime())) {
      return res.status(400).json({ error: "Invalid due date" });
    }

    const newAssignments = targetUserIds
      .filter((id) => !existingSet.has(id))
      .map((userId) => ({
        documentId: parsedDocumentId,
        userId,
        assignedBy,
        dueDate: parsedDueDate,
        status: "assigned" as const,
        assignedAt: new Date(),
        updatedAt: new Date(),
      }));

    if (newAssignments.length === 0) {
      return res.json({ created: 0 });
    }

    await db.insert(documentAssignments).values(newAssignments);
    res.status(201).json({ created: newAssignments.length });
  } catch (error) {
    console.error("Document assignments create error:", error);
    res.status(500).json({ error: "HR document assignments error (500)" });
  }
});

// Reviews
router.get("/reviews", async (req: Request, res: Response) => {
  try {
    const reviews = await db.select().from(employeeReviews).orderBy(desc(employeeReviews.createdAt));
    const employeeIds = Array.from(new Set(reviews.map((review) => review.employeeId)));
    const reviewerIds = Array.from(
      new Set(reviews.map((review) => review.reviewerId).filter(Boolean) as number[])
    );

    const people = await db.select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
    }).from(users).where(inArray(users.id, [...employeeIds, ...reviewerIds]));

    const peopleLookup = new Map(people.map((person) => [
      person.id,
      { name: `${person.firstName || ""} ${person.lastName || ""}`.trim(), email: person.email },
    ]));

    res.json(reviews.map((review) => ({
      ...review,
      employeeName: peopleLookup.get(review.employeeId)?.name || "Unknown",
      reviewerName: review.reviewerId ? peopleLookup.get(review.reviewerId)?.name || "Unknown" : "Unassigned",
    })));
  } catch (error) {
    console.error("Reviews fetch error:", error);
    res.status(500).json({ error: "HR reviews error (500)" });
  }
});

router.post("/reviews", async (req: Request, res: Response) => {
  try {
    const { employeeId, periodStart, periodEnd, rating, summary, status } = req.body;
    const reviewerId = req.user?.id;

    if (!employeeId) {
      return res.status(400).json({ error: "Employee is required" });
    }

    const [newReview] = await db.insert(employeeReviews).values({
      employeeId: parseInt(employeeId),
      reviewerId,
      periodStart,
      periodEnd,
      rating,
      summary,
      status: status || "draft",
    }).returning();

    res.status(201).json(newReview);
  } catch (error) {
    console.error("Create review error:", error);
    res.status(500).json({ error: "HR reviews error (500)" });
  }
});

// Attendance
router.get("/attendance/sessions", async (req: Request, res: Response) => {
  try {
    const sessions = await db.select().from(attendanceSessions).orderBy(desc(attendanceSessions.createdAt));
    const checkIns = await db.select().from(attendanceCheckIns);

    const counts = new Map<number, number>();
    checkIns.forEach((checkIn) => {
      counts.set(checkIn.sessionId, (counts.get(checkIn.sessionId) || 0) + 1);
    });

    res.json(sessions.map((session) => ({
      ...session,
      checkInCount: counts.get(session.id) || 0,
    })));
  } catch (error) {
    console.error("Attendance sessions error:", error);
    res.status(500).json({ error: "HR attendance error (500)" });
  }
});

router.post("/attendance/sessions", async (req: Request, res: Response) => {
  try {
    const { name, sessionDate, location } = req.body;
    const createdBy = req.user?.id;

    if (!name || !sessionDate) {
      return res.status(400).json({ error: "Session name and date are required" });
    }

    const [session] = await db.insert(attendanceSessions).values({
      name,
      sessionDate,
      location,
      createdBy,
      status: "open",
    }).returning();

    res.status(201).json(session);
  } catch (error) {
    console.error("Create attendance session error:", error);
    res.status(500).json({ error: "HR attendance error (500)" });
  }
});

router.get("/attendance/check-ins", async (req: Request, res: Response) => {
  try {
    const sessionIdParam = typeof req.query.sessionId === "string" ? parseInt(req.query.sessionId) : null;
    const checkIns = sessionIdParam
      ? await db.select().from(attendanceCheckIns).where(eq(attendanceCheckIns.sessionId, sessionIdParam))
      : await db.select().from(attendanceCheckIns);

    res.json(checkIns);
  } catch (error) {
    console.error("Attendance check-ins error:", error);
    res.status(500).json({ error: "HR attendance error (500)" });
  }
});

router.post("/attendance/check-in", async (req: Request, res: Response) => {
  try {
    const { sessionId, status, latitude, longitude, locationAddress, locationAccuracy } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const parsedSessionId = parseInt(sessionId);
    if (!sessionId || Number.isNaN(parsedSessionId)) {
      return res.status(400).json({ error: "Session id is required" });
    }

    const existing = await db.select().from(attendanceCheckIns)
      .where(and(eq(attendanceCheckIns.sessionId, parsedSessionId), eq(attendanceCheckIns.userId, userId)));

    if (existing.length > 0) {
      return res.status(400).json({ error: "You already checked in for this session" });
    }

    const [checkIn] = await db.insert(attendanceCheckIns).values({
      sessionId: parsedSessionId,
      userId,
      status: status || "present",
      // GPS location data (optional)
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      locationAddress: locationAddress || null,
      locationAccuracy: locationAccuracy ? parseFloat(locationAccuracy) : null,
    }).returning();

    res.status(201).json(checkIn);
  } catch (error) {
    console.error("Attendance check-in error:", error);
    res.status(500).json({ error: "HR attendance error (500)" });
  }
});

// Meeting rooms
router.get("/meeting-rooms", async (req: Request, res: Response) => {
  try {
    const rooms = await db.select().from(meetingRooms).orderBy(desc(meetingRooms.createdAt));
    res.json(rooms);
  } catch (error) {
    console.error("Meeting rooms fetch error:", error);
    res.status(500).json({ error: "HR meeting rooms error (500)" });
  }
});

router.post("/meeting-rooms", async (req: Request, res: Response) => {
  try {
    const { name, location, capacity, status } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Meeting room name is required" });
    }

    const [room] = await db.insert(meetingRooms).values({
      name,
      location,
      capacity: capacity || 1,
      status: status || "available",
    }).returning();

    res.status(201).json(room);
  } catch (error) {
    console.error("Create meeting room error:", error);
    res.status(500).json({ error: "HR meeting rooms error (500)" });
  }
});

router.get("/meetings", async (req: Request, res: Response) => {
  try {
    const items = await db.select().from(meetings).orderBy(desc(meetings.startTime));
    res.json(items);
  } catch (error) {
    console.error("Meetings fetch error:", error);
    res.status(500).json({ error: "HR meetings error (500)" });
  }
});

router.post("/meetings", async (req: Request, res: Response) => {
  try {
    const { roomId, title, startTime, endTime, meetingLink } = req.body;
    const organizerId = req.user?.id;

    if (!title || !startTime || !endTime) {
      return res.status(400).json({ error: "Meeting title and times are required" });
    }

    const [meeting] = await db.insert(meetings).values({
      roomId: roomId ? parseInt(roomId) : null,
      organizerId,
      title,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      meetingLink,
      status: "scheduled",
    }).returning();

    res.status(201).json(meeting);
  } catch (error) {
    console.error("Create meeting error:", error);
    res.status(500).json({ error: "HR meetings error (500)" });
  }
});

// HR tasks
router.get("/tasks", async (req: Request, res: Response) => {
  try {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const assignedTo = typeof req.query.assignedTo === "string" ? parseInt(req.query.assignedTo, 10) : undefined;
    const search = typeof req.query.search === "string" ? req.query.search.toLowerCase() : "";

    const filters = [];
    if (status && status !== "all") {
      filters.push(eq(hrTasks.status, status as any));
    }
    if (!Number.isNaN(assignedTo) && assignedTo !== undefined) {
      filters.push(eq(hrTasks.assignedTo, assignedTo));
    }

    const query = filters.length
      ? db.select().from(hrTasks).where(and(...filters))
      : db.select().from(hrTasks);

    const tasks = await query.orderBy(desc(hrTasks.createdAt));
    const filtered = search
      ? tasks.filter((task) => {
          const haystack = `${task.title} ${task.description || ""}`.toLowerCase();
          return haystack.includes(search);
        })
      : tasks;

    res.json(filtered);
  } catch (error) {
    console.error("HR tasks fetch error:", error);
    res.status(500).json({ error: "HR tasks error (500)" });
  }
});

router.post("/tasks", async (req: Request, res: Response) => {
  try {
    const { title, description, assignedTo, priority, dueDate, tags, source } = req.body;
    const createdBy = req.user?.id;

    if (!title) {
      return res.status(400).json({ error: "Task title is required" });
    }

    const [task] = await db.insert(hrTasks).values({
      title,
      description,
      assignedTo: assignedTo ? parseInt(assignedTo) : null,
      priority: priority || "medium",
      dueDate: dueDate ? new Date(dueDate) : null,
      tags: Array.isArray(tags) ? tags : [],
      source: source || "manual",
      createdBy,
    }).returning();

    res.status(201).json(task);
  } catch (error) {
    console.error("Create HR task error:", error);
    res.status(500).json({ error: "HR tasks error (500)" });
  }
});

router.patch("/tasks/:id", async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.id);
    if (Number.isNaN(taskId)) {
      return res.status(400).json({ error: "Invalid task id" });
    }

    const { title, description, status, priority, assignedTo, dueDate, tags, source } = req.body;
    const update: any = {
      updatedAt: new Date(),
    };

    if (title !== undefined) update.title = title;
    if (description !== undefined) update.description = description;
    if (status !== undefined) {
      update.status = status;
      update.completedAt = status === "done" ? new Date() : null;
    }
    if (priority !== undefined) update.priority = priority;
    if (assignedTo !== undefined) update.assignedTo = assignedTo ? parseInt(assignedTo) : null;
    if (dueDate !== undefined) update.dueDate = dueDate ? new Date(dueDate) : null;
    if (tags !== undefined) update.tags = Array.isArray(tags) ? tags : [];
    if (source !== undefined) update.source = source;

    const [task] = await db.update(hrTasks).set(update).where(eq(hrTasks.id, taskId)).returning();
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json(task);
  } catch (error) {
    console.error("Update HR task error:", error);
    res.status(500).json({ error: "HR tasks error (500)" });
  }
});

router.delete("/tasks/:id", async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.id);
    if (Number.isNaN(taskId)) {
      return res.status(400).json({ error: "Invalid task id" });
    }

    const [deleted] = await db.delete(hrTasks).where(eq(hrTasks.id, taskId)).returning();
    if (!deleted) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Delete HR task error:", error);
    res.status(500).json({ error: "HR tasks error (500)" });
  }
});

// AI criteria for recruiting
router.get("/ai-criteria", async (_req: Request, res: Response) => {
  try {
    const criteria = await db.select().from(hrAiCriteria).orderBy(desc(hrAiCriteria.updatedAt));
    res.json(criteria);
  } catch (error) {
    console.error("AI criteria fetch error:", error);
    res.status(500).json({ error: "HR AI criteria error (500)" });
  }
});

router.post("/ai-criteria", async (req: Request, res: Response) => {
  try {
    const { name, description, criteria, weight, isActive } = req.body;
    const createdBy = req.user?.id;

    if (!name || !description) {
      return res.status(400).json({ error: "Criteria name and description are required" });
    }

    const list = Array.isArray(criteria)
      ? criteria
      : typeof criteria === "string"
        ? criteria.split("\n").map((item: string) => item.trim()).filter(Boolean)
        : [];

    const [entry] = await db.insert(hrAiCriteria).values({
      name,
      description,
      criteria: list,
      weight: weight ? parseInt(weight, 10) : 3,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      createdBy,
    }).returning();

    res.status(201).json(entry);
  } catch (error) {
    console.error("Create AI criteria error:", error);
    res.status(500).json({ error: "HR AI criteria error (500)" });
  }
});

router.put("/ai-criteria/:id", async (req: Request, res: Response) => {
  try {
    const criteriaId = parseInt(req.params.id);
    if (Number.isNaN(criteriaId)) {
      return res.status(400).json({ error: "Invalid criteria id" });
    }

    const { name, description, criteria, weight, isActive } = req.body;
    const update: any = { updatedAt: new Date() };

    if (name !== undefined) update.name = name;
    if (description !== undefined) update.description = description;
    if (criteria !== undefined) {
      update.criteria = Array.isArray(criteria)
        ? criteria
        : typeof criteria === "string"
          ? criteria.split("\n").map((item: string) => item.trim()).filter(Boolean)
          : [];
    }
    if (weight !== undefined) update.weight = parseInt(weight, 10) || 3;
    if (isActive !== undefined) update.isActive = Boolean(isActive);

    const [entry] = await db.update(hrAiCriteria)
      .set(update)
      .where(eq(hrAiCriteria.id, criteriaId))
      .returning();

    if (!entry) {
      return res.status(404).json({ error: "Criteria not found" });
    }

    res.json(entry);
  } catch (error) {
    console.error("Update AI criteria error:", error);
    res.status(500).json({ error: "HR AI criteria error (500)" });
  }
});

router.delete("/ai-criteria/:id", async (req: Request, res: Response) => {
  try {
    const criteriaId = parseInt(req.params.id);
    if (Number.isNaN(criteriaId)) {
      return res.status(400).json({ error: "Invalid criteria id" });
    }

    const [deleted] = await db.delete(hrAiCriteria)
      .where(eq(hrAiCriteria.id, criteriaId))
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: "Criteria not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Delete AI criteria error:", error);
    res.status(500).json({ error: "HR AI criteria error (500)" });
  }
});

// HR calendar events
router.get("/calendar/events", async (req: Request, res: Response) => {
  try {
    const timeMin = typeof req.query.timeMin === "string" ? req.query.timeMin : undefined;
    const timeMax = typeof req.query.timeMax === "string" ? req.query.timeMax : undefined;
    const ownerId = typeof req.query.ownerId === "string" ? parseInt(req.query.ownerId, 10) : undefined;

    const filters = [];
    if (!Number.isNaN(ownerId) && ownerId !== undefined) {
      filters.push(eq(hrCalendarEvents.ownerId, ownerId));
    }
    if (timeMin) {
      filters.push(gte(hrCalendarEvents.startTime, new Date(timeMin)));
    }
    if (timeMax) {
      filters.push(lte(hrCalendarEvents.startTime, new Date(timeMax)));
    }

    const query = filters.length
      ? db.select().from(hrCalendarEvents).where(and(...filters))
      : db.select().from(hrCalendarEvents);

    const events = await query.orderBy(desc(hrCalendarEvents.startTime));
    res.json(events);
  } catch (error) {
    console.error("Calendar events fetch error:", error);
    res.status(500).json({ error: "HR calendar error (500)" });
  }
});

router.post("/calendar/events", async (req: Request, res: Response) => {
  try {
    const { title, description, eventType, startTime, endTime, location, meetingLink, ownerId } = req.body;
    const createdBy = req.user?.id;

    if (!title || !startTime || !endTime) {
      return res.status(400).json({ error: "Event title and times are required" });
    }

    const [event] = await db.insert(hrCalendarEvents).values({
      title,
      description,
      eventType: eventType || "other",
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      location,
      meetingLink,
      ownerId: ownerId ? parseInt(ownerId) : createdBy || null,
      createdBy,
    }).returning();

    res.status(201).json(event);
  } catch (error) {
    console.error("Create calendar event error:", error);
    res.status(500).json({ error: "HR calendar error (500)" });
  }
});

router.patch("/calendar/events/:id", async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.id);
    if (Number.isNaN(eventId)) {
      return res.status(400).json({ error: "Invalid event id" });
    }

    const { title, description, eventType, startTime, endTime, location, meetingLink, ownerId } = req.body;
    const update: any = { updatedAt: new Date() };

    if (title !== undefined) update.title = title;
    if (description !== undefined) update.description = description;
    if (eventType !== undefined) update.eventType = eventType;
    if (startTime !== undefined) update.startTime = new Date(startTime);
    if (endTime !== undefined) update.endTime = new Date(endTime);
    if (location !== undefined) update.location = location;
    if (meetingLink !== undefined) update.meetingLink = meetingLink;
    if (ownerId !== undefined) update.ownerId = ownerId ? parseInt(ownerId) : null;

    const [event] = await db.update(hrCalendarEvents).set(update).where(eq(hrCalendarEvents.id, eventId)).returning();
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.json(event);
  } catch (error) {
    console.error("Update calendar event error:", error);
    res.status(500).json({ error: "HR calendar error (500)" });
  }
});

router.delete("/calendar/events/:id", async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.id);
    if (Number.isNaN(eventId)) {
      return res.status(400).json({ error: "Invalid event id" });
    }

    const [deleted] = await db.delete(hrCalendarEvents).where(eq(hrCalendarEvents.id, eventId)).returning();
    if (!deleted) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Delete calendar event error:", error);
    res.status(500).json({ error: "HR calendar error (500)" });
  }
});

// Scheduled reports
router.get("/scheduled-reports", async (req: Request, res: Response) => {
  try {
    const reports = await db.select().from(scheduledReports).orderBy(desc(scheduledReports.createdAt));
    res.json(reports);
  } catch (error) {
    console.error("Scheduled reports fetch error:", error);
    res.status(500).json({ error: "HR scheduled reports error (500)" });
  }
});

router.post("/scheduled-reports", async (req: Request, res: Response) => {
  try {
    const { name, reportType, format, recipients, filters, schedule, isActive } = req.body;
    const createdBy = req.user?.id;

    if (!name || !reportType || !schedule) {
      return res.status(400).json({ error: "Report name, type, and schedule are required" });
    }

    const recipientList = Array.isArray(recipients)
      ? recipients
      : typeof recipients === "string"
        ? recipients.split(",").map((email: string) => email.trim()).filter(Boolean)
        : [];

    let parsedFilters: any = {};
    if (typeof filters === "string") {
      try {
        parsedFilters = JSON.parse(filters);
      } catch {
        parsedFilters = {};
      }
    } else if (filters && typeof filters === "object") {
      parsedFilters = filters;
    }

    const nextRunAt = isActive === false ? null : getNextRunAt(schedule);

    const [report] = await db.insert(scheduledReports).values({
      name,
      reportType,
      format: format || "PDF",
      recipients: recipientList,
      filters: parsedFilters,
      schedule,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      nextRunAt,
      createdBy,
    }).returning();

    res.status(201).json(report);
  } catch (error) {
    console.error("Create scheduled report error:", error);
    res.status(500).json({ error: "HR scheduled reports error (500)" });
  }
});

router.patch("/scheduled-reports/:id", async (req: Request, res: Response) => {
  try {
    const reportId = parseInt(req.params.id);
    if (Number.isNaN(reportId)) {
      return res.status(400).json({ error: "Invalid report id" });
    }

    const { name, reportType, format, recipients, filters, schedule, isActive, lastRunAt } = req.body;
    const update: any = {
      updatedAt: new Date(),
    };

    if (name !== undefined) update.name = name;
    if (reportType !== undefined) update.reportType = reportType;
    if (format !== undefined) update.format = format;
    if (recipients !== undefined) {
      update.recipients = Array.isArray(recipients)
        ? recipients
        : typeof recipients === "string"
          ? recipients.split(",").map((email: string) => email.trim()).filter(Boolean)
          : [];
    }
    if (filters !== undefined) {
      if (typeof filters === "string") {
        try {
          update.filters = JSON.parse(filters);
        } catch {
          update.filters = {};
        }
      } else {
        update.filters = filters;
      }
    }
    if (schedule !== undefined) update.schedule = schedule;
    if (isActive !== undefined) update.isActive = Boolean(isActive);
    if (lastRunAt !== undefined) update.lastRunAt = lastRunAt ? new Date(lastRunAt) : null;

    if (update.schedule !== undefined || update.isActive !== undefined) {
      const scheduleValue = update.schedule || (await db.select().from(scheduledReports).where(eq(scheduledReports.id, reportId))).at(0)?.schedule;
      if (scheduleValue) {
        update.nextRunAt = update.isActive === false ? null : getNextRunAt(scheduleValue);
      }
    }

    const [report] = await db.update(scheduledReports).set(update).where(eq(scheduledReports.id, reportId)).returning();
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.json(report);
  } catch (error) {
    console.error("Update scheduled report error:", error);
    res.status(500).json({ error: "HR scheduled reports error (500)" });
  }
});

router.get("/scheduled-reports/:id/executions", async (req: Request, res: Response) => {
  try {
    const reportId = parseInt(req.params.id);
    if (Number.isNaN(reportId)) {
      return res.status(400).json({ error: "Invalid report id" });
    }

    const executions = await db
      .select()
      .from(scheduledReportExecutions)
      .where(eq(scheduledReportExecutions.reportId, reportId))
      .orderBy(desc(scheduledReportExecutions.startedAt));

    res.json(executions);
  } catch (error) {
    console.error("Report execution history error:", error);
    res.status(500).json({ error: "HR scheduled reports error (500)" });
  }
});

router.post("/scheduled-reports/:id/executions", async (req: Request, res: Response) => {
  try {
    const reportId = parseInt(req.params.id);
    if (Number.isNaN(reportId)) {
      return res.status(400).json({ error: "Invalid report id" });
    }

    const { status, outputUrl, errorMessage } = req.body;
    const normalizedStatus = status || "success";
    const finishedAt = normalizedStatus === "running" ? null : new Date();

    const [execution] = await db.insert(scheduledReportExecutions).values({
      reportId,
      status: normalizedStatus,
      outputUrl,
      errorMessage,
      finishedAt,
    }).returning();

    res.status(201).json(execution);
  } catch (error) {
    console.error("Create report execution error:", error);
    res.status(500).json({ error: "HR scheduled reports error (500)" });
  }
});

// Google integration status
router.get("/google-integration/status", async (_req: Request, res: Response) => {
  try {
    const calendarConfigured = Boolean(
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY
    );
    const genAiConfigured = Boolean(process.env.GOOGLE_GENAI_API_KEY);

    res.json({
      calendarConfigured,
      serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || null,
      genAiConfigured,
    });
  } catch (error) {
    console.error("Google integration status error:", error);
    res.status(500).json({ error: "HR Google integration error (500)" });
  }
});

// Onboarding templates
router.get("/onboarding-templates", async (req: Request, res: Response) => {
  try {
    const templates = await db.select().from(onboardingTemplates).orderBy(desc(onboardingTemplates.createdAt));
    res.json(templates);
  } catch (error) {
    console.error("Onboarding templates error:", error);
    res.status(500).json({ error: "HR onboarding templates error (500)" });
  }
});

router.post("/onboarding-templates", async (req: Request, res: Response) => {
  try {
    const { name, department, tasks, isActive } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Template name is required" });
    }

    const [template] = await db.insert(onboardingTemplates).values({
      name,
      department,
      tasks: Array.isArray(tasks) ? tasks : [],
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    }).returning();

    res.status(201).json(template);
  } catch (error) {
    console.error("Create onboarding template error:", error);
    res.status(500).json({ error: "HR onboarding templates error (500)" });
  }
});

// PTO policy
router.get("/pto-policy", async (req: Request, res: Response) => {
  try {
    const [policy] = await db.select().from(companyPtoPolicy).orderBy(desc(companyPtoPolicy.updatedAt));
    res.json(policy || null);
  } catch (error) {
    console.error("PTO policy fetch error:", error);
    res.status(500).json({ error: "HR PTO policy error (500)" });
  }
});

router.put("/pto-policy", async (req: Request, res: Response) => {
  try {
    const { policyText } = req.body;
    const lastUpdatedBy = req.user?.id;

    if (!policyText) {
      return res.status(400).json({ error: "Policy text is required" });
    }

    const existing = await db.select().from(companyPtoPolicy);
    if (existing.length > 0) {
      const [updated] = await db.update(companyPtoPolicy)
        .set({ policyNotes: policyText, lastUpdatedBy, updatedAt: new Date() })
        .where(eq(companyPtoPolicy.id, existing[0].id))
        .returning();
      return res.json(updated);
    }

    const [created] = await db.insert(companyPtoPolicy).values({
      policyNotes: policyText,
      lastUpdatedBy,
    }).returning();

    res.status(201).json(created);
  } catch (error) {
    console.error("Update PTO policy error:", error);
    res.status(500).json({ error: "HR PTO policy error (500)" });
  }
});

// Email templates
router.get("/email-templates", async (req: Request, res: Response) => {
  try {
    const templates = await db.select().from(emailTemplates).orderBy(desc(emailTemplates.createdAt));
    res.json(templates);
  } catch (error) {
    console.error("Email templates fetch error:", error);
    res.status(500).json({ error: "HR email templates error (500)" });
  }
});

router.post("/email-templates", async (req: Request, res: Response) => {
  try {
    const { name, subject, body, category, variables } = req.body;

    if (!name || !subject || !body) {
      return res.status(400).json({ error: "Name, subject, and body are required" });
    }

    const [template] = await db.insert(emailTemplates).values({
      name,
      subject,
      body,
      category: category || "HR",
      variables: Array.isArray(variables) ? variables : [],
      isActive: true,
    }).returning();

    res.status(201).json(template);
  } catch (error) {
    console.error("Create email template error:", error);
    res.status(500).json({ error: "HR email templates error (500)" });
  }
});

router.patch("/email-templates/:id", async (req: Request, res: Response) => {
  try {
    const templateId = parseInt(req.params.id, 10);
    if (Number.isNaN(templateId)) {
      return res.status(400).json({ error: "Invalid template id" });
    }

    const { name, subject, body, category, variables, isActive } = req.body;

    const update: Record<string, any> = { updatedAt: new Date() };
    if (name !== undefined) update.name = name;
    if (subject !== undefined) update.subject = subject;
    if (body !== undefined) update.body = body;
    if (category !== undefined) update.category = category;
    if (variables !== undefined) update.variables = Array.isArray(variables) ? variables : [];
    if (isActive !== undefined) update.isActive = Boolean(isActive);

    const [updated] = await db.update(emailTemplates)
      .set(update)
      .where(eq(emailTemplates.id, templateId))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Email template not found" });
    }

    res.json(updated);
  } catch (error) {
    console.error("Update email template error:", error);
    res.status(500).json({ error: "HR email templates error (500)" });
  }
});

router.delete("/email-templates/:id", async (req: Request, res: Response) => {
  try {
    const templateId = parseInt(req.params.id, 10);
    if (Number.isNaN(templateId)) {
      return res.status(400).json({ error: "Invalid template id" });
    }

    const [deleted] = await db.delete(emailTemplates)
      .where(eq(emailTemplates.id, templateId))
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: "Email template not found" });
    }

    res.json(deleted);
  } catch (error) {
    console.error("Delete email template error:", error);
    res.status(500).json({ error: "HR email templates error (500)" });
  }
});

// Recruiting Analytics
router.use("/recruiting-analytics", recruitingAnalyticsRoutes);

// Job Postings
router.use("/job-postings", jobPostingsRoutes);

// Offer Letters (PDF Generation)
router.use(offerLettersRoutes);

// HIRE Automation
router.use(hireRouter);

// Resume Uploader
router.get("/territories", async (req: Request, res: Response) => {
  try {
    const allTerritories = await db.select().from(territories).orderBy(territories.name);
    res.json(allTerritories);
  } catch (error) {
    console.error("Territories fetch error:", error);
    res.status(500).json({ error: "HR territories error (500)" });
  }
});

router.post("/territories", async (req: Request, res: Response) => {
  try {
    const { name, region, description } = req.body;
    if (!name || !region) {
      return res.status(400).json({ error: "Territory name and region are required" });
    }

    const [territory] = await db.insert(territories).values({
      name,
      region,
      description,
      isActive: true,
    }).returning();

    res.status(201).json(territory);
  } catch (error) {
    console.error("Create territory error:", error);
    res.status(500).json({ error: "HR territories error (500)" });
  }
});

// COI documents
router.get("/coi-documents", async (req: Request, res: Response) => {
  try {
    const documentsList = await db.select().from(coiDocuments).orderBy(desc(coiDocuments.updatedAt));
    res.json(documentsList);
  } catch (error) {
    console.error("COI documents fetch error:", error);
    res.status(500).json({ error: "HR COI documents error (500)" });
  }
});

router.post("/coi-documents", async (req: Request, res: Response) => {
  try {
    const { vendorName, policyNumber, carrier, expirationDate, fileUrl, status } = req.body;
    if (!vendorName) {
      return res.status(400).json({ error: "Vendor name is required" });
    }

    const [doc] = await db.insert(coiDocuments).values({
      vendorName,
      policyNumber,
      carrier,
      expirationDate,
      fileUrl,
      status: status || "pending",
    }).returning();

    res.status(201).json(doc);
  } catch (error) {
    console.error("Create COI document error:", error);
    res.status(500).json({ error: "HR COI documents error (500)" });
  }
});

// Employee assignments
router.get("/employee-assignments", async (req: Request, res: Response) => {
  try {
    const assignments = await db.select().from(employeeAssignments).orderBy(desc(employeeAssignments.createdAt));
    res.json(assignments);
  } catch (error) {
    console.error("Employee assignments fetch error:", error);
    res.status(500).json({ error: "HR employee assignments error (500)" });
  }
});

router.post("/employee-assignments", async (req: Request, res: Response) => {
  try {
    const { employeeId, managerId, assignmentType } = req.body;
    if (!employeeId) {
      return res.status(400).json({ error: "Employee is required" });
    }

    const [assignment] = await db.insert(employeeAssignments).values({
      employeeId: parseInt(employeeId),
      managerId: managerId ? parseInt(managerId) : null,
      assignmentType: assignmentType || "PRIMARY",
    }).returning();

    res.status(201).json(assignment);
  } catch (error) {
    console.error("Create employee assignment error:", error);
    res.status(500).json({ error: "HR employee assignments error (500)" });
  }
});

// Workflows
router.get("/workflows", async (req: Request, res: Response) => {
  try {
    const allWorkflows = await db.select().from(workflows).orderBy(desc(workflows.createdAt));
    res.json(allWorkflows);
  } catch (error) {
    console.error("Workflows fetch error:", error);
    res.status(500).json({ error: "HR workflows error (500)" });
  }
});

router.get("/workflows/:id", async (req: Request, res: Response) => {
  try {
    const workflowId = parseInt(req.params.id);
    if (Number.isNaN(workflowId)) {
      return res.status(400).json({ error: "Invalid workflow id" });
    }

    const [workflow] = await db.select().from(workflows).where(eq(workflows.id, workflowId));
    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }

    const steps = await db.select()
      .from(workflowSteps)
      .where(eq(workflowSteps.workflowId, workflowId))
      .orderBy(workflowSteps.stepOrder);

    res.json({ ...workflow, steps });
  } catch (error) {
    console.error("Workflow detail error:", error);
    res.status(500).json({ error: "HR workflows error (500)" });
  }
});

router.post("/workflows", async (req: Request, res: Response) => {
  try {
    const { name, description, steps } = req.body;
    const createdBy = req.user?.id;

    if (!name) {
      return res.status(400).json({ error: "Workflow name is required" });
    }

    const [workflow] = await db.insert(workflows).values({
      name,
      description,
      createdBy,
      isActive: true,
    }).returning();

    if (Array.isArray(steps) && steps.length > 0) {
      await db.insert(workflowSteps).values(
        steps.map((step: any, index: number) => ({
          workflowId: workflow.id,
          stepOrder: index + 1,
          title: step.title,
          description: step.description,
          assignedRole: step.assignedRole,
        }))
      );
    }

    res.status(201).json(workflow);
  } catch (error) {
    console.error("Create workflow error:", error);
    res.status(500).json({ error: "HR workflows error (500)" });
  }
});

// Workflow executions - Get all executions
router.get("/workflow-executions", async (req: Request, res: Response) => {
  try {
    const executions = await db.select()
      .from(workflowExecutions)
      .orderBy(desc(workflowExecutions.startedAt))
      .limit(100);

    res.json(executions);
  } catch (error) {
    console.error("Workflow executions fetch error:", error);
    res.status(500).json({ error: "HR workflow executions error (500)" });
  }
});

// Workflow executions - Get execution by ID with steps
router.get("/workflow-executions/:id", async (req: Request, res: Response) => {
  try {
    const executionId = parseInt(req.params.id);
    if (Number.isNaN(executionId)) {
      return res.status(400).json({ error: "Invalid execution id" });
    }

    const [execution] = await db.select()
      .from(workflowExecutions)
      .where(eq(workflowExecutions.id, executionId));

    if (!execution) {
      return res.status(404).json({ error: "Execution not found" });
    }

    const steps = await db.select()
      .from(workflowStepExecutions)
      .where(eq(workflowStepExecutions.executionId, executionId))
      .orderBy(workflowStepExecutions.createdAt);

    res.json({ ...execution, steps });
  } catch (error) {
    console.error("Workflow execution detail error:", error);
    res.status(500).json({ error: "HR workflow executions error (500)" });
  }
});

// Workflow executions - Get executions for a workflow
router.get("/workflows/:id/executions", async (req: Request, res: Response) => {
  try {
    const workflowId = parseInt(req.params.id);
    if (Number.isNaN(workflowId)) {
      return res.status(400).json({ error: "Invalid workflow id" });
    }

    const executions = await db.select()
      .from(workflowExecutions)
      .where(eq(workflowExecutions.workflowId, workflowId))
      .orderBy(desc(workflowExecutions.startedAt))
      .limit(50);

    res.json(executions);
  } catch (error) {
    console.error("Workflow executions by workflow error:", error);
    res.status(500).json({ error: "HR workflow executions error (500)" });
  }
});

// Workflow executions - Get executions for a candidate
router.get("/candidates/:id/workflow-executions", async (req: Request, res: Response) => {
  try {
    const candidateId = parseInt(req.params.id);
    if (Number.isNaN(candidateId)) {
      return res.status(400).json({ error: "Invalid candidate id" });
    }

    const executions = await db.select()
      .from(workflowExecutions)
      .where(eq(workflowExecutions.candidateId, candidateId))
      .orderBy(desc(workflowExecutions.startedAt));

    res.json(executions);
  } catch (error) {
    console.error("Workflow executions by candidate error:", error);
    res.status(500).json({ error: "HR workflow executions error (500)" });
  }
});

// Workflow executions - Manual trigger
router.post("/workflows/:id/execute", async (req: Request, res: Response) => {
  try {
    const workflowId = parseInt(req.params.id);
    if (Number.isNaN(workflowId)) {
      return res.status(400).json({ error: "Invalid workflow id" });
    }

    const { candidateId, context } = req.body;

    if (!candidateId) {
      return res.status(400).json({ error: "candidateId is required for manual workflow execution" });
    }

    // Check workflow exists
    const [workflow] = await db.select()
      .from(workflows)
      .where(eq(workflows.id, workflowId));

    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }

    if (!workflow.isActive) {
      return res.status(400).json({ error: "Workflow is not active" });
    }

    // Get candidate
    const [candidate] = await db.select()
      .from(candidates)
      .where(eq(candidates.id, candidateId));

    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    // Execute workflow
    const execution = await workflowExecutor.executeWorkflow(workflowId, {
      candidateId,
      candidate,
      triggeredBy: (req as any).session?.userId,
      ...context,
    });

    res.status(201).json(execution);
  } catch (error) {
    console.error("Manual workflow execution error:", error);
    res.status(500).json({ error: "Failed to execute workflow" });
  }
});

// Contract signing tokens
router.post("/contracts/:id/token", async (req: Request, res: Response) => {
  try {
    const contractId = parseInt(req.params.id);
    if (Number.isNaN(contractId)) {
      return res.status(400).json({ error: "Invalid contract id" });
    }

    const token = randomBytes(24).toString("hex");
    const [record] = await db.insert(contractTokens).values({
      contractId,
      token,
      expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : null,
    }).returning();

    res.json(record);
  } catch (error) {
    console.error("Create contract token error:", error);
    res.status(500).json({ error: "HR contracts error (500)" });
  }
});

// Equipment signature tokens
router.post("/equipment/:id/token", async (req: Request, res: Response) => {
  try {
    const equipmentId = parseInt(req.params.id);
    if (Number.isNaN(equipmentId)) {
      return res.status(400).json({ error: "Invalid equipment id" });
    }

    const { type } = req.body;
    if (!type) {
      return res.status(400).json({ error: "Signature type is required" });
    }

    const token = randomBytes(24).toString("hex");
    const [record] = await db.insert(equipmentSignatureTokens).values({
      equipmentId,
      token,
      type,
      status: "pending",
    }).returning();

    res.json(record);
  } catch (error) {
    console.error("Create equipment token error:", error);
    res.status(500).json({ error: "HR equipment token error (500)" });
  }
});

// Team directory
router.get("/team-directory", async (req: Request, res: Response) => {
  try {
    const staff = await db.select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      department: users.department,
      position: users.position,
      phone: users.phone,
      role: users.role,
      avatar: users.avatar,
    }).from(users).where(eq(users.isActive, true)).orderBy(users.lastName);

    res.json(staff);
  } catch (error) {
    console.error("Team directory error:", error);
    res.status(500).json({ error: "HR team directory error (500)" });
  }
});

// Get onboarding checklists
router.get("/onboarding", async (req: Request, res: Response) => {
  try {
    const tasks = await db.select().from(onboardingTasks).orderBy(desc(onboardingTasks.createdAt));

    const employeeIds = Array.from(new Set(tasks.map((task) => task.employeeId)));
    const employeeRows = employeeIds.length
      ? await db.select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          hireDate: users.hireDate,
          createdAt: users.createdAt,
        }).from(users).where(inArray(users.id, employeeIds))
      : [];

    const employeeLookup = new Map(employeeRows.map((row) => [
      row.id,
      {
        name: `${row.firstName || ""} ${row.lastName || ""}`.trim(),
        startDate: row.hireDate || row.createdAt,
      },
    ]));

    const normalizeCategory = (category: string | null) => {
      switch (category) {
        case "paperwork":
          return "documents";
        case "training":
          return "training";
        case "equipment":
          return "equipment";
        default:
          return "admin";
      }
    };

    const checklistMap = new Map<number, any>();

    tasks.forEach((task) => {
      const existing = checklistMap.get(task.employeeId);
      const employeeInfo = employeeLookup.get(task.employeeId);
      const taskEntry = {
        id: task.id,
        name: task.taskName,
        category: normalizeCategory(task.category),
        isCompleted: task.status === "completed",
        completedAt: task.completedAt,
        dueDate: task.dueDate,
      };

      if (existing) {
        existing.tasks.push(taskEntry);
      } else {
        checklistMap.set(task.employeeId, {
          id: task.employeeId,
          employeeId: task.employeeId,
          employeeName: employeeInfo?.name || "Unknown",
          startDate: employeeInfo?.startDate || task.createdAt,
          tasks: [taskEntry],
        });
      }
    });

    const checklists = Array.from(checklistMap.values()).map((checklist) => {
      const totalTasks = checklist.tasks.length;
      const completedTasks = checklist.tasks.filter((t: any) => t.isCompleted).length;
      const completionPercentage = totalTasks
        ? Math.round((completedTasks / totalTasks) * 100)
        : 0;
      const status =
        completionPercentage === 0
          ? "pending"
          : completionPercentage === 100
            ? "completed"
            : "in_progress";

      return {
        ...checklist,
        completionPercentage,
        status,
      };
    });

    res.json(checklists);
  } catch (error) {
    console.error("Onboarding fetch error:", error);
    res.json([]);
  }
});

// Create onboarding checklist
router.post("/onboarding", async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.body;
    const parsedEmployeeId = parseInt(employeeId);

    if (!employeeId || Number.isNaN(parsedEmployeeId)) {
      return res.status(400).json({ error: "Employee is required" });
    }

    const existingTasks = await db.select()
      .from(onboardingTasks)
      .where(eq(onboardingTasks.employeeId, parsedEmployeeId));

    if (existingTasks.length > 0) {
      return res.status(400).json({ error: "Checklist already exists for this employee" });
    }

    const defaultTasks = [
      { taskName: "Complete HR paperwork", category: "paperwork" },
      { taskName: "Set up payroll and benefits", category: "paperwork" },
      { taskName: "Complete onboarding training", category: "training" },
      { taskName: "Review safety protocols", category: "training" },
      { taskName: "Assign equipment and tools", category: "equipment" },
      { taskName: "Provision system access", category: "access" },
      { taskName: "Schedule team orientation", category: "orientation" },
    ];

    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    await db.insert(onboardingTasks).values(
      defaultTasks.map((task) => ({
        employeeId: parsedEmployeeId,
        taskName: task.taskName,
        category: task.category as 'paperwork' | 'training' | 'equipment' | 'access' | 'orientation',
        status: "pending" as const,
        dueDate,
      }))
    );

    res.status(201).json({ success: true });
  } catch (error) {
    console.error("Create onboarding error:", error);
    res.status(500).json({ error: "Failed to create onboarding checklist" });
  }
});

// Toggle onboarding task
router.patch("/onboarding/:checklistId/tasks/:taskId/toggle", async (req: Request, res: Response) => {
  try {
    const checklistId = parseInt(req.params.checklistId);
    const taskId = parseInt(req.params.taskId);

    if (Number.isNaN(checklistId) || Number.isNaN(taskId)) {
      return res.status(400).json({ error: "Invalid task identifiers" });
    }

    const [task] = await db.select()
      .from(onboardingTasks)
      .where(eq(onboardingTasks.id, taskId));

    if (!task || task.employeeId !== checklistId) {
      return res.status(404).json({ error: "Task not found" });
    }

    const isCompleted = task.status === "completed";
    const [updated] = await db.update(onboardingTasks)
      .set({
        status: (isCompleted ? "pending" : "completed") as 'pending' | 'in_progress' | 'completed' | 'skipped',
        completedAt: isCompleted ? null : new Date(),
        updatedAt: new Date(),
      })
      .where(eq(onboardingTasks.id, taskId))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error("Toggle onboarding task error:", error);
    res.status(500).json({ error: "Failed to update onboarding task" });
  }
});

// ============================================================================
// ONBOARDING REQUIREMENTS - W2 vs 1099 Differentiation
// ============================================================================

// Get onboarding requirements for an employee
router.get("/onboarding/:employeeId/requirements", async (req: Request, res: Response) => {
  try {
    const employeeId = parseInt(req.params.employeeId);

    if (Number.isNaN(employeeId)) {
      return res.status(400).json({ error: "Invalid employee ID" });
    }

    // Get employee info
    const [employee] = await db.select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      employmentType: users.employmentType,
      hireDate: users.hireDate,
    })
      .from(users)
      .where(eq(users.id, employeeId));

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // Get requirements
    const requirements = await db.select()
      .from(onboardingRequirements)
      .where(eq(onboardingRequirements.employeeId, employeeId))
      .orderBy(onboardingRequirements.dueDate);

    // Group by category
    const grouped = getRequirementsByCategory(requirements);

    // Calculate completion
    const completionPercentage = calculateCompletionPercentage(requirements);

    // Mark overdue requirements
    const requirementsWithStatus = requirements.map((req) => ({
      ...req,
      isOverdue: isRequirementOverdue(req),
    }));

    res.json({
      employee: {
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName}`,
        employmentType: employee.employmentType,
        hireDate: employee.hireDate,
      },
      requirements: requirementsWithStatus,
      groupedByCategory: grouped,
      completionPercentage,
      totalRequirements: requirements.length,
      completedRequirements: requirements.filter(
        (r) => r.status === 'approved' || r.status === 'submitted'
      ).length,
    });
  } catch (error) {
    console.error("Get onboarding requirements error:", error);
    res.status(500).json({ error: "Failed to fetch onboarding requirements" });
  }
});

// Update requirement status
router.patch("/onboarding/requirements/:id", async (req: Request, res: Response) => {
  try {
    const requirementId = parseInt(req.params.id);
    const { status, notes, documentUrl } = req.body;

    if (Number.isNaN(requirementId)) {
      return res.status(400).json({ error: "Invalid requirement ID" });
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (status) {
      updateData.status = status;
      if (status === 'submitted' || status === 'approved') {
        updateData.submittedAt = new Date();
      }
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    if (documentUrl !== undefined) {
      updateData.documentUrl = documentUrl;
    }

    const [updated] = await db.update(onboardingRequirements)
      .set(updateData)
      .where(eq(onboardingRequirements.id, requirementId))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Requirement not found" });
    }

    res.json(updated);
  } catch (error) {
    console.error("Update requirement error:", error);
    res.status(500).json({ error: "Failed to update requirement" });
  }
});

// Upload document for requirement
router.post("/onboarding/requirements/:id/upload", async (req: Request, res: Response) => {
  try {
    const requirementId = parseInt(req.params.id);
    const { documentUrl, notes } = req.body;

    if (Number.isNaN(requirementId)) {
      return res.status(400).json({ error: "Invalid requirement ID" });
    }

    if (!documentUrl) {
      return res.status(400).json({ error: "Document URL is required" });
    }

    const [updated] = await db.update(onboardingRequirements)
      .set({
        documentUrl,
        notes,
        status: 'submitted',
        submittedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(onboardingRequirements.id, requirementId))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Requirement not found" });
    }

    res.json(updated);
  } catch (error) {
    console.error("Upload requirement document error:", error);
    res.status(500).json({ error: "Failed to upload document" });
  }
});

/**
 * Auto-archive candidates in terminal states older than 30 days
 * POST /api/hr/candidates/auto-archive
 */
router.post("/candidates/auto-archive", async (req: Request, res: Response) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Find candidates in terminal states older than 30 days
    const terminalStates = [
      'rejected',
      'hired',
      'withdrawn',
      'DEAD_BY_CANDIDATE',
      'DEAD_BY_COMPANY',
      'DEAD_COMPENSATION',
      'DEAD_LOCATION',
      'DEAD_TIMING',
      'DEAD_QUALIFICATIONS',
      'DEAD_CULTURE_FIT',
      'DEAD_OTHER'
    ];

    const candidatesToArchive = await db.select().from(candidates)
      .where(and(
        eq(candidates.isArchived, false),
        inArray(candidates.status, terminalStates),
        lte(candidates.updatedAt, thirtyDaysAgo)
      ));

    console.log(`📦 Found ${candidatesToArchive.length} candidates to auto-archive`);

    if (candidatesToArchive.length === 0) {
      return res.json({
        success: true,
        message: 'No candidates to archive',
        archived: 0,
      });
    }

    // Archive them
    const candidateIds = candidatesToArchive.map(c => c.id);
    await db.update(candidates)
      .set({
        isArchived: true,
        archivedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(inArray(candidates.id, candidateIds));

    console.log(`✅ Archived ${candidatesToArchive.length} candidates`);

    res.json({
      success: true,
      message: `Archived ${candidatesToArchive.length} candidates`,
      archived: candidatesToArchive.length,
      candidates: candidatesToArchive.map(c => ({
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
        status: c.status,
        updatedAt: c.updatedAt,
      })),
    });

  } catch (error) {
    console.error("Auto-archive error:", error);
    res.status(500).json({ error: "Failed to auto-archive candidates" });
  }
});

/**
 * Debug endpoint to manually trigger interview overdue check
 * POST /api/hr/debug/check-overdue-interviews
 */
router.post("/debug/check-overdue-interviews", async (req: Request, res: Response) => {
  try {
    const { checkOverdueInterviews } = await import("../../cron/interview-overdue-job.js");
    await checkOverdueInterviews();
    res.json({ success: true, message: "Interview overdue check completed" });
  } catch (error: any) {
    console.error("Interview overdue check failed:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Debug endpoint to manually trigger onboarding overdue check
 * POST /api/hr/debug/check-overdue-onboarding
 */
router.post("/debug/check-overdue-onboarding", async (req: Request, res: Response) => {
  try {
    const { checkOverdueTasks } = await import("../../cron/onboarding-overdue-job.js");
    await checkOverdueTasks();
    res.json({ success: true, message: "Onboarding overdue check completed" });
  } catch (error: any) {
    console.error("Onboarding overdue check failed:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/hr/debug/send-pto-reminders - Manual trigger for PTO reminders
router.post("/debug/send-pto-reminders", async (req: Request, res: Response) => {
  try {
    const userRole = req.user?.role?.toUpperCase() || "";
    if (!["SYSTEM_ADMIN", "HR_ADMIN"].includes(userRole)) {
      return res.status(403).json({ error: "Admin access required" });
    }

    console.log(`🚀 [DEBUG] Manually triggering PTO reminder job (requested by user ${req.user?.email})...`);

    const { runPtoReminderJobNow } = await import("../../cron/pto-reminder-job.js");
    const results = await runPtoReminderJobNow();

    res.json({
      success: true,
      message: "PTO reminder job completed",
      results: {
        sent30Day: results.sent30Day,
        sent7Day: results.sent7Day,
        sent1Day: results.sent1Day,
        errors: results.errors,
      },
    });
  } catch (error: any) {
    console.error("Debug PTO reminder job error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
