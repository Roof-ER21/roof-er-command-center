/**
 * Leaderboard Snapshot Scheduler (Node-Cron Example)
 *
 * This is an EXAMPLE implementation of in-process cron scheduling.
 * To use this:
 *
 * 1. Install node-cron:
 *    npm install node-cron
 *    npm install --save-dev @types/node-cron
 *
 * 2. Import and start in server/index.ts:
 *    import { startLeaderboardCron } from './cron/leaderboard-scheduler.js';
 *    if (process.env.NODE_ENV === 'production') {
 *      startLeaderboardCron();
 *    }
 *
 * 3. Deploy and monitor logs
 *
 * Note: This requires your application to be always running.
 * For Railway deployments, using Railway Cron Jobs is recommended instead.
 */

import cron from 'node-cron';
import { captureLeaderboardSnapshot } from '../../scripts/capture-leaderboard-snapshot.js';

/**
 * Start the leaderboard snapshot cron job
 * Runs daily at midnight (00:00) server time
 */
export function startLeaderboardCron() {
  console.log('⏰ Initializing leaderboard snapshot scheduler...');

  // Validate cron expression
  const schedule = '0 0 * * *'; // Daily at midnight
  if (!cron.validate(schedule)) {
    console.error('❌ Invalid cron schedule:', schedule);
    return;
  }

  // Schedule the task
  const task = cron.schedule(
    schedule,
    async () => {
      console.log('🕐 Running scheduled leaderboard snapshot...');
      const startTime = Date.now();

      try {
        const result = await captureLeaderboardSnapshot();

        if (result.skipped) {
          console.log('ℹ️  Snapshot already exists - skipped');
        } else {
          const duration = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log(`✅ Snapshot completed: ${result.count} records in ${duration}s`);
        }
      } catch (error) {
        console.error('❌ Scheduled snapshot failed:', error);

        // Optional: Send alert notification
        // await sendAlertEmail('Leaderboard snapshot failed', error);
      }
    },
    {
      timezone: 'UTC', // Use UTC to match Railway/server timezone
    }
  );

  console.log('✅ Leaderboard snapshot cron job scheduled');
  console.log(`   Schedule: ${schedule} (UTC)`);
  console.log('   Description: Daily at midnight UTC');

  // Optional: Run immediately on startup (for testing)
  if (process.env.RUN_SNAPSHOT_ON_STARTUP === 'true') {
    console.log('🚀 Running snapshot on startup...');
    captureLeaderboardSnapshot()
      .then((result) => {
        if (result.skipped) {
          console.log('ℹ️  Startup snapshot skipped (already exists)');
        } else {
          console.log(`✅ Startup snapshot completed: ${result.count} records`);
        }
      })
      .catch((error) => {
        console.error('❌ Startup snapshot failed:', error);
      });
  }
}

/**
 * Stop all cron jobs (for graceful shutdown)
 */
export function stopLeaderboardCron() {
  console.log('🛑 Stopping leaderboard snapshot scheduler...');
  cron.getTasks().forEach((task) => {
    task.stop();
  });
  console.log('✅ Scheduler stopped');
}

// Export cron schedules for reference
export const CRON_SCHEDULES = {
  DAILY_MIDNIGHT: '0 0 * * *',
  DAILY_2AM: '0 2 * * *',
  EVERY_6_HOURS: '0 */6 * * *',
  WEEKLY_SUNDAY: '0 0 * * 0',
  MONTHLY_1ST: '0 0 1 * *',
} as const;

// Example: Multiple schedules
export function startAllCronJobs() {
  // Daily snapshot at midnight
  startLeaderboardCron();

  // Example: Weekly leaderboard reset (Sunday midnight)
  // cron.schedule('0 0 * * 0', async () => {
  //   console.log('🔄 Running weekly leaderboard reset...');
  //   await resetWeeklyLeaderboard();
  // });

  // Example: Monthly archive (1st of month at 2 AM)
  // cron.schedule('0 2 1 * *', async () => {
  //   console.log('📦 Archiving old snapshots...');
  //   await archiveOldSnapshots();
  // });
}
