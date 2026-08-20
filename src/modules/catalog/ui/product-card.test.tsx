import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProductCard } from "./product-card";
import type { CatalogProductSummary } from "../model";

const product: CatalogProductSummary = {
  id: 17,
  slug: "apple-iphone-17-pro",
  name: "Apple iPhone 17 Pro",
  brand: { id: 1, name: "Apple" },
  category: { id: 2, name: "Smartphones", parent: { id: 1, name: "Phones" } },
  description: null,
  imageUrl: null,
  conditions: ["Brand New"],
  cashPriceFrom: null,
  srpPrice: null,
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
  updatedAt: null,
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

  it("treats a zero price as unpriced and never shows ₱0 or a struck SRP", () => {
    const { container } = render(
      <ProductCard
        product={{ ...product, cashPriceFrom: 0, srpPrice: 47000 }}
      />,
    );
    const card = within(container);

    expect(card.getByText("Contact store for price")).toBeVisible();
    expect(card.getByText("Price")).toBeVisible();
    expect(card.queryByText(/₱/)).not.toBeInTheDocument();
  });
});
