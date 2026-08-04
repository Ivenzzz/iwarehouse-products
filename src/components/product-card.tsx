import Image from "next/image";
import Link from "next/link";
import { formatPeso, productPath } from "@/lib/catalog/presentation";
import type { CatalogProductSummary } from "@/lib/catalog/types";

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
    <article className="product-card">
      <div className="product-image-wrap">
        <Image
          src={product.image_url || "/product-placeholder.svg"}
          alt=""
          width={560}
          height={440}
          sizes="(max-width: 680px) 100vw, (max-width: 1100px) 50vw, 33vw"
          priority={priority}
          unoptimized
        />
        <span className="stock-pill">In stock</span>
      </div>
      <div className="product-card-body">
        <p className="eyebrow">{product.brand.name}</p>
        <h3>{product.name}</h3>
        <div className="tag-row">
          {product.conditions.slice(0, 2).map((condition) => (
            <span className="tag" key={condition}>
              {condition}
            </span>
          ))}
        </div>
        <div className="card-price">
          <small>{product.cash_price_from === null ? "Price" : "From"}</small>
          <strong>{formatPeso(product.cash_price_from)}</strong>
          {product.srp_price !== null && product.srp_price > (product.cash_price_from ?? 0) ? (
            <del>{formatPeso(product.srp_price)}</del>
          ) : null}
        </div>
        <div className="card-footer">
          <span>Available at {locationLabel}</span>
          <span aria-hidden="true">View →</span>
        </div>
      </div>
      <Link
        className="card-link"
        href={productPath(product)}
        aria-label={`View ${product.name}`}
      />
    </article>
  );
}
