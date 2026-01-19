import { db } from "../db.js";
import { onboardingRequirements } from "../../shared/schema.js";

interface RequirementTemplate {
  name: string;
  description?: string;
  category: 'tax' | 'insurance' | 'legal' | 'training' | 'equipment';
  employeeType: 'W2' | '1099' | 'BOTH';
  daysUntilDue: number;
  isRequired?: boolean;
}

export function getDefaultRequirements(employeeType: 'W2' | '1099'): RequirementTemplate[] {
  const common: RequirementTemplate[] = [
    {
      name: 'Employee Handbook Acknowledgment',
      description: 'Review and sign the employee handbook',
      category: 'legal',
      employeeType: 'BOTH',
      daysUntilDue: 7,
      isRequired: true,
    },
    {
      name: 'Emergency Contact Information',
      description: 'Provide emergency contact details',
      category: 'legal',
      employeeType: 'BOTH',
      daysUntilDue: 7,
      isRequired: true,
    },
    {
      name: 'Complete Safety Training',
      description: 'Complete OSHA safety training',
      category: 'training',
      employeeType: 'BOTH',
      daysUntilDue: 14,
      isRequired: true,
    },
  ];

  const w2Only: RequirementTemplate[] = [
    {
      name: 'W-4 Tax Form',
      description: 'Complete federal tax withholding form',
      category: 'tax',
      employeeType: 'W2',
      daysUntilDue: 7,
      isRequired: true,
    },
    {
      name: 'Form I-9 (Employment Eligibility)',
      description: 'Verify identity and employment authorization',
      category: 'legal',
      employeeType: 'W2',
      daysUntilDue: 3,
      isRequired: true,
    },
    {
      name: 'Direct Deposit Form',
      description: 'Set up direct deposit for payroll',
      category: 'tax',
      employeeType: 'W2',
      daysUntilDue: 7,
      isRequired: true,
    },
    {
      name: 'Benefits Enrollment',
      description: 'Select health insurance and other benefits',
      category: 'insurance',
      employeeType: 'W2',
      daysUntilDue: 30,
      isRequired: false,
    },
    {
      name: 'State Tax Withholding Form',
      description: 'Complete state tax withholding',
      category: 'tax',
      employeeType: 'W2',
      daysUntilDue: 7,
      isRequired: true,
    },
  ];

  const contractorOnly: RequirementTemplate[] = [
    {
      name: 'W-9 Tax Form',
      description: 'Provide taxpayer identification for 1099 reporting',
      category: 'tax',
      employeeType: '1099',
      daysUntilDue: 7,
      isRequired: true,
    },
    {
      name: 'Workers Compensation Insurance',
      description: 'CRITICAL: Provide proof of workers comp coverage',
      category: 'insurance',
      employeeType: '1099',
      daysUntilDue: 14,
      isRequired: true,
    },
    {
      name: 'Independent Contractor Agreement',
      description: 'Sign the contractor service agreement',
      category: 'legal',
      employeeType: '1099',
      daysUntilDue: 7,
      isRequired: true,
    },
    {
      name: 'General Liability Insurance',
      description: 'Provide proof of general liability coverage',
      category: 'insurance',
      employeeType: '1099',
      daysUntilDue: 14,
      isRequired: true,
    },
    {
      name: 'Business License/EIN',
      description: 'Provide business license or EIN documentation',
      category: 'legal',
      employeeType: '1099',
      daysUntilDue: 14,
      isRequired: true,
    },
    {
      name: 'Certificate of Insurance (COI)',
      description: 'Submit Certificate of Insurance naming Roof ER as additional insured',
      category: 'insurance',
      employeeType: '1099',
      daysUntilDue: 14,
      isRequired: true,
    },
  ];

  return employeeType === 'W2'
    ? [...common, ...w2Only]
    : [...common, ...contractorOnly];
}

export async function createOnboardingRequirements(
  employeeId: number,
  employeeType: 'W2' | '1099'
) {
  const requirements = getDefaultRequirements(employeeType);
  const now = new Date();

  const insertValues = requirements.map((req) => {
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + req.daysUntilDue);

    return {
      employeeId,
      requirementName: req.name,
      description: req.description,
      category: req.category,
      employeeType: req.employeeType,
      dueDate,
      isRequired: req.isRequired ?? true,
      status: 'pending' as const,
    };
  });

  await db.insert(onboardingRequirements).values(insertValues);
}

export function getRequirementsByCategory(requirements: any[]) {
  const grouped: Record<string, any[]> = {
    tax: [],
    insurance: [],
    legal: [],
    training: [],
    equipment: [],
  };

  requirements.forEach((req) => {
    if (grouped[req.category]) {
      grouped[req.category].push(req);
    }
  });

  return grouped;
}

export function calculateCompletionPercentage(requirements: any[]) {
  if (requirements.length === 0) return 0;

  const completed = requirements.filter(
    (req) => req.status === 'approved' || req.status === 'submitted'
  ).length;

  return Math.round((completed / requirements.length) * 100);
}

export function isRequirementOverdue(requirement: any) {
  if (requirement.status === 'approved' || requirement.status === 'submitted') {
    return false;
  }

  if (!requirement.dueDate) {
    return false;
  }

  return new Date(requirement.dueDate) < new Date();
}
