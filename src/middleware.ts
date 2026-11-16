import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Protect the admin surface and the renter portal. /book is deliberately
  // absent: a request can be made without an account, so the booking flow is
  // public. The POST it submits to resolves or creates the renter itself.
  matcher: ["/admin/:path*", "/account/:path*"],
};
