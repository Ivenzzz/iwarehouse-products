import { SectionHeading } from "@/components/ui/section-heading";
import type { BrowseCatalogViewModel } from "../model";
import { CatalogFilterForm } from "./catalog-filters";
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
        <div className="mb-8 flex items-end justify-between gap-5 max-[680px]:flex-col max-[680px]:items-start max-[680px]:gap-3">
          <SectionHeading
            as="h1"
            title="Browse products."
            note="Live store availability."
          />
          <span className="shrink-0 text-sm text-muted-foreground">
            Showing {catalog.range.start}–{catalog.range.end} of{" "}
            {catalog.range.total}
          </span>
        </div>
        <div className="grid grid-cols-[260px_minmax(0,1fr)] items-start gap-6 max-[980px]:grid-cols-1">
          <aside>
            <CatalogFilterForm
              filters={catalog.filters}
              query={catalog.query}
            />
          </aside>
          <div>
            <ProductGrid products={catalog.products} />
            <CatalogPagination
              meta={catalog.meta}
              query={catalog.query}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
