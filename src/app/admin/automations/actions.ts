"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { runDailyJobs } from "@/lib/biz";

export type JobSummary = {
  ok: boolean;
  newOverdue: number;
  expiring: number;
  reminders: number;
};

export async function runJobsAction(): Promise<JobSummary> {
  const session = await auth();
  if (!session?.user) return { ok: false, newOverdue: 0, expiring: 0, reminders: 0 };
  const res = await runDailyJobs();
  revalidatePath("/admin/automations");
  revalidatePath("/admin");
  revalidatePath("/admin/payments");
  return { ok: true, ...res };
}
