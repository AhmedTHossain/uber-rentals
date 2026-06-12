"use client";

import { useState } from "react";
import { Field } from "@/components/primitives";

const CONTACT_EMAIL = "concierge@uberrentals.co";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const subject = `Vehicle inquiry — ${name || "new enquiry"}`;
    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      phone ? `Phone: ${phone}` : null,
      "",
      message,
    ]
      .filter((l) => l !== null)
      .join("\n");
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 16 }}>
      {sent && (
        <div
          style={{
            padding: "11px 15px",
            borderRadius: 10,
            background: "var(--st-green-bg)",
            color: "var(--st-green-fg)",
            fontSize: 13.5,
          }}
        >
          Your email draft is ready — send it and we&apos;ll reply within 24 hours.
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Name">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
        </Field>
        <Field label="Phone (optional)">
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (___) ___-____" />
        </Field>
      </div>
      <Field label="Email">
        <input
          className="input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          required
        />
      </Field>
      <Field label="How can we help?">
        <textarea
          className="input"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us which vehicle you're interested in and your preferred dates…"
          rows={5}
          required
          style={{ resize: "vertical", minHeight: 120, fontFamily: "inherit" }}
        />
      </Field>
      <button className="btn btn-gold" type="submit" style={{ padding: "13px", justifyContent: "center" }}>
        Send message
      </button>
      <p style={{ fontSize: 12, color: "var(--text-faint)", textAlign: "center", margin: 0, lineHeight: 1.6 }}>
        Prefer to write directly? Email{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "var(--accent)" }}>
          {CONTACT_EMAIL}
        </a>
        .
      </p>
    </form>
  );
}
