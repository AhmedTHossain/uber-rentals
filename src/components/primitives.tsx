// Small pure presentational primitives.
// Sizes and spacing come from the scales in globals.css — see the header
// comment there before adding a literal.

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
        <span style={{ display: "block", marginTop: 6, fontSize: "var(--t-sm)", color: "var(--text-faint)" }}>
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
  // Tone colours the figure only when there is something to act on. A tile
  // reading zero is not a warning, so it stays in the default text colour.
  const active = tone != null && value !== 0 && value !== "0";
  const toneColor = active
    ? { red: "var(--st-red-fg)", amber: "var(--st-amber-fg)", green: "var(--st-green-fg)" }[tone!]
    : undefined;
  return (
    <div className="card" style={{ padding: "18px var(--s5)" }}>
      <div className="meta">{label}</div>
      <div className="kpi-num" style={{ fontSize: "var(--d-xl)", marginTop: "var(--s2)", color: toneColor || "var(--text)" }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: "var(--t-sm)", color: "var(--text-dim)", marginTop: 6 }}>{sub}</div>}
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
        gap: "var(--s4)",
        padding: "9px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <span style={{ fontSize: "var(--t-base)", color: "var(--text-dim)" }}>{k}</span>
      <span
        style={{
          fontSize: "var(--t-base)",
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
