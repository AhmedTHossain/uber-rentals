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

// Badges come from the shared palette and read as sentence case, like every
// other badge in the admin. This screen was mixing its own colours and
// printing the raw enum — "NEW", "READ" — beside badges that did neither.
const STATUS_BADGE: Record<string, { cls: string; label: string }> = {
  NEW: { cls: "badge-green", label: "New" },
  READ: { cls: "badge-neutral", label: "Read" },
  ARCHIVED: { cls: "badge-neutral", label: "Archived" },
};

export default async function MessagesPage() {
  const rows = await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
  const active = rows.filter((m) => m.status !== "ARCHIVED");
  const archived = rows.filter((m) => m.status === "ARCHIVED");
  const newCount = rows.filter((m) => m.status === "NEW").length;

  return (
    <div>
      <p className="page-sub" style={{ margin: "0 0 var(--s5)" }}>
        {rows.length === 0
          ? "No enquiries yet."
          : `${newCount} new · ${active.length} in inbox${archived.length ? ` · ${archived.length} archived` : ""}`}
      </p>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {active.length === 0 && <Empty text="Inbox is clear." />}
        {active.map((m, i) => {
          const st = STATUS_BADGE[m.status] ?? STATUS_BADGE.READ;
          return (
            <div
              key={m.id}
              style={{
                padding: "var(--s4) var(--s5)",
                borderTop: i ? "1px solid var(--border)" : "0",
                // An unread message used to wash the whole row in gold. The
                // rule is the sidebar's marker for "you are here", reused:
                // it marks the row without tinting the message inside it, and
                // being inset it costs no layout shift against read rows.
                boxShadow: m.status === "NEW" ? "inset 2px 0 0 var(--accent)" : undefined,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "var(--s2)", flexWrap: "wrap" }}>
                <span style={{ fontSize: "var(--t-md)", fontWeight: 600, color: "var(--text)" }}>{m.name}</span>
                <span className={`badge ${st.cls}`}>{st.label}</span>
                <span className="mono" style={{ fontSize: "var(--t-xs)", color: "var(--text-faint)", marginLeft: "auto" }}>
                  {fmtTime(m.createdAt)}
                </span>
              </div>
              <div style={{ fontSize: "var(--t-sm)", color: "var(--text-dim)", marginTop: "var(--s1)" }}>
                <a href={`mailto:${m.email}`} className="link">{m.email}</a>
                {m.phone ? ` · ${m.phone}` : ""}
              </div>
              <p style={{ fontSize: "var(--t-base)", color: "var(--text)", margin: "var(--s3) 0 0", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {m.message}
              </p>
              <div style={{ marginTop: "var(--s3)" }}>
                <MessageActions id={m.id} status={m.status} />
              </div>
            </div>
          );
        })}
      </div>

      {archived.length > 0 && (
        <>
          <div className="eyebrow" style={{ color: "var(--text-faint)", margin: "var(--s7) 0 var(--s3)" }}>
            Archived
          </div>
          {/* No blanket opacity: it was multiplying against text already set
              in `--text-dim`, which put the archived messages under the
              contrast floor. Dimmer type, full opacity. */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {archived.map((m, i) => (
              <div key={m.id} style={{ padding: "var(--row-pad) var(--s5)", borderTop: i ? "1px solid var(--border)" : "0" }}>
                <div style={{ display: "flex", gap: "var(--s2)", alignItems: "center" }}>
                  <span style={{ fontSize: "var(--t-md)", color: "var(--text-dim)" }}>{m.name}</span>
                  <span className="mono" style={{ fontSize: "var(--t-xs)", color: "var(--text-faint)", marginLeft: "auto" }}>{fmtTime(m.createdAt)}</span>
                </div>
                <p style={{ fontSize: "var(--t-base)", color: "var(--text-dim)", margin: "var(--s2) 0 0", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{m.message}</p>
                <div style={{ marginTop: "var(--s3)" }}>
                  <MessageActions id={m.id} status={m.status} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
