/**
 * Achievement Broadcasting Utility
 *
 * Broadcasts achievement events via WebSocket to:
 * - The user who earned it (personal notification)
 * - TV display room (public celebration)
 * - Leaderboard viewers (general broadcast)
 */

import type { AchievementEvent } from "../websocket/leaderboard";

// Import will be dynamic to avoid circular dependencies
let wsHandlers: any = null;

/**
 * Initialize the broadcaster with WebSocket handlers
 * Should be called once during server startup
 */
export function initializeAchievementBroadcaster(handlers: any) {
  wsHandlers = handlers;
  console.log("[Achievement Broadcaster] Initialized");
}

/**
 * Broadcast a badge achievement
 */
export function broadcastBadgeAchievement(params: {
  userId: number;
  userName: string;
  badgeName: string;
  badgeDescription: string;
  badgeIcon?: string;
  badgeRarity?: string;
}) {
  if (!wsHandlers?.leaderboard) {
    console.warn("[Achievement Broadcaster] WebSocket handlers not initialized");
    return;
  }

  const achievement: AchievementEvent = {
    userId: params.userId,
    userName: params.userName,
    achievementType: "milestone",
    title: `🏆 ${params.badgeName} Badge Earned!`,
    description: params.badgeDescription,
    icon: params.badgeIcon,
    timestamp: new Date(),
  };

  wsHandlers.leaderboard.celebrateAchievement(achievement);
  console.log(`[Achievement Broadcaster] Badge broadcast: ${params.badgeName} for user ${params.userId}`);
}

/**
 * Broadcast a training milestone (XP, level up, streak)
 */
export function broadcastTrainingMilestone(params: {
  userId: number;
  userName: string;
  milestoneType: 'xp' | 'level_up' | 'streak';
  value: number;
  title: string;
  description: string;
}) {
  if (!wsHandlers?.leaderboard) {
    console.warn("[Achievement Broadcaster] WebSocket handlers not initialized");
    return;
  }

  const achievement: AchievementEvent = {
    userId: params.userId,
    userName: params.userName,
    achievementType: params.milestoneType === 'streak' ? "streak" : "milestone",
    title: params.title,
    description: params.description,
    icon: getMilestoneIcon(params.milestoneType),
    timestamp: new Date(),
  };

  wsHandlers.leaderboard.celebrateAchievement(achievement);
  console.log(`[Achievement Broadcaster] Training milestone: ${params.title} for user ${params.userId}`);
}

/**
 * Broadcast a sales leaderboard rank change
 */
export function broadcastRankChange(params: {
  userId: number;
  userName: string;
  previousRank: number;
  newRank: number;
  metric: string;
}) {
  if (!wsHandlers?.leaderboard) {
    console.warn("[Achievement Broadcaster] WebSocket handlers not initialized");
    return;
  }

  const rankImproved = params.newRank < params.previousRank;

  // Only celebrate significant rank improvements (top 10 or 5+ rank jump)
  if (rankImproved && (params.newRank <= 10 || params.previousRank - params.newRank >= 5)) {
    const achievement: AchievementEvent = {
      userId: params.userId,
      userName: params.userName,
      achievementType: "rank",
      title: `📈 Rank ${params.newRank} Achieved!`,
      description: `Climbed from #${params.previousRank} to #${params.newRank} in ${params.metric}`,
      icon: params.newRank <= 3 ? "🥇" : "🎯",
      timestamp: new Date(),
    };

    wsHandlers.leaderboard.celebrateAchievement(achievement);
    console.log(`[Achievement Broadcaster] Rank change: ${params.userName} improved to #${params.newRank}`);
  }
}

/**
 * Broadcast a contest achievement (winner, top performer)
 */
export function broadcastContestAchievement(params: {
  userId: number;
  userName: string;
  contestName: string;
  placement: number;
  prize?: string;
}) {
  if (!wsHandlers?.leaderboard) {
    console.warn("[Achievement Broadcaster] WebSocket handlers not initialized");
    return;
  }

  const achievement: AchievementEvent = {
    userId: params.userId,
    userName: params.userName,
    achievementType: "contest",
    title: `🏆 ${params.contestName} - ${getPlacementLabel(params.placement)}`,
    description: params.prize
      ? `Won ${params.prize} by placing ${getPlacementLabel(params.placement)}`
      : `Finished ${getPlacementLabel(params.placement)} in ${params.contestName}`,
    icon: getContestIcon(params.placement),
    timestamp: new Date(),
  };

  wsHandlers.leaderboard.celebrateAchievement(achievement);
  console.log(`[Achievement Broadcaster] Contest achievement: ${params.userName} placed ${params.placement}`);
}

/**
 * Broadcast a sales milestone (revenue, signups)
 */
export function broadcastSalesMilestone(params: {
  userId: number;
  userName: string;
  milestoneType: 'revenue' | 'signups';
  value: number;
  threshold: number;
}) {
  if (!wsHandlers?.leaderboard) {
    console.warn("[Achievement Broadcaster] WebSocket handlers not initialized");
    return;
  }

  const achievement: AchievementEvent = {
    userId: params.userId,
    userName: params.userName,
    achievementType: "milestone",
    title: getMilestoneTitle(params.milestoneType, params.threshold),
    description: `Reached ${formatValue(params.value, params.milestoneType)} in ${params.milestoneType}!`,
    icon: getSalesIcon(params.milestoneType),
    timestamp: new Date(),
  };

  wsHandlers.leaderboard.celebrateAchievement(achievement);
  console.log(`[Achievement Broadcaster] Sales milestone: ${params.userName} reached ${params.threshold} ${params.milestoneType}`);
}

// Helper functions

function getMilestoneIcon(type: string): string {
  switch (type) {
    case 'xp': return '⭐';
    case 'level_up': return '🎖️';
    case 'streak': return '🔥';
    default: return '🏆';
  }
}

function getContestIcon(placement: number): string {
  switch (placement) {
    case 1: return '🥇';
    case 2: return '🥈';
    case 3: return '🥉';
    default: return '🏅';
  }
}

function getPlacementLabel(placement: number): string {
  switch (placement) {
    case 1: return '1st Place';
    case 2: return '2nd Place';
    case 3: return '3rd Place';
    default: return `${placement}th Place`;
  }
}

function getSalesIcon(type: string): string {
  switch (type) {
    case 'revenue': return '💰';
    case 'signups': return '📝';
    default: return '🎯';
  }
}

function getMilestoneTitle(type: string, threshold: number): string {
  const formatted = formatValue(threshold, type);
  switch (type) {
    case 'revenue': return `💰 ${formatted} Revenue Milestone!`;
    case 'signups': return `📝 ${threshold} Signups Milestone!`;
    default: return `🎯 ${threshold} ${type} Milestone!`;
  }
}

function formatValue(value: number, type: string): string {
  if (type === 'revenue') {
    return `$${value.toLocaleString()}`;
  }
  return value.toLocaleString();
}
