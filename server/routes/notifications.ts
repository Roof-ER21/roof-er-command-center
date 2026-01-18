import express, { type Request, type Response } from 'express';
import { db } from '../db';
import { notifications, insertNotificationSchema } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';

const router = express.Router();

// Get user notifications (newest first, with optional unread filter)
router.get('/', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const unreadOnly = req.query.unreadOnly === 'true';
    const limit = parseInt(req.query.limit as string) || 50;

    let query = db
      .select()
      .from(notifications)
      .where(
        unreadOnly
          ? and(
              eq(notifications.userId, req.user.id),
              eq(notifications.isRead, false)
            )
          : eq(notifications.userId, req.user.id)
      )
      .orderBy(desc(notifications.createdAt))
      .limit(limit);

    const results = await query;

    // Get unread count
    const unreadCount = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, req.user.id),
          eq(notifications.isRead, false)
        )
      );

    res.json({
      notifications: results,
      unreadCount: unreadCount.length,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// Get unread count only (for badge)
router.get('/count', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const unread = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, req.user.id),
          eq(notifications.isRead, false)
        )
      );

    res.json({ count: unread.length });
  } catch (error) {
    console.error('Error fetching notification count:', error);
    res.status(500).json({ message: 'Failed to fetch count' });
  }
});

// Mark notification as read
router.patch('/:id/read', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const notificationId = parseInt(req.params.id);

    // Verify ownership
    const notification = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, notificationId))
      .limit(1);

    if (!notification.length || notification[0].userId !== req.user.id) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    const [updated] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Failed to update notification' });
  }
});

// Mark all notifications as read
router.patch('/read-all', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.userId, req.user.id),
          eq(notifications.isRead, false)
        )
      );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ message: 'Failed to update notifications' });
  }
});

// Delete notification
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const notificationId = parseInt(req.params.id);

    // Verify ownership
    const notification = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, notificationId))
      .limit(1);

    if (!notification.length || notification[0].userId !== req.user.id) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await db
      .delete(notifications)
      .where(eq(notifications.id, notificationId));

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Failed to delete notification' });
  }
});

// Clear all read notifications
router.delete('/clear-read', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await db
      .delete(notifications)
      .where(
        and(
          eq(notifications.userId, req.user.id),
          eq(notifications.isRead, true)
        )
      );

    res.json({ message: 'Read notifications cleared' });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({ message: 'Failed to clear notifications' });
  }
});

// Send notification (internal API for server-side use)
router.post('/send', async (req: Request, res: Response) => {
  try {
    // This should be called internally by other services, not by users
    // You might want to add additional auth here or move to a service

    const validatedData = insertNotificationSchema.parse(req.body) as typeof notifications.$inferInsert;

    const [notification] = await db
      .insert(notifications)
      .values(validatedData)
      .returning();

    // Emit WebSocket event if you have WebSocket setup
    // io.to(`user:${notification.userId}`).emit('notification', notification);

    res.status(201).json(notification);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid data', errors: error.errors });
    }
    console.error('Error creating notification:', error);
    res.status(500).json({ message: 'Failed to create notification' });
  }
});

export default router;
