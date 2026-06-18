"use client";

import { useState } from "react";
import { Field } from "@/components/primitives";

const CONTACT_EMAIL = "concierge@urfleettracker.com";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, message }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error || "Something went wrong. Please try again.");
        setBusy(false);
        return;
      }
      setSent(true);
    } catch {
      setError("Network error. Please try again.");
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            border: "1.5px solid var(--accent)",
            color: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            margin: "0 auto 16px",
          }}
        >
          ✓
        </div>
        <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 20, margin: "0 0 8px" }}>
          Message sent
        </h3>
        <p style={{ color: "var(--text-dim)", fontSize: 14, lineHeight: 1.6, margin: 0 }}>
          Thanks, {name.split(" ")[0] || "there"} — our concierge will reply within one business day.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 16 }}>
      {error && (
        <div style={{ padding: "11px 15px", borderRadius: 10, background: "var(--st-red-bg)", color: "var(--st-red-fg)", fontSize: 13.5 }}>
          {error}
        </div>
      )}
      <div className="r-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
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
      <button className="btn btn-gold" type="submit" disabled={busy} style={{ padding: "13px", justifyContent: "center" }}>
        {busy ? "Sending…" : "Send message"}
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
