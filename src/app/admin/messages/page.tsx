import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { contactMessages } from "@/lib/db/schema";
import { Empty } from "@/components/admin/ui";
import { MessageActions } from "./MessageActions";

export const dynamic = "force-dynamic";

function fmtTime(d: Date): string {
  const iso = d.toISOString();
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)}`;
}

const STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
  NEW: { bg: "var(--st-green-bg)", fg: "var(--st-green-fg)" },
  READ: { bg: "var(--surface-3)", fg: "var(--text-dim)" },
  ARCHIVED: { bg: "var(--surface-3)", fg: "var(--text-faint)" },
};

export default async function MessagesPage() {
  const rows = await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
  const active = rows.filter((m) => m.status !== "ARCHIVED");
  const archived = rows.filter((m) => m.status === "ARCHIVED");
  const newCount = rows.filter((m) => m.status === "NEW").length;

  return (
    <div>
      <p style={{ color: "var(--text-dim)", fontSize: 14, margin: "0 0 18px" }}>
        {rows.length === 0
          ? "No enquiries yet."
          : `${newCount} new · ${active.length} in inbox${archived.length ? ` · ${archived.length} archived` : ""}`}
      </p>

      <div className="card" style={{ padding: "8px 0" }}>
        {active.length === 0 && <Empty text="Inbox is clear." />}
        {active.map((m, i) => {
          const st = STATUS_STYLE[m.status];
          return (
            <div
              key={m.id}
              style={{
                display: "flex",
                gap: 16,
                padding: "16px 24px",
                borderTop: i ? "1px solid var(--border)" : "0",
                background: m.status === "NEW" ? "var(--accent-soft)" : undefined,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text)" }}>{m.name}</span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      letterSpacing: "0.08em",
                      padding: "2px 7px",
                      borderRadius: 5,
                      background: st.bg,
                      color: st.fg,
                    }}
                  >
                    {m.status}
                  </span>
                  <span className="mono" style={{ fontSize: 11.5, color: "var(--text-faint)", marginLeft: "auto" }}>
                    {fmtTime(m.createdAt)}
                  </span>
                </div>
                <div style={{ fontSize: 12.5, color: "var(--text-dim)", marginTop: 4 }}>
                  <a href={`mailto:${m.email}`} style={{ color: "var(--accent)" }}>{m.email}</a>
                  {m.phone ? ` · ${m.phone}` : ""}
                </div>
                <p style={{ fontSize: 13.5, color: "var(--text)", margin: "10px 0 0", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                  {m.message}
                </p>
                <div style={{ marginTop: 12 }}>
                  <MessageActions id={m.id} status={m.status} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {archived.length > 0 && (
        <>
          <div className="eyebrow" style={{ color: "var(--text-faint)", margin: "26px 0 10px" }}>
            Archived
          </div>
          <div className="card" style={{ padding: "8px 0" }}>
            {archived.map((m, i) => (
              <div key={m.id} style={{ display: "flex", gap: 16, padding: "14px 24px", borderTop: i ? "1px solid var(--border)" : "0", opacity: 0.7 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ fontSize: 14, color: "var(--text)" }}>{m.name}</span>
                    <span className="mono" style={{ fontSize: 11.5, color: "var(--text-faint)", marginLeft: "auto" }}>{fmtTime(m.createdAt)}</span>
                  </div>
                  <p style={{ fontSize: 13, color: "var(--text-dim)", margin: "6px 0 0", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{m.message}</p>
                  <div style={{ marginTop: 10 }}>
                    <MessageActions id={m.id} status={m.status} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
