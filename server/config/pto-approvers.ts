/**
 * PTO Approvers Configuration
 *
 * Defines the approval routing logic for PTO requests based on employee and department.
 */

export interface Approver {
  email: string;
  name: string;
  role?: string;
}

export const PTO_APPROVERS = {
  /**
   * Core approvers who can approve most PTO requests
   */
  CORE_APPROVERS: [
    {
      email: 'ahmed.mahmoud@theroofdocs.com',
      name: 'Ahmed Mahmoud',
      role: 'SYSTEM_ADMIN'
    },
    {
      email: 'ford.barsi@theroofdocs.com',
      name: 'Ford Barsi',
      role: 'GENERAL_MANAGER'
    },
    {
      email: 'reese.samala@theroofdocs.com',
      name: 'Reese Samala',
      role: 'Core Approver'
    },
    {
      email: 'oliver.brown@theroofdocs.com',
      name: 'Oliver Brown',
      role: 'Core Approver'
    },
  ] as Approver[],

  /**
   * Department-specific approvers
   * Department approvers provide secondary approval - still needs core approver review
   */
  DEPARTMENT_APPROVERS: {
    'Production': [
      {
        email: 'greg.campbell@theroofdocs.com',
        name: 'Greg Campbell',
        role: 'Production Manager'
      }
    ],
    // Add more departments as needed
    // 'Sales': [...],
    // 'Office': [...],
  } as Record<string, Approver[]>,

  /**
   * Special routing for specific employees
   * Ford and Reese's requests go ONLY to Ahmed and Oliver
   */
  SPECIAL_ROUTING: {
    'ford.barsi@theroofdocs.com': [
      'ahmed.mahmoud@theroofdocs.com',
      'oliver.brown@theroofdocs.com'
    ],
    'reese.samala@theroofdocs.com': [
      'ahmed.mahmoud@theroofdocs.com',
      'oliver.brown@theroofdocs.com'
    ],
  } as Record<string, string[]>,
};

/**
 * Get the list of approver emails for a specific employee's PTO request
 *
 * @param employeeEmail - Email of the employee making the request
 * @param department - Department of the employee (optional)
 * @returns Array of approver email addresses
 */
export function getApproversForRequest(
  employeeEmail: string,
  department?: string | null
): string[] {
  const normalizedEmail = employeeEmail.toLowerCase().trim();

  // Check for special routing first
  if (PTO_APPROVERS.SPECIAL_ROUTING[normalizedEmail]) {
    return PTO_APPROVERS.SPECIAL_ROUTING[normalizedEmail];
  }

  // Otherwise, get core approvers
  const approverEmails = PTO_APPROVERS.CORE_APPROVERS.map(a => a.email);

  // Add department approvers if applicable
  if (department && PTO_APPROVERS.DEPARTMENT_APPROVERS[department]) {
    const deptApprovers = PTO_APPROVERS.DEPARTMENT_APPROVERS[department].map(a => a.email);
    approverEmails.push(...deptApprovers);
  }

  // Remove duplicates and exclude the requestor
  return [...new Set(approverEmails)].filter(
    email => email.toLowerCase() !== normalizedEmail
  );
}

/**
 * Check if a user is authorized to approve a specific PTO request
 *
 * @param approverEmail - Email of the user attempting to approve
 * @param requestEmployeeEmail - Email of the employee who made the request
 * @param requestDepartment - Department of the requesting employee (optional)
 * @returns true if the user can approve, false otherwise
 */
export function canUserApprove(
  approverEmail: string,
  requestEmployeeEmail: string,
  requestDepartment?: string | null
): boolean {
  const normalizedApproverEmail = approverEmail.toLowerCase().trim();
  const authorizedApprovers = getApproversForRequest(requestEmployeeEmail, requestDepartment);

  return authorizedApprovers.some(
    email => email.toLowerCase() === normalizedApproverEmail
  );
}

/**
 * Get approver information by email
 *
 * @param email - Email of the approver
 * @returns Approver object if found, null otherwise
 */
export function getApproverByEmail(email: string): Approver | null {
  const normalizedEmail = email.toLowerCase().trim();

  // Search in core approvers
  const coreApprover = PTO_APPROVERS.CORE_APPROVERS.find(
    a => a.email.toLowerCase() === normalizedEmail
  );
  if (coreApprover) return coreApprover;

  // Search in department approvers
  for (const deptApprovers of Object.values(PTO_APPROVERS.DEPARTMENT_APPROVERS)) {
    const deptApprover = deptApprovers.find(
      a => a.email.toLowerCase() === normalizedEmail
    );
    if (deptApprover) return deptApprover;
  }

  return null;
}

/**
 * Check if an approver is a department-specific approver (not a core approver)
 *
 * @param email - Email of the approver
 * @returns true if department approver, false if core approver or not found
 */
export function isDepartmentApprover(email: string): boolean {
  const normalizedEmail = email.toLowerCase().trim();

  // If they're in core approvers, return false
  const isCoreApprover = PTO_APPROVERS.CORE_APPROVERS.some(
    a => a.email.toLowerCase() === normalizedEmail
  );
  if (isCoreApprover) return false;

  // Check if they're in any department approver list
  for (const deptApprovers of Object.values(PTO_APPROVERS.DEPARTMENT_APPROVERS)) {
    const isDept = deptApprovers.some(
      a => a.email.toLowerCase() === normalizedEmail
    );
    if (isDept) return true;
  }

  return false;
}
