import type { CatalogLocation } from "./types";

export function formatPeso(value: number | null): string {
  if (value === null) {
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
