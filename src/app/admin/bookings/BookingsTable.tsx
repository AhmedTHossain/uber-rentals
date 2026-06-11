"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/Badge";
import { statusMeta } from "@/lib/status";
import { fmtShort } from "@/lib/format";
import { bulkTransition } from "./actions";

export type BookingRow = {
  id: string;
  reference: string;
  status: string;
  startDate: string;
  endDate: string;
  insuranceType: string;
  firstName: string;
  lastName: string;
  year: number;
  make: string;
  model: string;
};

const BK_FILTERS = [
  "ALL",
  "REQUESTED",
  "UNDER_REVIEW",
  "APPROVED",
  "ACTIVE",
  "COMPLETED",
  "REJECTED",
];

export function BookingsTable({ rows }: { rows: BookingRow[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState("ALL");
  const [sel, setSel] = useState<Record<string, boolean>>({});
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(
    () => rows.filter((b) => filter === "ALL" || b.status === filter),
    [rows, filter],
  );

  const selIds = Object.keys(sel).filter((k) => sel[k]);
  const selPending = selIds.filter((id) => {
    const b = rows.find((x) => x.id === id);
    return b && (b.status === "REQUESTED" || b.status === "UNDER_REVIEW");
  });
  const toggle = (id: string) => setSel((s) => ({ ...s, [id]: !s[id] }));
  const allOn = filtered.length > 0 && filtered.every((b) => sel[b.id]);
  const toggleAll = () => {
    if (allOn) {
      setSel({});
    } else {
      const ns: Record<string, boolean> = {};
      filtered.forEach((b) => (ns[b.id] = true));
      setSel(ns);
    }
  };

  function bulk(to: "APPROVED" | "REJECTED") {
    const ids = [...selPending];
    startTransition(async () => {
      await bulkTransition(ids, to);
      setSel({});
      router.refresh();
    });
  }

  const go = (id: string) => router.push(`/admin/bookings/${id}`);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 14 }}>
        <div className="pillbar">
          {BK_FILTERS.map((f) => (
            <button key={f} className={filter === f ? "on" : ""} onClick={() => setFilter(f)}>
              {f === "ALL" ? "All" : statusMeta(f).label}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 12.5, color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>
          {filtered.length} BOOKINGS
        </div>
      </div>

      {/* bulk action bar */}
      {selIds.length > 0 && (
        <div
          className="card"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "12px 18px",
            marginBottom: 14,
            background: "var(--surface-2)",
            borderColor: "var(--border-strong)",
          }}
        >
          <span style={{ fontSize: 13.5, fontWeight: 500 }}>{selIds.length} selected</span>
          <span style={{ fontSize: 12.5, color: "var(--text-dim)" }}>
            {selPending.length} actionable (requested / under review)
          </span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setSel({})} disabled={pending}>
              Clear
            </button>
            <button className="btn btn-danger btn-sm" disabled={!selPending.length || pending} onClick={() => bulk("REJECTED")}>
              Reject selected
            </button>
            <button className="btn btn-gold btn-sm" disabled={!selPending.length || pending} onClick={() => bulk("APPROVED")}>
              Approve selected
            </button>
          </div>
        </div>
      )}

      <div className="card" style={{ overflow: "hidden" }}>
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 36 }}>
                <input type="checkbox" checked={allOn} onChange={toggleAll} style={{ accentColor: "var(--accent)", cursor: "pointer" }} />
              </th>
              <th>Reference</th>
              <th>Renter</th>
              <th>Vehicle</th>
              <th>Dates</th>
              <th>Insurance</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => (
              <tr key={b.id} style={{ background: sel[b.id] ? "var(--accent-soft)" : undefined }}>
                <td onClick={(e) => { e.stopPropagation(); toggle(b.id); }}>
                  <input type="checkbox" checked={!!sel[b.id]} onChange={() => toggle(b.id)} style={{ accentColor: "var(--accent)", cursor: "pointer" }} />
                </td>
                <td onClick={() => go(b.id)} style={{ cursor: "pointer" }}>
                  <span className="mono" style={{ color: "var(--accent)", fontSize: 12.5 }}>{b.reference}</span>
                </td>
                <td onClick={() => go(b.id)} style={{ cursor: "pointer" }}>
                  {b.firstName} {b.lastName}
                </td>
                <td onClick={() => go(b.id)} style={{ cursor: "pointer" }}>
                  <span style={{ color: "var(--text-dim)" }}>
                    {b.year} {b.make} {b.model}
                  </span>
                </td>
                <td onClick={() => go(b.id)} className="mono" style={{ fontSize: 12.5, color: "var(--text-dim)", cursor: "pointer" }}>
                  {fmtShort(b.startDate)}–{fmtShort(b.endDate)}
                </td>
                <td onClick={() => go(b.id)} style={{ cursor: "pointer" }}>
                  <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>{b.insuranceType}</span>
                </td>
                <td onClick={() => go(b.id)} style={{ cursor: "pointer" }}>
                  <Badge status={b.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
