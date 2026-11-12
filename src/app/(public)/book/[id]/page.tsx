import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { renters } from "@/lib/db/schema";
import { getPublicVehicle } from "@/lib/data/vehicles";
import { isAvailable } from "@/lib/biz";
import { today, addDays } from "@/lib/format";
import { BookingForm, type BookVehicle } from "./BookingForm";

export const dynamic = "force-dynamic";

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  const startDate = sp.start && DATE_RE.test(sp.start) ? sp.start : "";
  const endDate = sp.end && DATE_RE.test(sp.end) ? sp.end : "";
  const v = await getPublicVehicle(id);
  if (!v) notFound();

  // Whether a vehicle can be requested is a question about the renter's own
  // window, never about a fixed look-ahead: a car out on an approved rental this
  // month is still bookable for a free window later. `v.available` answers the
  // next 28 days only, so it drives the "currently booked" badge — not this gate.
  if (v.status === "MAINTENANCE" || v.status === "ARCHIVED") {
    redirect(`/vehicle/${v.id}?unavailable=offroad`);
  }
  // A window carried in from the detail page is re-checked here, so a request
  // that lost its slot in the meantime is sent back with a reason rather than
  // failing at submit. The API re-checks it again on POST either way.
  if (startDate && endDate && endDate > startDate) {
    const windowFree = await isAvailable(v.id, startDate, endDate);
    if (!windowFree) {
      redirect(`/vehicle/${v.id}?unavailable=window&start=${startDate}&end=${endDate}`);
    }
  }

  // Prefill from the signed-in renter's profile (route is renter-gated).
  const session = await auth();
  const renterId = (session?.user as { id?: string } | undefined)?.id;
  const r = renterId
    ? (await db.select().from(renters).where(eq(renters.id, renterId)).limit(1))[0]
    : undefined;
  // The window the form opens on. Dates carried in from the detail page win;
  // otherwise default to four weeks starting a week out, which leaves the team
  // time to review. Computed here, on the server, so the default is always in
  // the future (a fixed literal silently rots) and so the client renders the
  // same value it was sent.
  const minDate = today();
  const openStart = startDate || addDays(minDate, 7);
  const openEnd = endDate && endDate > openStart ? endDate : addDays(openStart, 28);

  const initial = {
    ...(r
      ? {
          first_name: r.firstName ?? "",
          last_name: r.lastName ?? "",
          email: r.email ?? "",
          phone: r.phone ?? "",
          dob: r.dob ?? "",
          street: r.street ?? "",
          city: r.city ?? "",
          state: r.state ?? "",
          zip: r.zip ?? "",
          license_number: r.licenseNumber ?? "",
          license_state: r.licenseState ?? "",
          license_expiry: r.licenseExpiry ?? "",
        }
      : {}),
    start_date: openStart,
    end_date: openEnd,
  };

  const vehicle: BookVehicle = {
    id: v.id,
    year: v.year,
    make: v.make,
    model: v.model,
    weeklyPrice: v.weeklyPrice,
    cover: v.photos.cover?.url ?? null,
  };
  return <BookingForm vehicle={vehicle} initial={initial} minDate={minDate} />;
}
