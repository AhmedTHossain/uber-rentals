"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { vehicles, vehicleImages, bookings } from "@/lib/db/schema";
import { logAudit } from "@/lib/biz";
import { statusMeta } from "@/lib/status";

export type Result = { ok: true } | { ok: false; error: string };

const LIVE_STATUSES = ["REQUESTED", "UNDER_REVIEW", "APPROVED", "ACTIVE"] as const;

function revalidate() {
  revalidatePath("/admin/vehicles");
  revalidatePath("/admin/calendar");
  revalidatePath("/");
  revalidatePath("/admin");
}

const createSchema = z.object({
  make: z.string().trim().min(1),
  model: z.string().trim().min(1),
  year: z.coerce.number().int().min(1900).max(2100),
  weeklyPrice: z.coerce.number().int().min(0),
  color: z.string().trim().optional().or(z.literal("")),
  seats: z.coerce.number().int().min(1).max(20),
  transmission: z.string().trim().optional().or(z.literal("")),
  vin: z.string().trim().optional().or(z.literal("")),
});

export async function createVehicle(input: z.input<typeof createSchema>): Promise<Result> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Unauthorized" };
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Make, model and weekly price are required." };
  const d = parsed.data;

  const id = "v" + Date.now();
  const plate = "URX-" + Math.floor(100 + Math.random() * 900);
  await db.insert(vehicles).values({
    id,
    vin: d.vin || `PENDING-${id}`,
    plate,
    year: d.year,
    make: d.make,
    model: d.model,
    color: d.color || "—",
    seats: d.seats,
    transmission: d.transmission || "Automatic",
    weeklyPrice: d.weeklyPrice,
    status: "AVAILABLE",
    tagline: "Newly added to the fleet.",
    features: [],
  });

  await logAudit({
    entityType: "VEHICLE",
    entityId: plate,
    action: "Created vehicle",
  });
  revalidate();
  return { ok: true };
}

const updateSchema = z.object({
  weeklyPrice: z.coerce.number().int().min(0),
  color: z.string().trim().min(1),
  vin: z.string().trim().min(1),
  showBody: z.coerce.boolean(),
  showSeats: z.coerce.boolean(),
  showEnergy: z.coerce.boolean(),
});

export async function updateVehicle(
  id: string,
  input: z.input<typeof updateSchema>,
): Promise<Result> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Unauthorized" };
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input." };

  const rows = await db.select().from(vehicles).where(eq(vehicles.id, id)).limit(1);
  const v = rows[0];
  if (!v) return { ok: false, error: "Vehicle not found." };

  await db
    .update(vehicles)
    .set({
      weeklyPrice: parsed.data.weeklyPrice,
      color: parsed.data.color,
      vin: parsed.data.vin,
      showBody: parsed.data.showBody,
      showSeats: parsed.data.showSeats,
      showEnergy: parsed.data.showEnergy,
    })
    .where(eq(vehicles.id, id));

  await logAudit({
    entityType: "VEHICLE",
    entityId: v.plate,
    action: "Edited vehicle details",
  });
  revalidate();
  return { ok: true };
}

export async function setVehicleStatus(
  id: string,
  status: "AVAILABLE" | "RENTED" | "MAINTENANCE" | "ARCHIVED",
): Promise<Result> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Unauthorized" };
  const rows = await db.select().from(vehicles).where(eq(vehicles.id, id)).limit(1);
  const v = rows[0];
  if (!v) return { ok: false, error: "Vehicle not found." };

  await db.update(vehicles).set({ status }).where(eq(vehicles.id, id));
  await logAudit({
    entityType: "VEHICLE",
    entityId: v.plate,
    action: `Status → ${statusMeta(status).label}`,
    changes: { status: [v.status, status] },
  });
  revalidate();
  return { ok: true };
}

export async function deleteVehicle(id: string, mode: "archive" | "delete"): Promise<Result> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Unauthorized" };

  const rows = await db.select().from(vehicles).where(eq(vehicles.id, id)).limit(1);
  const v = rows[0];
  if (!v) return { ok: false, error: "Vehicle not found." };

  if (mode === "archive") {
    await db.update(vehicles).set({ status: "ARCHIVED" }).where(eq(vehicles.id, id));
    await logAudit({
      entityType: "VEHICLE",
      entityId: v.plate,
      action: "Archived vehicle (removed from fleet)",
      changes: { status: [v.status, "ARCHIVED"] },
    });
    revalidate();
    return { ok: true };
  }

  // delete mode — block if live bookings reference this vehicle.
  const live = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(and(eq(bookings.vehicleId, id), inArray(bookings.status, LIVE_STATUSES)))
    .limit(1);
  if (live.length > 0) {
    return { ok: false, error: "Vehicle has live bookings — archive it instead." };
  }

  const anyHistory = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(eq(bookings.vehicleId, id))
    .limit(1);

  if (anyHistory.length > 0) {
    // Soft delete: keep record so booking history retains the vehicle name.
    const model = /\(deleted\)/i.test(v.model) ? v.model : `${v.model} (Deleted)`;
    await db.update(vehicles).set({ deleted: true, status: "ARCHIVED", model }).where(eq(vehicles.id, id));
    await logAudit({
      entityType: "VEHICLE",
      entityId: v.plate,
      action: "Deleted vehicle — record kept for booking history",
    });
  } else {
    await db.delete(vehicleImages).where(eq(vehicleImages.vehicleId, id));
    await db.delete(vehicles).where(eq(vehicles.id, id));
    await logAudit({
      entityType: "VEHICLE",
      entityId: v.plate,
      action: "Deleted vehicle",
    });
  }
  revalidate();
  return { ok: true };
}

export async function setVehiclePhoto(
  vehicleId: string,
  view: "cover" | "profile" | "interior" | "rear" | "detail",
  url: string,
): Promise<Result> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Unauthorized" };
  await db
    .insert(vehicleImages)
    .values({ id: randomUUID(), vehicleId, view, imageUrl: url })
    .onConflictDoUpdate({
      target: [vehicleImages.vehicleId, vehicleImages.view],
      set: { imageUrl: url, objectPosition: null },
    });
  revalidate();
  return { ok: true };
}

export async function setVehiclePhotoPosition(
  vehicleId: string,
  view: "cover" | "profile" | "interior" | "rear" | "detail",
  position: string,
): Promise<Result> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Unauthorized" };
  await db
    .update(vehicleImages)
    .set({ objectPosition: position })
    .where(and(eq(vehicleImages.vehicleId, vehicleId), eq(vehicleImages.view, view)));
  revalidate();
  return { ok: true };
}

export async function removeVehiclePhoto(
  vehicleId: string,
  view: "cover" | "profile" | "interior" | "rear" | "detail",
): Promise<Result> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Unauthorized" };
  await db
    .delete(vehicleImages)
    .where(and(eq(vehicleImages.vehicleId, vehicleId), eq(vehicleImages.view, view)));
  revalidate();
  return { ok: true };
}
