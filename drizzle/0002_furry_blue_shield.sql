ALTER TABLE "renters" ALTER COLUMN "dob" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "renters" ALTER COLUMN "phone" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "renters" ALTER COLUMN "street" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "renters" ALTER COLUMN "city" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "renters" ALTER COLUMN "state" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "renters" ALTER COLUMN "zip" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "renters" ALTER COLUMN "license_number" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "renters" ALTER COLUMN "license_state" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "renters" ALTER COLUMN "license_expiry" DROP NOT NULL;