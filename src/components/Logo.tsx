// Brand wordmark (CSS, theme-aware). Ported from ui.jsx.

export function Logo({
  size = 1,
  tagline = false,
}: {
  size?: number;
  tagline?: boolean;
}) {
  const s = size;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 11 * s, color: "inherit" }}>
      <div
        style={{
          width: 38 * s,
          height: 38 * s,
          borderRadius: 9 * s,
          border: "1.5px solid var(--accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 19 * s,
          color: "var(--accent)",
          letterSpacing: "-0.02em",
          flexShrink: 0,
        }}
      >
        UR
      </div>
      <div style={{ lineHeight: 1 }}>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: 19 * s,
            letterSpacing: "0.01em",
            color: "currentColor",
          }}
        >
          Uber <span style={{ color: "var(--accent)" }}>Rentals</span>
        </div>
        {tagline && (
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 8.5 * s,
              letterSpacing: "0.34em",
              textTransform: "uppercase",
              opacity: 0.55,
              marginTop: 4 * s,
            }}
          >
            Exclusive Car Rentals
          </div>
        )}
      </div>
    </div>
  );
}
