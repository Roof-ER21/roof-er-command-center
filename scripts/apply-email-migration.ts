import '../server/config/env.js';
import { db } from '../server/db.js';
import { sql } from 'drizzle-orm';

async function applyMigration() {
  try {
    console.log('🔧 Creating email_notifications table...');

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "email_notifications" (
        "id" serial PRIMARY KEY NOT NULL,
        "recipient_email" text NOT NULL,
        "recipient_name" text,
        "subject" text NOT NULL,
        "email_type" text NOT NULL,
        "status" text DEFAULT 'pending' NOT NULL,
        "sent_at" timestamp,
        "error_message" text,
        "retry_count" integer DEFAULT 0,
        "metadata" jsonb,
        "created_at" timestamp DEFAULT now() NOT NULL
      )
    `);

    console.log('✅ email_notifications table created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

applyMigration();
