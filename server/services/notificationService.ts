import { db } from '../db';
import { notifications, type NewNotification } from '@shared/schema';
import type { Server as SocketServer } from 'socket.io';

let io: SocketServer | null = null;

export function initNotificationService(socketIo: SocketServer) {
  io = socketIo;
}

export async function createNotification(notification: NewNotification) {
  try {
    const [created] = await db
      .insert(notifications)
      .values(notification)
      .returning();

    // Emit to user via WebSocket if connected
    if (io) {
      io.to(`user:${notification.userId}`).emit('notification', created);
    }

    return created;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

// Helper functions for common notification types

export async function notifyAchievement(userId: number, achievementName: string, xpReward: number) {
  return createNotification({
    userId,
    type: 'achievement',
    title: 'Achievement Unlocked!',
    message: `You earned "${achievementName}" and gained ${xpReward} XP!`,
    link: '/training/achievements',
    isRead: false,
    metadata: { achievementName, xpReward },
  });
}

export async function notifyXPGain(userId: number, xpAmount: number, source: string) {
  return createNotification({
    userId,
    type: 'xp_gain',
    title: 'XP Gained!',
    message: `You earned ${xpAmount} XP from ${source}`,
    link: '/training',
    isRead: false,
    metadata: { xpAmount, source },
  });
}

export async function notifyLevelUp(userId: number, newLevel: number) {
  return createNotification({
    userId,
    type: 'level_up',
    title: `Level Up! You're now Level ${newLevel}!`,
    message: `Congratulations on reaching Level ${newLevel}! Keep up the great work!`,
    link: '/training',
    isRead: false,
    metadata: { newLevel },
  });
}

export async function notifyContestUpdate(userId: number, contestTitle: string, message: string, link?: string) {
  return createNotification({
    userId,
    type: 'contest_update',
    title: `Contest Update: ${contestTitle}`,
    message,
    link: link || '/leaderboard/contests',
    isRead: false,
    metadata: { contestTitle },
  });
}

export async function notifyPTOApproved(userId: number, startDate: string, endDate: string) {
  return createNotification({
    userId,
    type: 'pto_approved',
    title: 'PTO Request Approved',
    message: `Your PTO request for ${startDate} to ${endDate} has been approved.`,
    link: '/hr/pto',
    isRead: false,
    metadata: { startDate, endDate },
  });
}

export async function notifyPTODenied(userId: number, startDate: string, endDate: string, reason?: string) {
  return createNotification({
    userId,
    type: 'pto_denied',
    title: 'PTO Request Denied',
    message: reason
      ? `Your PTO request for ${startDate} to ${endDate} was denied: ${reason}`
      : `Your PTO request for ${startDate} to ${endDate} was denied.`,
    link: '/hr/pto',
    isRead: false,
    metadata: { startDate, endDate, reason },
  });
}

export async function notifyNewLead(userId: number, leadInfo: string) {
  return createNotification({
    userId,
    type: 'new_lead',
    title: 'New Lead Assigned',
    message: leadInfo,
    link: '/field',
    isRead: false,
    metadata: { leadInfo },
  });
}

export async function notifyStreakReminder(userId: number, currentStreak: number) {
  return createNotification({
    userId,
    type: 'streak_reminder',
    title: 'Keep Your Streak Alive!',
    message: `You have a ${currentStreak}-day streak. Don't forget to practice today!`,
    link: '/training',
    isRead: false,
    metadata: { currentStreak },
  });
}

export async function notifyTrainingComplete(userId: number, moduleName: string, score?: number) {
  return createNotification({
    userId,
    type: 'training_complete',
    title: 'Training Module Complete',
    message: score
      ? `You completed "${moduleName}" with a score of ${score}!`
      : `You completed "${moduleName}"!`,
    link: '/training',
    isRead: false,
    metadata: { moduleName, score },
  });
}

export async function notifyTeamUpdate(userId: number, message: string, link?: string) {
  return createNotification({
    userId,
    type: 'team_update',
    title: 'Team Update',
    message,
    link: link || '/leaderboard',
    isRead: false,
    metadata: {},
  });
}
