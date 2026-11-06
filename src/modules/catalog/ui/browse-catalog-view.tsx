import { SectionHeading } from "@/components/ui/section-heading";
import type { BrowseCatalogViewModel } from "../model";
import { CatalogFilterBar } from "./catalog-filter-bar";
import { CatalogPagination } from "./catalog-pagination";
import { PageBreadcrumb } from "./page-breadcrumb";
import { ProductGrid } from "./product-grid";

export function BrowseCatalogView({
  catalog,
}: {
  catalog: BrowseCatalogViewModel;
}) {
  return (
    <section className="pt-10 pb-14 max-[680px]:pt-6 max-[680px]:pb-9">
      <div className="shell">
        <PageBreadcrumb current="Products" />
        <SectionHeading
          as="h1"
          title="Explore iWarehouse Products"
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
