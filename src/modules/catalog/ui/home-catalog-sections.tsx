import Link from "next/link";
import { ScrollRow } from "@/components/ui/scroll-row";
import { SectionHeading } from "@/components/ui/section-heading";
import type {
  HomeCatalogViewModel,
  HomeProductRow,
  StoreDirectoryViewModel,
} from "../model";
import { resolveHomeCategories } from "./home-categories";
import { ProductCard } from "./product-card";
import { ProductGrid } from "./product-grid";
import { StoreHighlights } from "./store-highlights";

function ProductRow({
  row,
  priority,
}: {
  row: HomeProductRow;
  priority: boolean;
}) {
  return (
    <section className="shell py-8 max-[680px]:py-6">
      <div className="mb-5 flex items-end justify-between gap-6">
        <SectionHeading title={row.title} />
        <Link
          className="shrink-0 text-sm font-semibold whitespace-nowrap text-primary hover:underline"
          href={row.href}
        >
          See all
          <span className="sr-only"> {row.title}</span>
        </Link>
      </div>
      {/* Two columns below 1100px, so four cards never leave one alone on a row. */}
      <div className="grid grid-cols-4 gap-4 max-[1100px]:grid-cols-2 max-[560px]:grid-cols-1">
        {row.products.map((product) => (
          <ProductCard key={product.id} product={product} priority={priority} />
        ))}
      </div>
    </section>
  );
}

export function HomeCatalogSections({
  catalog,
  stores,
}: {
  catalog: HomeCatalogViewModel;
  stores: StoreDirectoryViewModel | null;
}) {
  const homeCategories = resolveHomeCategories(catalog.filters.categories);
  const [firstRow, ...otherRows] = catalog.rows;

  return (
    <div className="pb-12 max-[680px]:pb-8">
      {homeCategories.length > 0 && (
        <section className="py-8 max-[680px]:py-6">
          <ScrollRow
            label="Categories"
            header={<SectionHeading title="Shop by category" />}
            itemClassName="w-[132px] max-[680px]:w-[104px]"
          >
            {homeCategories.map((category) => (
              <Link
                key={category.id}
                href={category.href}
                className="group flex w-full flex-col items-center gap-3 rounded-2xl text-center text-sm leading-tight font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <span className="grid aspect-square w-full place-items-center rounded-card bg-card shadow-(--shadow-sm) transition-shadow duration-200 group-hover:shadow-(--shadow)">
                  <category.icon
                    className="size-8 text-foreground transition-colors duration-200 group-hover:text-primary"
                    aria-hidden="true"
                  />
                </span>
                {category.name}
              </Link>
            ))}
          </ScrollRow>
        </section>
      )}

      {/* The hero's photos load first when it's showing. */}
      {firstRow ? (
        <ProductRow row={firstRow} priority={!catalog.newArrivals} />
      ) : catalog.newArrivals ? null : (
        <section className="shell py-8 max-[680px]:py-6">
          <ProductGrid products={[]} />
        </section>
      )}

      <StoreHighlights directory={stores} />

      {otherRows.map((row) => (
        <ProductRow row={row} priority={false} key={row.id} />
      ))}
    </div>
  );
}
