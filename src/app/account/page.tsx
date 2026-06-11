import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq, inArray } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { bookings, vehicles, payments, insurance } from "@/lib/db/schema";
import { Logo } from "@/components/Logo";
import { Badge } from "@/components/Badge";
import { money, fmtDate, fmtShort } from "@/lib/format";
import { SignOutButton } from "./SignOutButton";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await auth();
  const user = session?.user as { id?: string; name?: string; kind?: string } | undefined;
  if (user?.kind !== "renter" || !user.id) redirect("/account/login");
  const renterId = user.id;

  // Row-level: only this renter's bookings.
  const myBookings = await db
    .select({
      id: bookings.id,
      reference: bookings.referenceNumber,
      status: bookings.status,
      startDate: bookings.startDate,
      endDate: bookings.endDate,
      insuranceType: bookings.insuranceTypeChoice,
      year: vehicles.year,
      make: vehicles.make,
      model: vehicles.model,
    })
    .from(bookings)
    .innerJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
    .where(eq(bookings.renterId, renterId))
    .orderBy(desc(bookings.createdAt));

  const bookingIds = myBookings.map((b) => b.id);
  const [pays, ins] = await Promise.all([
    bookingIds.length
      ? db.select().from(payments).where(inArray(payments.bookingId, bookingIds))
      : Promise.resolve([]),
    bookingIds.length
      ? db.select().from(insurance).where(inArray(insurance.bookingId, bookingIds))
      : Promise.resolve([]),
  ]);
  const paysByBooking = new Map<string, typeof pays>();
  for (const p of pays) {
    const arr = paysByBooking.get(p.bookingId) ?? [];
    arr.push(p);
    paysByBooking.set(p.bookingId, arr);
  }
  const insByBooking = new Map(ins.map((i) => [i.bookingId, i]));

  const outstanding = pays
    .filter((p) => p.status === "DUE" || p.status === "OVERDUE")
    .reduce((s, p) => s + p.amount, 0);

  return (
    <div className="theme-light" style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "22px 42px",
          borderBottom: "1px solid var(--border)",
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        <Link href="/">
          <Logo tagline />
        </Link>
        <nav style={{ display: "flex", alignItems: "center", gap: 22, fontSize: 13.5 }}>
          <Link href="/" className="nav-link" style={{ color: "var(--text-dim)" }}>
            Browse fleet
          </Link>
          <span style={{ color: "var(--text-dim)" }}>{user.name}</span>
          <SignOutButton />
        </nav>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 42px 80px" }}>
        <div className="eyebrow">Renter portal</div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 38, margin: "8px 0 0" }}>
          Your requests
        </h1>
        <p style={{ color: "var(--text-dim)", fontSize: 15, marginTop: 10 }}>
          {myBookings.length === 0
            ? "You haven't requested a vehicle yet."
            : outstanding > 0
              ? `${money(outstanding)} in weekly payments outstanding across your rentals.`
              : "All your weekly payments are up to date."}
        </p>

        {myBookings.length === 0 ? (
          <div className="card" style={{ padding: "40px", textAlign: "center", marginTop: 26 }}>
            <p style={{ color: "var(--text-dim)", marginTop: 0 }}>Browse the fleet to make your first request.</p>
            <Link href="/" className="btn btn-gold" style={{ marginTop: 8 }}>
              Browse the fleet
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 26 }}>
            {myBookings.map((b) => {
              const weeks = (paysByBooking.get(b.id) ?? []).sort((a, p) => a.weekStart.localeCompare(p.weekStart));
              const policy = insByBooking.get(b.id);
              return (
                <div key={b.id} className="card" style={{ padding: "22px 24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
                    <div>
                      <div className="mono" style={{ fontSize: 12, color: "var(--accent)" }}>{b.reference}</div>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, marginTop: 4 }}>
                        {b.year} {b.make} {b.model}
                      </div>
                      <div style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 4 }}>
                        {fmtDate(b.startDate)} → {fmtDate(b.endDate)} · {b.insuranceType === "COMPANY" ? "Company coverage" : "Customer policy"}
                        {policy ? ` · insurance ${policy.status.toLowerCase()}` : ""}
                      </div>
                    </div>
                    <Badge status={b.status} />
                  </div>

                  {weeks.length > 0 && (
                    <div style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                      <div className="eyebrow" style={{ color: "var(--text-faint)", marginBottom: 8 }}>
                        Weekly payments
                      </div>
                      {weeks.map((p, i) => (
                        <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "7px 0" }}>
                          <span className="mono" style={{ fontSize: 11.5, color: "var(--text-faint)", width: 30 }}>W{i + 1}</span>
                          <span style={{ fontSize: 13, color: "var(--text-dim)", flex: 1 }}>
                            {fmtShort(p.weekStart)} – {fmtShort(p.weekEnd)}
                          </span>
                          <span style={{ fontSize: 13.5 }}>{money(p.amount)}</span>
                          <Badge status={p.status} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
