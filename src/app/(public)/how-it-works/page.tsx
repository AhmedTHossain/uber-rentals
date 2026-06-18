import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How it works · DMV Rentals",
  description: "How reserving a luxury or exotic vehicle by request works — from browsing the fleet to pick-up.",
};

export const dynamic = "force-static";

type Step = { n: string; title: string; body: string };

const STEPS: Step[] = [
  {
    n: "01",
    title: "Browse the fleet",
    body: "Explore our collection of luxury and exotic vehicles. Each listing shows weekly pricing, specs, and live availability for the weeks ahead.",
  },
  {
    n: "02",
    title: "Submit a request",
    body: "Pick your dates and share your driver and insurance details. Nothing is charged — every reservation is a request, not an instant booking.",
  },
  {
    n: "03",
    title: "We review & verify",
    body: "Our team confirms availability and verifies your license and insurance. You’ll hear back from us, typically within 24 hours.",
  },
  {
    n: "04",
    title: "Get approved",
    body: "Once approved, we generate your weekly payment schedule and arrange pick-up. Payments are handled offline with our team — no card required online.",
  },
  {
    n: "05",
    title: "Manage it in your account",
    body: "Track your request status, weekly payments, and rental history anytime from your renter account.",
  },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "Is my reservation confirmed when I submit?",
    a: "No. Submitting a request places it in our review queue. A reservation is only confirmed once our team approves it — you’ll be notified either way.",
  },
  {
    q: "How do payments work?",
    a: "Rentals are billed weekly. We collect payments offline with you directly; nothing is charged through the website.",
  },
  {
    q: "What about insurance?",
    a: "You can rent under our company coverage or provide your own policy. Either way, insurance is verified before a booking is approved.",
  },
];

export default function HowItWorksPage() {
  return (
    <div style={{ paddingTop: 50, maxWidth: 860, margin: "0 auto" }}>
      <div style={{ textAlign: "center", maxWidth: 620, margin: "0 auto 50px" }}>
        <div className="eyebrow">How it works</div>
        <h1 className="page-h1" style={{ fontFamily: "var(--font-display)", fontSize: 46, fontWeight: 600, margin: "10px 0 0", lineHeight: 1.05 }}>
          Reserved by request, not by the click
        </h1>
        <p style={{ color: "var(--text-dim)", fontSize: 16, lineHeight: 1.6, marginTop: 16 }}>
          Every vehicle is personally reviewed before it’s confirmed. Here’s the journey from
          browsing the fleet to driving away.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {STEPS.map((s) => (
          <div key={s.n} className="card" style={{ display: "flex", gap: 22, padding: "22px 26px", alignItems: "flex-start" }}>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 34,
                fontWeight: 600,
                color: "var(--accent)",
                lineHeight: 1,
                minWidth: 52,
              }}
            >
              {s.n}
            </div>
            <div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, margin: "2px 0 0" }}>
                {s.title}
              </h2>
              <p style={{ color: "var(--text-dim)", fontSize: 14.5, lineHeight: 1.65, margin: "8px 0 0" }}>{s.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center", margin: "44px 0" }}>
        <Link href="/" className="btn btn-gold" style={{ padding: "14px 32px" }}>
          Browse the fleet →
        </Link>
      </div>

      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 40 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 600, textAlign: "center", margin: "0 0 26px" }}>
          Common questions
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {FAQ.map((f) => (
            <div key={f.q} className="card" style={{ padding: "18px 24px" }}>
              <div style={{ fontSize: 15.5, fontWeight: 600, color: "var(--text)" }}>{f.q}</div>
              <p style={{ color: "var(--text-dim)", fontSize: 14, lineHeight: 1.65, margin: "8px 0 0" }}>{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
