CREATE TABLE "resume_submission" (
	"id" text PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"city" text,
	"pdf_key" text NOT NULL,
	"terms_version" text NOT NULL,
	"marketing_consent" boolean DEFAULT true NOT NULL,
	"consent_at" timestamp DEFAULT now() NOT NULL,
	"consent_revoked_at" timestamp,
	"ip_address" text,
	"user_agent" text,
	"job_slug" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "resume_submission_created_at_idx" ON "resume_submission" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX "resume_submission_email_idx" ON "resume_submission" USING btree ("email");
