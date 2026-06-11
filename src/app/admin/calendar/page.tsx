import Link from "next/link";
import { eq, inArray, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { vehicles, bookings, renters } from "@/lib/db/schema";
import { addDays, daysBetween, fmtShort, today } from "@/lib/format";

export const dynamic = "force-dynamic";

const WIN_START = "2026-05-04";
const WIN_DAYS = 84; // 12 weeks

const STATUS_COLOR: Record<string, [string, string]> = {
  ACTIVE: ["var(--st-blue-bg)", "var(--st-blue-fg)"],
  APPROVED: ["var(--st-green-bg)", "var(--st-green-fg)"],
  COMPLETED: ["var(--st-neutral-bg)", "var(--st-neutral-fg)"],
  UNDER_REVIEW: ["var(--st-amber-bg)", "var(--st-amber-fg)"],
  REQUESTED: ["var(--st-amber-bg)", "var(--st-amber-fg)"],
};
const BAR_STATUSES = ["ACTIVE", "APPROVED", "COMPLETED", "UNDER_REVIEW", "REQUESTED"] as const;

export default async function FleetCalendarPage() {
  const winEnd = addDays(WIN_START, WIN_DAYS);
  const totalDays = daysBetween(WIN_START, winEnd);
  const pct = (d: string) => (daysBetween(WIN_START, d) / totalDays) * 100;
  const todayLeft = pct(today());

  const weeks: string[] = [];
  for (let i = 0; i <= WIN_DAYS; i += 7) weeks.push(addDays(WIN_START, i));

  const shown = await db.select().from(vehicles).where(ne(vehicles.status, "ARCHIVED"));
  const barRows = await db
    .select({
      id: bookings.id,
      vehicleId: bookings.vehicleId,
      reference: bookings.referenceNumber,
      status: bookings.status,
      startDate: bookings.startDate,
      endDate: bookings.endDate,
      lastName: renters.lastName,
    })
    .from(bookings)
    .innerJoin(renters, eq(bookings.renterId, renters.id))
    .where(inArray(bookings.status, BAR_STATUSES));

  const barsByVehicle = new Map<string, typeof barRows>();
  for (const b of barRows) {
    const arr = barsByVehicle.get(b.vehicleId) ?? [];
    arr.push(b);
    barsByVehicle.set(b.vehicleId, arr);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 18, flexWrap: "wrap", gap: 14 }}>
        <p style={{ margin: 0, fontSize: 13.5, color: "var(--text-dim)", maxWidth: 520, lineHeight: 1.5 }}>
          Each bar is a booking. Only <b style={{ color: "var(--text)" }}>approved</b> and{" "}
          <b style={{ color: "var(--text)" }}>active</b> rentals block availability — requests overlap freely until you approve.
        </p>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {([["Active", "var(--st-blue-fg)"], ["Approved", "var(--st-green-fg)"], ["Requested", "var(--st-amber-fg)"], ["Completed", "var(--st-neutral-fg)"]] as [string, string][]).map(([l, c]) => (
            <span key={l} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--text-dim)" }}>
              <span style={{ width: 11, height: 11, borderRadius: 3, background: c }} />
              {l}
            </span>
          ))}
        </div>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        {/* header week scale */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
          <div style={{ width: 190, flexShrink: 0, padding: "12px 16px", fontFamily: "var(--font-mono)", fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-dim)", borderRight: "1px solid var(--border)" }}>
            Vehicle
          </div>
          <div style={{ position: "relative", flex: 1, height: 40 }}>
            {weeks.map((w, i) => (
              <div key={i} style={{ position: "absolute", left: pct(w) + "%", top: 0, bottom: 0, borderLeft: i ? "1px solid var(--border)" : "0", paddingLeft: 6, display: "flex", alignItems: "center" }}>
                <span className="mono" style={{ fontSize: 10.5, color: "var(--text-faint)" }}>{fmtShort(w)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* rows */}
        <div style={{ position: "relative" }}>
          {/* today line */}
          <div style={{ position: "absolute", left: `calc(190px + (100% - 190px) * ${todayLeft / 100})`, top: 0, bottom: 0, width: 2, background: "var(--accent)", zIndex: 3, pointerEvents: "none" }}>
            <span style={{ position: "absolute", top: -2, left: 4, fontSize: 9.5, fontFamily: "var(--font-mono)", color: "var(--accent)", background: "var(--surface)", padding: "1px 4px", borderRadius: 4 }}>
              TODAY
            </span>
          </div>
          {shown.map((v) => {
            const bars = barsByVehicle.get(v.id) ?? [];
            return (
              <div key={v.id} style={{ display: "flex", borderTop: "1px solid var(--border)", minHeight: 54 }}>
                <div style={{ width: 190, flexShrink: 0, padding: "10px 16px", borderRight: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.2 }}>{v.model}</div>
                  <div className="mono" style={{ fontSize: 10.5, color: "var(--text-dim)", marginTop: 3 }}>{v.plate}</div>
                </div>
                <div style={{ position: "relative", flex: 1 }}>
                  {weeks.map((w, i) =>
                    i ? (
                      <div key={i} style={{ position: "absolute", left: pct(w) + "%", top: 0, bottom: 0, borderLeft: "1px solid var(--border)", opacity: 0.5 }} />
                    ) : null,
                  )}
                  {bars.map((b) => {
                    const s = b.startDate < WIN_START ? WIN_START : b.startDate;
                    const e = b.endDate > winEnd ? winEnd : b.endDate;
                    if (e < WIN_START || s > winEnd) return null;
                    const [bg, fg] = STATUS_COLOR[b.status];
                    const dashed = b.status === "REQUESTED" || b.status === "UNDER_REVIEW";
                    return (
                      <Link
                        key={b.id}
                        href={`/admin/bookings/${b.id}`}
                        title={`${b.reference} · ${b.lastName}`}
                        style={{
                          position: "absolute",
                          left: pct(s) + "%",
                          width: Math.max(2, pct(e) - pct(s)) + "%",
                          top: 11,
                          height: 32,
                          background: bg,
                          color: fg,
                          border: dashed ? `1.5px dashed ${fg}` : `1px solid ${fg}33`,
                          borderRadius: 7,
                          display: "flex",
                          alignItems: "center",
                          padding: "0 9px",
                          fontSize: 11.5,
                          fontWeight: 500,
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          cursor: "pointer",
                          zIndex: 2,
                        }}
                      >
                        {b.lastName}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
