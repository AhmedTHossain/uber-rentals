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
      <Link href="/admin/renters" className="btn btn-ghost btn-sm" style={{ marginBottom: 20, display: "inline-flex" }}>
        ← All renters
      </Link>
      <div className="r-split" style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 22, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div className="card" style={{ padding: "26px 24px", textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
              <Avatar name={`${r.firstName} ${r.lastName}`} size={68} />
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 600 }}>
              {r.firstName} {r.lastName}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 4 }}>
              Member since {fmtDate(memberSince ? memberSince.toISOString().slice(0, 10) : today())}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "var(--border)", borderRadius: 10, overflow: "hidden", marginTop: 20 }}>
              <div style={{ background: "var(--surface)", padding: "14px" }}>
                <div className="kpi-num" style={{ fontSize: 26 }}>{bk.length}</div>
                <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 3 }}>Bookings</div>
              </div>
              <div style={{ background: "var(--surface)", padding: "14px" }}>
                <div className="kpi-num" style={{ fontSize: 26, color: "var(--accent)" }}>{money(spend)}</div>
                <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 3 }}>Lifetime</div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: "20px 22px" }}>
            <h3 style={{ margin: "0 0 12px", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 18 }}>Contact</h3>
            <InfoRow k="Email" v={r.email} />
            <InfoRow k="Phone" v={r.phone} mono />
            <InfoRow k="DOB" v={fmtDate(r.dob)} />
            <InfoRow k="Address" v={r.street} />
            <InfoRow k="City" v={`${r.city}, ${r.state} ${r.zip}`} />
          </div>

          <div className="card" style={{ padding: "20px 22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 18 }}>Driver license</h3>
              <Badge status={licExpired ? "REJECTED" : "VERIFIED"}>{licExpired ? "Expired" : "Valid"}</Badge>
            </div>
            <div className="r-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <div className="field-label">License — front</div>
                <PhotoSlot label="SCANNED DOCUMENT" src={r.licenseFrontUrl} ratio="16 / 10" radius={10} readOnly />
              </div>
              <div>
                <div className="field-label">License — back</div>
                <PhotoSlot label="SCANNED DOCUMENT" src={r.licenseBackUrl} ratio="16 / 10" radius={10} readOnly />
              </div>
            </div>
            <InfoRow k="Number" v={r.licenseNumber} mono />
            <InfoRow k="State" v={r.licenseState} />
            <InfoRow k="Expiry" v={fmtDate(r.licenseExpiry)} />
          </div>
        </div>

        <div className="card" style={{ padding: "4px 0" }}>
          <SectionHead title="Booking history" count={bk.length} />
          {bk.length === 0 && <Empty text="No bookings yet." />}
          {bk.map((b) => (
            <Link
              key={b.id}
              href={`/admin/bookings/${b.id}`}
              className="hover-row"
              style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 22px", borderTop: "1px solid var(--border)", color: "inherit" }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="mono" style={{ fontSize: 12, color: "var(--accent)" }}>{b.reference}</div>
                <div style={{ fontSize: 14, marginTop: 3 }}>
                  {b.year} {b.make} {b.model}
                </div>
              </div>
              <div style={{ fontSize: 12.5, color: "var(--text-dim)", whiteSpace: "nowrap" }}>
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
