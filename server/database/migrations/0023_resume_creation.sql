CREATE TABLE "resume_creation" (
	"id" text PRIMARY KEY NOT NULL,
	"return_to" text,
	"job_slug" text,
	"referrer" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "resume_creation_created_at_idx" ON "resume_creation" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX "resume_creation_job_slug_idx" ON "resume_creation" USING btree ("job_slug");
