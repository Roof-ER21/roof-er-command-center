import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigration() {
  const sql = postgres(process.env.DATABASE_URL!);

  try {
    console.log('🚀 Applying report_gen_log migration...');

    const migrationPath = path.join(__dirname, '../migrations/0001_add_report_gen_log.sql');
    const migration = fs.readFileSync(migrationPath, 'utf-8');

    await sql.unsafe(migration);

    console.log('✅ Migration applied successfully');
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log('ℹ️  Table already exists, skipping migration');
    } else {
      console.error('❌ Migration error:', error.message);
      process.exit(1);
    }
  } finally {
    await sql.end();
  }
}

runMigration();
