"use client";

import { useState } from "react";
import { PhotoSlot } from "@/components/PhotoSlot";
import { VEHICLE_VIEW_LABELS } from "@/lib/views";

type PhotoEntry = { url: string; pos: string | null };

export function Gallery({ photos }: { photos: Record<string, PhotoEntry> }) {
  const views = VEHICLE_VIEW_LABELS;
  const [active, setActive] = useState(0);
  const activeView = views[active][0];
  const activePhoto = photos[activeView];

  return (
    <div>
      <PhotoSlot
        label={views[active][1]}
        src={activePhoto?.url ?? null}
        objectPosition={activePhoto?.pos ?? null}
        ratio="16 / 10"
        radius={12}
        readOnly
      />
      <div
        className="detail-thumbs"
        style={{ display: "grid", gridTemplateColumns: `repeat(${views.length}, 1fr)`, gap: "var(--s2)", marginTop: "var(--s2)" }}
      >
        {views.map(([key, label], i) => (
          <button
            key={key}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Show ${label}`}
            aria-current={i === active}
            style={{
              padding: 0,
              border: 0,
              background: "none",
              cursor: "pointer",
              borderRadius: "var(--r-sm)",
              overflow: "hidden",
              display: "block",
              outline: i === active ? "2px solid var(--accent)" : "1px solid var(--border)",
              outlineOffset: i === active ? "0" : "-1px",
              opacity: i === active ? 1 : 0.65,
              transition: "opacity 0.15s ease",
            }}
          >
            <PhotoSlot label={label} src={photos[key]?.url ?? null} objectPosition={photos[key]?.pos ?? null} ratio="16 / 11" radius={0} readOnly />
          </button>
        ))}
      </div>
      {/* No "select a view to enlarge" caption: the thumbnails are buttons with
          a selected state, which says it without a line of instruction. */}
    </div>
  );
}
