import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginShell } from "./LoginShell";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await auth();
  const kind = (session?.user as { kind?: string } | undefined)?.kind;
  if (kind === "admin") redirect("/admin");
  if (kind === "renter") redirect("/account");

  return <LoginShell />;
}
