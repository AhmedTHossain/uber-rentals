import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import { Empty } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

function fmtTime(d: Date): string {
  const iso = d.toISOString();
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)}`;
}

type Changes = { status?: [string, string]; reason?: [string, string] };

export default async function AuditPage() {
  const rows = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt));

  return (
    // Each row used to carry an 8px colour square keyed to entity type. Six
    // muddy mid-tones are not distinguishable from one another on this
    // background, and the entity type is already spelled out in the chip
    // below — so the square was colour without a key.
    <div className="card" style={{ padding: "8px 0" }}>
      {rows.length === 0 && <Empty text="No activity recorded yet." />}
      {rows.map((a, i) => {
        const changes = (a.changes ?? {}) as Changes;
        return (
          <div key={a.id} style={{ padding: "15px var(--s6)", borderTop: i ? "1px solid var(--border)" : "0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--s4)" }}>
              <div style={{ fontSize: "var(--t-md)", color: "var(--text)" }}>{a.action}</div>
              <div className="mono" style={{ fontSize: "var(--t-xs)", color: "var(--text-faint)", whiteSpace: "nowrap" }}>
                {fmtTime(a.createdAt)}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 5, flexWrap: "wrap" }}>
              <span className="badge badge-neutral">{a.entityType}</span>
              <span className="mono" style={{ fontSize: "var(--t-sm)", color: "var(--text-dim)" }}>{a.entityId}</span>
              <span style={{ fontSize: "var(--t-sm)", color: "var(--text-faint)" }}>· {a.admin}</span>
            </div>
            {changes.status && (
              <div style={{ marginTop: 7, fontSize: "var(--t-sm)", color: "var(--text-dim)" }}>
                <span className="mono">{changes.status[0]}</span> →{" "}
                <span className="mono" style={{ color: "var(--accent)" }}>{changes.status[1]}</span>
                {changes.reason && <span style={{ marginLeft: 10, fontStyle: "italic" }}>“{changes.reason[1]}”</span>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
