import type { UserRole, ModuleType, TrainingLevel, AuthMethod, AIProvider } from "@shared/constants";

// User type with merged attributes from all apps
export interface User {
  id: number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;

  // Module access flags
  hasHRAccess: boolean;
  hasLeaderboardAccess: boolean;
  hasTrainingAccess: boolean;
  hasFieldAccess: boolean;

  // HR fields
  department?: string;
  position?: string;
  territoryId?: number;
  employmentType?: 'full_time' | 'part_time' | 'contractor';
  hireDate?: string;
  phone?: string;
  address?: string;
  timezone?: string;

  // Sales/Leaderboard fields
  linkedSalesRepId?: number;
  team?: string;
  currentBonusTier?: string;

  // Training fields
  trainingLevel?: TrainingLevel;
  totalXp?: number;
  currentLevel?: number;
  currentStreak?: number;
  longestStreak?: number;
  avatar?: string;
  pinHash?: string;

  // Field fields
  preferredState?: string;
  preferredAiProvider?: AIProvider;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

// Auth context
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Session type
export interface Session {
  id: string;
  userId: number;
  authMethod: AuthMethod;
  expiresAt: string;
  createdAt: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Module-specific types

// HR Types
export interface Employee {
  id: number;
  userId: number;
  user?: User;
  department: string;
  position: string;
  hireDate: string;
  salary?: number;
  status: 'active' | 'inactive' | 'terminated';
}

export interface PTORequest {
  id: number;
  employeeId: number;
  employee?: Employee;
  startDate: string;
  endDate: string;
  type: 'vacation' | 'sick' | 'personal' | 'bereavement';
  status: 'pending' | 'approved' | 'denied';
  reason?: string;
  reviewedBy?: number;
  reviewedAt?: string;
}

export interface Candidate {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position: string;
  status: 'new' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';
  resumeUrl?: string;
  notes?: string;
  createdAt: string;
}

// Leaderboard Types
export interface SalesRep {
  id: number;
  userId?: number;
  user?: User;
  firstName: string;
  lastName: string;
  team: string;
  territory?: string;
  totalSales: number;
  monthSales: number;
  weekSales: number;
  rank?: number;
  bonusTier?: string;
}

export interface Contest {
  id: number;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  prizeDescription?: string;
  status: 'upcoming' | 'active' | 'completed';
  participants?: ContestParticipant[];
}

export interface ContestParticipant {
  id: number;
  contestId: number;
  salesRepId: number;
  salesRep?: SalesRep;
  score: number;
  rank?: number;
}

// Training Types
export interface TrainingSession {
  id: number;
  userId: number;
  moduleId: number;
  moduleName: string;
  startedAt: string;
  completedAt?: string;
  score?: number;
  xpEarned: number;
  duration?: number;
}

export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  requirement: string;
  category: 'roleplay' | 'curriculum' | 'streak' | 'milestone';
}

export interface UserAchievement {
  id: number;
  userId: number;
  achievementId: number;
  achievement?: Achievement;
  unlockedAt: string;
}

// Field Types
export interface ChatMessage {
  id: number;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface ChatSession {
  id: string;
  userId: number;
  title?: string;
  startedAt: string;
  endedAt?: string;
  messageCount: number;
  messages?: ChatMessage[];
}

export interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  body: string;
  category: string;
  variables: string[];
}

export interface GeneratedEmail {
  id: number;
  userId: number;
  templateId?: number;
  subject: string;
  body: string;
  recipientType: string;
  createdAt: string;
}
