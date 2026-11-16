"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SectionHead, Empty } from "@/components/admin/ui";
import { runJobsAction, type JobSummary } from "./actions";

export type ReminderRow = {
  id: string;
  kind: "payment" | "insurance" | "license";
  sev: "low" | "med" | "high";
  title: string;
  detail: string;
};

const SEV_COLOR: Record<string, [string, string]> = {
  high: ["var(--st-red-bg)", "var(--st-red-fg)"],
  med: ["var(--st-amber-bg)", "var(--st-amber-fg)"],
  low: ["var(--st-blue-bg)", "var(--st-blue-fg)"],
};
const KIND_LABEL: Record<string, string> = { payment: "PAYMENT", insurance: "INSURANCE", license: "LICENSE" };

const JOBS: [string, string, string][] = [
  ["Mark overdue payments", "Any DUE weekly payment past its end date is flipped to OVERDUE.", "Daily · 06:00"],
  ["Detect expiring insurance", "Flags COMPANY & customer policies expiring within 14 days.", "Daily · 06:00"],
  ["License expiry watch", "Surfaces renter licenses expiring within 60 days.", "Weekly · Mon"],
];

export function AutomationsPanel({
  reminders,
  lastRun,
}: {
  reminders: ReminderRow[];
  lastRun: string | null;
}) {
  const router = useRouter();
  const [summary, setSummary] = useState<JobSummary | null>(null);
  const [pending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      const res = await runJobsAction();
      setSummary(res);
      router.refresh();
    });
  }

  function reviewHref(kind: string) {
    return kind === "payment"
      ? "/admin/payments"
      : kind === "insurance"
        ? "/admin/insurance"
        : "/admin/renters";
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 18, marginBottom: 24, flexWrap: "wrap" }}>
        <p style={{ margin: 0, fontSize: "var(--t-base)", color: "var(--text-dim)", maxWidth: 560, lineHeight: 1.6 }}>
          These scheduled jobs run automatically in production. Trigger them here to simulate a daily run — overdue
          payments are updated, expiring policies and licenses are flagged, and reminders are regenerated below.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: "var(--t-sm)", color: "var(--text-faint)", fontFamily: "var(--font-mono)" }}>
            {lastRun ? `LAST RUN ${lastRun}` : "NEVER RUN"}
          </span>
          <button className="btn btn-gold" onClick={run} disabled={pending}>
            {pending ? "Running…" : "Run daily jobs now"}
          </button>
        </div>
      </div>

      {summary && summary.ok && (
        <div className="card" style={{ display: "flex", alignItems: "center", gap: 18, padding: "var(--s3) var(--s4)", marginBottom: 22, background: "var(--surface-2)", borderColor: "var(--border-strong)" }}>
          <span style={{ fontSize: "var(--t-lg)", color: "var(--accent-ink)" }}>✓</span>
          <span style={{ fontSize: "var(--t-base)" }}>
            Run complete · <b>{summary.newOverdue}</b> payment{summary.newOverdue !== 1 ? "s" : ""} newly overdue ·{" "}
            <b>{summary.expiring}</b> polic{summary.expiring !== 1 ? "ies" : "y"} expiring · <b>{summary.reminders}</b>{" "}
            reminder{summary.reminders !== 1 ? "s" : ""} generated.
          </span>
        </div>
      )}

      <div className="r-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18, marginBottom: 28 }}>
        {JOBS.map(([t, d, sch]) => (
          <div key={t} className="card" style={{ padding: "var(--s5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 className="h-panel" style={{ margin: 0 }}>{t}</h3>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: lastRun ? "var(--st-green-fg)" : "var(--text-faint)" }} />
            </div>
            <p style={{ fontSize: "var(--t-base)", color: "var(--text-dim)", lineHeight: 1.55, margin: "10px 0 14px" }}>{d}</p>
            <div className="eyebrow" style={{ color: "var(--text-faint)" }}>{sch}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <SectionHead title="Reminders & alerts" count={reminders.length} />
        {reminders.length === 0 && (
          <Empty text={lastRun ? "No active reminders — all clear." : "Run the daily jobs to generate reminders."} />
        )}
        {reminders.map((r) => {
          const [bg, fg] = SEV_COLOR[r.sev] || SEV_COLOR.low;
          return (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "var(--row-pad) var(--s5)", borderTop: "1px solid var(--border)" }}>
              {/* Uses the shared .badge so severity chips match status
                  badges everywhere else; only the colours vary. */}
              <span className="badge" style={{ color: fg, background: bg, flexShrink: 0 }}>
                {KIND_LABEL[r.kind]}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "var(--t-base)", color: "var(--text)" }}>{r.title}</div>
                <div style={{ fontSize: "var(--t-sm)", color: "var(--text-dim)", marginTop: 2 }}>{r.detail}</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => router.push(reviewHref(r.kind))}>
                Review →
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
