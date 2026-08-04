import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/catalog/client";
import { productPath } from "@/lib/catalog/presentation";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const entries: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/products`, changeFrequency: "hourly", priority: 0.9 },
  ];

  try {
    const firstPage = await getProducts({ per_page: "48", page: "1" });
    const remainingPages = await Promise.all(
      Array.from({ length: Math.max(0, firstPage.meta.last_page - 1) }, (_, index) =>
        getProducts({ per_page: "48", page: String(index + 2) }),
      ),
    );
    const products = [firstPage, ...remainingPages].flatMap((page) => page.data);
    entries.push(
      ...products.map((product) => ({
        url: `${siteUrl}${productPath(product)}`,
        lastModified: product.updated_at || undefined,
        changeFrequency: "hourly" as const,
        priority: 0.8,
      })),
    );
  } catch {
    // Static routes remain discoverable while the ERP is temporarily unavailable.
  }

  return entries;
}
