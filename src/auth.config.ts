import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";

// ---------- session lifetime ----------
//
// Renters keep a session for two weeks. Rentals bill weekly, so this spans two
// billing cycles — a returning renter is not asked to sign in every visit —
// while staying well short of the 30-day default for an account that holds
// licence scans.
export const RENTER_SESSION_SECONDS = 14 * 24 * 60 * 60;

// Admin sessions end at the close of the business day. The business is in the
// DMV, so "day" is Eastern time unless ADMIN_TIMEZONE says otherwise.
const ADMIN_TZ = process.env.ADMIN_TIMEZONE || "America/New_York";

// Signing in just before midnight must not end the session minutes later, so a
// session always lasts at least this long even when the day rolls over.
const ADMIN_MIN_SESSION_MS = 2 * 60 * 60 * 1000;

const dayKey = (ms: number) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: ADMIN_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ms);

// True once an admin token has outlived its day. A token with no `authAt` was
// issued before this rule existed (and carries the old 30-day expiry), so it is
// treated as expired: those admins sign in once more, which is the point.
// Fixed, not sliding — activity does not extend it, or it would never end for
// someone who keeps working.
export function adminSessionExpired(authAt: unknown, now = Date.now()): boolean {
  if (typeof authAt !== "number") return true;
  if (now - authAt < ADMIN_MIN_SESSION_MS) return false;
  return dayKey(authAt) !== dayKey(now);
}

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
      // Public auth pages (must be reachable while logged out). Login is unified
      // at /login; /account/login forwards there, and /account/register is open.
      if (p === "/account/login" || p === "/account/register") return true;
      // /book is intentionally not listed: requesting a vehicle needs no
      // account. Only the renter portal is gated.
      if (p.startsWith("/account")) {
        return user?.kind === "renter" ? true : redirectTo("/login");
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        const u = user as { kind?: string; role?: string };
        token.kind = u.kind;
        token.role = u.role;
        token.name = user.name;
        token.authAt = Date.now();
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        const su = session.user as { id?: string; kind?: string; role?: string };
        // An expired admin token is signed out by dropping its identity, not by
        // deleting the cookie: every guard in the app (middleware, server
        // actions, /login, the public header) reads `kind`, so they all agree
        // without each learning about expiry. The next sign-in replaces it.
        if (token.kind === "admin" && adminSessionExpired(token.authAt)) {
          su.id = undefined;
          su.kind = undefined;
          su.role = undefined;
          return session;
        }
        su.id = token.sub;
        su.kind = token.kind as string | undefined;
        su.role = token.role as string | undefined;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
