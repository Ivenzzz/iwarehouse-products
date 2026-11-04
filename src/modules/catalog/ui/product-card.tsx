import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { CatalogProductSummary } from "../model";
import { formatPeso, productPath } from "../presentation";
import { ProductPhoto } from "./product-photo";

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
      <div className="relative aspect-[4/3] overflow-hidden bg-white">
        <ProductPhoto
          src={product.imageUrl}
          alt=""
          brand={product.brand.name}
          width={560}
          height={420}
          sizes="(max-width: 680px) 100vw, 300px"
          priority={priority}
          className="p-5"
        />
      </div>

      <CardContent className="flex flex-1 flex-col px-5 pt-3 pb-0">
        <p className="eyebrow">{product.brand.name}</p>
        <h3 className="m-0 line-clamp-2 min-h-[2.6em] text-base leading-[1.3] font-semibold tracking-[-0.01em]">
          {product.name}
        </h3>
        <div className="mt-3 flex min-h-5 flex-wrap gap-1.5">
          {product.conditions.slice(0, 2).map((condition) => (
            <Badge variant="secondary" key={condition}>
              {condition}
            </Badge>
          ))}
        </div>
        <div className="mt-auto grid grid-cols-[1fr_auto] items-baseline pt-4">
          <small className="col-span-full text-xs text-muted-foreground">
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
            <del className="text-xs text-[var(--warm-500)]">
              {formatPeso(product.srpPrice)}
            </del>
          ) : null}
        </div>
      </CardContent>

      <CardFooter className="border-0 bg-transparent px-5 pt-2 pb-5 text-xs text-muted-foreground">
        <span>Available at {locationLabel}</span>
      </CardFooter>

      <Link
        className="absolute inset-0 rounded-card focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-primary"
        href={productPath(product)}
        aria-label={`View ${product.name}`}
      />
    </Card>
  );
}
