import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  CatalogUnavailableView,
  ProductDetailView,
  resolveProduct,
  type ProductDetailViewModel,
} from "@/modules/catalog";

export const dynamic = "force-dynamic";

function metadataFor(product: ProductDetailViewModel): Metadata {
  const canonical = `/products/${product.id}-${product.slug}`;

  return {
    title: product.name,
    description:
      product.description ||
      `See pricing and store availability for ${product.name}.`,
    alternates: { canonical },
    openGraph: {
      title: product.name,
      description:
        product.description || "Available at iWarehouse stores and kiosks.",
      images: product.imageUrl ? [product.imageUrl] : [],
    },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ idSlug: string }>;
}): Promise<Metadata> {
  const { idSlug } = await params;
  const resolution = await resolveProduct(idSlug);

  if (resolution.status === "ready") {
    return metadataFor(resolution.data);
  }
  if (resolution.status === "redirect") {
    const canonicalSlug = resolution.location.split("/").at(-1);
    if (canonicalSlug) {
      const canonical = await resolveProduct(canonicalSlug);
      if (canonical.status === "ready") return metadataFor(canonical.data);
    }
  }
  if (resolution.status === "not-found") {
    return { title: "Product not found" };
  }

  return { title: "Product" };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ idSlug: string }>;
}) {
  const { idSlug } = await params;
  const resolution = await resolveProduct(idSlug);

  switch (resolution.status) {
    case "not-found":
      notFound();
    case "redirect":
      redirect(resolution.location);
    case "unavailable":
      return (
        <section className="shell py-[78px] max-[680px]:py-[55px]">
          <CatalogUnavailableView />
        </section>
      );
    case "ready":
      return <ProductDetailView product={resolution.data} />;
  }
}
