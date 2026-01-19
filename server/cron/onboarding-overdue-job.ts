import cron from 'node-cron';
import { db } from '../db.js';
import { onboardingTasks, users, notifications, emailNotifications } from '../../shared/schema.js';
import { eq, and, lt } from 'drizzle-orm';
import { sendOnboardingTaskOverdueEmail } from '../services/email.js';

/**
 * Onboarding Task Overdue Notification Job
 *
 * Runs daily at 9:00 AM to check for overdue onboarding tasks.
 * Sends in-app notifications and emails to employees with overdue tasks.
 */

interface OverdueTaskResult {
  tasks: typeof onboardingTasks.$inferSelect;
  users: typeof users.$inferSelect;
}

/**
 * Check if a notification was sent in the last 24 hours
 */
async function wasRecentNotificationSent(
  taskId: number,
  userId: number,
  type: string
): Promise<boolean> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const recentNotification = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.type, type as any),
        eq(notifications.metadata, JSON.stringify({ taskId }))
      )
    )
    .limit(1);

  if (recentNotification.length > 0) {
    const notificationDate = new Date(recentNotification[0].createdAt);
    return notificationDate > twentyFourHoursAgo;
  }

  return false;
}

/**
 * Calculate days overdue
 */
function calculateDaysOverdue(dueDate: string): number {
  const due = new Date(dueDate);
  const now = new Date();
  const diffTime = now.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

/**
 * Main function to check overdue tasks
 */
export async function checkOverdueTasks(): Promise<void> {
  console.log('🔔 [CRON] Starting overdue onboarding task check...');

  try {
    const now = new Date();

    // Find all pending onboarding tasks where dueDate < now
    const overdueTasks = await db
      .select({
        tasks: onboardingTasks,
        users: users,
      })
      .from(onboardingTasks)
      .innerJoin(users, eq(onboardingTasks.employeeId, users.id))
      .where(
        and(
          eq(onboardingTasks.status, 'pending'),
          lt(onboardingTasks.dueDate, now.toISOString())
        )
      ) as OverdueTaskResult[];

    console.log(`📊 Found ${overdueTasks.length} overdue tasks`);

    let notificationsSent = 0;
    let emailsSent = 0;

    for (const { tasks: task, users: employee } of overdueTasks) {
      // Check if notification was sent in last 24 hours
      const recentNotification = await wasRecentNotificationSent(
        task.id,
        employee.id,
        'task_overdue'
      );

      if (recentNotification) {
        console.log(
          `⏭️  Skipping task ${task.id} - notification sent within 24 hours`
        );
        continue;
      }

      const daysOverdue = calculateDaysOverdue(task.dueDate!);

      // Create in-app notification
      try {
        await db.insert(notifications).values({
          userId: employee.id,
          type: 'task_overdue',
          title: 'Overdue Onboarding Task',
          message: `Your task "${task.taskName}" is ${daysOverdue} day${
            daysOverdue !== 1 ? 's' : ''
          } overdue. Please complete it as soon as possible.`,
          link: '/dashboard?tab=onboarding',
          metadata: JSON.stringify({ taskId: task.id, daysOverdue }),
        });

        notificationsSent++;
        console.log(`✅ In-app notification sent to ${employee.email}`);
      } catch (error) {
        console.error(
          `❌ Failed to create notification for employee ${employee.id}:`,
          error
        );
      }

      // Send email
      try {
        await sendOnboardingTaskOverdueEmail(employee, task, daysOverdue);
        emailsSent++;
        console.log(`📧 Email sent to ${employee.email}`);
      } catch (error) {
        console.error(
          `❌ Failed to send email to ${employee.email}:`,
          error
        );
      }
    }

    console.log(
      `✅ [CRON] Overdue task check complete: ${notificationsSent} notifications, ${emailsSent} emails sent`
    );
  } catch (error) {
    console.error('❌ [CRON] Error checking overdue tasks:', error);
  }
}

/**
 * Schedule the cron job to run daily at 9:00 AM
 */
export function scheduleOverdueTaskCheck(): void {
  // Run daily at 9:00 AM
  // Cron expression: "0 9 * * *" (minute hour day month dayOfWeek)
  cron.schedule('0 9 * * *', async () => {
    await checkOverdueTasks();
  });

  console.log('⏰ Scheduled overdue onboarding task check (daily at 9:00 AM)');
}

/**
 * Run check immediately (useful for testing or manual triggers)
 */
export async function runOverdueTaskCheckNow(): Promise<void> {
  console.log('🚀 Running overdue task check immediately...');
  await checkOverdueTasks();
}
