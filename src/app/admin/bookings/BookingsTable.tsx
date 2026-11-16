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
        <div style={{ fontSize: "var(--t-sm)", color: "var(--text-dim)" }}>
          {filtered.length} {filtered.length === 1 ? "booking" : "bookings"}
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
            padding: "var(--s3) var(--s4)",
            marginBottom: 14,
            background: "var(--surface-2)",
            borderColor: "var(--border-strong)",
          }}
        >
          <span style={{ fontSize: "var(--t-base)", fontWeight: 500 }}>{selIds.length} selected</span>
          <span style={{ fontSize: "var(--t-sm)", color: "var(--text-dim)" }}>
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
              <th style={{ width: 40 }}>
                <input type="checkbox" checked={allOn} onChange={toggleAll} aria-label="Select all bookings" />
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
              // The row itself is the control. It used to carry cursor:pointer
              // with an onClick on each cell and no tabindex, so the admin's
              // primary navigation could not be reached by keyboard at all.
              <tr
                key={b.id}
                className={`is-link${sel[b.id] ? " is-sel" : ""}`}
                tabIndex={0}
                role="link"
                aria-label={`Open booking ${b.reference}`}
                onClick={() => go(b.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    go(b.id);
                  }
                }}
              >
                <td onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={!!sel[b.id]}
                    aria-label={`Select booking ${b.reference}`}
                    onChange={() => toggle(b.id)}
                  />
                </td>
                <td>
                  {/* A reference is one token — wrapping it mid-string makes
                      it unreadable and unsearchable by eye. */}
                  <span className="ref">{b.reference}</span>
                </td>
                <td>
                  {b.firstName} {b.lastName}
                </td>
                <td>
                  <span style={{ color: "var(--text-dim)" }}>
                    {b.year} {b.make} {b.model}
                  </span>
                </td>
                <td className="num" style={{ fontSize: "var(--t-sm)", color: "var(--text-dim)" }}>
                  {fmtShort(b.startDate)}–{fmtShort(b.endDate)}
                </td>
                <td>
                  <span style={{ fontSize: "var(--t-sm)", color: "var(--text-dim)" }}>
                    {b.insuranceType === "COMPANY" ? "Company" : "Customer"}
                  </span>
                </td>
                <td>
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
