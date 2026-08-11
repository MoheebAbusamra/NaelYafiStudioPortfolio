import type { Metadata, Viewport } from "next";
import { Cinzel, Josefin_Sans } from "next/font/google";

import { CursorTrail } from "@/components/CursorTrail";
import { SmoothScroll } from "@/components/SmoothScroll";
import { SITE } from "@/lib/site";

import "./globals.css";

/** Display face for headings: engraved, high end, editorial. */
const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-cinzel",
  display: "swap",
});

/** Body face: geometric, quiet, wide tracking at small sizes. */
const josefin = Josefin_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-josefin",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} | ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  openGraph: {
    title: `${SITE.name} | ${SITE.tagline}`,
    description: SITE.description,
    url: SITE.url,
    siteName: SITE.name,
    locale: "en_CA",
    type: "website",
  },
  icons: {
    icon: "/brand/monogram.png",
    apple: "/brand/monogram.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#002b49",
  width: "device-width",
  initialScale: 1,
  // Never block zoom; pinching is an accessibility affordance.
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cinzel.variable} ${josefin.variable}`}>
      <body className="bg-navy text-ivory antialiased">
        <SmoothScroll />
        <CursorTrail />
        {children}
      </body>
    </html>
  );
}
