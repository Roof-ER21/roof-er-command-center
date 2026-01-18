/**
 * Client-side gamification utilities
 * Adapted from Agnes-21 for Roof-ER Command Center
 */

export interface UserProgress {
  totalXP: number;
  currentLevel: number;
  xpToNextLevel: number;
  xpForCurrentLevel: number;
}

/**
 * Calculates the total XP required to reach a specific level
 * Formula: XP = 50 * level^2
 */
export function getXPForLevel(level: number): number {
  if (level <= 1) return 0;
  return 50 * Math.pow(level, 2);
}

/**
 * Calculates what level corresponds to a given total XP
 */
export function getLevelForXP(totalXP: number): number {
  if (totalXP <= 0) return 1;

  // Binary search for efficiency
  let level = 1;
  while (getXPForLevel(level + 1) <= totalXP) {
    level++;
  }
  return level;
}

/**
 * Calculates user progress from total XP
 */
export function calculateProgress(totalXP: number): UserProgress {
  const currentLevel = getLevelForXP(totalXP);
  const xpForCurrentLevel = getXPForLevel(currentLevel);
  const xpForNextLevel = getXPForLevel(currentLevel + 1);
  const xpToNextLevel = xpForNextLevel - totalXP;

  return {
    totalXP,
    currentLevel,
    xpToNextLevel,
    xpForCurrentLevel
  };
}

/**
 * Gets progress percentage for current level
 */
export function getLevelProgressPercentage(totalXP: number): number {
  const progress = calculateProgress(totalXP);
  const xpInCurrentLevel = totalXP - progress.xpForCurrentLevel;
  const xpNeededForLevel = getXPForLevel(progress.currentLevel + 1) - progress.xpForCurrentLevel;

  return Math.min(100, Math.round((xpInCurrentLevel / xpNeededForLevel) * 100));
}

/**
 * Calculates XP breakdown for display
 */
export interface XPBreakdown {
  baseXP: number;
  scoreBonus: number;
  perfectBonus: number;
  streakBonus: number;
  difficultyMultiplier: number;
  totalXP: number;
}

export function calculateSessionXP(
  score: number,
  difficulty: 'beginner' | 'rookie' | 'pro' | 'veteran' | 'elite',
  currentStreak: number
): XPBreakdown {
  const baseXP = 50;

  // Score bonus: +1 XP per point above 70 (max +30 for score 100)
  const scoreBonus = Math.max(0, Math.min(30, score - 70));

  // Perfect score bonus: +50 XP
  const perfectBonus = score >= 100 ? 50 : 0;

  // Streak bonus: +10 XP per day in current streak
  const streakBonus = currentStreak * 10;

  // Difficulty multipliers
  const difficultyMultipliers: Record<typeof difficulty, number> = {
    beginner: 1.0,
    rookie: 1.25,
    pro: 1.5,
    veteran: 1.75,
    elite: 2.0
  };

  const difficultyMultiplier = difficultyMultipliers[difficulty] || 1.0;

  // Calculate total
  const totalBeforeMultiplier = baseXP + scoreBonus + perfectBonus + streakBonus;
  const totalXP = Math.round(totalBeforeMultiplier * difficultyMultiplier);

  return {
    baseXP,
    scoreBonus,
    perfectBonus,
    streakBonus,
    difficultyMultiplier,
    totalXP
  };
}

/**
 * Formats XP number with commas
 */
export function formatXP(xp: number): string {
  return xp.toLocaleString();
}

/**
 * Gets level title based on level number
 */
export function getLevelTitle(level: number): string {
  if (level >= 50) return 'Legendary';
  if (level >= 40) return 'Master';
  if (level >= 30) return 'Expert';
  if (level >= 20) return 'Advanced';
  if (level >= 10) return 'Intermediate';
  if (level >= 5) return 'Apprentice';
  return 'Beginner';
}

/**
 * Calculates streak multiplier for XP
 */
export function getStreakMultiplier(streakDays: number): number {
  if (streakDays >= 30) return 2.0;
  if (streakDays >= 14) return 1.75;
  if (streakDays >= 7) return 1.5;
  if (streakDays >= 3) return 1.25;
  return 1.0;
}
