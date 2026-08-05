import type {
  CatalogFilters,
  CatalogProductDetail,
  CatalogQuery,
  PaginatedProducts,
} from "./model";

export class CatalogSourceError extends Error {
  constructor(
    public readonly kind: "not-found" | "unavailable",
    message = "The product catalog is temporarily unavailable.",
  ) {
    super(message);
    this.name = "CatalogSourceError";
  }
}

export interface CatalogSource {
  getProducts(query: CatalogQuery): Promise<PaginatedProducts>;
  getProduct(id: number): Promise<CatalogProductDetail | null>;
  getFilters(): Promise<CatalogFilters>;
}
