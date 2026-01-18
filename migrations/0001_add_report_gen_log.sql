-- Migration: Add report_gen_log table for tracking PDF report generation
-- Created: 2025-01-18

CREATE TABLE IF NOT EXISTS "report_gen_log" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "report_type" VARCHAR(50) NOT NULL,
  "customer_name" VARCHAR(255) NOT NULL,
  "property_address" TEXT NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  CONSTRAINT "report_gen_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- Create index for efficient querying by user
CREATE INDEX IF NOT EXISTS "idx_report_gen_log_user_id" ON "report_gen_log" ("user_id");

-- Create index for efficient querying by report type
CREATE INDEX IF NOT EXISTS "idx_report_gen_log_report_type" ON "report_gen_log" ("report_type");

-- Create index for date-based queries
CREATE INDEX IF NOT EXISTS "idx_report_gen_log_created_at" ON "report_gen_log" ("created_at" DESC);
