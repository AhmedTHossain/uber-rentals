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
    <div style={{ paddingTop: "var(--s9)", maxWidth: 860, margin: "0 auto" }}>
      {/* No "How it works" eyebrow: this page is reached from a nav item of
          that name and the heading below already says it. */}
      <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto var(--s9)" }}>
        <h1 className="h-page">Reserved by request, not by the click</h1>
        <p className="lede">
          Every vehicle is personally reviewed before it’s confirmed. Here’s the journey from
          browsing the fleet to driving away.
        </p>
      </div>

      {/* The numeral is a step marker at label size. At 34px serif gold it
          out-weighed the step title it was labelling. */}
      <ol style={{ display: "flex", flexDirection: "column", gap: "var(--s3)", listStyle: "none", margin: 0, padding: 0 }}>
        {STEPS.map((s) => (
          <li key={s.n} className="card" style={{ display: "flex", gap: "var(--s5)", padding: "var(--s5) var(--s6)", alignItems: "baseline" }}>
            <span className="eyebrow" style={{ flexShrink: 0 }}>{s.n}</span>
            <div>
              <h2 className="h-card">{s.title}</h2>
              <p style={{ color: "var(--text-dim)", fontSize: "var(--t-md)", lineHeight: 1.65, margin: "var(--s2) 0 0" }}>{s.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div style={{ textAlign: "center", margin: "var(--s8) 0" }}>
        <Link href="/" className="btn btn-gold btn-lg">
          Browse the fleet →
        </Link>
      </div>

      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "var(--s8)" }}>
        <h2 className="h-section" style={{ textAlign: "center", margin: "0 0 var(--s6)" }}>
          Common questions
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s3)" }}>
          {FAQ.map((f) => (
            <div key={f.q} className="card" style={{ padding: "var(--s4) var(--s6)" }}>
              <div style={{ fontSize: "var(--t-md)", fontWeight: 600, color: "var(--text)" }}>{f.q}</div>
              <p style={{ color: "var(--text-dim)", fontSize: "var(--t-md)", lineHeight: 1.65, margin: "var(--s2) 0 0" }}>{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
