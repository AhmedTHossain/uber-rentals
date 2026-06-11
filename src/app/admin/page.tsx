import Link from "next/link";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookings, payments, renters, vehicles, auditLogs } from "@/lib/db/schema";
import { insuranceExpiringSoon, today } from "@/lib/biz";
import { money, fmtShort, daysBetween } from "@/lib/format";
import { Stat } from "@/components/primitives";
import { Badge } from "@/components/Badge";
import { SectionHead, Empty } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const [activeRows, allPayments, expiring, needReview, recent] = await Promise.all([
    db.select({ id: bookings.id }).from(bookings).where(eq(bookings.status, "ACTIVE")),
    db.select().from(payments),
    insuranceExpiringSoon(),
    db
      .select({
        id: bookings.id,
        reference: bookings.referenceNumber,
        status: bookings.status,
        startDate: bookings.startDate,
        endDate: bookings.endDate,
        firstName: renters.firstName,
        lastName: renters.lastName,
        make: vehicles.make,
        model: vehicles.model,
      })
      .from(bookings)
      .innerJoin(renters, eq(bookings.renterId, renters.id))
      .innerJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
      .where(inArray(bookings.status, ["REQUESTED", "UNDER_REVIEW"]))
      .orderBy(desc(bookings.createdAt)),
    db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(4),
  ]);

  const overdue = allPayments.filter((p) => p.status === "OVERDUE");
  const upcoming = allPayments.filter((p) => p.status === "DUE" && p.weekStart >= today());
  const overdueTotal = overdue.reduce((s, p) => s + p.amount, 0);
  const upcomingTotal = upcoming.reduce((s, p) => s + p.amount, 0);

  // booking reference lookup for expiring insurance
  const expBookingIds = expiring.map((i) => i.bookingId);
  const expBookings =
    expBookingIds.length > 0
      ? await db
          .select({ id: bookings.id, reference: bookings.referenceNumber })
          .from(bookings)
          .where(inArray(bookings.id, expBookingIds))
      : [];
  const refById = new Map(expBookings.map((b) => [b.id, b.reference]));

  return (
    <div>
      {/* stat row */}
      <div className="r-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18, marginBottom: 26 }}>
        <Stat label="Active Rentals" value={activeRows.length} sub={`${activeRows.length} vehicles on the road`} />
        <Stat label="Overdue Payments" value={overdue.length} tone={overdue.length ? "red" : undefined} sub={`${money(overdueTotal)} outstanding`} />
        <Stat label="Upcoming Payments" value={upcoming.length} sub={`${money(upcomingTotal)} due soon`} />
        <Stat label="Insurance Expiring" value={expiring.length} tone={expiring.length ? "amber" : undefined} sub="within 14 days" />
      </div>

      <div className="r-split" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 22 }}>
        {/* review queue */}
        <div className="card" style={{ padding: "4px 0" }}>
          <SectionHead title="Needs your review" actionHref="/admin/bookings" actionLabel="All bookings →" count={needReview.length} />
          {needReview.length === 0 && <Empty text="Queue is clear." />}
          {needReview.map((b) => (
            <Link
              key={b.id}
              href={`/admin/bookings/${b.id}`}
              className="hover-row"
              style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 22px", borderTop: "1px solid var(--border)", color: "inherit" }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="mono" style={{ fontSize: 12, color: "var(--accent)" }}>
                  {b.reference}
                </div>
                <div style={{ fontSize: 14, marginTop: 3, color: "var(--text)" }}>
                  {b.firstName} {b.lastName} ·{" "}
                  <span style={{ color: "var(--text-dim)" }}>
                    {b.make} {b.model}
                  </span>
                </div>
              </div>
              <div style={{ fontSize: 12.5, color: "var(--text-dim)", whiteSpace: "nowrap" }}>
                {fmtShort(b.startDate)}–{fmtShort(b.endDate)}
              </div>
              <Badge status={b.status} />
            </Link>
          ))}
        </div>

        {/* expiring insurance + activity */}
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div className="card" style={{ padding: "4px 0" }}>
            <SectionHead title="Insurance expiring" actionHref="/admin/insurance" actionLabel="Manage →" count={expiring.length} />
            {expiring.length === 0 && <Empty text="Nothing expiring soon." />}
            {expiring.map((i) => {
              const dleft = daysBetween(today(), i.expiryDate);
              return (
                <Link
                  key={i.id}
                  href="/admin/insurance"
                  className="hover-row"
                  style={{ display: "block", padding: "12px 22px", borderTop: "1px solid var(--border)", color: "inherit" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 13.5, color: "var(--text)" }}>{i.providerName}</div>
                    <Badge status={dleft <= 3 ? "OVERDUE" : "PENDING"}>{dleft}d left</Badge>
                  </div>
                  <div className="mono" style={{ fontSize: 11.5, color: "var(--text-dim)", marginTop: 4 }}>
                    {refById.get(i.bookingId) ?? ""} · {i.type}
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="card" style={{ padding: "4px 0" }}>
            <SectionHead title="Recent activity" actionHref="/admin/audit" actionLabel="Audit log →" />
            {recent.map((a) => (
              <div key={a.id} style={{ padding: "11px 22px", borderTop: "1px solid var(--border)" }}>
                <div style={{ fontSize: 13, color: "var(--text)" }}>{a.action}</div>
                <div className="mono" style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 3 }}>
                  {a.admin} · {fmtAuditTime(a.createdAt)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function fmtAuditTime(d: Date): string {
  // Render as "YYYY-MM-DD HH:MM" to match the prototype style.
  const iso = d.toISOString();
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)}`;
}
