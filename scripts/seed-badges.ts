import 'dotenv/config';
import { db, schema } from '../server/db.js';
import { eq } from 'drizzle-orm';

/**
 * Badge Seed Script for Roof ER Command Center
 *
 * Creates comprehensive badge definitions for the sales leaderboard gamification system.
 * Categories: performance, milestone, streak, special
 * Rarities: common, rare, epic, legendary
 */

interface BadgeDefinition {
  name: string;
  description: string;
  iconUrl: string | null;
  category: 'performance' | 'milestone' | 'streak' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirement: string | null; // JSON string
  isActive: boolean;
}

async function seedBadges() {
  console.log('🏆 Starting badge seed...\n');

  try {
    // ============================================================================
    // BADGE DEFINITIONS
    // ============================================================================

    const badges: BadgeDefinition[] = [
      // ========================================================================
      // PERFORMANCE BADGES - Signup Milestones
      // ========================================================================
      {
        name: 'Getting Started',
        description: 'Achieved 10 signups in a month',
        iconUrl: '🎯',
        category: 'performance',
        rarity: 'common',
        requirement: JSON.stringify({ type: 'monthly_signups', value: 10 }),
        isActive: true,
      },
      {
        name: 'Rising Star',
        description: 'Achieved 15 signups in a month',
        iconUrl: '⭐',
        category: 'performance',
        rarity: 'common',
        requirement: JSON.stringify({ type: 'monthly_signups', value: 15 }),
        isActive: true,
      },
      {
        name: 'Sales Pro',
        description: 'Achieved 20 signups in a month',
        iconUrl: '🌟',
        category: 'performance',
        rarity: 'rare',
        requirement: JSON.stringify({ type: 'monthly_signups', value: 20 }),
        isActive: true,
      },
      {
        name: 'Heavy Hitter',
        description: 'Achieved 25 signups in a month',
        iconUrl: '💪',
        category: 'performance',
        rarity: 'rare',
        requirement: JSON.stringify({ type: 'monthly_signups', value: 25 }),
        isActive: true,
      },
      {
        name: 'Elite Performer',
        description: 'Achieved 30 signups in a month',
        iconUrl: '🏅',
        category: 'performance',
        rarity: 'epic',
        requirement: JSON.stringify({ type: 'monthly_signups', value: 30 }),
        isActive: true,
      },
      {
        name: 'Top Gun',
        description: 'Achieved 35 signups in a month',
        iconUrl: '🚀',
        category: 'performance',
        rarity: 'epic',
        requirement: JSON.stringify({ type: 'monthly_signups', value: 35 }),
        isActive: true,
      },
      {
        name: 'Legend',
        description: 'Achieved 40 signups in a month - The pinnacle of sales excellence',
        iconUrl: '👑',
        category: 'performance',
        rarity: 'legendary',
        requirement: JSON.stringify({ type: 'monthly_signups', value: 40 }),
        isActive: true,
      },

      // ========================================================================
      // MILESTONE BADGES - Revenue Achievements
      // ========================================================================
      {
        name: 'Revenue Rookie',
        description: 'Generated $10,000 in monthly revenue',
        iconUrl: '💵',
        category: 'milestone',
        rarity: 'common',
        requirement: JSON.stringify({ type: 'monthly_revenue', value: 10000 }),
        isActive: true,
      },
      {
        name: 'Revenue Builder',
        description: 'Generated $25,000 in monthly revenue',
        iconUrl: '💰',
        category: 'milestone',
        rarity: 'rare',
        requirement: JSON.stringify({ type: 'monthly_revenue', value: 25000 }),
        isActive: true,
      },
      {
        name: 'Revenue Champion',
        description: 'Generated $50,000 in monthly revenue',
        iconUrl: '💎',
        category: 'milestone',
        rarity: 'epic',
        requirement: JSON.stringify({ type: 'monthly_revenue', value: 50000 }),
        isActive: true,
      },
      {
        name: 'Revenue Master',
        description: 'Generated $75,000 in monthly revenue',
        iconUrl: '🏆',
        category: 'milestone',
        rarity: 'epic',
        requirement: JSON.stringify({ type: 'monthly_revenue', value: 75000 }),
        isActive: true,
      },
      {
        name: 'Revenue Legend',
        description: 'Generated $100,000 in monthly revenue - Elite status achieved',
        iconUrl: '👑',
        category: 'milestone',
        rarity: 'legendary',
        requirement: JSON.stringify({ type: 'monthly_revenue', value: 100000 }),
        isActive: true,
      },

      // ========================================================================
      // MILESTONE BADGES - Bonus Tier Achievements
      // ========================================================================
      {
        name: 'Bronze Tier',
        description: 'Unlocked Bronze bonus tier',
        iconUrl: '🥉',
        category: 'milestone',
        rarity: 'common',
        requirement: JSON.stringify({ type: 'bonus_tier', value: 1 }),
        isActive: true,
      },
      {
        name: 'Silver Tier',
        description: 'Unlocked Silver bonus tier',
        iconUrl: '🥈',
        category: 'milestone',
        rarity: 'common',
        requirement: JSON.stringify({ type: 'bonus_tier', value: 2 }),
        isActive: true,
      },
      {
        name: 'Gold Tier',
        description: 'Unlocked Gold bonus tier',
        iconUrl: '🥇',
        category: 'milestone',
        rarity: 'rare',
        requirement: JSON.stringify({ type: 'bonus_tier', value: 3 }),
        isActive: true,
      },
      {
        name: 'Platinum Tier',
        description: 'Unlocked Platinum bonus tier',
        iconUrl: '💍',
        category: 'milestone',
        rarity: 'epic',
        requirement: JSON.stringify({ type: 'bonus_tier', value: 4 }),
        isActive: true,
      },
      {
        name: 'Diamond Tier',
        description: 'Unlocked Diamond bonus tier',
        iconUrl: '💎',
        category: 'milestone',
        rarity: 'epic',
        requirement: JSON.stringify({ type: 'bonus_tier', value: 5 }),
        isActive: true,
      },
      {
        name: 'Elite Tier',
        description: 'Unlocked Elite bonus tier - The highest achievement',
        iconUrl: '⚡',
        category: 'milestone',
        rarity: 'legendary',
        requirement: JSON.stringify({ type: 'bonus_tier', value: 6 }),
        isActive: true,
      },

      // ========================================================================
      // STREAK BADGES - Activity Consistency
      // ========================================================================
      {
        name: 'Week Warrior',
        description: 'Maintained a 7-day activity streak',
        iconUrl: '🔥',
        category: 'streak',
        rarity: 'common',
        requirement: JSON.stringify({ type: 'streak_days', value: 7 }),
        isActive: true,
      },
      {
        name: 'Two Week Champion',
        description: 'Maintained a 14-day activity streak',
        iconUrl: '🔥🔥',
        category: 'streak',
        rarity: 'rare',
        requirement: JSON.stringify({ type: 'streak_days', value: 14 }),
        isActive: true,
      },
      {
        name: 'Monthly Grinder',
        description: 'Maintained a 30-day activity streak',
        iconUrl: '🔥🔥🔥',
        category: 'streak',
        rarity: 'epic',
        requirement: JSON.stringify({ type: 'streak_days', value: 30 }),
        isActive: true,
      },
      {
        name: 'Unstoppable Force',
        description: 'Maintained a 60-day activity streak',
        iconUrl: '⚡',
        category: 'streak',
        rarity: 'epic',
        requirement: JSON.stringify({ type: 'streak_days', value: 60 }),
        isActive: true,
      },
      {
        name: 'Eternal Flame',
        description: 'Maintained a 90-day activity streak - Ultimate dedication',
        iconUrl: '🌟',
        category: 'streak',
        rarity: 'legendary',
        requirement: JSON.stringify({ type: 'streak_days', value: 90 }),
        isActive: true,
      },

      // ========================================================================
      // SPECIAL BADGES - Unique Achievements
      // ========================================================================
      {
        name: 'First Sale',
        description: 'Completed your first sale - Welcome to the team!',
        iconUrl: '🎉',
        category: 'special',
        rarity: 'common',
        requirement: JSON.stringify({ type: 'first_sale', value: true }),
        isActive: true,
      },
      {
        name: 'Top Performer',
        description: 'Ranked #1 on the leaderboard',
        iconUrl: '🏆',
        category: 'special',
        rarity: 'legendary',
        requirement: JSON.stringify({ type: 'rank', value: 1 }),
        isActive: true,
      },
      {
        name: 'Team MVP',
        description: 'Highest performer in your team for the month',
        iconUrl: '⭐',
        category: 'special',
        rarity: 'epic',
        requirement: JSON.stringify({ type: 'team_mvp', value: true }),
        isActive: true,
      },
      {
        name: 'Rookie of the Month',
        description: 'Top performer in first 30 days',
        iconUrl: '🌟',
        category: 'special',
        rarity: 'rare',
        requirement: JSON.stringify({ type: 'rookie_month', value: true }),
        isActive: true,
      },
      {
        name: 'Comeback Kid',
        description: 'Improved rank by 10+ positions in a month',
        iconUrl: '📈',
        category: 'special',
        rarity: 'rare',
        requirement: JSON.stringify({ type: 'rank_improvement', value: 10 }),
        isActive: true,
      },
      {
        name: 'Perfect Month',
        description: 'Hit 100% of all monthly goals',
        iconUrl: '💯',
        category: 'special',
        rarity: 'epic',
        requirement: JSON.stringify({ type: 'perfect_month', value: true }),
        isActive: true,
      },
      {
        name: 'Century Club',
        description: 'Achieved 100+ total signups all-time',
        iconUrl: '💯',
        category: 'special',
        rarity: 'epic',
        requirement: JSON.stringify({ type: 'total_signups', value: 100 }),
        isActive: true,
      },
      {
        name: 'Hall of Fame',
        description: 'Achieved 500+ total signups all-time',
        iconUrl: '🏛️',
        category: 'special',
        rarity: 'legendary',
        requirement: JSON.stringify({ type: 'total_signups', value: 500 }),
        isActive: true,
      },
      {
        name: 'Growth Expert',
        description: 'Achieved 50%+ monthly growth',
        iconUrl: '📊',
        category: 'special',
        rarity: 'rare',
        requirement: JSON.stringify({ type: 'monthly_growth', value: 50 }),
        isActive: true,
      },
      {
        name: 'Consistency King',
        description: 'Hit monthly signup goal for 3 consecutive months',
        iconUrl: '👑',
        category: 'special',
        rarity: 'epic',
        requirement: JSON.stringify({ type: 'consecutive_goal_months', value: 3 }),
        isActive: true,
      },
      {
        name: 'Year Dominator',
        description: 'Hit yearly revenue goal',
        iconUrl: '🎯',
        category: 'special',
        rarity: 'legendary',
        requirement: JSON.stringify({ type: 'yearly_goal_achieved', value: true }),
        isActive: true,
      },
    ];

    // ============================================================================
    // INSERT BADGES (IDEMPOTENT)
    // ============================================================================
    console.log(`📝 Inserting ${badges.length} badge definitions...\n`);

    let insertedCount = 0;
    let skippedCount = 0;
    let updatedCount = 0;

    for (const badge of badges) {
      try {
        // Check if badge already exists
        const existing = await db
          .select()
          .from(schema.badges)
          .where(eq(schema.badges.name, badge.name))
          .limit(1);

        if (existing.length === 0) {
          // Insert new badge
          await db.insert(schema.badges).values(badge);
          insertedCount++;
          console.log(`✅ Created: ${badge.name} (${badge.rarity} ${badge.category})`);
        } else {
          // Update existing badge to ensure latest definition
          await db
            .update(schema.badges)
            .set({
              description: badge.description,
              iconUrl: badge.iconUrl,
              category: badge.category,
              rarity: badge.rarity,
              requirement: badge.requirement,
              isActive: badge.isActive,
            })
            .where(eq(schema.badges.name, badge.name));
          updatedCount++;
          console.log(`🔄 Updated: ${badge.name} (${badge.rarity} ${badge.category})`);
        }
      } catch (error) {
        console.error(`❌ Error processing badge "${badge.name}":`, error);
        skippedCount++;
      }
    }

    // ============================================================================
    // SUMMARY
    // ============================================================================
    console.log('\n' + '='.repeat(60));
    console.log('🏆 BADGE SEED COMPLETE! 🏆');
    console.log('='.repeat(60));
    console.log(`\n📊 Summary:`);
    console.log(`   ✨ New badges created: ${insertedCount}`);
    console.log(`   🔄 Existing badges updated: ${updatedCount}`);
    console.log(`   ⏭️  Skipped (errors): ${skippedCount}`);
    console.log(`   📦 Total badges defined: ${badges.length}`);

    // Category breakdown
    const categories = badges.reduce((acc, b) => {
      acc[b.category] = (acc[b.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n📂 Badges by Category:');
    Object.entries(categories).forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count}`);
    });

    // Rarity breakdown
    const rarities = badges.reduce((acc, b) => {
      acc[b.rarity] = (acc[b.rarity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n💎 Badges by Rarity:');
    Object.entries(rarities).forEach(([rarity, count]) => {
      console.log(`   ${rarity}: ${count}`);
    });

    console.log('\n🎯 Next Steps:');
    console.log('   1. Badges are now available for the leaderboard system');
    console.log('   2. Implement badge earning logic in your application');
    console.log('   3. Award badges based on requirement criteria\n');

  } catch (error) {
    console.error('\n❌ Error during badge seed:', error);
    throw error;
  }
}

// Run the seed
seedBadges()
  .then(() => {
    console.log('✅ Badge seed completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Badge seed failed:', error);
    process.exit(1);
  });
