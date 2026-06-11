import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export default async function TestAuthPage() {
  let result: string;
  try {
    const session = await auth();
    result = session ? `session: kind=${(session.user as {kind?:string})?.kind}` : "no session (null)";
  } catch (err) {
    result = `auth() threw: ${String(err)}`;
  }
  return <div style={{ padding: 40, fontFamily: "sans-serif" }}>{result}</div>;
}
