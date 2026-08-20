import type {
  BrowseCatalogViewModel,
  CatalogOutcome,
  CatalogQuery,
  HomeCatalogViewModel,
  ProductResolution,
  RawSearchParams,
  SiteBranding,
  SitemapProduct,
} from "./model";
import { CatalogSourceError, type CatalogSource } from "./source";

function unavailableOutcome(error: unknown): { status: "unavailable" } {
  if (error instanceof CatalogSourceError) {
    return { status: "unavailable" };
  }

  throw error;
}

function queryFrom(params: RawSearchParams): CatalogQuery {
  const value = (key: string) => {
    const candidate = params[key];
    return Array.isArray(candidate) ? candidate[0] : candidate;
  };

  return {
    q: value("q"),
    brand: value("brand"),
    category: value("category"),
    condition: value("condition"),
    location: value("location"),
    city: value("city"),
    sort: value("sort"),
    page: value("page"),
    perPage: "24",
  };
}

export function createCatalogWorkflows(source: CatalogSource) {
  return {
    async loadHomeCatalog(): Promise<CatalogOutcome<HomeCatalogViewModel>> {
      try {
        const [filters, products] = await Promise.all([
          source.getFilters(),
          source.getProducts({ sort: "newest", perPage: "6" }),
        ]);

        return {
          status: "ready",
          data: { filters, products: products.data },
        };
      } catch (error) {
        return unavailableOutcome(error);
      }
    },

    async browseCatalog(
      query: RawSearchParams,
    ): Promise<CatalogOutcome<BrowseCatalogViewModel>> {
      try {
        const [filters, products] = await Promise.all([
          source.getFilters(),
          source.getProducts(queryFrom(query)),
        ]);
        const { currentPage, perPage, total } = products.meta;
        const start = total === 0 ? 0 : (currentPage - 1) * perPage + 1;
        const end = Math.min(currentPage * perPage, total);

        return {
          status: "ready",
          data: {
            filters,
            products: products.data,
            meta: products.meta,
            range: { start, end, total },
            query,
          },
        };
      } catch (error) {
        return unavailableOutcome(error);
      }
    },

    async resolveProduct(idSlug: string): Promise<ProductResolution> {
      const match = idSlug.match(/^(\d+)(?:-|$)/);
      if (!match) return { status: "not-found" };

      try {
        const product = await source.getProduct(Number(match[1]));
        if (!product) return { status: "not-found" };

        const location = `/products/${product.id}-${product.slug}`;
        if (idSlug !== `${product.id}-${product.slug}`) {
          return { status: "redirect", location };
        }

        return { status: "ready", data: product };
      } catch (error) {
        return unavailableOutcome(error);
      }
    },

    async loadSiteBranding(): Promise<SiteBranding> {
      try {
        return await source.getBranding();
      } catch (error) {
        // Branding is decorative — a failed fetch must never break a page,
        // so fall back to the wordmark instead of an unavailable outcome.
        if (error instanceof CatalogSourceError) {
          return { logo: null, hero: null };
        }
        throw error;
      }
    },

    async loadSitemapProducts(): Promise<
      CatalogOutcome<readonly SitemapProduct[]>
    > {
      try {
        const firstPage = await source.getProducts({ perPage: "48", page: "1" });
        const remainingPages = await Promise.all(
          Array.from({ length: Math.max(0, firstPage.meta.lastPage - 1) }, (_, index) =>
            source.getProducts({ perPage: "48", page: String(index + 2) }),
          ),
        );

        return {
          status: "ready",
          data: [firstPage, ...remainingPages].flatMap((page) =>
            page.data.map((product) => ({
              path: `/products/${product.id}-${product.slug}`,
              lastModified: product.updatedAt,
            })),
          ),
        };
      } catch (error) {
        return unavailableOutcome(error);
      }
    },
  };
}
