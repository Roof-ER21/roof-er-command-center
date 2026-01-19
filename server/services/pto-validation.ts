/**
 * PTO Validation Service
 * Centralized validation logic for PTO requests
 */

import { db } from "../db.js";
import { users, ptoRequests } from "../../shared/schema.js";
import { eq, and, or, sql } from "drizzle-orm";
import { calculateBusinessDays } from "./business-days.js";
import { selectUserColumns } from "../utils/user-select.js";

export interface PTOValidationResult {
  isValid: boolean;
  error?: string;
  details?: Record<string, any>;
}

/**
 * Validate that employee is eligible for PTO
 * Blocks 1099, CONTRACTOR, SUB_CONTRACTOR, and Sales department
 */
export async function validateEmployeeEligibility(employeeId: number): Promise<PTOValidationResult> {
  const [employee] = await db.select(selectUserColumns()).from(users).where(eq(users.id, employeeId)).limit(1);

  if (!employee) {
    return {
      isValid: false,
      error: "Employee not found"
    };
  }

  // Check employment type
  const ineligibleEmploymentTypes = ['1099', 'CONTRACTOR', 'SUB_CONTRACTOR'];
  if (employee.employmentType && ineligibleEmploymentTypes.includes(employee.employmentType)) {
    console.log(`❌ PTO rejected: Employee ${employeeId} has ineligible employment type: ${employee.employmentType}`);
    return {
      isValid: false,
      error: `PTO is not available for ${employee.employmentType} employees`
    };
  }

  // Check department
  if (employee.department?.toUpperCase() === 'SALES') {
    console.log(`❌ PTO rejected: Employee ${employeeId} is in Sales department`);
    return {
      isValid: false,
      error: "PTO is not available for Sales department employees"
    };
  }

  return {
    isValid: true,
    details: { employee }
  };
}

/**
 * Check for duplicate/overlapping PTO requests
 */
export async function validateNoDuplicateRequests(
  employeeId: number,
  startDate: string,
  endDate: string
): Promise<PTOValidationResult> {
  const existingRequests = await db.select()
    .from(ptoRequests)
    .where(
      and(
        eq(ptoRequests.employeeId, employeeId),
        or(
          eq(ptoRequests.status, 'PENDING'),
          eq(ptoRequests.status, 'APPROVED')
        ),
        // Check for date overlap
        sql`(
          (${ptoRequests.startDate} <= ${endDate} AND ${ptoRequests.endDate} >= ${startDate})
        )`
      )
    );

  if (existingRequests.length > 0) {
    const existing = existingRequests[0];
    console.log(`❌ PTO rejected: Employee ${employeeId} already has ${existing.status} request for overlapping dates`);
    return {
      isValid: false,
      error: `You already have a ${existing.status?.toLowerCase()} PTO request for these dates (${existing.startDate} to ${existing.endDate})`,
      details: { existingRequest: existing }
    };
  }

  return { isValid: true };
}

/**
 * Check for department conflicts (another employee in same department with approved PTO)
 */
export async function validateDepartmentConflict(
  employeeId: number,
  department: string,
  startDate: string,
  endDate: string
): Promise<PTOValidationResult> {
  const departmentConflicts = await db.select()
    .from(ptoRequests)
    .innerJoin(users, eq(ptoRequests.employeeId, users.id))
    .where(
      and(
        eq(ptoRequests.status, 'APPROVED'),
        eq(users.department, department),
        sql`${users.id} != ${employeeId}`, // Exclude current employee
        // Check for date overlap
        sql`(
          (${ptoRequests.startDate} <= ${endDate} AND ${ptoRequests.endDate} >= ${startDate})
        )`
      )
    );

  if (departmentConflicts.length > 0) {
    const conflict = departmentConflicts[0];
    const conflictEmployee = conflict.users;
    console.log(`⚠️ PTO conflict detected: ${conflictEmployee.firstName} ${conflictEmployee.lastName} (${department}) has approved PTO for overlapping dates`);
    return {
      isValid: false,
      error: `Department conflict: ${conflictEmployee.firstName} ${conflictEmployee.lastName} already has approved PTO from ${conflict.pto_requests.startDate} to ${conflict.pto_requests.endDate}`,
      details: {
        conflictingEmployee: `${conflictEmployee.firstName} ${conflictEmployee.lastName}`,
        conflictDates: `${conflict.pto_requests.startDate} to ${conflict.pto_requests.endDate}`
      }
    };
  }

  return { isValid: true };
}

/**
 * Validate that start date is in the future
 */
export function validateFutureDate(startDate: Date): PTOValidationResult {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (startDate < today) {
    console.log(`❌ PTO rejected: Start date ${startDate.toISOString().split('T')[0]} is in the past`);
    return {
      isValid: false,
      error: "PTO start date must be in the future"
    };
  }

  return { isValid: true };
}

/**
 * Calculate PTO days using business days (excluding weekends and holidays)
 */
export async function calculatePTODays(startDate: Date, endDate: Date): Promise<number> {
  const businessDays = await calculateBusinessDays(startDate, endDate);
  console.log(`📅 PTO request: ${businessDays} business days (${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]})`);
  return businessDays;
}

/**
 * Run all PTO validations for a new request
 */
export async function validatePTORequest(
  employeeId: number,
  startDate: Date,
  endDate: Date
): Promise<PTOValidationResult> {
  // 1. Validate future date
  const futureDateResult = validateFutureDate(startDate);
  if (!futureDateResult.isValid) {
    return futureDateResult;
  }

  // 2. Validate employee eligibility
  const eligibilityResult = await validateEmployeeEligibility(employeeId);
  if (!eligibilityResult.isValid) {
    return eligibilityResult;
  }

  const employee = eligibilityResult.details?.employee;
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  // 3. Check for duplicate requests
  const duplicateResult = await validateNoDuplicateRequests(employeeId, startDateStr, endDateStr);
  if (!duplicateResult.isValid) {
    return duplicateResult;
  }

  // 4. Check for department conflicts (if employee has a department)
  if (employee.department) {
    const conflictResult = await validateDepartmentConflict(
      employeeId,
      employee.department,
      startDateStr,
      endDateStr
    );
    if (!conflictResult.isValid) {
      return conflictResult;
    }
  }

  return {
    isValid: true,
    details: { employee }
  };
}
