/**
 * Updated PTO PATCH endpoint with real-time balance tracking
 * This file contains the updated endpoint code that should replace the existing PATCH /pto/:id endpoint
 */

import { Request, Response } from "express";
import { db } from "../../db";
import { ptoRequests, users } from "../../../shared/schema";
import { eq } from "drizzle-orm";
import { sendPTOApprovalEmail, sendPTODenialEmail } from "../../services/email";
import { deductPtoBalance, restorePtoBalance } from "../../services/pto-balance";

// This code should replace the existing router.patch("/pto/:id", ...) in index.ts
// Starting from line ~774

export async function updatePTORequest(req: Request, res: Response) {
  try {
    const managerRoles = new Set(["SYSTEM_ADMIN", "HR_ADMIN", "GENERAL_MANAGER", "TERRITORY_MANAGER", "MANAGER", "TEAM_LEAD"]);

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

    // Only SYSTEM_ADMIN, HR_ADMIN, or GENERAL_MANAGER can mark requests as exempt
    if (isExempt !== undefined && isExempt === true) {
      const userRole = req.user?.role?.toUpperCase() || "";
      if (!["SYSTEM_ADMIN", "HR_ADMIN", "GENERAL_MANAGER"].includes(userRole)) {
        return res.status(403).json({ error: "Only HR admins and General Managers can mark PTO as exempt" });
      }
    }

    // ========================================================================
    // STEP 1: Get current request state to track changes
    // ========================================================================
    const [currentRequest] = await db
      .select()
      .from(ptoRequests)
      .where(eq(ptoRequests.id, requestId))
      .limit(1);

    if (!currentRequest) {
      return res.status(404).json({ error: "PTO request not found" });
    }

    const previousStatus = currentRequest.status?.toUpperCase();
    const previousIsExempt = currentRequest.isExempt;

    // ========================================================================
    // STEP 2: Update the request status
    // ========================================================================
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

    // ========================================================================
    // STEP 3: Update PTO balance based on status transitions
    // ========================================================================
    try {
      const employeeId = updated.employeeId;
      const days = updated.days || 0;
      const finalIsExempt = updated.isExempt || false;
      const changedBy = req.user?.id;

      console.log(`[PTO Balance] Status transition: ${previousStatus} → ${normalizedStatus}, Exempt: ${previousIsExempt} → ${finalIsExempt}`);

      // CASE 1: PENDING/DENIED → APPROVED (Deduct balance)
      if (normalizedStatus === 'APPROVED' && previousStatus !== 'APPROVED') {
        const log = await deductPtoBalance(employeeId, days, requestId, finalIsExempt, changedBy);
        if (log) {
          console.log(`[PTO Balance] ✅ Deducted ${days} days. New balance: ${log.newRemaining} days remaining`);
        }
      }

      // CASE 2: APPROVED → DENIED (Restore balance)
      else if (normalizedStatus === 'DENIED' && previousStatus === 'APPROVED') {
        const log = await restorePtoBalance(
          employeeId,
          days,
          requestId,
          previousIsExempt || false,
          'DENIED',
          changedBy
        );
        if (log) {
          console.log(`[PTO Balance] ✅ Restored ${days} days (denied). New balance: ${log.newRemaining} days remaining`);
        }
      }

      // CASE 3: APPROVED → PENDING (Restore balance - revoked approval)
      else if (normalizedStatus === 'PENDING' && previousStatus === 'APPROVED') {
        const log = await restorePtoBalance(
          employeeId,
          days,
          requestId,
          previousIsExempt || false,
          'CANCELLED',
          changedBy
        );
        if (log) {
          console.log(`[PTO Balance] ✅ Restored ${days} days (revoked). New balance: ${log.newRemaining} days remaining`);
        }
      }

      // CASE 4: Exempt status changed for already approved requests
      else if (normalizedStatus === 'APPROVED' && previousStatus === 'APPROVED') {
        // Was NOT exempt, now IS exempt → Restore balance
        if (!previousIsExempt && finalIsExempt) {
          const log = await restorePtoBalance(
            employeeId,
            days,
            requestId,
            false, // Use false to actually restore the days
            'CANCELLED',
            changedBy
          );
          if (log) {
            console.log(`[PTO Balance] ✅ Restored ${days} days (marked exempt). New balance: ${log.newRemaining} days remaining`);
          }
        }
        // Was exempt, now NOT exempt → Deduct balance
        else if (previousIsExempt && !finalIsExempt) {
          const log = await deductPtoBalance(
            employeeId,
            days,
            requestId,
            false, // Use false to actually deduct the days
            changedBy
          );
          if (log) {
            console.log(`[PTO Balance] ✅ Deducted ${days} days (unmarked exempt). New balance: ${log.newRemaining} days remaining`);
          }
        }
      }
    } catch (balanceError) {
      // Log balance error but don't fail the request update
      console.error("[PTO Balance] ❌ Failed to update balance:", balanceError);
      // TODO: Consider implementing:
      // 1. Database transaction rollback
      // 2. Retry queue for failed balance updates
      // 3. Admin notification system
    }

    // ========================================================================
    // STEP 4: Send email notification to employee
    // ========================================================================
    try {
      const [employee] = await db.select().from(users).where(eq(users.id, updated.employeeId)).limit(1);

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
        };

        const employeeData = {
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
        };

        if (normalizedStatus === 'APPROVED') {
          await sendPTOApprovalEmail(employeeData, requestData, approver);
          console.log(`✅ Sent PTO approval email to ${employee.email}`);
        } else if (normalizedStatus === 'DENIED') {
          await sendPTODenialEmail(employeeData, requestData, approver, req.body.reviewNotes);
          console.log(`✅ Sent PTO denial email to ${employee.email}`);
        }
      }
    } catch (emailError) {
      // Log email error but don't fail the request
      console.error("Failed to send PTO status email notification:", emailError);
    }

    // ========================================================================
    // STEP 5: Return updated request
    // ========================================================================
    res.json({
      ...updated,
      status: updated.status?.toLowerCase() || "pending",
    });
  } catch (error) {
    console.error("Update PTO error:", error);
    res.status(500).json({ error: "Failed to update PTO request" });
  }
}
