import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { vehicles, bookings } from "@/lib/db/schema";
import { photosFor } from "@/lib/data/vehicles";
import { VehiclesGrid, type VehicleCard } from "./VehiclesGrid";

export const dynamic = "force-dynamic";

const LIVE = new Set(["REQUESTED", "UNDER_REVIEW", "APPROVED", "ACTIVE"]);

export default async function VehiclesPage() {
  const rows = await db.select().from(vehicles).where(eq(vehicles.deleted, false));
  const allBookings = await db
    .select({ vehicleId: bookings.vehicleId, status: bookings.status })
    .from(bookings);
  const photoMap = await photosFor(rows.map((v) => v.id));

  const liveCount = new Map<string, number>();
  const hasHistory = new Set<string>();
  for (const b of allBookings) {
    hasHistory.add(b.vehicleId);
    if (LIVE.has(b.status)) liveCount.set(b.vehicleId, (liveCount.get(b.vehicleId) ?? 0) + 1);
  }

  const data: VehicleCard[] = rows
    .sort((a, b) => a.make.localeCompare(b.make))
    .map((v) => ({
      id: v.id,
      year: v.year,
      make: v.make,
      model: v.model,
      plate: v.plate,
      vin: v.vin,
      color: v.color,
      seats: v.seats,
      transmission: v.transmission,
      weeklyPrice: v.weeklyPrice,
      status: v.status,
      showBody: v.showBody,
      showSeats: v.showSeats,
      showEnergy: v.showEnergy,
      photos: photoMap.get(v.id) ?? {},
      liveCount: liveCount.get(v.id) ?? 0,
      hasHistory: hasHistory.has(v.id),
    }));

  return <VehiclesGrid vehicles={data} />;
}
