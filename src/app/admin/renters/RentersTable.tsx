"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/primitives";
import { fmtShort, addDays, today } from "@/lib/format";

export type RenterRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  city: string;
  state: string;
  licenseState: string;
  licenseExpiry: string | null;
  bookingCount: number;
};

export function RentersTable({ rows }: { rows: RenterRow[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const expThreshold = addDays(today(), 60);

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    return rows.filter((r) =>
      `${r.firstName} ${r.lastName} ${r.email} ${r.city}`.toLowerCase().includes(needle),
    );
  }, [rows, q]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, gap: 14, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 260px", maxWidth: 340 }}>
          <input
            className="input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search renters…"
            style={{ paddingLeft: 36, background: "var(--surface-2)" }}
          />
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="2" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4-4" />
          </svg>
        </div>
        <div style={{ fontSize: 12.5, color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>
          {filtered.length} RENTERS
        </div>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Location</th>
              <th>License</th>
              <th>Bookings</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const expSoon = !!r.licenseExpiry && r.licenseExpiry < expThreshold;
              return (
                <tr key={r.id} onClick={() => router.push(`/admin/renters/${r.id}`)} style={{ cursor: "pointer" }}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                      <Avatar name={`${r.firstName} ${r.lastName}`} />
                      <span style={{ fontWeight: 500 }}>
                        {r.firstName} {r.lastName}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span style={{ color: "var(--text-dim)" }}>{r.email}</span>
                  </td>
                  <td>
                    {r.city}, {r.state}
                  </td>
                  <td>
                    <span className="mono" style={{ fontSize: 12.5, color: expSoon ? "var(--st-amber-fg)" : "var(--text-dim)" }}>
                      {r.licenseState || "—"} · exp {r.licenseExpiry ? fmtShort(r.licenseExpiry) : "—"}
                    </span>
                  </td>
                  <td>{r.bookingCount}</td>
                  <td style={{ textAlign: "right" }}>
                    <span style={{ color: "var(--accent)", fontSize: 12.5 }}>Profile →</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
