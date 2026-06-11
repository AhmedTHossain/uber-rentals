// Canonical vehicle photo views — client-safe (no server-only imports).
export const VEHICLE_VIEW_LABELS: [view: string, label: string][] = [
  ["cover", "Cover"],
  ["profile", "Profile"],
  ["interior", "Interior"],
  ["rear", "Rear 3/4"],
  ["detail", "Detail"],
];

export const VEHICLE_VIEWS = VEHICLE_VIEW_LABELS.map(([v]) => v);
