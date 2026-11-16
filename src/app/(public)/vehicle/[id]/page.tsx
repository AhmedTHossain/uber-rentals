import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getPublicVehicle, type PublicVehicle } from "@/lib/data/vehicles";
import { Badge } from "@/components/Badge";
import { InfoRow } from "@/components/primitives";
import { money, fmtDate } from "@/lib/format";
import { Gallery } from "./Gallery";
import { AvailabilityCheck } from "./AvailabilityCheck";

export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function VehicleDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ unavailable?: string; start?: string; end?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  // The booking route sends a renter back here when it cannot open the form.
  // Say why: a silent bounce back to this page reads as a dead button.
  const bouncedWindow =
    sp.start && sp.end && DATE_RE.test(sp.start) && DATE_RE.test(sp.end)
      ? `${fmtDate(sp.start)} → ${fmtDate(sp.end)}`
      : null;
  const notice =
    sp.unavailable === "offroad"
      ? "This vehicle is off the road for servicing, so it cannot be requested at the moment."
      : sp.unavailable === "window"
        ? `${bouncedWindow ?? "Those dates"} is no longer free — a booking was approved for that window. Choose different dates below.`
        : null;

  // Resolve the viewer first: VIN/plate are only fetched for an admin, so they
  // never reach a customer's page payload at all.
  const session = await auth();
  const user = session?.user as { kind?: string } | undefined;
  const isRenter = user?.kind === "renter";
  const isAdmin = user?.kind === "admin";

  // `ids` is non-null only when the admin fetch ran, so the VIN/plate rows
  // below cannot render — or even be loaded — for anyone else.
  const ids = isAdmin ? await getPublicVehicle(id, { withIdentifiers: true }) : null;
  const v: PublicVehicle | null = isAdmin ? ids : await getPublicVehicle(id);
  if (!v) notFound();
  const avail = v.available;

  // Body/Seats/Energy are customer-visible only when their per-vehicle flag is on;
  // admin always sees them (with a "hidden" marker when off). Power/Drivetrain/
  // Top speed are no longer surfaced.
  type Spec = { k: string; val: string; hidden: boolean };
  const specs: Spec[] = [];
  const pushSpec = (k: string, val: string, show: boolean) => {
    if (show || isAdmin) specs.push({ k, val, hidden: !show });
  };
  pushSpec("Body", v.body ?? "—", v.showBody);
  pushSpec("Seats", `${v.seats} seats`, v.showSeats);
  pushSpec("Energy", v.fuel ?? "—", v.showEnergy);

  return (
    <div style={{ paddingTop: 30 }}>
      <Link href="/" className="btn btn-ghost btn-sm" style={{ marginBottom: 24, display: "inline-flex" }}>
        ← Back to fleet
      </Link>
      <div className="r-split" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 44, alignItems: "start" }}>
        <Gallery photos={v.photos} />

        <div>
          <div className="eyebrow">
            {v.year} · {v.make}
          </div>
          <h1 className="h-page" style={{ margin: "var(--s2) 0 0" }}>
            {v.model}
          </h1>
          {v.tagline && (
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontSize: "var(--d-sm)",
                color: "var(--text-dim)",
                margin: "10px 0 0",
                lineHeight: 1.4,
              }}
            >
              {v.tagline}
            </p>
          )}
          <div style={{ display: "flex", alignItems: "baseline", gap: "var(--s2)", margin: "18px 0" }}>
            <span className="kpi-num" style={{ fontSize: "var(--d-xl)", color: "var(--accent)" }}>
              {money(v.weeklyPrice)}
            </span>
            <span style={{ color: "var(--text-dim)", fontSize: "var(--t-md)" }}>per week</span>
            {/* Only the exception is badged, matching the fleet cards. */}
            {!avail && (
              <span style={{ marginLeft: "auto" }}>
                <Badge status="RENTED">Currently booked</Badge>
              </span>
            )}
          </div>

          {/* spec grid */}
          {specs.length > 0 && (
            <div
              className="r-grid-3"
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${specs.length},1fr)`,
                gap: 1,
                background: "var(--border)",
                borderRadius: "var(--r-md)",
                overflow: "hidden",
                marginBottom: "var(--s5)",
              }}
            >
              {specs.map((s) => (
                <div key={s.k} style={{ background: "var(--surface)", padding: "14px var(--s4)" }}>
                  <div className="meta" style={{ color: "var(--text-faint)" }}>
                    {s.k}
                    {s.hidden && <span style={{ color: "var(--accent)" }}> · hidden</span>}
                  </div>
                  <div style={{ fontSize: "var(--t-md)", marginTop: 5, color: "var(--text)" }}>{s.val}</div>
                </div>
              ))}
            </div>
          )}

          {/* features */}
          {v.features.length > 0 && (
            <div style={{ marginBottom: 22 }}>
              <div className="meta" style={{ marginBottom: "var(--s3)" }}>Features</div>
              {/* No bullet glyph: the two-column grid already separates the
                  items, and a gold dash on each line sprays accent colour
                  across the densest part of the page. */}
              <ul
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "9px 18px",
                  listStyle: "none",
                  margin: 0,
                  padding: 0,
                }}
              >
                {v.features.map((ft) => (
                  <li key={ft} style={{ fontSize: "var(--t-base)", color: "var(--text)" }}>
                    {ft}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="card" style={{ padding: "4px var(--s5)", marginBottom: "var(--s6)" }}>
            <InfoRow k="Color" v={v.color} />
            {ids && (
              <>
                <InfoRow k="Plate" v={ids.plate} mono />
                <InfoRow k="VIN" v={ids.vin} mono />
              </>
            )}
          </div>

          {notice && (
            <div role="status" className="notice notice-amber" style={{ marginBottom: "var(--s3)" }}>
              <span aria-hidden="true">⚠</span>
              <span>{notice}</span>
            </div>
          )}
          <AvailabilityCheck vehicleId={v.id} />
          <p style={{ fontSize: "var(--t-sm)", color: "var(--text-faint)", textAlign: "center", marginTop: "var(--s3)", lineHeight: 1.6 }}>
            Requests are reviewed and insurance verified before approval.
          </p>
        </div>
      </div>
    </div>
  );
}
