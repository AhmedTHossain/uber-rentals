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
        padding: "var(--s6)",
      }}
    >
      <div className="card" style={{ padding: "var(--s7) var(--s6)", maxWidth: 440, textAlign: "center" }}>
        {/* The eyebrow said "Something went wrong" and the heading said the
            same thing one size up. The heading keeps it; the eyebrow is gone. */}
        <h1 className="h-dialog">We hit an unexpected error</h1>
        <p style={{ fontSize: "var(--t-md)", color: "var(--text-dim)", lineHeight: 1.6, margin: "var(--s3) 0 0" }}>
          The issue has been logged. You can retry, or head back and try again.
        </p>
        {error.digest && (
          <p className="mono" style={{ fontSize: "var(--t-xs)", color: "var(--text-faint)", margin: "var(--s3) 0 0" }}>
            ref {error.digest}
          </p>
        )}
        <div style={{ display: "flex", gap: "var(--s2)", justifyContent: "center", marginTop: "var(--s5)" }}>
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
