import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { contactMessages, admins } from "@/lib/db/schema";
import { rateLimit, clientIp, tooMany } from "@/lib/rate-limit";
import { sendEmail, esc } from "@/lib/email";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("A valid email is required"),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  message: z.string().trim().min(1, "Message is required").max(4000),
});

export async function POST(req: Request) {
  const rl = rateLimit(`contact:${clientIp(req)}`, 5, 10 * 60 * 1000);
  if (!rl.ok) return tooMany(rl.retryAfter);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 422 });
  }
  const { name, email, message } = parsed.data;
  const phone = parsed.data.phone || null;

  await db.insert(contactMessages).values({
    id: randomUUID(),
    name,
    email: email.toLowerCase(),
    phone,
    message,
  });

  // Notify staff. Non-blocking failures are logged inside sendEmail; the
  // message is already persisted in the admin inbox regardless.
  const staff = await db.select({ email: admins.email }).from(admins);
  const to = (process.env.CONTACT_NOTIFY_TO?.split(",").map((s) => s.trim()).filter(Boolean)) ?? [];
  const recipients = to.length ? to : staff.map((s) => s.email);
  await sendEmail({
    to: recipients,
    subject: `New enquiry from ${name}`,
    replyTo: email,
    html: `
      <h2 style="font-family:Georgia,serif">New contact enquiry</h2>
      <p><strong>Name:</strong> ${esc(name)}<br/>
      <strong>Email:</strong> ${esc(email)}<br/>
      ${phone ? `<strong>Phone:</strong> ${esc(phone)}<br/>` : ""}</p>
      <p style="white-space:pre-wrap">${esc(message)}</p>
      <hr/>
      <p style="color:#888;font-size:12px">View it in the admin inbox: /admin/messages</p>
    `,
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
