"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

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
        <nav style={{ display: "flex", alignItems: "center", gap: 32, fontSize: 13.5 }}>
          <Link href="/" className="nav-link" style={{ color: "var(--text-dim)" }}>
            Fleet
          </Link>
          <a className="nav-link" style={{ cursor: "pointer", color: "var(--text-dim)" }}>
            How it works
          </a>
          <a className="nav-link" style={{ cursor: "pointer", color: "var(--text-dim)" }}>
            Contact
          </a>
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
          <button className="btn btn-ghost btn-sm" onClick={() => router.push("/admin")}>
            Admin Portal
          </button>
        </nav>
      </header>
      <main
        className="public-main"
        style={{ position: "relative", zIndex: 1, maxWidth: 1280, margin: "0 auto", padding: "0 42px 90px" }}
      >
        {children}
      </main>
      <footer
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
