import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import { db } from "./lib/db";
import { admins, renters } from "./lib/db/schema";

const creds = {
  email: { label: "Email", type: "email" },
  password: { label: "Password", type: "password" },
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    // Single sign-in for both surfaces. We check the admins table first, then
    // renters; the resolved `kind` ("admin" | "renter") drives where the user
    // lands and what they can access. Emails are unique within each table; an
    // address present in both resolves to admin (the higher-privilege account).
    Credentials({
      id: "credentials",
      name: "Sign in",
      credentials: creds,
      authorize: async (c) => {
        const email = String(c?.email ?? "").trim().toLowerCase();
        const password = String(c?.password ?? "");
        if (!email || !password) return null;

        const adminRows = await db.select().from(admins).where(eq(admins.email, email)).limit(1);
        const a = adminRows[0];
        if (a?.passwordHash && (await bcrypt.compare(password, a.passwordHash))) {
          return { id: a.id, name: a.name, email: a.email, role: a.role, kind: "admin" };
        }

        const renterRows = await db.select().from(renters).where(eq(renters.email, email)).limit(1);
        const r = renterRows[0];
        if (r?.passwordHash && (await bcrypt.compare(password, r.passwordHash))) {
          return { id: r.id, name: `${r.firstName} ${r.lastName}`, email: r.email, kind: "renter" };
        }

        return null;
      },
    }),
  ],
});
