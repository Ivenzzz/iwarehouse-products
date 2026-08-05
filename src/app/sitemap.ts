import type { MetadataRoute } from "next";
import { loadSitemapProducts } from "@/modules/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const entries: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/products`, changeFrequency: "hourly", priority: 0.9 },
  ];

  const products = await loadSitemapProducts();
  if (products.status === "ready") {
    entries.push(
      ...products.data.map((product) => ({
        url: `${siteUrl}${product.path}`,
        lastModified: product.lastModified || undefined,
        changeFrequency: "hourly" as const,
        priority: 0.8,
      })),
    );
  }

  return entries;
}
