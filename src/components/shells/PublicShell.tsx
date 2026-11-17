"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/components/useTheme";

export type Viewer = "guest" | "renter" | "admin";

export function PublicShell({
  children,
  viewer = "guest",
}: {
  children: React.ReactNode;
  viewer?: Viewer;
}) {
  const { theme, toggle } = useTheme("ur-theme-public");
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>
      {/* The header was 22px/42px tall with a 1280 shell. A 64px bar on a
          1200 shell gives the content more room and the brand no less. */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "color-mix(in srgb, var(--bg) 88%, transparent)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          className="public-header"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--s5)",
            height: 64,
            padding: "0 var(--s7)",
            maxWidth: 1200,
            margin: "0 auto",
          }}
        >
          <Link href="/" style={{ cursor: "pointer" }}>
            <Logo />
          </Link>
          {/* Three tiers, in order of weight: navigation (dim text), the
              display preference (quiet icon), the account action (the only
              button). Previously the theme toggle and Sign in were identical
              ghost buttons, which flattened all three into one. */}
          <nav className="nav-desktop" style={{ display: "flex", alignItems: "center", gap: "var(--s6)", fontSize: "var(--t-md)" }}>
            <Link href="/" className="nav-link" style={{ color: "var(--text-dim)" }}>
              Fleet
            </Link>
            <Link href="/how-it-works" className="nav-link" style={{ color: "var(--text-dim)" }}>
              How it works
            </Link>
            <Link href="/contact" className="nav-link" style={{ color: "var(--text-dim)" }}>
              Contact
            </Link>
            <ThemeToggle value={theme} onToggle={toggle} />
            {viewer === "admin" ? (
              <>
                <Link href="/admin" className="btn btn-ghost btn-sm">
                  Admin dashboard
                </Link>
                {/* An admin browsing the public site often does it to see what
                    a customer sees, so signing out sits beside the dashboard
                    link as plain text rather than a second button. */}
                <button
                  type="button"
                  className="nav-link"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  style={{ color: "var(--text-dim)", background: "none", border: 0, padding: 0, cursor: "pointer", font: "inherit" }}
                >
                  Sign out
                </button>
              </>
            ) : viewer === "renter" ? (
              <Link href="/account" className="btn btn-ghost btn-sm">
                My account
              </Link>
            ) : (
              <Link href="/login" className="btn btn-ghost btn-sm">
                Sign in
              </Link>
            )}
          </nav>
          <div className="nav-mobile" style={{ alignItems: "center", gap: "var(--s2)" }}>
            <ThemeToggle value={theme} onToggle={toggle} />
            <button
              className="btn btn-ghost btn-sm btn-icon"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div
            className="mobile-menu"
            style={{
              borderTop: "1px solid var(--border)",
              maxWidth: 1200,
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {[
              ["/", "Fleet"],
              ["/how-it-works", "How it works"],
              ["/contact", "Contact"],
              viewer === "admin"
                ? ["/admin", "Admin dashboard"]
                : viewer === "renter"
                  ? ["/account", "My account"]
                  : ["/login", "Sign in"],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                onClick={close}
                style={{
                  padding: "var(--s3) var(--s5)",
                  fontSize: "var(--t-md)",
                  color: "var(--text)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                {label}
              </Link>
            ))}
            {viewer === "admin" && (
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                style={{
                  padding: "var(--s3) var(--s5)",
                  fontSize: "var(--t-md)",
                  color: "var(--text-dim)",
                  background: "none",
                  border: 0,
                  borderBottom: "1px solid var(--border)",
                  textAlign: "left",
                  cursor: "pointer",
                  font: "inherit",
                }}
              >
                Sign out
              </button>
            )}
          </div>
        )}
      </header>

      <main
        className="public-main"
        style={{ maxWidth: 1200, margin: "0 auto", padding: "0 var(--s7) var(--s10)" }}
      >
        {children}
      </main>
      <footer
        className="footer-bar public-main"
        style={{
          borderTop: "1px solid var(--border)",
          padding: "var(--s7)",
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "var(--s4)",
        }}
      >
        <Logo size={0.82} />
        {/* The "requests are reviewed, not instant" promise is already made in
            the hero, on the vehicle page, in the form and on the confirmation.
            The footer only needs the copyright. */}
        <div style={{ fontSize: "var(--t-xs)", color: "var(--text-faint)" }}>
          © 2026 DMV Rentals
        </div>
      </footer>
    </div>
  );
}
