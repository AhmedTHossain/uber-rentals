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
      {/* .field-label is sentence case at reading size now. It used to be
          11px uppercase mono with 0.14em tracking, on every field in the
          booking form. */}
      <span className="field-label">{label}</span>
      {children}
      {hint && (
        <span style={{ display: "block", marginTop: 6, fontSize: "var(--t-xs)", color: "var(--text-faint)" }}>
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
    <div className="card" style={{ padding: "var(--s4) var(--s5)" }}>
      <div style={{ fontSize: "var(--t-sm)", color: "var(--text-dim)" }}>{label}</div>
      {/* .kpi-num is tabular sans now, so a row of tiles aligns. */}
      <div
        className="kpi-num"
        style={{ fontSize: "var(--t-kpi)", marginTop: "var(--s2)", color: toneColor || "var(--text)" }}
      >
        {value}
      </div>
      {sub && <div style={{ fontSize: "var(--t-sm)", color: "var(--text-faint)", marginTop: 4 }}>{sub}</div>}
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
    <div className="kv">
      <span style={{ color: "var(--text-dim)" }}>{k}</span>
      <span
        style={{
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
    // Neutral, not gold. An avatar on every renter row made the accent the
    // most repeated colour in the table.
    <div
      className="avatar"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
    >
      {initials}
    </div>
  );
}
