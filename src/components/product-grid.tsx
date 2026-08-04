import type { CatalogProductSummary } from "@/lib/catalog/types";
import { ProductCard } from "./product-card";

export function ProductGrid({ products }: { products: CatalogProductSummary[] }) {
  if (products.length === 0) {
    return (
      <div className="empty-state">
        <span aria-hidden="true">⌕</span>
        <h2>No available products found</h2>
        <p>Try removing a filter or searching with a broader product name.</p>
      </div>
    );
  }

  return (
    <div className="product-grid">
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} priority={index < 3} />
      ))}
    </div>
  );
}
