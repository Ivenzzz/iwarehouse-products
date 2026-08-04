import type { Metadata } from "next";
import { CatalogFilterForm } from "@/components/catalog-filters";
import { CatalogUnavailable } from "@/components/catalog-unavailable";
import { Pagination } from "@/components/pagination";
import { ProductGrid } from "@/components/product-grid";
import { getFilters, getProducts } from "@/lib/catalog/client";
import type { CatalogQuery } from "@/lib/catalog/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Browse products",
  description: "Search products currently available at iWarehouse stores and kiosks.",
};

type SearchParams = Record<string, string | string[] | undefined>;

function queryFrom(params: SearchParams): CatalogQuery {
  const value = (key: string) => {
    const candidate = params[key];
    return Array.isArray(candidate) ? candidate[0] : candidate;
  };

  return {
    q: value("q"),
    brand: value("brand"),
    category: value("category"),
    condition: value("condition"),
    location: value("location"),
    city: value("city"),
    sort: value("sort") as CatalogQuery["sort"],
    page: value("page"),
    per_page: "24",
  };
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const catalog = await Promise.all([getFilters(), getProducts(queryFrom(params))]).catch(() => null);

  if (catalog === null) {
    return (
      <section className="page-section shell">
        <CatalogUnavailable />
      </section>
    );
  }

  const [filters, products] = catalog;
  const start =
    products.meta.total === 0 ? 0 : (products.meta.current_page - 1) * products.meta.per_page + 1;
  const end = Math.min(products.meta.current_page * products.meta.per_page, products.meta.total);

  return (
    <section className="catalog-page">
      <div className="shell">
        <div className="catalog-title">
          <div>
            <p className="eyebrow">Available now</p>
            <h1>Browse products</h1>
            <p>Explore live availability across our stores and kiosks.</p>
          </div>
          <span>
            Showing {start}–{end} of {products.meta.total}
          </span>
        </div>
        <div className="catalog-layout">
          <aside>
            <CatalogFilterForm filters={filters} query={params} />
          </aside>
          <div>
            <ProductGrid products={products.data} />
            <Pagination meta={products.meta} query={params} />
          </div>
        </div>
      </div>
    </section>
  );
}
