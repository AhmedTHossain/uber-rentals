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
        background: "var(--scrim)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--s5)",
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
        <div style={{ padding: "var(--s5) var(--s5) 0" }}>
          {eyebrow && <div className="eyebrow" style={{ marginBottom: 6 }}>{eyebrow}</div>}
          {title && (
            <h3 className="h-dialog">
              {title}
            </h3>
          )}
        </div>
        <div style={{ padding: "var(--s4) var(--s5) var(--s5)" }}>{children}</div>
        {footer && (
          <div
            style={{
              padding: "var(--s4) var(--s5)",
              borderTop: "1px solid var(--border)",
              display: "flex",
              justifyContent: "flex-end",
              gap: "var(--s2)",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
