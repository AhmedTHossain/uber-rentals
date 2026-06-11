"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { payments, bookings } from "@/lib/db/schema";
import { canMarkPaid, logAudit } from "@/lib/biz";

export type MarkPaidResult = { ok: true } | { ok: false; reason: string };

export async function markPaid(paymentId: string): Promise<MarkPaidResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, reason: "Unauthorized" };

  const rows = await db
    .select({ p: payments, b: bookings })
    .from(payments)
    .innerJoin(bookings, eq(payments.bookingId, bookings.id))
    .where(eq(payments.id, paymentId))
    .limit(1);
  const row = rows[0];
  if (!row) return { ok: false, reason: "Payment not found." };
  if (row.p.status === "PAID") return { ok: true };

  // Authoritative insurance enforcement before recording a payment.
  const check = await canMarkPaid({ id: row.b.id, insuranceTypeChoice: row.b.insuranceTypeChoice });
  if (!check.ok) return { ok: false, reason: check.reason };

  await db
    .update(payments)
    .set({ status: "PAID", paidAt: new Date() })
    .where(eq(payments.id, paymentId));

  await logAudit({
    entityType: "PAYMENT",
    entityId: row.b.referenceNumber,
    action: "Marked payment PAID",
    changes: { status: [row.p.status, "PAID"] },
  });

  revalidatePath("/admin/payments");
  revalidatePath("/admin");
  return { ok: true };
}
