"use client";

import { useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/components/useTheme";

type NavItem = [href: string, label: string, iconPath: string];

const NAV: NavItem[] = [
  ["/admin", "Overview", "M3 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H8v6H4a1 1 0 0 1-1-1z"],
  ["/admin/bookings", "Bookings", "M5 3h14v18l-7-4-7 4z"],
  ["/admin/messages", "Messages", "M3 5h18v14H3zM3 6l9 7 9-7"],
  ["/admin/calendar", "Fleet Calendar", "M3 5h18v16H3zM3 9h18M8 3v4M16 3v4"],
  ["/admin/renters", "Renters", "M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM21 19v-1a4 4 0 0 0-3-3.87M16 4.13A4 4 0 0 1 16 11.5"],
  ["/admin/insurance", "Insurance", "M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z"],
  ["/admin/payments", "Payments", "M3 6h18v12H3zM3 10h18"],
  ["/admin/vehicles", "Vehicles", "M5 16l1-5h12l1 5M4 16h16v3H4zM7 19v1M17 19v1"],
  ["/admin/automations", "Automations", "M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"],
  ["/admin/audit", "Audit Log", "M4 4h16v16H4zM8 9h8M8 13h8M8 17h5"],
  ["/admin/access", "Access control", "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4"],
];

const TITLES: Record<string, string> = {
  "/admin": "Overview",
  "/admin/bookings": "Bookings",
  "/admin/messages": "Messages",
  "/admin/calendar": "Fleet Calendar",
  "/admin/renters": "Renters",
  "/admin/insurance": "Insurance",
  "/admin/payments": "Payments",
  "/admin/vehicles": "Vehicles",
  "/admin/automations": "Automations",
  "/admin/audit": "Audit Log",
  "/admin/access": "Access control",
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
  const { theme, toggle } = useTheme("ur-theme-admin");
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  const initials = adminName.split(" ").map((n) => n[0]).slice(0, 2).join("");

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
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
            <Logo size={0.92} />
          </div>
        </div>
        {/* No "OPERATIONS" group label: there is only one group, so it labels
            nothing and just adds a line of chrome above the nav. */}
        <nav style={{ padding: "16px 12px", flex: 1 }}>
          {NAV.map(([href, label, d]) => (
            <a key={href} onClick={() => router.push(href)} className={`sb-nav-item${isActive(href) ? " on" : ""}`}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" style={{ flexShrink: 0 }}>
                <path d={d} />
              </svg>
              <span className="sb-navlabel">{label}</span>
            </a>
          ))}
        </nav>
        <div className="sb-collapse" style={{ padding: "var(--s4)", borderTop: "1px solid var(--sb-border)" }}>
          <a onClick={() => router.push("/")} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "var(--t-base)", color: "var(--sb-dim)", cursor: "pointer", padding: "4px 8px" }}>
            View public site ↗
          </a>
          <a onClick={() => signOut({ callbackUrl: "/login" })} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "var(--t-base)", color: "var(--sb-dim)", cursor: "pointer", padding: "4px 8px", marginTop: 2 }}>
            Sign out
          </a>
          {/* The role line said "Fleet Admin · manage team" — half label, half
              instruction. The name and role are the content; the row being
              clickable is what "manage team" was trying to say. */}
          <div
            onClick={() => router.push("/admin/access")}
            title="Manage team"
            style={{ display: "flex", alignItems: "center", gap: 11, marginTop: "var(--s3)", padding: "var(--s2)", borderRadius: "var(--r-md)", cursor: "pointer" }}
          >
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--accent)", color: "#15130c", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontFamily: "var(--font-display)", fontSize: "var(--t-md)" }}>
              {initials}
            </div>
            <div style={{ lineHeight: 1.35 }}>
              <div style={{ fontSize: "var(--t-base)", color: "var(--sb-text)" }}>{adminName}</div>
              <div style={{ fontSize: "var(--t-xs)", color: "var(--sb-dim)" }}>Fleet admin</div>
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
          {/* The "DMV Rentals · Admin" eyebrow is dropped: the sidebar carries
              the wordmark and the whole chrome is the admin, so it labelled
              the surface the reader is already looking at. */}
          <h1 className="h-section" style={{ color: "var(--text)" }}>
            {titleFor(pathname)}
          </h1>
          {/* The global search box that sat here had no handler and no results
              view — it promised a capability the app does not have. Put it
              back with the search wired up, not before. */}
          <ThemeToggle value={theme} onToggle={toggle} />
        </header>
        <div className="admin-main-pad" style={{ padding: "30px 36px 60px", maxWidth: 1280 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
