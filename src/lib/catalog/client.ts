import "server-only";

import type {
  CatalogFilters,
  CatalogProductDetail,
  CatalogQuery,
  PaginatedProducts,
} from "./types";
import { filtersResponseSchema, productResponseSchema, productsResponseSchema } from "./schema";

export class CatalogUnavailableError extends Error {
  constructor(message = "The product catalog is temporarily unavailable.") {
    super(message);
    this.name = "CatalogUnavailableError";
  }
}

function configuration(): { baseUrl: string; token: string } {
  const baseUrl = process.env.ERP_CATALOG_API_URL?.replace(/\/$/, "");
  const token = process.env.ERP_CATALOG_API_TOKEN;

  if (!baseUrl || !token) {
    throw new CatalogUnavailableError("Catalog connection is not configured.");
  }

  return { baseUrl, token };
}

async function catalogFetch(path: string): Promise<unknown> {
  const { baseUrl, token } = configuration();

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "force-cache",
      next: { revalidate: 60, tags: ["catalog"] },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new CatalogUnavailableError(`ERP catalog returned ${response.status}.`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof CatalogUnavailableError) throw error;
    throw new CatalogUnavailableError();
  }
}

export async function getProducts(query: CatalogQuery = {}): Promise<PaginatedProducts> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }
  const suffix = params.size ? `?${params.toString()}` : "";
  return productsResponseSchema.parse(await catalogFetch(`/products${suffix}`));
}

export async function getProduct(id: number): Promise<CatalogProductDetail | null> {
  try {
    const response = productResponseSchema.parse(await catalogFetch(`/products/${id}`));
    return response.data;
  } catch (error) {
    if (error instanceof CatalogUnavailableError && error.message.includes("404")) return null;
    throw error;
  }
}

export async function getFilters(): Promise<CatalogFilters> {
  const response = filtersResponseSchema.parse(await catalogFetch("/filters"));
  return response.data;
}
