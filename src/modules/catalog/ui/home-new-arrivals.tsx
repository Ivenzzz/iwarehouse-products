import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import type { CatalogProductSummary, NewArrivals } from "../model";
import { formatPeso, productPath } from "../presentation";
import { ProductPhoto } from "./product-photo";

function NewArrivalCard({ product }: { product: CatalogProductSummary }) {
  return (
    <Card className="relative h-full w-full gap-0 overflow-hidden py-0 transition-shadow duration-200 hover:shadow-(--shadow)">
      {/* Square with no padding, so a photo with its own background fills it. */}
      <div className="relative aspect-square bg-white">
        <ProductPhoto
          src={product.imageUrl}
          alt=""
          brand={product.brand.name}
          width={480}
          height={480}
          sizes="(max-width: 860px) 50vw, 240px"
          priority
        />
      </div>
      <CardContent className="flex flex-1 flex-col px-3.5 pt-3 pb-3.5">
        <h3 className="m-0 line-clamp-2 min-h-[2.6em] text-sm leading-[1.3] font-bold tracking-[-0.01em] [overflow-wrap:anywhere]">
          {product.name}
        </h3>
        <p className="mt-auto mb-0 flex flex-wrap items-baseline gap-x-1.5 pt-2">
          <small className="text-xs text-muted-foreground">From</small>
          <strong className="text-lg font-bold tracking-[-0.02em]">
            {formatPeso(product.cashPriceFrom)}
          </strong>
        </p>
      </CardContent>
      <Link
        className="absolute inset-0 rounded-card focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring"
        href={productPath(product)}
        // See the note in product-card.tsx: prefetching blanks the tab title.
        prefetch={false}
        aria-label={`View ${product.name}`}
      />
    </Card>
  );
}

export function HomeNewArrivals({ products }: { products: NewArrivals }) {
  return (
    <section className="max-[860px]:max-w-[440px]">
      <div className="mb-4 flex items-end justify-between gap-6">
        <SectionHeading title="New arrivals" />
        <Link
          className="shrink-0 text-sm font-semibold whitespace-nowrap text-primary hover:underline"
          href="/products?sort=newest"
        >
          See all
          <span className="sr-only"> new arrivals</span>
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {products.map((product) => (
          <NewArrivalCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
