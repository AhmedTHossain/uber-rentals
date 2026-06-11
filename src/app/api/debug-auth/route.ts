import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { admins } from "@/lib/db/schema";

// Temporary diagnostic route — remove after debugging
export async function GET() {
  try {
    const rows = await db
      .select({ email: admins.email, hasHash: admins.passwordHash })
      .from(admins)
      .where(eq(admins.email, "a.bello@uberrentals.co"))
      .limit(1);

    const a = rows[0];
    if (!a) return NextResponse.json({ error: "Admin not found" }, { status: 404 });

    const hashPresent = !!a.hasHash;
    const bcryptOk = hashPresent ? await bcrypt.compare("password123", a.hasHash!) : false;

    return NextResponse.json({ found: true, hashPresent, bcryptOk });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
