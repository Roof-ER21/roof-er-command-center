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

export const insertCandidateSchema = createInsertSchema(candidates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTrainingSessionSchema = createInsertSchema(trainingSessions).omit({
  id: true,
  createdAt: true,
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Territory = typeof territories.$inferSelect;
export type PtoRequest = typeof ptoRequests.$inferSelect;
export type Candidate = typeof candidates.$inferSelect;
export type Contract = typeof contracts.$inferSelect;
export type Equipment = typeof equipment.$inferSelect;
export type SalesRep = typeof salesReps.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type Contest = typeof contests.$inferSelect;
export type TrainingSession = typeof trainingSessions.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type ChatSession = typeof chatSessions.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type GeneratedEmail = typeof generatedEmails.$inferSelect;
export type MentorContext = typeof mentorContext.$inferSelect;
