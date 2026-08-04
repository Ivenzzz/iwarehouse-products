import { ArrowRight, Check, Search } from "lucide-react";
import Link from "next/link";
import { CatalogUnavailable } from "@/components/catalog-unavailable";
import { CategoryIcon } from "@/components/category-icon";
import { ProductGrid } from "@/components/product-grid";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getFilters, getProducts } from "@/lib/catalog/client";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const catalog = await Promise.all([
      getFilters(),
      getProducts({ sort: "newest", per_page: "6" }),
    ]).catch(() => null);

  if (catalog === null) {
    return (
      <section className="page-section shell">
        <CatalogUnavailable />
      </section>
    );
  }

  const [filters, products] = catalog;

  return (
      <>
        <section className="hero">
          <div className="shell hero-grid">
            <div className="hero-copy">
              <p className="eyebrow hero-eyebrow">Live store availability</p>
              <h1>Find the right tech, <em>ready nearby.</em></h1>
              <p>
                Explore phones, laptops, accessories, and more currently available at iWarehouse
                stores and kiosks.
              </p>
              <form className="hero-search" action="/products">
                <label className="sr-only" htmlFor="hero-q">
                  Search products
                </label>
                <Search className="size-5 shrink-0 text-brand" aria-hidden="true" />
                <Input
                  id="hero-q"
                  name="q"
                  placeholder="Search brand, model, or feature"
                  className="h-11 flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
                />
                <Button type="submit" className="h-11 px-6 text-[0.83rem] font-extrabold">
                  Search products
                </Button>
              </form>
              <div className="trust-row">
                <span>
                  <Check aria-hidden="true" /> Current store stock
                </span>
                <span>
                  <Check aria-hidden="true" /> Transparent pricing
                </span>
                <span>
                  <Check aria-hidden="true" /> No account needed
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

        <section className="category-section">
          <div className="shell">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Browse your way</p>
                <h2>Shop by category</h2>
              </div>
              <Link href="/products">
                View all products <ArrowRight aria-hidden="true" />
              </Link>
            </div>
            <div className="category-grid">
              {filters.categories.slice(0, 6).map((category, index) => (
                <Card
                  key={category.id}
                  className="min-h-40 justify-start gap-0 p-6 transition-all duration-200 hover:-translate-y-0.75 hover:shadow-(--shadow) hover:ring-brand/40"
                >
                  <Link href={`/products?category=${category.id}`} className="flex flex-1 flex-col">
                    <span className={`category-symbol symbol-${(index % 4) + 1}`}>
                      <CategoryIcon name={category.name} className="size-5" />
                    </span>
                    <strong className="mt-4.5 text-[0.92rem]">{category.name}</strong>
                    <small className="mt-1.5 min-h-4 truncate text-[0.67rem] text-muted-foreground">
                      {category.children.map((child) => child.name).slice(0, 2).join(" · ")}
                    </small>
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="latest-section">
          <div className="shell">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Fresh in store</p>
                <h2>Recently available</h2>
              </div>
              <Link href="/products?sort=newest">
                Explore everything <ArrowRight aria-hidden="true" />
              </Link>
            </div>
            <ProductGrid products={products.data} />
          </div>
        </section>

        <section className="store-banner" id="locations">
          <div className="shell store-banner-inner">
            <div>
              <p className="eyebrow">Know before you go</p>
              <h2>See exactly which store has it.</h2>
              <p>Every product page shows customer-facing locations, contact details, and directions.</p>
            </div>
            <Button asChild className="h-11 min-w-52 bg-background px-6 text-[0.83rem] font-extrabold text-primary hover:bg-background/90">
              <Link href="/products">Browse store availability</Link>
            </Button>
          </div>
        </section>
      </>
  );
}
