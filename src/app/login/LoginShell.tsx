"use client";

import { Suspense } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/shells/AuthShell";
import { LoginForm } from "./LoginForm";

export function LoginShell() {
  return (
    <AuthShell
      title="Sign in"
      footer={
        <>
          New here?{" "}
          <Link href="/account/register" className="link">
            Create a renter account
          </Link>
        </>
      }
    >
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
