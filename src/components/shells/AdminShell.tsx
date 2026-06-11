"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/components/useTheme";
import { TeamModal } from "./TeamModal";

type NavItem = [href: string, label: string, iconPath: string];

const NAV: NavItem[] = [
  ["/admin", "Overview", "M3 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H8v6H4a1 1 0 0 1-1-1z"],
  ["/admin/bookings", "Bookings", "M5 3h14v18l-7-4-7 4z"],
  ["/admin/calendar", "Fleet Calendar", "M3 5h18v16H3zM3 9h18M8 3v4M16 3v4"],
  ["/admin/renters", "Renters", "M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM21 19v-1a4 4 0 0 0-3-3.87M16 4.13A4 4 0 0 1 16 11.5"],
  ["/admin/insurance", "Insurance", "M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z"],
  ["/admin/payments", "Payments", "M3 6h18v12H3zM3 10h18"],
  ["/admin/vehicles", "Vehicles", "M5 16l1-5h12l1 5M4 16h16v3H4zM7 19v1M17 19v1"],
  ["/admin/automations", "Automations", "M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"],
  ["/admin/audit", "Audit Log", "M4 4h16v16H4zM8 9h8M8 13h8M8 17h5"],
];

const TITLES: Record<string, string> = {
  "/admin": "Overview",
  "/admin/bookings": "Bookings",
  "/admin/calendar": "Fleet Calendar",
  "/admin/renters": "Renters",
  "/admin/insurance": "Insurance",
  "/admin/payments": "Payments",
  "/admin/vehicles": "Vehicles",
  "/admin/automations": "Automations",
  "/admin/audit": "Audit Log",
};

function titleFor(pathname: string): string {
  if (pathname.startsWith("/admin/bookings/")) return "Booking detail";
  if (pathname.startsWith("/admin/renters/")) return "Renter profile";
  return TITLES[pathname] ?? "Admin";
}

export function AdminShell({
  children,
  adminName = "A. Bello",
}: {
  children: React.ReactNode;
  adminName?: string;
}) {
  const { theme, toggle } = useTheme("ur-admin-theme", "light");
  const router = useRouter();
  const pathname = usePathname();
  const [team, setTeam] = useState(false);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  const initials = adminName.split(" ").map((n) => n[0]).slice(0, 2).join("");

  return (
    <div className={`theme-${theme}`} style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <aside
        className="admin-sidebar"
        style={{
          width: 248,
          background: "var(--sb-bg)",
          borderRight: "1px solid var(--sb-border)",
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          height: "100vh",
          flexShrink: 0,
        }}
      >
        <div style={{ padding: "24px 22px 20px", borderBottom: "1px solid var(--sb-border)" }}>
          <div onClick={() => router.push("/admin")} className="sb-collapse" style={{ cursor: "pointer", color: "var(--sb-text)" }}>
            <Logo size={0.92} tagline />
          </div>
        </div>
        <nav style={{ padding: "16px 12px", flex: 1 }}>
          <div className="sb-collapse" style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.18em", color: "var(--sb-dim)", padding: "6px 12px 10px" }}>
            OPERATIONS
          </div>
          {NAV.map(([href, label, d]) => (
            <a key={href} onClick={() => router.push(href)} className={`sb-nav-item${isActive(href) ? " on" : ""}`}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" style={{ flexShrink: 0 }}>
                <path d={d} />
              </svg>
              <span className="sb-navlabel">{label}</span>
            </a>
          ))}
        </nav>
        <div className="sb-collapse" style={{ padding: "16px", borderTop: "1px solid var(--sb-border)" }}>
          <a onClick={() => router.push("/")} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--sb-dim)", cursor: "pointer", padding: "4px 8px" }}>
            ↗ View public site
          </a>
          <a onClick={() => signOut({ callbackUrl: "/login" })} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--sb-dim)", cursor: "pointer", padding: "4px 8px", marginTop: 2 }}>
            ⎋ Sign out
          </a>
          <div
            onClick={() => setTeam(true)}
            title="Manage team"
            style={{ display: "flex", alignItems: "center", gap: 11, marginTop: 14, padding: "8px", borderRadius: 9, cursor: "pointer" }}
          >
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--accent)", color: "#15130c", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontFamily: "var(--font-display)", fontSize: 15 }}>
              {initials}
            </div>
            <div style={{ lineHeight: 1.3 }}>
              <div style={{ fontSize: 13, color: "var(--sb-text)" }}>{adminName}</div>
              <div style={{ fontSize: 11, color: "var(--sb-dim)" }}>Fleet Admin · manage team</div>
            </div>
          </div>
        </div>
      </aside>

      <div style={{ flex: 1, minWidth: 0 }}>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 36px",
            borderBottom: "1px solid var(--border)",
            background: "var(--surface)",
            position: "sticky",
            top: 0,
            zIndex: 50,
          }}
        >
          <div>
            <div className="eyebrow" style={{ color: "var(--text-faint)" }}>Uber Rentals · Admin</div>
            <h1 style={{ margin: "4px 0 0", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 27, color: "var(--text)" }}>
              {titleFor(pathname)}
            </h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div className="admin-header-search" style={{ position: "relative" }}>
              <input className="input" placeholder="Search reference, plate, name…" style={{ width: 280, paddingLeft: 36, background: "var(--surface-2)" }} />
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="2" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4-4" />
              </svg>
            </div>
            <ThemeToggle value={theme} onToggle={toggle} />
          </div>
        </header>
        <div className="admin-main-pad" style={{ padding: "30px 36px 60px", maxWidth: 1280 }}>
          {children}
        </div>
      </div>

      <TeamModal open={team} onClose={() => setTeam(false)} />
    </div>
  );
}
