import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";

// Edge-safe base config (no DB imports) — shared with middleware and the main
// instance. Callbacks live here so the JWT-derived `kind`/`role` are available
// in middleware (which runs only this config, without the DB providers).
export const authConfig = {
  trustHost: true,
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { nextUrl } = request;
      const p = nextUrl.pathname;
      const user = auth?.user as { kind?: string } | undefined;

      const redirectTo = (loginPath: string) => {
        const url = new URL(loginPath, nextUrl);
        url.searchParams.set("callbackUrl", nextUrl.pathname + nextUrl.search);
        return NextResponse.redirect(url);
      };

      if (p.startsWith("/admin")) {
        return user?.kind === "admin" ? true : redirectTo("/login");
      }
      // Public renter auth pages (must be reachable while logged out).
      if (p === "/account/login" || p === "/account/register") return true;
      if (p.startsWith("/account") || p.startsWith("/book")) {
        return user?.kind === "renter" ? true : redirectTo("/account/login");
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        const u = user as { kind?: string; role?: string };
        token.kind = u.kind;
        token.role = u.role;
        token.name = user.name;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        const su = session.user as { id?: string; kind?: string; role?: string };
        su.id = token.sub;
        su.kind = token.kind as string | undefined;
        su.role = token.role as string | undefined;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
