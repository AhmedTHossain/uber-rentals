import { NextResponse } from "next/server";
import { saveUpload } from "@/lib/storage";
import { rateLimit, clientIp, tooMany } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // Throttle uploads: 30 / 10 min per IP.
  const rl = rateLimit(`upload:${clientIp(req)}`, 30, 10 * 60 * 1000);
  if (!rl.ok) return tooMany(rl.retryAfter);

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  const result = await saveUpload(file);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result);
}
