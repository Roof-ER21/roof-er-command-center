/**
 * Business Days Service
 * Calculates business days excluding weekends and company holidays
 */

import { db } from "../db.js";
import { companyPtoPolicy } from "@/shared/schema.js";

/**
 * Check if a date is a weekend (Saturday or Sunday)
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
}

/**
 * Check if a date is a company holiday
 */
export function isHoliday(date: Date, holidays: string[]): boolean {
  const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
  return holidays.includes(dateString);
}

/**
 * Get company holidays from the database
 * Returns array of date strings in YYYY-MM-DD format
 */
export async function getCompanyHolidays(): Promise<string[]> {
  try {
    const [policy] = await db.select().from(companyPtoPolicy).limit(1);

    if (!policy || !policy.holidaySchedule) {
      console.log("⚠️ No company PTO policy or holiday schedule found");
      return [];
    }

    // Parse holidaySchedule (expected format: JSON array of {date, name})
    const holidays = JSON.parse(policy.holidaySchedule) as Array<{ date: string; name: string }>;
    return holidays.map(h => h.date);
  } catch (error) {
    console.error("Error fetching company holidays:", error);
    return [];
  }
}

/**
 * Calculate the number of business days between two dates (inclusive)
 * Excludes weekends and company holidays
 */
export async function calculateBusinessDays(
  startDate: Date,
  endDate: Date,
  holidays?: string[]
): Promise<number> {
  // Fetch holidays if not provided
  const holidayList = holidays || await getCompanyHolidays();

  let count = 0;
  const current = new Date(startDate);
  const end = new Date(endDate);

  // Normalize times to midnight for accurate comparison
  current.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  while (current <= end) {
    // Check if current day is a business day (not weekend, not holiday)
    if (!isWeekend(current) && !isHoliday(current, holidayList)) {
      count++;
    }

    // Move to next day
    current.setDate(current.getDate() + 1);
  }

  console.log(`📅 Business days calculated: ${count} days between ${startDate.toISOString().split('T')[0]} and ${endDate.toISOString().split('T')[0]}`);

  return count;
}

/**
 * Calculate business days synchronously (without holiday checking)
 * Use this for quick calculations when holidays are not critical
 */
export function calculateBusinessDaysSync(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);
  const end = new Date(endDate);

  // Normalize times to midnight
  current.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  while (current <= end) {
    if (!isWeekend(current)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}
