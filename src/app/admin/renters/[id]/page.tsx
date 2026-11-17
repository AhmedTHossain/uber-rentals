import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { renters, bookings, vehicles } from "@/lib/db/schema";
import { money, fmtDate, fmtShort, daysBetween, today } from "@/lib/format";
import { Avatar, InfoRow } from "@/components/primitives";
import { Badge } from "@/components/Badge";
import { PhotoSlot } from "@/components/PhotoSlot";
import { SectionHead, Empty } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function RenterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const rRows = await db.select().from(renters).where(eq(renters.id, id)).limit(1);
  const r = rRows[0];
  if (!r) notFound();

  const bk = await db
    .select({
      id: bookings.id,
      reference: bookings.referenceNumber,
      status: bookings.status,
      startDate: bookings.startDate,
      endDate: bookings.endDate,
      createdAt: bookings.createdAt,
      year: vehicles.year,
      make: vehicles.make,
      model: vehicles.model,
      weeklyPrice: vehicles.weeklyPrice,
      vehicleStatus: bookings.status,
    })
    .from(bookings)
    .innerJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
    .where(eq(bookings.renterId, id))
    .orderBy(desc(bookings.createdAt));

  const spend = bk
    .filter((b) => b.status === "ACTIVE" || b.status === "COMPLETED")
    .reduce((s, b) => {
      const wk = Math.max(1, Math.ceil(daysBetween(b.startDate, b.endDate) / 7));
      return s + b.weeklyPrice * wk;
    }, 0);
  const memberSince = bk.length ? bk[bk.length - 1].createdAt : null;
  const licExpired = !!r.licenseExpiry && r.licenseExpiry < today();

  return (
    <div>
      {/* Navigation, not an action — the same treatment the public detail
          page uses, instead of a ghost button sized like "Save changes". */}
      <Link href="/admin/renters" className="backlink" style={{ marginBottom: "var(--s5)" }}>
        ← All renters
      </Link>
      <div className="r-split" style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "var(--s6)", alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s6)" }}>
          <div className="card" style={{ padding: "var(--s6) var(--s5)", textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "var(--s3)" }}>
              <Avatar name={`${r.firstName} ${r.lastName}`} size={64} />
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--d-lg)", fontWeight: 600 }}>
              {r.firstName} {r.lastName}
            </div>
            <div style={{ fontSize: "var(--t-base)", color: "var(--text-dim)", marginTop: "var(--s1)" }}>
              Member since {fmtDate(memberSince ? memberSince.toISOString().slice(0, 10) : today())}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "var(--border)", borderRadius: "var(--r-md)", overflow: "hidden", marginTop: "var(--s5)" }}>
              <div style={{ background: "var(--surface)", padding: "var(--s4)" }}>
                <div className="kpi-num" style={{ fontSize: "var(--d-lg)" }}>{bk.length}</div>
                <div style={{ fontSize: "var(--t-xs)", color: "var(--text-dim)", marginTop: "var(--s1)" }}>Bookings</div>
              </div>
              <div style={{ background: "var(--surface)", padding: "var(--s4)" }}>
                <div className="kpi-num" style={{ fontSize: "var(--d-lg)", color: "var(--accent-ink)" }}>{money(spend)}</div>
                <div style={{ fontSize: "var(--t-xs)", color: "var(--text-dim)", marginTop: "var(--s1)" }}>Lifetime</div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: "var(--s5)" }}>
            <h3 className="h-panel" style={{ marginBottom: "var(--s3)" }}>Contact</h3>
            <InfoRow k="Email" v={r.email} />
            <InfoRow k="Phone" v={r.phone} mono />
            <InfoRow k="DOB" v={fmtDate(r.dob)} />
            <InfoRow k="Address" v={r.street} />
            <InfoRow k="City" v={`${r.city}, ${r.state} ${r.zip}`} />
          </div>

          <div className="card" style={{ padding: "var(--s5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--s3)" }}>
              <h3 className="h-panel">Driver license</h3>
              <Badge status={licExpired ? "REJECTED" : "VERIFIED"}>{licExpired ? "Expired" : "Valid"}</Badge>
            </div>
            {/* Sentence case, and a radius that is on the scale — 10px was a
                fourth corner size appearing nowhere else. */}
            <div className="r-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s3)", marginBottom: "var(--s4)" }}>
              <div>
                <div className="field-label">License — front</div>
                <PhotoSlot label="Scanned document" src={r.licenseFrontUrl} ratio="16 / 10" radius={8} readOnly />
              </div>
              <div>
                <div className="field-label">License — back</div>
                <PhotoSlot label="Scanned document" src={r.licenseBackUrl} ratio="16 / 10" radius={8} readOnly />
              </div>
            </div>
            <InfoRow k="Number" v={r.licenseNumber} mono />
            <InfoRow k="State" v={r.licenseState} />
            <InfoRow k="Expiry" v={fmtDate(r.licenseExpiry)} />
          </div>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <SectionHead title="Booking history" count={bk.length} />
          {bk.length === 0 && <Empty text="No bookings yet." />}
          {bk.map((b) => (
            // `.card-row` is the shared row: same padding as every other list
            // in the admin, which this one was missing by 8px horizontally.
            <Link
              key={b.id}
              href={`/admin/bookings/${b.id}`}
              className="card-row"
              style={{ borderBottom: 0, borderTop: "1px solid var(--border)" }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <span className="ref">{b.reference}</span>
                <div style={{ fontSize: "var(--t-md)", marginTop: "var(--s1)" }}>
                  {b.year} {b.make} {b.model}
                </div>
              </div>
              <div style={{ fontSize: "var(--t-sm)", color: "var(--text-dim)", whiteSpace: "nowrap" }}>
                {fmtShort(b.startDate)}–{fmtShort(b.endDate)}
              </div>
              <Badge status={b.status} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
