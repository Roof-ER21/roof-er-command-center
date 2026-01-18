/**
 * Badge Awarding System for Roof ER Command Center
 *
 * This module implements the complete badge checking and awarding logic
 * for the sales leaderboard gamification system.
 */

import { db } from "../../db.js";
import {
  salesReps,
  badges,
  playerProfiles,
  playerBadges,
} from "../../../shared/schema.js";
import { eq, and } from "drizzle-orm";

/**
 * Interface for badge requirements
 */
interface BadgeRequirement {
  type: string;
  value: number | boolean;
}

/**
 * Interface for newly awarded badge
 */
interface NewlyAwardedBadge {
  id: number;
  name: string;
  description: string;
  iconUrl: string | null;
  category: string;
  rarity: string;
  earnedAt: Date;
}

/**
 * Check and award all eligible badges for a sales rep
 *
 * This function:
 * 1. Gets sales rep data and player profile
 * 2. Retrieves all active badges and already earned badges
 * 3. Calculates current metrics (rank, team MVP, etc.)
 * 4. Checks each badge requirement
 * 5. Awards newly qualified badges
 * 6. Returns list of newly awarded badges
 *
 * @param salesRepId - ID of the sales rep to check badges for
 * @returns Array of newly awarded badges
 */
export async function checkAndAwardBadges(salesRepId: number): Promise<NewlyAwardedBadge[]> {
  try {
    // Get sales rep data
    const [salesRep] = await db.select()
      .from(salesReps)
      .where(eq(salesReps.id, salesRepId))
      .limit(1);

    if (!salesRep) {
      throw new Error("Sales rep not found");
    }

    // Get or create player profile
    let [playerProfile] = await db.select()
      .from(playerProfiles)
      .where(eq(playerProfiles.salesRepId, salesRepId))
      .limit(1);

    if (!playerProfile) {
      // Create player profile if it doesn't exist
      [playerProfile] = await db.insert(playerProfiles)
        .values({
          salesRepId,
          playerLevel: 1,
          totalCareerPoints: 0,
          seasonPoints: 0,
          monthlyPoints: 0,
          currentStreak: 0,
          longestStreak: 0,
        })
        .returning();
    }

    // Get all active badges
    const allBadges = await db.select()
      .from(badges)
      .where(eq(badges.isActive, true));

    // Get already earned badges for this player
    const earnedBadgeIds = await db.select({ badgeId: playerBadges.badgeId })
      .from(playerBadges)
      .where(eq(playerBadges.playerId, playerProfile.id));

    const earnedBadgeIdSet = new Set(earnedBadgeIds.map(b => b.badgeId));

    // Get all active reps for rank calculation
    const allReps = await db.select()
      .from(salesReps)
      .where(eq(salesReps.isActive, true));

    const sortedBySignups = [...allReps].sort(
      (a, b) => parseFloat(b.monthlySignups) - parseFloat(a.monthlySignups)
    );
    const currentRank = sortedBySignups.findIndex(r => r.id === salesRepId) + 1;

    // Calculate team rank
    let isTeamMVP = false;
    if (salesRep.team) {
      const teamReps = allReps.filter(r => r.team === salesRep.team);
      const sortedTeamReps = [...teamReps].sort(
        (a, b) => parseFloat(b.monthlySignups) - parseFloat(a.monthlySignups)
      );
      isTeamMVP = sortedTeamReps.length > 1 && sortedTeamReps[0].id === salesRepId;
    }

    // Check goal progress
    const monthlyGoalAchieved = parseFloat(salesRep.monthlySignups) >= parseFloat(salesRep.monthlySignupGoal);
    const yearlyGoalAchieved = parseFloat(salesRep.yearlyRevenue) >= parseFloat(salesRep.yearlyRevenueGoal);

    // Parse numeric values
    const monthlySignups = parseFloat(salesRep.monthlySignups);
    const monthlyRevenue = parseFloat(salesRep.monthlyRevenue);
    const monthlyGrowth = parseFloat(salesRep.monthlyGrowth);
    const currentStreak = playerProfile.currentStreak;
    const bonusTier = salesRep.currentBonusTier;

    // Calculate total signups (using yearly for now - would need historical data for all-time)
    const totalSignups = parseFloat(salesRep.yearlySignups);

    // Check if first sale (any signups at all)
    const hasFirstSale = monthlySignups > 0 || totalSignups > 0;

    const newlyAwardedBadges: NewlyAwardedBadge[] = [];

    // Iterate through all badges and check requirements
    for (const badge of allBadges) {
      // Skip if already earned
      if (earnedBadgeIdSet.has(badge.id)) {
        continue;
      }

      let shouldAward = false;

      // Parse requirement JSON
      let requirement: BadgeRequirement | null = null;
      try {
        requirement = badge.requirement ? JSON.parse(badge.requirement) : null;
      } catch (error) {
        console.error(`Failed to parse requirement for badge ${badge.name}:`, error);
        continue;
      }

      if (!requirement) continue;

      // Check requirement based on type
      switch (requirement.type) {
        case 'monthly_signups':
          shouldAward = monthlySignups >= (requirement.value as number);
          break;

        case 'monthly_revenue':
          shouldAward = monthlyRevenue >= (requirement.value as number);
          break;

        case 'bonus_tier':
          shouldAward = bonusTier >= (requirement.value as number);
          break;

        case 'streak_days':
          shouldAward = currentStreak >= (requirement.value as number);
          break;

        case 'rank':
          shouldAward = currentRank === (requirement.value as number);
          break;

        case 'team_mvp':
          shouldAward = isTeamMVP;
          break;

        case 'first_sale':
          shouldAward = hasFirstSale;
          break;

        case 'total_signups':
          shouldAward = totalSignups >= (requirement.value as number);
          break;

        case 'monthly_growth':
          shouldAward = monthlyGrowth >= (requirement.value as number);
          break;

        case 'yearly_goal_achieved':
          shouldAward = yearlyGoalAchieved;
          break;

        case 'perfect_month':
          shouldAward = monthlyGoalAchieved && yearlyGoalAchieved;
          break;

        // Complex requirements - would need more historical data
        case 'rank_improvement':
        case 'rookie_month':
        case 'consecutive_goal_months':
          // Skip for now - requires historical tracking
          // TODO: Implement when leaderboard snapshot history is available
          break;

        default:
          console.warn(`Unknown requirement type: ${requirement.type} for badge ${badge.name}`);
      }

      // Award the badge if requirements met
      if (shouldAward) {
        await db.insert(playerBadges).values({
          playerId: playerProfile.id,
          badgeId: badge.id,
        });

        newlyAwardedBadges.push({
          id: badge.id,
          name: badge.name,
          description: badge.description,
          iconUrl: badge.iconUrl,
          category: badge.category as string,
          rarity: badge.rarity as string,
          earnedAt: new Date(),
        });

        console.log(`🏆 Badge awarded: ${badge.name} to sales rep #${salesRepId} (${salesRep.name})`);
      }
    }

    return newlyAwardedBadges;
  } catch (error) {
    console.error('Error checking and awarding badges:', error);
    throw error;
  }
}

/**
 * Award a specific badge to a player (manual award)
 *
 * @param playerId - ID of the player profile
 * @param badgeId - ID of the badge to award
 * @returns The awarded badge with earnedAt timestamp
 */
export async function awardBadge(playerId: number, badgeId: number) {
  try {
    // Check if player exists
    const [player] = await db.select()
      .from(playerProfiles)
      .where(eq(playerProfiles.id, playerId))
      .limit(1);

    if (!player) {
      throw new Error("Player profile not found");
    }

    // Check if badge exists
    const [badge] = await db.select()
      .from(badges)
      .where(eq(badges.id, badgeId))
      .limit(1);

    if (!badge) {
      throw new Error("Badge not found");
    }

    // Check if already awarded
    const existing = await db.select()
      .from(playerBadges)
      .where(
        and(
          eq(playerBadges.playerId, playerId),
          eq(playerBadges.badgeId, badgeId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return {
        alreadyAwarded: true,
        badge: {
          ...badge,
          earnedAt: existing[0].earnedAt,
        }
      };
    }

    // Award the badge
    const [playerBadge] = await db.insert(playerBadges)
      .values({
        playerId,
        badgeId,
      })
      .returning();

    console.log(`🏆 Badge manually awarded: ${badge.name} to player #${playerId}`);

    return {
      alreadyAwarded: false,
      badge: {
        ...badge,
        earnedAt: playerBadge.earnedAt,
      }
    };
  } catch (error) {
    console.error('Error awarding badge:', error);
    throw error;
  }
}
