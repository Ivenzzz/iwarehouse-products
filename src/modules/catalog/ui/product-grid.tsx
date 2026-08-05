import { SearchX } from "lucide-react";
import type { CatalogProductSummary } from "../model";
import { ProductCard } from "./product-card";

export function ProductGrid({ products }: { products: CatalogProductSummary[] }) {
  if (products.length === 0) {
    return (
      <div className="grid min-h-[380px] place-items-center content-center rounded-[17px] border border-dashed border-[var(--warm-300)] bg-white px-5 py-[55px] text-center">
        <span className="mb-[18px] grid h-[60px] min-w-[60px] place-items-center rounded-full bg-[var(--brand-50)] text-2xl font-extrabold text-primary">
          <SearchX className="size-6" aria-hidden="true" />
        </span>
        <h2 className="m-0 text-foreground">No available products found</h2>
        <p className="mx-auto mt-2.5 mb-[22px] max-w-[500px] text-[0.85rem] leading-[1.7] text-muted-foreground">
          Try removing a filter or searching with a broader product name.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-5 max-[980px]:grid-cols-2 max-[680px]:grid-cols-1">
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} priority={index < 3} />
      ))}
    </div>
  );
}
