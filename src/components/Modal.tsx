"use client";

import { useEffect } from "react";

export function Modal({
  open,
  onClose,
  title,
  eyebrow,
  children,
  footer,
  width = 540,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  eyebrow?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      onClick={onClose}
      className="anim-fade"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(14,12,8,0.55)",
        backdropFilter: "blur(3px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card anim-pop"
        style={{
          width,
          maxWidth: "100%",
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "var(--shadow)",
          background: "var(--surface)",
        }}
      >
        <div style={{ padding: "22px 24px 0" }}>
          {eyebrow && <div className="eyebrow" style={{ marginBottom: 8 }}>{eyebrow}</div>}
          {title && (
            <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 24, color: "var(--text)" }}>
              {title}
            </h3>
          )}
        </div>
        <div style={{ padding: "18px 24px" }}>{children}</div>
        {footer && (
          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid var(--border)",
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
