"use client";

import { Suspense } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/components/useTheme";
import { LoginForm } from "./LoginForm";

// Sign-in defaults to light and only goes dark when the user toggles it.
// Shares the public site's theme key so the preference persists across both.
export function LoginShell() {
  const { theme, toggle } = useTheme("ur-public-theme", "light");

  return (
    <div
      className={`theme-${theme}`}
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--text)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        position: "relative",
      }}
    >
      <div style={{ position: "absolute", top: 22, right: 24, zIndex: 2 }}>
        <ThemeToggle value={theme} onToggle={toggle} />
      </div>
      <div
        style={{
          position: "fixed",
          top: -220,
          left: "50%",
          transform: "translateX(-50%)",
          width: 900,
          height: 520,
          background: "radial-gradient(ellipse at center, rgba(198,160,82,0.12), transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative", width: 400, maxWidth: "100%" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 30 }}>
          <Link href="/">
            <Logo tagline />
          </Link>
        </div>
        <div className="card" style={{ padding: "32px 30px" }}>
          <div className="eyebrow" style={{ textAlign: "center" }}>
            Uber Rentals
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 28,
              fontWeight: 600,
              textAlign: "center",
              margin: "8px 0 24px",
            }}
          >
            Sign in
          </h1>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
          <div style={{ textAlign: "center", fontSize: 13, color: "var(--text-dim)", marginTop: 18 }}>
            New here?{" "}
            <Link href="/account/register" style={{ color: "var(--accent)" }}>
              Create a renter account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
