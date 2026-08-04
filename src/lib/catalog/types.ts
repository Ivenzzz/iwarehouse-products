export interface CatalogBrand {
  id: number;
  name: string;
}

export interface CatalogCategory {
  id: number;
  name: string;
  parent?: CatalogBrand | null;
}

export interface CatalogLocation {
  id: number;
  name: string;
  type: "store" | "kiosk";
  address: string;
  city: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface CatalogAttribute {
  key: string;
  label: string;
  value: string | null;
}

export interface CatalogVariant {
  id: number;
  name: string;
  condition: string;
  attributes: CatalogAttribute[];
  image_url: string | null;
  cash_price_from: number | null;
  srp_price: number | null;
  locations: CatalogLocation[];
}

export interface CatalogProductSummary {
  id: number;
  slug: string;
  name: string;
  brand: CatalogBrand;
  category: CatalogCategory;
  description: string | null;
  image_url: string | null;
  conditions: string[];
  cash_price_from: number | null;
  srp_price: number | null;
  locations: CatalogLocation[];
  updated_at: string | null;
}

export interface CatalogSpecificationGroup {
  group: string;
  items: Array<{ key: string; label: string; value: string }>;
}

export interface CatalogProductDetail extends CatalogProductSummary {
  specifications: CatalogSpecificationGroup[];
  variants: CatalogVariant[];
}

export interface CatalogFilters {
  brands: CatalogBrand[];
  categories: Array<{ id: number; name: string; children: CatalogBrand[] }>;
  conditions: string[];
  locations: Array<{ id: number; name: string; city: string | null }>;
  cities: string[];
}

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface PaginatedProducts {
  data: CatalogProductSummary[];
  meta: PaginationMeta;
}

export interface CatalogQuery {
  q?: string;
  brand?: string;
  category?: string;
  condition?: string;
  location?: string;
  city?: string;
  sort?: "relevance" | "newest" | "price_asc" | "price_desc";
  page?: string;
  per_page?: string;
}
