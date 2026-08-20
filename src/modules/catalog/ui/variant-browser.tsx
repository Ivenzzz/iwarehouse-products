"use client";

import { ExternalLink, Phone } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { CatalogProductDetail } from "../model";
import { directionsUrl, formatPeso } from "../presentation";

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
    <div className="grid grid-cols-[1.02fr_0.98fr] items-start gap-16 max-[980px]:grid-cols-1 max-[980px]:gap-[38px]">
      <div className="sticky top-[110px] overflow-hidden rounded-[22px] border border-border bg-white shadow-(--shadow) max-[980px]:static max-[980px]:max-w-[680px]">
        <Image
          src={
            variant.imageUrl ||
            product.imageUrl ||
            "/product-placeholder.svg"
          }
          alt={product.name}
          width={900}
          height={760}
          priority
          unoptimized
          className="block aspect-[1.15] h-auto w-full object-contain p-[42px] max-[680px]:p-[22px]"
        />
      </div>
      <div className="pt-3">
        <p className="eyebrow">{product.brand.name}</p>
        <h1 className="m-0 text-[clamp(2.2rem,4vw,3.8rem)] leading-[1.04] tracking-[-0.05em] text-foreground">
          {product.name}
        </h1>
        {product.description ? (
          <p className="mt-[18px] mb-0 leading-[1.75] text-muted-foreground">
            {product.description}
          </p>
        ) : null}

        <div className="my-7 flex flex-wrap items-baseline gap-x-[15px] gap-y-[9px]">
          <small className="w-full text-[0.68rem] font-bold text-muted-foreground">
            {hasPrice ? "Cash price from" : "Price"}
          </small>
          <strong className="text-[2rem] tracking-[-0.05em] text-primary">
            {formatPeso(variant.cashPriceFrom)}
          </strong>
          {hasPrice &&
          variant.srpPrice !== null &&
          variant.srpPrice > (variant.cashPriceFrom ?? 0) ? (
            <span className="text-[0.76rem] text-[var(--warm-500)]">
              SRP {formatPeso(variant.srpPrice)}
            </span>
          ) : null}
        </div>

        <fieldset className="border-0 p-0">
          <legend className="mb-[11px] text-[0.74rem] font-extrabold text-[var(--warm-700)]">
            Choose a variant
          </legend>
          <div className="grid gap-[9px]">
            {product.variants.map((item) => (
              <button
                className={`flex min-h-[63px] w-full cursor-pointer flex-col items-start rounded-[10px] border px-[14px] py-[11px] text-left text-foreground ${
                  item.id === variant.id
                    ? "border-brand bg-[var(--brand-50)] shadow-[0_0_0_2px_var(--brand-a08)]"
                    : "border-[var(--warm-300)] bg-white"
                }`}
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                aria-pressed={item.id === variant.id}
              >
                <strong className="text-[0.78rem]">{item.condition}</strong>
                <span className="mt-[5px] text-[0.67rem] text-muted-foreground">
                  {item.attributes
                    .map((attribute) => attribute.value)
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <section
          className="mt-[38px] border-t border-border pt-[30px]"
          id="locations"
        >
          <div className="mb-[18px] flex items-end justify-between gap-6 max-[680px]:flex-col max-[680px]:items-start">
            <div>
              <p className="eyebrow">Where to find it</p>
              <h2 className="m-0 text-[1.3rem] tracking-[-0.035em]">
                Available locations
              </h2>
            </div>
            <span className="text-[0.63rem] font-bold text-muted-foreground">
              <span
                className="inline-block size-1.5 rounded-full bg-success"
                aria-hidden="true"
              />{" "}
              Updated frequently
            </span>
          </div>
          <div className="grid gap-[9px]">
            {variant.locations.map((location) => (
              <article
                className="flex items-center justify-between gap-5 rounded-[10px] border border-border p-[15px] max-[680px]:flex-col max-[680px]:items-start"
                key={location.id}
              >
                <div>
                  <strong className="text-[0.78rem]">{location.name}</strong>
                  <p className="mt-[5px] mb-0 text-[0.65rem] text-muted-foreground">
                    {location.address || location.city}
                  </p>
                </div>
                <div className="flex shrink-0 gap-[7px] max-[680px]:w-full max-[680px]:[&_a]:flex-1 max-[680px]:[&_a]:text-center">
                  {location.phone ? (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="font-extrabold text-primary"
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
                    className="font-extrabold text-primary"
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
          <p className="mt-3 mb-0 text-[0.61rem] leading-[1.6] text-[var(--warm-500)]">
            Availability is informational and does not reserve an item. Contact
            the store before visiting.
          </p>
        </section>
      </div>
    </div>
  );
}
