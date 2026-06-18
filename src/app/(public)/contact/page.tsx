import type { Metadata } from "next";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact · DMV Rentals",
  description: "Speak with our concierge about reserving a luxury or exotic vehicle.",
};

type Method = { label: string; value: string; href?: string; note?: string };

const METHODS: Method[] = [
  { label: "Phone", value: "+1 (310) 555-0142", href: "tel:+13105550142", note: "Mon–Sat, 9:00–19:00" },
  { label: "Email", value: "concierge@urfleettracker.com", href: "mailto:concierge@urfleettracker.com", note: "Replies within 24 hours" },
  { label: "Showroom", value: "9000 Sunset Blvd, West Hollywood, CA 90069", note: "By appointment" },
  { label: "Hours", value: "Mon–Sat · 9:00–19:00", note: "Sunday by appointment only" },
];

export default function ContactPage() {
  return (
    <div style={{ paddingTop: 50, maxWidth: 1040, margin: "0 auto" }}>
      <div style={{ textAlign: "center", maxWidth: 620, margin: "0 auto 44px" }}>
        <div className="eyebrow">Get in touch</div>
        <h1 className="page-h1" style={{ fontFamily: "var(--font-display)", fontSize: 46, fontWeight: 600, margin: "10px 0 0", lineHeight: 1.05 }}>
          Speak with our concierge
        </h1>
        <p style={{ color: "var(--text-dim)", fontSize: 16, lineHeight: 1.6, marginTop: 16 }}>
          Every reservation is by request and personally reviewed. Tell us which vehicle you have in
          mind and your dates — our team will confirm availability and walk you through the details.
        </p>
      </div>

      <div className="r-split" style={{ display: "grid", gridTemplateColumns: "0.85fr 1.15fr", gap: 32, alignItems: "start" }}>
        {/* contact methods */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {METHODS.map((m) => (
            <div key={m.label} className="card" style={{ padding: "18px 20px" }}>
              <div
                style={{
                  fontSize: 10.5,
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--text-faint)",
                }}
              >
                {m.label}
              </div>
              <div style={{ fontSize: 15.5, marginTop: 7, color: "var(--text)", lineHeight: 1.4 }}>
                {m.href ? (
                  <a href={m.href} style={{ color: "var(--text)" }}>
                    {m.value}
                  </a>
                ) : (
                  m.value
                )}
              </div>
              {m.note && <div style={{ fontSize: 12.5, color: "var(--text-dim)", marginTop: 5 }}>{m.note}</div>}
            </div>
          ))}
        </div>

        {/* form */}
        <div className="card" style={{ padding: "30px 30px" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 600, margin: "0 0 6px" }}>
            Send us a message
          </h2>
          <p style={{ color: "var(--text-dim)", fontSize: 13.5, margin: "0 0 22px", lineHeight: 1.6 }}>
            We&apos;ll get back to you within one business day.
          </p>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
