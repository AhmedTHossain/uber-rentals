import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookings, renters, vehicles, insurance, payments } from "@/lib/db/schema";
import { isAvailable } from "@/lib/biz";
import { money, fmtDate, fmtShort } from "@/lib/format";
import { statusMeta } from "@/lib/status";
import { Badge } from "@/components/Badge";
import { InfoRow } from "@/components/primitives";
import { PhotoSlot } from "@/components/PhotoSlot";
import { SectionHead, Empty } from "@/components/admin/ui";
import { BookingActions } from "./BookingActions";

export const dynamic = "force-dynamic";

const LIFECYCLE = ["REQUESTED", "UNDER_REVIEW", "APPROVED", "ACTIVE", "COMPLETED"];

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const rows = await db
    .select({
      b: bookings,
      r: renters,
      v: vehicles,
    })
    .from(bookings)
    .innerJoin(renters, eq(bookings.renterId, renters.id))
    .innerJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
    .where(eq(bookings.id, id))
    .limit(1);
  const row = rows[0];
  if (!row) notFound();
  const { b, r, v } = row;

  const [insRows, payRows] = await Promise.all([
    db.select().from(insurance).where(eq(insurance.bookingId, id)).limit(1),
    db.select().from(payments).where(eq(payments.bookingId, id)),
  ]);
  const ins = insRows[0] ?? null;
  const pays = payRows.sort((a, p) => a.weekStart.localeCompare(p.weekStart));

  // A renter row with no password was created by a guest request rather than a
  // signup. Worth surfacing: there is no verified owner behind these details.
  const guestRequest = !r.passwordHash;
  // Flag the case the snapshot exists for — a request filed under an existing
  // account whose stored profile says something different.
  const differsFromAccount =
    b.driverEmail.toLowerCase() !== r.email.toLowerCase() ||
    b.driverFirstName !== r.firstName ||
    b.driverLastName !== r.lastName ||
    b.driverLicenseNumber !== r.licenseNumber;

  const conflict = !(await isAvailable(b.vehicleId, b.startDate, b.endDate, b.id));
  const rejected = b.status === "REJECTED";
  const stageIdx = LIFECYCLE.indexOf(b.status);

  return (
    <div>
      <Link href="/admin/bookings" className="btn btn-ghost btn-sm" style={{ marginBottom: 20, display: "inline-flex" }}>
        ← All bookings
      </Link>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, marginBottom: 24, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="mono" style={{ fontSize: "var(--d-sm)", color: "var(--accent-ink)" }}>{b.referenceNumber}</span>
            <Badge status={b.status} />
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--d-lg)", fontWeight: 600, marginTop: 8, color: "var(--text)" }}>
            {b.driverFirstName} {b.driverLastName} · {v.model}
          </div>
        </div>
        <BookingActions
          bookingId={b.id}
          reference={b.referenceNumber}
          status={b.status}
          model={v.model}
          startDate={b.startDate}
          endDate={b.endDate}
          conflict={conflict}
        />
      </div>

      <div className="r-split" style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 22, alignItems: "start" }}>
        {/* left: timeline + vehicle */}
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div className="card" style={{ padding: "var(--s5)" }}>
            <h3 className="h-panel" style={{ margin: "0 0 18px" }}>
              Booking timeline
            </h3>
            {LIFECYCLE.map((s, i) => {
              const done = !rejected && i < stageIdx;
              const current = !rejected && i === stageIdx;
              return (
                <div key={s} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div className={`tl-dot ${done ? "done" : ""} ${current ? "current" : ""}`} />
                    {i < LIFECYCLE.length - 1 && (
                      <div style={{ width: 2, height: 30, background: done ? "var(--accent)" : "var(--border)" }} />
                    )}
                  </div>
                  <div style={{ paddingBottom: 14 }}>
                    <div style={{ fontSize: "var(--t-base)", fontWeight: current ? 600 : 400, color: done || current ? "var(--text)" : "var(--text-faint)" }}>
                      {statusMeta(s).label}
                    </div>
                    {current && (
                      <div style={{ marginTop: 3 }}>
                        <span className="badge badge-neutral">Current</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {rejected && (
              <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 4 }}>
                <div className="tl-dot reject" />
                <div style={{ fontSize: "var(--t-base)", fontWeight: 600, color: "var(--st-red-fg)" }}>Rejected</div>
              </div>
            )}
            {rejected && b.rejectReason && (
              <p style={{ fontSize: "var(--t-sm)", color: "var(--text-dim)", marginTop: 6, marginBottom: 0 }}>
                Reason: {b.rejectReason}
              </p>
            )}
          </div>

          <div className="card" style={{ overflow: "hidden" }}>
            <PhotoSlot label="Cover" src={null} ratio="16 / 9" radius={0} readOnly />
            <div style={{ padding: "var(--s4) var(--s5)" }}>
              <div className="eyebrow" style={{ color: "var(--text-faint)" }}>Vehicle</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--d-sm)", fontWeight: 600, marginTop: 4 }}>
                {v.make} {v.model}
              </div>
              <div style={{ marginTop: 10 }}>
                <InfoRow k="Plate" v={v.plate} mono />
                <InfoRow k="Weekly rate" v={money(v.weeklyPrice)} />
                <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", fontSize: "var(--t-base)" }}>
                  <span style={{ color: "var(--text-dim)" }}>Status</span>
                  <Link href="/admin/vehicles" style={{ color: "var(--accent-ink)" }}>
                    {statusMeta(v.status).label}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* right: renter + insurance + payments */}
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div className="card" style={{ padding: "var(--s5)" }}>
            <h3 className="h-panel" style={{ margin: "0 0 4px" }}>
              Driver &amp; license
            </h3>
            <p style={{ margin: "0 0 14px", fontSize: "var(--t-sm)", color: "var(--text-faint)" }}>
              As submitted with this request{guestRequest ? " · no account" : ""}
            </p>
            <div className="r-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 var(--s7)" }}>
              <InfoRow k="Name" v={`${b.driverFirstName} ${b.driverLastName}`} />
              <InfoRow k="DOB" v={fmtDate(b.driverDob)} />
              <InfoRow k="Email" v={b.driverEmail} />
              <InfoRow k="Phone" v={b.driverPhone} mono />
              <InfoRow k="Address" v={`${b.driverCity}, ${b.driverState}`} />
              <InfoRow k="License #" v={b.driverLicenseNumber} mono />
              <InfoRow k="License state" v={b.driverLicenseState} />
              <InfoRow k="License expiry" v={fmtDate(b.driverLicenseExpiry)} />
            </div>
            {differsFromAccount && (
              <p
                style={{
                  marginTop: 12,
                  padding: "var(--s2) var(--s3)",
                  borderRadius: "var(--r-sm)",
                  background: "var(--st-amber-bg)",
                  color: "var(--st-amber-fg)",
                  fontSize: "var(--t-sm)",
                  lineHeight: 1.5,
                }}
              >
                These details differ from the account this request is filed under
                ({r.firstName} {r.lastName}, {r.email}). The request was submitted without
                signing in, so the account&apos;s own profile was left untouched.
              </p>
            )}
          </div>

          <div className="card" style={{ padding: "var(--s5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h3 className="h-panel" style={{ margin: 0 }}>Insurance</h3>
              {ins ? <Badge status={ins.status} /> : <span style={{ fontSize: "var(--t-sm)", color: "var(--text-faint)" }}>None on file</span>}
            </div>
            {ins ? (
              <div className="r-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 var(--s7)" }}>
                <InfoRow k="Type" v={ins.type} />
                <InfoRow k="Provider" v={ins.providerName} />
                <InfoRow k="Policy #" v={ins.policyNumber} mono />
                <InfoRow k="Expiry" v={fmtDate(ins.expiryDate)} />
                <div style={{ gridColumn: "span 2", marginTop: 10 }}>
                  <Link href="/admin/insurance" className="btn btn-ghost btn-sm">
                    Open insurance review →
                  </Link>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: "var(--t-base)", color: "var(--text-dim)" }}>
                {b.insuranceTypeChoice === "COMPANY"
                  ? "Company coverage selected — add the fleet policy in Insurance."
                  : "No customer policy submitted."}
              </p>
            )}
          </div>

          <div className="card" style={{ padding: 0 }}>
            <SectionHead title="Weekly payments" actionHref="/admin/payments" actionLabel="Payments →" count={pays.length} />
            {pays.length === 0 && <Empty text="No payments scheduled until approved." />}
            {pays.map((p, i) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "var(--row-pad) var(--s5)", borderTop: "1px solid var(--border)" }}>
                <span className="mono" style={{ fontSize: "var(--t-xs)", color: "var(--text-faint)", width: 32 }}>W{i + 1}</span>
                <span style={{ fontSize: "var(--t-base)", color: "var(--text-dim)", flex: 1 }}>
                  {fmtShort(p.weekStart)} – {fmtShort(p.weekEnd)}
                </span>
                <span style={{ fontSize: "var(--t-base)" }}>{money(p.amount)}</span>
                <Badge status={p.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
