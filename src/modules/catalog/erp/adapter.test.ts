import { describe, expect, it, vi } from "vitest";
import {
  createErpCatalogSource,
  createErpCatalogSourceFromEnvironment,
} from "./adapter";

describe("ERP catalog adapter", () => {
  it("authenticates, serializes queries, and maps product DTOs", async () => {
    const fetcher = vi.fn<typeof fetch>(async () =>
      new Response(
        JSON.stringify({
          data: [
            {
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
              image_url: null,
              conditions: ["Brand New"],
              cash_price_from: 42000,
              srp_price: 47000,
              locations: [],
              updated_at: "2026-08-04T00:00:00+08:00",
            },
          ],
          meta: {
            current_page: 2,
            per_page: 24,
            total: 31,
            last_page: 2,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    const source = createErpCatalogSource({
      baseUrl: "https://erp.example.test/api/v1/catalog/",
      token: "secret-token",
      fetcher,
    });

    await expect(
      source.getProducts({
        q: "iphone pro",
        page: "2",
        perPage: "24",
      }),
    ).resolves.toMatchObject({
      data: [
        {
          id: 17,
          imageUrl: null,
          cashPriceFrom: 42000,
          updatedAt: "2026-08-04T00:00:00+08:00",
        },
      ],
      meta: { currentPage: 2, perPage: 24, total: 31, lastPage: 2 },
    });
    expect(fetcher).toHaveBeenCalledWith(
      "https://erp.example.test/api/v1/catalog/products?q=iphone+pro&page=2&per_page=24",
      expect.objectContaining({
        headers: {
          Accept: "application/json",
          Authorization: "Bearer secret-token",
        },
        cache: "force-cache",
        next: { revalidate: 60, tags: ["catalog"] },
      }),
    );
  });

  it("reports missing environment configuration through the source interface", async () => {
    const source = createErpCatalogSourceFromEnvironment({});

    await expect(source.getFilters()).rejects.toEqual(
      expect.objectContaining({
        kind: "unavailable",
        message: "Catalog connection is not configured.",
      }),
    );
    await expect(source.getBranding()).rejects.toEqual(
      expect.objectContaining({
        kind: "unavailable",
        message: "Catalog connection is not configured.",
      }),
    );
  });

  it("authenticates the branding request and maps the assigned logo and hero", async () => {
    const fetcher = vi.fn<typeof fetch>(async () =>
      new Response(
        JSON.stringify({
          data: {
            logo: {
              url: "https://erp.example.test/storage/logos/mark.png",
              name: "Store Wordmark",
            },
            hero: {
              url: "https://erp.example.test/storage/hero/collage.webp",
              name: "Homepage hero",
            },
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    const source = createErpCatalogSource({
      baseUrl: "https://erp.example.test/api/v1/catalog",
      token: "secret-token",
      fetcher,
    });

    await expect(source.getBranding()).resolves.toEqual({
      logo: {
        url: "https://erp.example.test/storage/logos/mark.png",
        name: "Store Wordmark",
      },
      hero: {
        url: "https://erp.example.test/storage/hero/collage.webp",
        name: "Homepage hero",
      },
    });
    expect(fetcher).toHaveBeenCalledWith(
      "https://erp.example.test/api/v1/catalog/branding",
      expect.objectContaining({
        headers: {
          Accept: "application/json",
          Authorization: "Bearer secret-token",
        },
        cache: "force-cache",
        next: { revalidate: 60, tags: ["catalog"] },
      }),
    );
  });

  it("maps an unassigned branding logo and hero to null", async () => {
    const fetcher = vi.fn<typeof fetch>(async () =>
      new Response(JSON.stringify({ data: { logo: null, hero: null } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const source = createErpCatalogSource({
      baseUrl: "https://erp.example.test/catalog",
      token: "token",
      fetcher,
    });

    await expect(source.getBranding()).resolves.toEqual({
      logo: null,
      hero: null,
    });
  });

  it("maps a branding payload without a hero field to a null hero", async () => {
    const fetcher = vi.fn<typeof fetch>(async () =>
      new Response(JSON.stringify({ data: { logo: null } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const source = createErpCatalogSource({
      baseUrl: "https://erp.example.test/catalog",
      token: "token",
      fetcher,
    });

    await expect(source.getBranding()).resolves.toEqual({
      logo: null,
      hero: null,
    });
  });

  it("translates malformed branding payloads to unavailable", async () => {
    const fetcher = vi.fn<typeof fetch>(async () =>
      new Response(JSON.stringify({ data: "not-branding" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const source = createErpCatalogSource({
      baseUrl: "https://erp.example.test/catalog",
      token: "token",
      fetcher,
    });

    await expect(source.getBranding()).rejects.toMatchObject({
      kind: "unavailable",
    });
  });

  it("maps a valid product detail response", async () => {
    const fetcher = vi.fn<typeof fetch>(async () =>
      new Response(
        JSON.stringify({
          data: {
            id: 17,
            slug: "apple-iphone-17-pro",
            name: "Apple iPhone 17 Pro",
            brand: { id: 1, name: "Apple" },
            category: { id: 2, name: "Smartphones", parent: null },
            description: "Flagship phone",
            image_url: "/phone.jpg",
            conditions: ["Brand New"],
            cash_price_from: 42000,
            srp_price: 47000,
            locations: [],
            updated_at: null,
            specifications: [
              {
                group: "Display",
                items: [
                  { key: "size", label: "Display size", value: "6.3 inches" },
                ],
              },
            ],
            variants: [
              {
                id: 21,
                name: "256GB Black",
                condition: "Brand New",
                attributes: [
                  { key: "color", label: "Color", value: "Black" },
                ],
                image_url: "/black.jpg",
                cash_price_from: 42000,
                srp_price: 47000,
                locations: [],
              },
            ],
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    const source = createErpCatalogSource({
      baseUrl: "https://erp.example.test/catalog",
      token: "token",
      fetcher,
    });

    await expect(source.getProduct(17)).resolves.toMatchObject({
      imageUrl: "/phone.jpg",
      cashPriceFrom: 42000,
      variants: [{ imageUrl: "/black.jpg", cashPriceFrom: 42000 }],
    });
  });

  it("returns null when the ERP reports a missing product", async () => {
    const fetcher = vi.fn<typeof fetch>(
      async () => new Response(null, { status: 404 }),
    );
    const source = createErpCatalogSource({
      baseUrl: "https://erp.example.test/catalog",
      token: "token",
      fetcher,
    });

    await expect(source.getProduct(404)).resolves.toBeNull();
  });

  it("translates malformed ERP payloads to unavailable", async () => {
    const fetcher = vi.fn<typeof fetch>(async () =>
      new Response(JSON.stringify({ data: "not-products" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const source = createErpCatalogSource({
      baseUrl: "https://erp.example.test/catalog",
      token: "token",
      fetcher,
    });

    await expect(source.getProducts({})).rejects.toMatchObject({
      kind: "unavailable",
    });
  });

  it("translates HTTP and network failures to unavailable", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockRejectedValueOnce(new DOMException("Timed out", "TimeoutError"));
    const source = createErpCatalogSource({
      baseUrl: "https://erp.example.test/catalog",
      token: "token",
      fetcher,
    });

    await expect(source.getFilters()).rejects.toMatchObject({
      kind: "unavailable",
    });
    await expect(source.getFilters()).rejects.toMatchObject({
      kind: "unavailable",
    });
  });
});
