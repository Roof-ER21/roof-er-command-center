import cron from 'node-cron';
import { syncPtoToCalendar } from '../services/pto-calendar.js';

/**
 * PTO Calendar Sync Cron Job
 *
 * Schedule: Every 5 minutes
 * Cron Expression: star-slash-5 star star star star
 * Purpose: Sync approved PTO requests without calendar event IDs
 *
 * This job:
 * 1. Finds all APPROVED PTO requests without googleEventId
 * 2. Creates calendar events for each
 * 3. Updates records with event IDs
 * 4. Logs sync results
 */

let isRunning = false;

async function runPtoCalendarSync() {
  // Prevent overlapping executions
  if (isRunning) {
    console.log('⏭️  PTO Calendar Sync already running, skipping this execution');
    return;
  }

  isRunning = true;
  const startTime = Date.now();

  try {
    console.log(`
┌─────────────────────────────────────────┐
│  🗓️  PTO Calendar Sync Job Started       │
│  ${new Date().toISOString()}             │
└─────────────────────────────────────────┘
    `);

    const result = await syncPtoToCalendar();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`
┌─────────────────────────────────────────┐
│  ✅ PTO Calendar Sync Job Complete      │
│  Duration: ${duration}s                   │
│  Synced: ${result.synced}                 │
│  Errors: ${result.errors}                 │
│  ${new Date().toISOString()}             │
└─────────────────────────────────────────┘
    `);
  } catch (error) {
    console.error('❌ PTO Calendar Sync Job failed:', error);
  } finally {
    isRunning = false;
  }
}

/**
 * Start the PTO calendar sync scheduler
 */
export function startPtoCalendarSync() {
  // Schedule: Every 5 minutes
  const schedule = '*/5 * * * *';

  cron.schedule(schedule, async () => {
    await runPtoCalendarSync();
  });

  console.log(`
✅ PTO Calendar Sync Scheduler Started
   Schedule: ${schedule} (every 5 minutes)
   Next run: ${new Date(Date.now() + 5 * 60 * 1000).toISOString()}
  `);

  // Run immediately on startup to catch any missed syncs
  setTimeout(() => {
    console.log('🚀 Running initial PTO calendar sync...');
    runPtoCalendarSync();
  }, 10000); // Wait 10 seconds after server start
}

/**
 * Run sync manually (for testing or manual triggers)
 */
export async function runManualPtoCalendarSync(): Promise<{ synced: number; errors: number }> {
  console.log('🔧 Manual PTO calendar sync triggered');
  return await syncPtoToCalendar();
}
