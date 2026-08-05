import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type { ProductDetailViewModel } from "../model";
import { VariantBrowser } from "./variant-browser";

export function ProductDetailView({
  product,
}: {
  product: ProductDetailViewModel;
}) {
  const prices = product.variants
    .map((variant) => variant.cashPriceFrom)
    .filter((price): price is number => price !== null);
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
          offerCount: product.variants.length,
          availability: "https://schema.org/InStock",
        }
      : undefined,
  };

  return (
    <section className="bg-[linear-gradient(var(--warm-50)_0_580px,white_580px)] py-[78px] max-[680px]:py-[55px]">
      <div className="shell">
        <Breadcrumb className="mb-8">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/products">Products</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{product.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <VariantBrowser product={product} />
        {product.specifications.length ? (
          <section className="mt-[100px] border-t border-border pt-[70px]">
            <div className="mb-[30px] flex items-end justify-between gap-6 max-[680px]:flex-col max-[680px]:items-start">
              <div>
                <p className="eyebrow">The details</p>
                <h2 className="m-0 text-[clamp(1.8rem,3vw,2.65rem)] tracking-[-0.05em] text-foreground">
                  Product specifications
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-[18px] max-[680px]:grid-cols-1">
              {product.specifications.map((group) => (
                <article
                  className="overflow-hidden rounded-[14px] border border-border"
                  key={group.group}
                >
                  <h3 className="m-0 bg-[var(--brand-50)] px-[18px] py-[15px] text-[0.8rem] text-primary">
                    {group.group}
                  </h3>
                  <dl className="m-0">
                    {group.items.map((item) => (
                      <div
                        className="grid grid-cols-[0.8fr_1.2fr] gap-[15px] border-t border-[var(--warm-200)] px-[18px] py-3 text-[0.7rem]"
                        key={item.key}
                      >
                        <dt className="text-muted-foreground">{item.label}</dt>
                        <dd className="m-0 font-bold">{item.value}</dd>
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
