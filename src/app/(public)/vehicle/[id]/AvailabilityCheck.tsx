"use client";

import { useState } from "react";
import Link from "next/link";

type State =
  | { status: "idle" | "checking" }
  | { status: "available" }
  | { status: "unavailable" }
  | { status: "error"; msg: string };

export function AvailabilityCheck({ vehicleId, isRenter }: { vehicleId: string; isRenter: boolean }) {
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

  const dates = `start=${start}&end=${end}`;
  const bookHref = isRenter
    ? `/book/${vehicleId}?${dates}`
    : `/login?callbackUrl=${encodeURIComponent(`/book/${vehicleId}?${dates}`)}`;

  return (
    <div>
      <div className="r-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <div className="field-label">Pick-up date</div>
          <input className="input" type="date" value={start} min={new Date().toISOString().slice(0, 10)} onChange={(e) => { setStart(e.target.value); setState({ status: "idle" }); }} />
        </div>
        <div>
          <div className="field-label">Return date</div>
          <input className="input" type="date" value={end} min={start || new Date().toISOString().slice(0, 10)} onChange={(e) => { setEnd(e.target.value); setState({ status: "idle" }); }} />
        </div>
      </div>

      {state.status !== "available" ? (
        <button className="btn btn-gold" onClick={check} disabled={state.status === "checking"} style={{ width: "100%", padding: "15px", justifyContent: "center" }}>
          {state.status === "checking" ? "Checking…" : "Check availability"}
        </button>
      ) : (
        <Link href={bookHref} className="btn btn-gold" style={{ width: "100%", padding: "15px", justifyContent: "center" }}>
          {isRenter ? "Request this vehicle" : "Sign in to request"}
        </Link>
      )}

      {state.status === "available" && (
        <p style={{ fontSize: 13, color: "var(--st-green-fg)", textAlign: "center", marginTop: 10 }}>
          ✓ Available for {start} → {end}
        </p>
      )}
      {state.status === "unavailable" && (
        <p style={{ fontSize: 13, color: "var(--st-red-fg)", textAlign: "center", marginTop: 10 }}>
          Not available for these dates — try a different window.
        </p>
      )}
      {state.status === "error" && (
        <p style={{ fontSize: 13, color: "var(--st-red-fg)", textAlign: "center", marginTop: 10 }}>{state.msg}</p>
      )}
    </div>
  );
}
