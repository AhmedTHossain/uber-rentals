import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { reminders } from "@/lib/db/schema";
import { lastJobRun } from "@/lib/biz";
import { AutomationsPanel, type ReminderRow } from "./AutomationsPanel";

export const dynamic = "force-dynamic";

export default async function AutomationsPage() {
  const [rows, lastRun] = await Promise.all([
    db.select().from(reminders).orderBy(desc(reminders.createdAt)),
    lastJobRun(),
  ]);

  const data: ReminderRow[] = rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    sev: r.sev,
    title: r.title,
    detail: r.detail,
  }));

  return <AutomationsPanel reminders={data} lastRun={lastRun} />;
}
