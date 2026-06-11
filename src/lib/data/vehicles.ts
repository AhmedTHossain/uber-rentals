import "server-only";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { vehicles, vehicleImages, type Vehicle } from "@/lib/db/schema";
import { isAvailable, today } from "@/lib/biz";
import { addDays } from "@/lib/format";

export type PhotoEntry = { url: string; pos: string | null };

export type PublicVehicle = Vehicle & {
  available: boolean;
  photos: Record<string, PhotoEntry>;
};

// Map of vehicleId -> { view -> { url, pos } } for the given vehicle ids.
export async function photosFor(
  vehicleIds: string[],
): Promise<Map<string, Record<string, PhotoEntry>>> {
  const map = new Map<string, Record<string, PhotoEntry>>();
  if (vehicleIds.length === 0) return map;
  const rows = await db.select().from(vehicleImages);
  for (const r of rows) {
    if (!vehicleIds.includes(r.vehicleId)) continue;
    const cur = map.get(r.vehicleId) ?? {};
    cur[r.view] = { url: r.imageUrl, pos: r.objectPosition };
    map.set(r.vehicleId, cur);
  }
  return map;
}

// Public fleet: everything except ARCHIVED, with 7-day availability + photos.
export async function listPublicVehicles(): Promise<PublicVehicle[]> {
  const rows = await db
    .select()
    .from(vehicles)
    .where(ne(vehicles.status, "ARCHIVED"));
  const photoMap = await photosFor(rows.map((v) => v.id));
  const now = today();
  const end = addDays(now, 7);
  return Promise.all(
    rows.map(async (v) => ({
      ...v,
      available: await isAvailable(v.id, now, end),
      photos: photoMap.get(v.id) ?? {},
    })),
  );
}

// Single vehicle for the detail page (404 -> null). Computes 28-day availability.
export async function getPublicVehicle(
  id: string,
): Promise<PublicVehicle | null> {
  const rows = await db
    .select()
    .from(vehicles)
    .where(and(eq(vehicles.id, id), ne(vehicles.status, "ARCHIVED")))
    .limit(1);
  const v = rows[0];
  if (!v) return null;
  const photoMap = await photosFor([id]);
  return {
    ...v,
    available: await isAvailable(v.id, today(), addDays(today(), 28)),
    photos: photoMap.get(v.id) ?? {},
  };
}
