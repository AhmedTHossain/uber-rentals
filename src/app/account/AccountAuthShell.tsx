import { Suspense } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/shells/AuthShell";
import { AccountAuthForm } from "./AccountAuthForm";

export function AccountAuthShell({
  mode,
  title,
}: {
  mode: "login" | "register";
  title: string;
}) {
  return (
    <AuthShell
      title={title}
      footer={
        mode === "login" ? (
          <>
            New here?{" "}
            <Link href="/account/register" className="link">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="link">
              Sign in
            </Link>
          </>
        )
      }
    >
      <Suspense fallback={null}>
        <AccountAuthForm mode={mode} />
      </Suspense>
    </AuthShell>
  );
}
