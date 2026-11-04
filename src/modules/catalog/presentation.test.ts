import { describe, expect, it } from "vitest";
import {
  directionsUrl,
  firstStorePhone,
  formatPeso,
  memoryLabels,
  productPath,
  swatchColor,
  UNKNOWN_SWATCH_COLOR,
} from "./presentation";

describe("catalog presentation", () => {
  it("picks a swatch from the color word in a product color name", () => {
    expect(swatchColor("Black")).toBe(swatchColor("BLACK"));
    expect(swatchColor("ICE BLUE")).toBe(swatchColor("Blue"));
    expect(swatchColor("SILVER DANCER")).toBe(swatchColor("Silver"));
    expect(swatchColor("Midnight-Green")).toBe(swatchColor("Green"));
    expect(swatchColor("Blue")).not.toBe(swatchColor("Green"));
  });

  it("falls back to neutral gray for a color name it cannot read", () => {
    expect(swatchColor("Dancer")).toBe(UNKNOWN_SWATCH_COLOR);
    expect(swatchColor("")).toBe(UNKNOWN_SWATCH_COLOR);
  });

  it("labels memory sizes smallest first, by real size", () => {
    expect(
      memoryLabels([
        { ram: "16GB", rom: "1TB" },
        { ram: "8GB", rom: "128GB" },
        { ram: "4GB", rom: "64GB" },
        { ram: "8GB", rom: "512GB" },
      ]),
    ).toEqual(["4GB/64GB", "8GB/128GB", "8GB/512GB", "16GB/1TB"]);
  });

  it("labels a configuration with whichever size it has", () => {
    expect(
      memoryLabels([
        { ram: null, rom: "256GB" },
        { ram: "8GB", rom: null },
      ]),
    ).toEqual(["8GB", "256GB"]);
  });

  it("keeps sizes it cannot read, after the ones it can", () => {
    expect(
      memoryLabels([
        { ram: null, rom: "Custom" },
        { ram: null, rom: "64GB" },
      ]),
    ).toEqual(["64GB", "Custom"]);
  });

  it("finds the first store phone and tolerates stores without one", () => {
    const location = {
      id: 3,
      name: "Makati Store",
      type: "store" as const,
      address: "Makati",
      city: "Makati",
      latitude: null,
      longitude: null,
    };

    expect(
      firstStorePhone({
        groups: [
          { city: "Makati", locations: [{ ...location, phone: null }] },
          { city: "Taguig", locations: [{ ...location, phone: "+632" }] },
        ],
      }),
    ).toBe("+632");
    expect(
      firstStorePhone({
        groups: [{ city: "Makati", locations: [{ ...location, phone: null }] }],
      }),
    ).toBeNull();
  });

  it("formats Philippine peso prices for English customers", () => {
    expect(formatPeso(42000)).toBe("₱42,000");
    expect(formatPeso(null)).toBe("Contact store for price");
  });

  it("treats zero and negative prices as unpriced", () => {
    expect(formatPeso(0)).toBe("Contact store for price");
    expect(formatPeso(-1)).toBe("Contact store for price");
  });

  it("builds stable product and location links", () => {
    expect(productPath({ id: 17, slug: "apple-iphone-17-pro" })).toBe(
      "/products/17-apple-iphone-17-pro",
    );
    expect(directionsUrl({ latitude: 14.5547, longitude: 121.0244, address: "Makati" })).toBe(
      "https://www.google.com/maps/search/?api=1&query=14.5547%2C121.0244",
    );
  });
});
