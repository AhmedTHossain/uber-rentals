import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { renters } from "@/lib/db/schema";
import { getPublicVehicle } from "@/lib/data/vehicles";
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
  // If the vehicle is not bookable at all (maintenance/archived already filtered),
  // bounce back to the detail page.
  if (!v.available) redirect(`/vehicle/${v.id}`);

  // Prefill from the signed-in renter's profile (route is renter-gated).
  const session = await auth();
  const renterId = (session?.user as { id?: string } | undefined)?.id;
  const r = renterId
    ? (await db.select().from(renters).where(eq(renters.id, renterId)).limit(1))[0]
    : undefined;
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
    ...(startDate ? { start_date: startDate } : {}),
    ...(endDate ? { end_date: endDate } : {}),
  };

  const vehicle: BookVehicle = {
    id: v.id,
    year: v.year,
    make: v.make,
    model: v.model,
    weeklyPrice: v.weeklyPrice,
    cover: v.photos.cover?.url ?? null,
  };
  return <BookingForm vehicle={vehicle} initial={initial} />;
}
