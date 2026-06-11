import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Logo } from "@/components/Logo";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/admin");

  return (
    <div
      className="theme-dark"
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
      <div
        style={{
          position: "fixed",
          top: -220,
          left: "50%",
          transform: "translateX(-50%)",
          width: 900,
          height: 520,
          background: "radial-gradient(ellipse at center, rgba(198,160,82,0.12), transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative", width: 400, maxWidth: "100%" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 30 }}>
          <Logo tagline />
        </div>
        <div className="card" style={{ padding: "32px 30px" }}>
          <div className="eyebrow" style={{ textAlign: "center" }}>
            Admin portal
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 28,
              fontWeight: 600,
              textAlign: "center",
              margin: "8px 0 24px",
            }}
          >
            Staff sign in
          </h1>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
        <p
          style={{
            textAlign: "center",
            marginTop: 18,
            fontSize: 12,
            color: "var(--text-faint)",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.04em",
          }}
        >
          DEMO · a.bello@uberrentals.co · password123
        </p>
      </div>
    </div>
  );
}
