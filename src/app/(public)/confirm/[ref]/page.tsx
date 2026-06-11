import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookings, vehicles } from "@/lib/db/schema";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const { ref } = await params;
  const reference = decodeURIComponent(ref);

  const rows = await db
    .select({
      startDate: bookings.startDate,
      endDate: bookings.endDate,
      year: vehicles.year,
      make: vehicles.make,
      model: vehicles.model,
    })
    .from(bookings)
    .innerJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
    .where(eq(bookings.referenceNumber, reference))
    .limit(1);
  const b = rows[0];
  if (!b) notFound();

  return (
    <div style={{ paddingTop: 70, maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          border: "1.5px solid var(--accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 26px",
          color: "var(--accent)",
          fontSize: 30,
        }}
      >
        ✓
      </div>
      <div className="eyebrow">Request received</div>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 44, fontWeight: 600, margin: "10px 0 0", lineHeight: 1.05 }}>
        We&apos;re reviewing your request
      </h1>
      <p style={{ color: "var(--text-dim)", fontSize: 16, lineHeight: 1.6, marginTop: 18 }}>
        Thank you. Your booking is in our queue with status{" "}
        <b style={{ color: "var(--text)" }}>Requested</b>. Our team verifies details and insurance
        before approving — you&apos;ll hear from us within 24 hours.
      </p>
      <div className="card" style={{ padding: "22px 26px", marginTop: 30, textAlign: "left" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span
            style={{
              fontSize: 12,
              color: "var(--text-dim)",
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Reference
          </span>
          <span className="mono" style={{ fontSize: 18, color: "var(--accent)", letterSpacing: "0.04em" }}>
            {reference}
          </span>
        </div>
        <div
          style={{
            marginTop: 14,
            paddingTop: 14,
            borderTop: "1px solid var(--border)",
            fontSize: 14,
            color: "var(--text-dim)",
          }}
        >
          {b.year} {b.make} {b.model} · {fmtDate(b.startDate)} → {fmtDate(b.endDate)}
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 30 }}>
        <Link href="/" className="btn btn-ghost">
          Back to fleet
        </Link>
        <Link href="/account" className="btn btn-gold">
          View in your account →
        </Link>
      </div>
    </div>
  );
}
