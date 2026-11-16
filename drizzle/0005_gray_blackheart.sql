-- Driver snapshot on each booking: the details as submitted with that request.
--
-- Requests can now be made without signing in, so the driver's details cannot
-- live only on the renter row: a guest typing the email of an existing account
-- would otherwise rewrite that account's saved profile. Each booking keeps what
-- was typed; the renter row keeps what its owner set.
--
-- Added nullable first, backfilled from the renter each existing booking already
-- points at, then tightened — a plain ADD COLUMN ... NOT NULL would fail on any
-- table that already has rows.

ALTER TABLE "bookings" ADD COLUMN "driver_first_name" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "driver_last_name" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "driver_dob" date;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "driver_phone" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "driver_email" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "driver_street" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "driver_city" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "driver_state" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "driver_zip" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "driver_license_number" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "driver_license_state" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "driver_license_expiry" date;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "driver_license_front_url" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "driver_license_back_url" text;--> statement-breakpoint

UPDATE "bookings" b SET
  "driver_first_name"       = COALESCE(r."first_name", ''),
  "driver_last_name"        = COALESCE(r."last_name", ''),
  "driver_dob"              = r."dob",
  "driver_phone"            = COALESCE(r."phone", ''),
  "driver_email"            = COALESCE(r."email", ''),
  "driver_street"           = COALESCE(r."street", ''),
  "driver_city"             = COALESCE(r."city", ''),
  "driver_state"            = COALESCE(r."state", ''),
  "driver_zip"              = COALESCE(r."zip", ''),
  "driver_license_number"   = COALESCE(r."license_number", ''),
  "driver_license_state"    = COALESCE(r."license_state", ''),
  "driver_license_expiry"   = r."license_expiry",
  "driver_license_front_url" = r."license_front_url",
  "driver_license_back_url" = r."license_back_url"
FROM "renters" r WHERE r."id" = b."renter_id";--> statement-breakpoint

ALTER TABLE "bookings" ALTER COLUMN "driver_first_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "driver_last_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "driver_email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "driver_phone" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "driver_phone" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "driver_street" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "driver_street" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "driver_city" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "driver_city" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "driver_state" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "driver_state" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "driver_zip" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "driver_zip" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "driver_license_number" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "driver_license_number" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "driver_license_state" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "driver_license_state" SET NOT NULL;
