/**
 * Achievement definitions for the training module
 * Adapted from Agnes-21 for Roof-ER Command Center
 */

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  rarity: AchievementRarity;
  icon: string;
  category: 'progress' | 'performance' | 'streak' | 'time' | 'mastery';
  xpReward: number;
  criteria: {
    type: 'module_complete' | 'streak' | 'score' | 'time' | 'count' | 'special';
    value?: number;
    moduleId?: number;
  };
}

export const ACHIEVEMENTS: Achievement[] = [
  // Progress Achievements
  {
    id: 'first_steps',
    name: 'First Steps',
    description: 'Complete your first training module',
    rarity: 'common',
    icon: 'Footprints',
    category: 'progress',
    xpReward: 100,
    criteria: {
      type: 'module_complete',
      value: 1,
    },
  },
  {
    id: 'half_way_there',
    name: 'Halfway There',
    description: 'Complete 6 out of 12 modules',
    rarity: 'rare',
    icon: 'TrendingUp',
    category: 'progress',
    xpReward: 300,
    criteria: {
      type: 'module_complete',
      value: 6,
    },
  },
  {
    id: 'champion',
    name: 'Champion',
    description: 'Complete all 12 training modules',
    rarity: 'epic',
    icon: 'Trophy',
    category: 'progress',
    xpReward: 1000,
    criteria: {
      type: 'module_complete',
      value: 12,
    },
  },

  // Streak Achievements
  {
    id: 'streak_3',
    name: 'Getting Started',
    description: 'Maintain a 3-day training streak',
    rarity: 'common',
    icon: 'Flame',
    category: 'streak',
    xpReward: 150,
    criteria: {
      type: 'streak',
      value: 3,
    },
  },
  {
    id: 'streak_7',
    name: 'Streak Master',
    description: 'Maintain a 7-day training streak',
    rarity: 'rare',
    icon: 'Flame',
    category: 'streak',
    xpReward: 400,
    criteria: {
      type: 'streak',
      value: 7,
    },
  },
  {
    id: 'streak_14',
    name: 'Dedicated Learner',
    description: 'Maintain a 14-day training streak',
    rarity: 'epic',
    icon: 'Flame',
    category: 'streak',
    xpReward: 800,
    criteria: {
      type: 'streak',
      value: 14,
    },
  },
  {
    id: 'streak_30',
    name: 'Unstoppable Force',
    description: 'Maintain a 30-day training streak',
    rarity: 'legendary',
    icon: 'Zap',
    category: 'streak',
    xpReward: 2000,
    criteria: {
      type: 'streak',
      value: 30,
    },
  },

  // Performance Achievements
  {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Score 100% on any module',
    rarity: 'rare',
    icon: 'Star',
    category: 'performance',
    xpReward: 250,
    criteria: {
      type: 'score',
      value: 100,
    },
  },
  {
    id: 'objection_handler',
    name: 'Objection Handler',
    description: 'Complete the Objections module with 90%+',
    rarity: 'epic',
    icon: 'Shield',
    category: 'performance',
    xpReward: 500,
    criteria: {
      type: 'score',
      value: 90,
      moduleId: 6,
    },
  },
  {
    id: 'sales_cycle_pro',
    name: 'Sales Cycle Pro',
    description: 'Perfect score on the Sales Cycle game',
    rarity: 'epic',
    icon: 'Target',
    category: 'performance',
    xpReward: 500,
    criteria: {
      type: 'score',
      value: 100,
      moduleId: 9,
    },
  },
  {
    id: 'role_player',
    name: 'Role Player',
    description: 'Complete 10 AI roleplay sessions',
    rarity: 'rare',
    icon: 'MessageSquare',
    category: 'performance',
    xpReward: 350,
    criteria: {
      type: 'count',
      value: 10,
    },
  },

  // Time-based Achievements
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Complete a module in under 5 minutes',
    rarity: 'rare',
    icon: 'Zap',
    category: 'time',
    xpReward: 300,
    criteria: {
      type: 'time',
      value: 300, // seconds
    },
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Complete training before 6:00 AM',
    rarity: 'rare',
    icon: 'Sunrise',
    category: 'time',
    xpReward: 200,
    criteria: {
      type: 'special',
    },
  },
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Complete training after 10:00 PM',
    rarity: 'rare',
    icon: 'Moon',
    category: 'time',
    xpReward: 200,
    criteria: {
      type: 'special',
    },
  },
  {
    id: 'weekend_warrior',
    name: 'Weekend Warrior',
    description: 'Train on Saturday or Sunday',
    rarity: 'common',
    icon: 'Calendar',
    category: 'time',
    xpReward: 150,
    criteria: {
      type: 'special',
    },
  },

  // Mastery Achievements
  {
    id: 'xp_1000',
    name: 'Rising Star',
    description: 'Earn 1,000 total XP',
    rarity: 'common',
    icon: 'Award',
    category: 'mastery',
    xpReward: 100,
    criteria: {
      type: 'special',
    },
  },
  {
    id: 'xp_5000',
    name: 'Expert Trainee',
    description: 'Earn 5,000 total XP',
    rarity: 'rare',
    icon: 'Award',
    category: 'mastery',
    xpReward: 500,
    criteria: {
      type: 'special',
    },
  },
  {
    id: 'xp_10000',
    name: 'Master of Sales',
    description: 'Earn 10,000 total XP',
    rarity: 'epic',
    icon: 'Crown',
    category: 'mastery',
    xpReward: 1000,
    criteria: {
      type: 'special',
    },
  },
  {
    id: 'xp_25000',
    name: 'Legendary Closer',
    description: 'Earn 25,000 total XP',
    rarity: 'legendary',
    icon: 'Crown',
    category: 'mastery',
    xpReward: 2500,
    criteria: {
      type: 'special',
    },
  },
];

// Rarity colors for UI
export const RARITY_COLORS: Record<AchievementRarity, { bg: string; border: string; text: string }> = {
  common: {
    bg: 'bg-gray-100',
    border: 'border-gray-400',
    text: 'text-gray-700',
  },
  rare: {
    bg: 'bg-blue-100',
    border: 'border-blue-400',
    text: 'text-blue-700',
  },
  epic: {
    bg: 'bg-purple-100',
    border: 'border-purple-400',
    text: 'text-purple-700',
  },
  legendary: {
    bg: 'bg-amber-100',
    border: 'border-amber-400',
    text: 'text-amber-700',
  },
};

// Category metadata
export const ACHIEVEMENT_CATEGORIES = {
  progress: { name: 'Progress', icon: 'TrendingUp', color: 'green' },
  performance: { name: 'Performance', icon: 'Target', color: 'blue' },
  streak: { name: 'Streaks', icon: 'Flame', color: 'orange' },
  time: { name: 'Timing', icon: 'Clock', color: 'purple' },
  mastery: { name: 'Mastery', icon: 'Crown', color: 'yellow' },
} as const;

// Helper to get achievement by ID
export function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find(a => a.id === id);
}

// Helper to filter achievements by category
export function getAchievementsByCategory(category: Achievement['category']): Achievement[] {
  return ACHIEVEMENTS.filter(a => a.category === category);
}

// Helper to filter achievements by rarity
export function getAchievementsByRarity(rarity: AchievementRarity): Achievement[] {
  return ACHIEVEMENTS.filter(a => a.rarity === rarity);
}
