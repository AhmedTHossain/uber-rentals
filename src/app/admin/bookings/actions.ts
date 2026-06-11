"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { bookings } from "@/lib/db/schema";
import { isAvailable, generatePayments, logAudit } from "@/lib/biz";
import { statusMeta } from "@/lib/status";

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
