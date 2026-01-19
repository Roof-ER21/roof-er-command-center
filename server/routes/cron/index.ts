import { Router } from 'express';
import { db } from '../../db.js';
import { interviews, candidates, onboardingTasks, users } from '../../../shared/schema.js';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import {
  sendInterviewReminderEmail,
  sendOnboardingReminderEmail,
} from '../../services/email.js';

const router = Router();

/**
 * CRON Routes for Automated Email Reminders
 *
 * These endpoints are designed to be called by external CRON services (e.g., Vercel Cron, GitHub Actions)
 * or scheduled tasks in production.
 *
 * Security: In production, these should be protected with API keys or run internally
 */

/**
 * GET /api/cron/interview-reminders
 *
 * Sends reminder emails for interviews scheduled in the next 24 hours
 * Should be run daily (e.g., at 9 AM)
 */
router.get('/interview-reminders', async (req, res) => {
  try {
    console.log('🔔 Running interview reminder CRON job...');

    // Calculate time range: 23-25 hours from now (to catch interviews tomorrow)
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startWindow = new Date(tomorrow);
    startWindow.setHours(0, 0, 0, 0); // Start of tomorrow

    const endWindow = new Date(tomorrow);
    endWindow.setHours(23, 59, 59, 999); // End of tomorrow

    // Find scheduled interviews in the next 24 hours
    const upcomingInterviews = await db
      .select({
        interview: interviews,
        candidate: candidates,
      })
      .from(interviews)
      .innerJoin(candidates, eq(interviews.candidateId, candidates.id))
      .where(
        and(
          eq(interviews.status, 'scheduled'),
          gte(interviews.scheduledAt, startWindow),
          lte(interviews.scheduledAt, endWindow)
        )
      );

    console.log(`📧 Found ${upcomingInterviews.length} interviews to remind about`);

    const results = {
      total: upcomingInterviews.length,
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Send reminders
    for (const { interview, candidate } of upcomingInterviews) {
      try {
        const result = await sendInterviewReminderEmail(candidate, interview);

        if (result.success) {
          results.sent++;
          console.log(`✅ Sent reminder to ${candidate.email} for interview #${interview.id}`);
        } else {
          results.failed++;
          results.errors.push(`Failed to send to ${candidate.email}: ${result.error}`);
          console.error(`❌ Failed to send reminder to ${candidate.email}:`, result.error);
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Error sending to ${candidate.email}: ${error.message}`);
        console.error(`❌ Error sending reminder to ${candidate.email}:`, error);
      }
    }

    console.log(`✅ Interview reminder CRON complete: ${results.sent} sent, ${results.failed} failed`);

    res.json({
      success: true,
      message: 'Interview reminders processed',
      ...results,
    });
  } catch (error: any) {
    console.error('❌ Interview reminder CRON failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/cron/onboarding-reminders
 *
 * Sends reminder emails for overdue onboarding tasks
 * Should be run daily (e.g., at 10 AM)
 */
router.get('/onboarding-reminders', async (req, res) => {
  try {
    console.log('🔔 Running onboarding reminder CRON job...');

    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    // Find employees with overdue or due-today onboarding tasks
    const tasksQuery = await db
      .select({
        task: onboardingTasks,
        employee: users,
      })
      .from(onboardingTasks)
      .innerJoin(users, eq(onboardingTasks.employeeId, users.id))
      .where(
        and(
          lte(onboardingTasks.dueDate, today.toISOString().split('T')[0]),
          eq(onboardingTasks.status, 'pending')
        )
      );

    // Group tasks by employee
    const tasksByEmployee = new Map<number, typeof tasksQuery>();

    for (const row of tasksQuery) {
      const employeeId = row.employee.id;
      if (!tasksByEmployee.has(employeeId)) {
        tasksByEmployee.set(employeeId, []);
      }
      tasksByEmployee.get(employeeId)!.push(row);
    }

    console.log(`📧 Found ${tasksByEmployee.size} employees with pending tasks`);

    const results = {
      total: tasksByEmployee.size,
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Send reminders
    for (const [employeeId, employeeTasks] of tasksByEmployee.entries()) {
      const employee = employeeTasks[0].employee;
      const tasks = employeeTasks.map(et => et.task);

      try {
        const result = await sendOnboardingReminderEmail(employee, tasks);

        if (result.success) {
          results.sent++;
          console.log(`✅ Sent onboarding reminder to ${employee.email} (${tasks.length} tasks)`);
        } else {
          results.failed++;
          results.errors.push(`Failed to send to ${employee.email}: ${result.error}`);
          console.error(`❌ Failed to send onboarding reminder to ${employee.email}:`, result.error);
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Error sending to ${employee.email}: ${error.message}`);
        console.error(`❌ Error sending onboarding reminder to ${employee.email}:`, error);
      }
    }

    console.log(`✅ Onboarding reminder CRON complete: ${results.sent} sent, ${results.failed} failed`);

    res.json({
      success: true,
      message: 'Onboarding reminders processed',
      ...results,
    });
  } catch (error: any) {
    console.error('❌ Onboarding reminder CRON failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/cron/health
 *
 * Health check endpoint for CRON monitoring
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'cron-jobs',
  });
});

export default router;
