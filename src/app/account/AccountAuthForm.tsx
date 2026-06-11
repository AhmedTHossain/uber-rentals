"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Field } from "@/components/primitives";

export function AccountAuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/account";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    if (mode === "register") {
      const res = await fetch("/api/renters/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error || "Could not create your account.");
        setBusy(false);
        return;
      }
    }

    const signed = await signIn("renter", { email, password, redirect: false });
    if (signed?.error) {
      setError(mode === "login" ? "Invalid email or password." : "Account created — please sign in.");
      setBusy(false);
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 16 }}>
      {error && (
        <div style={{ padding: "11px 15px", borderRadius: 10, background: "var(--st-red-bg)", color: "var(--st-red-fg)", fontSize: 13.5 }}>
          {error}
        </div>
      )}
      {mode === "register" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="First name">
            <input className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Marcus" required />
          </Field>
          <Field label="Last name">
            <input className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Adeyemi" required />
          </Field>
        </div>
      )}
      <Field label="Email">
        <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" autoComplete="email" required />
      </Field>
      <Field label="Password">
        <input
          className="input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={mode === "register" ? "At least 8 characters" : "••••••••"}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
        />
      </Field>
      <button className="btn btn-gold" type="submit" disabled={busy} style={{ padding: "13px", justifyContent: "center" }}>
        {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
      </button>
      <div style={{ textAlign: "center", fontSize: 13, color: "var(--text-dim)" }}>
        {mode === "login" ? (
          <>
            New here?{" "}
            <Link href="/account/register" style={{ color: "var(--accent)" }}>Create an account</Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/account/login" style={{ color: "var(--accent)" }}>Sign in</Link>
          </>
        )}
      </div>
    </form>
  );
}
