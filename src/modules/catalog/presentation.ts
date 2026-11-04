import type {
  CatalogLocation,
  CatalogMemoryConfiguration,
  StoreDirectoryViewModel,
} from "./model";

export const UNKNOWN_SWATCH_COLOR = "#c9c9c2";

// The ERP stores color names only, often marketing ones like "SILVER DANCER",
// so swatches are an approximation from the color word in the name.
const SWATCH_COLORS: Record<string, string> = {
  black: "#1c1c1a",
  midnight: "#1f2933",
  graphite: "#3f4044",
  gray: "#8a8a8f",
  grey: "#8a8a8f",
  titanium: "#a8a39a",
  silver: "#d4d4d6",
  white: "#f7f7f5",
  starlight: "#f2eadb",
  cream: "#f3ead7",
  beige: "#dcc9a9",
  gold: "#d4b26a",
  champagne: "#e3d0ac",
  bronze: "#a0713f",
  brown: "#7a5236",
  copper: "#b5714a",
  orange: "#f08a2c",
  coral: "#f28472",
  yellow: "#f2d04b",
  red: "#c8322d",
  burgundy: "#6d1f2f",
  rose: "#e8b4b8",
  pink: "#f0a8c0",
  purple: "#7b5ea7",
  violet: "#7b5ea7",
  lavender: "#b9a8d9",
  lilac: "#c3aedc",
  blue: "#3f7cc4",
  navy: "#1f3358",
  cyan: "#4cb8c9",
  teal: "#2d8a8a",
  mint: "#a5d9c0",
  green: "#3f8a5f",
  olive: "#6b6f3a",
};

/** A marketing name's color word usually comes last, as in "Ice Blue". */
export function swatchColor(name: string): string {
  const words = name.toLowerCase().split(/[^a-z]+/).reverse();
  const match = words.find((word) => word in SWATCH_COLORS);

  return match ? SWATCH_COLORS[match] : UNKNOWN_SWATCH_COLOR;
}

const SIZE_UNITS: Record<string, number> = { MB: 1 / 1024, GB: 1, TB: 1024 };

function sizeInGb(value: string | null): number | null {
  const match = value?.trim().match(/^([\d.]+)\s*(MB|GB|TB)$/i);
  return match ? Number(match[1]) * SIZE_UNITS[match[2].toUpperCase()] : null;
}

/** Labels like "8GB/256GB", smallest storage first. Unreadable sizes go last. */
export function memoryLabels(
  configurations: CatalogMemoryConfiguration[],
): string[] {
  const sortKey = ({ ram, rom }: CatalogMemoryConfiguration) => [
    (rom ? sizeInGb(rom) : sizeInGb(ram)) ?? Number.POSITIVE_INFINITY,
    sizeInGb(ram) ?? 0,
  ];
  const sorted = [...configurations].sort((a, b) => {
    const [aPrimary, aRam] = sortKey(a);
    const [bPrimary, bRam] = sortKey(b);
    return aPrimary === bPrimary ? aRam - bRam : aPrimary - bPrimary;
  });

  return [
    ...new Set(
      sorted.flatMap(({ ram, rom }) => {
        const label = [ram, rom].filter(Boolean).join("/");
        return label ? [label] : [];
      }),
    ),
  ];
}

/** The phone number customers reach first: the first store that lists one. */
export function firstStorePhone(
  directory: StoreDirectoryViewModel,
): string | null {
  return (
    directory.groups
      .flatMap((group) => group.locations)
      .find((location) => location.phone)?.phone ?? null
  );
}

export function formatPeso(value: number | null): string {
  // A zero price is placeholder data, never a real offer — treat it as unpriced.
  if (value === null || value <= 0) {
    return "Contact store for price";
  }

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function productPath(product: { id: number; slug: string }): string {
  return `/products/${product.id}-${product.slug}`;
}

export function directionsUrl(
  location: Pick<CatalogLocation, "latitude" | "longitude" | "address">,
): string {
  const query =
    location.latitude !== null && location.longitude !== null
      ? `${location.latitude},${location.longitude}`
      : location.address;

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function joinQuery(
  current: Record<string, string | string[] | undefined>,
  updates: Record<string, string | number | undefined>,
): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(current)) {
    const normalized = Array.isArray(value) ? value[0] : value;
    if (normalized) params.set(key, normalized);
  }
  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined || value === "") params.delete(key);
    else params.set(key, String(value));
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}
