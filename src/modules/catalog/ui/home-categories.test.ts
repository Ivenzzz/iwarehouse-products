import { describe, expect, it } from "vitest";
import type { CatalogFilters } from "../model";
import { resolveHomeCategories } from "./home-categories";

const fullTree: CatalogFilters["categories"] = [
  {
    id: 1,
    name: "Mobile Devices",
    children: [
      { id: 2, name: "Smartphones" },
      { id: 3, name: "Tablets" },
    ],
  },
  {
    id: 9,
    name: "Computers & Office",
    children: [
      { id: 10, name: "Laptops" },
      { id: 11, name: "Desktop PCs" },
      { id: 12, name: "Mini PCs" },
      { id: 13, name: "Monitors" },
      { id: 14, name: "Computer Components" },
    ],
  },
  {
    id: 4,
    name: "Wearables",
    children: [
      { id: 5, name: "Smartwatches" },
      { id: 6, name: "Fitness Bands" },
    ],
  },
  {
    id: 18,
    name: "Gaming",
    children: [
      { id: 19, name: "Consoles" },
      { id: 22, name: "Gaming Accessories" },
    ],
  },
  {
    id: 30,
    name: "Cameras & Drones",
    children: [
      { id: 32, name: "Action Cameras" },
      { id: 33, name: "Photography Cameras" },
    ],
  },
  {
    id: 23,
    name: "TV, Audio & Entertainment",
    children: [
      { id: 24, name: "Televisions" },
      { id: 25, name: "Speakers" },
      { id: 26, name: "Headphones" },
    ],
  },
  {
    id: 35,
    name: "Accessories & Storage",
    children: [
      { id: 36, name: "Chargers & Powerbanks" },
      { id: 37, name: "Storage Devices" },
    ],
  },
];

describe("resolveHomeCategories", () => {
  it("resolves the full curated set in order with curated display names", () => {
    const resolved = resolveHomeCategories(fullTree);
    expect(resolved.map((entry) => entry.name)).toEqual([
      "Smartphones",
      "Laptops & Computers",
      "Tablets",
      "Gaming",
      "TV & Audio",
      "Accessories",
      "Cameras & Drones",
      "Wearables",
    ]);
    expect(resolved[0].href).toBe("/products?category=2");
    expect(resolved[1].href).toBe("/products?category=9");
  });

  it("gives every card a curated tagline", () => {
    for (const entry of resolveHomeCategories(fullTree)) {
      expect(entry.tagline).not.toBe("");
    }
  });

  it("resolves leaf categories that only exist as children", () => {
    const ids = resolveHomeCategories(fullTree).map((entry) => entry.id);
    expect(ids).toContain(2);
    expect(ids).toContain(3);
  });

  it("hides entries whose id is missing from live data", () => {
    const withoutWearables = fullTree.filter((parent) => parent.id !== 4);
    const resolved = resolveHomeCategories(withoutWearables);
    expect(resolved.map((entry) => entry.name)).not.toContain("Wearables");
    expect(resolved).toHaveLength(7);
  });

  it("returns nothing when no categories are available", () => {
    expect(resolveHomeCategories([])).toEqual([]);
  });
});
