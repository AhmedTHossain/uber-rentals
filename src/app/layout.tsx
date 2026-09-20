import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "DMV Rentals · Exclusive Car Rentals",
  description:
    "Luxury and exotic car rentals by the week. Browse the fleet and submit a request — every reservation is personally reviewed and approved.",
};

// Dark is the default. This runs before paint so a visitor who opted into
// light doesn't see a dark flash first — the shells re-apply the same
// preference on their own wrapper once they mount.
const themeInit = `(function(){try{var k=location.pathname.indexOf("/admin")===0?"ur-admin-theme":"ur-public-theme";if(localStorage.getItem(k)==="light")document.documentElement.className="theme-light";}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="theme-dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
