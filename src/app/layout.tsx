import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "DMV Rentals · Exclusive Car Rentals",
  description:
    "Luxury and exotic car rentals by the week. Browse the fleet and submit a request — every reservation is personally reviewed and approved.",
};

// Dark is the default; light is opt-in and only reached by storing "light".
// This runs before first paint so a visitor who chose light never sees dark
// flash past, and <html> stays the single source of truth for the theme.
//
// Note the keys are deliberately not the pre-2026-09 "ur-public-theme" /
// "ur-admin-theme": those still hold light for anyone who toggled back when
// light was the default, which would have kept them on light forever.
const themeInit = `(function(){try{var k=location.pathname.indexOf("/admin")===0?"ur-theme-admin":"ur-theme-public";if(localStorage.getItem(k)==="light"){var e=document.documentElement;e.classList.remove("theme-dark");e.classList.add("theme-light");}}catch(e){}})();`;

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
