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
        radius={14}
        readOnly
      />
      <div
        className="detail-thumbs"
        style={{ display: "grid", gridTemplateColumns: `repeat(${views.length}, 1fr)`, gap: 12, marginTop: 14 }}
      >
        {views.map(([key, label], i) => (
          <div
            key={key}
            onClick={() => setActive(i)}
            style={{
              cursor: "pointer",
              borderRadius: 9,
              overflow: "hidden",
              outline: i === active ? "2px solid var(--accent)" : "1px solid var(--border)",
              outlineOffset: i === active ? "0" : "-1px",
            }}
          >
            <PhotoSlot label={label} src={photos[key]?.url ?? null} objectPosition={photos[key]?.pos ?? null} ratio="16 / 11" radius={0} readOnly />
          </div>
        ))}
      </div>
      <p
        style={{
          fontSize: 11.5,
          color: "var(--text-faint)",
          marginTop: 10,
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.04em",
        }}
      >
        SELECT A VIEW TO ENLARGE
      </p>
    </div>
  );
}
