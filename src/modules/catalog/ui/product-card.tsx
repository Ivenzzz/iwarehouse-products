import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { CatalogProductSummary } from "../model";
import {
  formatPeso,
  memoryLabels,
  productPath,
  swatchColor,
} from "../presentation";
import { ProductPhoto } from "./product-photo";

const MAX_SWATCHES = 5;
const MAX_MEMORY_PILLS = 2;

function MoreCount({ count }: { count: number }) {
  if (count <= 0) return null;

  return <span className="text-xs text-muted-foreground">+{count}</span>;
}

/**
 * Options are display only, so the visible rows are hidden from screen readers
 * in favor of one complete sentence that includes what doesn't fit. Both rows
 * keep their fixed height when empty, so every card is the same height.
 */
function ProductOptions({
  options,
}: {
  options: CatalogProductSummary["options"];
}) {
  const colors = options.colors;
  const memory = memoryLabels(options.configurations);

  return (
    <>
      <div className="mt-3 h-4">
        {colors.length > 0 ? (
          <>
            <p className="sr-only">Available colors: {colors.join(", ")}</p>
            <div className="flex h-full items-center gap-1.5" aria-hidden="true">
              {colors.slice(0, MAX_SWATCHES).map((color) => (
                <span
                  className="size-3.5 rounded-full ring-1 ring-[var(--warm-300)]"
                  data-slot="swatch"
                  key={color}
                  style={{ backgroundColor: swatchColor(color) }}
                  title={color}
                />
              ))}
              <MoreCount count={colors.length - MAX_SWATCHES} />
            </div>
          </>
        ) : null}
      </div>
      <div className="mt-2.5 h-6">
        {memory.length > 0 ? (
          <>
            <p className="sr-only">Available memory: {memory.join(", ")}</p>
            <div className="flex h-full items-center gap-1.5" aria-hidden="true">
              {memory.slice(0, MAX_MEMORY_PILLS).map((label) => (
                <span
                  className="rounded-full border border-border px-2 py-0.5 text-xs font-semibold whitespace-nowrap"
                  key={label}
                >
                  {label}
                </span>
              ))}
              <MoreCount count={memory.length - MAX_MEMORY_PILLS} />
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}

export function ProductCard({
  product,
  priority = false,
}: {
  product: CatalogProductSummary;
  priority?: boolean;
}) {
  const locationLabel = `${product.locations.length} ${
    product.locations.length === 1 ? "location" : "locations"
  }`;
  const hasPrice = product.cashPriceFrom !== null && product.cashPriceFrom > 0;

  return (
    <Card className="relative h-full w-full gap-0 py-0 transition-shadow duration-200 hover:shadow-(--shadow)">
      <div className="relative h-[226px] overflow-hidden bg-white">
        <ProductPhoto
          src={product.imageUrl}
          alt=""
          brand={product.brand.name}
          width={560}
          height={448}
          sizes="(max-width: 680px) 100vw, 300px"
          priority={priority}
          className="p-5"
        />
      </div>

      <CardContent className="flex flex-1 flex-col px-5 pt-3 pb-0">
        <h3 className="m-0 line-clamp-2 min-h-[2.6em] text-base leading-[1.3] font-bold tracking-[-0.01em]">
          {product.name}
        </h3>
        <ProductOptions options={product.options} />
        <div className="mt-auto flex items-baseline gap-x-1.5 whitespace-nowrap pt-4">
          <small className="text-xs text-muted-foreground">
            {hasPrice ? "From" : "Price"}
          </small>
          <strong
            className={
              hasPrice
                ? "text-xl font-bold tracking-[-0.02em]"
                : "text-sm font-semibold"
            }
          >
            {formatPeso(product.cashPriceFrom)}
          </strong>
          {hasPrice &&
          product.srpPrice !== null &&
          product.srpPrice > (product.cashPriceFrom ?? 0) ? (
            <del className="ml-auto text-xs text-[var(--warm-500)]">
              {formatPeso(product.srpPrice)}
            </del>
          ) : null}
        </div>
      </CardContent>

      <CardFooter className="border-0 bg-transparent px-5 pt-1.5 pb-5 text-xs text-muted-foreground">
        <span>Available at {locationLabel}</span>
      </CardFooter>

      <Link
        className="absolute inset-0 rounded-card focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring"
        href={productPath(product)}
        // Prefetching several product pages left the browser tab title blank
        // after clicking through, in about 1 of 5 visits on Next.js 16.3.
        prefetch={false}
        aria-label={`View ${product.name}`}
      />
    </Card>
  );
}
