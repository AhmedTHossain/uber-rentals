import { NextResponse } from "next/server";
import { randomUUID, randomBytes } from "crypto";
import { asc, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { admins } from "@/lib/db/schema";
import { logAudit } from "@/lib/biz";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rows = await db
    .select({ id: admins.id, name: admins.name, email: admins.email, role: admins.role })
    .from(admins)
    .orderBy(asc(admins.createdAt));
  return NextResponse.json(rows);
}

const inviteSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  role: z.string().trim().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 422 });
  }
  const email = parsed.data.email.toLowerCase();

  const existing = await db.select({ id: admins.id }).from(admins).where(eq(admins.email, email)).limit(1);
  if (existing.length > 0) {
    return NextResponse.json({ error: "An admin with that email already exists." }, { status: 409 });
  }

  const id = randomUUID();
  const role = parsed.data.role || "Operations";
  // Generate a one-time random temp password (no shared default). Returned once
  // so the inviting admin can relay it. Phase 1 replaces this with an emailed
  // set-password link + forced rotation on first sign-in.
  const tempPassword = randomBytes(9).toString("base64url");
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  await db.insert(admins).values({ id, name: parsed.data.name, email, role, passwordHash });

  await logAudit({
    entityType: "ADMIN",
    entityId: email,
    action: "Added admin to team",
  });

  return NextResponse.json({ id, name: parsed.data.name, email, role, tempPassword }, { status: 201 });
}
