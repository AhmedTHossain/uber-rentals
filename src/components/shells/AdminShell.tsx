"use client";

import { useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/components/useTheme";

type NavItem = [href: string, label: string, iconPath: string];

// Eleven flat items with no grouping made the rail a wall. The three
// groups are how the work actually divides.
const NAV: [group: string, items: NavItem[]][] = [
  [
    "Operations",
    [
      ["/admin", "Overview", "M3 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H8v6H4a1 1 0 0 1-1-1z"],
      ["/admin/bookings", "Bookings", "M5 3h14v18l-7-4-7 4z"],
      ["/admin/messages", "Messages", "M3 5h18v14H3zM3 6l9 7 9-7"],
      ["/admin/calendar", "Fleet Calendar", "M3 5h18v16H3zM3 9h18M8 3v4M16 3v4"],
      ["/admin/renters", "Renters", "M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM21 19v-1a4 4 0 0 0-3-3.87M16 4.13A4 4 0 0 1 16 11.5"],
    ],
  ],
  [
    "Money & risk",
    [
      ["/admin/insurance", "Insurance", "M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z"],
      ["/admin/payments", "Payments", "M3 6h18v12H3zM3 10h18"],
      ["/admin/vehicles", "Vehicles", "M5 16l1-5h12l1 5M4 16h16v3H4zM7 19v1M17 19v1"],
    ],
  ],
  [
    "System",
    [
      ["/admin/automations", "Automations", "M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"],
      ["/admin/audit", "Audit Log", "M4 4h16v16H4zM8 9h8M8 13h8M8 17h5"],
      ["/admin/access", "Access control", "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4"],
    ],
  ],
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

// Detail routes render their own header (reference, status, actions), so the
// shell must not stack a second title above it.
function hasOwnHeader(pathname: string): boolean {
  return pathname.startsWith("/admin/bookings/") || pathname.startsWith("/admin/renters/");
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
          width: 236,
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
        <div style={{ padding: "var(--s5) var(--s4) var(--s4)" }}>
          <div onClick={() => router.push("/admin")} className="sb-collapse" style={{ cursor: "pointer", color: "var(--sb-text)" }}>
            <Logo size={0.9} />
          </div>
        </div>
        <nav style={{ padding: "0 var(--s3)", flex: 1, overflowY: "auto" }}>
          {NAV.map(([group, items]) => (
            <div key={group}>
              <div className="sb-group">{group}</div>
              {items.map(([href, label, d]) => (
                <a key={href} onClick={() => router.push(href)} className={`sb-nav-item${isActive(href) ? " on" : ""}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round">
                    <path d={d} />
                  </svg>
                  <span className="sb-navlabel">{label}</span>
                </a>
              ))}
            </div>
          ))}
        </nav>
        <div style={{ padding: "var(--s3)", borderTop: "1px solid var(--sb-border)" }}>
          {/* The theme control lived in a sticky header that carried nothing
              else. With it here, that whole header layer could go. */}
          <div className="sb-sub" style={{ paddingLeft: 4 }}>
            <ThemeToggle value={theme} onToggle={toggle} />
            <span className="sb-collapse">Appearance</span>
          </div>
          <a onClick={() => router.push("/")} className="sb-sub">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 4h6v6M20 4l-8 8M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
            </svg>
            <span>View public site</span>
          </a>
          <a onClick={() => signOut({ callbackUrl: "/login" })} className="sb-sub">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 20H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5M16 15l4-3-4-3M20 12H9" />
            </svg>
            <span>Sign out</span>
          </a>
          {/* The role line said "Fleet Admin · manage team" — half label, half
              instruction. The name and role are the content; the row being
              clickable is what "manage team" was trying to say. */}
          <div
            onClick={() => router.push("/admin/access")}
            title="Manage team"
            className="sb-sub"
            style={{ height: "auto", padding: "var(--s2) 10px", marginTop: "var(--s2)" }}
          >
            <div
              className="avatar"
              style={{ width: 30, height: 30, background: "rgba(198,160,82,0.16)", color: "var(--accent)", fontSize: "var(--t-xs)" }}
            >
              {initials}
            </div>
            <div className="sb-collapse" style={{ lineHeight: 1.3, minWidth: 0 }}>
              <div style={{ fontSize: "var(--t-sm)", color: "var(--sb-text)" }}>{adminName}</div>
              <div style={{ fontSize: "var(--t-xs)", color: "var(--sb-dim)" }}>Fleet admin</div>
            </div>
          </div>
        </div>
      </aside>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* No sticky header bar. It held a page title that restated the active
            sidebar item and a theme toggle that now lives in the rail — a
            whole chrome layer for nothing. The title is part of the page. */}
        <div className="admin-main-pad" style={{ padding: "var(--s7) var(--s7) var(--s10)", maxWidth: 1160 }}>
          {!hasOwnHeader(pathname) && (
            <h1 className="h-page" style={{ marginBottom: "var(--s6)" }}>
              {titleFor(pathname)}
            </h1>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
