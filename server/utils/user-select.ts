import { users } from "../../shared/schema.js";

/**
 * Helper function to select user columns without the slug field
 * This prevents PostgreSQL errors when the slug column doesn't exist in production
 *
 * Usage:
 * const [user] = await db.select(selectUserColumns()).from(users).where(...);
 */
export function selectUserColumns() {
  return {
    id: users.id,
    email: users.email,
    username: users.username,
    firstName: users.firstName,
    lastName: users.lastName,
    passwordHash: users.passwordHash,
    pinHash: users.pinHash,
    role: users.role,
    hasHRAccess: users.hasHRAccess,
    hasLeaderboardAccess: users.hasLeaderboardAccess,
    hasTrainingAccess: users.hasTrainingAccess,
    hasFieldAccess: users.hasFieldAccess,
    department: users.department,
    position: users.position,
    employmentType: users.employmentType,
    hireDate: users.hireDate,
    terminationDate: users.terminationDate,
    territoryId: users.territoryId,
    phone: users.phone,
    address: users.address,
    emergencyContact: users.emergencyContact,
    emergencyPhone: users.emergencyPhone,
    shirtSize: users.shirtSize,
    timezone: users.timezone,
    linkedSalesRepId: users.linkedSalesRepId,
    team: users.team,
    currentBonusTier: users.currentBonusTier,
    trainingLevel: users.trainingLevel,
    totalXp: users.totalXp,
    currentLevel: users.currentLevel,
    currentStreak: users.currentStreak,
    longestStreak: users.longestStreak,
    lastPracticeDate: users.lastPracticeDate,
    avatar: users.avatar,
    division: users.division,
    preferredState: users.preferredState,
    preferredAiProvider: users.preferredAiProvider,
    isPublicProfile: users.isPublicProfile,
    publicBio: users.publicBio,
    publicPhone: users.publicPhone,
    publicEmail: users.publicEmail,
    isActive: users.isActive,
    mustChangePassword: users.mustChangePassword,
    lastPasswordChange: users.lastPasswordChange,
    lastLoginAt: users.lastLoginAt,
    firstLoginAt: users.firstLoginAt,
    createdAt: users.createdAt,
    updatedAt: users.updatedAt,
  };
}

/**
 * Minimal user selection for checking existence only
 */
export function selectUserIdEmail() {
  return {
    id: users.id,
    email: users.email,
  };
}
