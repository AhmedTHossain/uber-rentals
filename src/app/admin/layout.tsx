import { AdminShell } from "@/components/shells/AdminShell";
import { auth } from "@/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const adminName = session?.user?.name ?? "Admin";
  return <AdminShell adminName={adminName}>{children}</AdminShell>;
}
