import 'dotenv/config';
import { db, schema } from '../server/db.js';
import { count, eq } from 'drizzle-orm';

async function verify() {
  try {
    console.log('\n✅ DATABASE VERIFICATION');
    console.log('========================\n');

    // Count badges
    const badgeCount = await db.select({ count: count() }).from(schema.badges);
    console.log('badges:               ', badgeCount[0].count);

    // Count player profiles
    const profileCount = await db.select({ count: count() }).from(schema.playerProfiles);
    console.log('player_profiles:      ', profileCount[0].count);

    // Count snapshots
    const snapshotCount = await db.select({ count: count() }).from(schema.leaderboardSnapshots);
    console.log('leaderboard_snapshots:', snapshotCount[0].count);

    // Count active sales reps
    const repCount = await db.select({ count: count() }).from(schema.salesReps);
    console.log('sales_reps:           ', repCount[0].count);

    console.log('');

    // Show some badges
    const badgeList = await db.select({
      name: schema.badges.name,
      category: schema.badges.category,
      rarity: schema.badges.rarity
    }).from(schema.badges).limit(5);

    if (badgeList.length > 0) {
      console.log('🏆 Sample Badges:');
      badgeList.forEach((b) => {
        console.log(`   ${b.name} (${b.category}/${b.rarity})`);
      });
    }

    // Show snapshots if any
    const snapshots = await db.select({
      name: schema.salesReps.name,
      rank: schema.leaderboardSnapshots.rank,
      points: schema.leaderboardSnapshots.points,
      date: schema.leaderboardSnapshots.snapshotDate
    })
    .from(schema.leaderboardSnapshots)
    .innerJoin(schema.salesReps, eq(schema.leaderboardSnapshots.salesRepId, schema.salesReps.id))
    .limit(5);

    if (snapshots.length > 0) {
      console.log('\n📊 Latest Snapshots:');
      snapshots.forEach((s) => {
        console.log(`   #${s.rank} ${s.name} - ${s.points} pts (${s.date})`);
      });
    }

    console.log('\n✅ All tables verified successfully!\n');
    process.exit(0);
  } catch (err: any) {
    console.error('Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

verify();
