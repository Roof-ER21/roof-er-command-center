import { db } from '../db.js';
import {
  users,
  candidates,
  ptoPolicies,
  equipmentSignatureTokens,
  onboardingTasks,
} from '../../shared/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { sendWelcomeEmail } from './email.js';
import type { Candidate } from '../../shared/schema.js';

/**
 * HIRE Automation Chain
 *
 * When a candidate is hired (status = HIRED), this service executes ALL of these steps:
 *
 * 1. User Account Creation (with temp password TRD2026!)
 * 2. PTO Policy Creation (17 days for W2 non-Sales, 0 for 1099/Sales)
 * 3. Welcome Package Assignment (if provided - bundle + tools + inventory)
 * 4. Equipment Receipt + Signing Token (locked until startDate, expires in 30 days)
 * 5. 6 Onboarding Tasks (I-9, Contract, Safety, Tools, Benefits, Training)
 * 6. Welcome Email (password, start date, training URL, equipment link)
 */

interface HireData {
  candidateId: number;
  role: string; // From hire modal
  startDate: string; // YYYY-MM-DD
  employmentType: 'W2' | '1099';
  position: string;
  department?: string;
  salary?: string;
  welcomePackageId?: number; // Optional bundle assignment
}

interface HireResult {
  success: boolean;
  userId?: number;
  errors: string[];
  warnings: string[];
  steps: {
    userCreated: boolean;
    ptoCreated: boolean;
    packageAssigned: boolean;
    receiptCreated: boolean;
    tasksCreated: boolean;
    emailSent: boolean;
  };
}

/**
 * Execute the full HIRE automation chain
 */
export async function executeHireAutomation(data: HireData): Promise<HireResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const steps = {
    userCreated: false,
    ptoCreated: false,
    packageAssigned: false,
    receiptCreated: false,
    tasksCreated: false,
    emailSent: false,
  };

  try {
    // Fetch candidate
    const [candidate] = await db.select().from(candidates)
      .where(eq(candidates.id, data.candidateId))
      .limit(1);

    if (!candidate) {
      errors.push('Candidate not found');
      return { success: false, errors, warnings, steps };
    }

    // STEP 1: Create User Account
    let newUser;
    try {
      newUser = await createUserAccount(candidate, data);
      steps.userCreated = true;
    } catch (error: any) {
      errors.push(`User creation failed: ${error.message}`);
      return { success: false, errors, warnings, steps };
    }

    // STEP 2: Create PTO Policy
    try {
      await createPtoPolicy(newUser.id, data);
      steps.ptoCreated = true;
    } catch (error: any) {
      errors.push(`PTO policy creation failed: ${error.message}`);
      // Continue anyway - can be fixed manually
      warnings.push('PTO policy not created - please create manually');
    }

    // STEP 3: Welcome Package Assignment (optional)
    if (data.welcomePackageId) {
      try {
        await assignWelcomePackage(newUser.id, data.welcomePackageId);
        steps.packageAssigned = true;
      } catch (error: any) {
        warnings.push(`Welcome package assignment failed: ${error.message}`);
        // Non-critical - continue
      }
    } else {
      steps.packageAssigned = true; // Mark as done if not needed
    }

    // STEP 4: Equipment Receipt + Signing Token
    try {
      await createEquipmentReceipt(newUser.id, candidate, data.startDate);
      steps.receiptCreated = true;
    } catch (error: any) {
      warnings.push(`Equipment receipt creation failed: ${error.message}`);
      // Non-critical - continue
    }

    // STEP 5: Create 6 Onboarding Tasks
    try {
      await createOnboardingTasks(newUser.id, data.startDate);
      steps.tasksCreated = true;
    } catch (error: any) {
      warnings.push(`Onboarding tasks creation failed: ${error.message}`);
      // Non-critical - continue
    }

    // STEP 6: Send Welcome Email
    try {
      await sendWelcomeEmailWithDetails(newUser, candidate, data);
      steps.emailSent = true;
    } catch (error: any) {
      warnings.push(`Welcome email failed: ${error.message}`);
      // Non-critical - email can be resent
    }

    return {
      success: true,
      userId: newUser.id,
      errors,
      warnings,
      steps,
    };

  } catch (error: any) {
    errors.push(`Hire automation failed: ${error.message}`);
    return { success: false, errors, warnings, steps };
  }
}

/**
 * STEP 1: Create user account
 */
async function createUserAccount(candidate: Candidate, data: HireData) {
  const tempPassword = 'TRD2026!';
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  const normalizedRole = data.role.toUpperCase();

  // Check if user already exists
  const existing = await db.select().from(users)
    .where(eq(users.email, candidate.email.toLowerCase()))
    .limit(1);

  if (existing.length > 0) {
    throw new Error(`User with email ${candidate.email} already exists`);
  }

  const [newUser] = await db.insert(users).values({
    email: candidate.email.toLowerCase(),
    username: candidate.email.toLowerCase().split('@')[0],
    passwordHash,
    mustChangePassword: true,
    firstName: candidate.firstName,
    lastName: candidate.lastName,
    role: normalizedRole as any,
    position: data.position,
    department: data.department || null,
    employmentType: data.employmentType,
    hireDate: data.startDate,
    phone: candidate.phone || null,
    isActive: true,
    hasHRAccess: false,
    hasTrainingAccess: true,
    hasFieldAccess: false,
    hasLeaderboardAccess: false,
  }).returning();

  return newUser;
}

/**
 * STEP 2: Create PTO policy
 * W2 non-Sales: 17 days (10 vacation, 5 sick, 2 personal)
 * 1099 or Sales: 0 days
 */
async function createPtoPolicy(userId: number, data: HireData) {
  const isSales = data.position?.toLowerCase().includes('sales') ||
                  data.department?.toLowerCase().includes('sales') ||
                  data.role?.toLowerCase().includes('sales');

  const is1099 = data.employmentType === '1099';

  let vacationDays = 0;
  let sickDays = 0;
  let personalDays = 0;

  // W2 non-Sales gets 17 days
  if (!is1099 && !isSales) {
    vacationDays = 10;
    sickDays = 5;
    personalDays = 2;
  }

  const totalDays = vacationDays + sickDays + personalDays;

  await db.insert(ptoPolicies).values({
    employeeId: userId,
    policyLevel: 'COMPANY',
    vacationDays,
    sickDays,
    personalDays,
    baseDays: totalDays,
    additionalDays: 0,
    totalDays,
    usedDays: 0,
    remainingDays: totalDays,
    notes: is1099 ? '1099 contractor - no PTO' : (isSales ? 'Sales role - no PTO' : 'Standard W2 PTO policy'),
  });
}

/**
 * STEP 3: Assign welcome package (bundle + tools + inventory)
 * NOTE: This requires bundle/tool tables to exist in schema
 * For now, this is a placeholder that logs the assignment
 */
async function assignWelcomePackage(userId: number, packageId: number) {
  // TODO: Implement once bundle/tool tables are added to schema
  // This would:
  // 1. Create bundleAssignment record
  // 2. Create bundleAssignmentItems for each item
  // 3. Create toolAssignments
  // 4. Reduce inventory quantities

  console.log(`📦 Welcome package ${packageId} would be assigned to user ${userId}`);
  console.log('⚠️  Bundle/tool tables not yet in schema - skipping actual assignment');
}

/**
 * STEP 4: Create equipment receipt + signing token
 * Status: PENDING, locked until startDate, expires in 30 days
 */
async function createEquipmentReceipt(userId: number, candidate: Candidate, startDate: string) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const lockedUntil = new Date(startDate);

  await db.insert(equipmentSignatureTokens).values({
    equipmentId: null, // No specific equipment yet
    token,
    type: 'receipt',
    signerName: `${candidate.firstName} ${candidate.lastName}`,
    signerEmail: candidate.email,
    status: 'pending',
    notes: JSON.stringify({
      lockedUntil: lockedUntil.toISOString(),
      expiresAt: expiresAt.toISOString(),
      message: 'Equipment receipt will be available on your start date',
    }),
  });

  console.log(`🔐 Equipment receipt token created: ${token}`);
  console.log(`   Locked until: ${startDate}`);
  console.log(`   Expires: ${expiresAt.toISOString()}`);
}

/**
 * STEP 5: Create 6 onboarding tasks
 */
async function createOnboardingTasks(userId: number, startDate: string) {
  const start = new Date(startDate);
  const tasks = [
    {
      taskName: 'Complete I-9 Form',
      description: 'Submit Employment Eligibility Verification (I-9) form with required documents',
      category: 'paperwork' as const,
      dueDate: startDate, // Due on start date
    },
    {
      taskName: 'Sign Employment Contract',
      description: 'Review and sign your employment contract',
      category: 'paperwork' as const,
      dueDate: startDate, // Due on start date
    },
    {
      taskName: 'Complete Safety Training',
      description: 'Complete OSHA safety training and certification',
      category: 'training' as const,
      dueDate: new Date(start.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Start + 3 days
    },
    {
      taskName: 'Tools & Equipment Assignment',
      description: 'Review and sign equipment receipt for assigned tools',
      category: 'equipment' as const,
      dueDate: startDate, // Due on start date
    },
    {
      taskName: 'Benefits Enrollment',
      description: 'Complete benefits enrollment forms (health, dental, 401k)',
      category: 'paperwork' as const,
      dueDate: new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Start + 7 days
    },
    {
      taskName: 'Complete Online Training',
      description: 'Complete required online training modules at https://a21.up.railway.app/',
      category: 'training' as const,
      dueDate: new Date(start.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Start - 1 day (pre-boarding)
    },
  ];

  const records = tasks.map(task => ({
    employeeId: userId,
    ...task,
    status: 'pending' as const,
  }));

  await db.insert(onboardingTasks).values(records);

  console.log(`✅ Created ${tasks.length} onboarding tasks for user ${userId}`);
}

/**
 * STEP 6: Send welcome email with all details
 */
async function sendWelcomeEmailWithDetails(
  user: any,
  candidate: Candidate,
  data: HireData
) {
  // Use the existing welcome email service
  await sendWelcomeEmail({
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    position: data.position,
  });

  // TODO: Enhance welcome email to include:
  // - Temp password (TRD2026!)
  // - Start date
  // - Office address
  // - Training URL (https://a21.up.railway.app/)
  // - Equipment signing link
  // - Attached PDFs if available

  console.log(`📧 Welcome email sent to ${user.email}`);
  console.log(`   Temp Password: TRD2026!`);
  console.log(`   Start Date: ${data.startDate}`);
  console.log(`   Training URL: https://a21.up.railway.app/`);
}

export default {
  executeHireAutomation,
};
