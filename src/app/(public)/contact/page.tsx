import type { Metadata } from "next";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact · DMV Rentals",
  description: "Speak with our concierge about reserving a luxury or exotic vehicle.",
};

type Method = { label: string; value: string; href?: string; note?: string };

const METHODS: Method[] = [
  // Hours live in their own row below; repeating them here made the same
  // fact appear twice in one column.
  { label: "Phone", value: "+1 (310) 555-0142", href: "tel:+13105550142" },
  { label: "Email", value: "concierge@urfleettracker.com", href: "mailto:concierge@urfleettracker.com", note: "Replies within 24 hours" },
  { label: "Showroom", value: "9000 Sunset Blvd, West Hollywood, CA 90069", note: "By appointment" },
  { label: "Hours", value: "Mon–Sat · 9:00–19:00", note: "Sunday by appointment only" },
];

export default function ContactPage() {
  return (
    <div style={{ paddingTop: "var(--s9)", maxWidth: 1040, margin: "0 auto" }}>
      <div style={{ textAlign: "center", maxWidth: 620, margin: "0 auto var(--s8)" }}>
        <h1 className="h-page">Speak with our concierge</h1>
        <p className="lede">
          Every reservation is by request and personally reviewed. Tell us which vehicle you have in
          mind and your dates — our team will confirm availability and walk you through the details.
        </p>
      </div>

      <div className="r-split" style={{ display: "grid", gridTemplateColumns: "0.85fr 1.15fr", gap: "var(--s7)", alignItems: "start" }}>
        {/* Contact details are one list, not four cards: a card per line made
            four bordered boxes out of a phone number and an address. */}
        <div className="card" style={{ padding: "var(--s1) var(--s5)" }}>
          {METHODS.map((m, i) => (
            <div
              key={m.label}
              style={{
                padding: "var(--s4) 0",
                borderBottom: i === METHODS.length - 1 ? undefined : "1px solid var(--border)",
              }}
            >
              <div className="meta" style={{ color: "var(--text-faint)" }}>{m.label}</div>
              <div style={{ fontSize: "var(--t-md)", marginTop: "var(--s2)", color: "var(--text)", lineHeight: 1.45 }}>
                {m.href ? (
                  // A phone number you can tap and one you can't looked
                  // identical. Underlined rather than gold: four accent-
                  // coloured lines in one card is the accent spent on a
                  // list of facts.
                  <a
                    href={m.href}
                    className="nav-link"
                    style={{
                      color: "var(--text)",
                      textDecoration: "underline",
                      textDecorationColor: "var(--border-strong)",
                      textUnderlineOffset: 3,
                    }}
                  >
                    {m.value}
                  </a>
                ) : (
                  m.value
                )}
              </div>
              {m.note && <div style={{ fontSize: "var(--t-sm)", color: "var(--text-dim)", marginTop: "var(--s1)" }}>{m.note}</div>}
            </div>
          ))}
        </div>

        {/* form */}
        <div className="card" style={{ padding: "var(--s6)" }}>
          <h2 className="h-section">Send us a message</h2>
          <p className="page-sub" style={{ marginBottom: "var(--s5)" }}>
            We&apos;ll get back to you within one business day.
          </p>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
