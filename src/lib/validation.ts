import { z } from "zod";

const dateStr = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

const optionalStr = z.string().trim().optional().or(z.literal(""));

export const bookingRequestSchema = z
  .object({
    vehicleId: z.string().min(1),
    startDate: dateStr,
    endDate: dateStr,

    // driver
    firstName: z.string().trim().min(1, "First name is required"),
    lastName: z.string().trim().min(1, "Last name is required"),
    dob: dateStr.optional().or(z.literal("")),
    phone: z.string().trim().min(1, "Phone is required"),
    email: z.string().trim().email("Valid email is required"),
    street: optionalStr,
    city: optionalStr,
    state: optionalStr,
    zip: optionalStr,
    licenseNumber: z.string().trim().min(1, "License number is required"),
    licenseState: optionalStr,
    licenseExpiry: dateStr,
    licenseFrontUrl: optionalStr,
    licenseBackUrl: optionalStr,

    // insurance
    insuranceTypeChoice: z.enum(["COMPANY", "CUSTOMER"]),
    providerName: optionalStr,
    policyNumber: optionalStr,
    policyExpiry: optionalStr,
    agentPhone: optionalStr,
    agentEmail: optionalStr,
    cardFrontUrl: optionalStr,
    cardBackUrl: optionalStr,
  })
  .refine((d) => d.endDate > d.startDate, {
    message: "Return date must be after pick-up date.",
    path: ["endDate"],
  })
  .refine(
    (d) =>
      d.insuranceTypeChoice !== "CUSTOMER" ||
      (!!d.providerName && !!d.policyNumber && !!d.policyExpiry),
    {
      message: "Provider, policy number and expiry are required for customer insurance.",
      path: ["providerName"],
    },
  );

export type BookingRequest = z.infer<typeof bookingRequestSchema>;
