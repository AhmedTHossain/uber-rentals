import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "DMV Rentals · Exclusive Car Rentals",
  description:
    "Luxury and exotic car rentals by the week. Browse the fleet and submit a request — every reservation is personally reviewed and approved.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
