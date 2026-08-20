import { describe, expect, it } from "vitest";
import type {
  CatalogFilters,
  CatalogLocation,
  CatalogProductSummary,
  CatalogQuery,
  PaginatedProducts,
} from "./model";
import { CatalogSourceError, type CatalogSource } from "./source";
import { createCatalogWorkflows } from "./workflows";

const filters: CatalogFilters = {
  brands: [{ id: 1, name: "Apple" }],
  categories: [
    {
      id: 1,
      name: "Phones",
      children: [{ id: 2, name: "Smartphones" }],
    },
  ],
  conditions: ["Brand New"],
  locations: [{ id: 3, name: "Makati Store", city: "Makati" }],
  cities: ["Makati"],
};

const product: CatalogProductSummary = {
  id: 17,
  slug: "apple-iphone-17-pro",
  name: "Apple iPhone 17 Pro",
  brand: { id: 1, name: "Apple" },
  category: {
    id: 2,
    name: "Smartphones",
    parent: { id: 1, name: "Phones" },
  },
  description: null,
  imageUrl: null,
  conditions: ["Brand New"],
  cashPriceFrom: 42000,
  srpPrice: 47000,
  locations: [],
  updatedAt: null,
};

const detail = {
  ...product,
  specifications: [],
  variants: [],
};

function page(data: CatalogProductSummary[]): PaginatedProducts {
  return {
    data,
    meta: { currentPage: 1, perPage: 6, total: data.length, lastPage: 1 },
  };
}

function stubSource(overrides: Partial<CatalogSource>): CatalogSource {
  return {
    getFilters: async () => filters,
    getProduct: async () => null,
    getProducts: async () => page([]),
    getBranding: async () => ({ logo: null, hero: null }),
    getLocations: async () => [],
    ...overrides,
  };
}

describe("catalog workflows", () => {
  it("loads the homepage catalog through one outcome", async () => {
    const productQueries: CatalogQuery[] = [];
    const source = stubSource({
      getProducts: async (query) => {
        productQueries.push(query);
        return page([product]);
      },
    });

    const catalog = createCatalogWorkflows(source);

    await expect(catalog.loadHomeCatalog()).resolves.toEqual({
      status: "ready",
      data: { filters, products: [product], categoryImages: { 2: null } },
    });
    expect(productQueries).toEqual([
      { sort: "newest", perPage: "6" },
      { category: "2", perPage: "1" },
    ]);
  });

  it("borrows a showcase product image for each curated home category", async () => {
    const source = stubSource({
      getProducts: async (query) =>
        query.category === "2"
          ? page([{ ...product, imageUrl: "https://erp.test/iphone.png" }])
          : page([product]),
    });

    const outcome = await createCatalogWorkflows(source).loadHomeCatalog();

    expect(outcome).toMatchObject({
      status: "ready",
      data: { categoryImages: { 2: "https://erp.test/iphone.png" } },
    });
  });

  it("keeps the homepage ready when a showcase image lookup fails", async () => {
    const source = stubSource({
      getProducts: async (query) => {
        if (query.category) {
          throw new CatalogSourceError("unavailable");
        }
        return page([product]);
      },
    });

    await expect(
      createCatalogWorkflows(source).loadHomeCatalog(),
    ).resolves.toEqual({
      status: "ready",
      data: { filters, products: [product], categoryImages: { 2: null } },
    });
  });

  it("normalizes browse input and calculates the visible result range", async () => {
    const productQueries: CatalogQuery[] = [];
    const source = stubSource({
      getProducts: async (query) => {
        productQueries.push(query);
        return {
          data: [product],
          meta: { currentPage: 2, perPage: 24, total: 31, lastPage: 2 },
        };
      },
    });

    const catalog = createCatalogWorkflows(source);
    const input = {
      q: ["iphone", "ignored"],
      brand: "1",
      category: undefined,
      condition: "Brand New",
      location: "3",
      city: "Makati",
      sort: "price_asc",
      page: "2",
      ignored: "preserved-for-links",
    };

    await expect(catalog.browseCatalog(input)).resolves.toEqual({
      status: "ready",
      data: {
        filters,
        products: [product],
        meta: { currentPage: 2, perPage: 24, total: 31, lastPage: 2 },
        range: { start: 25, end: 31, total: 31 },
        query: input,
      },
    });
    expect(productQueries).toEqual([
      {
        q: "iphone",
        brand: "1",
        category: undefined,
        condition: "Brand New",
        location: "3",
        city: "Makati",
        sort: "price_asc",
        page: "2",
        perPage: "24",
      },
    ]);
  });

  it("resolves stale product slugs to the canonical location", async () => {
    const source = stubSource({ getProduct: async () => detail });

    const catalog = createCatalogWorkflows(source);

    await expect(catalog.resolveProduct("17-old-name")).resolves.toEqual({
      status: "redirect",
      location: "/products/17-apple-iphone-17-pro",
    });
  });

  it("loads every sitemap page behind one all-or-nothing outcome", async () => {
    const requestedPages: string[] = [];
    const source = stubSource({
      getProduct: async () => detail,
      getProducts: async (query) => {
        const currentPage = Number(query.page);
        requestedPages.push(query.page ?? "");
        return {
          data: [
            {
              ...product,
              id: 16 + currentPage,
              slug: `product-${currentPage}`,
              updatedAt: `2026-08-0${currentPage}T00:00:00+08:00`,
            },
          ],
          meta: { currentPage, perPage: 48, total: 3, lastPage: 3 },
        };
      },
    });

    const catalog = createCatalogWorkflows(source);

    await expect(catalog.loadSitemapProducts()).resolves.toEqual({
      status: "ready",
      data: [
        {
          path: "/products/17-product-1",
          lastModified: "2026-08-01T00:00:00+08:00",
        },
        {
          path: "/products/18-product-2",
          lastModified: "2026-08-02T00:00:00+08:00",
        },
        {
          path: "/products/19-product-3",
          lastModified: "2026-08-03T00:00:00+08:00",
        },
      ],
    });
    expect(requestedPages).toEqual(["1", "2", "3"]);
  });

  it("returns unavailable when either homepage dependency fails", async () => {
    const source = stubSource({
      getFilters: async () => {
        throw new CatalogSourceError("unavailable");
      },
      getProduct: async () => detail,
      getProducts: async () => page([product]),
    });

    await expect(
      createCatalogWorkflows(source).loadHomeCatalog(),
    ).resolves.toEqual({ status: "unavailable" });
  });

  it("uses a zero result range for an empty browse page", async () => {
    const source = stubSource({
      getProduct: async () => detail,
      getProducts: async () => ({
        data: [],
        meta: { currentPage: 1, perPage: 24, total: 0, lastPage: 1 },
      }),
    });

    await expect(
      createCatalogWorkflows(source).browseCatalog({}),
    ).resolves.toMatchObject({
      status: "ready",
      data: { range: { start: 0, end: 0, total: 0 } },
    });
  });

  it("distinguishes ready, missing, invalid, and unavailable products", async () => {
    const ready = createCatalogWorkflows(
      stubSource({ getProduct: async () => detail }),
    );
    const missing = createCatalogWorkflows(
      stubSource({ getProduct: async () => null }),
    );
    const unavailable = createCatalogWorkflows(
      stubSource({
        getProduct: async () => {
          throw new CatalogSourceError("unavailable");
        },
      }),
    );

    await expect(
      ready.resolveProduct("17-apple-iphone-17-pro"),
    ).resolves.toEqual({ status: "ready", data: detail });
    await expect(missing.resolveProduct("17-missing")).resolves.toEqual({
      status: "not-found",
    });
    await expect(ready.resolveProduct("not-an-id")).resolves.toEqual({
      status: "not-found",
    });
    await expect(
      unavailable.resolveProduct("17-apple-iphone-17-pro"),
    ).resolves.toEqual({ status: "unavailable" });
  });

  it("drops all sitemap products if a later page fails", async () => {
    const source = stubSource({
      getProduct: async () => detail,
      getProducts: async (query) => {
        if (query.page === "2") {
          throw new CatalogSourceError("unavailable");
        }
        return {
          data: [product],
          meta: { currentPage: 1, perPage: 48, total: 2, lastPage: 2 },
        };
      },
    });

    await expect(
      createCatalogWorkflows(source).loadSitemapProducts(),
    ).resolves.toEqual({ status: "unavailable" });
  });

  it("does not disguise unexpected implementation faults as outages", async () => {
    const source = stubSource({
      getFilters: async () => {
        throw new TypeError("Broken mapper");
      },
      getProduct: async () => detail,
    });

    await expect(
      createCatalogWorkflows(source).loadHomeCatalog(),
    ).rejects.toThrow("Broken mapper");
  });

  it("loads site branding from the source", async () => {
    const logo = { url: "https://erp.test/storage/logos/mark.png", name: "Mark" };
    const hero = { url: "https://erp.test/storage/hero/collage.webp", name: "Hero" };
    const source = stubSource({ getBranding: async () => ({ logo, hero }) });

    await expect(
      createCatalogWorkflows(source).loadSiteBranding(),
    ).resolves.toEqual({ logo, hero });
  });

  it("falls back to a null logo and hero when branding is unavailable", async () => {
    const source = stubSource({
      getBranding: async () => {
        throw new CatalogSourceError("unavailable");
      },
    });

    await expect(
      createCatalogWorkflows(source).loadSiteBranding(),
    ).resolves.toEqual({ logo: null, hero: null });
  });

  it("does not disguise branding implementation faults as a missing logo", async () => {
    const source = stubSource({
      getBranding: async () => {
        throw new TypeError("Broken branding mapper");
      },
    });

    await expect(
      createCatalogWorkflows(source).loadSiteBranding(),
    ).rejects.toThrow("Broken branding mapper");
  });

  it("maps filters into site navigation", async () => {
    const source = stubSource({ getFilters: async () => filters });

    await expect(
      createCatalogWorkflows(source).loadSiteNavigation(),
    ).resolves.toEqual({
      categories: filters.categories,
      brands: filters.brands,
    });
  });

  it("falls back to empty navigation when filters are unavailable", async () => {
    const source = stubSource({
      getFilters: async () => {
        throw new CatalogSourceError("unavailable");
      },
    });

    await expect(
      createCatalogWorkflows(source).loadSiteNavigation(),
    ).resolves.toEqual({ categories: [], brands: [] });
  });

  it("does not disguise navigation implementation faults as empty menus", async () => {
    const source = stubSource({
      getFilters: async () => {
        throw new TypeError("Broken filters mapper");
      },
    });

    await expect(
      createCatalogWorkflows(source).loadSiteNavigation(),
    ).rejects.toThrow("Broken filters mapper");
  });

  it("groups store locations by city with unknown cities trailing", async () => {
    const location = (
      id: number,
      name: string,
      city: string | null,
    ): CatalogLocation => ({
      id,
      name,
      type: "store",
      address: "Address",
      city,
      phone: null,
      latitude: null,
      longitude: null,
    });
    const source = stubSource({
      getLocations: async () => [
        location(1, "Taguig Store", "Taguig"),
        location(2, "Roving Kiosk", null),
        location(3, "Makati Store", "Makati"),
        location(4, "Makati Kiosk", "Makati"),
      ],
    });

    const outcome = await createCatalogWorkflows(source).loadStoreLocations();

    expect(outcome).toMatchObject({ status: "ready" });
    if (outcome.status !== "ready") throw new Error("expected ready");
    expect(
      outcome.data.groups.map((group) => ({
        city: group.city,
        names: group.locations.map((l) => l.name),
      })),
    ).toEqual([
      { city: "Makati", names: ["Makati Store", "Makati Kiosk"] },
      { city: "Taguig", names: ["Taguig Store"] },
      { city: "Other locations", names: ["Roving Kiosk"] },
    ]);
  });

  it("reports the store directory unavailable for both source error kinds", async () => {
    for (const kind of ["not-found", "unavailable"] as const) {
      const source = stubSource({
        getLocations: async () => {
          throw new CatalogSourceError(kind);
        },
      });

      await expect(
        createCatalogWorkflows(source).loadStoreLocations(),
      ).resolves.toEqual({ status: "unavailable" });
    }
  });

  it("does not disguise store directory implementation faults as outages", async () => {
    const source = stubSource({
      getLocations: async () => {
        throw new TypeError("Broken locations mapper");
      },
    });

    await expect(
      createCatalogWorkflows(source).loadStoreLocations(),
    ).rejects.toThrow("Broken locations mapper");
  });
});
