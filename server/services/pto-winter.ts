import { db } from "../db.js";
import { ptoRequests } from "../../shared/schema.js";
import { eq, and } from "drizzle-orm";
import { PTO_POLICY } from "../../shared/constants/pto-policy.js";

const WINTER_MONTHS = [0, 1, 11]; // January (0), February (1), December (11)
const REQUIRED_WINTER_DAYS = PTO_POLICY.REQUIRED_WINTER_DAYS;

/**
 * Check if a date is in a winter month (Jan, Feb, Dec)
 */
export function isWinterMonth(date: Date): boolean {
  const month = date.getMonth();
  return WINTER_MONTHS.includes(month);
}

/**
 * Calculate how many winter PTO days have been used from a list of requests
 */
export function getWinterDaysUsed(requests: Array<{
  startDate: string;
  endDate: string;
  status: string;
  days: number;
  isExempt?: boolean | null;
}>): number {
  let winterDays = 0;

  for (const request of requests) {
    // Skip non-approved or exempt requests
    if (request.status !== 'APPROVED' || request.isExempt) continue;

    const start = new Date(request.startDate);
    const end = new Date(request.endDate);
    const current = new Date(start);

    // If it's a single-day request or half-day, check if it's in winter
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff === 0) {
      // Single day request
      if (isWinterMonth(start)) {
        winterDays += request.days;
      }
    } else {
      // Multi-day request - count winter days in the range
      while (current <= end) {
        if (isWinterMonth(current)) {
          winterDays++;
        }
        current.setDate(current.getDate() + 1);
      }
    }
  }

  return winterDays;
}

/**
 * Check if user has met winter PTO requirement
 */
export function hasMetWinterRequirement(requests: Array<{
  startDate: string;
  endDate: string;
  status: string;
  days: number;
  isExempt?: boolean | null;
}>): boolean {
  return getWinterDaysUsed(requests) >= REQUIRED_WINTER_DAYS;
}

/**
 * Get winter requirement status for a specific employee
 */
export async function getWinterRequirementStatus(employeeId: number): Promise<{
  required: number;
  used: number;
  remaining: number;
  isMet: boolean;
}> {
  // Get all approved PTO requests for this employee in the current year
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const yearEnd = new Date(now.getFullYear(), 11, 31);

  const requests = await db.select().from(ptoRequests).where(
    and(
      eq(ptoRequests.employeeId, employeeId),
      eq(ptoRequests.status, 'APPROVED')
    )
  );

  // Filter to current year
  const currentYearRequests = requests.filter(r => {
    const startDate = new Date(r.startDate);
    return startDate >= yearStart && startDate <= yearEnd;
  });

  const used = getWinterDaysUsed(currentYearRequests);
  const remaining = Math.max(0, REQUIRED_WINTER_DAYS - used);
  const isMet = used >= REQUIRED_WINTER_DAYS;

  return {
    required: REQUIRED_WINTER_DAYS,
    used,
    remaining,
    isMet,
  };
}

/**
 * Check if a PTO request overlaps with winter months and generate a warning message
 */
export function checkWinterWarning(
  startDate: string,
  endDate: string,
  winterStatus: { used: number; remaining: number; isMet: boolean }
): string | null {
  // If requirement is already met, no warning needed
  if (winterStatus.isMet) {
    return null;
  }

  // Check if this request is in a winter month
  const start = new Date(startDate);
  const end = new Date(endDate);

  let hasWinterDays = false;
  const current = new Date(start);

  while (current <= end) {
    if (isWinterMonth(current)) {
      hasWinterDays = true;
      break;
    }
    current.setDate(current.getDate() + 1);
  }

  // If not in winter and haven't met requirement, show warning
  if (!hasWinterDays && winterStatus.remaining > 0) {
    return `You have ${winterStatus.remaining} winter PTO days remaining to use (required: ${REQUIRED_WINTER_DAYS} days in Jan, Feb, or Dec)`;
  }

  return null;
}
