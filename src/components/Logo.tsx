// Brand wordmark (CSS, theme-aware).
// The serif wordmark is a brand moment and stays serif. The mark's letters
// use --accent-ink so they survive the light theme, while the hairline
// around them keeps the full brand gold.

export function Logo({
  size = 1,
  tagline = false,
}: {
  size?: number;
  tagline?: boolean;
}) {
  const s = size;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 * s, color: "inherit" }}>
      <div
        style={{
          width: 32 * s,
          height: 32 * s,
          borderRadius: 8 * s,
          border: "1px solid var(--accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-display)",
          fontWeight: 600,
          fontSize: 16 * s,
          color: "var(--accent-ink)",
          letterSpacing: "-0.02em",
          flexShrink: 0,
        }}
      >
        DR
      </div>
      <div style={{ lineHeight: 1 }}>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: 19 * s,
            letterSpacing: "0.005em",
            color: "currentColor",
          }}
        >
          DMV <span style={{ color: "var(--accent-ink)" }}>Rentals</span>
        </div>
        {tagline && (
          <div
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: 11 * s,
              fontWeight: 500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--text-faint)",
              marginTop: 5 * s,
            }}
          >
            Exclusive Car Rentals
          </div>
        )}
      </div>
    </div>
  );
}
