import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProductCard } from "./product-card";
import type { CatalogProductSummary } from "@/lib/catalog/types";

const product: CatalogProductSummary = {
  id: 17,
  slug: "apple-iphone-17-pro",
  name: "Apple iPhone 17 Pro",
  brand: { id: 1, name: "Apple" },
  category: { id: 2, name: "Smartphones", parent: { id: 1, name: "Phones" } },
  description: null,
  image_url: null,
  conditions: ["Brand New"],
  cash_price_from: null,
  srp_price: null,
  locations: [
    {
      id: 3,
      name: "Makati Store",
      type: "store",
      address: "Makati",
      city: "Makati",
      phone: null,
      latitude: null,
      longitude: null,
    },
  ],
  updated_at: null,
};

describe("ProductCard", () => {
  it("keeps missing-price products useful without implying a reservation", () => {
    render(<ProductCard product={product} />);

    expect(screen.getByRole("link", { name: /view apple iphone 17 pro/i })).toHaveAttribute(
      "href",
      "/products/17-apple-iphone-17-pro",
    );
    expect(screen.getByText("Contact store for price")).toBeVisible();
    expect(screen.getByText("Available at 1 location")).toBeVisible();
    expect(screen.queryByText(/add to cart/i)).not.toBeInTheDocument();
  });
});
