CREATE TABLE "email_notifications" (
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
);
--> statement-breakpoint
CREATE TABLE "field_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"filename" text NOT NULL,
	"original_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"category" text DEFAULT 'other' NOT NULL,
	"tags" text[],
	"description" text,
	"analysis_result" jsonb,
	"storage_path" text NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"last_accessed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "onboarding_requirements" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"requirement_name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"employee_type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"due_date" timestamp,
	"submitted_at" timestamp,
	"document_url" text,
	"notes" text,
	"is_required" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_gen_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"report_type" varchar(50) NOT NULL,
	"customer_name" varchar(255) NOT NULL,
	"property_address" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_certificates" (
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
--> statement-breakpoint
ALTER TABLE "attendance_check_ins" ADD COLUMN "latitude" real;--> statement-breakpoint
ALTER TABLE "attendance_check_ins" ADD COLUMN "longitude" real;--> statement-breakpoint
ALTER TABLE "attendance_check_ins" ADD COLUMN "location_address" text;--> statement-breakpoint
ALTER TABLE "attendance_check_ins" ADD COLUMN "location_accuracy" real;--> statement-breakpoint
ALTER TABLE "field_documents" ADD CONSTRAINT "field_documents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_requirements" ADD CONSTRAINT "onboarding_requirements_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_gen_log" ADD CONSTRAINT "report_gen_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_certificates" ADD CONSTRAINT "training_certificates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;