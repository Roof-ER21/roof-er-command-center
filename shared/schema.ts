import { z } from 'zod';
import {
  pgTable,
  pgSchema,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  real,
  decimal,
  jsonb,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { relations } from 'drizzle-orm';

// ============================================================================
// DATABASE SCHEMAS (for organization)
// ============================================================================
export const coreSchema = pgSchema('core');
export const hrSchema = pgSchema('hr');
export const salesSchema = pgSchema('sales');
export const trainingSchema = pgSchema('training');
export const fieldSchema = pgSchema('field');
export const aiSchema = pgSchema('ai');

// ============================================================================
// CORE SCHEMA - Users & Sessions (Unified from all apps)
// ============================================================================

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  username: text('username').unique(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  passwordHash: text('password_hash'),
  pinHash: text('pin_hash'),

  // Role (unified from all apps)
  role: text('role').$type<
    | 'SYSTEM_ADMIN' | 'HR_ADMIN' | 'GENERAL_MANAGER' | 'TERRITORY_MANAGER'
    | 'MANAGER' | 'TEAM_LEAD' | 'EMPLOYEE' | 'FIELD_TECH' | 'SALES_REP'
    | 'CONTRACTOR' | 'SOURCER' | 'TRAINEE' | 'INSURANCE_MANAGER' | 'RETAIL_MANAGER'
  >().notNull().default('EMPLOYEE'),

  // Module access flags
  hasHRAccess: boolean('has_hr_access').notNull().default(false),
  hasLeaderboardAccess: boolean('has_leaderboard_access').notNull().default(false),
  hasTrainingAccess: boolean('has_training_access').notNull().default(true),
  hasFieldAccess: boolean('has_field_access').notNull().default(false),

  // HR fields (from Roof HR)
  department: text('department'),
  position: text('position'),
  employmentType: text('employment_type').$type<'W2' | '1099' | 'CONTRACTOR' | 'SUB_CONTRACTOR'>(),
  hireDate: text('hire_date'),
  terminationDate: text('termination_date'),
  territoryId: integer('territory_id'),
  phone: text('phone'),
  address: text('address'),
  emergencyContact: text('emergency_contact'),
  emergencyPhone: text('emergency_phone'),
  shirtSize: text('shirt_size').$type<'S' | 'M' | 'L' | 'XL' | 'XXL' | '3X'>(),
  timezone: text('timezone').default('America/New_York'),

  // Sales/Leaderboard fields (from RoofTrack)
  linkedSalesRepId: integer('linked_sales_rep_id'),
  team: text('team'),
  currentBonusTier: text('current_bonus_tier'),

  // Training fields (from Agnes-21)
  trainingLevel: text('training_level').$type<'beginner' | 'intermediate' | 'advanced' | 'expert' | 'master'>().default('beginner'),
  totalXp: integer('total_xp').notNull().default(0),
  currentLevel: integer('current_level').notNull().default(1),
  currentStreak: integer('current_streak').notNull().default(0),
  longestStreak: integer('longest_streak').notNull().default(0),
  lastPracticeDate: text('last_practice_date'),
  avatar: text('avatar').default('👤'),
  division: text('division').$type<'insurance' | 'retail'>().default('insurance'),

  // Field fields (from Gemini Field)
  preferredState: text('preferred_state').$type<'VA' | 'MD' | 'PA'>(),
  preferredAiProvider: text('preferred_ai_provider').$type<'gemini' | 'openai' | 'groq' | 'anthropic'>().default('gemini'),

  // Status & Auth
  isActive: boolean('is_active').notNull().default(true),
  mustChangePassword: boolean('must_change_password').notNull().default(false),
  lastPasswordChange: timestamp('last_password_change'),
  lastLoginAt: timestamp('last_login_at'),
  firstLoginAt: timestamp('first_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  authMethod: text('auth_method').$type<'password' | 'pin' | 'magic_link'>().notNull().default('password'),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// ============================================================================
// HR SCHEMA - PTO, Recruiting, Contracts, Equipment
// ============================================================================

export const territories = pgTable('territories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  region: text('region').notNull(),
  salesManagerId: integer('sales_manager_id'),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const ptoRequests = pgTable('pto_requests', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').notNull().references(() => users.id),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  days: real('days').notNull(),
  type: text('type').$type<'VACATION' | 'SICK' | 'PERSONAL'>().notNull().default('VACATION'),
  reason: text('reason').notNull(),
  status: text('status').$type<'PENDING' | 'APPROVED' | 'DENIED'>().notNull().default('PENDING'),
  reviewedBy: integer('reviewed_by'),
  reviewedAt: timestamp('reviewed_at'),
  reviewNotes: text('review_notes'),
  isExempt: boolean('is_exempt').notNull().default(false),
  googleEventId: text('google_event_id'),
  hrCalendarEventId: text('hr_calendar_event_id'),
  createdByAdmin: integer('created_by_admin').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const candidates = pgTable('candidates', {
  id: serial('id').primaryKey(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  position: text('position').notNull(),
  status: text('status').$type<'new' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected'>().notNull().default('new'),
  resumeUrl: text('resume_url'),
  source: text('source'),
  rating: integer('rating'),
  notes: text('notes'),
  assignedTo: integer('assigned_to').references(() => users.id),
  referralName: text('referral_name'),
  isArchived: boolean('is_archived').notNull().default(false),
  archivedAt: timestamp('archived_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const candidateNotes = pgTable('candidate_notes', {
  id: serial('id').primaryKey(),
  candidateId: integer('candidate_id').notNull().references(() => candidates.id),
  authorId: integer('author_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  type: text('type').$type<'GENERAL' | 'INTERVIEW' | 'REFERENCE' | 'INTERNAL'>().notNull().default('GENERAL'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const employeeNotes = pgTable('employee_notes', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').notNull().references(() => users.id),
  authorId: integer('author_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  type: text('type').$type<'GENERAL' | 'PERFORMANCE' | 'DISCIPLINARY' | 'RECOGNITION'>().notNull().default('GENERAL'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const hrAssignments = pgTable('hr_assignments', {
  id: serial('id').primaryKey(),
  type: text('type').$type<'CANDIDATE' | 'EMPLOYEE'>().notNull(),
  assigneeId: integer('assignee_id').notNull(), // ID of candidate or user
  hrMemberId: integer('hr_member_id').notNull().references(() => users.id),
  assignedBy: integer('assigned_by').references(() => users.id),
  role: text('role').$type<'PRIMARY' | 'SECONDARY' | 'BACKUP'>().default('PRIMARY'),
  status: text('status').$type<'ACTIVE' | 'COMPLETED' | 'CANCELLED'>().default('ACTIVE'),
  notes: text('notes'),
  startDate: timestamp('start_date').defaultNow(),
  endDate: timestamp('end_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const contracts = pgTable('contracts', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').references(() => users.id),
  candidateId: integer('candidate_id').references(() => candidates.id),
  title: text('title').notNull(),
  content: text('content').notNull(),
  fileUrl: text('file_url'),
  status: text('status').$type<'DRAFT' | 'SENT' | 'VIEWED' | 'SIGNED' | 'REJECTED'>().notNull().default('DRAFT'),
  sentDate: timestamp('sent_date'),
  signedDate: timestamp('signed_date'),
  signature: text('signature'),
  signatureIp: text('signature_ip'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const equipment = pgTable('equipment', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  serialNumber: text('serial_number'),
  assignedTo: integer('assigned_to').references(() => users.id),
  status: text('status').$type<'available' | 'assigned' | 'maintenance' | 'retired'>().notNull().default('available'),
  purchaseDate: text('purchase_date'),
  purchasePrice: decimal('purchase_price', { precision: 10, scale: 2 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const onboardingTasks = pgTable('onboarding_tasks', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').notNull().references(() => users.id),
  taskName: text('task_name').notNull(),
  description: text('description'),
  category: text('category').$type<'paperwork' | 'training' | 'equipment' | 'access' | 'orientation'>().default('orientation'),
  status: text('status').$type<'pending' | 'in_progress' | 'completed' | 'skipped'>().notNull().default('pending'),
  dueDate: text('due_date'),
  assignedTo: integer('assigned_to').references(() => users.id), // HR rep responsible
  completedAt: timestamp('completed_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const interviews = pgTable('interviews', {
  id: serial('id').primaryKey(),
  candidateId: integer('candidate_id').notNull().references(() => candidates.id),
  interviewerId: integer('interviewer_id').references(() => users.id),
  scheduledAt: timestamp('scheduled_at').notNull(),
  duration: integer('duration').default(60), // minutes
  type: text('type').$type<'phone' | 'video' | 'in_person' | 'panel'>().default('video'),
  status: text('status').$type<'scheduled' | 'completed' | 'cancelled' | 'no_show'>().notNull().default('scheduled'),
  location: text('location'),
  meetingLink: text('meeting_link'),
  rating: integer('rating'), // 1-5
  notes: text('notes'),
  feedback: text('feedback'),
  recommendation: text('recommendation').$type<'hire' | 'reject' | 'second_interview' | 'hold'>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const companyPtoPolicy = pgTable('company_pto_policy', {
  id: serial('id').primaryKey(),
  vacationDays: integer('vacation_days').notNull().default(10),
  sickDays: integer('sick_days').notNull().default(5),
  personalDays: integer('personal_days').notNull().default(2),
  totalDays: integer('total_days').notNull().default(17),
  blackoutDates: text('blackout_dates'), // JSON array of date strings
  holidaySchedule: text('holiday_schedule'), // JSON array of {date, name}
  policyNotes: text('policy_notes'),
  lastUpdatedBy: integer('last_updated_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const ptoPolicies = pgTable('pto_policies', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').notNull().unique().references(() => users.id),
  policyLevel: text('policy_level').$type<'COMPANY' | 'DEPARTMENT' | 'INDIVIDUAL'>().notNull().default('COMPANY'),
  vacationDays: integer('vacation_days').notNull().default(10),
  sickDays: integer('sick_days').notNull().default(5),
  personalDays: integer('personal_days').notNull().default(2),
  baseDays: integer('base_days').notNull(), // Base allocation from company/department
  additionalDays: integer('additional_days').notNull().default(0), // Manager customization
  totalDays: integer('total_days').notNull(), // Total available days
  usedDays: integer('used_days').notNull().default(0),
  remainingDays: integer('remaining_days').notNull(),
  customizedBy: integer('customized_by').references(() => users.id),
  customizationDate: timestamp('customization_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const departmentPtoSettings = pgTable('department_pto_settings', {
  id: serial('id').primaryKey(),
  department: text('department').notNull().unique(),
  vacationDays: integer('vacation_days').notNull(),
  sickDays: integer('sick_days').notNull(),
  personalDays: integer('personal_days').notNull(),
  totalDays: integer('total_days').notNull(),
  inheritFromCompany: boolean('inherit_from_company').notNull().default(true),
  customNotes: text('custom_notes'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const documents = pgTable('documents', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category').$type<
    'POLICY' | 'FORM' | 'HANDBOOK' | 'PROCEDURE' | 'TEMPLATE' | 'LEGAL' | 'TRAINING' | 'OTHER'
  >().notNull().default('OTHER'),
  type: text('type').$type<'PDF' | 'DOC' | 'DOCX' | 'XLS' | 'XLSX' | 'TXT' | 'IMAGE' | 'OTHER'>().notNull().default('OTHER'),
  fileUrl: text('file_url').notNull(),
  fileSize: integer('file_size').notNull().default(0),
  version: text('version').notNull().default('1.0'),
  status: text('status').$type<'DRAFT' | 'REVIEW' | 'APPROVED' | 'ARCHIVED'>().notNull().default('DRAFT'),
  visibility: text('visibility').$type<'PUBLIC' | 'EMPLOYEE' | 'MANAGER' | 'ADMIN'>().notNull().default('EMPLOYEE'),
  tags: text('tags').array(),
  createdBy: integer('created_by').references(() => users.id),
  approvedBy: integer('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  expiresAt: timestamp('expires_at'),
  downloadCount: integer('download_count').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const documentAcknowledgements = pgTable('document_acknowledgements', {
  id: serial('id').primaryKey(),
  documentId: integer('document_id').notNull().references(() => documents.id),
  userId: integer('user_id').notNull().references(() => users.id),
  signature: text('signature'),
  notes: text('notes'),
  acknowledgedAt: timestamp('acknowledged_at').defaultNow().notNull(),
});

export const documentAssignments = pgTable('document_assignments', {
  id: serial('id').primaryKey(),
  documentId: integer('document_id').notNull().references(() => documents.id),
  userId: integer('user_id').notNull().references(() => users.id),
  assignedBy: integer('assigned_by').references(() => users.id),
  dueDate: timestamp('due_date'),
  status: text('status').$type<'assigned' | 'acknowledged' | 'overdue'>().notNull().default('assigned'),
  acknowledgedAt: timestamp('acknowledged_at'),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const employeeReviews = pgTable('employee_reviews', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').notNull().references(() => users.id),
  reviewerId: integer('reviewer_id').references(() => users.id),
  periodStart: text('period_start'),
  periodEnd: text('period_end'),
  rating: integer('rating'),
  summary: text('summary'),
  status: text('status').$type<'draft' | 'submitted' | 'completed'>().notNull().default('draft'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const attendanceSessions = pgTable('attendance_sessions', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  sessionDate: text('session_date').notNull(),
  location: text('location'),
  status: text('status').$type<'open' | 'closed'>().notNull().default('open'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const attendanceCheckIns = pgTable('attendance_check_ins', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').notNull().references(() => attendanceSessions.id),
  userId: integer('user_id').notNull().references(() => users.id),
  checkInAt: timestamp('check_in_at').defaultNow().notNull(),
  status: text('status').$type<'present' | 'late' | 'excused'>().notNull().default('present'),
});

export const meetingRooms = pgTable('meeting_rooms', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  location: text('location'),
  capacity: integer('capacity').notNull().default(1),
  status: text('status').$type<'available' | 'maintenance'>().notNull().default('available'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const meetings = pgTable('meetings', {
  id: serial('id').primaryKey(),
  roomId: integer('room_id').references(() => meetingRooms.id),
  organizerId: integer('organizer_id').references(() => users.id),
  title: text('title').notNull(),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  meetingLink: text('meeting_link'),
  status: text('status').$type<'scheduled' | 'completed' | 'cancelled'>().notNull().default('scheduled'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const hrCalendarEvents = pgTable('hr_calendar_events', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  eventType: text('event_type')
    .$type<'meeting' | 'interview' | 'pto' | 'training' | 'other'>()
    .notNull()
    .default('other'),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  location: text('location'),
  meetingLink: text('meeting_link'),
  ownerId: integer('owner_id').references(() => users.id),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const hrTasks = pgTable('hr_tasks', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status')
    .$type<'open' | 'in_progress' | 'done' | 'blocked'>()
    .notNull()
    .default('open'),
  priority: text('priority')
    .$type<'low' | 'medium' | 'high'>()
    .notNull()
    .default('medium'),
  assignedTo: integer('assigned_to').references(() => users.id),
  createdBy: integer('created_by').references(() => users.id),
  dueDate: timestamp('due_date'),
  completedAt: timestamp('completed_at'),
  tags: jsonb('tags').$type<string[]>().notNull().default([]),
  source: text('source')
    .$type<'manual' | 'onboarding' | 'recruiting' | 'training' | 'field'>()
    .notNull()
    .default('manual'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const hrAiCriteria = pgTable('hr_ai_criteria', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  criteria: jsonb('criteria').$type<string[]>().notNull().default([]),
  weight: integer('weight').notNull().default(3),
  isActive: boolean('is_active').notNull().default(true),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const scheduledReports = pgTable('scheduled_reports', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  reportType: text('report_type').notNull(),
  format: text('format').notNull().default('PDF'),
  recipients: jsonb('recipients').$type<string[]>().notNull().default([]),
  filters: jsonb('filters').notNull().default({}),
  schedule: text('schedule').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  lastRunAt: timestamp('last_run_at'),
  nextRunAt: timestamp('next_run_at'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const scheduledReportExecutions = pgTable('scheduled_report_executions', {
  id: serial('id').primaryKey(),
  reportId: integer('report_id').notNull().references(() => scheduledReports.id),
  status: text('status').$type<'success' | 'failed' | 'running'>().notNull().default('running'),
  outputUrl: text('output_url'),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  finishedAt: timestamp('finished_at'),
  errorMessage: text('error_message'),
});

export const onboardingTemplates = pgTable('onboarding_templates', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  department: text('department'),
  tasks: jsonb('tasks').notNull().default([]),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const coiDocuments = pgTable('coi_documents', {
  id: serial('id').primaryKey(),
  vendorName: text('vendor_name').notNull(),
  policyNumber: text('policy_number'),
  carrier: text('carrier'),
  expirationDate: text('expiration_date'),
  fileUrl: text('file_url'),
  status: text('status').$type<'active' | 'expired' | 'pending'>().notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const employeeAssignments = pgTable('employee_assignments', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').notNull().references(() => users.id),
  managerId: integer('manager_id').references(() => users.id),
  assignmentType: text('assignment_type').$type<'PRIMARY' | 'SECONDARY'>().notNull().default('PRIMARY'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const workflows = pgTable('workflows', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const workflowSteps = pgTable('workflow_steps', {
  id: serial('id').primaryKey(),
  workflowId: integer('workflow_id').notNull().references(() => workflows.id),
  stepOrder: integer('step_order').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  assignedRole: text('assigned_role'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const contractTokens = pgTable('contract_tokens', {
  id: serial('id').primaryKey(),
  contractId: integer('contract_id').notNull().references(() => contracts.id),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const equipmentSignatureTokens = pgTable('equipment_signature_tokens', {
  id: serial('id').primaryKey(),
  equipmentId: integer('equipment_id').references(() => equipment.id),
  token: text('token').notNull().unique(),
  type: text('type').$type<'agreement' | 'checklist' | 'return' | 'receipt'>().notNull(),
  signerName: text('signer_name'),
  signerEmail: text('signer_email'),
  signature: text('signature'),
  notes: text('notes'),
  status: text('status').$type<'pending' | 'signed'>().notNull().default('pending'),
  signedAt: timestamp('signed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// SALES SCHEMA - Leaderboard, Contests, Gamification
// ============================================================================

export const salesReps = pgTable('sales_reps', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  team: text('team').notNull(),
  territoryId: integer('territory_id').references(() => territories.id),
  title: text('title').notNull(),
  avatar: text('avatar'),
  monthlyRevenue: decimal('monthly_revenue', { precision: 15, scale: 2 }).notNull().default('0'),
  yearlyRevenue: decimal('yearly_revenue', { precision: 15, scale: 2 }).notNull().default('0'),
  allTimeRevenue: decimal('all_time_revenue', { precision: 15, scale: 2 }).notNull().default('0'),
  monthlySignups: decimal('monthly_signups', { precision: 6, scale: 1 }).notNull().default('0'),
  yearlySignups: decimal('yearly_signups', { precision: 8, scale: 1 }).notNull().default('0'),
  monthlyGrowth: decimal('monthly_growth', { precision: 5, scale: 2 }).notNull().default('0'),
  yearlyGrowth: decimal('yearly_growth', { precision: 5, scale: 2 }).notNull().default('0'),
  goalProgress: decimal('goal_progress', { precision: 5, scale: 2 }).notNull().default('0'),
  monthlyRevenueGoal: decimal('monthly_revenue_goal', { precision: 10, scale: 2 }).notNull().default('10000'),
  monthlySignupGoal: decimal('monthly_signup_goal', { precision: 6, scale: 1 }).notNull().default('20'),
  yearlyRevenueGoal: decimal('yearly_revenue_goal', { precision: 12, scale: 2 }).notNull().default('120000'),
  currentBonusTier: integer('current_bonus_tier').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  leaderId: integer('leader_id').references(() => users.id),
  createdBy: integer('created_by').references(() => users.id),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const contests = pgTable('contests', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  contestType: text('contest_type').$type<'revenue' | 'signups' | 'mixed'>().notNull(),
  participantType: text('participant_type').$type<'individual' | 'team'>().notNull().default('individual'),
  status: text('status').$type<'upcoming' | 'active' | 'completed'>().notNull().default('upcoming'),
  prizes: text('prizes').array(),
  rules: text('rules'),
  winnerId: integer('winner_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const contestParticipants = pgTable('contest_participants', {
  id: serial('id').primaryKey(),
  contestId: integer('contest_id').notNull().references(() => contests.id),
  salesRepId: integer('sales_rep_id').notNull().references(() => salesReps.id),
  score: decimal('score', { precision: 15, scale: 2 }).notNull().default('0'),
  rank: integer('rank'),
  joinedAt: timestamp('joined_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const bonusAchievements = pgTable('bonus_achievements', {
  id: serial('id').primaryKey(),
  salesRepId: integer('sales_rep_id').notNull().references(() => salesReps.id),
  tier: integer('tier').notNull(), // 1-6 (15, 20, 25, 30, 35, 40 signups)
  achievedAt: timestamp('achieved_at').defaultNow(),
  month: integer('month').notNull(),
  year: integer('year').notNull(),
  signupsAtAchievement: integer('signups_at_achievement').notNull(),
});

// Leaderboard history snapshots (for rank trend charts)
export const leaderboardSnapshots = pgTable('leaderboard_snapshots', {
  id: serial('id').primaryKey(),
  salesRepId: integer('sales_rep_id').notNull().references(() => salesReps.id),
  snapshotDate: text('snapshot_date').notNull(), // YYYY-MM-DD format
  rank: integer('rank').notNull(),
  points: integer('points').notNull().default(0),
  monthlySignups: decimal('monthly_signups', { precision: 6, scale: 1 }).notNull().default('0'),
  seasonId: text('season_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Badge definitions
export const badges = pgTable('badges', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description').notNull(),
  iconUrl: text('icon_url'),
  category: text('category').$type<'performance' | 'milestone' | 'streak' | 'special'>().notNull().default('performance'),
  rarity: text('rarity').$type<'common' | 'rare' | 'epic' | 'legendary'>().notNull().default('common'),
  requirement: text('requirement'), // JSON describing requirements
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Player profiles for gamification
export const playerProfiles = pgTable('player_profiles', {
  id: serial('id').primaryKey(),
  salesRepId: integer('sales_rep_id').notNull().unique().references(() => salesReps.id),
  playerLevel: integer('player_level').notNull().default(1),
  totalCareerPoints: integer('total_career_points').notNull().default(0),
  seasonPoints: integer('season_points').notNull().default(0),
  monthlyPoints: integer('monthly_points').notNull().default(0),
  currentStreak: integer('current_streak').notNull().default(0),
  longestStreak: integer('longest_streak').notNull().default(0),
  lastActivityDate: text('last_activity_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Player earned badges
export const playerBadges = pgTable('player_badges', {
  id: serial('id').primaryKey(),
  playerId: integer('player_id').notNull().references(() => playerProfiles.id),
  badgeId: integer('badge_id').notNull().references(() => badges.id),
  earnedAt: timestamp('earned_at').defaultNow().notNull(),
});

// ============================================================================
// TRAINING SCHEMA - Sessions, Achievements, Curriculum
// ============================================================================

export const trainingSessions = pgTable('training_sessions', {
  id: serial('id').primaryKey(),
  sessionId: text('session_id').notNull().unique(),
  userId: integer('user_id').notNull().references(() => users.id),
  mode: text('mode').$type<'COACH' | 'ROLEPLAY' | 'CURRICULUM'>().notNull(),
  difficulty: text('difficulty').$type<'BEGINNER' | 'ROOKIE' | 'PRO' | 'ELITE' | 'NIGHTMARE'>(),
  moduleId: integer('module_id'),
  moduleName: text('module_name'),
  duration: integer('duration'), // seconds
  finalScore: integer('final_score'),
  xpEarned: integer('xp_earned').default(0),
  transcript: jsonb('transcript'),
  feedback: jsonb('feedback'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

export const achievements = pgTable('achievements', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description').notNull(),
  icon: text('icon').notNull(),
  xpReward: integer('xp_reward').notNull().default(100),
  requirement: text('requirement').notNull(),
  category: text('category').$type<'roleplay' | 'curriculum' | 'streak' | 'milestone'>().notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userAchievements = pgTable('user_achievements', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  achievementId: integer('achievement_id').notNull().references(() => achievements.id),
  unlockedAt: timestamp('unlocked_at').defaultNow().notNull(),
});

export const streakHistory = pgTable('streak_history', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  practiceDate: text('practice_date').notNull(),
  xpEarned: integer('xp_earned').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const curriculumProgress = pgTable('curriculum_progress', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  moduleId: integer('module_id').notNull(),
  status: text('status').$type<'locked' | 'available' | 'in_progress' | 'completed'>().notNull().default('locked'),
  score: integer('score'),
  attempts: integer('attempts').notNull().default(0),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const trainingModules = pgTable('training_modules', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  type: text('type').$type<'video' | 'quiz' | 'interactive' | 'reading' | 'roleplay'>().notNull(),
  content: jsonb('content').notNull(),
  order: integer('order').notNull(),
  xpReward: integer('xp_reward').notNull().default(50),
  estimatedMinutes: integer('estimated_minutes').notNull().default(15),
  difficulty: text('difficulty').$type<'beginner' | 'intermediate' | 'advanced' | 'expert'>().default('beginner'),
  prerequisiteModuleId: integer('prerequisite_module_id'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const trainingProgress = pgTable('training_progress', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  moduleId: integer('module_id').notNull().references(() => trainingModules.id),
  status: text('status').$type<'not_started' | 'in_progress' | 'completed'>().notNull().default('not_started'),
  score: integer('score'),
  timeSpent: integer('time_spent').default(0), // seconds
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const roleplaySessions = pgTable('roleplay_sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  scenarioId: text('scenario_id').notNull(),
  scenarioTitle: text('scenario_title').notNull(),
  difficulty: text('difficulty').$type<'BEGINNER' | 'ROOKIE' | 'PRO' | 'ELITE' | 'NIGHTMARE'>().notNull(),
  messages: jsonb('messages').notNull(), // Array of {role, content, timestamp}
  score: integer('score'),
  feedback: jsonb('feedback'), // {strengths, improvements, tips}
  duration: integer('duration'), // seconds
  xpEarned: integer('xp_earned').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

// Gamification Tables
export const trainingUserProgress = pgTable('training_user_progress', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id).unique(),
  totalXP: integer('total_xp').notNull().default(0),
  currentLevel: integer('current_level').notNull().default(1),
  completedModules: integer('completed_modules').array().notNull().default([]),
  lastActivityAt: timestamp('last_activity_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const trainingAchievements = pgTable('training_achievements', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  achievementId: text('achievement_id').notNull(),
  unlockedAt: timestamp('unlocked_at').defaultNow().notNull(),
});

export const trainingStreaks = pgTable('training_streaks', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id).unique(),
  currentStreak: integer('current_streak').notNull().default(0),
  longestStreak: integer('longest_streak').notNull().default(0),
  lastActivityDate: timestamp('last_activity_date').notNull(),
  freezesAvailable: integer('freezes_available').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const trainingXPHistory = pgTable('training_xp_history', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  xpAmount: integer('xp_amount').notNull(),
  action: text('action').$type<'module_complete' | 'quiz_score' | 'roleplay_session' | 'streak_bonus' | 'achievement'>().notNull(),
  metadata: jsonb('metadata').notNull().default({}),
  earnedAt: timestamp('earned_at').defaultNow().notNull(),
});

export const trainingCertificates = pgTable('training_certificates', {
  id: serial('id').primaryKey(),
  certificateId: text('certificate_id').notNull().unique(), // UUID for verification
  userId: integer('user_id').notNull().references(() => users.id),
  certificateType: text('certificate_type').$type<'module' | 'curriculum' | 'roleplay_mastery'>().notNull(),
  title: text('title').notNull(),
  description: text('description'),
  moduleId: text('module_id'), // If module-specific
  score: integer('score'), // Final score achieved
  issuedAt: timestamp('issued_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'), // Optional expiration
  metadata: jsonb('metadata').$type<{
    moduleTitle?: string;
    difficulty?: string;
    completionDate?: string;
    xpEarned?: number;
    achievements?: string[];
    verificationUrl?: string;
  }>().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================================================
// FIELD SCHEMA - Chat, Email, Documents
// ============================================================================

export const chatSessions = pgTable('chat_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: integer('user_id').notNull().references(() => users.id),
  title: text('title'),
  state: text('state').$type<'VA' | 'MD' | 'PA'>(),
  provider: text('provider').$type<'gemini' | 'openai' | 'groq' | 'anthropic'>().default('gemini'),
  messageCount: integer('message_count').notNull().default(0),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  endedAt: timestamp('ended_at'),
});

export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => chatSessions.id),
  role: text('role').$type<'user' | 'assistant' | 'system'>().notNull(),
  content: text('content').notNull(),
  sources: jsonb('sources'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const emailTemplates = pgTable('email_templates', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  category: text('category').notNull(),
  variables: text('variables').array(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const generatedEmails = pgTable('generated_emails', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  templateId: integer('template_id').references(() => emailTemplates.id),
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  recipientType: text('recipient_type'),
  state: text('state').$type<'VA' | 'MD' | 'PA'>(),
  wasSent: boolean('was_sent').notNull().default(false),
  wasEdited: boolean('was_edited').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const documentViews = pgTable('document_views', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  documentPath: text('document_path').notNull(),
  documentName: text('document_name').notNull(),
  documentCategory: text('document_category'),
  viewCount: integer('view_count').notNull().default(1),
  totalTimeSpent: integer('total_time_spent').default(0), // seconds
  firstViewedAt: timestamp('first_viewed_at').defaultNow().notNull(),
  lastViewedAt: timestamp('last_viewed_at').defaultNow().notNull(),
});

export const imageAnalysisLog = pgTable('image_analysis_log', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  imageUrl: text('image_url'),
  analysisResult: text('analysis_result'),
  analysisType: text('analysis_type').$type<'roof_damage' | 'general'>(),
  provider: text('provider'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const fieldDocuments = pgTable('field_documents', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  filename: text('filename').notNull(),
  originalName: text('original_name').notNull(),
  mimeType: text('mime_type').notNull(),
  fileSize: integer('file_size').notNull(),
  category: text('category').$type<'insurance' | 'inspection' | 'estimate' | 'contract' | 'photo' | 'other'>().notNull().default('other'),
  tags: text('tags').array(),
  description: text('description'),
  analysisResult: jsonb('analysis_result'),
  storagePath: text('storage_path').notNull(),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
  lastAccessedAt: timestamp('last_accessed_at'),
});

// ============================================================================
// AI SCHEMA - Mentor, Context, Analytics
// ============================================================================

export const mentorContext = pgTable('mentor_context', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id).unique(),
  salesRepId: integer('sales_rep_id').references(() => salesReps.id),
  preferredName: text('preferred_name'),
  coachingStyle: text('coaching_style').$type<'motivational' | 'analytical' | 'balanced' | 'direct'>().default('balanced'),
  communicationTone: text('communication_tone').$type<'professional' | 'casual' | 'friendly'>().default('professional'),
  strengthAreas: text('strength_areas').array(),
  developmentAreas: text('development_areas').array(),
  totalInteractions: integer('total_interactions').notNull().default(0),
  lastInteractionAt: timestamp('last_interaction_at'),
  conversationSummary: text('conversation_summary'),
  currentGoals: text('current_goals').array(),
  notificationPreferences: jsonb('notification_preferences'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const mentorConversations = pgTable('mentor_conversations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  sessionId: text('session_id').notNull(),
  role: text('role').$type<'user' | 'assistant' | 'system'>().notNull(),
  content: text('content').notNull(),
  messageType: text('message_type').$type<'chat' | 'insight' | 'recommendation' | 'celebration'>().default('chat'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// RELATIONS
// ============================================================================

export const usersRelations = relations(users, ({ many, one }) => ({
  sessions: many(sessions),
  ptoRequests: many(ptoRequests),
  trainingSessions: many(trainingSessions),
  userAchievements: many(userAchievements),
  chatSessions: many(chatSessions),
  generatedEmails: many(generatedEmails),
  mentorContext: one(mentorContext),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const ptoRequestsRelations = relations(ptoRequests, ({ one }) => ({
  employee: one(users, {
    fields: [ptoRequests.employeeId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [ptoRequests.reviewedBy],
    references: [users.id],
  }),
}));

export const salesRepsRelations = relations(salesReps, ({ one, many }) => ({
  user: one(users, {
    fields: [salesReps.userId],
    references: [users.id],
  }),
  territory: one(territories, {
    fields: [salesReps.territoryId],
    references: [territories.id],
  }),
  contestParticipants: many(contestParticipants),
}));

export const contestsRelations = relations(contests, ({ many }) => ({
  participants: many(contestParticipants),
}));

export const trainingSessionsRelations = relations(trainingSessions, ({ one }) => ({
  user: one(users, {
    fields: [trainingSessions.userId],
    references: [users.id],
  }),
}));

export const achievementsRelations = relations(achievements, ({ many }) => ({
  userAchievements: many(userAchievements),
}));

export const chatSessionsRelations = relations(chatSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [chatSessions.userId],
    references: [users.id],
  }),
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  session: one(chatSessions, {
    fields: [chatMessages.sessionId],
    references: [chatSessions.id],
  }),
}));

export const trainingModulesRelations = relations(trainingModules, ({ many }) => ({
  progress: many(trainingProgress),
}));

export const trainingProgressRelations = relations(trainingProgress, ({ one }) => ({
  user: one(users, {
    fields: [trainingProgress.userId],
    references: [users.id],
  }),
  module: one(trainingModules, {
    fields: [trainingProgress.moduleId],
    references: [trainingModules.id],
  }),
}));

export const roleplaySessionsRelations = relations(roleplaySessions, ({ one }) => ({
  user: one(users, {
    fields: [roleplaySessions.userId],
    references: [users.id],
  }),
}));

export const trainingCertificatesRelations = relations(trainingCertificates, ({ one }) => ({
  user: one(users, {
    fields: [trainingCertificates.userId],
    references: [users.id],
  }),
}));

export const onboardingTasksRelations = relations(onboardingTasks, ({ one }) => ({
  employee: one(users, {
    fields: [onboardingTasks.employeeId],
    references: [users.id],
  }),
  assignedToUser: one(users, {
    fields: [onboardingTasks.assignedTo],
    references: [users.id],
  }),
}));

export const interviewsRelations = relations(interviews, ({ one }) => ({
  candidate: one(candidates, {
    fields: [interviews.candidateId],
    references: [candidates.id],
  }),
  interviewer: one(users, {
    fields: [interviews.interviewerId],
    references: [users.id],
  }),
}));

export const candidatesRelations = relations(candidates, ({ one, many }) => ({
  assignedToUser: one(users, {
    fields: [candidates.assignedTo],
    references: [users.id],
  }),
  interviews: many(interviews),
  contracts: many(contracts),
  notes: many(candidateNotes),
}));

export const candidateNotesRelations = relations(candidateNotes, ({ one }) => ({
  candidate: one(candidates, {
    fields: [candidateNotes.candidateId],
    references: [candidates.id],
  }),
  author: one(users, {
    fields: [candidateNotes.authorId],
    references: [users.id],
  }),
}));

export const employeeNotesRelations = relations(employeeNotes, ({ one }) => ({
  employee: one(users, {
    fields: [employeeNotes.employeeId],
    references: [users.id],
  }),
  author: one(users, {
    fields: [employeeNotes.authorId],
    references: [users.id],
  }),
}));

export const hrAssignmentsRelations = relations(hrAssignments, ({ one }) => ({
  hrMember: one(users, {
    fields: [hrAssignments.hrMemberId],
    references: [users.id],
  }),
  assignedByUser: one(users, {
    fields: [hrAssignments.assignedBy],
    references: [users.id],
  }),
}));

// ============================================================================
// INSERT SCHEMAS (Zod validation)
// ============================================================================

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPtoRequestSchema = createInsertSchema(ptoRequests).omit({
  id: true,
  status: true,
  reviewedBy: true,
  reviewedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCompanyPtoPolicySchema = createInsertSchema(companyPtoPolicy).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPtoPolicySchema = createInsertSchema(ptoPolicies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDepartmentPtoSettingSchema = createInsertSchema(departmentPtoSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCandidateSchema = createInsertSchema(candidates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCandidateNoteSchema = createInsertSchema(candidateNotes).omit({
  id: true,
  createdAt: true,
});

export const insertEmployeeNoteSchema = createInsertSchema(employeeNotes).omit({
  id: true,
  createdAt: true,
});

export const insertHrAssignmentSchema = createInsertSchema(hrAssignments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContestParticipantSchema = createInsertSchema(contestParticipants).omit({
  id: true,
});

export const insertBonusAchievementSchema = createInsertSchema(bonusAchievements).omit({
  id: true,
  achievedAt: true,
});

export const insertTrainingSessionSchema = createInsertSchema(trainingSessions).omit({
  id: true,
  createdAt: true,
});

export const insertTrainingCertificateSchema = createInsertSchema(trainingCertificates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Territory = typeof territories.$inferSelect;
export type PtoRequest = typeof ptoRequests.$inferSelect;
export type CompanyPtoPolicy = typeof companyPtoPolicy.$inferSelect;
export type PtoPolicy = typeof ptoPolicies.$inferSelect;
export type DepartmentPtoSetting = typeof departmentPtoSettings.$inferSelect;
export type Candidate = typeof candidates.$inferSelect;
export type CandidateNote = typeof candidateNotes.$inferSelect;
export type EmployeeNote = typeof employeeNotes.$inferSelect;
export type HrAssignment = typeof hrAssignments.$inferSelect;
export type Contract = typeof contracts.$inferSelect;
export type Equipment = typeof equipment.$inferSelect;
export type OnboardingTask = typeof onboardingTasks.$inferSelect;
export type Interview = typeof interviews.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type DocumentAcknowledgement = typeof documentAcknowledgements.$inferSelect;
export type DocumentAssignment = typeof documentAssignments.$inferSelect;
export type EmployeeReview = typeof employeeReviews.$inferSelect;
export type AttendanceSession = typeof attendanceSessions.$inferSelect;
export type AttendanceCheckIn = typeof attendanceCheckIns.$inferSelect;
export type MeetingRoom = typeof meetingRooms.$inferSelect;
export type Meeting = typeof meetings.$inferSelect;
export type HrCalendarEvent = typeof hrCalendarEvents.$inferSelect;
export type HrTask = typeof hrTasks.$inferSelect;
export type HrAiCriteria = typeof hrAiCriteria.$inferSelect;
export type ScheduledReport = typeof scheduledReports.$inferSelect;
export type ScheduledReportExecution = typeof scheduledReportExecutions.$inferSelect;
export type OnboardingTemplate = typeof onboardingTemplates.$inferSelect;
export type CoiDocument = typeof coiDocuments.$inferSelect;
export type EmployeeAssignment = typeof employeeAssignments.$inferSelect;
export type Workflow = typeof workflows.$inferSelect;
export type WorkflowStep = typeof workflowSteps.$inferSelect;
export type ContractToken = typeof contractTokens.$inferSelect;
export type EquipmentSignatureToken = typeof equipmentSignatureTokens.$inferSelect;
export type SalesRep = typeof salesReps.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type Contest = typeof contests.$inferSelect;
export type ContestParticipant = typeof contestParticipants.$inferSelect;
export type BonusAchievement = typeof bonusAchievements.$inferSelect;
export type TrainingSession = typeof trainingSessions.$inferSelect;
export type TrainingModule = typeof trainingModules.$inferSelect;
export type TrainingProgress = typeof trainingProgress.$inferSelect;
export type RoleplaySession = typeof roleplaySessions.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type ChatSession = typeof chatSessions.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type GeneratedEmail = typeof generatedEmails.$inferSelect;
export type FieldDocument = typeof fieldDocuments.$inferSelect;
export type NewFieldDocument = typeof fieldDocuments.$inferInsert;
export type MentorContext = typeof mentorContext.$inferSelect;
export type TrainingUserProgress = typeof trainingUserProgress.$inferSelect;
export type TrainingAchievement = typeof trainingAchievements.$inferSelect;
export type TrainingStreak = typeof trainingStreaks.$inferSelect;
export type TrainingXPHistory = typeof trainingXPHistory.$inferSelect;
export type LeaderboardSnapshot = typeof leaderboardSnapshots.$inferSelect;
export type Badge = typeof badges.$inferSelect;
export type PlayerProfile = typeof playerProfiles.$inferSelect;
export type PlayerBadge = typeof playerBadges.$inferSelect;
export type TrainingCertificate = typeof trainingCertificates.$inferSelect;
export type NewTrainingCertificate = typeof trainingCertificates.$inferInsert;

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  type: text('type').$type<
    | 'achievement'
    | 'xp_gain'
    | 'level_up'
    | 'contest_update'
    | 'pto_approved'
    | 'pto_denied'
    | 'new_lead'
    | 'streak_reminder'
    | 'training_complete'
    | 'team_update'
  >().notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  link: text('link'),
  isRead: boolean('is_read').notNull().default(false),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

// ============================================================================
// REPORT GENERATION LOG TABLE
// ============================================================================

export const reportGenLog = pgTable('report_gen_log', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  reportType: varchar('report_type', { length: 50 }).notNull(), // 'damage_assessment', 'inspection'
  customerName: varchar('customer_name', { length: 255 }).notNull(),
  propertyAddress: text('property_address').notNull(),
  metadata: jsonb('metadata'), // Additional report details
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const reportGenLogRelations = relations(reportGenLog, ({ one }) => ({
  user: one(users, {
    fields: [reportGenLog.userId],
    references: [users.id],
  }),
}));

export const insertReportGenLogSchema = createInsertSchema(reportGenLog).omit({
  id: true,
  createdAt: true,
});

export type ReportGenLog = typeof reportGenLog.$inferSelect;
export type NewReportGenLog = typeof reportGenLog.$inferInsert;
