import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Protect the admin surface, renter portal, and booking flow.
  matcher: ["/admin/:path*", "/account/:path*", "/book/:path*"],
};
