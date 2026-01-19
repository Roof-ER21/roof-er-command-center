import { Router } from 'express';
import { db } from '../../db.js';
import { interviews, candidates, onboardingTasks, users, ptoRequests, safetyIncidents } from '../../../shared/schema.js';
import { eq, and, gte, lte, sql, or } from 'drizzle-orm';
import {
  sendInterviewReminderEmail,
  sendOnboardingReminderEmail,
  sendPTOReminder,
} from '../../services/email.js';
import {
  sendSafetyIncidentEscalatedEmail,
} from '../../services/safety-email.js';

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
 * GET /api/cron/pto-reminders
 *
 * Sends reminder emails for approved PTO starting tomorrow
 * Should be run daily (e.g., at 6 PM)
 */
router.get('/pto-reminders', async (req, res) => {
  try {
    console.log('🔔 Running PTO reminder CRON job...');

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tomorrowStr = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD format

    // Find approved PTO requests starting tomorrow
    const upcomingPTO = await db
      .select({
        request: ptoRequests,
        employee: users,
      })
      .from(ptoRequests)
      .innerJoin(users, eq(ptoRequests.employeeId, users.id))
      .where(
        and(
          eq(ptoRequests.status, 'APPROVED'),
          eq(ptoRequests.startDate, tomorrowStr)
        )
      );

    console.log(`📧 Found ${upcomingPTO.length} PTO requests starting tomorrow`);

    const results = {
      total: upcomingPTO.length,
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Send reminders
    for (const { request, employee } of upcomingPTO) {
      try {
        const result = await sendPTOReminder(
          {
            firstName: employee.firstName,
            lastName: employee.lastName,
            email: employee.email,
          },
          {
            id: request.id,
            startDate: request.startDate,
            endDate: request.endDate,
            days: request.days,
            type: request.type,
          }
        );

        if (result.success) {
          results.sent++;
          console.log(`✅ Sent PTO reminder to ${employee.email} for request #${request.id}`);
        } else {
          results.failed++;
          results.errors.push(`Failed to send to ${employee.email}: ${result.error}`);
          console.error(`❌ Failed to send PTO reminder to ${employee.email}:`, result.error);
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Error sending to ${employee.email}: ${error.message}`);
        console.error(`❌ Error sending PTO reminder to ${employee.email}:`, error);
      }
    }

    console.log(`✅ PTO reminder CRON complete: ${results.sent} sent, ${results.failed} failed`);

    res.json({
      success: true,
      message: 'PTO reminders processed',
      ...results,
    });
  } catch (error: any) {
    console.error('❌ PTO reminder CRON failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/cron/safety-escalation
 *
 * Auto-escalate safety incidents based on time thresholds
 * Should be run every hour
 */
router.get('/safety-escalation', async (req, res) => {
  try {
    console.log('🔔 Running safety escalation CRON job...');

    const now = new Date();

    // Find incidents that need escalation
    // Critical: 4 hours, High: 24 hours, Medium: 72 hours
    const criticalThreshold = new Date(now.getTime() - 4 * 60 * 60 * 1000); // 4 hours ago
    const highThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
    const mediumThreshold = new Date(now.getTime() - 72 * 60 * 60 * 1000); // 72 hours ago

    // Find incidents that need escalation (not yet resolved/closed)
    const incidentsToEscalate = await db
      .select()
      .from(safetyIncidents)
      .where(
        and(
          // Not resolved or closed
          sql`${safetyIncidents.status} NOT IN ('resolved', 'closed')`,
          // Either no last escalation or past escalation threshold
          or(
            // Critical incidents - 4 hours
            and(
              eq(safetyIncidents.severity, 'critical'),
              or(
                sql`${safetyIncidents.lastEscalatedAt} IS NULL`,
                lte(safetyIncidents.lastEscalatedAt, criticalThreshold)
              ),
              lte(safetyIncidents.createdAt, criticalThreshold)
            ),
            // High incidents - 24 hours
            and(
              eq(safetyIncidents.severity, 'high'),
              or(
                sql`${safetyIncidents.lastEscalatedAt} IS NULL`,
                lte(safetyIncidents.lastEscalatedAt, highThreshold)
              ),
              lte(safetyIncidents.createdAt, highThreshold)
            ),
            // Medium incidents - 72 hours
            and(
              eq(safetyIncidents.severity, 'medium'),
              or(
                sql`${safetyIncidents.lastEscalatedAt} IS NULL`,
                lte(safetyIncidents.lastEscalatedAt, mediumThreshold)
              ),
              lte(safetyIncidents.createdAt, mediumThreshold)
            )
          )
        )
      );

    console.log(`📧 Found ${incidentsToEscalate.length} incidents to escalate`);

    const results = {
      total: incidentsToEscalate.length,
      escalated: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Escalate incidents
    for (const incident of incidentsToEscalate) {
      try {
        // Update escalation fields
        await db
          .update(safetyIncidents)
          .set({
            lastEscalatedAt: now,
            escalationCount: incident.escalationCount + 1,
            updatedAt: now,
          })
          .where(eq(safetyIncidents.id, incident.id));

        // Get HR admins
        const hrAdmins = await db
          .select()
          .from(users)
          .where(eq(users.role, 'HR_ADMIN'));

        // Determine escalation reason
        let threshold = '';
        if (incident.severity === 'critical') {
          threshold = '4 hours';
        } else if (incident.severity === 'high') {
          threshold = '24 hours';
        } else if (incident.severity === 'medium') {
          threshold = '72 hours';
        }

        const escalationReason = `This ${incident.severity} severity incident has not been addressed within the ${threshold} threshold. Escalation count: ${incident.escalationCount + 1}`;

        // Send escalation emails
        for (const admin of hrAdmins) {
          await sendSafetyIncidentEscalatedEmail(incident, escalationReason, admin);
        }

        results.escalated++;
        console.log(`✅ Escalated incident #${incident.id} (${incident.severity})`);
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Failed to escalate incident #${incident.id}: ${error.message}`);
        console.error(`❌ Error escalating incident #${incident.id}:`, error);
      }
    }

    console.log(`✅ Safety escalation CRON complete: ${results.escalated} escalated, ${results.failed} failed`);

    res.json({
      success: true,
      message: 'Safety escalation processed',
      ...results,
    });
  } catch (error: any) {
    console.error('❌ Safety escalation CRON failed:', error);
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
