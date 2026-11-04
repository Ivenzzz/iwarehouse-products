"use client";

import { ExternalLink, Phone } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import type { CatalogProductDetail } from "../model";
import { directionsUrl, formatPeso } from "../presentation";
import { ProductPhoto } from "./product-photo";

export function VariantBrowser({
  product,
}: {
  product: CatalogProductDetail;
}) {
  const [selectedId, setSelectedId] = useState(product.variants[0]?.id);
  const variant =
    product.variants.find((item) => item.id === selectedId) ??
    product.variants[0];

  if (!variant) return null;

  const hasPrice = variant.cashPriceFrom !== null && variant.cashPriceFrom > 0;

  return (
    <div className="grid grid-cols-[1.02fr_0.98fr] items-start gap-12 max-[980px]:grid-cols-1 max-[980px]:gap-8">
      <div className="sticky top-20 aspect-[1.15] overflow-hidden rounded-card bg-white shadow-(--shadow-sm) max-[980px]:static max-[980px]:max-w-[680px]">
        <ProductPhoto
          src={variant.imageUrl || product.imageUrl}
          alt={product.name}
          brand={product.brand.name}
          width={900}
          height={760}
          priority
          className="p-10 max-[680px]:p-5"
          fallbackClassName="text-2xl"
        />
      </div>
      <div>
        <p className="eyebrow">{product.brand.name}</p>
        <h1 className="m-0 text-[clamp(2rem,4vw,2.5rem)] leading-[1.1] font-bold tracking-[-0.02em] text-foreground">
          {product.name}
        </h1>
        {product.description ? (
          <p className="mt-4 mb-0 max-w-[60ch] text-base leading-[1.6] text-muted-foreground">
            {product.description}
          </p>
        ) : null}

        <div className="my-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <small className="w-full text-sm text-muted-foreground">
            {hasPrice ? "Cash price from" : "Price"}
          </small>
          <strong
            className={
              hasPrice
                ? "text-[1.75rem] font-bold tracking-[-0.02em]"
                : "text-xl font-semibold"
            }
          >
            {formatPeso(variant.cashPriceFrom)}
          </strong>
          {hasPrice &&
          variant.srpPrice !== null &&
          variant.srpPrice > (variant.cashPriceFrom ?? 0) ? (
            <span className="text-sm text-[var(--warm-500)]">
              SRP {formatPeso(variant.srpPrice)}
            </span>
          ) : null}
        </div>

        <fieldset className="border-0 p-0">
          <legend className="mb-2.5 text-sm font-semibold">
            Choose a variant
          </legend>
          <div className="grid gap-2.5">
            {product.variants.map((item) => (
              <button
                className={`flex min-h-16 w-full cursor-pointer flex-col items-start rounded-2xl border-2 bg-card px-4 py-3 text-left text-foreground shadow-(--shadow-sm) transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                  item.id === variant.id
                    ? "border-brand"
                    : "border-transparent hover:border-[var(--warm-200)]"
                }`}
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                aria-pressed={item.id === variant.id}
              >
                <strong className="text-sm font-semibold">
                  {item.condition}
                </strong>
                <span className="mt-1 text-xs text-muted-foreground">
                  {item.attributes
                    .map((attribute) => attribute.value)
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <section className="mt-10" id="locations">
          <div className="mb-4 flex items-end justify-between gap-4 max-[680px]:flex-col max-[680px]:items-start max-[680px]:gap-1">
            <SectionHeading
              title="Available locations"
              className="text-xl max-[680px]:text-xl"
            />
            <span className="shrink-0 text-xs text-muted-foreground">
              Updated frequently
            </span>
          </div>
          <div className="grid gap-2.5">
            {variant.locations.map((location) => (
              <article
                className="flex items-center justify-between gap-5 rounded-2xl bg-card p-4 shadow-(--shadow-sm) max-[680px]:flex-col max-[680px]:items-start max-[680px]:gap-3"
                key={location.id}
              >
                <div>
                  <strong className="text-sm font-semibold">
                    {location.name}
                  </strong>
                  <p className="mt-1 mb-0 text-xs leading-[1.5] text-muted-foreground">
                    {location.address || location.city}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2 max-[680px]:w-full max-[680px]:[&_a]:flex-1 max-[680px]:[&_a]:text-center">
                  {location.phone ? (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="text-primary"
                    >
                      <a href={`tel:${location.phone}`}>
                        <Phone data-icon="inline-start" />
                        Call
                      </a>
                    </Button>
                  ) : null}
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="text-primary"
                  >
                    <a
                      href={directionsUrl(location)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Directions
                      <ExternalLink data-icon="inline-end" />
                    </a>
                  </Button>
                </div>
              </article>
            ))}
          </div>
          <p className="mt-3 mb-0 text-xs leading-[1.6] text-[var(--warm-500)]">
            Availability is informational and does not reserve an item. Contact
            the store before visiting.
          </p>
        </section>
      </div>
    </div>
  );
}
