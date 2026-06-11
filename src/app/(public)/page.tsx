import { listPublicVehicles } from "@/lib/data/vehicles";
import { Listing, type ListingVehicle } from "./Listing";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const vehicles = await listPublicVehicles();
  const data: ListingVehicle[] = vehicles.map((v) => ({
    id: v.id,
    year: v.year,
    make: v.make,
    model: v.model,
    seats: v.seats,
    transmission: v.transmission,
    weeklyPrice: v.weeklyPrice,
    available: v.available,
    cover: v.photos.cover?.url ?? null,
  }));
  return <Listing vehicles={data} />;
}
