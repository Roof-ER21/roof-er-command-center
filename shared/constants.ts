// Unified role system (14 roles from all apps)
export const USER_ROLES = {
  SYSTEM_ADMIN: "SYSTEM_ADMIN",
  HR_ADMIN: "HR_ADMIN",
  GENERAL_MANAGER: "GENERAL_MANAGER",
  TERRITORY_MANAGER: "TERRITORY_MANAGER",
  MANAGER: "MANAGER",
  TEAM_LEAD: "TEAM_LEAD",
  EMPLOYEE: "EMPLOYEE",
  FIELD_TECH: "FIELD_TECH",
  SALES_REP: "SALES_REP",
  CONTRACTOR: "CONTRACTOR",
  SOURCER: "SOURCER",
  TRAINEE: "TRAINEE",
  INSURANCE_MANAGER: "INSURANCE_MANAGER",
  RETAIL_MANAGER: "RETAIL_MANAGER",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// Module identifiers
export const MODULES = {
  HR: "hr",
  LEADERBOARD: "leaderboard",
  TRAINING: "training",
  FIELD: "field",
} as const;

export type ModuleType = (typeof MODULES)[keyof typeof MODULES];

// Module metadata for UI
export const MODULE_CONFIG = {
  [MODULES.HR]: {
    name: "HR",
    fullName: "Human Resources",
    icon: "Users",
    color: "purple",
    description: "PTO, recruiting, contracts, equipment, onboarding",
    path: "/hr",
  },
  [MODULES.LEADERBOARD]: {
    name: "Leaderboard",
    fullName: "Sales Leaderboard",
    icon: "Trophy",
    color: "green",
    description: "Sales rankings, contests, bonuses, TV display",
    path: "/leaderboard",
  },
  [MODULES.TRAINING]: {
    name: "Training",
    fullName: "Training Center",
    icon: "GraduationCap",
    color: "amber",
    description: "AI roleplay, 12-module curriculum, XP/levels",
    path: "/training",
  },
  [MODULES.FIELD]: {
    name: "Field",
    fullName: "Field Assistant",
    icon: "MapPin",
    color: "sky",
    description: "Susan chat, email gen, document analysis",
    path: "/field",
  },
} as const;

// Default module access by role
export const ROLE_MODULE_ACCESS: Record<UserRole, ModuleType[]> = {
  SYSTEM_ADMIN: ["hr", "leaderboard", "training", "field"],
  HR_ADMIN: ["hr", "training"],
  GENERAL_MANAGER: ["hr", "leaderboard", "training", "field"],
  TERRITORY_MANAGER: ["hr", "leaderboard", "training", "field"],
  MANAGER: ["leaderboard", "training", "field"],
  TEAM_LEAD: ["leaderboard", "training", "field"],
  EMPLOYEE: ["training"],
  FIELD_TECH: ["training", "field"],
  SALES_REP: ["leaderboard", "training", "field"],
  CONTRACTOR: ["training"],
  SOURCER: ["hr"],
  TRAINEE: ["training"],
  INSURANCE_MANAGER: ["hr", "field"],
  RETAIL_MANAGER: ["leaderboard", "training"],
};

// Training module levels (from Agnes-21)
export const TRAINING_LEVELS = {
  BEGINNER: "beginner",
  INTERMEDIATE: "intermediate",
  ADVANCED: "advanced",
  EXPERT: "expert",
  MASTER: "master",
} as const;

export type TrainingLevel = (typeof TRAINING_LEVELS)[keyof typeof TRAINING_LEVELS];

// XP thresholds for levels
export const XP_THRESHOLDS = {
  [TRAINING_LEVELS.BEGINNER]: 0,
  [TRAINING_LEVELS.INTERMEDIATE]: 500,
  [TRAINING_LEVELS.ADVANCED]: 1500,
  [TRAINING_LEVELS.EXPERT]: 3500,
  [TRAINING_LEVELS.MASTER]: 7000,
} as const;

// Lite Training curriculum modules (12 total)
export const CURRICULUM_MODULES = [
  { id: 1, title: "Welcome & Company Intro", type: "content" },
  { id: 2, title: "Your Commitment", type: "content" },
  { id: 3, title: "The Initial Pitch", type: "script" },
  { id: 4, title: "The Inspection Process", type: "content" },
  { id: 5, title: "Post-Inspection Pitch", type: "script" },
  { id: 6, title: "Handling Objections", type: "game" },
  { id: 7, title: "Shingle Types", type: "content" },
  { id: 8, title: "Roofing & Damage ID", type: "content" },
  { id: 9, title: "The Sales Cycle", type: "game" },
  { id: 10, title: "Filing a Claim & Closing", type: "script" },
  { id: 11, title: "AI Role-Play Simulator", type: "ai-chat" },
  { id: 12, title: "Final Quiz", type: "quiz" },
] as const;

// Session types for authentication
export const AUTH_METHODS = {
  PASSWORD: "password",
  PIN: "pin",
  MAGIC_LINK: "magic_link",
} as const;

export type AuthMethod = (typeof AUTH_METHODS)[keyof typeof AUTH_METHODS];

// AI Provider options (for Field module)
export const AI_PROVIDERS = {
  GEMINI: "gemini",
  OPENAI: "openai",
  GROQ: "groq",
  ANTHROPIC: "anthropic",
} as const;

export type AIProvider = (typeof AI_PROVIDERS)[keyof typeof AI_PROVIDERS];
