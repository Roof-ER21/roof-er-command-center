/**
 * Seed Sales Achievements
 *
 * This script adds sales-related achievements to the database
 * Run with: npx tsx scripts/seed-sales-achievements.ts
 */

import { db } from "../server/db.js";
import { achievements } from "../shared/schema.js";
import { eq } from "drizzle-orm";

const salesAchievements = [
  {
    name: 'first_deal',
    description: 'Close your first deal',
    icon: '🎯',
    xpReward: 100,
    requirement: 'Win 1 deal',
    category: 'milestone' as const,
  },
  {
    name: '10k_club',
    description: 'Reach $10,000 in monthly revenue',
    icon: '💰',
    xpReward: 250,
    requirement: 'Achieve $10,000 monthly revenue',
    category: 'milestone' as const,
  },
  {
    name: '50k_club',
    description: 'Reach $50,000 in monthly revenue',
    icon: '💎',
    xpReward: 500,
    requirement: 'Achieve $50,000 monthly revenue',
    category: 'milestone' as const,
  },
  {
    name: 'closer',
    description: 'Win 10 deals in a single month',
    icon: '🏆',
    xpReward: 300,
    requirement: 'Win 10 deals in one month',
    category: 'milestone' as const,
  },
  {
    name: 'target_crusher',
    description: 'Exceed your monthly target by 50%',
    icon: '⚡',
    xpReward: 400,
    requirement: 'Exceed monthly target by 50%',
    category: 'milestone' as const,
  },
  {
    name: 'sales_streak_3',
    description: 'Win deals for 3 consecutive days',
    icon: '🔥',
    xpReward: 150,
    requirement: 'Win deals 3 days in a row',
    category: 'streak' as const,
  },
  {
    name: 'sales_streak_7',
    description: 'Win deals for 7 consecutive days',
    icon: '🌟',
    xpReward: 300,
    requirement: 'Win deals 7 days in a row',
    category: 'streak' as const,
  },
  {
    name: 'leaderboard_top_3',
    description: 'Reach top 3 on the sales leaderboard',
    icon: '🥉',
    xpReward: 350,
    requirement: 'Finish in top 3 on leaderboard',
    category: 'milestone' as const,
  },
  {
    name: 'leaderboard_winner',
    description: 'Reach #1 on the sales leaderboard',
    icon: '👑',
    xpReward: 500,
    requirement: 'Finish #1 on leaderboard',
    category: 'milestone' as const,
  },
];

async function seedSalesAchievements() {
  console.log('🌱 Seeding sales achievements...');

  for (const achievement of salesAchievements) {
    try {
      // Check if achievement already exists
      const [existing] = await db
        .select()
        .from(achievements)
        .where(eq(achievements.name, achievement.name))
        .limit(1);

      if (existing) {
        console.log(`⏭️  Achievement "${achievement.name}" already exists, skipping...`);
        continue;
      }

      // Insert achievement
      await db.insert(achievements).values(achievement);
      console.log(`✅ Created achievement: ${achievement.name} - ${achievement.description}`);
    } catch (error) {
      console.error(`❌ Failed to create achievement "${achievement.name}":`, error);
    }
  }

  console.log('✨ Sales achievements seeding complete!');
}

// Run the seed function
seedSalesAchievements()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
