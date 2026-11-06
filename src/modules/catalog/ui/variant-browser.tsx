"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { CatalogProductDetail } from "../model";
import {
  formatPeso,
  locationCountLabel,
  nameStartsWithBrand,
} from "../presentation";
import {
  buildVariantModel,
  describeOffer,
  offerColor,
  resolveOffer,
  selectOption,
} from "../variant-options";
import { VariantLocations } from "./variant-locations";
import { VariantPicker } from "./variant-picker";
import { VariantVisual } from "./variant-visual";

export function VariantBrowser({
  product,
}: {
  product: CatalogProductDetail;
}) {
  const searchParams = useSearchParams();
  const model = useMemo(
    () => buildVariantModel(product.variants),
    [product.variants],
  );
  const [selection, setSelection] = useState(() => ({
    offerId: resolveOffer(model, searchParams.get("variant"))?.id,
    note: null as string | null,
    announcement: "",
  }));
  const offer =
    model.offers.find((item) => item.id === selection.offerId) ??
    model.offers[0];

  if (!offer) return null;

  function choose(dimension: string, key: string) {
    const { offer: next, note } = selectOption(model, offer, dimension, key);

    setSelection({
      offerId: next.id,
      note,
      announcement: [
        note,
        `${formatPeso(next.cashPriceFrom)}.`,
        `${locationCountLabel(next.locations.length)}.`,
      ]
        .filter(Boolean)
        .join(" "),
    });

    // Replaces the history entry, so Back still leaves the page.
    const params = new URLSearchParams(window.location.search);
    params.set("variant", String(next.id));
    window.history.replaceState(null, "", `?${params}`);
  }

  const hasPrice = offer.cashPriceFrom !== null && offer.cashPriceFrom > 0;
  const color = offerColor(model, offer);
  // product.imageUrl is one color's photo, so it only suits colorless products.
  const photo = offer.imageUrl ?? (model.hasColors ? null : product.imageUrl);

  return (
    <div className="grid grid-cols-[1.02fr_0.98fr] items-start gap-12 max-[980px]:grid-cols-1 max-[980px]:gap-6">
      <VariantVisual
        brand={product.brand.name}
        color={color}
        name={product.name}
        src={photo}
      />
      <div className="min-w-0">
        {nameStartsWithBrand(product.name, product.brand.name) ? null : (
          <p className="eyebrow">{product.brand.name}</p>
        )}
        <h1 className="m-0 text-[clamp(1.75rem,3.2vw,2.25rem)] leading-[1.1] font-bold tracking-[-0.02em] text-balance text-foreground">
          {product.name}
        </h1>
        {product.description ? (
          <p className="mt-4 mb-0 max-w-[60ch] text-base leading-[1.6] text-muted-foreground">
            {product.description}
          </p>
        ) : null}

        <div className="mt-6 rounded-card bg-card p-5 shadow-(--shadow-sm)">
          <div className="mb-5 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border pb-4">
            <small className="w-full text-sm text-muted-foreground">
              {hasPrice ? "Cash price from" : "Price"}
            </small>
            <strong
              className={
                hasPrice
                  ? "text-[2rem] leading-[1.1] font-bold tracking-[-0.02em]"
                  : "text-xl font-semibold"
              }
            >
              {formatPeso(offer.cashPriceFrom)}
            </strong>
            {hasPrice &&
            offer.srpPrice !== null &&
            offer.srpPrice > (offer.cashPriceFrom ?? 0) ? (
              <span className="text-sm text-[var(--warm-500)]">
                SRP {formatPeso(offer.srpPrice)}
              </span>
            ) : null}
          </div>
          <VariantPicker
            model={model}
            note={selection.note}
            onSelect={choose}
            selected={offer}
          />
        </div>
        <p className="sr-only" role="status">
          {selection.announcement}
        </p>

        <VariantLocations
          locations={offer.locations}
          summary={describeOffer(model, offer)}
        />
      </div>
    </div>
  );
}
