import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  CatalogLocation,
  CatalogProductDetail,
  CatalogVariant,
} from "../model";
import { VariantBrowser } from "./variant-browser";

const urlParams = vi.hoisted(() => ({ current: new URLSearchParams() }));

vi.mock("next/navigation", () => ({
  useSearchParams: () => urlParams.current,
}));

function store(id: number, name: string): CatalogLocation {
  return {
    id,
    name,
    type: "store",
    address: `${name} address`,
    city: "Bacolod",
    phone: null,
    latitude: null,
    longitude: null,
  };
}

const bacolod = store(1, "Bacolod Store");
const iloilo = store(2, "Iloilo Store");

function variant(
  id: number,
  color: string | null,
  rom: string,
  price: number | null,
  overrides: Partial<CatalogVariant> = {},
): CatalogVariant {
  return {
    id,
    name: `Variant ${id}`,
    condition: "Brand New",
    attributes: [
      { key: "color", label: "Color", value: color },
      { key: "ram", label: "RAM", value: "12GB" },
      { key: "rom", label: "ROM", value: rom },
    ],
    imageUrl: null,
    cashPriceFrom: price,
    srpPrice: null,
    locations: [bacolod],
    ...overrides,
  };
}

function product(
  variants: CatalogVariant[],
  overrides: Partial<CatalogProductDetail> = {},
): CatalogProductDetail {
  return {
    id: 17,
    slug: "apple-iphone",
    name: "APPLE IPHONE 18 PRO MAX",
    brand: { id: 1, name: "Apple" },
    category: { id: 2, name: "Smartphones" },
    description: null,
    imageUrl: null,
    conditions: ["Brand New"],
    options: { colors: [], configurations: [] },
    cashPriceFrom: null,
    srpPrice: null,
    locations: [],
    updatedAt: null,
    specifications: [],
    variants,
    ...overrides,
  };
}

const phones = [
  variant(4, "Glacier", "1TB", 130000, { locations: [iloilo] }),
  variant(3, "Black", "512GB", 110000, { locations: [bacolod, iloilo] }),
  variant(2, "Silver", "256GB", 100000),
  variant(1, "Black", "256GB", 99990),
];

function radio(name: string) {
  return screen.getByRole("radio", { name });
}

describe("VariantBrowser", () => {
  beforeEach(() => {
    urlParams.current = new URLSearchParams();
    window.history.replaceState(null, "", "/products/17-apple-iphone");
  });

  it("opens on the cheapest variant, with shared specs instead of a choice", () => {
    render(<VariantBrowser product={product(phones)} />);

    expect(screen.getByText("₱99,990")).toBeInTheDocument();
    expect(radio("Black")).toBeChecked();
    expect(radio("256GB")).toBeChecked();
    expect(screen.getByText("12GB RAM")).toBeInTheDocument();
    expect(screen.getByText("Brand New")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Black, 256GB is at 1 location" }),
    ).toBeInTheDocument();
  });

  it("opens on the variant in the URL", () => {
    urlParams.current = new URLSearchParams("variant=3");

    render(<VariantBrowser product={product(phones)} />);

    expect(screen.getByText("₱110,000")).toBeInTheDocument();
    expect(radio("512GB")).toBeChecked();
  });

  it("updates price, stores, URL and the announcement when choosing", () => {
    const replaceState = vi.spyOn(window.history, "replaceState");
    render(<VariantBrowser product={product(phones)} />);

    fireEvent.click(radio("512GB"));

    expect(screen.getByText("₱110,000")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Black, 512GB is at 2 locations" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Iloilo Store")).toBeInTheDocument();
    expect(replaceState).toHaveBeenCalledWith(null, "", "?variant=3");
    expect(screen.getByRole("status")).toHaveTextContent(
      "₱110,000. 2 locations.",
    );

    replaceState.mockRestore();
  });

  it("keeps other query parameters in the URL", () => {
    window.history.replaceState(null, "", "?utm_source=messenger");
    const replaceState = vi.spyOn(window.history, "replaceState");
    render(<VariantBrowser product={product(phones)} />);

    fireEvent.click(radio("512GB"));

    expect(replaceState).toHaveBeenCalledWith(
      null,
      "",
      "?utm_source=messenger&variant=3",
    );

    replaceState.mockRestore();
  });

  it("marks and explains a value that isn't in the selected color", () => {
    render(<VariantBrowser product={product(phones)} />);

    fireEvent.click(radio("1TB (not in stock with your other choices)"));

    const note = "1TB is only in stock in Glacier.";
    expect(radio("Glacier")).toBeChecked();
    expect(radio("1TB")).toBeChecked();
    expect(screen.getByText(note, { selector: "p:not([role])" })).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent(
      `${note} ₱130,000. 1 location.`,
    );
  });

  it("clears the note on the next choice that switches nothing", () => {
    render(<VariantBrowser product={product(phones)} />);

    fireEvent.click(radio("1TB (not in stock with your other choices)"));
    fireEvent.click(radio("Black (not in stock with your other choices)"));
    fireEvent.click(radio("512GB"));

    expect(
      screen.queryByText("1TB is only in stock in Glacier."),
    ).not.toBeInTheDocument();
  });

  it("shows the color's own photo", () => {
    render(
      <VariantBrowser
        product={product([
          variant(1, "Black", "256GB", 100, { imageUrl: "/black.png" }),
          variant(2, "Silver", "256GB", 200, { imageUrl: "/silver.png" }),
        ])}
      />,
    );

    expect(screen.getByRole("img")).toHaveAttribute("src", "/black.png");

    fireEvent.click(radio("Silver"));

    expect(screen.getByRole("img")).toHaveAttribute("src", "/silver.png");
  });

  it("never shows another color's photo for a color without one", () => {
    const { container } = render(
      <VariantBrowser
        product={product(
          [
            variant(1, "Burgundy", "256GB", 100),
            variant(2, "Black", "256GB", 200, { imageUrl: "/black.png" }),
          ],
          { imageUrl: "/black.png" },
        )}
      />,
    );

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(
      container.querySelector('[data-slot="variant-tile"]'),
    ).toHaveTextContent("AppleBurgundy");
  });

  it("uses the product photo when no variant has a color", () => {
    render(
      <VariantBrowser
        product={product(
          [
            {
              ...variant(1, null, "256GB", 100),
              attributes: [{ key: "rom", label: "ROM", value: "256GB" }],
            },
          ],
          { imageUrl: "/product.png" },
        )}
      />,
    );

    expect(screen.getByRole("img")).toHaveAttribute("src", "/product.png");
  });

  it("shows no controls for a single variant", () => {
    render(
      <VariantBrowser product={product([variant(1, "Black", "256GB", 100)])} />,
    );

    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(screen.getByText("Black, 12GB RAM, 256GB storage")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Available at 1 location" }),
    ).toBeInTheDocument();
  });

  it("hides the brand line only when the name already includes the brand", () => {
    const { rerender } = render(
      <VariantBrowser product={product(phones)} />,
    );

    expect(screen.queryByText("Apple", { selector: ".eyebrow" })).toBeNull();

    rerender(
      <VariantBrowser product={product(phones, { name: "Galaxy S26" })} />,
    );

    expect(screen.getByText("Apple", { selector: ".eyebrow" })).toBeVisible();
  });

  it("uses the contact-store wording for an unpriced variant", () => {
    render(
      <VariantBrowser product={product([variant(1, "Black", "256GB", null)])} />,
    );

    expect(screen.getByText("Price")).toBeInTheDocument();
    expect(screen.getByText("Contact store for price")).toBeInTheDocument();
  });

  it("points to the stores page when a variant has no listed location", () => {
    render(
      <VariantBrowser
        product={product([variant(1, "Black", "256GB", 100, { locations: [] })])}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Not listed at any location" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Contact a store" }),
    ).toHaveAttribute("href", "/stores");
  });
});
