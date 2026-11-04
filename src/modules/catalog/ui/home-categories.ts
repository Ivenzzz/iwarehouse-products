import type { LucideIcon } from "lucide-react";
import {
  Cable,
  Camera,
  Gamepad2,
  Headphones,
  Laptop,
  Smartphone,
  Tablet,
  Watch,
} from "lucide-react";
import type { CatalogFilters } from "../model";

interface HomeCategoryEntry {
  id: number;
  name: string;
  icon: LucideIcon;
}

export interface ResolvedHomeCategory extends HomeCategoryEntry {
  href: string;
}

// Display names are curated for the storefront; ids must exist in the live
// ERP filters or the tile is hidden. An id may point at a parent or a leaf
// child — whichever makes the better storefront aisle.
const HOME_CATEGORIES: HomeCategoryEntry[] = [
  { id: 2, name: "Smartphones", icon: Smartphone },
  { id: 9, name: "Laptops & Computers", icon: Laptop },
  { id: 3, name: "Tablets", icon: Tablet },
  { id: 18, name: "Gaming", icon: Gamepad2 },
  { id: 23, name: "TV & Audio", icon: Headphones },
  { id: 35, name: "Accessories", icon: Cable },
  { id: 30, name: "Cameras & Drones", icon: Camera },
  { id: 4, name: "Wearables", icon: Watch },
];

const categoryHref = (id: number) => `/products?category=${id}`;

function liveCategoryIds(
  categories: CatalogFilters["categories"],
): Set<number> {
  const ids = new Set<number>();
  for (const parent of categories) {
    ids.add(parent.id);
    for (const child of parent.children) {
      ids.add(child.id);
    }
  }
  return ids;
}

export function resolveHomeCategories(
  categories: CatalogFilters["categories"],
): ResolvedHomeCategory[] {
  const live = liveCategoryIds(categories);
  return HOME_CATEGORIES.filter((entry) => live.has(entry.id)).map(
    (entry) => ({
      ...entry,
      href: categoryHref(entry.id),
    }),
  );
}
