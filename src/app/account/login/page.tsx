import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AccountAuthShell } from "../AccountAuthShell";

export const dynamic = "force-dynamic";

export default async function RenterLoginPage() {
  const session = await auth();
  if ((session?.user as { kind?: string } | undefined)?.kind === "renter") redirect("/account");
  return <AccountAuthShell mode="login" title="Welcome back" />;
}
