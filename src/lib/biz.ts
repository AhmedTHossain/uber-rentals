import "server-only";
import { randomUUID } from "crypto";
import { and, eq, ne, inArray, lte, gte, like } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "./db";
import {
  vehicles,
  bookings,
  insurance,
  payments,
  auditLogs,
  reminders,
  systemMeta,
  renters,
  type Booking,
} from "./db/schema";
import {
  today,
  fmtDate,
  fmtShort,
  money,
  daysBetween,
  genWeeks,
  pad,
} from "./format";

export { today, genWeeks };

// ---------- availability ----------
// A vehicle is unavailable for [start,end] if it is MAINTENANCE/ARCHIVED,
// or an APPROVED/ACTIVE booking overlaps the requested window.
export async function isAvailable(
  vehicleId: string,
  start: string,
  end: string,
  ignoreBookingId?: string,
): Promise<boolean> {
  const v = await db
    .select({ status: vehicles.status })
    .from(vehicles)
    .where(eq(vehicles.id, vehicleId))
    .limit(1);
  if (v.length === 0) return false;
  if (v[0].status === "MAINTENANCE" || v[0].status === "ARCHIVED") return false;

  const conds = [
    eq(bookings.vehicleId, vehicleId),
    inArray(bookings.status, ["APPROVED", "ACTIVE"] as const),
    // overlap: start <= booking.end && booking.start <= end
    gte(bookings.endDate, start),
    lte(bookings.startDate, end),
  ];
  if (ignoreBookingId) conds.push(ne(bookings.id, ignoreBookingId));

  const blocking = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(and(...conds))
    .limit(1);
  return blocking.length === 0;
}

// ---------- reference numbers ----------
// Next CR-YYYYMMDD-NNNN sequence for the given day.
export async function nextReference(dateStr?: string): Promise<string> {
  const day = (dateStr || today()).replace(/-/g, "");
  const todays = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(like(bookings.referenceNumber, `CR-${day}%`));
  return `CR-${day}-${pad(todays.length + 1, 4)}`;
}

// ---------- insurance enforcement before marking a payment PAID ----------
export async function canMarkPaid(
  booking: Pick<Booking, "id" | "insuranceTypeChoice">,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (booking.insuranceTypeChoice === "COMPANY") {
    const rows = await db
      .select()
      .from(insurance)
      .where(eq(insurance.bookingId, booking.id))
      .limit(1);
    const ins = rows[0];
    if (!ins) return { ok: false, reason: "No company insurance on file." };
    if (ins.status !== "VERIFIED")
      return { ok: false, reason: "Company insurance is not VERIFIED." };
    if (ins.expiryDate < today())
      return {
        ok: false,
        reason: `Company insurance expired ${fmtDate(ins.expiryDate)}.`,
      };
  }
  return { ok: true };
}

// ---------- insurance expiring within 14 days ----------
export async function insuranceExpiringSoon() {
  const all = await db.select().from(insurance);
  return all.filter((i) => {
    const dleft = daysBetween(today(), i.expiryDate);
    return dleft >= 0 && dleft <= 14;
  });
}

// ---------- audit helper ----------
export type AuditEntity =
  | "BOOKING"
  | "INSURANCE"
  | "PAYMENT"
  | "VEHICLE"
  | "RENTER"
  | "ADMIN";

// Writes an audit row. The acting admin is resolved from the session by default;
// pass an explicit `actor` for non-session contexts (e.g. the cron runner).
export async function logAudit(entry: {
  entityType: AuditEntity;
  entityId: string;
  action: string;
  changes?: Record<string, unknown>;
  actor?: { id: string | null; name: string };
}): Promise<void> {
  let adminId: string | null = null;
  let admin = "System";
  if (entry.actor) {
    adminId = entry.actor.id;
    admin = entry.actor.name;
  } else {
    const session = await auth();
    const user = session?.user as { id?: string; name?: string | null } | undefined;
    adminId = user?.id ?? null;
    admin = user?.name ?? "Admin";
  }
  await db.insert(auditLogs).values({
    id: randomUUID(),
    adminId,
    admin,
    entityType: entry.entityType,
    entityId: entry.entityId,
    action: entry.action,
    changes: entry.changes ?? {},
  });
}

// ---------- generate + persist weekly payments for a booking ----------
// Called when a booking is approved. Idempotent: clears existing rows first.
export async function generatePayments(bookingId: string): Promise<number> {
  const rows = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);
  const b = rows[0];
  if (!b) return 0;
  const v = await db
    .select({ weeklyPrice: vehicles.weeklyPrice })
    .from(vehicles)
    .where(eq(vehicles.id, b.vehicleId))
    .limit(1);
  const weekly = v[0]?.weeklyPrice ?? 0;
  const weeks = genWeeks(b.startDate, b.endDate, weekly);

  await db.delete(payments).where(eq(payments.bookingId, bookingId));
  if (weeks.length === 0) return 0;
  await db.insert(payments).values(
    weeks.map((w) => ({
      id: randomUUID(),
      bookingId,
      weekStart: w.start,
      weekEnd: w.end,
      amount: w.amount,
      status: "DUE" as const,
    })),
  );
  return weeks.length;
}

// ---------- daily scheduled jobs ----------
// Marks overdue payments, recomputes reminders, writes an audit row.
export async function runDailyJobs(): Promise<{
  newOverdue: number;
  expiring: number;
  reminders: number;
}> {
  // 1) DUE payments whose week has fully elapsed become OVERDUE.
  const overdueResult = await db
    .update(payments)
    .set({ status: "OVERDUE" })
    .where(and(eq(payments.status, "DUE"), lte(payments.weekEnd, today())))
    .returning({ id: payments.id });
  const newOverdue = overdueResult.length;

  // 2) Rebuild reminders from current state.
  const allPayments = await db.select().from(payments);
  const allInsurance = await db.select().from(insurance);
  const allBookings = await db.select().from(bookings);
  const allRenters = await db.select().from(renters);

  const bookingById = new Map(allBookings.map((b) => [b.id, b]));
  const renterById = new Map(allRenters.map((r) => [r.id, r]));

  type NewReminder = {
    kind: "payment" | "insurance" | "license";
    sev: "low" | "med" | "high";
    title: string;
    detail: string;
  };
  const out: NewReminder[] = [];

  for (const p of allPayments.filter((x) => x.status === "OVERDUE")) {
    const b = bookingById.get(p.bookingId);
    const r = b ? renterById.get(b.renterId) : undefined;
    out.push({
      kind: "payment",
      sev: "high",
      title: `Overdue payment · ${money(p.amount)}`,
      detail: `${b ? b.referenceNumber : ""} · ${
        r ? r.firstName + " " + r.lastName : ""
      } · week of ${fmtShort(p.weekStart)}`,
    });
  }

  const expiringList = allInsurance.filter((i) => {
    const dleft = daysBetween(today(), i.expiryDate);
    return dleft >= 0 && dleft <= 14;
  });
  for (const i of expiringList) {
    const dleft = daysBetween(today(), i.expiryDate);
    const b = bookingById.get(i.bookingId);
    out.push({
      kind: "insurance",
      sev: dleft <= 3 ? "high" : "med",
      title: `Insurance expiring in ${dleft}d`,
      detail: `${i.providerName} · ${i.policyNumber}${
        b ? " · " + b.referenceNumber : ""
      }`,
    });
  }

  for (const r of allRenters) {
    if (!r.licenseExpiry) continue;
    const dleft = daysBetween(today(), r.licenseExpiry);
    if (dleft >= 0 && dleft <= 60) {
      out.push({
        kind: "license",
        sev: dleft <= 14 ? "high" : "low",
        title: `License expires in ${dleft}d`,
        detail: `${r.firstName} ${r.lastName} · ${r.licenseState} ${r.licenseNumber}`,
      });
    }
  }

  await db.delete(reminders);
  if (out.length > 0) {
    await db.insert(reminders).values(out.map((r) => ({ id: randomUUID(), ...r })));
  }

  // 3) Record last-run + audit.
  const at = today() + " " + new Date().toTimeString().slice(0, 5);
  await db
    .insert(systemMeta)
    .values({ key: "lastJobRun", value: at })
    .onConflictDoUpdate({
      target: systemMeta.key,
      set: { value: at, updatedAt: new Date() },
    });
  await logAudit({
    actor: { id: null, name: "System (cron)" },
    entityType: "PAYMENT",
    entityId: "Daily automations",
    action: "Ran scheduled jobs",
  });

  return { newOverdue, expiring: expiringList.length, reminders: out.length };
}

export async function lastJobRun(): Promise<string | null> {
  const rows = await db
    .select()
    .from(systemMeta)
    .where(eq(systemMeta.key, "lastJobRun"))
    .limit(1);
  return rows[0]?.value ?? null;
}

// Canonical photo views per vehicle (shared admin + public).
export { VEHICLE_VIEW_LABELS, VEHICLE_VIEWS } from "./views";
