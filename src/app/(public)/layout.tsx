import { PublicShell, type Viewer } from "@/components/shells/PublicShell";
import { auth } from "@/auth";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  // `kind` is cleared for an expired admin session, so an admin whose day has
  // ended falls through to "guest" and sees Sign in again.
  const kind = (session?.user as { kind?: string } | undefined)?.kind;
  const viewer: Viewer = kind === "admin" ? "admin" : kind === "renter" ? "renter" : "guest";
  return <PublicShell viewer={viewer}>{children}</PublicShell>;
}
