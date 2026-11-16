import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { auth } from "@/auth";
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

  // Requests can be made without an account, so the portal link is only shown
  // to someone who actually has one — otherwise it is a button straight to a
  // login screen they cannot pass. For a guest the reference is the record.
  const session = await auth();
  const isRenter = (session?.user as { kind?: string } | undefined)?.kind === "renter";

  return (
    <div style={{ paddingTop: "var(--s10)", maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
      {/* The heading already says the request landed; a 64px gold medallion
          above it was a second, larger announcement of the same fact. */}
      <div className="eyebrow">Request received</div>
      <h1 className="h-page" style={{ marginTop: "var(--s3)" }}>
        We&apos;re reviewing your request
      </h1>
      <p className="lede">
        Thank you. Our team verifies your details and insurance before approving — you&apos;ll hear
        from us within 24 hours.
      </p>
      {/* The reference is the one thing to take away from this page, so it
          gets the card and the largest non-heading type on it. */}
      <div className="card" style={{ padding: "var(--s5) var(--s6)", marginTop: "var(--s7)", textAlign: "left" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--s4)" }}>
          <span className="meta">Reference</span>
          {/* `.ref` is the booking reference everywhere else in the product —
              it was being re-specified here with its own letter-spacing. */}
          <span className="ref" style={{ fontSize: "var(--d-sm)" }}>
            {reference}
          </span>
        </div>
        <div
          style={{
            marginTop: "var(--s3)",
            paddingTop: "var(--s3)",
            borderTop: "1px solid var(--border)",
            fontSize: "var(--t-md)",
            color: "var(--text-dim)",
          }}
        >
          {b.year} {b.make} {b.model} · {fmtDate(b.startDate)} → {fmtDate(b.endDate)}
        </div>
      </div>
      {!isRenter && (
        <p style={{ fontSize: "var(--t-base)", color: "var(--text-faint)", marginTop: "var(--s4)", lineHeight: 1.6 }}>
          Keep this reference — it&apos;s how we&apos;ll identify your request. We&apos;ve also
          emailed it to you.
        </p>
      )}
      <div style={{ display: "flex", gap: "var(--s3)", justifyContent: "center", marginTop: "var(--s7)" }}>
        <Link href="/" className="btn btn-ghost">
          Back to fleet
        </Link>
        {isRenter && (
          <Link href="/account" className="btn btn-gold">
            View in your account →
          </Link>
        )}
      </div>
    </div>
  );
}
