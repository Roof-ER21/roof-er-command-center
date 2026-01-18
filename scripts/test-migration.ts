#!/usr/bin/env tsx

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

async function testMigration() {
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.log('\n💡 Add DATABASE_URL to your .env file:');
    console.log('   DATABASE_URL=postgresql://user:password@host:port/database\n');
    process.exit(1);
  }

  console.log('🔍 Testing database connection and migration readiness...\n');

  const client = postgres(DATABASE_URL, { max: 1 });
  const db = drizzle(client);

  try {
    // Test 1: Connection
    console.log('1️⃣  Testing database connection...');
    await client`SELECT 1 as test`;
    console.log('   ✅ Connection successful\n');

    // Test 2: Check if tables already exist
    console.log('2️⃣  Checking for existing gamification tables...');
    const { rows: existingTables } = await client`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN (
          'badges',
          'player_profiles',
          'player_badges',
          'leaderboard_snapshots'
        )
    `;

    if (existingTables.length > 0) {
      console.log('   ⚠️  Warning: Some tables already exist:');
      existingTables.forEach((t: any) => {
        console.log(`      - ${t.table_name}`);
      });
      console.log('\n   Migration may fail or skip existing tables.\n');
    } else {
      console.log('   ✅ No conflicting tables found\n');
    }

    // Test 3: Check sales_reps table exists (dependency)
    console.log('3️⃣  Checking for required tables...');
    const { rows: salesRepsTable } = await client`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'sales_reps'
    `;

    if (salesRepsTable.length === 0) {
      console.log('   ⚠️  Warning: sales_reps table not found');
      console.log('      This is required for foreign key relationships.\n');
    } else {
      console.log('   ✅ Required tables found (sales_reps)\n');
    }

    // Test 4: Check PostgreSQL version
    console.log('4️⃣  Checking PostgreSQL version...');
    const { rows: versionInfo } = await client`SELECT version()`;
    const version = versionInfo[0].version;
    console.log(`   ℹ️  ${version}\n`);

    // Test 5: Check permissions
    console.log('5️⃣  Testing CREATE TABLE permissions...');
    try {
      await client`
        CREATE TABLE IF NOT EXISTS _migration_test (
          id serial PRIMARY KEY
        )
      `;
      await client`DROP TABLE IF EXISTS _migration_test`;
      console.log('   ✅ CREATE TABLE permission verified\n');
    } catch (error: any) {
      console.log('   ❌ Permission denied:', error.message);
      console.log('\n   You may need to grant CREATE privileges:\n');
      console.log('   GRANT CREATE ON SCHEMA public TO your_user;\n');
      process.exit(1);
    }

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Migration Test Complete\n');
    console.log('Database is ready for migration!\n');
    console.log('Next steps:');
    console.log('  1. Run: npm run db:migrate');
    console.log('  2. Verify: npm run db:studio');
    console.log('  3. Seed badges (optional)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

testMigration();
