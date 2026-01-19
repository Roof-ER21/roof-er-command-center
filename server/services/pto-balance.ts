import { db } from "../db";
import { ptoPolicies, ptoRequests, users } from "../../shared/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * PTO Balance Management Service
 * Handles all PTO balance updates with proper tracking and history
 */

export interface BalanceChangeLog {
  employeeId: number;
  previousUsed: number;
  newUsed: number;
  previousRemaining: number;
  newRemaining: number;
  changeAmount: number;
  reason: 'APPROVED' | 'DENIED' | 'CANCELLED' | 'ADMIN_ADJUSTMENT';
  requestId?: number;
  changedBy?: number;
  timestamp: Date;
}

/**
 * Update PTO balance when a request is approved
 * Deducts days from the employee's remaining balance
 */
export async function deductPtoBalance(
  employeeId: number,
  days: number,
  requestId: number,
  isExempt: boolean,
  changedBy?: number
): Promise<BalanceChangeLog | null> {
  if (isExempt || days <= 0) {
    console.log(`[PTO Balance] Skipping deduction for request ${requestId} (exempt: ${isExempt}, days: ${days})`);
    return null;
  }

  try {
    // Get employee's current policy
    const [policy] = await db
      .select()
      .from(ptoPolicies)
      .where(eq(ptoPolicies.employeeId, employeeId))
      .limit(1);

    if (!policy) {
      console.warn(`[PTO Balance] No policy found for employee ${employeeId}, creating default`);
      // Create default policy if none exists
      const [newPolicy] = await db
        .insert(ptoPolicies)
        .values({
          employeeId,
          policyLevel: 'COMPANY',
          vacationDays: 10,
          sickDays: 5,
          personalDays: 2,
          baseDays: 17,
          additionalDays: 0,
          totalDays: 17,
          usedDays: days,
          remainingDays: 17 - days,
        })
        .returning();

      return {
        employeeId,
        previousUsed: 0,
        newUsed: days,
        previousRemaining: 17,
        newRemaining: 17 - days,
        changeAmount: days,
        reason: 'APPROVED',
        requestId,
        changedBy,
        timestamp: new Date(),
      };
    }

    // Calculate new balances
    const previousUsed = policy.usedDays || 0;
    const newUsed = previousUsed + days;
    const previousRemaining = policy.remainingDays || 0;
    const newRemaining = (policy.totalDays || 0) - newUsed;

    // Ensure non-negative remaining
    const safeRemaining = Math.max(0, newRemaining);

    // Update the policy
    await db
      .update(ptoPolicies)
      .set({
        usedDays: newUsed,
        remainingDays: safeRemaining,
        updatedAt: new Date(),
      })
      .where(eq(ptoPolicies.id, policy.id));

    const changeLog: BalanceChangeLog = {
      employeeId,
      previousUsed,
      newUsed,
      previousRemaining,
      newRemaining: safeRemaining,
      changeAmount: days,
      reason: 'APPROVED',
      requestId,
      changedBy,
      timestamp: new Date(),
    };

    console.log(`[PTO Balance] Deducted ${days} days for employee ${employeeId}. Used: ${previousUsed} → ${newUsed}, Remaining: ${previousRemaining} → ${safeRemaining}`);

    return changeLog;
  } catch (error) {
    console.error(`[PTO Balance] Error deducting balance for employee ${employeeId}:`, error);
    throw error;
  }
}

/**
 * Restore PTO balance when an approved request is denied/cancelled
 * Adds days back to the employee's remaining balance
 */
export async function restorePtoBalance(
  employeeId: number,
  days: number,
  requestId: number,
  isExempt: boolean,
  reason: 'DENIED' | 'CANCELLED',
  changedBy?: number
): Promise<BalanceChangeLog | null> {
  if (isExempt || days <= 0) {
    console.log(`[PTO Balance] Skipping restoration for request ${requestId} (exempt: ${isExempt}, days: ${days})`);
    return null;
  }

  try {
    // Get employee's current policy
    const [policy] = await db
      .select()
      .from(ptoPolicies)
      .where(eq(ptoPolicies.employeeId, employeeId))
      .limit(1);

    if (!policy) {
      console.warn(`[PTO Balance] No policy found for employee ${employeeId} during restoration`);
      return null;
    }

    // Calculate new balances
    const previousUsed = policy.usedDays || 0;
    const newUsed = Math.max(0, previousUsed - days); // Prevent negative
    const previousRemaining = policy.remainingDays || 0;
    const newRemaining = (policy.totalDays || 0) - newUsed;

    // Update the policy
    await db
      .update(ptoPolicies)
      .set({
        usedDays: newUsed,
        remainingDays: newRemaining,
        updatedAt: new Date(),
      })
      .where(eq(ptoPolicies.id, policy.id));

    const changeLog: BalanceChangeLog = {
      employeeId,
      previousUsed,
      newUsed,
      previousRemaining,
      newRemaining,
      changeAmount: -days, // Negative indicates restoration
      reason,
      requestId,
      changedBy,
      timestamp: new Date(),
    };

    console.log(`[PTO Balance] Restored ${days} days for employee ${employeeId}. Used: ${previousUsed} → ${newUsed}, Remaining: ${previousRemaining} → ${newRemaining}`);

    return changeLog;
  } catch (error) {
    console.error(`[PTO Balance] Error restoring balance for employee ${employeeId}:`, error);
    throw error;
  }
}

/**
 * Recalculate PTO balance from scratch based on approved requests
 * Useful for fixing discrepancies or after bulk operations
 */
export async function recalculatePtoBalance(
  employeeId: number,
  year?: number
): Promise<{ usedDays: number; remainingDays: number; totalDays: number }> {
  try {
    const currentYear = year || new Date().getFullYear();
    const yearStart = `${currentYear}-01-01`;
    const yearEnd = `${currentYear}-12-31`;

    // Get all approved, non-exempt requests for the current year
    const approvedRequests = await db
      .select()
      .from(ptoRequests)
      .where(
        and(
          eq(ptoRequests.employeeId, employeeId),
          eq(ptoRequests.status, 'APPROVED'),
          eq(ptoRequests.isExempt, false),
          sql`${ptoRequests.startDate} >= ${yearStart}`,
          sql`${ptoRequests.startDate} <= ${yearEnd}`
        )
      );

    // Calculate total used days
    const totalUsed = approvedRequests.reduce((sum, req) => sum + (req.days || 0), 0);

    // Get or create policy
    const [policy] = await db
      .select()
      .from(ptoPolicies)
      .where(eq(ptoPolicies.employeeId, employeeId))
      .limit(1);

    if (!policy) {
      console.warn(`[PTO Balance] No policy found for employee ${employeeId} during recalculation`);
      return { usedDays: totalUsed, remainingDays: 0, totalDays: 0 };
    }

    const totalDays = policy.totalDays || 0;
    const remainingDays = totalDays - totalUsed;

    // Update policy with recalculated values
    await db
      .update(ptoPolicies)
      .set({
        usedDays: totalUsed,
        remainingDays: Math.max(0, remainingDays),
        updatedAt: new Date(),
      })
      .where(eq(ptoPolicies.id, policy.id));

    console.log(`[PTO Balance] Recalculated balance for employee ${employeeId}: Used ${totalUsed}/${totalDays}, Remaining ${remainingDays}`);

    return { usedDays: totalUsed, remainingDays, totalDays };
  } catch (error) {
    console.error(`[PTO Balance] Error recalculating balance for employee ${employeeId}:`, error);
    throw error;
  }
}

/**
 * Get current PTO balance for an employee
 */
export async function getPtoBalance(employeeId: number): Promise<{
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  vacationDays: number;
  sickDays: number;
  personalDays: number;
  policyLevel: string;
} | null> {
  try {
    const [policy] = await db
      .select()
      .from(ptoPolicies)
      .where(eq(ptoPolicies.employeeId, employeeId))
      .limit(1);

    if (!policy) {
      return null;
    }

    return {
      totalDays: policy.totalDays || 0,
      usedDays: policy.usedDays || 0,
      remainingDays: policy.remainingDays || 0,
      vacationDays: policy.vacationDays || 0,
      sickDays: policy.sickDays || 0,
      personalDays: policy.personalDays || 0,
      policyLevel: policy.policyLevel || 'COMPANY',
    };
  } catch (error) {
    console.error(`[PTO Balance] Error getting balance for employee ${employeeId}:`, error);
    throw error;
  }
}

/**
 * Track balance by PTO type (vacation, sick, personal)
 * This is a future enhancement - currently tracks totals only
 */
export interface TypedBalanceTracking {
  vacation: { used: number; available: number };
  sick: { used: number; available: number };
  personal: { used: number; available: number };
}

export async function getTypedBalance(employeeId: number, year?: number): Promise<TypedBalanceTracking> {
  try {
    const currentYear = year || new Date().getFullYear();
    const yearStart = `${currentYear}-01-01`;
    const yearEnd = `${currentYear}-12-31`;

    // Get policy
    const [policy] = await db
      .select()
      .from(ptoPolicies)
      .where(eq(ptoPolicies.employeeId, employeeId))
      .limit(1);

    if (!policy) {
      return {
        vacation: { used: 0, available: 0 },
        sick: { used: 0, available: 0 },
        personal: { used: 0, available: 0 },
      };
    }

    // Get approved requests by type
    const approvedRequests = await db
      .select()
      .from(ptoRequests)
      .where(
        and(
          eq(ptoRequests.employeeId, employeeId),
          eq(ptoRequests.status, 'APPROVED'),
          eq(ptoRequests.isExempt, false),
          sql`${ptoRequests.startDate} >= ${yearStart}`,
          sql`${ptoRequests.startDate} <= ${yearEnd}`
        )
      );

    // Calculate used days by type
    const usedByType = {
      VACATION: 0,
      SICK: 0,
      PERSONAL: 0,
    };

    for (const req of approvedRequests) {
      const type = req.type || 'VACATION';
      usedByType[type] += req.days || 0;
    }

    return {
      vacation: {
        used: usedByType.VACATION,
        available: (policy.vacationDays || 0) - usedByType.VACATION,
      },
      sick: {
        used: usedByType.SICK,
        available: (policy.sickDays || 0) - usedByType.SICK,
      },
      personal: {
        used: usedByType.PERSONAL,
        available: (policy.personalDays || 0) - usedByType.PERSONAL,
      },
    };
  } catch (error) {
    console.error(`[PTO Balance] Error getting typed balance for employee ${employeeId}:`, error);
    throw error;
  }
}
