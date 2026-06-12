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
  const { theme, toggle } = useTheme("ur-public-theme", "light");
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);

  return (
    <div className={`theme-${theme}`} style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>
      {/* ambient glow */}
      <div
        style={{
          position: "fixed",
          top: -220,
          left: "50%",
          transform: "translateX(-50%)",
          width: 900,
          height: 520,
          background: "radial-gradient(ellipse at center, rgba(198,160,82,0.10), transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <header
        className="public-header"
        style={{
          position: "relative",
          zIndex: 2,
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
          <Logo tagline />
        </Link>
        <nav className="nav-desktop" style={{ display: "flex", alignItems: "center", gap: 32, fontSize: 13.5 }}>
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
            position: "relative",
            zIndex: 2,
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
              style={{ padding: "13px 4px", fontSize: 15, color: "var(--text)", borderBottom: "1px solid var(--border)" }}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
      <main
        className="public-main"
        style={{ position: "relative", zIndex: 1, maxWidth: 1280, margin: "0 auto", padding: "0 42px 90px" }}
      >
        {children}
      </main>
      <footer
        className="footer-bar public-main"
        style={{
          position: "relative",
          zIndex: 1,
          borderTop: "1px solid var(--border)",
          padding: "34px 42px",
          maxWidth: 1280,
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <Logo size={0.8} />
        <div
          style={{
            fontSize: 12,
            color: "var(--text-faint)",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.08em",
          }}
        >
          © 2026 UBER RENTALS · BY REQUEST ONLY · NOT INSTANT BOOKING
        </div>
      </footer>
    </div>
  );
}
