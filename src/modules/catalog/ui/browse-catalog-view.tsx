import { SectionHeading } from "@/components/ui/section-heading";
import type { BrowseCatalogViewModel } from "../model";
import { CatalogFilterBar } from "./catalog-filter-bar";
import { CatalogPagination } from "./catalog-pagination";
import { ProductGrid } from "./product-grid";

export function BrowseCatalogView({
  catalog,
}: {
  catalog: BrowseCatalogViewModel;
}) {
  return (
    <section className="py-14 max-[680px]:py-9">
      <div className="shell">
        <SectionHeading
          as="h1"
          title="Browse products."
          note="Live store availability."
          className="mb-8"
        />
        <CatalogFilterBar
          filters={catalog.filters}
          query={catalog.query}
          total={catalog.range.total}
        />
        <div className="mt-6">
          <ProductGrid products={catalog.products} />
          <CatalogPagination meta={catalog.meta} query={catalog.query} />
        </div>
      </div>
    </section>
  );
}
