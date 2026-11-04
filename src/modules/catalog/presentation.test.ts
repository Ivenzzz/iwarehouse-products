import { describe, expect, it } from "vitest";
import {
  directionsUrl,
  firstStorePhone,
  formatPeso,
  productPath,
} from "./presentation";

describe("catalog presentation", () => {
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
