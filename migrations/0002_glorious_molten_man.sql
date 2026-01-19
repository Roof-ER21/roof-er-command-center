CREATE TABLE "safety_incidents" (
	"id" serial PRIMARY KEY NOT NULL,
	"reported_by" integer NOT NULL,
	"assigned_to" integer,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"location" text,
	"incident_date" timestamp NOT NULL,
	"severity" text NOT NULL,
	"status" text DEFAULT 'reported' NOT NULL,
	"category" text,
	"injury_type" text,
	"witnesses" text,
	"actions_taken" text,
	"preventive_measures" text,
	"resolved_at" timestamp,
	"resolved_by" integer,
	"last_escalated_at" timestamp,
	"escalation_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_performance" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"sales_rep_id" integer,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"revenue" real DEFAULT 0,
	"target" real DEFAULT 0,
	"deals_won" integer DEFAULT 0,
	"deals_pending" integer DEFAULT 0,
	"deals_lost" integer DEFAULT 0,
	"commission" real DEFAULT 0,
	"commission_rate" real DEFAULT 0.1,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_public_profile" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "public_bio" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "public_phone" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "public_email" text;--> statement-breakpoint
ALTER TABLE "safety_incidents" ADD CONSTRAINT "safety_incidents_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "safety_incidents" ADD CONSTRAINT "safety_incidents_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "safety_incidents" ADD CONSTRAINT "safety_incidents_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_performance" ADD CONSTRAINT "sales_performance_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_performance" ADD CONSTRAINT "sales_performance_sales_rep_id_sales_reps_id_fk" FOREIGN KEY ("sales_rep_id") REFERENCES "public"."sales_reps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_slug_unique" UNIQUE("slug");