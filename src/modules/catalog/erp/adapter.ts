import type {
  CatalogFilters,
  CatalogLocation,
  CatalogProductDetail,
  CatalogProductSummary,
  CatalogQuery,
  PaginatedProducts,
  SiteBranding,
} from "../model";
import {
  CatalogSourceError,
  type CatalogSource,
} from "../source";
import {
  brandingResponseDtoSchema,
  filtersResponseDtoSchema,
  productResponseDtoSchema,
  productsResponseDtoSchema,
  type FiltersDto,
  type ProductDetailDto,
  type ProductSummaryDto,
} from "./schema";

interface ErpCatalogOptions {
  baseUrl: string;
  token: string;
  fetcher?: typeof fetch;
}

interface CatalogEnvironment {
  ERP_CATALOG_API_URL?: string;
  ERP_CATALOG_API_TOKEN?: string;
}

function mapLocation(
  location: ProductSummaryDto["locations"][number],
): CatalogLocation {
  return { ...location };
}

function mapProductSummary(product: ProductSummaryDto): CatalogProductSummary {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    category: product.category,
    description: product.description,
    imageUrl: product.image_url,
    conditions: product.conditions,
    cashPriceFrom: product.cash_price_from,
    srpPrice: product.srp_price,
    locations: product.locations.map(mapLocation),
    updatedAt: product.updated_at,
  };
}

function mapProductDetail(product: ProductDetailDto): CatalogProductDetail {
  return {
    ...mapProductSummary(product),
    specifications: product.specifications,
    variants: product.variants.map((variant) => ({
      id: variant.id,
      name: variant.name,
      condition: variant.condition,
      attributes: variant.attributes,
      imageUrl: variant.image_url,
      cashPriceFrom: variant.cash_price_from,
      srpPrice: variant.srp_price,
      locations: variant.locations.map(mapLocation),
    })),
  };
}

function mapFilters(filters: FiltersDto): CatalogFilters {
  return filters;
}

export function createErpCatalogSource({
  baseUrl,
  token,
  fetcher = fetch,
}: ErpCatalogOptions): CatalogSource {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");

  async function request(path: string): Promise<unknown> {
    try {
      const response = await fetcher(`${normalizedBaseUrl}${path}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "force-cache",
        next: { revalidate: 60, tags: ["catalog"] },
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new CatalogSourceError("not-found", "ERP catalog returned 404.");
        }
        throw new CatalogSourceError(
          "unavailable",
          `ERP catalog returned ${response.status}.`,
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof CatalogSourceError) throw error;
      throw new CatalogSourceError("unavailable");
    }
  }

  return {
    async getProducts(query: CatalogQuery): Promise<PaginatedProducts> {
      try {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(query)) {
          if (!value) continue;
          params.set(key === "perPage" ? "per_page" : key, value);
        }
        const suffix = params.size ? `?${params.toString()}` : "";
        const response = productsResponseDtoSchema.parse(
          await request(`/products${suffix}`),
        );

        return {
          data: response.data.map(mapProductSummary),
          meta: {
            currentPage: response.meta.current_page,
            perPage: response.meta.per_page,
            total: response.meta.total,
            lastPage: response.meta.last_page,
          },
        };
      } catch (error) {
        if (error instanceof CatalogSourceError) throw error;
        throw new CatalogSourceError("unavailable");
      }
    },

    async getProduct(id: number): Promise<CatalogProductDetail | null> {
      try {
        const response = productResponseDtoSchema.parse(
          await request(`/products/${id}`),
        );
        return mapProductDetail(response.data);
      } catch (error) {
        if (error instanceof CatalogSourceError && error.kind === "not-found") {
          return null;
        }
        if (error instanceof CatalogSourceError) throw error;
        throw new CatalogSourceError("unavailable");
      }
    },

    async getFilters(): Promise<CatalogFilters> {
      try {
        const response = filtersResponseDtoSchema.parse(
          await request("/filters"),
        );
        return mapFilters(response.data);
      } catch (error) {
        if (error instanceof CatalogSourceError) throw error;
        throw new CatalogSourceError("unavailable");
      }
    },

    async getBranding(): Promise<SiteBranding> {
      try {
        const response = brandingResponseDtoSchema.parse(
          await request("/branding"),
        );
        return { logo: response.data.logo };
      } catch (error) {
        if (error instanceof CatalogSourceError) throw error;
        throw new CatalogSourceError("unavailable");
      }
    },
  };
}

export function createErpCatalogSourceFromEnvironment(
  environment: CatalogEnvironment = process.env as CatalogEnvironment,
  fetcher: typeof fetch = fetch,
): CatalogSource {
  const baseUrl = environment.ERP_CATALOG_API_URL;
  const token = environment.ERP_CATALOG_API_TOKEN;

  if (!baseUrl || !token) {
    const unavailable = async (): Promise<never> => {
      throw new CatalogSourceError(
        "unavailable",
        "Catalog connection is not configured.",
      );
    };

    return {
      getProducts: unavailable,
      getProduct: unavailable,
      getFilters: unavailable,
      getBranding: unavailable,
    };
  }

  return createErpCatalogSource({ baseUrl, token, fetcher });
}
