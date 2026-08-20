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
  imageUrl: string | null;
  cashPriceFrom: number | null;
  srpPrice: number | null;
  locations: CatalogLocation[];
}

export interface CatalogProductSummary {
  id: number;
  slug: string;
  name: string;
  brand: CatalogBrand;
  category: CatalogCategory;
  description: string | null;
  imageUrl: string | null;
  conditions: string[];
  cashPriceFrom: number | null;
  srpPrice: number | null;
  locations: CatalogLocation[];
  updatedAt: string | null;
}

export interface CatalogFilters {
  brands: CatalogBrand[];
  categories: Array<{ id: number; name: string; children: CatalogBrand[] }>;
  conditions: string[];
  locations: Array<{ id: number; name: string; city: string | null }>;
  cities: string[];
}

export interface CatalogSpecificationGroup {
  group: string;
  items: Array<{ key: string; label: string; value: string }>;
}

export interface CatalogProductDetail extends CatalogProductSummary {
  specifications: CatalogSpecificationGroup[];
  variants: CatalogVariant[];
}

export interface PaginationMeta {
  currentPage: number;
  perPage: number;
  total: number;
  lastPage: number;
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
  sort?: string;
  page?: string;
  perPage?: string;
}

export interface SiteBrandingLogo {
  url: string;
  name: string;
}

export interface SiteBrandingHero {
  url: string;
  name: string;
}

export interface SiteBranding {
  logo: SiteBrandingLogo | null;
  hero: SiteBrandingHero | null;
}

export interface SiteNavigation {
  categories: Array<{ id: number; name: string; children: CatalogBrand[] }>;
  brands: CatalogBrand[];
}

export interface StoreDirectoryViewModel {
  groups: Array<{ city: string; locations: CatalogLocation[] }>;
}

export type CatalogOutcome<T> =
  | { status: "ready"; data: T }
  | { status: "unavailable" };

export interface HomeCatalogViewModel {
  filters: CatalogFilters;
  products: CatalogProductSummary[];
}

export type RawSearchParams = Record<string, string | string[] | undefined>;

export interface BrowseCatalogViewModel {
  filters: CatalogFilters;
  products: CatalogProductSummary[];
  meta: PaginationMeta;
  range: { start: number; end: number; total: number };
  query: RawSearchParams;
}

export type ProductDetailViewModel = CatalogProductDetail;

export type ProductResolution =
  | { status: "ready"; data: ProductDetailViewModel }
  | { status: "not-found" }
  | { status: "redirect"; location: string }
  | { status: "unavailable" };

export interface SitemapProduct {
  path: string;
  lastModified: string | null;
}
