import Link from "next/link";

// Server-safe section header with an optional Link action (no client callbacks).
export function SectionHead({
  title,
  count,
  actionHref,
  actionLabel,
}: {
  title: string;
  count?: number | null;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: "var(--s4)",
        padding: "16px 22px 14px",
      }}
    >
      <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "var(--d-sm)", color: "var(--text)" }}>
        {title}
        {/* The count is part of the heading, not a chip beside it: a pill on
            every section head put a small grey box in each card corner. */}
        {count != null && (
          <span style={{ color: "var(--text-dim)", fontWeight: 400 }}> ({count})</span>
        )}
      </h3>
      {actionHref && actionLabel && (
        <Link href={actionHref} className="nav-link" style={{ fontSize: "var(--t-sm)", color: "var(--accent)", fontWeight: 500, whiteSpace: "nowrap" }}>
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return (
    <div
      style={{
        padding: "22px",
        textAlign: "center",
        color: "var(--text-faint)",
        fontSize: "var(--t-base)",
        borderTop: "1px solid var(--border)",
      }}
    >
      {text}
    </div>
  );
}
