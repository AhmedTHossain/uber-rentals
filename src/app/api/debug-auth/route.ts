import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { admins, renters } from "@/lib/db/schema";

// Temporary diagnostic route — remove after debugging.
// Usage: /api/debug-auth?kind=admin&email=a.bello@uberrentals.co&password=password123
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const kind = url.searchParams.get("kind") ?? "admin";
    const email = (url.searchParams.get("email") ?? "").trim().toLowerCase();
    const password = url.searchParams.get("password") ?? "";

    if (!email || !password) {
      return NextResponse.json({ error: "pass ?kind=&email=&password=" }, { status: 400 });
    }

    if (kind === "admin") {
      const rows = await db.select().from(admins).where(eq(admins.email, email)).limit(1);
      const a = rows[0];
      if (!a) return NextResponse.json({ found: false, table: "admins", email });
      const bcryptOk = a.passwordHash ? await bcrypt.compare(password, a.passwordHash) : false;
      return NextResponse.json({
        found: true,
        table: "admins",
        email: a.email,
        role: a.role,
        hashPresent: !!a.passwordHash,
        hashPrefix: a.passwordHash?.slice(0, 7) ?? null,
        bcryptOk,
        wouldAuthorize: bcryptOk,
      });
    }

    const rows = await db.select().from(renters).where(eq(renters.email, email)).limit(1);
    const r = rows[0];
    if (!r) return NextResponse.json({ found: false, table: "renters", email });
    const bcryptOk = r.passwordHash ? await bcrypt.compare(password, r.passwordHash) : false;
    return NextResponse.json({
      found: true,
      table: "renters",
      email: r.email,
      hashPresent: !!r.passwordHash,
      hashPrefix: r.passwordHash?.slice(0, 7) ?? null,
      bcryptOk,
      wouldAuthorize: bcryptOk,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
