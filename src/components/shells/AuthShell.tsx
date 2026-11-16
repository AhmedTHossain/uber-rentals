"use client";

import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/components/useTheme";

/**
 * The one sign-in / sign-up frame.
 *
 * There were two of these — `/login` and `/account/register` — built
 * separately and drifted: 400px against 420px, a theme toggle on one and
 * not the other, a gold glow on one and not the other, and two different
 * eyebrows ("DMV Rentals", "Renter portal") above the same card. Creating
 * an account and then signing in made the page jump.
 *
 * Both routes render this now, so the frame is identical and only the
 * title and the form inside it change. Defaults to dark and shares the
 * public site's theme key, so the preference carries across both.
 */
export function AuthShell({
  title,
  children,
  footer,
}: {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const { theme, toggle } = useTheme("ur-theme-public");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--text)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--s6)",
        position: "relative",
      }}
    >
      <div style={{ position: "absolute", top: "var(--s5)", right: "var(--s6)", zIndex: 2 }}>
        <ThemeToggle value={theme} onToggle={toggle} />
      </div>
      {/* Decorative wash behind the card. aria-hidden: it carries nothing. */}
      <div
        aria-hidden
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
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "var(--s7)" }}>
          <Link href="/">
            <Logo tagline />
          </Link>
        </div>
        <div className="card" style={{ padding: "var(--s7) var(--s6)" }}>
          {/* The brand is in the logo directly above. A second "DMV Rentals"
              eyebrow inside the card repeated it at the moment the reader
              needed to be told what to do, not where they were. */}
          <h1 className="h-dialog" style={{ textAlign: "center", marginBottom: "var(--s6)" }}>
            {title}
          </h1>
          {children}
        </div>
        {footer && (
          <div
            style={{
              textAlign: "center",
              fontSize: "var(--t-base)",
              color: "var(--text-dim)",
              marginTop: "var(--s4)",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
