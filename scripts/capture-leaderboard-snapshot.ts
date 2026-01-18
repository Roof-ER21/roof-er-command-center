import 'dotenv/config';
import { db, schema } from '../server/db.js';
import { eq, desc, and } from 'drizzle-orm';

/**
 * Capture Daily Leaderboard Snapshot
 *
 * This script creates a daily snapshot of the leaderboard for historical tracking.
 * It captures each sales rep's rank, points, and performance metrics.
 *
 * Features:
 * - Idempotent: skips if snapshot already exists for today
 * - Calculates points based on performance
 * - Ranks sales reps by monthly signups
 * - Only processes active sales reps
 *
 * Usage:
 *   npm run leaderboard:snapshot
 *
 * Scheduling:
 *   - Railway: Use Railway Cron Jobs (runs at 00:00 UTC daily)
 *   - System cron: 0 0 * * * cd /path/to/project && npm run leaderboard:snapshot
 */

// Points calculation formula
function calculatePoints(monthlySignups: number, rank: number): number {
  const signupPoints = Number(monthlySignups) * 100; // 100 points per signup

  // Rank bonus (top performers get extra points)
  let rankBonus = 0;
  if (rank === 1) rankBonus = 500;
  else if (rank === 2) rankBonus = 300;
  else if (rank === 3) rankBonus = 200;
  else if (rank <= 5) rankBonus = 100;
  else if (rank <= 10) rankBonus = 50;

  return Math.round(signupPoints + rankBonus);
}

async function captureLeaderboardSnapshot() {
  const startTime = Date.now();
  console.log('📸 Starting leaderboard snapshot capture...\n');

  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    console.log(`📅 Snapshot date: ${today}`);

    // Check if snapshot already exists for today
    console.log('🔍 Checking for existing snapshot...');
    const existingSnapshot = await db
      .select()
      .from(schema.leaderboardSnapshots)
      .where(eq(schema.leaderboardSnapshots.snapshotDate, today))
      .limit(1);

    if (existingSnapshot.length > 0) {
      console.log('✅ Snapshot already exists for today - skipping');
      console.log(`   Found ${existingSnapshot.length} existing snapshot(s)`);
      return { skipped: true, date: today, count: 0 };
    }

    console.log('✨ No existing snapshot found - proceeding...\n');

    // Get all active sales reps sorted by monthly signups (descending)
    console.log('👥 Fetching active sales reps...');
    const salesReps = await db
      .select()
      .from(schema.salesReps)
      .where(eq(schema.salesReps.isActive, true))
      .orderBy(desc(schema.salesReps.monthlySignups));

    console.log(`✅ Found ${salesReps.length} active sales reps`);

    if (salesReps.length === 0) {
      console.log('⚠️  No active sales reps found - nothing to snapshot');
      return { skipped: true, date: today, count: 0 };
    }

    // Calculate current season ID (e.g., "2026-Q1" or "2026-01" for monthly)
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 1-12
    const quarter = Math.ceil(month / 3);
    const seasonId = `${year}-Q${quarter}`; // Quarterly season

    console.log(`🏆 Current season: ${seasonId}\n`);

    // Prepare snapshot records
    console.log('📊 Calculating ranks and points...');
    const snapshots = salesReps.map((rep, index) => {
      const rank = index + 1; // 1-based ranking
      const monthlySignups = Number(rep.monthlySignups);
      const points = calculatePoints(monthlySignups, rank);

      return {
        salesRepId: rep.id,
        snapshotDate: today,
        rank,
        points,
        monthlySignups: rep.monthlySignups,
        seasonId,
      };
    });

    // Insert all snapshots in a single transaction
    console.log(`💾 Inserting ${snapshots.length} snapshot records...`);
    const insertedSnapshots = await db
      .insert(schema.leaderboardSnapshots)
      .values(snapshots)
      .returning();

    console.log(`✅ Successfully inserted ${insertedSnapshots.length} snapshots\n`);

    // Log summary statistics
    console.log('📈 Snapshot Summary:');
    console.log('='.repeat(60));
    console.log(`   Date:           ${today}`);
    console.log(`   Season:         ${seasonId}`);
    console.log(`   Total Reps:     ${insertedSnapshots.length}`);
    console.log(`   Top 3 Ranks:`);

    if (insertedSnapshots.length > 0) {
      // Get top 3 with rep details
      const top3 = await db
        .select({
          rank: schema.leaderboardSnapshots.rank,
          name: schema.salesReps.name,
          team: schema.salesReps.team,
          signups: schema.leaderboardSnapshots.monthlySignups,
          points: schema.leaderboardSnapshots.points,
        })
        .from(schema.leaderboardSnapshots)
        .innerJoin(
          schema.salesReps,
          eq(schema.leaderboardSnapshots.salesRepId, schema.salesReps.id)
        )
        .where(
          and(
            eq(schema.leaderboardSnapshots.snapshotDate, today),
            eq(schema.leaderboardSnapshots.rank, 1)
          )
        )
        .limit(3);

      // Show top performer
      if (top3.length > 0) {
        const leader = top3[0];
        console.log(`   #1: ${leader.name} (${leader.team}) - ${leader.signups} signups, ${leader.points} pts`);
      }
    }

    console.log('='.repeat(60));

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n⏱️  Completed in ${duration}s`);

    return {
      skipped: false,
      date: today,
      seasonId,
      count: insertedSnapshots.length,
      duration,
    };

  } catch (error) {
    console.error('\n❌ Error capturing leaderboard snapshot:', error);
    throw error;
  }
}

// Run the snapshot capture
if (import.meta.url === `file://${process.argv[1]}`) {
  captureLeaderboardSnapshot()
    .then((result) => {
      if (result.skipped) {
        console.log('\n✅ Snapshot check completed (already exists)');
      } else {
        console.log(`\n✅ Snapshot captured successfully (${result.count} records)`);
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Snapshot capture failed:', error);
      process.exit(1);
    });
}

export { captureLeaderboardSnapshot };
