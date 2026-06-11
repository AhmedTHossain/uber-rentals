"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { insurance } from "@/lib/db/schema";
import { logAudit } from "@/lib/biz";

export type Result = { ok: true } | { ok: false; error: string };

export async function setInsuranceStatus(
  insuranceId: string,
  status: "VERIFIED" | "REJECTED",
): Promise<Result> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Unauthorized" };

  const rows = await db.select().from(insurance).where(eq(insurance.id, insuranceId)).limit(1);
  const i = rows[0];
  if (!i) return { ok: false, error: "Policy not found." };

  await db.update(insurance).set({ status }).where(eq(insurance.id, insuranceId));
  await logAudit({
    entityType: "INSURANCE",
    entityId: i.policyNumber,
    action: `${status} insurance`,
    changes: { status: [i.status, status] },
  });

  revalidatePath("/admin/insurance");
  revalidatePath("/admin/payments");
  revalidatePath("/admin");
  return { ok: true };
}

const editSchema = z.object({
  providerName: z.string().trim().min(1),
  policyNumber: z.string().trim().min(1),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  agentPhone: z.string().trim().optional().or(z.literal("")),
  agentEmail: z.string().trim().optional().or(z.literal("")),
  policyAddress: z.string().trim().optional().or(z.literal("")),
});

export async function editInsurance(
  insuranceId: string,
  fields: z.infer<typeof editSchema>,
): Promise<Result> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Unauthorized" };

  const parsed = editSchema.safeParse(fields);
  if (!parsed.success) return { ok: false, error: "Invalid input." };

  const rows = await db.select().from(insurance).where(eq(insurance.id, insuranceId)).limit(1);
  const i = rows[0];
  if (!i) return { ok: false, error: "Policy not found." };

  await db
    .update(insurance)
    .set({
      providerName: parsed.data.providerName,
      policyNumber: parsed.data.policyNumber,
      expiryDate: parsed.data.expiryDate,
      agentPhone: parsed.data.agentPhone || null,
      agentEmail: parsed.data.agentEmail || null,
      policyAddress: parsed.data.policyAddress || null,
    })
    .where(eq(insurance.id, insuranceId));

  await logAudit({
    entityType: "INSURANCE",
    entityId: parsed.data.policyNumber,
    action: "Edited insurance details",
  });

  revalidatePath("/admin/insurance");
  revalidatePath("/admin/payments");
  return { ok: true };
}
