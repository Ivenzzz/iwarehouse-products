import { describe, expect, it } from "vitest";
import {
  MAIN_DEVICE_CATEGORY_IDS,
  selectHomeProducts,
} from "./home-selection";
import type { CatalogCategory, CatalogProductSummary } from "./model";
import { resolveHomeCategories } from "./ui/home-categories";

const SMARTPHONES: CatalogCategory = {
  id: 2,
  name: "Smartphones",
  parent: { id: 1, name: "Mobile Devices" },
};

function product(
  id: number,
  overrides: Partial<CatalogProductSummary> = {},
): CatalogProductSummary {
  return {
    id,
    slug: `product-${id}`,
    name: `Product ${id}`,
    brand: { id: 1, name: "Apple" },
    category: SMARTPHONES,
    description: null,
    imageUrl: `https://erp.test/${id}.webp`,
    conditions: ["Brand New"],
    options: { colors: [], configurations: [] },
    cashPriceFrom: 42000,
    srpPrice: null,
    locations: [],
    updatedAt: null,
    ...overrides,
  };
}

function inCategory(id: number, parentId?: number): CatalogProductSummary {
  return product(id * 100, {
    category: {
      id,
      name: `Category ${id}`,
      parent: parentId ? { id: parentId, name: `Parent ${parentId}` } : null,
    },
  });
}

/** Which product IDs passed, using a filler pair so the hero always takes them. */
function featuredIds(products: CatalogProductSummary[]): number[] {
  const { recentlyAvailable } = selectHomeProducts([
    product(1),
    product(2),
    ...products,
  ]);
  return recentlyAvailable.map((item) => item.id);
}

describe("selectHomeProducts", () => {
  it("puts the first two in the hero and the rest in the row, in order", () => {
    const [a, b, c, d] = [1, 2, 3, 4].map((id) => product(id));

    expect(selectHomeProducts([a, b, c, d])).toEqual({
      newArrivals: [a, b],
      recentlyAvailable: [c, d],
    });
  });

  it.each([
    ["none", 0],
    ["one", 1],
  ])("has no hero with %s qualifying", (_label, count) => {
    const products = [1, 2].slice(0, count).map((id) => product(id));

    expect(selectHomeProducts(products)).toEqual({
      newArrivals: null,
      recentlyAvailable: products,
    });
  });

  it("uses all of exactly two, leaving nothing for the row", () => {
    const [a, b] = [product(1), product(2)];

    expect(selectHomeProducts([a, b])).toEqual({
      newArrivals: [a, b],
      recentlyAvailable: [],
    });
  });

  it("leaves pre-owned out of the hero but keeps it in the row, in order", () => {
    const preOwned = product(1, { conditions: ["Certified Pre-Owned"] });
    const [a, b, c] = [product(2), product(3), product(4)];

    expect(selectHomeProducts([preOwned, a, b, c])).toEqual({
      newArrivals: [a, b],
      recentlyAvailable: [preOwned, c],
    });
  });

  it("accepts a product sold in both conditions for the hero", () => {
    const both = product(1, {
      conditions: ["Brand New", "Certified Pre-Owned"],
    });

    expect(selectHomeProducts([both, product(2)]).newArrivals?.[0]).toBe(both);
  });

  it("has no hero when only pre-owned products qualify, leaving them to the row", () => {
    const preOwned = [1, 2, 3].map((id) =>
      product(id, { conditions: ["Certified Pre-Owned"] }),
    );

    expect(selectHomeProducts(preOwned)).toEqual({
      newArrivals: null,
      recentlyAvailable: preOwned,
    });
  });

  it.each<[string, Partial<CatalogProductSummary>]>([
    ["no photo", { imageUrl: null }],
    ["an empty photo", { imageUrl: "" }],
    ["no price", { cashPriceFrom: null }],
    ["a zero price", { cashPriceFrom: 0 }],
  ])("leaves out a product with %s", (_label, overrides) => {
    expect(featuredIds([product(3, overrides)])).toEqual([]);
  });

  it("matches a main device tile on the category or its parent", () => {
    expect(
      featuredIds([
        inCategory(2, 1), // Smartphones, a tile itself.
        inCategory(10, 9), // Laptops, under the Computers tile.
        inCategory(5, 4), // Smartwatches, under the Wearables tile.
        inCategory(4), // Wearables, a tile with no parent.
      ]),
    ).toEqual([200, 1000, 500, 400]);
  });

  it.each([
    ["Accessories", 36, 35],
    ["paper bags in Travel Accessories", 76, 73],
    ["No Category", 87, 86],
    ["Wearable Accessories", 8, 4],
    ["Computer Components", 14, 9],
    ["Office Furniture", 17, 9],
    ["Gaming Accessories", 22, 18],
    ["Projector Screens", 29, 23],
  ])("leaves out %s", (_label, id, parentId) => {
    expect(featuredIds([inCategory(id, parentId)])).toEqual([]);
  });
});

describe("MAIN_DEVICE_CATEGORY_IDS", () => {
  it("is the homepage tiles minus Accessories", () => {
    const everyId = Array.from({ length: 100 }, (_, index) => ({
      id: index + 1,
      name: "",
      children: [],
    }));
    const tileIds = resolveHomeCategories(everyId).map((tile) => tile.id);
    const ACCESSORIES = 35;

    expect([...MAIN_DEVICE_CATEGORY_IDS].sort((a, b) => a - b)).toEqual(
      tileIds.filter((id) => id !== ACCESSORIES).sort((a, b) => a - b),
    );
  });
});
