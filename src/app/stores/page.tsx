import type { Metadata } from "next";
import {
  CatalogUnavailableView,
  StoreDirectoryView,
  loadStoreLocations,
} from "@/modules/catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Our stores",
  description:
    "Find every iWarehouse store and kiosk — addresses, contact details, and directions.",
};

export default async function StoresPage() {
  const directory = await loadStoreLocations();

  if (directory.status === "unavailable") {
    return (
      <section className="shell py-[78px] max-[680px]:py-[55px]">
        <CatalogUnavailableView />
      </section>
    );
  }

  return <StoreDirectoryView directory={directory.data} />;
}
