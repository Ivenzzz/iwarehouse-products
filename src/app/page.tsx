import { Check, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CatalogUnavailableView,
  HomeCatalogSections,
  loadHomeCatalog,
} from "@/modules/catalog";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const catalog = await loadHomeCatalog();

  if (catalog.status === "unavailable") {
    return (
      <section className="shell py-[78px] max-[680px]:py-[55px]">
        <CatalogUnavailableView />
      </section>
    );
  }

  return (
    <>
      <section className="hero">
        <div className="shell relative grid min-h-[600px] grid-cols-[1.08fr_0.92fr] items-center gap-[70px] py-[76px] max-[980px]:min-h-0 max-[980px]:grid-cols-1 max-[980px]:py-[70px] max-[680px]:pt-[55px] max-[680px]:pb-[62px]">
          <div className="relative z-2">
            <p className="eyebrow inline-flex items-center rounded-[99px] border border-[var(--brand-a20)] bg-white/[0.72] px-[11px] py-[7px]">
              Live store availability
            </p>
            <h1 className="mt-[19px] mb-[22px] max-w-[660px] text-[clamp(3rem,5.3vw,5.2rem)] leading-[0.98] font-[850] tracking-[-0.065em] text-foreground max-[680px]:text-[clamp(2.7rem,14vw,4.1rem)]">
              Find the right tech,{" "}
              <em className="not-italic text-brand">ready nearby.</em>
            </h1>
            <p className="m-0 max-w-[610px] text-[1.07rem] leading-[1.75] text-[var(--warm-600)]">
              Explore phones, laptops, accessories, and more currently
              available at iWarehouse stores and kiosks.
            </p>
            <form
              className="mt-[31px] flex max-w-[650px] items-center gap-3 rounded-[15px] border border-[var(--warm-300)] bg-white py-[7px] pr-[7px] pl-[18px] shadow-(--shadow-raise) max-[680px]:grid max-[680px]:grid-cols-[auto_1fr]"
              action="/products"
            >
              <label className="sr-only" htmlFor="hero-q">
                Search products
              </label>
              <Search
                className="size-5 shrink-0 text-brand"
                aria-hidden="true"
              />
              <Input
                id="hero-q"
                name="q"
                placeholder="Search brand, model, or feature"
                className="h-11 flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
              />
              <Button
                type="submit"
                className="h-11 px-6 text-[0.83rem] font-extrabold max-[680px]:col-span-full max-[680px]:min-h-[46px]"
              >
                Search products
              </Button>
            </form>
            <div className="mt-5 flex flex-wrap gap-5 text-[0.75rem] font-bold text-[var(--warm-600)] max-[680px]:gap-x-[15px] max-[680px]:gap-y-[9px]">
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-[14px] text-success" aria-hidden="true" />{" "}
                Current store stock
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-[14px] text-success" aria-hidden="true" />{" "}
                Transparent pricing
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-[14px] text-success" aria-hidden="true" />{" "}
                No account needed
              </span>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="orb orb-one" />
            <div className="orb orb-two" />
            <div className="device-card device-main">
              <span className="device-camera" />
              <div className="device-screen">
                <i />
                <b>Available now</b>
              </div>
            </div>
            <div className="floating-chip chip-price">
              <small>Live pricing</small>
              <strong>Updated often</strong>
            </div>
            <div className="floating-chip chip-store">
              <span className="size-2 shrink-0 rounded-full bg-success" />
              <div>
                <small>Find it nearby</small>
                <strong>Stores & kiosks</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <HomeCatalogSections catalog={catalog.data} />

      <section className="store-banner py-[60px] text-white" id="locations">
        <div className="shell flex items-center justify-between gap-10 max-[680px]:flex-col max-[680px]:items-start">
          <div>
            <p className="eyebrow">Know before you go</p>
            <h2 className="m-0 text-[clamp(1.8rem,3vw,2.7rem)] tracking-[-0.05em]">
              See exactly which store has it.
            </h2>
            <p className="mt-3 mb-0 max-w-[650px] leading-[1.7] text-[var(--night-copy)]">
              Every product page shows customer-facing locations, contact
              details, and directions.
            </p>
          </div>
          <Button
            asChild
            className="h-11 min-w-52 bg-background px-6 text-[0.83rem] font-extrabold text-primary hover:bg-background/90 max-[680px]:w-full"
          >
            <Link href="/products">Browse store availability</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
