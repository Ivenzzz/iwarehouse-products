"use client";

import { ExternalLink, Phone } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { directionsUrl, formatPeso } from "@/lib/catalog/presentation";
import type { CatalogProductDetail } from "@/lib/catalog/types";

export function VariantBrowser({ product }: { product: CatalogProductDetail }) {
  const [selectedId, setSelectedId] = useState(product.variants[0]?.id);
  const variant = product.variants.find((item) => item.id === selectedId) ?? product.variants[0];

  if (!variant) return null;

  return (
    <div className="detail-grid">
      <div className="detail-media">
        <Image
          src={variant.image_url || product.image_url || "/product-placeholder.svg"}
          alt={product.name}
          width={900}
          height={760}
          priority
          unoptimized
        />
      </div>
      <div className="detail-purchase">
        <p className="eyebrow">{product.brand.name}</p>
        <h1>{product.name}</h1>
        {product.description ? <p className="lead">{product.description}</p> : null}

        <div className="detail-price">
          <small>{variant.cash_price_from === null ? "Price" : "Cash price from"}</small>
          <strong>{formatPeso(variant.cash_price_from)}</strong>
          {variant.srp_price !== null && variant.srp_price > (variant.cash_price_from ?? 0) ? (
            <span>SRP {formatPeso(variant.srp_price)}</span>
          ) : null}
        </div>

        <fieldset className="variant-fieldset">
          <legend>Choose a variant</legend>
          <div className="variant-options">
            {product.variants.map((item) => (
              <button
                className={item.id === variant.id ? "variant-option active" : "variant-option"}
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                aria-pressed={item.id === variant.id}
              >
                <strong>{item.condition}</strong>
                <span>{item.attributes.map((attribute) => attribute.value).filter(Boolean).join(" · ")}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <section className="location-section" id="locations">
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">Where to find it</p>
              <h2>Available locations</h2>
            </div>
            <span className="live-note">
              <span className="inline-block size-1.5 rounded-full bg-success" aria-hidden="true" />{" "}
              Updated frequently
            </span>
          </div>
          <div className="location-list">
            {variant.locations.map((location) => (
              <article className="location-card" key={location.id}>
                <div>
                  <strong>{location.name}</strong>
                  <p>{location.address || location.city}</p>
                </div>
                <div className="location-actions">
                  {location.phone ? (
                    <Button asChild variant="outline" size="sm" className="font-extrabold text-primary">
                      <a href={`tel:${location.phone}`}>
                        <Phone data-icon="inline-start" />
                        Call
                      </a>
                    </Button>
                  ) : null}
                  <Button asChild variant="outline" size="sm" className="font-extrabold text-primary">
                    <a href={directionsUrl(location)} target="_blank" rel="noreferrer">
                      Directions
                      <ExternalLink data-icon="inline-end" />
                    </a>
                  </Button>
                </div>
              </article>
            ))}
          </div>
          <p className="availability-note">
            Availability is informational and does not reserve an item. Contact the store before visiting.
          </p>
        </section>
      </div>
    </div>
  );
}
