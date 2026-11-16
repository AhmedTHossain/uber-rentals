"use client";

import { useEffect } from "react";
import { reportError } from "@/lib/observability";

// Catches errors in the root layout itself. Must render its own <html>/<body>.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, { digest: error.digest, scope: "global" });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#0e0d0a",
          color: "#ece4d2",
        }}
      >
        {/* Every value here is a literal on purpose. This route replaces the
            root layout, so the stylesheet that defines the tokens may never
            have loaded — `var(--r-sm)` on the button below resolved to
            nothing and squared off the one control on the page. */}
        <div style={{ textAlign: "center", padding: 24 }}>
          <h1 style={{ fontWeight: 600, fontSize: 24, margin: 0 }}>Something went wrong</h1>
          <p style={{ color: "#9c9381", margin: "12px 0 0", fontSize: 14, lineHeight: 1.6 }}>
            The application encountered a fatal error.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: 20,
              padding: "10px 18px",
              borderRadius: 8,
              border: "1px solid #c6a052",
              background: "#c6a052",
              color: "#15130c",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
