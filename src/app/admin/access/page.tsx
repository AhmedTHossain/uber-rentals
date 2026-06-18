import { asc } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { admins } from "@/lib/db/schema";
import { AccessControl } from "./AccessControl";

export const dynamic = "force-dynamic";

export default async function AccessControlPage() {
  const session = await auth();
  const currentAdminId = (session?.user as { id?: string } | undefined)?.id ?? "";

  const rows = await db
    .select({ id: admins.id, name: admins.name, email: admins.email, role: admins.role })
    .from(admins)
    .orderBy(asc(admins.createdAt));

  return (
    <div>
      <p style={{ color: "var(--text-dim)", fontSize: 14, margin: "0 0 20px", maxWidth: 640, lineHeight: 1.5 }}>
        Manage who can sign in to the admin dashboard — invite teammates, edit their details and role,
        reset passwords, or remove access.
      </p>
      <AccessControl admins={rows} currentAdminId={currentAdminId} />
    </div>
  );
}
