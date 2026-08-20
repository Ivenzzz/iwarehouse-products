import { describe, expect, it } from "vitest";
import type {
  CatalogFilters,
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
      data: { filters, products: [product] },
    });
    expect(productQueries).toEqual([{ sort: "newest", perPage: "6" }]);
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
});
