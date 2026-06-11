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
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 22px 14px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 19, color: "var(--text)" }}>
          {title}
        </h3>
        {count != null && (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--text-dim)",
              background: "var(--surface-3)",
              padding: "2px 7px",
              borderRadius: 6,
            }}
          >
            {count}
          </span>
        )}
      </div>
      {actionHref && actionLabel && (
        <Link href={actionHref} style={{ fontSize: 12.5, color: "var(--accent)", fontWeight: 500 }}>
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
        fontSize: 13.5,
        borderTop: "1px solid var(--border)",
      }}
    >
      {text}
    </div>
  );
}
