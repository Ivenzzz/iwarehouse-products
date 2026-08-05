import type { Metadata } from "next";
import {
  BrowseCatalogView,
  CatalogUnavailableView,
  browseCatalog,
  type RawSearchParams,
} from "@/modules/catalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Browse products",
  description:
    "Search products currently available at iWarehouse stores and kiosks.",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const catalog = await browseCatalog(await searchParams);

  if (catalog.status === "unavailable") {
    return (
      <section className="shell py-[78px] max-[680px]:py-[55px]">
        <CatalogUnavailableView />
      </section>
    );
  }

  return <BrowseCatalogView catalog={catalog.data} />;
}
