import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookings, vehicles } from "@/lib/db/schema";
import { BookingsTable, type BookingRow } from "./BookingsTable";

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  const rows = await db
    .select({
      id: bookings.id,
      reference: bookings.referenceNumber,
      status: bookings.status,
      startDate: bookings.startDate,
      endDate: bookings.endDate,
      insuranceType: bookings.insuranceTypeChoice,
      firstName: bookings.driverFirstName,
      lastName: bookings.driverLastName,
      year: vehicles.year,
      make: vehicles.make,
      model: vehicles.model,
    })
    .from(bookings)
    .innerJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
    .orderBy(desc(bookings.createdAt));

  return <BookingsTable rows={rows as BookingRow[]} />;
}
