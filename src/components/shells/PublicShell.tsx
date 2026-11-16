"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/components/useTheme";

export function PublicShell({
  children,
  isRenter = false,
}: {
  children: React.ReactNode;
  isRenter?: boolean;
}) {
  const { theme, toggle } = useTheme("ur-theme-public");
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>
      <header
        className="public-header"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "22px 42px",
          borderBottom: "1px solid var(--border)",
          maxWidth: 1280,
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
        <nav className="nav-desktop" style={{ display: "flex", alignItems: "center", gap: 28, fontSize: "var(--t-md)" }}>
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
          {isRenter ? (
            <Link href="/account" className="btn btn-ghost btn-sm">
              My account
            </Link>
          ) : (
            <Link href="/login" className="btn btn-ghost btn-sm">
              Sign in
            </Link>
          )}
        </nav>
        <div className="nav-mobile" style={{ alignItems: "center", gap: 12 }}>
          <ThemeToggle value={theme} onToggle={toggle} />
          <button
            className="btn btn-ghost btn-sm nav-burger"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            style={{ padding: "8px 10px" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </header>

      {menuOpen && (
        <div
          className="mobile-menu"
          style={{
            borderBottom: "1px solid var(--border)",
            maxWidth: 1280,
            margin: "0 auto",
            padding: "8px 20px 16px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {[
            ["/", "Fleet"],
            ["/how-it-works", "How it works"],
            ["/contact", "Contact"],
            [isRenter ? "/account" : "/login", isRenter ? "My account" : "Sign in"],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              onClick={close}
              style={{ padding: "13px 4px", fontSize: "var(--t-md)", color: "var(--text)", borderBottom: "1px solid var(--border)" }}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
      <main
        className="public-main"
        style={{ maxWidth: 1280, margin: "0 auto", padding: "0 42px 90px" }}
      >
        {children}
      </main>
      <footer
        className="footer-bar public-main"
        style={{
          borderTop: "1px solid var(--border)",
          padding: "34px 42px",
          maxWidth: 1280,
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "var(--s4)",
        }}
      >
        <Logo size={0.8} />
        {/* The "requests are reviewed, not instant" promise is already made in
            the hero, on the vehicle page, in the form and on the confirmation.
            The footer only needs the copyright. */}
        <div style={{ fontSize: "var(--t-sm)", color: "var(--text-faint)" }}>
          © 2026 DMV Rentals
        </div>
      </footer>
    </div>
  );
}
