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
    // One header treatment, from the stylesheet. The padding used to be
    // written out at each call site as "16px 22px 14px" — a value that is
    // not on the spacing scale.
    <div className="card-head">
      {/* Structural heading: UI type, not the display serif. A serif
          "Weekly payments" dressed a table header as a chapter title. */}
      <h3 className="h-panel">
        {title}
        {/* The count is part of the heading, not a chip beside it: a pill on
            every section head put a small grey box in each card corner. */}
        {count != null && <span className="count"> ({count})</span>}
      </h3>
      {actionHref && actionLabel && (
        <Link href={actionHref} className="link" style={{ fontSize: "var(--t-sm)", whiteSpace: "nowrap" }}>
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
        padding: "var(--s7) var(--s5)",
        textAlign: "center",
        color: "var(--text-faint)",
        fontSize: "var(--t-sm)",
        borderTop: "1px solid var(--border)",
      }}
    >
      {text}
    </div>
  );
}
