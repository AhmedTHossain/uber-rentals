import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { payments, bookings, renters } from "@/lib/db/schema";
import { canMarkPaid } from "@/lib/biz";
import { PaymentsTable, type PaymentRow } from "./PaymentsTable";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const rows = await db
    .select({
      id: payments.id,
      weekStart: payments.weekStart,
      weekEnd: payments.weekEnd,
      amount: payments.amount,
      status: payments.status,
      bookingId: bookings.id,
      bookingRef: bookings.referenceNumber,
      insuranceType: bookings.insuranceTypeChoice,
      firstName: renters.firstName,
      lastName: renters.lastName,
    })
    .from(payments)
    .innerJoin(bookings, eq(payments.bookingId, bookings.id))
    .innerJoin(renters, eq(bookings.renterId, renters.id))
    .orderBy(payments.weekStart);

  // Compute insurance-rule status once per booking.
  const uniqueBookings = new Map<string, "COMPANY" | "CUSTOMER">();
  rows.forEach((r) => uniqueBookings.set(r.bookingId, r.insuranceType as "COMPANY" | "CUSTOMER"));
  const blockedMap = new Map<string, boolean>();
  await Promise.all(
    [...uniqueBookings.entries()].map(async ([id, insuranceTypeChoice]) => {
      const check = await canMarkPaid({ id, insuranceTypeChoice });
      blockedMap.set(id, !check.ok);
    }),
  );

  const data: PaymentRow[] = rows.map((r) => ({
    id: r.id,
    weekStart: r.weekStart,
    weekEnd: r.weekEnd,
    amount: r.amount,
    status: r.status,
    bookingRef: r.bookingRef,
    insuranceType: r.insuranceType,
    renterName: `${r.firstName} ${r.lastName}`,
    blocked: r.insuranceType === "COMPANY" && (blockedMap.get(r.bookingId) ?? false),
  }));

  const totals = {
    paid: data.filter((p) => p.status === "PAID").reduce((s, p) => s + p.amount, 0),
    due: data.filter((p) => p.status === "DUE").reduce((s, p) => s + p.amount, 0),
    overdue: data.filter((p) => p.status === "OVERDUE").reduce((s, p) => s + p.amount, 0),
  };

  return <PaymentsTable rows={data} totals={totals} />;
}
