"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { contactMessages } from "@/lib/db/schema";

type Status = "NEW" | "READ" | "ARCHIVED";

export async function setMessageStatus(id: string, status: Status): Promise<{ ok: boolean }> {
  const session = await auth();
  if (!session?.user) return { ok: false };
  await db.update(contactMessages).set({ status }).where(eq(contactMessages.id, id));
  revalidatePath("/admin/messages");
  return { ok: true };
}
