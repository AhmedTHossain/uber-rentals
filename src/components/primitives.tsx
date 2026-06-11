// Small pure presentational primitives ported from ui.jsx / admin-fleet.jsx.

export function Field({
  label,
  children,
  hint,
  span,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  span?: number;
}) {
  return (
    <label style={{ display: "block", gridColumn: span ? `span ${span}` : undefined }}>
      <span className="field-label">{label}</span>
      {children}
      {hint && (
        <span style={{ display: "block", marginTop: 6, fontSize: 12, color: "var(--text-faint)" }}>
          {hint}
        </span>
      )}
    </label>
  );
}

export function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  tone?: "red" | "amber" | "green";
}) {
  const toneColor = tone
    ? { red: "var(--st-red-fg)", amber: "var(--st-amber-fg)", green: "var(--st-green-fg)" }[tone]
    : undefined;
  return (
    <div className="card" style={{ padding: "18px 20px" }}>
      <div className="eyebrow" style={{ color: "var(--text-dim)" }}>{label}</div>
      <div className="kpi-num" style={{ fontSize: 40, marginTop: 10, color: toneColor || "var(--text)" }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12.5, color: "var(--text-dim)", marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

export function InfoRow({
  k,
  v,
  mono,
}: {
  k: string;
  v: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 16,
        padding: "9px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <span style={{ fontSize: 13, color: "var(--text-dim)" }}>{k}</span>
      <span
        style={{
          fontSize: 13.5,
          color: "var(--text)",
          textAlign: "right",
          fontFamily: mono ? "var(--font-mono)" : undefined,
        }}
      >
        {v}
      </span>
    </div>
  );
}

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "var(--accent-soft)",
        color: "var(--accent)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-display)",
        fontWeight: 600,
        fontSize: size * 0.42,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

// Section header used across admin lists.
export function SectionHead({
  title,
  action,
  onAction,
  count,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  count?: number | null;
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
      {action && (
        <a onClick={onAction} style={{ fontSize: 12.5, color: "var(--accent)", cursor: "pointer", fontWeight: 500 }}>
          {action}
        </a>
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
