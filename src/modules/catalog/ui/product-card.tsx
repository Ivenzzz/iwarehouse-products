import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { CatalogProductSummary } from "../model";
import { formatPeso, productPath } from "../presentation";

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

  return (
    <Card className="group relative gap-0 py-0 transition-all duration-200 hover:-translate-y-1 hover:shadow-(--shadow) hover:ring-brand/40">
      <div className="relative aspect-1.35 overflow-hidden bg-linear-to-br from-(--warm-50) to-(--warm-100)">
        <Image
          src={product.imageUrl || "/product-placeholder.svg"}
          alt=""
          width={560}
          height={440}
          sizes="(max-width: 680px) 100vw, (max-width: 1100px) 50vw, 33vw"
          priority={priority}
          unoptimized
          className="size-full object-contain p-4.5 transition-transform duration-300 group-hover:scale-103"
        />
        <Badge className="absolute top-3 right-3 gap-1.5 border-(--success-line) bg-success-soft font-extrabold text-success">
          <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
          In stock
        </Badge>
      </div>

      <CardContent className="p-5">
        <p className="eyebrow">{product.brand.name}</p>
        <h3 className="m-0 min-h-10 text-[1.02rem] leading-tight tracking-tighter">
          {product.name}
        </h3>
        <div className="mt-3 flex min-h-7 flex-wrap gap-1.5">
          {product.conditions.slice(0, 2).map((condition) => (
            <Badge variant="secondary" className="rounded-md font-bold" key={condition}>
              {condition}
            </Badge>
          ))}
        </div>
        <div className="mt-4.5 grid min-h-16 grid-cols-[1fr_auto] items-end">
          <small className="col-span-full text-[0.64rem] text-muted-foreground">
            {product.cashPriceFrom === null ? "Price" : "From"}
          </small>
          <strong className="text-[1.17rem] tracking-tighter text-primary">
            {formatPeso(product.cashPriceFrom)}
          </strong>
          {product.srpPrice !== null && product.srpPrice > (product.cashPriceFrom ?? 0) ? (
            <del className="text-[0.69rem] text-(--warm-500)">{formatPeso(product.srpPrice)}</del>
          ) : null}
        </div>
      </CardContent>

      <CardFooter className="mt-4 justify-between bg-transparent px-5 py-4 text-[0.67rem] font-bold text-muted-foreground">
        <span>Available at {locationLabel}</span>
        <span className="inline-flex items-center gap-1 text-primary" aria-hidden="true">
          View <ArrowRight className="size-3" />
        </span>
      </CardFooter>

      <Link
        className="absolute inset-0 rounded-xl focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-brand"
        href={productPath(product)}
        aria-label={`View ${product.name}`}
      />
    </Card>
  );
}
