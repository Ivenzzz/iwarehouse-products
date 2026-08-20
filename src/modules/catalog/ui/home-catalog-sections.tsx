import { ArrowRight, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { HomeCatalogViewModel } from "../model";
import { resolveHomeCategories } from "./home-categories";
import { ProductGrid } from "./product-grid";

export function HomeCatalogSections({
  catalog,
}: {
  catalog: HomeCatalogViewModel;
}) {
  const homeCategories = resolveHomeCategories(
    catalog.filters.categories,
    catalog.categoryImages,
  );

  return (
    <>
      {homeCategories.length > 0 && (
        <section className="py-[78px] max-[680px]:py-[55px]">
          <div className="shell">
            <div className="mb-[30px]">
              <p className="eyebrow">
                <span
                  aria-hidden="true"
                  className="mr-2 inline-block size-1.5 -translate-y-px rounded-full bg-brand"
                />
                Browse your way
              </p>
              <h2 className="m-0 text-[clamp(1.8rem,3vw,2.65rem)] tracking-[-0.05em] text-foreground">
                Shop <span className="text-brand">by</span> category
              </h2>
            </div>
            <div className="grid grid-cols-4 gap-4 max-[980px]:grid-cols-2 max-[680px]:grid-cols-1">
              {homeCategories.map((category) => (
                <Card
                  key={category.id}
                  className="relative min-h-49 flex-row gap-0 py-0 transition-all duration-200 hover:-translate-y-1 hover:shadow-(--shadow) hover:ring-brand/40 max-[680px]:min-h-41"
                >
                  <div className="flex flex-1 flex-col p-6 max-[680px]:p-[18px]">
                    <category.icon
                      className="size-6 text-brand"
                      aria-hidden="true"
                    />
                    <Link
                      href={category.href}
                      className="mt-4 self-start text-[1.02rem] leading-snug font-extrabold tracking-[-0.03em] text-foreground after:absolute after:inset-0 after:rounded-xl after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-offset-2"
                    >
                      {category.name}
                    </Link>
                    <p className="m-0 mt-1.5 mb-4 text-[0.75rem] leading-relaxed text-muted-foreground">
                      {category.tagline}
                    </p>
                    <span
                      aria-hidden="true"
                      className="mt-auto grid size-9 place-items-center rounded-full bg-card text-brand shadow-(--shadow-sm) ring-1 ring-foreground/10 transition-colors duration-200 group-hover/card:bg-brand group-hover/card:text-white"
                    >
                      <ChevronRight className="size-4" />
                    </span>
                  </div>
                  <div className="flex w-[44%] shrink-0 items-center justify-center py-4 pr-5">
                    <Image
                      src={category.imageUrl ?? "/product-placeholder.svg"}
                      alt=""
                      width={280}
                      height={280}
                      sizes="(max-width: 680px) 44vw, (max-width: 980px) 22vw, 180px"
                      unoptimized
                      className="h-auto max-h-37.5 w-full object-contain transition-transform duration-300 group-hover/card:scale-105"
                    />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

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
