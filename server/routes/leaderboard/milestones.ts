import { db } from "../../db.js";
import { playerProfiles, playerBadges, badges } from "../../../shared/schema.js";
import { eq, and } from "drizzle-orm";

// Milestone detection types
export interface SalesRepStats {
  id: number;
  name: string;
  avatar: string | null;
  team: string;
  monthlyRevenue: string;
  monthlySignups: string;
  goalProgress: string;
  currentBonusTier: number;
}

export interface Milestone {
  id: string;
  type: 'revenue' | 'signups' | 'bonus_tier' | 'goal_achieved' | 'rank_change';
  title: string;
  description: string;
  value: string | number;
  emoji: string;
  color: string;
  achievedAt: Date;
  salesRep: SalesRepStats;
}

// Helper function to get bonus tier info
export function getBonusTier(signups: number): { tier: number; emoji: string } | null {
  if (signups >= 40) return { tier: 6, emoji: '💯' };
  if (signups >= 35) return { tier: 5, emoji: '👑' };
  if (signups >= 30) return { tier: 4, emoji: '🏆' };
  if (signups >= 25) return { tier: 3, emoji: '💎' };
  if (signups >= 20) return { tier: 2, emoji: '💰' };
  if (signups >= 15) return { tier: 1, emoji: '🪙' };
  return null;
}

// Server-side milestone detection
export function detectMilestones(
  currentRep: SalesRepStats,
  previousRep: SalesRepStats,
  currentRank?: number,
  previousRank?: number
): Milestone[] {
  const milestones: Milestone[] = [];
  const now = new Date();

  // Parse values
  const currentRevenue = parseFloat(String(currentRep.monthlyRevenue).replace(/[$,]/g, ''));
  const previousRevenue = parseFloat(String(previousRep.monthlyRevenue).replace(/[$,]/g, ''));
  const currentSignups = parseFloat(String(currentRep.monthlySignups));
  const previousSignups = parseFloat(String(previousRep.monthlySignups));
  const currentProgress = parseFloat(String(currentRep.goalProgress));
  const previousProgress = parseFloat(String(previousRep.goalProgress));

  // Revenue milestones
  const revenueMilestones = [10000, 25000, 50000, 75000, 100000];
  revenueMilestones.forEach(threshold => {
    if (currentRevenue >= threshold && previousRevenue < threshold) {
      milestones.push({
        id: `revenue_${threshold}_${currentRep.id}`,
        type: 'revenue',
        title: `$${threshold.toLocaleString()} Revenue Milestone`,
        description: `Reached $${threshold.toLocaleString()} in monthly revenue!`,
        value: currentRevenue,
        emoji: '💰',
        color: 'bg-green-500',
        achievedAt: now,
        salesRep: currentRep
      });
    }
  });

  // Signup milestones
  const signupMilestones = [10, 15, 20, 25, 30, 35, 40];
  signupMilestones.forEach(threshold => {
    if (currentSignups >= threshold && previousSignups < threshold) {
      milestones.push({
        id: `signups_${threshold}_${currentRep.id}`,
        type: 'signups',
        title: `${threshold} Signups Milestone`,
        description: `Achieved ${threshold} signups this month!`,
        value: currentSignups,
        emoji: '🎯',
        color: 'bg-blue-500',
        achievedAt: now,
        salesRep: currentRep
      });
    }
  });

  // Bonus tier milestones
  const currentTier = getBonusTier(currentSignups);
  const previousTier = getBonusTier(previousSignups);

  if (currentTier && (!previousTier || currentTier.tier > previousTier.tier)) {
    milestones.push({
      id: `bonus_tier_${currentTier.tier}_${currentRep.id}`,
      type: 'bonus_tier',
      title: `Bonus Tier ${currentTier.tier} Unlocked!`,
      description: `Advanced to Tier ${currentTier.tier} bonus level!`,
      value: currentTier.emoji,
      emoji: currentTier.emoji,
      color: 'bg-purple-500',
      achievedAt: now,
      salesRep: currentRep
    });
  }

  // Goal achievement milestone
  if (currentProgress >= 100 && previousProgress < 100) {
    milestones.push({
      id: `goal_achieved_${currentRep.id}`,
      type: 'goal_achieved',
      title: 'Monthly Goal Achieved!',
      description: 'Congratulations on reaching your monthly target!',
      value: `${Math.round(currentProgress)}%`,
      emoji: '🏆',
      color: 'bg-primary',
      achievedAt: now,
      salesRep: currentRep
    });
  }

  // Rank change milestone (moved into top 3)
  if (currentRank !== undefined && previousRank !== undefined) {
    if (currentRank <= 3 && previousRank > 3) {
      milestones.push({
        id: `rank_top3_${currentRep.id}`,
        type: 'rank_change',
        title: 'Top 3 Achieved!',
        description: `Moved up to rank #${currentRank}!`,
        value: `#${currentRank}`,
        emoji: '🥇',
        color: 'bg-yellow-500',
        achievedAt: now,
        salesRep: currentRep
      });
    }
  }

  return milestones;
}

// Helper function to award badge for milestone
export async function awardMilestoneBadge(salesRepId: number, milestone: Milestone) {
  try {
    // Get or create player profile
    let [playerProfile] = await db
      .select()
      .from(playerProfiles)
      .where(eq(playerProfiles.salesRepId, salesRepId));

    if (!playerProfile) {
      // Create player profile if it doesn't exist
      [playerProfile] = await db.insert(playerProfiles).values({
        salesRepId,
        playerLevel: 1,
        totalCareerPoints: 0,
        seasonPoints: 0,
        monthlyPoints: 0,
        currentStreak: 0,
        longestStreak: 0,
      }).returning();
    }

    // Find appropriate badge based on milestone type
    let badgeName = '';
    switch (milestone.type) {
      case 'revenue':
        const revenue = Number(milestone.value);
        if (revenue >= 100000) badgeName = 'Revenue King';
        else if (revenue >= 50000) badgeName = 'Top Earner';
        else if (revenue >= 25000) badgeName = 'Rising Star';
        break;
      case 'signups':
        const signups = Number(milestone.value);
        if (signups >= 40) badgeName = 'Signup Master';
        else if (signups >= 30) badgeName = 'Consistent Closer';
        else if (signups >= 20) badgeName = 'Sales Rookie';
        break;
      case 'bonus_tier':
        badgeName = 'Bonus Achiever';
        break;
      case 'goal_achieved':
        badgeName = 'Goal Crusher';
        break;
      case 'rank_change':
        badgeName = 'Top Performer';
        break;
    }

    if (!badgeName) return;

    // Find badge
    const [badge] = await db
      .select()
      .from(badges)
      .where(eq(badges.name, badgeName))
      .limit(1);

    if (!badge) {
      console.log(`[Milestone] Badge "${badgeName}" not found in database`);
      return;
    }

    // Check if player already has this badge
    const [existingBadge] = await db
      .select()
      .from(playerBadges)
      .where(
        and(
          eq(playerBadges.playerId, playerProfile.id),
          eq(playerBadges.badgeId, badge.id)
        )
      );

    if (!existingBadge) {
      // Award badge
      await db.insert(playerBadges).values({
        playerId: playerProfile.id,
        badgeId: badge.id,
      });

      console.log(`[Milestone] Awarded badge "${badgeName}" to player ${playerProfile.id}`);
    }
  } catch (error) {
    console.error('[Milestone] Error awarding badge:', error);
  }
}
