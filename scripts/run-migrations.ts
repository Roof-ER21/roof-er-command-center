#!/usr/bin/env tsx

import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigrations() {
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  console.log('🚀 Starting database migration...\n');

  // Create postgres connection for migrations
  const migrationClient = postgres(DATABASE_URL, {
    max: 1,
    onnotice: () => {}, // Suppress notices during migration
  });

  const db = drizzle(migrationClient);

  try {
    console.log('📦 Running migrations from ./migrations folder...');

    await migrate(db, {
      migrationsFolder: join(__dirname, '..', 'migrations'),
    });

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📊 New tables created:');
    console.log('   - leaderboard_snapshots (daily rank history)');
    console.log('   - badges (badge definitions)');
    console.log('   - player_profiles (gamification stats)');
    console.log('   - player_badges (earned badges junction table)');
    console.log('\n🎉 Database schema is now up to date!\n');

  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error);
    process.exit(1);
  } finally {
    await migrationClient.end();
  }
}

runMigrations();
