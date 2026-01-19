-- Migration: Add Safety Incidents Table
-- Created: 2026-01-19

CREATE TABLE IF NOT EXISTS "safety_incidents" (
  "id" SERIAL PRIMARY KEY,
  "reported_by" INTEGER NOT NULL REFERENCES "users"("id"),
  "assigned_to" INTEGER REFERENCES "users"("id"),
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "location" TEXT,
  "incident_date" TIMESTAMP NOT NULL,
  "severity" TEXT NOT NULL CHECK ("severity" IN ('low', 'medium', 'high', 'critical')),
  "status" TEXT NOT NULL DEFAULT 'reported' CHECK ("status" IN ('reported', 'investigating', 'resolved', 'closed')),
  "category" TEXT CHECK ("category" IN ('injury', 'near_miss', 'property_damage', 'environmental', 'other')),
  "injury_type" TEXT,
  "witnesses" TEXT,
  "actions_taken" TEXT,
  "preventive_measures" TEXT,
  "resolved_at" TIMESTAMP,
  "resolved_by" INTEGER REFERENCES "users"("id"),
  "last_escalated_at" TIMESTAMP,
  "escalation_count" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS "idx_safety_incidents_severity" ON "safety_incidents"("severity");
CREATE INDEX IF NOT EXISTS "idx_safety_incidents_status" ON "safety_incidents"("status");
CREATE INDEX IF NOT EXISTS "idx_safety_incidents_reported_by" ON "safety_incidents"("reported_by");
CREATE INDEX IF NOT EXISTS "idx_safety_incidents_assigned_to" ON "safety_incidents"("assigned_to");
CREATE INDEX IF NOT EXISTS "idx_safety_incidents_created_at" ON "safety_incidents"("created_at");
CREATE INDEX IF NOT EXISTS "idx_safety_incidents_incident_date" ON "safety_incidents"("incident_date");

-- Add comment
COMMENT ON TABLE "safety_incidents" IS 'Safety incident tracking with escalation support';
