import { Suspense } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { AccountAuthForm } from "./AccountAuthForm";

export function AccountAuthShell({
  mode,
  title,
}: {
  mode: "login" | "register";
  title: string;
}) {
  return (
    <div
      className="theme-light"
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--text)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div style={{ width: 420, maxWidth: "100%" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <Link href="/">
            <Logo tagline />
          </Link>
        </div>
        <div className="card" style={{ padding: "32px 30px" }}>
          <div className="eyebrow" style={{ textAlign: "center" }}>Renter portal</div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 28,
              fontWeight: 600,
              textAlign: "center",
              margin: "8px 0 24px",
            }}
          >
            {title}
          </h1>
          <Suspense fallback={null}>
            <AccountAuthForm mode={mode} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
