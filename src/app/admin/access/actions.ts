"use server";

import { revalidatePath } from "next/cache";
import { randomUUID, randomBytes } from "crypto";
import { and, eq, ne } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { admins } from "@/lib/db/schema";
import { logAudit } from "@/lib/biz";

export type ActionResult = { ok: true; tempPassword?: string } | { ok: false; error: string };

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

async function currentAdmin(): Promise<{ id?: string; kind?: string } | undefined> {
  const session = await auth();
  return session?.user as { id?: string; kind?: string } | undefined;
}

export async function inviteAdmin(input: { name: string; email: string; role: string }): Promise<ActionResult> {
  const u = await currentAdmin();
  if (u?.kind !== "admin") return { ok: false, error: "Unauthorized." };

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const role = input.role.trim() || "Operations";
  if (!name) return { ok: false, error: "Name is required." };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "A valid email is required." };

  const existing = await db.select({ id: admins.id }).from(admins).where(eq(admins.email, email)).limit(1);
  if (existing.length) return { ok: false, error: "An admin with that email already exists." };

  // One-time temp password, returned once so the inviter can relay it.
  const tempPassword = randomBytes(9).toString("base64url");
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  await db.insert(admins).values({ id: randomUUID(), name, email, role, passwordHash });
  await logAudit({ entityType: "ADMIN", entityId: email, action: "Added admin to team" });

  revalidatePath("/admin/access");
  return { ok: true, tempPassword };
}

export async function updateAdmin(id: string, input: { name: string; email: string; role: string }): Promise<ActionResult> {
  const u = await currentAdmin();
  if (u?.kind !== "admin") return { ok: false, error: "Unauthorized." };

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const role = input.role.trim() || "Operations";
  if (!name) return { ok: false, error: "Name is required." };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "A valid email is required." };

  const dup = await db
    .select({ id: admins.id })
    .from(admins)
    .where(and(eq(admins.email, email), ne(admins.id, id)))
    .limit(1);
  if (dup.length) return { ok: false, error: "Another admin already uses that email." };

  const updated = await db.update(admins).set({ name, email, role }).where(eq(admins.id, id)).returning({ id: admins.id });
  if (!updated.length) return { ok: false, error: "Admin not found." };
  await logAudit({ entityType: "ADMIN", entityId: email, action: "Updated admin details" });

  revalidatePath("/admin/access");
  return { ok: true };
}

export async function resetAdminPassword(id: string, newPassword: string): Promise<ActionResult> {
  const u = await currentAdmin();
  if (u?.kind !== "admin") return { ok: false, error: "Unauthorized." };
  if (!newPassword || newPassword.length < 8) return { ok: false, error: "Password must be at least 8 characters." };

  const rows = await db.select({ email: admins.email }).from(admins).where(eq(admins.id, id)).limit(1);
  if (!rows.length) return { ok: false, error: "Admin not found." };

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.update(admins).set({ passwordHash }).where(eq(admins.id, id));
  await logAudit({ entityType: "ADMIN", entityId: rows[0].email, action: "Reset admin password" });

  revalidatePath("/admin/access");
  return { ok: true };
}

export async function deleteAdmin(id: string): Promise<ActionResult> {
  const u = await currentAdmin();
  if (u?.kind !== "admin") return { ok: false, error: "Unauthorized." };
  if (u.id === id) return { ok: false, error: "You can't remove your own account." };

  const all = await db.select({ id: admins.id }).from(admins);
  if (all.length <= 1) return { ok: false, error: "At least one admin must remain." };

  const rows = await db.select({ email: admins.email }).from(admins).where(eq(admins.id, id)).limit(1);
  if (!rows.length) return { ok: false, error: "Admin not found." };

  await db.delete(admins).where(eq(admins.id, id));
  await logAudit({ entityType: "ADMIN", entityId: rows[0].email, action: "Removed admin from team" });

  revalidatePath("/admin/access");
  return { ok: true };
}
