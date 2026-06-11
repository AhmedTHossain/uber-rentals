"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { Stat } from "@/components/primitives";
import { Badge } from "@/components/Badge";
import { statusMeta } from "@/lib/status";
import { money, fmtShort } from "@/lib/format";
import { markPaid } from "./actions";

export type PaymentRow = {
  id: string;
  weekStart: string;
  weekEnd: string;
  amount: number;
  status: string;
  bookingRef: string;
  insuranceType: string;
  renterName: string;
  blocked: boolean;
};

const FILTERS = ["ALL", "DUE", "OVERDUE", "PAID"];

export function PaymentsTable({
  rows,
  totals,
}: {
  rows: PaymentRow[];
  totals: { paid: number; due: number; overdue: number };
}) {
  const router = useRouter();
  const [filter, setFilter] = useState("ALL");
  const [blocked, setBlocked] = useState<{ ref: string; reason: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = rows.filter((p) => filter === "ALL" || p.status === filter);

  function onMarkPaid(p: PaymentRow) {
    startTransition(async () => {
      const res = await markPaid(p.id);
      if (!res.ok) {
        setBlocked({ ref: p.bookingRef, reason: res.reason });
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      <div className="r-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18, marginBottom: 24 }}>
        <Stat label="Collected" value={money(totals.paid)} sub="paid to date" />
        <Stat label="Due" value={money(totals.due)} tone="amber" sub="scheduled & current" />
        <Stat label="Overdue" value={money(totals.overdue)} tone="red" sub="needs follow-up" />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div className="pillbar">
          {FILTERS.map((f) => (
            <button key={f} className={filter === f ? "on" : ""} onClick={() => setFilter(f)}>
              {f === "ALL" ? "All" : statusMeta(f).label}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 11.5, color: "var(--text-faint)", fontFamily: "var(--font-mono)", display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--st-amber-fg)" }} />
          INSURANCE RULE ENFORCED ON PAYMENT
        </div>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Booking</th>
              <th>Renter</th>
              <th>Week</th>
              <th>Amount</th>
              <th>Insurance</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td>
                  <span className="mono" style={{ fontSize: 12, color: "var(--accent)" }}>{p.bookingRef}</span>
                </td>
                <td>{p.renterName}</td>
                <td className="mono" style={{ fontSize: 12.5, color: "var(--text-dim)" }}>
                  {fmtShort(p.weekStart)}–{fmtShort(p.weekEnd)}
                </td>
                <td>{money(p.amount)}</td>
                <td>
                  {p.blocked ? (
                    <span style={{ fontSize: 11.5, color: "var(--st-red-fg)", fontFamily: "var(--font-mono)" }}>⚠ BLOCKED</span>
                  ) : (
                    <span style={{ fontSize: 11.5, color: "var(--text-faint)", fontFamily: "var(--font-mono)" }}>OK</span>
                  )}
                </td>
                <td>
                  <Badge status={p.status} />
                </td>
                <td style={{ textAlign: "right" }}>
                  {p.status !== "PAID" ? (
                    <button className="btn btn-ghost btn-sm" onClick={() => onMarkPaid(p)} disabled={pending}>
                      Mark paid
                    </button>
                  ) : (
                    <span style={{ color: "var(--st-green-fg)", fontSize: 12.5 }}>✓ Paid</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!blocked}
        onClose={() => setBlocked(null)}
        eyebrow="Payment blocked"
        title="Insurance rule violation"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setBlocked(null)}>Close</button>
            <button
              className="btn btn-gold"
              onClick={() => {
                setBlocked(null);
                router.push("/admin/insurance");
              }}
            >
              Go to insurance →
            </button>
          </>
        }
      >
        {blocked && (
          <>
            <div style={{ display: "flex", gap: 14, padding: "16px 18px", borderRadius: 12, background: "var(--st-red-bg)", marginBottom: 16 }}>
              <span style={{ fontSize: 22 }}>⚠</span>
              <div>
                <div style={{ fontWeight: 600, color: "var(--st-red-fg)", fontSize: 14.5 }}>Cannot mark as paid</div>
                <div style={{ fontSize: 13, color: "var(--st-red-fg)", marginTop: 4, lineHeight: 1.5 }}>{blocked.reason}</div>
              </div>
            </div>
            <p style={{ fontSize: 13.5, color: "var(--text-dim)", lineHeight: 1.6, margin: 0 }}>
              Company-insured bookings require <b style={{ color: "var(--text)" }}>verified, non-expired</b> insurance before
              any payment can be recorded. Resolve the policy in Insurance, then retry.
            </p>
          </>
        )}
      </Modal>
    </div>
  );
}
