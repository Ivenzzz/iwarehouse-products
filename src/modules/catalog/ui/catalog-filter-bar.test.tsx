import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import type { CatalogFilters } from "../model";
import { CatalogFilterBar } from "./catalog-filter-bar";

const filters: CatalogFilters = {
  brands: [
    { id: 1, name: "APPLE" },
    { id: 2, name: "SAMSUNG" },
  ],
  categories: [
    {
      id: 1,
      name: "Mobile Devices",
      children: [
        { id: 2, name: "Smartphones" },
        { id: 3, name: "Tablets" },
      ],
    },
    { id: 9, name: "Computers", children: [{ id: 10, name: "Laptops" }] },
  ],
  conditions: ["Brand New", "Open Box"],
  locations: [{ id: 3, name: "Makati Store", city: "Makati" }],
  cities: ["Makati", "Taguig"],
};

function renderBar(
  query: Record<string, string | string[] | undefined> = {},
  total = 1528,
) {
  return render(
    <CatalogFilterBar filters={filters} query={query} total={total} />,
  );
}

function openMenu(name: string | RegExp) {
  fireEvent.click(screen.getByRole("button", { name }));
  return within(screen.getByRole("dialog"));
}

describe("CatalogFilterBar", () => {
  beforeAll(() => {
    // Radix measures the menu's position; jsdom has no ResizeObserver.
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  it("shows the result count and one chip per filter", () => {
    const { container } = renderBar();

    expect(
      container.querySelector('[data-slot="result-count"]'),
    ).toHaveTextContent("1,528 Results");
    for (const chip of [
      "Category",
      "Brand",
      "Condition",
      "Store or kiosk",
      "City",
    ]) {
      expect(screen.getByRole("button", { name: chip })).toBeVisible();
    }
  });

  it("uses the singular for one result", () => {
    const { container } = renderBar({}, 1);

    expect(
      container.querySelector('[data-slot="result-count"]'),
    ).toHaveTextContent(/^1 Result$/);
  });

  it("links options to the catalog, keeping other filters and leaving the page", () => {
    renderBar({ city: "Makati", page: "15" });

    expect(
      openMenu("Brand").getByRole("link", { name: "APPLE" }),
    ).toHaveAttribute("href", "/products?city=Makati&brand=1");
  });

  it("offers a way to clear just one filter", () => {
    renderBar({ brand: "1", city: "Makati", page: "2" });

    expect(
      openMenu(/^Brand/).getByRole("link", { name: "All brands" }),
    ).toHaveAttribute("href", "/products?city=Makati");
  });

  it("marks the current option in its menu", () => {
    renderBar({ brand: "1" });
    const menu = openMenu(/^Brand/);

    expect(menu.getByRole("link", { name: "APPLE" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(menu.getByRole("link", { name: "SAMSUNG" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("shows an active filter's value on its chip", () => {
    renderBar({ brand: "1", category: "2", condition: "Open Box" });

    expect(screen.getByRole("button", { name: "Brand: APPLE" })).toHaveTextContent(
      /^APPLE$/,
    );
    // Child categories resolve too, as links from the homepage use them.
    expect(
      screen.getByRole("button", { name: "Category: Smartphones" }),
    ).toHaveTextContent(/^Smartphones$/);
    expect(
      screen.getByRole("button", { name: "Condition: Open Box" }),
    ).toBeVisible();
  });

  it("shows the plain chip when a value no longer exists", () => {
    renderBar({ brand: "999" });

    expect(screen.getByRole("button", { name: "Brand" })).toHaveTextContent(
      /^Brand$/,
    );
  });

  it("searches long menus and says when nothing matches", () => {
    renderBar();
    const menu = openMenu("Brand");
    const search = menu.getByRole("searchbox", { name: "Search brands" });

    fireEvent.change(search, { target: { value: "sams" } });
    expect(menu.getByRole("link", { name: "SAMSUNG" })).toBeVisible();
    expect(menu.queryByRole("link", { name: "APPLE" })).not.toBeInTheDocument();

    fireEvent.change(search, { target: { value: "zzz" } });
    expect(menu.getByText("No brands match")).toBeVisible();
  });

  it("searches categories by their own name or their parent's", () => {
    renderBar();
    const menu = openMenu("Category");
    const search = menu.getByRole("searchbox", { name: "Search categories" });

    fireEvent.change(search, { target: { value: "smart" } });
    expect(menu.getByRole("link", { name: "Smartphones" })).toBeVisible();
    expect(menu.getByRole("link", { name: "Mobile Devices" })).toBeVisible();
    expect(menu.queryByRole("link", { name: "Tablets" })).not.toBeInTheDocument();
    expect(menu.queryByRole("link", { name: "Laptops" })).not.toBeInTheDocument();

    fireEvent.change(search, { target: { value: "mobile" } });
    expect(menu.getByRole("link", { name: "Tablets" })).toBeVisible();
  });

  it("only offers search on the long menus", () => {
    renderBar();

    expect(openMenu("City").queryByRole("searchbox")).not.toBeInTheDocument();
  });

  it("sorts from a menu that keeps filters and leaves the page", () => {
    renderBar({ brand: "1", page: "3" });
    const menu = openMenu(/^Sort/);

    expect(menu.getByRole("link", { name: "Newest" })).toHaveAttribute(
      "href",
      "/products?brand=1&sort=newest",
    );
    expect(menu.getByRole("link", { name: "Most relevant" })).toHaveAttribute(
      "href",
      "/products?brand=1",
    );
  });

  it("names the current sort on its button", () => {
    renderBar({ sort: "price_asc" });

    expect(screen.getByRole("button", { name: /^Sort/ })).toHaveTextContent(
      "Sort Price: low to high",
    );
  });

  it("only shows Clear all when something is filtered or searched", () => {
    const { unmount } = renderBar({ sort: "newest", page: "2" });
    expect(screen.queryByRole("link", { name: "Clear all" })).toBeNull();
    unmount();

    renderBar({ q: "iphone" });
    expect(screen.getByRole("link", { name: "Clear all" })).toHaveAttribute(
      "href",
      "/products",
    );
  });

  it("keeps active filters but not the page when searching", () => {
    const { container } = renderBar({
      q: "iphone",
      brand: "1",
      sort: "newest",
      page: "4",
    });
    const form = screen.getByRole("search");

    expect(form).toHaveAttribute("action", "/products");
    expect(screen.getByRole("searchbox", { name: "Search products" })).toHaveValue(
      "iphone",
    );
    const hidden = Object.fromEntries(
      [...container.querySelectorAll<HTMLInputElement>('input[type="hidden"]')].map(
        (input) => [input.name, input.value],
      ),
    );
    expect(hidden).toEqual({ brand: "1", sort: "newest" });
  });

  it("applies filters from their links, with no separate submit button", () => {
    renderBar();

    expect(screen.queryByText(/show products/i)).not.toBeInTheDocument();
  });
});
