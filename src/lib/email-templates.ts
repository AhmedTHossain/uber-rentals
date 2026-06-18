import { esc } from "./email";
import { fmtDate, daysBetween } from "./format";

const GOLD = "#c6a052";

export type BookingEmailKind = "received" | "approved" | "declined";

type Copy = { subject: string; eyebrow: string; heading: string; intro: string; status: string; cta: { label: string; path: string } };

function baseUrl(): string {
  return (process.env.AUTH_URL || process.env.APP_URL || "https://www.urfleettracker.com").replace(/\/$/, "");
}

export type BookingEmailData = {
  firstName: string;
  reference: string;
  vehicleLabel: string; // "2023 Ferrari Roma"
  color: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason?: string; // declined only
};

function copyFor(kind: BookingEmailKind, d: BookingEmailData): Copy {
  const name = d.firstName || "there";
  if (kind === "approved") {
    return {
      subject: `Your booking is approved · ${d.reference}`,
      eyebrow: "Request approved",
      heading: "Your booking is confirmed",
      intro: `Great news, ${name} — your request has been approved. Your weekly payment schedule is now available in your account, and our team will be in touch about pick-up.`,
      status: "Approved",
      cta: { label: "View in your account →", path: "/account" },
    };
  }
  if (kind === "declined") {
    return {
      subject: `Update on your request · ${d.reference}`,
      eyebrow: "Request update",
      heading: "We couldn’t approve this request",
      intro: `Thank you for your interest, ${name}. Unfortunately we’re unable to approve this request${d.reason ? `: ${d.reason}` : "."}. You’re welcome to browse the fleet for other dates or vehicles — we’d be glad to help.`,
      status: "Declined",
      cta: { label: "Browse the fleet →", path: "/" },
    };
  }
  return {
    subject: `We’ve received your request · ${d.reference}`,
    eyebrow: "Request received",
    heading: "We’re reviewing your request",
    intro: `Thank you, ${name}. Your booking is in our queue with status Requested. Our team verifies details and insurance before approving — you’ll hear from us within 24 hours.`,
    status: "Requested",
    cta: { label: "View in your account →", path: "/account" },
  };
}

export function bookingEmail(kind: BookingEmailKind, d: BookingEmailData): { subject: string; html: string } {
  const c = copyFor(kind, d);
  const weeks = Math.max(1, Math.ceil(daysBetween(d.startDate, d.endDate) / 7));
  const dates = `${fmtDate(d.startDate)} → ${fmtDate(d.endDate)}`;
  const cta = `${baseUrl()}${c.cta.path}`;

  const html = `
<div style="background:#f6f1e8;padding:40px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#2a2723">
  <div style="max-width:540px;margin:0 auto;background:#f6f1e8;border:1px solid #e3dccd;border-radius:10px;padding:40px 36px;text-align:center">
    <div style="font-family:Georgia,'Times New Roman',serif;font-size:19px;letter-spacing:0.04em">DMV <span style="color:${GOLD}">RENTALS</span></div>
    <div style="font-size:9.5px;letter-spacing:0.22em;color:#9a917f;margin-top:4px">EXCLUSIVE CAR RENTALS</div>
    <div style="width:60px;height:60px;border-radius:50%;border:1.5px solid ${GOLD};color:${GOLD};line-height:58px;font-size:28px;margin:32px auto 0">${kind === "declined" ? "!" : "✓"}</div>
    <div style="font-size:11px;letter-spacing:0.18em;color:${GOLD};margin-top:22px">${c.eyebrow.toUpperCase()}</div>
    <div style="font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:500;line-height:1.15;margin-top:8px">${esc(c.heading)}</div>
    <p style="font-size:14px;line-height:1.7;color:#6b6459;margin:16px auto 0;max-width:400px">${esc(c.intro)}</p>
    <div style="background:#fffdf8;border:1px solid #e3dccd;border-radius:10px;text-align:left;padding:18px 20px;margin:28px auto 0;max-width:400px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:10.5px;letter-spacing:0.12em;color:#9a917f">REFERENCE</span>
        <span style="font-family:monospace;font-size:15px;color:${GOLD};letter-spacing:0.04em">${esc(d.reference)}</span>
      </div>
      <div style="border-top:1px solid #e3dccd;margin-top:14px;padding-top:14px;font-size:13.5px;color:#6b6459">
        ${esc(d.vehicleLabel)} · ${esc(d.color)}<br/>
        <span style="color:#2a2723">${dates}</span> · ${weeks} week${weeks === 1 ? "" : "s"} · ${esc(c.status)}
      </div>
    </div>
    <a href="${cta}" style="display:inline-block;margin-top:28px;background:${GOLD};color:#2a2723;font-size:14px;font-weight:500;text-decoration:none;padding:13px 28px;border-radius:9px">${esc(c.cta.label)}</a>
    <div style="border-top:1px solid #e3dccd;margin-top:34px;padding-top:20px;font-size:11px;color:#9a917f;line-height:1.7">
      <div style="font-family:monospace;letter-spacing:0.06em">© 2026 DMV RENTALS · BY REQUEST ONLY · NOT INSTANT BOOKING</div>
      <div style="margin-top:6px">Questions? Reply to this email or call +1 (310) 555-0142.</div>
    </div>
  </div>
</div>`.trim();

  return { subject: c.subject, html };
}
