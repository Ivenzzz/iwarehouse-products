import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { loadSiteBranding } from "@/modules/catalog";
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

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { logo } = await loadSiteBranding();

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={manrope.variable}>
        <SiteHeader logo={logo} />
        <main>{children}</main>
        <SiteFooter logo={logo} />
      </body>
    </html>
  );
}
