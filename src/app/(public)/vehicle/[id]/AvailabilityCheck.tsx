"use client";

import { useState } from "react";
import Link from "next/link";
import { fmtDate } from "@/lib/format";

type State =
  | { status: "idle" | "checking" }
  | { status: "available" }
  | { status: "unavailable" }
  | { status: "error"; msg: string };

export function AvailabilityCheck({ vehicleId }: { vehicleId: string }) {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [state, setState] = useState<State>({ status: "idle" });

  async function check() {
    if (!start || !end) return setState({ status: "error", msg: "Choose both dates." });
    if (end <= start) return setState({ status: "error", msg: "Return date must be after pick-up." });
    setState({ status: "checking" });
    try {
      const r = await fetch(`/api/vehicles/${vehicleId}/availability?start=${start}&end=${end}`);
      const d = (await r.json()) as { available?: boolean; error?: string };
      if (!r.ok) return setState({ status: "error", msg: d.error || "Couldn't check availability." });
      setState({ status: d.available ? "available" : "unavailable" });
    } catch {
      setState({ status: "error", msg: "Network error — please try again." });
    }
  }

  // Requesting a vehicle needs no account, so this always goes straight to the
  // form. Sending anyone to /login here was what put staff — and any signed-in
  // non-renter — in the admin area instead of the booking flow.
  const bookHref = `/book/${vehicleId}?start=${start}&end=${end}`;

  return (
    <div>
      <div className="r-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s3)", marginBottom: "var(--s3)" }}>
        <div>
          <div className="field-label">Pick-up date</div>
          <input className="input" type="date" value={start} min={new Date().toISOString().slice(0, 10)} onChange={(e) => { setStart(e.target.value); setState({ status: "idle" }); }} />
        </div>
        <div>
          <div className="field-label">Return date</div>
          <input className="input" type="date" value={end} min={start || new Date().toISOString().slice(0, 10)} onChange={(e) => { setEnd(e.target.value); setState({ status: "idle" }); }} />
        </div>
      </div>

      {/* The result is stated above the button, where it reads before the
          action rather than as an afterthought below it. */}
      {state.status === "available" && (
        <p className="notice notice-green" style={{ marginBottom: "var(--s3)" }}>
          Available {fmtDate(start)} → {fmtDate(end)}
        </p>
      )}
      {state.status === "unavailable" && (
        <p className="notice notice-amber" style={{ marginBottom: "var(--s3)" }}>
          Not available for these dates — try a different window.
        </p>
      )}
      {state.status === "error" && (
        <p className="notice notice-red" style={{ marginBottom: "var(--s3)" }}>
          {state.msg}
        </p>
      )}

      {state.status !== "available" ? (
        <button className="btn btn-gold btn-lg" onClick={check} disabled={state.status === "checking"} style={{ width: "100%" }}>
          {state.status === "checking" ? "Checking…" : "Check availability"}
        </button>
      ) : (
        <Link href={bookHref} className="btn btn-gold btn-lg" style={{ width: "100%" }}>
          Request this vehicle
        </Link>
      )}
    </div>
  );
}
