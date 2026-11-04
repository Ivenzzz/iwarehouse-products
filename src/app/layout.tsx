import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import {
  firstStorePhone,
  loadSiteBranding,
  loadSiteNavigation,
  loadStoreLocations,
} from "@/modules/catalog";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "iWarehouse Products", template: "%s | iWarehouse" },
  description: "Browse products currently available at iWarehouse stores and kiosks.",
  openGraph: {
    type: "website",
    siteName: "iWarehouse Products",
    title: "iWarehouse Products",
    description: "Find current products, prices, and store availability.",
  },
};

export const viewport: Viewport = {
  themeColor: "#f4f4f2",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [{ logo }, nav, stores] = await Promise.all([
    loadSiteBranding(),
    loadSiteNavigation(),
    loadStoreLocations(),
  ]);

  // Footer chrome degrades gracefully: no reachable store phone, no Call Us.
  const contactPhone =
    stores.status === "ready" ? firstStorePhone(stores.data) : null;

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={manrope.variable}>
        <SiteHeader logo={logo} nav={nav} />
        <main>{children}</main>
        <SiteFooter logo={logo} contactPhone={contactPhone} />
      </body>
    </html>
  );
}
