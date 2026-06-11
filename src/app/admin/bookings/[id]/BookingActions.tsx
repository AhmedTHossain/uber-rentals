"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { Field, InfoRow } from "@/components/primitives";
import { fmtDate } from "@/lib/format";
import { transitionBooking } from "../actions";

export function BookingActions({
  bookingId,
  reference,
  status,
  model,
  startDate,
  endDate,
  conflict,
}: {
  bookingId: string;
  reference: string;
  status: string;
  model: string;
  startDate: string;
  endDate: string;
  conflict: boolean;
}) {
  const router = useRouter();
  const [modal, setModal] = useState<null | "approve" | "reject">(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(to: "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "ACTIVE" | "COMPLETED", r?: string) {
    setError(null);
    startTransition(async () => {
      const res = await transitionBooking(bookingId, to, r);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setModal(null);
      setReason("");
      router.refresh();
    });
  }

  return (
    <>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {status === "REQUESTED" && (
          <button className="btn btn-ghost" disabled={pending} onClick={() => run("UNDER_REVIEW")}>
            Start review
          </button>
        )}
        {(status === "REQUESTED" || status === "UNDER_REVIEW") && (
          <>
            <button className="btn btn-danger" disabled={pending} onClick={() => setModal("reject")}>
              Reject
            </button>
            <button className="btn btn-gold" disabled={pending} onClick={() => setModal("approve")}>
              Approve
            </button>
          </>
        )}
        {status === "APPROVED" && (
          <button className="btn btn-gold" disabled={pending} onClick={() => run("ACTIVE")}>
            Mark active
          </button>
        )}
        {status === "ACTIVE" && (
          <button className="btn btn-dark" disabled={pending} onClick={() => run("COMPLETED")}>
            Mark completed
          </button>
        )}
      </div>

      {/* approve modal */}
      <Modal
        open={modal === "approve"}
        onClose={() => setModal(null)}
        eyebrow="Confirm approval"
        title="Approve this booking?"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModal(null)}>
              Cancel
            </button>
            <button className="btn btn-gold" disabled={conflict || pending} onClick={() => run("APPROVED")}>
              Approve booking
            </button>
          </>
        }
      >
        <p style={{ fontSize: 14, color: "var(--text-dim)", marginTop: 0, lineHeight: 1.6 }}>
          Approving <span className="mono" style={{ color: "var(--text)" }}>{reference}</span> will reserve the {model}{" "}
          for these dates and block availability for any overlapping requests.
        </p>
        <div className="card" style={{ padding: "14px 16px", background: "var(--surface-2)" }}>
          <InfoRow k="Dates" v={`${fmtDate(startDate)} → ${fmtDate(endDate)}`} />
          <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", fontSize: 13 }}>
            <span style={{ color: "var(--text-dim)" }}>Availability check</span>
            <span style={{ color: conflict ? "var(--st-red-fg)" : "var(--st-green-fg)", fontWeight: 500 }}>
              {conflict ? "Date conflict — cannot approve" : "No conflicts"}
            </span>
          </div>
        </div>
        {conflict && (
          <p style={{ fontSize: 12.5, color: "var(--st-red-fg)", marginBottom: 0 }}>
            Another approved or active booking overlaps these dates. Resolve the conflict before approving.
          </p>
        )}
        {error && <p style={{ fontSize: 12.5, color: "var(--st-red-fg)", marginBottom: 0 }}>{error}</p>}
      </Modal>

      {/* reject modal */}
      <Modal
        open={modal === "reject"}
        onClose={() => setModal(null)}
        eyebrow="Confirm rejection"
        title="Reject this booking?"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModal(null)}>
              Cancel
            </button>
            <button className="btn btn-danger" disabled={pending} onClick={() => run("REJECTED", reason)}>
              Reject booking
            </button>
          </>
        }
      >
        <p style={{ fontSize: 14, color: "var(--text-dim)", marginTop: 0, lineHeight: 1.6 }}>
          The renter will be notified that request <span className="mono" style={{ color: "var(--text)" }}>{reference}</span>{" "}
          was declined. This does not block availability.
        </p>
        <Field label="Reason (internal)">
          <textarea
            className="input"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Insurance policy expired; license verification failed…"
          />
        </Field>
        {error && <p style={{ fontSize: 12.5, color: "var(--st-red-fg)", marginBottom: 0 }}>{error}</p>}
      </Modal>
    </>
  );
}
