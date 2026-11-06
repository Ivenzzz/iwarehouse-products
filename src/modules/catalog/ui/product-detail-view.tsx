import { SectionHeading } from "@/components/ui/section-heading";
import type { ProductDetailViewModel } from "../model";
import { PageBreadcrumb } from "./page-breadcrumb";
import { VariantBrowser } from "./variant-browser";

export function ProductDetailView({
  product,
}: {
  product: ProductDetailViewModel;
}) {
  const prices = product.variants
    .map((variant) => variant.cashPriceFrom)
    .filter((price): price is number => price !== null && price > 0);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.imageUrl || undefined,
    brand: { "@type": "Brand", name: product.brand.name },
    offers: prices.length
      ? {
          "@type": "AggregateOffer",
          priceCurrency: "PHP",
          lowPrice: Math.min(...prices),
          highPrice: Math.max(...prices),
          offerCount: prices.length,
          availability: "https://schema.org/InStock",
        }
      : undefined,
  };

  return (
    <section className="py-10 max-[680px]:py-6">
      <div className="shell">
        <PageBreadcrumb
          parents={[{ href: "/products", label: "Products" }]}
          current={product.name}
        />
        <VariantBrowser product={product} />
        {product.specifications.length ? (
          <section className="mt-16 max-[680px]:mt-12">
            <SectionHeading
              title="Product specifications"
              className="mb-5"
            />
            <div className="grid grid-cols-2 items-start gap-4 max-[680px]:grid-cols-1">
              {product.specifications.map((group) => (
                <article
                  className="rounded-card bg-card p-5 shadow-(--shadow-sm)"
                  key={group.group}
                >
                  <h3 className="m-0 mb-2 text-base font-bold">
                    {group.group}
                  </h3>
                  <dl className="m-0">
                    {group.items.map((item) => (
                      <div
                        className="grid grid-cols-[0.8fr_1.2fr] gap-4 border-t border-border py-2.5 text-sm first:border-t-0 last:pb-0"
                        key={item.key}
                      >
                        <dt className="text-muted-foreground">{item.label}</dt>
                        <dd className="m-0 font-semibold">{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                </article>
              ))}
            </div>
          </section>
        ) : null}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </div>
    </section>
  );
}
