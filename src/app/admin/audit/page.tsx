import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const ICONS: Record<string, string> = {
  BOOKING: "#c6a052",
  INSURANCE: "#5b4a86",
  PAYMENT: "#3c6b43",
  VEHICLE: "#2f6175",
  RENTER: "#9c5b4a",
  ADMIN: "#5b6b86",
};

function fmtTime(d: Date): string {
  const iso = d.toISOString();
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)}`;
}

type Changes = { status?: [string, string]; reason?: [string, string] };

export default async function AuditPage() {
  const rows = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt));

  return (
    <div className="card" style={{ padding: "8px 0" }}>
      {rows.map((a, i) => {
        const changes = (a.changes ?? {}) as Changes;
        return (
          <div key={a.id} style={{ display: "flex", gap: 16, padding: "15px 24px", borderTop: i ? "1px solid var(--border)" : "0" }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: ICONS[a.entityType] || "var(--accent)", marginTop: 6, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
                <div style={{ fontSize: 14, color: "var(--text)" }}>{a.action}</div>
                <div className="mono" style={{ fontSize: 11.5, color: "var(--text-faint)", whiteSpace: "nowrap" }}>
                  {fmtTime(a.createdAt)}
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 5 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, letterSpacing: "0.08em", color: "var(--text-dim)", background: "var(--surface-3)", padding: "2px 7px", borderRadius: 5 }}>
                  {a.entityType}
                </span>
                <span className="mono" style={{ fontSize: 12, color: "var(--text-dim)" }}>{a.entityId}</span>
                <span style={{ fontSize: 12.5, color: "var(--text-faint)" }}>· {a.admin}</span>
              </div>
              {changes.status && (
                <div style={{ marginTop: 7, fontSize: 12, color: "var(--text-dim)" }}>
                  <span className="mono">{changes.status[0]}</span> →{" "}
                  <span className="mono" style={{ color: "var(--accent)" }}>{changes.status[1]}</span>
                  {changes.reason && <span style={{ marginLeft: 10, fontStyle: "italic" }}>“{changes.reason[1]}”</span>}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
