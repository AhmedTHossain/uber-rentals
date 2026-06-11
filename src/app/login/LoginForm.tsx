"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Field } from "@/components/primitives";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await signIn("admin", { email, password, redirect: false });
    if (res?.error) {
      setError("Invalid email or password.");
      setBusy(false);
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 16 }}>
      {error && (
        <div
          style={{
            padding: "11px 15px",
            borderRadius: 10,
            background: "var(--st-red-bg)",
            color: "var(--st-red-fg)",
            fontSize: 13.5,
          }}
        >
          {error}
        </div>
      )}
      <Field label="Email">
        <input
          className="input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="a.bello@uberrentals.co"
          autoComplete="username"
          required
        />
      </Field>
      <Field label="Password">
        <input
          className="input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
      </Field>
      <button className="btn btn-gold" type="submit" disabled={busy} style={{ padding: "13px", justifyContent: "center" }}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
