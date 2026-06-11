import { PublicShell } from "@/components/shells/PublicShell";
import { auth } from "@/auth";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const isRenter = (session?.user as { kind?: string } | undefined)?.kind === "renter";
  return <PublicShell isRenter={isRenter}>{children}</PublicShell>;
}
