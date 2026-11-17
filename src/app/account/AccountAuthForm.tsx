"use client";

import { useState } from "react";
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

    const signed = await signIn("credentials", { email, password, redirect: false });
    if (signed?.error) {
      setError(mode === "login" ? "Invalid email or password." : "Account created — please sign in.");
      setBusy(false);
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: "var(--s4)" }}>
      {/* The shared notice, not a one-off red box: the same failure is
          reported in the same shape on the contact form and the booking form. */}
      {error && (
        <div role="alert" className="notice notice-red">
          {error}
        </div>
      )}
      {mode === "register" && (
        <div className="r-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s3)" }}>
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
      {/* The account-switch link lives under the card, in the shell, so it
          reads as a way off this screen rather than a third form control. */}
      <button className="btn btn-gold btn-lg" type="submit" disabled={busy} style={{ justifyContent: "center" }}>
        {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
      </button>
    </form>
  );
}
