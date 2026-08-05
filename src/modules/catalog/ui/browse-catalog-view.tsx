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
    <section className="bg-(--canvas) py-[78px] max-[680px]:py-[55px]">
      <div className="shell">
        <div className="mb-[34px] flex items-end justify-between gap-5 max-[680px]:flex-col max-[680px]:items-start">
          <div>
            <p className="eyebrow">Available now</p>
            <h1 className="m-0 text-[clamp(1.8rem,3vw,2.65rem)] tracking-[-0.05em] text-foreground">
              Browse products
            </h1>
            <p className="mt-[9px] mb-0 text-muted-foreground">
              Explore live availability across our stores and kiosks.
            </p>
          </div>
          <span className="text-[0.74rem] font-bold text-muted-foreground">
            Showing {catalog.range.start}–{catalog.range.end} of{" "}
            {catalog.range.total}
          </span>
        </div>
        <div className="grid grid-cols-[245px_minmax(0,1fr)] items-start gap-7 max-[980px]:grid-cols-1">
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
