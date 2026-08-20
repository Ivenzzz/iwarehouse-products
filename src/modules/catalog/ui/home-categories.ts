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
  tagline: string;
  icon: LucideIcon;
}

export interface ResolvedHomeCategory {
  id: number;
  name: string;
  tagline: string;
  icon: LucideIcon;
  href: string;
  imageUrl: string | null;
}

// Display names and taglines are curated for the storefront; ids must exist
// in the live ERP filters or the card is hidden. An id may point at a parent
// or a leaf child — whichever makes the better storefront aisle.
const HOME_CATEGORIES: HomeCategoryEntry[] = [
  {
    id: 2,
    name: "Smartphones",
    tagline: "Latest phones and smart devices.",
    icon: Smartphone,
  },
  {
    id: 9,
    name: "Laptops & Computers",
    tagline: "Powerful laptops and essential gear.",
    icon: Laptop,
  },
  {
    id: 3,
    name: "Tablets",
    tagline: "Portable power for work and play.",
    icon: Tablet,
  },
  {
    id: 18,
    name: "Gaming",
    tagline: "Level up your gaming setup.",
    icon: Gamepad2,
  },
  {
    id: 23,
    name: "TV & Audio",
    tagline: "Sound that moves with you.",
    icon: Headphones,
  },
  {
    id: 35,
    name: "Accessories",
    tagline: "Cables, chargers and everyday essentials.",
    icon: Cable,
  },
  {
    id: 30,
    name: "Cameras & Drones",
    tagline: "Capture every moment clearly.",
    icon: Camera,
  },
  {
    id: 4,
    name: "Wearables",
    tagline: "Watches and bands that keep up.",
    icon: Watch,
  },
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

/** Ids of the curated cards present in live data, in display order. */
export function homeCategoryIds(
  categories: CatalogFilters["categories"],
): number[] {
  const live = liveCategoryIds(categories);
  return HOME_CATEGORIES.filter((entry) => live.has(entry.id)).map(
    (entry) => entry.id,
  );
}

export function resolveHomeCategories(
  categories: CatalogFilters["categories"],
  images: Record<number, string | null> = {},
): ResolvedHomeCategory[] {
  const live = liveCategoryIds(categories);
  return HOME_CATEGORIES.filter((entry) => live.has(entry.id)).map(
    (entry) => ({
      ...entry,
      href: categoryHref(entry.id),
      imageUrl: images[entry.id] ?? null,
    }),
  );
}
