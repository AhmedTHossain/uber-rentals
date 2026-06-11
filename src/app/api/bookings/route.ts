import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { eq, like, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { renters, bookings, insurance } from "@/lib/db/schema";
import { bookingRequestSchema } from "@/lib/validation";
import { isAvailable, today } from "@/lib/biz";
import { pad } from "@/lib/format";
import { rateLimit, clientIp, tooMany } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // Requests are tied to a renter account.
  const session = await auth();
  const sessionUser = session?.user as { id?: string; kind?: string } | undefined;
  if (sessionUser?.kind !== "renter" || !sessionUser.id) {
    return NextResponse.json({ error: "Please sign in to request a vehicle." }, { status: 401 });
  }
  const renterId = sessionUser.id;

  // Throttle public submissions: 10 requests / 10 min per IP.
  const rl = rateLimit(`bookings:${clientIp(req)}`, 10, 10 * 60 * 1000);
  if (!rl.ok) return tooMany(rl.retryAfter);

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

  const reference = await db.transaction(async (tx) => {
    // Serialize reference generation per calendar day so concurrent requests
    // can't compute the same sequence number (advisory lock released on commit).
    await tx.execute(sql`select pg_advisory_xact_lock(${Number(day)})`);
    const todays = await tx
      .select({ id: bookings.id })
      .from(bookings)
      .where(like(bookings.referenceNumber, `CR-${day}%`));
    const ref = `CR-${day}-${pad(todays.length + 1, 4)}`;

    // Fill the renter's profile from this request (account was created at signup
    // with minimal fields). Email stays the account's verified address.
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

    await tx.insert(bookings).values({
      id: bookingId,
      referenceNumber: ref,
      renterId,
      vehicleId: d.vehicleId,
      startDate: d.startDate,
      endDate: d.endDate,
      status: "REQUESTED",
      insuranceTypeChoice: d.insuranceTypeChoice,
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

  return NextResponse.json({ reference }, { status: 201 });
}
