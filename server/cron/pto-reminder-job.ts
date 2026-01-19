import cron from 'node-cron';
import { sendPtoReminders } from '../services/pto-notifications.js';

/**
 * PTO Reminder Cron Job
 *
 * Runs daily at 9:00 PM EST (21:00) to check for upcoming PTO and send reminders.
 *
 * Three reminder windows:
 * - 30-DAY NOTICE: PTO starts exactly 30 days from today
 * - 7-DAY REMINDER: PTO starts exactly 7 days from today
 * - 1-DAY REMINDER: PTO starts tomorrow
 *
 * For each reminder:
 * - Sends email to employee
 * - Creates in-app notification for employee
 * - Sends email to all managers/HR admins
 * - Includes coverage planning suggestions for managers
 */

/**
 * Main function to check and send PTO reminders
 */
export async function checkAndSendPtoReminders(): Promise<void> {
  console.log('🔔 [CRON] Starting PTO reminder check (daily at 9:00 PM EST)...');

  try {
    const results = await sendPtoReminders();

    console.log(
      `✅ [CRON] PTO reminder check complete: 30-day: ${results.sent30Day}, 7-day: ${results.sent7Day}, 1-day: ${results.sent1Day}, Errors: ${results.errors}`
    );
  } catch (error) {
    console.error('❌ [CRON] Error running PTO reminder job:', error);
  }
}

/**
 * Schedule the cron job to run daily at 9:00 PM EST (21:00)
 * Cron expression: "0 21 * * *" (minute hour day month dayOfWeek)
 */
export function schedulePtoReminderJob(): void {
  // Run daily at 9:00 PM EST
  cron.schedule('0 21 * * *', async () => {
    await checkAndSendPtoReminders();
  });

  console.log('⏰ Scheduled PTO reminder job (daily at 9:00 PM EST)');
}

/**
 * Run check immediately (useful for testing or manual triggers)
 */
export async function runPtoReminderJobNow(): Promise<{ sent30Day: number; sent7Day: number; sent1Day: number; errors: number }> {
  console.log('🚀 Running PTO reminder job immediately...');
  const results = await sendPtoReminders();
  console.log('✅ PTO reminder job complete');
  return results;
}
