"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { Field, InfoRow } from "@/components/primitives";
import { PhotoSlot } from "@/components/PhotoSlot";
import { Badge } from "@/components/Badge";
import { statusMeta } from "@/lib/status";
import { fmtDate, today } from "@/lib/format";
import { setInsuranceStatus, editInsurance } from "./actions";

export type InsuranceRow = {
  id: string;
  providerName: string;
  policyNumber: string;
  type: string;
  status: string;
  expiryDate: string;
  agentPhone: string | null;
  agentEmail: string | null;
  policyAddress: string | null;
  cardFrontUrl: string | null;
  cardBackUrl: string | null;
  bookingRef: string | null;
};

const FILTERS = ["ALL", "PENDING", "VERIFIED", "REJECTED"];

type EditFields = {
  providerName: string;
  policyNumber: string;
  expiryDate: string;
  agentPhone: string;
  agentEmail: string;
  policyAddress: string;
};

export function InsuranceTable({ rows }: { rows: InsuranceRow[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState("ALL");
  const [sel, setSel] = useState<InsuranceRow | null>(null);
  const [editing, setEditing] = useState(false);
  const [d, setD] = useState<EditFields | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = rows.filter((i) => filter === "ALL" || i.status === filter);

  function close() {
    setSel(null);
    setEditing(false);
    setD(null);
  }
  function openEdit(i: InsuranceRow) {
    setD({
      providerName: i.providerName,
      policyNumber: i.policyNumber,
      expiryDate: i.expiryDate,
      agentPhone: i.agentPhone ?? "",
      agentEmail: i.agentEmail ?? "",
      policyAddress: i.policyAddress ?? "",
    });
    setEditing(true);
  }
  function saveEdit() {
    if (!sel || !d) return;
    startTransition(async () => {
      await editInsurance(sel.id, d);
      setEditing(false);
      router.refresh();
      close();
    });
  }
  function act(i: InsuranceRow, status: "VERIFIED" | "REJECTED") {
    startTransition(async () => {
      await setInsuranceStatus(i.id, status);
      router.refresh();
      close();
    });
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div className="pillbar">
          {FILTERS.map((f) => (
            <button key={f} className={filter === f ? "on" : ""} onClick={() => setFilter(f)}>
              {f === "ALL" ? "All" : statusMeta(f).label}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 12.5, color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>
          {filtered.length} POLICIES
        </div>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Provider</th>
              <th>Booking</th>
              <th>Type</th>
              <th>Policy #</th>
              <th>Expiry</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => {
              const expired = i.expiryDate < today();
              return (
                <tr key={i.id} onClick={() => setSel(i)} style={{ cursor: "pointer" }}>
                  <td>{i.providerName}</td>
                  <td>
                    <span className="mono" style={{ fontSize: 12, color: "var(--accent)" }}>{i.bookingRef ?? "—"}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>{i.type}</span>
                  </td>
                  <td className="mono" style={{ fontSize: 12.5, color: "var(--text-dim)" }}>{i.policyNumber}</td>
                  <td style={{ color: expired ? "var(--st-red-fg)" : "var(--text)" }}>
                    {fmtDate(i.expiryDate)}{expired ? " · expired" : ""}
                  </td>
                  <td>
                    <Badge status={i.status} />
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <span style={{ color: "var(--accent)", fontSize: 12.5 }}>Review →</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!sel}
        onClose={close}
        width={680}
        eyebrow={sel ? `${sel.type} policy` : ""}
        title={sel ? sel.providerName : ""}
        footer={
          sel &&
          (editing ? (
            <>
              <button className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
              <button className="btn btn-gold" onClick={saveEdit} disabled={pending}>Save details</button>
            </>
          ) : (
            <>
              <button className="btn btn-ghost" style={{ marginRight: "auto" }} onClick={() => sel && openEdit(sel)}>
                Edit details
              </button>
              <button className="btn btn-ghost" onClick={close}>Close</button>
              {sel.status !== "REJECTED" && (
                <button className="btn btn-danger" onClick={() => act(sel, "REJECTED")} disabled={pending}>Reject</button>
              )}
              {sel.status !== "VERIFIED" && (
                <button className="btn btn-gold" onClick={() => act(sel, "VERIFIED")} disabled={pending}>Verify</button>
              )}
            </>
          ))
        }
      >
        {sel && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
              <div>
                <div className="field-label">Insurance card — front</div>
                <PhotoSlot label="SCANNED DOCUMENT" src={sel.cardFrontUrl} ratio="16 / 10" radius={10} readOnly />
              </div>
              <div>
                <div className="field-label">Insurance card — back</div>
                <PhotoSlot label="SCANNED DOCUMENT" src={sel.cardBackUrl} ratio="16 / 10" radius={10} readOnly />
              </div>
            </div>
            {editing && d ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Field label="Provider" span={2}>
                  <input className="input" value={d.providerName} onChange={(e) => setD({ ...d, providerName: e.target.value })} />
                </Field>
                <Field label="Policy number">
                  <input className="input" value={d.policyNumber} onChange={(e) => setD({ ...d, policyNumber: e.target.value })} />
                </Field>
                <Field label="Expiry">
                  <input className="input" type="date" value={d.expiryDate} onChange={(e) => setD({ ...d, expiryDate: e.target.value })} />
                </Field>
                <Field label="Agent phone">
                  <input className="input" value={d.agentPhone} onChange={(e) => setD({ ...d, agentPhone: e.target.value })} />
                </Field>
                <Field label="Agent email">
                  <input className="input" value={d.agentEmail} onChange={(e) => setD({ ...d, agentEmail: e.target.value })} />
                </Field>
                <Field label="Policy address" span={2}>
                  <input className="input" value={d.policyAddress} onChange={(e) => setD({ ...d, policyAddress: e.target.value })} />
                </Field>
              </div>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 30px" }}>
                  <InfoRow k="Status" v={statusMeta(sel.status).label} />
                  <InfoRow k="Expiry" v={fmtDate(sel.expiryDate)} />
                  <InfoRow k="Policy #" v={sel.policyNumber} mono />
                  <InfoRow k="Type" v={sel.type} />
                  <InfoRow k="Agent phone" v={sel.agentPhone ?? "—"} mono />
                  <InfoRow k="Agent email" v={sel.agentEmail ?? "—"} />
                </div>
                <div style={{ marginTop: 8 }}>
                  <InfoRow k="Policy address" v={sel.policyAddress ?? "—"} />
                </div>
              </>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
