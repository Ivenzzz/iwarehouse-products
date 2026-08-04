import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { VariantBrowser } from "@/components/variant-browser";
import { getProduct } from "@/lib/catalog/client";
import { productPath } from "@/lib/catalog/presentation";

export const dynamic = "force-dynamic";

function productId(idSlug: string): number | null {
  const match = idSlug.match(/^(\d+)(?:-|$)/);
  return match ? Number(match[1]) : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ idSlug: string }>;
}): Promise<Metadata> {
  const { idSlug } = await params;
  const id = productId(idSlug);
  if (id === null) return { title: "Product not found" };

  try {
    const product = await getProduct(id);
    if (!product) return { title: "Product not found" };
    return {
      title: product.name,
      description: product.description || `See pricing and store availability for ${product.name}.`,
      alternates: { canonical: productPath(product) },
      openGraph: {
        title: product.name,
        description: product.description || `Available at iWarehouse stores and kiosks.`,
        images: product.image_url ? [product.image_url] : [],
      },
    };
  } catch {
    return { title: "Product" };
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ idSlug: string }>;
}) {
  const { idSlug } = await params;
  const id = productId(idSlug);
  if (id === null) notFound();

  const product = await getProduct(id);
  if (!product) notFound();
  if (idSlug !== `${product.id}-${product.slug}`) redirect(productPath(product));

  const prices = product.variants.map((variant) => variant.cash_price_from).filter((price): price is number => price !== null);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image_url || undefined,
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
    <section className="product-detail-page">
      <div className="shell">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href="/products">Products</Link>
          <span>/</span>
          <span>{product.name}</span>
        </nav>
        <VariantBrowser product={product} />
        {product.specifications.length ? (
          <section className="spec-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">The details</p>
                <h2>Product specifications</h2>
              </div>
            </div>
            <div className="spec-grid">
              {product.specifications.map((group) => (
                <article key={group.group}>
                  <h3>{group.group}</h3>
                  <dl>
                    {group.items.map((item) => (
                      <div key={item.key}>
                        <dt>{item.label}</dt>
                        <dd>{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                </article>
              ))}
            </div>
          </section>
        ) : null}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </div>
    </section>
  );
}
