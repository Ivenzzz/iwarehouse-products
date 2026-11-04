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
  options: { colors: [], configurations: [] },
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
  it("shows in-stock colors and memory, limiting what fits on the card", () => {
    const { container } = render(
      <ProductCard
        product={{
          ...product,
          options: {
            colors: ["Black", "Ice Blue", "White", "Red", "Green", "Gold", "Pink"],
            configurations: [
              { ram: "16GB", rom: "1TB" },
              { ram: "8GB", rom: "256GB" },
              { ram: "12GB", rom: "512GB" },
              { ram: "4GB", rom: "128GB" },
            ],
          },
        }}
      />,
    );
    const card = within(container);

    expect(
      card.getByText(
        "Available colors: Black, Ice Blue, White, Red, Green, Gold, Pink",
      ),
    ).toBeInTheDocument();
    expect(container.querySelectorAll('[data-slot="swatch"]')).toHaveLength(5);
    // Two more colors and two more memory sizes than the card has room for.
    expect(card.getAllByText("+2")).toHaveLength(2);

    expect(card.getByText("4GB/128GB")).toBeVisible();
    expect(card.getByText("8GB/256GB")).toBeVisible();
    expect(card.queryByText("16GB/1TB")).not.toBeInTheDocument();
    expect(
      card.getByText(
        "Available memory: 4GB/128GB, 8GB/256GB, 12GB/512GB, 16GB/1TB",
      ),
    ).toBeInTheDocument();
  });

  it("hides the option rows when a product has none", () => {
    const { container } = render(<ProductCard product={product} />);

    expect(container.querySelector('[data-slot="swatch"]')).toBeNull();
    expect(screen.queryByText(/available colors/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/available memory/i)).not.toBeInTheDocument();
  });

  it("leaves out the condition and the separate brand label", () => {
    render(<ProductCard product={{ ...product, imageUrl: "/phone.jpg" }} />);

    expect(screen.queryByText("Brand New")).not.toBeInTheDocument();
    expect(screen.queryByText("Apple")).not.toBeInTheDocument();
  });

  it("keeps the crossed-out SRP when it is above the price", () => {
    render(
      <ProductCard
        product={{ ...product, cashPriceFrom: 42000, srpPrice: 47000 }}
      />,
    );

    expect(screen.getByText("₱42,000")).toBeVisible();
    expect(screen.getByText("₱47,000").tagName).toBe("DEL");
  });

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
