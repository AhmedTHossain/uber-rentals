ALTER TABLE "renters" ADD COLUMN "password_hash" text;--> statement-breakpoint
ALTER TABLE "renters" ADD COLUMN "email_verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "renters" ADD CONSTRAINT "renters_email_unique" UNIQUE("email");