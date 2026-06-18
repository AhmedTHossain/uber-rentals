/* eslint-disable no-console */
import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import bcrypt from "bcryptjs";
import * as schema from "../src/lib/db/schema";

// ---------- local date helpers (mirror prototype) ----------
const pad = (n: number, l = 2) => String(n).padStart(l, "0");
const iso = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (dstr: string, n: number) => {
  const d = new Date(dstr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return iso(d);
};
const daysBetween = (a: string, b: string) =>
  Math.round((+new Date(b) - +new Date(a)) / 86400000);

const TODAY = "2026-05-30";

// ---------- vehicles ----------
const vehicles = [
  { id: "v1", vin: "WDD2030461A6841", plate: "URX-118", year: 2025, make: "Mercedes-Benz", model: "S 580 Sedan", color: "Obsidian Black", seats: 5, transmission: "Automatic", weeklyPrice: 2450, status: "RENTED", hp: 496, drivetrain: "AWD", fuel: "Gas · 22 MPG", topspeed: "130 mph", body: "Full-size Sedan", tagline: "The standard by which luxury sedans are measured.", features: ["Executive rear seats", "Burmester 4D sound", "Heated & ventilated seats", "Night-vision assist", "Panoramic roof"] },
  { id: "v2", vin: "WBA7F2C50KGM2238", plate: "URX-204", year: 2024, make: "BMW", model: "7 Series 760i", color: "Mineral White", seats: 5, transmission: "Automatic", weeklyPrice: 2200, status: "AVAILABLE", hp: 536, drivetrain: "AWD", fuel: "Gas · 21 MPG", topspeed: "130 mph", body: "Full-size Sedan", tagline: "Commanding presence with theater-screen comfort.", features: ['31" rear theater screen', "Bowers & Wilkins audio", "Massaging seats", "Power doors", "Sky Lounge roof"] },
  { id: "v3", vin: "SALGS2SE8MA44781", plate: "URX-330", year: 2025, make: "Land Rover", model: "Range Rover Autobiography", color: "Santorini Black", seats: 5, transmission: "Automatic", weeklyPrice: 2800, status: "RENTED", hp: 523, drivetrain: "4WD", fuel: "Gas · 19 MPG", topspeed: "155 mph", body: "Full-size SUV", tagline: "Go anywhere, arrive in absolute refinement.", features: ["Terrain Response 2", "Meridian Signature audio", "24-way heated seats", "Air suspension", "Hot-stone massage"] },
  { id: "v4", vin: "WP0AB2A99NS22710", plate: "URX-051", year: 2024, make: "Porsche", model: "911 Carrera S", color: "Guards Red", seats: 2, transmission: "Automatic", weeklyPrice: 3100, status: "AVAILABLE", hp: 443, drivetrain: "RWD", fuel: "Gas · 20 MPG", topspeed: "191 mph", body: "Sports Coupe", tagline: "Seven generations of obsession in one silhouette.", features: ["Sport Chrono package", "PASM sport suspension", "Sport exhaust", "Carbon-ceramic brakes", "14-way sport seats"] },
  { id: "v5", vin: "5YJSA1E63MF44120", plate: "URX-777", year: 2025, make: "Tesla", model: "Model S Plaid", color: "Pearl White", seats: 5, transmission: "Automatic", weeklyPrice: 1950, status: "AVAILABLE", hp: 1020, drivetrain: "AWD", fuel: "Electric · 396 mi", topspeed: "200 mph", body: "Performance Sedan", tagline: "1,020 horsepower of silent, savage acceleration.", features: ["0–60 in 1.99s", "Yoke steering", "22-speaker audio", "Full self-driving (sup.)", "Glass roof"] },
  { id: "v6", vin: "WA1VAAF74MD00921", plate: "URX-462", year: 2024, make: "Audi", model: "Q8 Prestige", color: "Glacier White", seats: 5, transmission: "Automatic", weeklyPrice: 1780, status: "MAINTENANCE", hp: 335, drivetrain: "AWD", fuel: "Gas · 21 MPG", topspeed: "130 mph", body: "Coupe SUV", tagline: "Quattro poise wrapped in coupe-SUV drama.", features: ["Quattro AWD", "Bang & Olufsen 3D", "Virtual cockpit", "Adaptive air suspension", "Heated seats"] },
  { id: "v7", vin: "ZFF92LMA5N0260118", plate: "URX-016", year: 2023, make: "Ferrari", model: "Roma", color: "Rosso Corsa", seats: 2, transmission: "Automatic", weeklyPrice: 4600, status: "AVAILABLE", hp: 612, drivetrain: "RWD", fuel: "Gas · 18 MPG", topspeed: "199 mph", body: "Grand Tourer", tagline: "La Nuova Dolce Vita — the new sweet life.", features: ["3.9L twin-turbo V8", "8-speed DCT", "Manettino dial", "Carbon-fiber trim", "Daytona-style seats"] },
  { id: "v8", vin: "SCBCR3ZA9NC00781", plate: "URX-090", year: 2025, make: "Bentley", model: "Continental GT", color: "Glacier Silver", seats: 4, transmission: "Automatic", weeklyPrice: 3950, status: "AVAILABLE", hp: 542, drivetrain: "AWD", fuel: "Gas · 19 MPG", topspeed: "208 mph", body: "Grand Tourer", tagline: "Hand-built grand touring without compromise.", features: ["Rotating display", "Naim for Bentley audio", "Diamond-knurled controls", "Mulliner driving spec", "Heated/cooled/massage"] },
  { id: "v9", vin: "WDDWJ8EB2KF77120", plate: "URX-243", year: 2024, make: "Mercedes-Benz", model: "GLE 450 SUV", color: "Selenite Grey", seats: 5, transmission: "Automatic", weeklyPrice: 1650, status: "AVAILABLE", hp: 375, drivetrain: "AWD", fuel: "Gas · 23 MPG", topspeed: "130 mph", body: "Mid-size SUV", tagline: "Effortless everyday luxury, family-sized.", features: ["MBUX dual screens", "Burmester audio", "Heated seats", "Hands-free liftgate", "Wireless charging"] },
  { id: "v10", vin: "1G1YB2D40N5100442", plate: "URX-808", year: 2024, make: "Chevrolet", model: "Corvette Stingray", color: "Torch Red", seats: 2, transmission: "Automatic", weeklyPrice: 2050, status: "ARCHIVED", hp: 495, drivetrain: "RWD", fuel: "Gas · 19 MPG", topspeed: "194 mph", body: "Mid-engine Sports", tagline: "Mid-engine supercar performance, American-made.", features: ["6.2L V8", "Z51 performance pkg", "Magnetic Ride", "Removable roof", "Performance Data Recorder"] },
] as const;

// ---------- renters ----------
const renters = [
  { id: "r1", firstName: "Marcus", lastName: "Adeyemi", dob: "1989-03-14", phone: "(312) 555-0148", email: "m.adeyemi@gmail.com", street: "1820 N Clark St", city: "Chicago", state: "IL", zip: "60614", licenseNumber: "A284-5519-9027", licenseState: "IL", licenseExpiry: "2028-03-14" },
  { id: "r2", firstName: "Sofia", lastName: "Reyes", dob: "1992-11-02", phone: "(305) 555-0193", email: "sofia.reyes@gmail.com", street: "455 Brickell Ave", city: "Miami", state: "FL", zip: "33131", licenseNumber: "R110-8841-2210", licenseState: "FL", licenseExpiry: "2027-11-02" },
  { id: "r3", firstName: "David", lastName: "Chen", dob: "1985-06-21", phone: "(415) 555-0177", email: "d.chen@gmail.com", street: "88 King St", city: "San Francisco", state: "CA", zip: "94107", licenseNumber: "C903-4412-0098", licenseState: "CA", licenseExpiry: "2026-08-19" },
  { id: "r4", firstName: "Amara", lastName: "Okafor", dob: "1994-01-30", phone: "(646) 555-0112", email: "amara.okafor@gmail.com", street: "250 W 50th St", city: "New York", state: "NY", zip: "10019", licenseNumber: "O221-7788-1190", licenseState: "NY", licenseExpiry: "2029-01-30" },
  { id: "r5", firstName: "James", lastName: "Whitfield", dob: "1979-09-08", phone: "(214) 555-0166", email: "jwhitfield@gmail.com", street: "1700 Pacific Ave", city: "Dallas", state: "TX", zip: "75201", licenseNumber: "W554-3321-7741", licenseState: "TX", licenseExpiry: "2026-06-10" },
  { id: "r6", firstName: "Elena", lastName: "Volkov", dob: "1990-12-19", phone: "(702) 555-0154", email: "elena.volkov@gmail.com", street: "3700 Las Vegas Blvd", city: "Las Vegas", state: "NV", zip: "89109", licenseNumber: "V889-2204-5512", licenseState: "NV", licenseExpiry: "2028-12-19" },
] as const;

// ---------- bookings ----------
const bookings = [
  { id: "b1", referenceNumber: "CR-20260528-0007", renterId: "r1", vehicleId: "v1", startDate: "2026-05-25", endDate: "2026-06-22", status: "ACTIVE", insuranceTypeChoice: "COMPANY", createdAt: "2026-05-18" },
  { id: "b2", referenceNumber: "CR-20260529-0003", renterId: "r2", vehicleId: "v3", startDate: "2026-05-29", endDate: "2026-06-26", status: "ACTIVE", insuranceTypeChoice: "CUSTOMER", createdAt: "2026-05-21" },
  { id: "b3", referenceNumber: "CR-20260530-0011", renterId: "r4", vehicleId: "v4", startDate: "2026-06-05", endDate: "2026-06-19", status: "UNDER_REVIEW", insuranceTypeChoice: "CUSTOMER", createdAt: "2026-05-30" },
  { id: "b4", referenceNumber: "CR-20260530-0012", renterId: "r3", vehicleId: "v7", startDate: "2026-06-08", endDate: "2026-06-22", status: "REQUESTED", insuranceTypeChoice: "COMPANY", createdAt: "2026-05-30" },
  { id: "b5", referenceNumber: "CR-20260530-0013", renterId: "r6", vehicleId: "v8", startDate: "2026-06-12", endDate: "2026-07-10", status: "REQUESTED", insuranceTypeChoice: "CUSTOMER", createdAt: "2026-05-30" },
  { id: "b6", referenceNumber: "CR-20260520-0002", renterId: "r5", vehicleId: "v2", startDate: "2026-05-22", endDate: "2026-06-05", status: "APPROVED", insuranceTypeChoice: "COMPANY", createdAt: "2026-05-15" },
  { id: "b7", referenceNumber: "CR-20260410-0005", renterId: "r1", vehicleId: "v9", startDate: "2026-04-12", endDate: "2026-05-10", status: "COMPLETED", insuranceTypeChoice: "CUSTOMER", createdAt: "2026-04-05" },
  { id: "b8", referenceNumber: "CR-20260515-0008", renterId: "r2", vehicleId: "v5", startDate: "2026-05-16", endDate: "2026-05-30", status: "REJECTED", insuranceTypeChoice: "COMPANY", createdAt: "2026-05-12" },
] as const;

// ---------- insurance ----------
const insurance = [
  { id: "i1", bookingId: "b1", type: "COMPANY", providerName: "DMV Rentals Fleet Cover", policyNumber: "URF-2026-0581", policyAddress: "200 W Madison St, Chicago, IL", agentPhone: "(800) 555-0100", agentEmail: "fleet@uberrentals.co", status: "VERIFIED", expiryDate: "2026-06-30" },
  { id: "i2", bookingId: "b2", type: "CUSTOMER", providerName: "GEICO", policyNumber: "GC-9920-44817", policyAddress: "455 Brickell Ave, Miami, FL", agentPhone: "(305) 555-0200", agentEmail: "claims@geico.com", status: "VERIFIED", expiryDate: "2026-12-01" },
  { id: "i3", bookingId: "b3", type: "CUSTOMER", providerName: "State Farm", policyNumber: "SF-1182-90043", policyAddress: "250 W 50th St, New York, NY", agentPhone: "(646) 555-0211", agentEmail: "agent@statefarm.com", status: "PENDING", expiryDate: "2027-02-15" },
  { id: "i4", bookingId: "b4", type: "COMPANY", providerName: "DMV Rentals Fleet Cover", policyNumber: "URF-2026-0590", policyAddress: "200 W Madison St, Chicago, IL", agentPhone: "(800) 555-0100", agentEmail: "fleet@uberrentals.co", status: "PENDING", expiryDate: "2026-06-15" },
  { id: "i5", bookingId: "b6", type: "COMPANY", providerName: "DMV Rentals Fleet Cover", policyNumber: "URF-2026-0571", policyAddress: "200 W Madison St, Chicago, IL", agentPhone: "(800) 555-0100", agentEmail: "fleet@uberrentals.co", status: "VERIFIED", expiryDate: "2026-06-08" },
  { id: "i6", bookingId: "b7", type: "CUSTOMER", providerName: "Progressive", policyNumber: "PG-7741-22018", policyAddress: "1820 N Clark St, Chicago, IL", agentPhone: "(312) 555-0233", agentEmail: "support@progressive.com", status: "VERIFIED", expiryDate: "2026-09-01" },
] as const;

// ---------- weekly payment generation (mirrors prototype genWeeks) ----------
function genWeeks(b: { startDate: string; endDate: string; vehicleId: string }) {
  const v = vehicles.find((x) => x.id === b.vehicleId);
  const weekly = v ? v.weeklyPrice : 0;
  const total = Math.max(1, daysBetween(b.startDate, b.endDate));
  const out: { start: string; end: string; amount: number }[] = [];
  let cursor = b.startDate;
  let i = 0;
  while (daysBetween(b.startDate, cursor) < total) {
    const wEnd = addDays(cursor, 6);
    const realEnd = daysBetween(b.startDate, wEnd) > total ? b.endDate : wEnd;
    out.push({ start: cursor, end: realEnd, amount: weekly });
    cursor = addDays(cursor, 7);
    i++;
    if (i > 12) break;
  }
  return out;
}

type PaymentRow = {
  id: string;
  bookingId: string;
  weekStart: string;
  weekEnd: string;
  amount: number;
  status: "PAID" | "DUE" | "OVERDUE";
  paidAt: string | null;
};

function buildPayments(): PaymentRow[] {
  const out: PaymentRow[] = [];
  let pid = 1;
  bookings.forEach((b) => {
    if (!["ACTIVE", "COMPLETED", "APPROVED"].includes(b.status)) return;
    const weeks = genWeeks(b);
    weeks.forEach((w, idx) => {
      let status: "PAID" | "DUE" | "OVERDUE";
      if (b.status === "COMPLETED") status = "PAID";
      else if (b.status === "APPROVED") status = "DUE";
      else {
        if (w.end < TODAY) status = b.id === "b2" && idx === 0 ? "OVERDUE" : "PAID";
        else status = "DUE";
      }
      out.push({
        id: "p" + pid++,
        bookingId: b.id,
        weekStart: w.start,
        weekEnd: w.end,
        amount: w.amount,
        status,
        paidAt: status === "PAID" ? w.end : null,
      });
    });
  });
  return out;
}

// ---------- audit ----------
const audit = [
  { id: "a1", admin: "A. Bello", entityType: "BOOKING", entityId: "CR-20260520-0002", action: "APPROVED booking", changes: { status: ["UNDER_REVIEW", "APPROVED"] }, createdAt: "2026-05-29 14:22" },
  { id: "a2", admin: "A. Bello", entityType: "INSURANCE", entityId: "URF-2026-0571", action: "VERIFIED insurance", changes: { status: ["PENDING", "VERIFIED"] }, createdAt: "2026-05-29 14:24" },
  { id: "a3", admin: "L. Mensah", entityType: "PAYMENT", entityId: "CR-20260528-0007 · W1", action: "Marked payment PAID", changes: { status: ["DUE", "PAID"] }, createdAt: "2026-05-28 09:10" },
  { id: "a4", admin: "L. Mensah", entityType: "BOOKING", entityId: "CR-20260515-0008", action: "REJECTED booking", changes: { status: ["UNDER_REVIEW", "REJECTED"], reason: ["—", "Insurance policy expired"] }, createdAt: "2026-05-26 16:48" },
  { id: "a5", admin: "A. Bello", entityType: "VEHICLE", entityId: "URX-462", action: "Status → MAINTENANCE", changes: { status: ["AVAILABLE", "MAINTENANCE"] }, createdAt: "2026-05-25 11:30" },
  { id: "a6", admin: "A. Bello", entityType: "BOOKING", entityId: "CR-20260528-0007", action: "Marked booking ACTIVE", changes: { status: ["APPROVED", "ACTIVE"] }, createdAt: "2026-05-25 08:02" },
  { id: "a7", admin: "L. Mensah", entityType: "VEHICLE", entityId: "URX-204", action: "Created vehicle", changes: {}, createdAt: "2026-05-20 13:15" },
] as const;

// ---------- admins ----------
const adminSeed = [
  { id: "ad1", email: "a.bello@uberrentals.co", name: "A. Bello", role: "Fleet Admin · Owner", createdAt: "2025-09-01" },
  { id: "ad2", email: "l.mensah@uberrentals.co", name: "L. Mensah", role: "Operations", createdAt: "2025-11-14" },
] as const;

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const sql = postgres(url, { max: 1 });
  const db = drizzle(sql, { schema });

  console.log("Clearing existing data…");
  // Order respects FKs (children first).
  await db.delete(schema.reminders);
  await db.delete(schema.payments);
  await db.delete(schema.insurance);
  await db.delete(schema.auditLogs);
  await db.delete(schema.bookings);
  await db.delete(schema.vehicleImages);
  await db.delete(schema.vehicles);
  await db.delete(schema.renters);
  await db.delete(schema.admins);
  await db.delete(schema.systemMeta);

  const passwordHash = await bcrypt.hash("password123", 10);

  console.log("Seeding admins…");
  await db.insert(schema.admins).values(
    adminSeed.map((a) => ({ ...a, passwordHash })),
  );

  console.log("Seeding vehicles…");
  await db.insert(schema.vehicles).values(
    vehicles.map((v) => ({ ...v, features: [...v.features] })),
  );

  console.log("Seeding renters…");
  const renterPasswordHash = await bcrypt.hash("password123", 10);
  await db.insert(schema.renters).values(
    renters.map((r) => ({
      ...r,
      passwordHash: renterPasswordHash,
      emailVerifiedAt: new Date("2025-01-01T00:00:00Z"),
    })),
  );

  console.log("Seeding bookings…");
  await db.insert(schema.bookings).values(
    bookings.map((b) => ({ ...b, createdAt: new Date(b.createdAt + "T12:00:00Z") })),
  );

  console.log("Seeding insurance…");
  await db.insert(schema.insurance).values(insurance.map((i) => ({ ...i })));

  console.log("Seeding payments…");
  const payments = buildPayments();
  await db.insert(schema.payments).values(
    payments.map((p) => ({
      id: p.id,
      bookingId: p.bookingId,
      weekStart: p.weekStart,
      weekEnd: p.weekEnd,
      amount: p.amount,
      status: p.status,
      paidAt: p.paidAt ? new Date(p.paidAt + "T12:00:00Z") : null,
    })),
  );

  console.log("Seeding audit log…");
  const adminIdByName: Record<string, string | null> = {
    "A. Bello": "ad1",
    "L. Mensah": "ad2",
  };
  await db.insert(schema.auditLogs).values(
    audit.map((a) => ({
      id: a.id,
      adminId: adminIdByName[a.admin] ?? null,
      admin: a.admin,
      entityType: a.entityType,
      entityId: a.entityId,
      action: a.action,
      changes: a.changes,
      createdAt: new Date(a.createdAt.replace(" ", "T") + ":00Z"),
    })),
  );

  console.log(
    `Done. ${vehicles.length} vehicles, ${renters.length} renters, ${bookings.length} bookings, ${payments.length} payments.`,
  );
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
