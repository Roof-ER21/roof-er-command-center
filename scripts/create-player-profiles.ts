#!/usr/bin/env tsx
/**
 * Bulk Player Profile Creation Script
 *
 * Creates player profiles for all existing sales reps that don't have one.
 * This backfills the playerProfiles table to enable gamification features.
 *
 * Usage:
 *   npm run tsx scripts/create-player-profiles.ts
 *   or
 *   tsx scripts/create-player-profiles.ts
 */

import 'dotenv/config';
import { db } from '../server/db.js';
import { salesReps, playerProfiles } from '../shared/schema.js';
import { eq, notInArray } from 'drizzle-orm';

async function createPlayerProfiles() {
  console.log('🎮 Starting Player Profile Creation Script...\n');

  try {
    // Get all active sales reps
    const allReps = await db.select({
      id: salesReps.id,
      name: salesReps.name,
    })
    .from(salesReps)
    .where(eq(salesReps.isActive, true));

    console.log(`📊 Found ${allReps.length} active sales reps`);

    // Get all existing player profile sales rep IDs
    const existingProfiles = await db.select({
      salesRepId: playerProfiles.salesRepId,
    })
    .from(playerProfiles);

    const existingRepIds = new Set(existingProfiles.map(p => p.salesRepId));
    console.log(`✅ ${existingProfiles.length} sales reps already have player profiles`);

    // Filter to reps without profiles
    const repsNeedingProfiles = allReps.filter(rep => !existingRepIds.has(rep.id));

    if (repsNeedingProfiles.length === 0) {
      console.log('\n✨ All sales reps already have player profiles! Nothing to do.');
      return;
    }

    console.log(`\n🔧 Creating profiles for ${repsNeedingProfiles.length} sales reps...\n`);

    // Create player profiles in bulk
    const today = new Date().toISOString().split('T')[0];
    const profilesData = repsNeedingProfiles.map(rep => ({
      salesRepId: rep.id,
      playerLevel: 1,
      totalCareerPoints: 0,
      seasonPoints: 0,
      monthlyPoints: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: today,
    }));

    const createdProfiles = await db.insert(playerProfiles)
      .values(profilesData)
      .returning();

    console.log(`✅ Successfully created ${createdProfiles.length} player profiles:\n`);

    // Display created profiles
    for (const rep of repsNeedingProfiles) {
      const profile = createdProfiles.find(p => p.salesRepId === rep.id);
      if (profile) {
        console.log(`   🎮 ${rep.name} (ID: ${rep.id}) -> Profile ID: ${profile.id}`);
      }
    }

    // Final summary
    console.log('\n📈 Summary:');
    console.log(`   Total Sales Reps: ${allReps.length}`);
    console.log(`   Profiles Already Existed: ${existingProfiles.length}`);
    console.log(`   Profiles Created: ${createdProfiles.length}`);
    console.log(`   Total Profiles Now: ${existingProfiles.length + createdProfiles.length}`);

    console.log('\n✨ Player profile creation complete!\n');
  } catch (error) {
    console.error('❌ Error creating player profiles:', error);
    throw error;
  }
}

// Run the script
createPlayerProfiles()
  .then(() => {
    console.log('🎉 Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
