import type { CatalogProductSummary, NewArrivals } from "./model";

/**
 * The homepage category tiles minus Accessories (ui/home-categories.ts), which
 * can feature on the homepage. A test keeps the two lists in step.
 */
export const MAIN_DEVICE_CATEGORY_IDS: ReadonlySet<number> = new Set([
  2, 3, 4, 9, 18, 23, 30,
]);

// Sit under a main device tile, but aren't devices: Wearable Accessories,
// Computer Components, Office Furniture, Gaming Accessories, Projector Screens.
const EXCLUDED_CATEGORY_IDS: ReadonlySet<number> = new Set([
  8, 14, 17, 22, 29,
]);

const BRAND_NEW = "Brand New";

function isMainDevice({ category }: CatalogProductSummary): boolean {
  if (EXCLUDED_CATEGORY_IDS.has(category.id)) return false;

  return (
    MAIN_DEVICE_CATEGORY_IDS.has(category.id) ||
    (category.parent ? MAIN_DEVICE_CATEGORY_IDS.has(category.parent.id) : false)
  );
}

function canFeature(product: CatalogProductSummary): boolean {
  return (
    isMainDevice(product) &&
    Boolean(product.imageUrl) &&
    // A zero price is placeholder data, never a real offer.
    product.cashPriceFrom !== null &&
    product.cashPriceFrom > 0
  );
}

/**
 * Splits the newest products into the hero and the row below it. The hero needs
 * two Brand New products or it isn't shown at all, and a product it doesn't use
 * stays available to the row.
 */
export function selectHomeProducts(newest: CatalogProductSummary[]): {
  newArrivals: NewArrivals | null;
  recentlyAvailable: CatalogProductSummary[];
} {
  const featurable = newest.filter(canFeature);
  const [first, second] = featurable.filter((product) =>
    product.conditions.includes(BRAND_NEW),
  );

  if (!first || !second) {
    return { newArrivals: null, recentlyAvailable: featurable };
  }

  return {
    newArrivals: [first, second],
    recentlyAvailable: featurable.filter(
      (product) => product !== first && product !== second,
    ),
  };
}
