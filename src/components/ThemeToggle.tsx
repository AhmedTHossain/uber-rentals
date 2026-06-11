"use client";

export type ThemeValue = "light" | "dark";

export function ThemeToggle({
  value,
  onToggle,
}: {
  value: ThemeValue;
  onToggle: () => void;
}) {
  const isDark = value === "dark";
  return (
    <button
      className="btn btn-ghost btn-sm"
      onClick={onToggle}
      title={isDark ? "Switch to light" : "Switch to dark"}
      aria-label="Toggle theme"
      style={{ gap: 7, padding: "7px 12px" }}
    >
      {isDark ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
      <span>{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}
