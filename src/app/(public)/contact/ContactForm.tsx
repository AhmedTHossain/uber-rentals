"use client";

import { useState } from "react";
import { Field } from "@/components/primitives";

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
      <div style={{ textAlign: "center", padding: "var(--s5) 0" }} role="status">
        <h3 className="h-card" style={{ margin: 0 }}>Message sent</h3>
        <p style={{ color: "var(--text-dim)", fontSize: "var(--t-md)", lineHeight: 1.6, margin: "var(--s2) 0 0" }}>
          Thanks, {name.split(" ")[0] || "there"} — our concierge will reply within one business day.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: "var(--s4)" }}>
      {error && (
        <div role="alert" className="notice notice-red">
          {error}
        </div>
      )}
      <div className="r-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s3)" }}>
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
      <button className="btn btn-gold btn-lg" type="submit" disabled={busy} style={{ width: "100%" }}>
        {busy ? "Sending…" : "Send message"}
      </button>
      {/* The "or email us directly" line is gone: the same address is listed
          in the contact details alongside this form. */}
    </form>
  );
}
