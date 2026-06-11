import { NextResponse } from "next/server";
import { listPublicVehicles } from "@/lib/data/vehicles";

export async function GET() {
  try {
    const vehicles = await listPublicVehicles();
    return NextResponse.json({ ok: true, count: vehicles.length });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err), stack: err instanceof Error ? err.stack : undefined }, { status: 500 });
  }
}
