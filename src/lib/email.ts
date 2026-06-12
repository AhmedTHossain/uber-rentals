import "server-only";
import { reportError } from "./observability";

/**
 * Transactional email via Resend's REST API (no SDK dependency).
 * DSN-style gating: with no RESEND_API_KEY the app runs fine and sends are
 * skipped (logged), so DB writes and the admin inbox work without email set up.
 * To enable: set RESEND_API_KEY and EMAIL_FROM (a verified sender, e.g.
 * "Uber Rentals <concierge@yourdomain.com>").
 */
export async function sendEmail(opts: {
  to: string[];
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Uber Rentals <onboarding@resend.dev>";
  const to = opts.to.filter(Boolean);
  if (!key) {
    console.log("[email] RESEND_API_KEY not set — skipping send:", opts.subject, "→", to.join(", "));
    return false;
  }
  if (to.length === 0) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to,
        subject: opts.subject,
        html: opts.html,
        ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      }),
    });
    if (!res.ok) {
      reportError(new Error(`Resend ${res.status}: ${await res.text().catch(() => "")}`), { where: "sendEmail" });
      return false;
    }
    return true;
  } catch (err) {
    reportError(err, { where: "sendEmail", subject: opts.subject });
    return false;
  }
}

// Minimal HTML escape for interpolating user input into email bodies.
export function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
