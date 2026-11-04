import { MapPin, Phone, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CatalogUnavailableView,
  firstStorePhone,
  HomeCatalogSections,
  loadHomeCatalog,
  loadStoreLocations,
} from "@/modules/catalog";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [catalog, stores] = await Promise.all([
    loadHomeCatalog(),
    loadStoreLocations(),
  ]);

  if (catalog.status === "unavailable") {
    return (
      <section className="shell py-16 max-[680px]:py-12">
        <CatalogUnavailableView />
      </section>
    );
  }

  const directory = stores.status === "ready" ? stores.data : null;
  const phone = directory ? firstStorePhone(directory) : null;

  return (
    <>
      <section className="shell grid grid-cols-[minmax(0,1fr)_auto] gap-x-12 gap-y-6 pt-14 pb-6 max-[680px]:grid-cols-1 max-[680px]:pt-9">
        <div>
          <h1 className="m-0 text-[clamp(2.5rem,5vw,4rem)] leading-[1.05] font-bold tracking-[-0.03em] text-foreground">
            Your next tech upgrade{" "}
            <span className="block text-[var(--warm-500)]">starts here.</span>
          </h1>
          <p className="mt-5 mb-0 max-w-[56ch] text-base leading-[1.6] text-muted-foreground">
            Discover the latest devices, everyday essentials, and great-value
            tech available at iWarehouse.
          </p>
          <form
            className="mt-7 flex max-w-[640px] items-center gap-3 rounded-full border border-input bg-card py-1.5 pr-1.5 pl-5 shadow-(--shadow-sm) focus-within:border-ring focus-within:ring-3 focus-within:ring-primary"
            action="/products"
          >
            <label className="sr-only" htmlFor="hero-q">
              Search products
            </label>
            <Search
              className="size-5 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="hero-q"
              name="q"
              placeholder="Search phones, laptops…"
              className="h-10 flex-1 rounded-none border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0"
            />
            <Button type="submit" className="h-10 px-5">
              Search
            </Button>
          </form>
        </div>

        <nav
          aria-label="Store help"
          className="flex flex-col items-end gap-3 pt-3 text-sm font-semibold text-primary max-[680px]:flex-row max-[680px]:flex-wrap max-[680px]:items-center max-[680px]:gap-x-5 max-[680px]:pt-0"
        >
          <Link
            href="/stores"
            className="inline-flex items-center gap-1.5 hover:underline"
          >
            <MapPin className="size-4" aria-hidden="true" />
            Find a store
          </Link>
          {phone ? (
            <a
              href={`tel:${phone}`}
              className="inline-flex items-center gap-1.5 hover:underline"
            >
              <Phone className="size-4" aria-hidden="true" />
              Call us
            </a>
          ) : null}
        </nav>
      </section>

      <HomeCatalogSections catalog={catalog.data} stores={directory} />
    </>
  );
}
