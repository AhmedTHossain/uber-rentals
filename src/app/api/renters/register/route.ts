import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { renters } from "@/lib/db/schema";
import { rateLimit, clientIp, tooMany } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().trim().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().trim().optional().or(z.literal("")),
});

export async function POST(req: Request) {
  const rl = rateLimit(`register:${clientIp(req)}`, 10, 10 * 60 * 1000);
  if (!rl.ok) return tooMany(rl.retryAfter);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 422 },
    );
  }
  const email = parsed.data.email.toLowerCase();

  const existing = await db.select({ id: renters.id }).from(renters).where(eq(renters.email, email)).limit(1);
  if (existing.length > 0) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await db.insert(renters).values({
    id: randomUUID(),
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
    email,
    phone: parsed.data.phone || "",
    passwordHash,
    // MVP: trust-on-register. Replace with emailed verification link (Phase 1 email).
    emailVerifiedAt: new Date(),
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
