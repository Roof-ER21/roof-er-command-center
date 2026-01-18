import { db } from "../server/db.js";
import { sql } from "drizzle-orm";

async function createCertificatesTable() {
  try {
    console.log("Creating training_certificates table...");

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "training_certificates" (
        "id" serial PRIMARY KEY NOT NULL,
        "certificate_id" text NOT NULL,
        "user_id" integer NOT NULL,
        "certificate_type" text NOT NULL,
        "title" text NOT NULL,
        "description" text,
        "module_id" text,
        "score" integer,
        "issued_at" timestamp DEFAULT now() NOT NULL,
        "expires_at" timestamp,
        "metadata" jsonb DEFAULT '{}'::jsonb,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "training_certificates_certificate_id_unique" UNIQUE("certificate_id")
      );
    `);

    console.log("Adding foreign key constraint...");
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'training_certificates_user_id_users_id_fk'
        ) THEN
          ALTER TABLE "training_certificates"
          ADD CONSTRAINT "training_certificates_user_id_users_id_fk"
          FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
        END IF;
      END $$;
    `);

    console.log("✓ Training certificates table created successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

createCertificatesTable();
