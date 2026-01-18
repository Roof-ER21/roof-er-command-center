/**
 * Sales Milestone Tracker
 *
 * Detects when sales reps cross milestone thresholds and broadcasts achievements
 */

import {
  broadcastSalesMilestone,
  broadcastRankChange,
} from "./achievement-broadcaster.js";

// Milestone thresholds for revenue (in dollars)
const REVENUE_MILESTONES = [
  10000,   // $10K
  25000,   // $25K
  50000,   // $50K
  100000,  // $100K
  250000,  // $250K
  500000,  // $500K
  1000000, // $1M
];

// Milestone thresholds for signups
const SIGNUP_MILESTONES = [
  10,   // 10 signups
  25,   // 25 signups
  50,   // 50 signups
  100,  // 100 signups
  250,  // 250 signups
  500,  // 500 signups
  1000, // 1000 signups
];

/**
 * Check if a revenue update crossed any milestones
 */
export function checkRevenueMilestones(
  userId: number,
  userName: string,
  oldRevenue: number,
  newRevenue: number,
  period: 'monthly' | 'yearly' | 'allTime' = 'monthly'
) {
  for (const threshold of REVENUE_MILESTONES) {
    if (oldRevenue < threshold && newRevenue >= threshold) {
      broadcastSalesMilestone({
        userId,
        userName,
        milestoneType: 'revenue',
        value: newRevenue,
        threshold,
      });
      console.log(`[Milestone Tracker] ${userName} reached $${threshold} ${period} revenue milestone`);
    }
  }
}

/**
 * Check if a signup update crossed any milestones
 */
export function checkSignupMilestones(
  userId: number,
  userName: string,
  oldSignups: number,
  newSignups: number,
  period: 'monthly' | 'yearly' | 'allTime' = 'monthly'
) {
  for (const threshold of SIGNUP_MILESTONES) {
    if (oldSignups < threshold && newSignups >= threshold) {
      broadcastSalesMilestone({
        userId,
        userName,
        milestoneType: 'signups',
        value: newSignups,
        threshold,
      });
      console.log(`[Milestone Tracker] ${userName} reached ${threshold} ${period} signups milestone`);
    }
  }
}

/**
 * Check if rank position changed significantly
 */
export function checkRankChange(
  userId: number,
  userName: string,
  oldRank: number,
  newRank: number,
  metric: string = 'monthly revenue'
) {
  if (oldRank !== newRank) {
    broadcastRankChange({
      userId,
      userName,
      previousRank: oldRank,
      newRank,
      metric,
    });
  }
}

/**
 * Analyze all sales rep changes and detect milestones
 */
export function analyzeSalesRepUpdate(params: {
  userId: number;
  userName: string;
  oldData: {
    monthlyRevenue?: number;
    yearlyRevenue?: number;
    allTimeRevenue?: number;
    monthlySignups?: number;
    yearlySignups?: number;
    rank?: number;
  };
  newData: {
    monthlyRevenue?: number;
    yearlyRevenue?: number;
    allTimeRevenue?: number;
    monthlySignups?: number;
    yearlySignups?: number;
    rank?: number;
  };
}) {
  const { userId, userName, oldData, newData } = params;

  // Check revenue milestones
  if (oldData.monthlyRevenue !== undefined && newData.monthlyRevenue !== undefined) {
    checkRevenueMilestones(userId, userName, oldData.monthlyRevenue, newData.monthlyRevenue, 'monthly');
  }

  if (oldData.yearlyRevenue !== undefined && newData.yearlyRevenue !== undefined) {
    checkRevenueMilestones(userId, userName, oldData.yearlyRevenue, newData.yearlyRevenue, 'yearly');
  }

  if (oldData.allTimeRevenue !== undefined && newData.allTimeRevenue !== undefined) {
    checkRevenueMilestones(userId, userName, oldData.allTimeRevenue, newData.allTimeRevenue, 'allTime');
  }

  // Check signup milestones
  if (oldData.monthlySignups !== undefined && newData.monthlySignups !== undefined) {
    checkSignupMilestones(userId, userName, oldData.monthlySignups, newData.monthlySignups, 'monthly');
  }

  if (oldData.yearlySignups !== undefined && newData.yearlySignups !== undefined) {
    checkSignupMilestones(userId, userName, oldData.yearlySignups, newData.yearlySignups, 'yearly');
  }

  // Check rank changes
  if (oldData.rank !== undefined && newData.rank !== undefined) {
    checkRankChange(userId, userName, oldData.rank, newData.rank);
  }
}
