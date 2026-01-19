/**
 * PTO Approval Service
 *
 * Handles approval routing logic and authorization for PTO requests.
 */

import { db } from '../db.js';
import { users } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';
import {
  getApproversForRequest,
  canUserApprove,
  getApproverByEmail,
  isDepartmentApprover,
  type Approver,
} from '../config/pto-approvers.js';

/**
 * Get the list of approvers for a PTO request by employee ID
 *
 * @param employeeId - Database ID of the employee
 * @returns Promise<string[]> - Array of approver email addresses
 */
export async function getApproverEmails(employeeId: number): Promise<string[]> {
  try {
    // Get employee details
    const [employee] = await db
      .select({
        email: users.email,
        department: users.department,
      })
      .from(users)
      .where(eq(users.id, employeeId))
      .limit(1);

    if (!employee) {
      console.error(`❌ Employee with ID ${employeeId} not found`);
      return [];
    }

    const approverEmails = getApproversForRequest(
      employee.email,
      employee.department
    );

    console.log(
      `✅ Found ${approverEmails.length} approver(s) for ${employee.email} (Dept: ${employee.department || 'N/A'})`
    );

    return approverEmails;
  } catch (error) {
    console.error('Error getting approver emails:', error);
    return [];
  }
}

/**
 * Get approver user objects from the database
 *
 * @param employeeId - Database ID of the employee
 * @returns Promise<Approver[]> - Array of approver objects with details
 */
export async function getApproverUsers(
  employeeId: number
): Promise<Array<{ id: number; email: string; firstName: string; lastName: string; role?: string }>> {
  try {
    const approverEmails = await getApproverEmails(employeeId);

    if (approverEmails.length === 0) {
      return [];
    }

    // Fetch approver user details from database
    const approverUsers = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
      })
      .from(users)
      .where(eq(users.isActive, true));

    // Filter to only include authorized approvers
    const authorizedApprovers = approverUsers.filter(user =>
      approverEmails.some(email => email.toLowerCase() === user.email.toLowerCase())
    );

    return authorizedApprovers;
  } catch (error) {
    console.error('Error getting approver users:', error);
    return [];
  }
}

/**
 * Check if a user can approve a specific employee's PTO request
 *
 * @param approverEmail - Email of the user attempting to approve
 * @param employeeId - Database ID of the employee who made the request
 * @returns Promise<boolean> - true if authorized, false otherwise
 */
export async function canUserApprovePTORequest(
  approverEmail: string,
  employeeId: number
): Promise<boolean> {
  try {
    // Get employee details
    const [employee] = await db
      .select({
        email: users.email,
        department: users.department,
      })
      .from(users)
      .where(eq(users.id, employeeId))
      .limit(1);

    if (!employee) {
      console.error(`❌ Employee with ID ${employeeId} not found`);
      return false;
    }

    const isAuthorized = canUserApprove(
      approverEmail,
      employee.email,
      employee.department
    );

    if (!isAuthorized) {
      console.log(
        `⚠️  ${approverEmail} is NOT authorized to approve PTO for ${employee.email}`
      );
    }

    return isAuthorized;
  } catch (error) {
    console.error('Error checking approval authorization:', error);
    return false;
  }
}

/**
 * Check if the approver is a department-specific approver (not core)
 *
 * @param approverEmail - Email of the approver
 * @returns boolean - true if department approver, false if core approver
 */
export function isSecondaryApprover(approverEmail: string): boolean {
  return isDepartmentApprover(approverEmail);
}

/**
 * Get approver configuration info
 *
 * @param email - Email of the approver
 * @returns Approver object or null
 */
export function getApproverInfo(email: string): Approver | null {
  return getApproverByEmail(email);
}

export { getApproversForRequest, canUserApprove };
