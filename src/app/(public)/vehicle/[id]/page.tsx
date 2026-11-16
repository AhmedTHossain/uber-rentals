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
    <div style={{ paddingTop: "var(--s6)" }}>
      {/* A back link is navigation, not an action — it was a ghost button
          carrying the same weight as "Sign in". */}
      <Link href="/" className="backlink" style={{ marginBottom: "var(--s5)" }}>
        ← Fleet
      </Link>
      {/* The request panel is the rail and nothing else shares it. The CTA
          used to sit below the spec grid, the feature list and an identifiers
          card — the one thing a visitor came to do, placed last. */}
      <div className="r-split" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.55fr) minmax(300px, 1fr)", gap: "var(--s8)", alignItems: "start" }}>
        <div className="detail-main">
          <div className="detail-gallery">
            <Gallery photos={v.photos} />
          </div>

          {v.tagline && (
            <section style={{ marginTop: "var(--s8)" }}>
              <h2 className="h-panel" style={{ marginBottom: "var(--s3)" }}>Overview</h2>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontSize: "var(--d-sm)",
                  color: "var(--text-dim)",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {v.tagline}
              </p>
            </section>
          )}

          {specs.length > 0 && (
            <section style={{ marginTop: "var(--s8)" }}>
              <h2 className="h-panel" style={{ marginBottom: "var(--s3)" }}>Specification</h2>
              <div
                className="r-grid-3"
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${specs.length},1fr)`,
                  gap: 1,
                  background: "var(--border)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r-sm)",
                  overflow: "hidden",
                }}
              >
                {specs.map((s) => (
                  <div key={s.k} style={{ background: "var(--surface)", padding: "var(--s3) var(--s4)" }}>
                    <div style={{ fontSize: "var(--t-xs)", color: "var(--text-faint)" }}>
                      {s.k}
                      {s.hidden && <span style={{ color: "var(--accent-ink)" }}> · hidden</span>}
                    </div>
                    <div style={{ fontSize: "var(--t-md)", marginTop: 3, color: "var(--text)" }}>{s.val}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {v.features.length > 0 && (
            <section style={{ marginTop: "var(--s8)" }}>
              <h2 className="h-panel" style={{ marginBottom: "var(--s3)" }}>Features</h2>
              {/* No bullet glyph: the two-column grid already separates the
                  items, and a gold dash on each line sprays accent colour
                  across the densest part of the page. */}
              <ul
                className="r-grid-2"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "var(--s2) var(--s5)",
                  listStyle: "none",
                  margin: 0,
                  padding: 0,
                }}
              >
                {v.features.map((ft) => (
                  <li key={ft} style={{ fontSize: "var(--t-md)", color: "var(--text)" }}>
                    {ft}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section style={{ marginTop: "var(--s8)" }}>
            <h2 className="h-panel" style={{ marginBottom: "var(--s3)" }}>Identifiers</h2>
            <div className="card" style={{ padding: "var(--s1) var(--s5)" }}>
              <InfoRow k="Color" v={v.color} />
              {ids && (
                <>
                  <InfoRow k="Plate" v={ids.plate} mono />
                  <InfoRow k="VIN" v={ids.vin} mono />
                </>
              )}
            </div>
            {ids && (
              <p style={{ fontSize: "var(--t-xs)", color: "var(--text-faint)", marginTop: "var(--s2)" }}>
                Plate and VIN are visible to signed-in staff only.
              </p>
            )}
          </section>
        </div>

        <div className="detail-rail" style={{ position: "sticky", top: 88 }}>
          <div className="card" style={{ padding: "var(--s5)" }}>
            <div className="eyebrow">
              {v.year} · {v.make}
            </div>
            <h1 className="h-page" style={{ fontSize: "var(--d-xl)", margin: "var(--s2) 0 0" }}>
              {v.model}
            </h1>
            <div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: "var(--s2)", margin: "var(--s4) 0 var(--s5)" }}>
              <span className="price" style={{ fontSize: "var(--d-xl)" }}>
                {money(v.weeklyPrice)}
              </span>
              <span style={{ color: "var(--text-dim)", fontSize: "var(--t-sm)" }}>per week</span>
              {/* Only the exception is badged, matching the fleet cards. */}
              {!avail && (
                <span style={{ marginLeft: "auto" }}>
                  <Badge status="RENTED">Currently booked</Badge>
                </span>
              )}
            </div>

            {notice && (
              <div role="status" className="notice notice-amber" style={{ marginBottom: "var(--s3)" }}>
                <span>{notice}</span>
              </div>
            )}
            <AvailabilityCheck vehicleId={v.id} />
            <p style={{ fontSize: "var(--t-xs)", color: "var(--text-faint)", textAlign: "center", marginTop: "var(--s3)", lineHeight: 1.55 }}>
              Nothing is charged now. Requests are reviewed and insurance verified before approval.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
