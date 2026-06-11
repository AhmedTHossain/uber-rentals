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
    // Staff sign-in → /admin
    Credentials({
      id: "admin",
      name: "Admin",
      credentials: creds,
      authorize: async (c) => {
        const email = String(c?.email ?? "").trim().toLowerCase();
        const password = String(c?.password ?? "");
        if (!email || !password) return null;
        const rows = await db.select().from(admins).where(eq(admins.email, email)).limit(1);
        const a = rows[0];
        if (!a?.passwordHash || !(await bcrypt.compare(password, a.passwordHash))) return null;
        return { id: a.id, name: a.name, email: a.email, role: a.role, kind: "admin" };
      },
    }),
    // Renter sign-in → /account
    Credentials({
      id: "renter",
      name: "Renter",
      credentials: creds,
      authorize: async (c) => {
        const email = String(c?.email ?? "").trim().toLowerCase();
        const password = String(c?.password ?? "");
        if (!email || !password) return null;
        const rows = await db.select().from(renters).where(eq(renters.email, email)).limit(1);
        const r = rows[0];
        if (!r?.passwordHash || !(await bcrypt.compare(password, r.passwordHash))) return null;
        return {
          id: r.id,
          name: `${r.firstName} ${r.lastName}`,
          email: r.email,
          kind: "renter",
        };
      },
    }),
  ],
});
