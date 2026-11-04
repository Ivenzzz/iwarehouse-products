import type {
  BrowseCatalogViewModel,
  CatalogLocation,
  CatalogOutcome,
  CatalogProductSummary,
  CatalogQuery,
  HomeCatalogViewModel,
  HomeProductRow,
  ProductResolution,
  RawSearchParams,
  SiteBranding,
  SiteNavigation,
  SitemapProduct,
  StoreDirectoryViewModel,
} from "./model";
import { CatalogSourceError, type CatalogSource } from "./source";

function unavailableOutcome(error: unknown): { status: "unavailable" } {
  if (error instanceof CatalogSourceError) {
    return { status: "unavailable" };
  }

  throw error;
}

const FALLBACK_CITY_GROUP = "Other locations";

function groupByCity(
  locations: CatalogLocation[],
): StoreDirectoryViewModel["groups"] {
  const groups = new Map<string, CatalogLocation[]>();

  for (const location of locations) {
    const city = location.city ?? FALLBACK_CITY_GROUP;
    groups.set(city, [...(groups.get(city) ?? []), location]);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => {
      // Locations without a city trail the named ones.
      if (a === FALLBACK_CITY_GROUP) return 1;
      if (b === FALLBACK_CITY_GROUP) return -1;
      return a.localeCompare(b);
    })
    .map(([city, cityLocations]) => ({ city, locations: cityLocations }));
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

interface HomeRowDefinition extends Omit<HomeProductRow, "products"> {
  query: CatalogQuery;
}

const NEWEST_ROW: HomeRowDefinition = {
  id: "newest",
  title: "Recently available",
  href: "/products?sort=newest",
  query: { sort: "newest", perPage: "4" },
};

const PRODUCTS_PER_ROW = 4;

// Category ids match the curated storefront aisles in ui/home-categories.ts.
// Each fetches more than it shows, because the rows above often already hold
// a category's latest products and those are removed as duplicates.
const CATEGORY_ROWS: HomeRowDefinition[] = [
  {
    id: "smartphones",
    title: "Smartphones",
    href: "/products?category=2&sort=newest",
    query: { sort: "newest", category: "2", perPage: "12" },
  },
  {
    id: "laptops",
    title: "Laptops & computers",
    href: "/products?category=9&sort=newest",
    query: { sort: "newest", category: "9", perPage: "12" },
  },
];

function buildHomeRows(
  rows: Array<{
    definition: HomeRowDefinition;
    products: CatalogProductSummary[];
  }>,
): HomeProductRow[] {
  const seen = new Set<number>();

  return rows.flatMap(({ definition, products }) => {
    const unique = products
      .filter((product) => !seen.has(product.id))
      .slice(0, PRODUCTS_PER_ROW);
    unique.forEach((product) => seen.add(product.id));
    if (unique.length === 0) return [];

    const { id, title, href } = definition;
    return [{ id, title, href, products: unique }];
  });
}

export function createCatalogWorkflows(source: CatalogSource) {
  return {
    async loadHomeCatalog(): Promise<CatalogOutcome<HomeCatalogViewModel>> {
      try {
        const [filters, newest, categoryResults] = await Promise.all([
          source.getFilters(),
          source.getProducts(NEWEST_ROW.query),
          // A failed category row costs only that row, not the whole page.
          Promise.allSettled(
            CATEGORY_ROWS.map((row) => source.getProducts(row.query)),
          ),
        ]);

        const categoryRows = categoryResults.flatMap((result, index) => {
          if (result.status === "fulfilled") {
            return [
              { definition: CATEGORY_ROWS[index], products: result.value.data },
            ];
          }
          if (result.reason instanceof CatalogSourceError) return [];
          throw result.reason;
        });

        return {
          status: "ready",
          data: {
            filters,
            rows: buildHomeRows([
              { definition: NEWEST_ROW, products: newest.data },
              ...categoryRows,
            ]),
          },
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

    async loadSiteNavigation(): Promise<SiteNavigation> {
      try {
        const filters = await source.getFilters();
        return { categories: filters.categories, brands: filters.brands };
      } catch (error) {
        // Header navigation is chrome — a failed fetch must never break a
        // page, so the menus degrade to plain links instead.
        if (error instanceof CatalogSourceError) {
          return { categories: [], brands: [] };
        }
        throw error;
      }
    },

    async loadStoreLocations(): Promise<
      CatalogOutcome<StoreDirectoryViewModel>
    > {
      try {
        const locations = await source.getLocations();
        return { status: "ready", data: { groups: groupByCity(locations) } };
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
