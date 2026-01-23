import { db } from '../db.js';
import { ptoRequests, users, notifications } from '../../shared/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { sendPTOReminder, sendPTOReminderToManagers } from './email.js';

/**
 * PTO Notification Service
 *
 * Handles in-app and email notifications for PTO requests:
 * - Notify approvers when new PTO requests are submitted
 * - Notify employees when their requests are approved/denied
 * - Send reminders to employees and managers before PTO starts (30-day, 7-day, 1-day)
 */

interface PtoRequestWithEmployee {
  request: typeof ptoRequests.$inferSelect;
  employee: typeof users.$inferSelect;
}

/**
 * Notify all PTO approvers (managers/HR) of a new PTO request
 */
export async function notifyApproversOfNewRequest(
  request: typeof ptoRequests.$inferSelect,
  approverIds: number[]
): Promise<void> {
  console.log(`📧 Notifying ${approverIds.length} approvers of PTO request #${request.id}`);

  // Get employee details
  const [employee] = await db
    .select()
    .from(users)
    .where(eq(users.id, request.employeeId))
    .limit(1);

  if (!employee) {
    console.error(`❌ Employee not found for PTO request #${request.id}`);
    return;
  }

  // Create in-app notifications for each approver
  for (const approverId of approverIds) {
    try {
      await db.insert(notifications).values({
        userId: approverId,
        type: 'pto_request',
        title: 'New PTO Request',
        message: `${employee.firstName} ${employee.lastName} has requested ${request.days} day${request.days > 1 ? 's' : ''} of ${request.type} starting ${new Date(request.startDate).toLocaleDateString()}.`,
        link: '/dashboard?tab=hr&view=pto',
        metadata: JSON.stringify({
          ptoRequestId: request.id,
          employeeId: employee.id,
          startDate: request.startDate,
          endDate: request.endDate,
        }),
      });

      console.log(`✅ In-app notification sent to approver #${approverId}`);
    } catch (error) {
      console.error(`❌ Failed to create notification for approver #${approverId}:`, error);
    }
  }
}

/**
 * Notify employee of PTO request decision (approved or denied)
 */
export async function notifyEmployeeOfDecision(
  request: typeof ptoRequests.$inferSelect,
  decision: 'approved' | 'denied',
  notes?: string
): Promise<void> {
  console.log(`📧 Notifying employee #${request.employeeId} of ${decision} PTO request #${request.id}`);

  const notificationType = decision === 'approved' ? 'pto_approved' : 'pto_denied';
  const title = decision === 'approved' ? 'PTO Request Approved' : 'PTO Request Denied';
  const emoji = decision === 'approved' ? '✅' : '❌';

  let message = `${emoji} Your PTO request for ${request.days} day${request.days > 1 ? 's' : ''} starting ${new Date(request.startDate).toLocaleDateString()} has been ${decision}.`;

  if (notes) {
    message += ` Note: ${notes}`;
  }

  try {
    await db.insert(notifications).values({
      userId: request.employeeId,
      type: notificationType,
      title,
      message,
      link: '/dashboard?tab=pto',
      metadata: JSON.stringify({
        ptoRequestId: request.id,
        decision,
        startDate: request.startDate,
        endDate: request.endDate,
        notes,
      }),
    });

    console.log(`✅ In-app notification sent to employee #${request.employeeId}`);
  } catch (error) {
    console.error(`❌ Failed to create notification for employee #${request.employeeId}:`, error);
  }
}

/**
 * Send PTO reminders for upcoming time off
 * Checks for approved PTO requests starting in exactly 30, 7, or 1 day(s)
 * Sends emails and creates in-app notifications for employees and managers
 */
export async function sendPtoReminders(): Promise<{
  sent30Day: number;
  sent7Day: number;
  sent1Day: number;
  errors: number;
}> {
  console.log('🔔 [PTO REMINDERS] Starting PTO reminder job...');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate target dates for each reminder window
  const date30Days = new Date(today);
  date30Days.setDate(date30Days.getDate() + 30);
  const date30DaysStr = date30Days.toISOString().split('T')[0];

  const date7Days = new Date(today);
  date7Days.setDate(date7Days.getDate() + 7);
  const date7DaysStr = date7Days.toISOString().split('T')[0];

  const date1Day = new Date(today);
  date1Day.setDate(date1Day.getDate() + 1);
  const date1DayStr = date1Day.toISOString().split('T')[0];

  console.log(`📅 Checking for PTO starting on:`);
  console.log(`   - 30 days: ${date30DaysStr}`);
  console.log(`   - 7 days: ${date7DaysStr}`);
  console.log(`   - 1 day: ${date1DayStr}`);

  let sent30Day = 0;
  let sent7Day = 0;
  let sent1Day = 0;
  let errors = 0;

  // Process each reminder window
  for (const { daysUntil, targetDate } of [
    { daysUntil: 30, targetDate: date30DaysStr },
    { daysUntil: 7, targetDate: date7DaysStr },
    { daysUntil: 1, targetDate: date1DayStr },
  ]) {
    try {
      // Find all approved PTO requests starting on target date
      const requestsWithEmployees = await db
        .select({
          request: ptoRequests,
          employee: users,
        })
        .from(ptoRequests)
        .innerJoin(users, eq(ptoRequests.employeeId, users.id))
        .where(
          and(
            eq(ptoRequests.status, 'APPROVED'),
            eq(ptoRequests.startDate, targetDate)
          )
        ) as PtoRequestWithEmployee[];

      console.log(`📊 Found ${requestsWithEmployees.length} PTO request(s) starting in ${daysUntil} day(s)`);

      for (const { request, employee } of requestsWithEmployees) {
        try {
          // Send email to employee
          await sendPTOReminder(
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
            },
            daysUntil
          );

          // Create in-app notification for employee
          await db.insert(notifications).values({
            userId: employee.id,
            type: 'pto_reminder',
            title: `PTO Reminder: ${daysUntil} Day${daysUntil !== 1 ? 's' : ''} Away`,
            message: `Your ${request.type} time off starts in ${daysUntil} day${daysUntil !== 1 ? 's' : ''} (${new Date(request.startDate).toLocaleDateString()}).`,
            link: '/dashboard?tab=pto',
            metadata: JSON.stringify({
              ptoRequestId: request.id,
              daysUntil,
              startDate: request.startDate,
            }),
          });

          // Get all managers/HR admins to notify
          const managers = await db
            .select()
            .from(users)
            .where(
              and(
                eq(users.isActive, true),
                sql`UPPER(${users.role}) IN ('SYSTEM_ADMIN', 'HR_ADMIN', 'GENERAL_MANAGER', 'MANAGER', 'TERRITORY_MANAGER')`
              )
            );

          // Send manager reminders
          for (const manager of managers) {
            await sendPTOReminderToManagers(
              {
                firstName: employee.firstName,
                lastName: employee.lastName,
                email: employee.email,
                position: employee.position,
                department: employee.department,
              },
              {
                id: request.id,
                startDate: request.startDate,
                endDate: request.endDate,
                days: request.days,
                type: request.type,
                reason: request.reason,
              },
              {
                firstName: manager.firstName,
                lastName: manager.lastName,
                email: manager.email,
              },
              daysUntil
            );
          }

          if (daysUntil === 30) sent30Day++;
          else if (daysUntil === 7) sent7Day++;
          else if (daysUntil === 1) sent1Day++;

          console.log(
            `✅ Sent ${daysUntil}-day reminder to ${employee.email} and ${managers.length} manager(s)`
          );
        } catch (error) {
          errors++;
          console.error(
            `❌ Failed to send ${daysUntil}-day reminder for PTO request #${request.id}:`,
            error
          );
        }
      }
    } catch (error) {
      console.error(`❌ Error processing ${daysUntil}-day reminders:`, error);
      errors++;
    }
  }

  console.log(
    `✅ [PTO REMINDERS] Job complete: 30-day: ${sent30Day}, 7-day: ${sent7Day}, 1-day: ${sent1Day}, Errors: ${errors}`
  );

  return { sent30Day, sent7Day, sent1Day, errors };
}
