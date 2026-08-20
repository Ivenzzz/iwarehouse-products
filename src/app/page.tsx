import {
  Award,
  Gamepad2,
  Headphones,
  Headset,
  Laptop,
  MapPin,
  Package,
  RotateCcw,
  Search,
  ShieldCheck,
  Smartphone,
  Tablet,
  Tag,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CatalogUnavailableView,
  HomeCatalogSections,
  loadHomeCatalog,
  loadSiteBranding,
} from "@/modules/catalog";

export const dynamic = "force-dynamic";

const trustChips = [
  { icon: Package, title: "Current store stock", detail: "See what's in stock now" },
  { icon: Tag, title: "Transparent pricing", detail: "No hidden fees" },
  { icon: ShieldCheck, title: "No account needed", detail: "Quick and easy" },
];

const popularSearches = [
  { label: "iPhone 15", icon: Smartphone },
  { label: "Samsung S24", icon: Smartphone },
  { label: "MacBook Air", icon: Laptop },
  { label: "AirPods Pro", icon: Headphones },
  { label: "PS5", icon: Gamepad2 },
  { label: "Galaxy Tab", icon: Tablet },
];

const featureStrip = [
  { icon: MapPin, title: "Available at 100+ stores", detail: "Nationwide coverage" },
  { icon: Award, title: "Trusted brands", detail: "Genuine products" },
  { icon: Headset, title: "Expert support", detail: "In-store assistance" },
  { icon: RotateCcw, title: "Easy returns", detail: "Hassle-free" },
];

export default async function HomePage() {
  const [catalog, branding] = await Promise.all([
    loadHomeCatalog(),
    loadSiteBranding(),
  ]);

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
        <div className="shell relative grid min-h-[560px] grid-cols-[1.08fr_0.92fr] items-center gap-[70px] pt-[76px] pb-9 max-[980px]:min-h-0 max-[980px]:grid-cols-1 max-[980px]:pt-[70px] max-[680px]:pt-[55px]">
          <div className="relative z-2">
            <p className="eyebrow inline-flex items-center gap-2 rounded-[99px] border border-[var(--brand-a34)] bg-white/[0.72] px-[13px] py-[7px]">
              <span
                className="size-[7px] shrink-0 rounded-full bg-brand"
                aria-hidden="true"
              />
              Live store availability
            </p>
            <h1 className="mt-[19px] mb-[22px] max-w-[660px] text-[clamp(2.8rem,4.6vw,4.5rem)] leading-[1.02] font-[850] tracking-[-0.065em] text-foreground max-[680px]:text-[clamp(2.5rem,12vw,3.7rem)]">
              Find the right tech,{" "}
              <br className="max-[680px]:hidden" />
              <em className="not-italic text-brand">ready</em> nearby.
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
            <div className="mt-6 flex flex-wrap gap-x-7 gap-y-4 max-[680px]:gap-x-5">
              {trustChips.map(({ icon: Icon, title, detail }) => (
                <div key={title} className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-a08)] text-brand">
                    <Icon className="size-[18px]" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="m-0 text-[0.8rem] font-extrabold text-foreground">
                      {title}
                    </p>
                    <p className="m-0 text-[0.72rem] text-[var(--warm-600)]">
                      {detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="hero-art">
            <Image
              src={branding.hero?.url ?? "/hero-collage.png"}
              alt={
                branding.hero?.name ??
                "Laptops, tablets, phones, and accessories available at iWarehouse"
              }
              fill
              priority
              sizes="(max-width: 980px) 1px, 44vw"
              className="object-contain"
            />
          </div>
        </div>
        <div className="shell relative z-2 pb-[70px] max-[980px]:pb-[64px] max-[680px]:pb-[55px]">
          <p className="eyebrow">Popular searches</p>
          <div className="flex flex-wrap gap-2.5">
            {popularSearches.map(({ label, icon: Icon }) => (
              <Link
                key={label}
                href={{ pathname: "/products", query: { q: label } }}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--warm-300)] bg-white px-4 py-2 text-[0.78rem] font-bold text-[var(--warm-700)] shadow-(--shadow-sm) transition-colors hover:border-[var(--brand-a34)] hover:text-brand"
              >
                <Icon className="size-3.5 shrink-0" aria-hidden="true" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-[26px]">
        <div className="shell">
          <div className="grid grid-cols-4 gap-x-8 gap-y-5 rounded-3xl border border-[var(--warm-200)] bg-white px-9 py-7 shadow-(--shadow-sm) max-[980px]:grid-cols-2 max-[560px]:grid-cols-1 max-[680px]:px-6">
            {featureStrip.map(({ icon: Icon, title, detail }) => (
              <div key={title} className="flex items-center gap-4">
                <Icon
                  className="size-6 shrink-0 text-[var(--warm-700)]"
                  strokeWidth={1.6}
                  aria-hidden="true"
                />
                <div>
                  <p className="m-0 text-[0.86rem] font-extrabold text-foreground">
                    {title}
                  </p>
                  <p className="m-0 text-[0.75rem] text-[var(--warm-600)]">
                    {detail}
                  </p>
                </div>
              </div>
            ))}
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
