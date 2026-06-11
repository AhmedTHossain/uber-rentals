CREATE TYPE "public"."audit_entity" AS ENUM('BOOKING', 'INSURANCE', 'PAYMENT', 'VEHICLE', 'RENTER', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'ACTIVE', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."insurance_status" AS ENUM('PENDING', 'VERIFIED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."insurance_type" AS ENUM('COMPANY', 'CUSTOMER');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('PAID', 'DUE', 'OVERDUE');--> statement-breakpoint
CREATE TYPE "public"."photo_view" AS ENUM('cover', 'profile', 'interior', 'rear', 'detail');--> statement-breakpoint
CREATE TYPE "public"."reminder_kind" AS ENUM('payment', 'insurance', 'license');--> statement-breakpoint
CREATE TYPE "public"."reminder_sev" AS ENUM('low', 'med', 'high');--> statement-breakpoint
CREATE TYPE "public"."vehicle_status" AS ENUM('AVAILABLE', 'RENTED', 'MAINTENANCE', 'ARCHIVED');--> statement-breakpoint
CREATE TABLE "admins" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'Operations' NOT NULL,
	"password_hash" text,
	"created_at" date DEFAULT now() NOT NULL,
	CONSTRAINT "admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"admin_id" text,
	"admin" text NOT NULL,
	"entity_type" "audit_entity" NOT NULL,
	"entity_id" text NOT NULL,
	"action" text NOT NULL,
	"changes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" text PRIMARY KEY NOT NULL,
	"reference_number" text NOT NULL,
	"renter_id" text NOT NULL,
	"vehicle_id" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" "booking_status" DEFAULT 'REQUESTED' NOT NULL,
	"insurance_type" "insurance_type" NOT NULL,
	"reject_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_reference_number_unique" UNIQUE("reference_number"),
	CONSTRAINT "bookings_dates_chk" CHECK ("bookings"."end_date" >= "bookings"."start_date")
);
--> statement-breakpoint
CREATE TABLE "insurance" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_id" text NOT NULL,
	"type" "insurance_type" NOT NULL,
	"provider_name" text NOT NULL,
	"policy_number" text NOT NULL,
	"policy_address" text,
	"agent_phone" text,
	"agent_email" text,
	"status" "insurance_status" DEFAULT 'PENDING' NOT NULL,
	"expiry_date" date NOT NULL,
	"insurance_front_url" text,
	"insurance_back_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "insurance_booking_id_unique" UNIQUE("booking_id")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_id" text NOT NULL,
	"week_start" date NOT NULL,
	"week_end" date NOT NULL,
	"amount" integer NOT NULL,
	"status" "payment_status" DEFAULT 'DUE' NOT NULL,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_amount_chk" CHECK ("payments"."amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" "reminder_kind" NOT NULL,
	"sev" "reminder_sev" NOT NULL,
	"title" text NOT NULL,
	"detail" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "renters" (
	"id" text PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"dob" date NOT NULL,
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"street" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"zip" text NOT NULL,
	"license_number" text NOT NULL,
	"license_state" text NOT NULL,
	"license_expiry" date NOT NULL,
	"license_front_url" text,
	"license_back_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_meta" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_images" (
	"id" text PRIMARY KEY NOT NULL,
	"vehicle_id" text NOT NULL,
	"view" "photo_view" NOT NULL,
	"image_url" text NOT NULL,
	"object_position" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" text PRIMARY KEY NOT NULL,
	"vin" text NOT NULL,
	"plate" text NOT NULL,
	"year" integer NOT NULL,
	"make" text NOT NULL,
	"model" text NOT NULL,
	"color" text NOT NULL,
	"seats" integer NOT NULL,
	"transmission" text NOT NULL,
	"weekly_price" integer NOT NULL,
	"status" "vehicle_status" DEFAULT 'AVAILABLE' NOT NULL,
	"hp" integer,
	"drivetrain" text,
	"fuel" text,
	"topspeed" text,
	"body" text,
	"tagline" text,
	"features" text[] DEFAULT '{}'::text[] NOT NULL,
	"deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vehicles_vin_unique" UNIQUE("vin"),
	CONSTRAINT "vehicles_plate_unique" UNIQUE("plate"),
	CONSTRAINT "vehicles_year_chk" CHECK ("vehicles"."year" >= 1900 AND "vehicles"."year" <= 2100),
	CONSTRAINT "vehicles_seats_chk" CHECK ("vehicles"."seats" > 0),
	CONSTRAINT "vehicles_price_chk" CHECK ("vehicles"."weekly_price" >= 0)
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_renter_id_renters_id_fk" FOREIGN KEY ("renter_id") REFERENCES "public"."renters"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insurance" ADD CONSTRAINT "insurance_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_images" ADD CONSTRAINT "vehicle_images_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "vehicle_images_view_uq" ON "vehicle_images" USING btree ("vehicle_id","view");