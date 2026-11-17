import Link from "next/link";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookings, payments, vehicles, auditLogs } from "@/lib/db/schema";
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
        firstName: bookings.driverFirstName,
        lastName: bookings.driverLastName,
        make: vehicles.make,
        model: vehicles.model,
      })
      .from(bookings)
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
      {/* Each sub-line qualifies its figure rather than restating it — the
          first tile used to read "3" over "3 vehicles on the road". */}
      <div className="r-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18, marginBottom: 26 }}>
        <Stat label="Active rentals" value={activeRows.length} sub="currently on the road" />
        <Stat label="Overdue payments" value={overdue.length} tone="red" sub={`${money(overdueTotal)} outstanding`} />
        <Stat label="Upcoming payments" value={upcoming.length} sub={`${money(upcomingTotal)} due soon`} />
        <Stat label="Insurance expiring" value={expiring.length} tone="amber" sub="within 14 days" />
      </div>

      <div className="r-split" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 22 }}>
        {/* review queue */}
        <div className="card" style={{ padding: 0 }}>
          <SectionHead title="Needs your review" actionHref="/admin/bookings" actionLabel="All bookings →" count={needReview.length} />
          {needReview.length === 0 && <Empty text="Queue is clear." />}
          {needReview.map((b) => (
            <Link
              key={b.id}
              href={`/admin/bookings/${b.id}`}
              className="hover-row"
              style={{ display: "flex", alignItems: "center", gap: 14, padding: "var(--row-pad) var(--s5)", borderTop: "1px solid var(--border)", color: "inherit" }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* `.ref` rather than a bare `.mono`: it is the same mono /
                    accent / small type, and it carries the nowrap an
                    identifier needs. Without it a narrow column broke the
                    reference across two lines mid-token — "CR-20260530-"
                    over "0011" — which is unreadable and unsearchable. */}
                <div className="ref">{b.reference}</div>
                <div style={{ fontSize: "var(--t-md)", marginTop: 3, color: "var(--text)" }}>
                  {b.firstName} {b.lastName} ·{" "}
                  <span style={{ color: "var(--text-dim)" }}>
                    {b.make} {b.model}
                  </span>
                </div>
              </div>
              {/* The dates are the one thing here the booking screen repeats
                  in full, so on a phone they give their width back to the
                  name and vehicle. */}
              <div className="hide-sm" style={{ fontSize: "var(--t-sm)", color: "var(--text-dim)", whiteSpace: "nowrap" }}>
                {fmtShort(b.startDate)}–{fmtShort(b.endDate)}
              </div>
              <Badge status={b.status} />
            </Link>
          ))}
        </div>

        {/* expiring insurance + activity */}
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div className="card" style={{ padding: 0 }}>
            <SectionHead title="Insurance expiring" actionHref="/admin/insurance" actionLabel="Manage →" count={expiring.length} />
            {expiring.length === 0 && <Empty text="Nothing expiring soon." />}
            {expiring.map((i) => {
              const dleft = daysBetween(today(), i.expiryDate);
              return (
                <Link
                  key={i.id}
                  href="/admin/insurance"
                  className="hover-row"
                  style={{ display: "block", padding: "var(--row-pad) var(--s5)", borderTop: "1px solid var(--border)", color: "inherit" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "var(--t-base)", color: "var(--text)" }}>{i.providerName}</div>
                    {/* Spell out the unit. Badges uppercase their label, so
                        "9d left" rendered as "9D LEFT" — and a capital D in
                        DM Mono at this size reads as a zero, making a policy
                        9 days from expiry look like it had 90. */}
                    <Badge status={dleft <= 3 ? "OVERDUE" : "PENDING"}>
                      {dleft} {dleft === 1 ? "day" : "days"} left
                    </Badge>
                  </div>
                  <div className="mono" style={{ fontSize: "var(--t-xs)", color: "var(--text-dim)", marginTop: 4 }}>
                    {refById.get(i.bookingId) ?? ""} · {i.type}
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="card" style={{ padding: 0 }}>
            <SectionHead title="Recent activity" actionHref="/admin/audit" actionLabel="Audit log →" />
            {recent.map((a) => (
              <div key={a.id} style={{ padding: "var(--row-pad) var(--s5)", borderTop: "1px solid var(--border)" }}>
                <div style={{ fontSize: "var(--t-base)", color: "var(--text)" }}>{a.action}</div>
                <div className="mono" style={{ fontSize: "var(--t-xs)", color: "var(--text-dim)", marginTop: 3 }}>
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
