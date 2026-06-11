import { db } from "@/lib/db";
import { renters, bookings } from "@/lib/db/schema";
import { RentersTable, type RenterRow } from "./RentersTable";

export const dynamic = "force-dynamic";

export default async function RentersPage() {
  const [renterRows, bookingRows] = await Promise.all([
    db.select().from(renters),
    db.select({ renterId: bookings.renterId }).from(bookings),
  ]);

  const counts = new Map<string, number>();
  for (const b of bookingRows) counts.set(b.renterId, (counts.get(b.renterId) ?? 0) + 1);

  const data: RenterRow[] = renterRows
    .sort((a, b) => a.lastName.localeCompare(b.lastName))
    .map((r) => ({
      id: r.id,
      firstName: r.firstName,
      lastName: r.lastName,
      email: r.email,
      city: r.city,
      state: r.state,
      licenseState: r.licenseState,
      licenseExpiry: r.licenseExpiry,
      bookingCount: counts.get(r.id) ?? 0,
    }));

  return <RentersTable rows={data} />;
}
