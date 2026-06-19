import {
  pgTable,
  pgEnum,
  text,
  integer,
  boolean,
  date,
  timestamp,
  jsonb,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ---------- enums ----------
export const vehicleStatus = pgEnum("vehicle_status", [
  "AVAILABLE",
  "RENTED",
  "MAINTENANCE",
  "ARCHIVED",
]);

export const bookingStatus = pgEnum("booking_status", [
  "REQUESTED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "ACTIVE",
  "COMPLETED",
]);

export const insuranceType = pgEnum("insurance_type", ["COMPANY", "CUSTOMER"]);

export const insuranceStatus = pgEnum("insurance_status", [
  "PENDING",
  "VERIFIED",
  "REJECTED",
]);

export const paymentStatus = pgEnum("payment_status", ["PAID", "DUE", "OVERDUE"]);

export const photoView = pgEnum("photo_view", [
  "cover",
  "profile",
  "interior",
  "rear",
  "detail",
]);

export const auditEntity = pgEnum("audit_entity", [
  "BOOKING",
  "INSURANCE",
  "PAYMENT",
  "VEHICLE",
  "RENTER",
  "ADMIN",
]);

export const reminderKind = pgEnum("reminder_kind", [
  "payment",
  "insurance",
  "license",
]);

export const reminderSev = pgEnum("reminder_sev", ["low", "med", "high"]);

// ---------- admins ----------
export const admins = pgTable("admins", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull().default("Operations"),
  passwordHash: text("password_hash"),
  createdAt: date("created_at").notNull().defaultNow(),
});

// ---------- vehicles ----------
export const vehicles = pgTable(
  "vehicles",
  {
    id: text("id").primaryKey(),
    vin: text("vin").notNull().unique(),
    plate: text("plate").notNull().unique(),
    year: integer("year").notNull(),
    make: text("make").notNull(),
    model: text("model").notNull(),
    color: text("color").notNull(),
    seats: integer("seats").notNull(),
    transmission: text("transmission").notNull(),
    weeklyPrice: integer("weekly_price").notNull(),
    status: vehicleStatus("status").notNull().default("AVAILABLE"),
    hp: integer("hp"),
    drivetrain: text("drivetrain"),
    fuel: text("fuel"),
    topspeed: text("topspeed"),
    body: text("body"),
    tagline: text("tagline"),
    features: text("features").array().notNull().default(sql`'{}'::text[]`),
    // Per-vehicle customer-facing spec visibility (admin always sees all).
    showBody: boolean("show_body").notNull().default(true),
    showSeats: boolean("show_seats").notNull().default(true),
    showEnergy: boolean("show_energy").notNull().default(true),
    deleted: boolean("deleted").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("vehicles_year_chk", sql`${t.year} >= 1900 AND ${t.year} <= 2100`),
    check("vehicles_seats_chk", sql`${t.seats} > 0`),
    check("vehicles_price_chk", sql`${t.weeklyPrice} >= 0`),
  ],
);

// ---------- vehicle images (5 canonical views) ----------
export const vehicleImages = pgTable(
  "vehicle_images",
  {
    id: text("id").primaryKey(),
    vehicleId: text("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),
    view: photoView("view").notNull(),
    imageUrl: text("image_url").notNull(),
    // CSS object-position for admin "reframe" (e.g. "50% 30%"); null = center.
    objectPosition: text("object_position"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("vehicle_images_view_uq").on(t.vehicleId, t.view)],
);

// ---------- renters ----------
export const renters = pgTable("renters", {
  id: text("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  // Nullable: an account can exist before a booking provides these.
  dob: date("dob"),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().unique(),
  street: text("street").notNull().default(""),
  city: text("city").notNull().default(""),
  state: text("state").notNull().default(""),
  zip: text("zip").notNull().default(""),
  licenseNumber: text("license_number").notNull().default(""),
  licenseState: text("license_state").notNull().default(""),
  licenseExpiry: date("license_expiry"),
  licenseFrontUrl: text("license_front_url"),
  licenseBackUrl: text("license_back_url"),
  // Renter account auth (nullable: legacy per-booking renters have no login).
  passwordHash: text("password_hash"),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- bookings ----------
export const bookings = pgTable(
  "bookings",
  {
    id: text("id").primaryKey(),
    referenceNumber: text("reference_number").notNull().unique(),
    renterId: text("renter_id")
      .notNull()
      .references(() => renters.id, { onDelete: "restrict" }),
    vehicleId: text("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "restrict" }),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    status: bookingStatus("status").notNull().default("REQUESTED"),
    insuranceTypeChoice: insuranceType("insurance_type").notNull(),
    rejectReason: text("reject_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [check("bookings_dates_chk", sql`${t.endDate} >= ${t.startDate}`)],
);

// ---------- insurance (one per booking) ----------
export const insurance = pgTable("insurance", {
  id: text("id").primaryKey(),
  bookingId: text("booking_id")
    .notNull()
    .unique()
    .references(() => bookings.id, { onDelete: "cascade" }),
  type: insuranceType("type").notNull(),
  providerName: text("provider_name").notNull(),
  policyNumber: text("policy_number").notNull(),
  policyAddress: text("policy_address"),
  agentPhone: text("agent_phone"),
  agentEmail: text("agent_email"),
  status: insuranceStatus("status").notNull().default("PENDING"),
  expiryDate: date("expiry_date").notNull(),
  insuranceFrontUrl: text("insurance_front_url"),
  insuranceBackUrl: text("insurance_back_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- payments (weekly) ----------
export const payments = pgTable(
  "payments",
  {
    id: text("id").primaryKey(),
    bookingId: text("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    weekStart: date("week_start").notNull(),
    weekEnd: date("week_end").notNull(),
    amount: integer("amount").notNull(),
    status: paymentStatus("status").notNull().default("DUE"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [check("payments_amount_chk", sql`${t.amount} >= 0`)],
);

// ---------- audit log ----------
export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  // FK to the acting admin (nullable for "System (cron)") per spec.
  adminId: text("admin_id").references(() => admins.id, { onDelete: "set null" }),
  // Denormalized display name snapshot — preserves the actor even if an admin
  // is later removed, and carries the "System (cron)" pseudo-actor.
  admin: text("admin").notNull(),
  entityType: auditEntity("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  action: text("action").notNull(),
  changes: jsonb("changes").notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- reminders (cron-generated, repopulated each run) ----------
export const reminders = pgTable("reminders", {
  id: text("id").primaryKey(),
  kind: reminderKind("kind").notNull(),
  sev: reminderSev("sev").notNull(),
  title: text("title").notNull(),
  detail: text("detail").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- system meta (single-row job bookkeeping) ----------
export const systemMeta = pgTable("system_meta", {
  key: text("key").primaryKey(),
  value: text("value"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- contact messages (public contact form inbox) ----------
export const contactStatus = pgEnum("contact_status", ["NEW", "READ", "ARCHIVED"]);

export const contactMessages = pgTable("contact_messages", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  message: text("message").notNull(),
  status: contactStatus("status").notNull().default("NEW"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Vehicle = typeof vehicles.$inferSelect;
export type Renter = typeof renters.$inferSelect;
export type ContactMessage = typeof contactMessages.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type Insurance = typeof insurance.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type AuditRow = typeof auditLogs.$inferSelect;
export type Admin = typeof admins.$inferSelect;
export type Reminder = typeof reminders.$inferSelect;
export type VehicleImage = typeof vehicleImages.$inferSelect;
