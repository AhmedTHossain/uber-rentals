import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { insurance, bookings } from "@/lib/db/schema";
import { InsuranceTable, type InsuranceRow } from "./InsuranceTable";

export const dynamic = "force-dynamic";

export default async function InsurancePage() {
  const rows = await db
    .select({
      id: insurance.id,
      providerName: insurance.providerName,
      policyNumber: insurance.policyNumber,
      type: insurance.type,
      status: insurance.status,
      expiryDate: insurance.expiryDate,
      agentPhone: insurance.agentPhone,
      agentEmail: insurance.agentEmail,
      policyAddress: insurance.policyAddress,
      cardFrontUrl: insurance.insuranceFrontUrl,
      cardBackUrl: insurance.insuranceBackUrl,
      bookingRef: bookings.referenceNumber,
    })
    .from(insurance)
    .leftJoin(bookings, eq(insurance.bookingId, bookings.id));

  return <InsuranceTable rows={rows as InsuranceRow[]} />;
}
