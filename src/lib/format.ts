// Pure date/money formatting helpers — safe on client and server.
// Ported from design-handoff/data.jsx (window.biz helpers).

const pad = (n: number, l = 2) => String(n).padStart(l, "0");

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export const iso = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function addDays(dstr: string, n: number): string {
  const d = new Date(dstr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return iso(d);
}

export const daysBetween = (a: string, b: string) =>
  Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);

export const overlaps = (s1: string, e1: string, s2: string, e2: string) =>
  s1 <= e2 && s2 <= e1;

export function fmtDate(dstr: string | null | undefined): string {
  if (!dstr) return "—";
  const d = new Date(dstr + "T00:00:00");
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function fmtShort(dstr: string): string {
  const d = new Date(dstr + "T00:00:00");
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export const money = (n: number | string) =>
  "$" + Number(n).toLocaleString("en-US");

// "Today" anchor. Production uses the real date; set NEXT_PUBLIC_DEMO_TODAY
// (e.g. "2026-05-30") to pin it so the seeded demo data stays coherent.
// Isomorphic: NEXT_PUBLIC_ vars are inlined into the client bundle and read
// from the environment on the server, recomputed per call (cheap).
export function today(): string {
  const override = process.env.NEXT_PUBLIC_DEMO_TODAY;
  return override && /^\d{4}-\d{2}-\d{2}$/.test(override) ? override : iso(new Date());
}

export type Week = { start: string; end: string; amount: number };

// Split a booking duration into weekly billing periods (max 13 weeks).
// Pure — used both for client-side summary preview and server-side payment generation.
export function genWeeks(
  startDate: string,
  endDate: string,
  weeklyPrice: number,
): Week[] {
  const total = Math.max(1, daysBetween(startDate, endDate));
  const out: Week[] = [];
  let cursor = startDate;
  let i = 0;
  while (daysBetween(startDate, cursor) < total) {
    const wEnd = addDays(cursor, 6);
    const realEnd = daysBetween(startDate, wEnd) > total ? endDate : wEnd;
    out.push({ start: cursor, end: realEnd, amount: weeklyPrice });
    cursor = addDays(cursor, 7);
    i++;
    if (i > 12) break;
  }
  return out;
}

export { pad };
