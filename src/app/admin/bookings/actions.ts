"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { bookings, renters, vehicles } from "@/lib/db/schema";
import { isAvailable, generatePayments, logAudit } from "@/lib/biz";
import { statusMeta } from "@/lib/status";
import { sendEmail } from "@/lib/email";
import { bookingEmail } from "@/lib/email-templates";

// Notify the renter when a request is approved or declined. Best-effort:
// env-gated (no-op without RESEND_API_KEY) and never throws into the action.
async function notifyDecision(
  b: { renterId: string; vehicleId: string; referenceNumber: string; startDate: string; endDate: string },
  kind: "approved" | "declined",
  reason?: string,
): Promise<void> {
  try {
    const [renter] = await db
      .select({ email: renters.email, firstName: renters.firstName })
      .from(renters)
      .where(eq(renters.id, b.renterId))
      .limit(1);
    const [veh] = await db
      .select({ year: vehicles.year, make: vehicles.make, model: vehicles.model, color: vehicles.color })
      .from(vehicles)
      .where(eq(vehicles.id, b.vehicleId))
      .limit(1);
    if (!renter?.email || !veh) return;
    const { subject, html } = bookingEmail(kind, {
      firstName: renter.firstName,
      reference: b.referenceNumber,
      vehicleLabel: `${veh.year} ${veh.make} ${veh.model}`,
      color: veh.color,
      startDate: b.startDate,
      endDate: b.endDate,
      reason,
    });
    await sendEmail({ to: [renter.email], subject, html });
  } catch {
    /* best-effort */
  }
}

type Status =
  | "REQUESTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "ACTIVE"
  | "COMPLETED";

// Legal lifecycle transitions — enforced server-side.
const LEGAL: Record<Status, Status[]> = {
  REQUESTED: ["UNDER_REVIEW", "APPROVED", "REJECTED"],
  UNDER_REVIEW: ["APPROVED", "REJECTED"],
  APPROVED: ["ACTIVE"],
  ACTIVE: ["COMPLETED"],
  REJECTED: [],
  COMPLETED: [],
};

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function transitionBooking(
  bookingId: string,
  to: Status,
  reason?: string,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Unauthorized" };

  const rows = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
  const b = rows[0];
  if (!b) return { ok: false, error: "Booking not found." };

  const from = b.status as Status;
  if (!LEGAL[from]?.includes(to)) {
    return { ok: false, error: `Cannot move from ${from} to ${to}.` };
  }

  if (to === "APPROVED") {
    const available = await isAvailable(b.vehicleId, b.startDate, b.endDate, b.id);
    if (!available) {
      return {
        ok: false,
        error: "Another approved or active booking overlaps these dates.",
      };
    }
  }

  await db
    .update(bookings)
    .set({ status: to, rejectReason: to === "REJECTED" ? reason || "No reason given" : b.rejectReason })
    .where(eq(bookings.id, bookingId));

  // Approval generates the weekly payment schedule.
  if (to === "APPROVED") {
    await generatePayments(bookingId);
  }

  // Notify the renter of an approval / decline.
  if (to === "APPROVED") await notifyDecision(b, "approved");
  else if (to === "REJECTED") await notifyDecision(b, "declined", reason || b.rejectReason || undefined);

  await logAudit({
    entityType: "BOOKING",
    entityId: b.referenceNumber,
    action: `Status → ${statusMeta(to).label}`,
    changes: reason
      ? { status: [from, to], reason: ["—", reason || "No reason given"] }
      : { status: [from, to] },
  });

  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin");
  revalidatePath("/admin/payments");
  return { ok: true };
}

export async function bulkTransition(
  ids: string[],
  to: "APPROVED" | "REJECTED",
): Promise<{ ok: boolean; applied: number; skipped: number }> {
  const session = await auth();
  if (!session?.user) return { ok: false, applied: 0, skipped: 0 };

  let applied = 0;
  let skipped = 0;

  for (const id of ids) {
    const rows = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
    const b = rows[0];
    if (!b) {
      skipped++;
      continue;
    }
    const from = b.status as Status;
    if (from !== "REQUESTED" && from !== "UNDER_REVIEW") {
      skipped++;
      continue;
    }
    if (to === "APPROVED") {
      const available = await isAvailable(b.vehicleId, b.startDate, b.endDate, b.id);
      if (!available) {
        skipped++;
        continue;
      }
    }

    await db.update(bookings).set({ status: to }).where(eq(bookings.id, id));
    if (to === "APPROVED") await generatePayments(id);

    await notifyDecision(b, to === "APPROVED" ? "approved" : "declined");

    await logAudit({
      entityType: "BOOKING",
      entityId: b.referenceNumber,
      action: `${to === "APPROVED" ? "Approved" : "Rejected"} booking (bulk)`,
      changes: { status: [from, to] },
    });
    applied++;
  }

  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
  revalidatePath("/admin/payments");
  return { ok: true, applied, skipped };
}
