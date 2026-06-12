import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getPublicVehicle } from "@/lib/data/vehicles";
import { Badge } from "@/components/Badge";
import { InfoRow } from "@/components/primitives";
import { money } from "@/lib/format";
import { Gallery } from "./Gallery";

export const dynamic = "force-dynamic";

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const v = await getPublicVehicle(id);
  if (!v) notFound();

  const session = await auth();
  const isRenter = (session?.user as { kind?: string } | undefined)?.kind === "renter";
  const requestHref = isRenter ? `/book/${v.id}` : `/login?callbackUrl=/book/${v.id}`;
  const avail = v.available;
  const specs: [string, string][] = [
    ["Power", `${v.hp ?? "—"} hp`],
    ["Drivetrain", v.drivetrain ?? "—"],
    ["Top speed", v.topspeed ?? "—"],
    ["Body", v.body ?? "—"],
    ["Seats", `${v.seats} seats`],
    ["Energy", v.fuel ?? "—"],
  ];

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
          <h1 className="page-h1" style={{ fontFamily: "var(--font-display)", fontSize: 46, fontWeight: 600, margin: "8px 0 0", lineHeight: 1.02 }}>
            {v.model}
          </h1>
          {v.tagline && (
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontSize: 19,
                color: "var(--text-dim)",
                margin: "10px 0 0",
                lineHeight: 1.4,
              }}
            >
              {v.tagline}
            </p>
          )}
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, margin: "18px 0" }}>
            <span className="kpi-num" style={{ fontSize: 38, color: "var(--accent)" }}>
              {money(v.weeklyPrice)}
            </span>
            <span style={{ color: "var(--text-dim)" }}>per week</span>
            <span style={{ marginLeft: "auto" }}>
              <Badge status={avail ? "AVAILABLE" : "RENTED"}>
                {avail ? "Available now" : "Currently booked"}
              </Badge>
            </span>
          </div>

          {/* spec grid */}
          <div
            className="r-grid-3"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: 1,
              background: "var(--border)",
              borderRadius: 12,
              overflow: "hidden",
              marginBottom: 20,
            }}
          >
            {specs.map(([k, val]) => (
              <div key={k} style={{ background: "var(--surface)", padding: "14px 16px" }}>
                <div
                  style={{
                    fontSize: 10.5,
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--text-faint)",
                  }}
                >
                  {k}
                </div>
                <div style={{ fontSize: 15, marginTop: 5, color: "var(--text)" }}>{val}</div>
              </div>
            ))}
          </div>

          {/* features */}
          {v.features.length > 0 && (
            <div style={{ marginBottom: 22 }}>
              <div className="eyebrow" style={{ color: "var(--text-dim)", marginBottom: 12 }}>
                Appointments
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "9px 18px" }}>
                {v.features.map((ft) => (
                  <div key={ft} style={{ display: "flex", gap: 9, alignItems: "baseline", fontSize: 13.5, color: "var(--text)" }}>
                    <span style={{ color: "var(--accent)", flexShrink: 0 }}>—</span>
                    {ft}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card" style={{ padding: "4px 20px", marginBottom: 24 }}>
            <InfoRow k="Color" v={v.color} />
            <InfoRow k="Plate" v={v.plate} mono />
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "9px 0" }}>
              <span style={{ fontSize: 13, color: "var(--text-dim)" }}>VIN</span>
              <span className="mono" style={{ fontSize: 12.5 }}>
                {v.vin}
              </span>
            </div>
          </div>

          {avail ? (
            <Link href={requestHref} className="btn btn-gold" style={{ width: "100%", padding: "15px", justifyContent: "center" }}>
              {isRenter ? "Request this vehicle" : "Sign in to request"}
            </Link>
          ) : (
            <button className="btn btn-gold" style={{ width: "100%", padding: "15px" }} disabled>
              Unavailable for selected dates
            </button>
          )}
          <p style={{ fontSize: 12.5, color: "var(--text-faint)", textAlign: "center", marginTop: 14, lineHeight: 1.6 }}>
            Submitting a request does not confirm a booking. Our team reviews every request and
            verifies insurance before approval.
          </p>
        </div>
      </div>
    </div>
  );
}
