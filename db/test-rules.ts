/* eslint-disable no-console */
/**
 * Server-side business-rule tests.
 * Runs the canonical rules against the seeded database and asserts expected
 * outcomes. Run with: npm run test:rules  (requires a seeded DB).
 */
import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { and, eq, inArray, like, lte, gte, ne } from "drizzle-orm";
import * as schema from "../src/lib/db/schema";
import { genWeeks, daysBetween } from "../src/lib/format";

const TODAY = "2026-05-30";

let passed = 0;
let failed = 0;
function assert(name: string, cond: boolean, detail = "") {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  const sql = postgres(url, { max: 1 });
  const db = drizzle(sql, { schema });
  const { bookings, insurance } = schema;

  // ---- replicated rule logic (mirrors src/lib/biz.ts) ----
  async function isAvailable(vehicleId: string, start: string, end: string, ignore?: string) {
    const v = await db.select({ status: schema.vehicles.status }).from(schema.vehicles).where(eq(schema.vehicles.id, vehicleId)).limit(1);
    if (!v[0]) return false;
    if (v[0].status === "MAINTENANCE" || v[0].status === "ARCHIVED") return false;
    const conds = [
      eq(bookings.vehicleId, vehicleId),
      inArray(bookings.status, ["APPROVED", "ACTIVE"] as const),
      gte(bookings.endDate, start),
      lte(bookings.startDate, end),
    ];
    if (ignore) conds.push(ne(bookings.id, ignore));
    const blocking = await db.select({ id: bookings.id }).from(bookings).where(and(...conds)).limit(1);
    return blocking.length === 0;
  }
  async function canMarkPaid(bookingId: string) {
    const b = (await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1))[0];
    if (!b) return false;
    if (b.insuranceTypeChoice !== "COMPANY") return true;
    const ins = (await db.select().from(insurance).where(eq(insurance.bookingId, bookingId)).limit(1))[0];
    if (!ins) return false;
    if (ins.status !== "VERIFIED") return false;
    if (ins.expiryDate < TODAY) return false;
    return true;
  }
  async function nextReference(day: string) {
    const rows = await db.select({ id: bookings.id }).from(bookings).where(like(bookings.referenceNumber, `CR-${day}%`));
    return `CR-${day}-${String(rows.length + 1).padStart(4, "0")}`;
  }

  console.log("\nBusiness-rule tests\n");

  // 1) genWeeks (pure)
  const w1 = genWeeks("2026-06-05", "2026-06-19", 3100);
  assert("genWeeks: 14-day rental → 2 weeks", w1.length === 2, `got ${w1.length}`);
  assert("genWeeks: amount per week correct", w1.every((w) => w.amount === 3100));
  const w2 = genWeeks("2026-05-25", "2026-06-22", 2450);
  assert("genWeeks: 28-day rental → 4 weeks", w2.length === 4, `got ${w2.length}`);
  assert("genWeeks: total days = 28", daysBetween("2026-05-25", "2026-06-22") === 28);

  // 2) availability — ACTIVE booking blocks overlap
  assert("availability: v1 blocked during active booking", (await isAvailable("v1", "2026-06-01", "2026-06-10")) === false);
  assert("availability: v1 free in August", (await isAvailable("v1", "2026-08-01", "2026-08-10")) === true);

  // 3) REQUESTED bookings do NOT block (v7 has a REQUESTED booking b4 Jun 8–22)
  assert("availability: REQUESTED does not block (v7)", (await isAvailable("v7", "2026-06-08", "2026-06-22")) === true);

  // 4) MAINTENANCE vehicle is never available (v6)
  assert("availability: MAINTENANCE vehicle unavailable (v6)", (await isAvailable("v6", "2026-08-01", "2026-08-08")) === false);

  // 5) ignore self — re-approving same booking doesn't conflict with itself (b1)
  assert("availability: ignores self booking (b1)", (await isAvailable("v1", "2026-05-25", "2026-06-22", "b1")) === true);

  // 6) canMarkPaid — verified company policy ok (b1)
  assert("canMarkPaid: company VERIFIED non-expired → ok (b1)", (await canMarkPaid("b1")) === true);
  // b4 is COMPANY with PENDING insurance → blocked
  assert("canMarkPaid: company PENDING → blocked (b4)", (await canMarkPaid("b4")) === false);
  // b2 is CUSTOMER → always ok
  assert("canMarkPaid: customer insurance → ok (b2)", (await canMarkPaid("b2")) === true);

  // 7) nextReference sequencing for the seeded day (b3,b4,b5 already on 20260530)
  assert("nextReference: 20260530 → 0004", (await nextReference("20260530")) === "CR-20260530-0004");

  await sql.end();
  console.log(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
