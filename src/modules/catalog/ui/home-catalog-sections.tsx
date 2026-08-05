import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { HomeCatalogViewModel } from "../model";
import { CategoryIcon } from "./category-icon";
import { ProductGrid } from "./product-grid";

const CATEGORY_TONES = [
  "bg-[var(--tint-1-bg)] text-[var(--tint-1-fg)]",
  "bg-[var(--tint-2-bg)] text-[var(--tint-2-fg)]",
  "bg-[var(--tint-3-bg)] text-[var(--tint-3-fg)]",
  "bg-[var(--tint-4-bg)] text-[var(--tint-4-fg)]",
] as const;

export function HomeCatalogSections({
  catalog,
}: {
  catalog: HomeCatalogViewModel;
}) {
  return (
    <>
      <section className="py-[78px] max-[680px]:py-[55px]">
        <div className="shell">
          <div className="mb-[30px] flex items-end justify-between gap-6 max-[680px]:flex-col max-[680px]:items-start">
            <div>
              <p className="eyebrow">Browse your way</p>
              <h2 className="m-0 text-[clamp(1.8rem,3vw,2.65rem)] tracking-[-0.05em] text-foreground">
                Shop by category
              </h2>
            </div>
            <Link
              className="inline-flex shrink-0 items-center gap-1.5 text-[0.8rem] font-extrabold whitespace-nowrap text-primary [&_svg]:size-[14px]"
              href="/products"
            >
              View all products <ArrowRight aria-hidden="true" />
            </Link>
          </div>
          <div className="grid grid-cols-4 gap-4 max-[980px]:grid-cols-2">
            {catalog.filters.categories.slice(0, 6).map((category, index) => (
              <Card
                key={category.id}
                className="min-h-40 justify-start gap-0 p-6 transition-all duration-200 hover:-translate-y-0.75 hover:shadow-(--shadow) hover:ring-brand/40 max-[680px]:min-h-[145px] max-[680px]:p-[18px]"
              >
                <Link
                  href={`/products?category=${category.id}`}
                  className="flex flex-1 flex-col"
                >
                  <span
                    className={`mb-auto grid size-[43px] place-items-center rounded-[10px] text-[1.3rem] ${CATEGORY_TONES[index % CATEGORY_TONES.length]}`}
                  >
                    <CategoryIcon name={category.name} className="size-5" />
                  </span>
                  <strong className="mt-4.5 text-[0.92rem]">
                    {category.name}
                  </strong>
                  <small className="mt-1.5 min-h-4 truncate text-[0.67rem] text-muted-foreground">
                    {category.children
                      .map((child) => child.name)
                      .slice(0, 2)
                      .join(" · ")}
                  </small>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-(--canvas) py-[78px] max-[680px]:py-[55px]">
        <div className="shell">
          <div className="mb-[30px] flex items-end justify-between gap-6 max-[680px]:flex-col max-[680px]:items-start">
            <div>
              <p className="eyebrow">Fresh in store</p>
              <h2 className="m-0 text-[clamp(1.8rem,3vw,2.65rem)] tracking-[-0.05em] text-foreground">
                Recently available
              </h2>
            </div>
            <Link
              className="inline-flex shrink-0 items-center gap-1.5 text-[0.8rem] font-extrabold whitespace-nowrap text-primary [&_svg]:size-[14px]"
              href="/products?sort=newest"
            >
              Explore everything <ArrowRight aria-hidden="true" />
            </Link>
          </div>
          <ProductGrid products={catalog.products} />
        </div>
      </section>
    </>
  );
}
