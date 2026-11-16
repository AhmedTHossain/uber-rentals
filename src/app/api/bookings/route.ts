import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { eq, like, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { renters, bookings, insurance, vehicles } from "@/lib/db/schema";
import { bookingRequestSchema } from "@/lib/validation";
import { isAvailable, today } from "@/lib/biz";
import { pad } from "@/lib/format";
import { rateLimit, clientIp, tooMany } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";
import { bookingEmail } from "@/lib/email-templates";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // Open to guests, so throttle before anything else touches the database:
  // 10 requests / 10 min per IP.
  const rl = rateLimit(`bookings:${clientIp(req)}`, 10, 10 * 60 * 1000);
  if (!rl.ok) return tooMany(rl.retryAfter);

  // A signed-in renter is requesting for themselves; anyone else is a guest.
  // An admin session is not a renter, so it books as a guest like everyone
  // else rather than being bounced to the admin area.
  const session = await auth();
  const sessionUser = session?.user as { id?: string; kind?: string } | undefined;
  const sessionRenterId =
    sessionUser?.kind === "renter" && sessionUser.id ? sessionUser.id : null;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = bookingRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }
  const d = parsed.data;

  // Authoritative availability check — UI guards are conveniences only.
  const available = await isAvailable(d.vehicleId, d.startDate, d.endDate);
  if (!available) {
    return NextResponse.json(
      { error: "This vehicle is not available for the selected dates." },
      { status: 409 },
    );
  }

  const bookingId = randomUUID();
  const day = today().replace(/-/g, "");

  const email = d.email.trim().toLowerCase();

  const reference = await db.transaction(async (tx) => {
    // Serialize reference generation per calendar day so concurrent requests
    // can't compute the same sequence number (advisory lock released on commit).
    // It also serializes the guest-renter lookup/insert below, so two guests
    // submitting the same new email cannot race the unique index on email.
    await tx.execute(sql`select pg_advisory_xact_lock(${Number(day)})`);
    const todays = await tx
      .select({ id: bookings.id })
      .from(bookings)
      .where(like(bookings.referenceNumber, `CR-${day}%`));
    const ref = `CR-${day}-${pad(todays.length + 1, 4)}`;

    // Every booking hangs off a renter row. Resolve which one:
    //   signed in  -> their own account, profile refreshed from this request
    //   guest, known email -> that account, profile left exactly as it was
    //   guest, new email   -> a new login-less renter row (passwordHash null)
    let renterId = sessionRenterId;

    if (renterId) {
      // The owner of the account is submitting, so this is theirs to change.
      // Email stays the account's verified address.
      await tx
        .update(renters)
        .set({
          firstName: d.firstName,
          lastName: d.lastName,
          dob: d.dob || null,
          phone: d.phone,
          street: d.street || "",
          city: d.city || "",
          state: d.state || "",
          zip: d.zip || "",
          licenseNumber: d.licenseNumber,
          licenseState: d.licenseState || "",
          licenseExpiry: d.licenseExpiry || null,
          licenseFrontUrl: d.licenseFrontUrl || null,
          licenseBackUrl: d.licenseBackUrl || null,
        })
        .where(eq(renters.id, renterId));
    } else {
      const [existing] = await tx
        .select({ id: renters.id })
        .from(renters)
        .where(sql`lower(${renters.email}) = ${email}`)
        .limit(1);

      if (existing) {
        // Deliberately no profile write: the email is unverified here, so a
        // guest must not be able to rewrite a real account's saved details.
        // The request's own details are kept on the booking below.
        renterId = existing.id;
      } else {
        renterId = randomUUID();
        await tx.insert(renters).values({
          id: renterId,
          firstName: d.firstName,
          lastName: d.lastName,
          dob: d.dob || null,
          phone: d.phone,
          email,
          street: d.street || "",
          city: d.city || "",
          state: d.state || "",
          zip: d.zip || "",
          licenseNumber: d.licenseNumber,
          licenseState: d.licenseState || "",
          licenseExpiry: d.licenseExpiry || null,
          licenseFrontUrl: d.licenseFrontUrl || null,
          licenseBackUrl: d.licenseBackUrl || null,
        });
      }
    }

    await tx.insert(bookings).values({
      id: bookingId,
      referenceNumber: ref,
      renterId,
      vehicleId: d.vehicleId,
      startDate: d.startDate,
      endDate: d.endDate,
      status: "REQUESTED",
      insuranceTypeChoice: d.insuranceTypeChoice,

      // What this requester actually submitted, whoever they turned out to be.
      driverFirstName: d.firstName,
      driverLastName: d.lastName,
      driverDob: d.dob || null,
      driverPhone: d.phone,
      driverEmail: email,
      driverStreet: d.street || "",
      driverCity: d.city || "",
      driverState: d.state || "",
      driverZip: d.zip || "",
      driverLicenseNumber: d.licenseNumber,
      driverLicenseState: d.licenseState || "",
      driverLicenseExpiry: d.licenseExpiry || null,
      driverLicenseFrontUrl: d.licenseFrontUrl || null,
      driverLicenseBackUrl: d.licenseBackUrl || null,
    });

    if (d.insuranceTypeChoice === "CUSTOMER" && d.providerName) {
      await tx.insert(insurance).values({
        id: randomUUID(),
        bookingId,
        type: "CUSTOMER",
        providerName: d.providerName,
        policyNumber: d.policyNumber || "",
        policyAddress: [d.street, d.city, d.state].filter(Boolean).join(", "),
        agentPhone: d.agentPhone || null,
        agentEmail: d.agentEmail || null,
        status: "PENDING",
        expiryDate: d.policyExpiry || d.endDate,
        insuranceFrontUrl: d.cardFrontUrl || null,
        insuranceBackUrl: d.cardBackUrl || null,
      });
    }
    return ref;
  });

  // Confirmation to the address on the request, not the one stored on the
  // account: a guest booking against a known email must reach the person who
  // submitted it, and for a guest that address is the only way back to the
  // reference. Env-gated (no-op without RESEND_API_KEY) and never allowed to
  // fail the request.
  try {
    const [veh] = await db
      .select({ year: vehicles.year, make: vehicles.make, model: vehicles.model, color: vehicles.color })
      .from(vehicles)
      .where(eq(vehicles.id, d.vehicleId))
      .limit(1);
    if (veh) {
      const { subject, html } = bookingEmail("received", {
        firstName: d.firstName,
        reference,
        vehicleLabel: `${veh.year} ${veh.make} ${veh.model}`,
        color: veh.color,
        startDate: d.startDate,
        endDate: d.endDate,
      });
      await sendEmail({ to: [email], subject, html });
    }
  } catch {
    /* email is best-effort; the booking is already persisted */
  }

  return NextResponse.json({ reference }, { status: 201 });
}
