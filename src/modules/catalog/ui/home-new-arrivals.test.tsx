import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type {
  CatalogProductSummary,
  HomeCatalogViewModel,
  HomeProductRow,
  NewArrivals,
} from "../model";
import { HomeCatalogSections } from "./home-catalog-sections";
import { HomeNewArrivals } from "./home-new-arrivals";

function product(id: number, name: string): CatalogProductSummary {
  return {
    id,
    slug: `product-${id}`,
    name,
    brand: { id: 1, name: "Apple" },
    category: { id: 2, name: "Smartphones" },
    description: null,
    imageUrl: `/photos/${id}.webp`,
    conditions: ["Brand New"],
    options: { colors: [], configurations: [] },
    cashPriceFrom: 40000 + id,
    srpPrice: 50000,
    locations: [],
    updatedAt: null,
  };
}

const pair: NewArrivals = [
  product(1, "APPLE IPHONE 18 PRO MAX"),
  product(2, "APPLE IPHONE 18 PRO"),
];

function catalog(
  overrides: Partial<HomeCatalogViewModel> = {},
): HomeCatalogViewModel {
  return {
    filters: {
      brands: [],
      categories: [],
      conditions: [],
      locations: [],
      cities: [],
    },
    newArrivals: null,
    rows: [],
    ...overrides,
  };
}

const row: HomeProductRow = {
  id: "newest",
  title: "Recently available",
  href: "/products?sort=newest",
  products: [product(3, "APPLE IPAD")],
};

describe("HomeNewArrivals", () => {
  it("links each card to its product and shows its photo and price", () => {
    const { container } = render(<HomeNewArrivals products={pair} />);

    expect(
      screen.getByRole("link", { name: "View APPLE IPHONE 18 PRO MAX" }),
    ).toHaveAttribute("href", "/products/1-product-1");
    expect(
      screen.getByRole("link", { name: "View APPLE IPHONE 18 PRO" }),
    ).toHaveAttribute("href", "/products/2-product-2");
    expect(screen.getByText("₱40,001")).toBeInTheDocument();
    expect(screen.getByText("₱40,002")).toBeInTheDocument();
    expect(
      [...container.querySelectorAll("img")].map((image) =>
        image.getAttribute("src"),
      ),
    ).toEqual(["/photos/1.webp", "/photos/2.webp"]);
  });

  it("has a section heading below the page's h1, and links to the newest products", () => {
    render(<HomeNewArrivals products={pair} />);

    expect(
      screen.getByRole("heading", { level: 2, name: "New arrivals" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "See all new arrivals" }),
    ).toHaveAttribute("href", "/products?sort=newest");
  });

  it("doesn't show SRP or claim anything about stock", () => {
    const { container } = render(<HomeNewArrivals products={pair} />);

    expect(container).not.toHaveTextContent(/SRP|₱50,000|in stock|location/i);
  });
});

describe("HomeCatalogSections with new arrivals", () => {
  it("doesn't say no products were found when the hero is showing them", () => {
    render(
      <HomeCatalogSections
        catalog={catalog({ newArrivals: pair })}
        stores={null}
      />,
    );

    expect(screen.queryByText(/no available products/i)).toBeNull();
  });

  it("says no products were found when there's no hero or row", () => {
    render(<HomeCatalogSections catalog={catalog()} stores={null} />);

    expect(screen.getByText(/no available products/i)).toBeInTheDocument();
  });

  it("still shows the row below the hero", () => {
    render(
      <HomeCatalogSections
        catalog={catalog({ newArrivals: pair, rows: [row] })}
        stores={null}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Recently available" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View APPLE IPAD" }),
    ).toBeInTheDocument();
  });
});
