"use client";

import { useEffect } from "react";
import { reportError } from "@/lib/observability";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, { digest: error.digest });
  }, [error]);

  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div className="card" style={{ padding: "32px 30px", maxWidth: 440, textAlign: "center" }}>
        <div className="eyebrow" style={{ color: "var(--text-faint)" }}>Something went wrong</div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 26, margin: "8px 0 12px" }}>
          We hit an unexpected error
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-dim)", lineHeight: 1.6, marginTop: 0 }}>
          The issue has been logged. You can retry, or head back and try again.
        </p>
        {error.digest && (
          <p className="mono" style={{ fontSize: 11.5, color: "var(--text-faint)", marginTop: 10 }}>
            ref {error.digest}
          </p>
        )}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 20 }}>
          <button className="btn btn-ghost" onClick={() => (window.location.href = "/")}>
            Go home
          </button>
          <button className="btn btn-gold" onClick={reset}>
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
