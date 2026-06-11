"use client";

import { useId, useRef, useState } from "react";

type Ratio = string;

/**
 * Vehicle / document photo slot. Mirrors the prototype's CarSlot:
 * - readOnly: renter-facing display (uploaded image or striped placeholder)
 * - editable: admin can pick/drop a file which uploads and reports the new URL
 * - reframe: when `onReframe` is given, double-click an uploaded photo to enter
 *   reframe mode, move the cursor to set the framing, and confirm — persisted as
 *   a CSS object-position.
 *
 * When no image URL is present it renders the striped diagonal placeholder
 * with a label, exactly as the design references show.
 */
export function PhotoSlot({
  label,
  src,
  ratio = "16 / 10",
  radius = 12,
  readOnly = false,
  objectPosition,
  onUploaded,
  onRemove,
  onReframe,
  style,
}: {
  label: string;
  src?: string | null;
  ratio?: Ratio;
  radius?: number;
  readOnly?: boolean;
  objectPosition?: string | null;
  onUploaded?: (url: string) => void;
  onRemove?: () => void;
  onReframe?: (position: string) => void;
  style?: React.CSSProperties;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [hover, setHover] = useState(false);
  const [reframing, setReframing] = useState(false);
  const [livePos, setLivePos] = useState<string>(objectPosition ?? "50% 50%");

  const canReframe = !readOnly && !!src && !!onReframe;
  const effectivePos = reframing ? livePos : objectPosition ?? "center";

  async function upload(file: File) {
    if (!onUploaded) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const { url } = (await res.json()) as { url: string };
        onUploaded(url);
      }
    } finally {
      setBusy(false);
    }
  }

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!reframing) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100));
    const y = Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100));
    setLivePos(`${x.toFixed(0)}% ${y.toFixed(0)}%`);
  }

  return (
    <div
      className="car-ph"
      style={{
        aspectRatio: ratio,
        borderRadius: radius,
        position: "relative",
        cursor: reframing ? "crosshair" : undefined,
        ...style,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onMouseMove={onMove}
      onDoubleClick={canReframe ? () => { setLivePos(objectPosition ?? "50% 50%"); setReframing(true); } : undefined}
      onDragOver={readOnly ? undefined : (e) => e.preventDefault()}
      onDrop={
        readOnly
          ? undefined
          : (e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) void upload(f);
            }
      }
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={label}
          draggable={false}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: effectivePos }}
        />
      ) : (
        <>
          <svg
            viewBox="0 0 120 60"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.5 }}
            preserveAspectRatio="xMidYMid meet"
          >
            <path
              d="M18 40 q4 -13 14 -15 q10 -7 26 -7 q18 0 27 9 q9 1 16 6 q4 3 4 7 l-1 3 l-86 0 q-2 -5 0 -8 z"
              fill="none"
              stroke="var(--text-faint)"
              strokeWidth="1.1"
              opacity="0.7"
            />
            <circle cx="40" cy="44" r="6" fill="none" stroke="var(--text-faint)" strokeWidth="1.1" opacity="0.7" />
            <circle cx="88" cy="44" r="6" fill="none" stroke="var(--text-faint)" strokeWidth="1.1" opacity="0.7" />
          </svg>
          <div className="car-ph-label" style={{ position: "relative", zIndex: 1, width: "100%" }}>
            {busy ? "Uploading…" : readOnly ? label : `${label} — drop or click`}
          </div>
        </>
      )}

      {/* reframe mode overlay */}
      {reframing && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 3,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 8,
            padding: 8,
            background: "rgba(14,12,8,0.25)",
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn btn-gold btn-sm"
              onClick={(e) => { e.stopPropagation(); onReframe?.(livePos); setReframing(false); }}
            >
              Done framing
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={(e) => { e.stopPropagation(); setReframing(false); }}
            >
              Cancel
            </button>
          </div>
          <div style={{ fontSize: 10.5, fontFamily: "var(--font-mono)", color: "#fff", letterSpacing: "0.04em" }}>
            MOVE CURSOR TO REFRAME
          </div>
        </div>
      )}

      {!readOnly && !reframing && (
        <>
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f);
              e.target.value = "";
            }}
          />
          {hover && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 2,
                display: "flex",
                gap: 8,
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(14,12,8,0.45)",
              }}
            >
              <button className="btn btn-gold btn-sm" onClick={() => inputRef.current?.click()}>
                {src ? "Replace" : "Add"}
              </button>
              {canReframe && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setLivePos(objectPosition ?? "50% 50%"); setReframing(true); }}
                >
                  Reframe
                </button>
              )}
              {src && onRemove && (
                <button className="btn btn-ghost btn-sm" onClick={onRemove}>
                  Remove
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
