import Link from "next/link";
import { CatalogUnavailable } from "@/components/catalog-unavailable";
import { ProductGrid } from "@/components/product-grid";
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
                <span aria-hidden="true">⌕</span>
                <input id="hero-q" name="q" placeholder="Search brand, model, or feature" />
                <button type="submit">Search products</button>
              </form>
              <div className="trust-row">
                <span>✓ Current store stock</span>
                <span>✓ Transparent pricing</span>
                <span>✓ No account needed</span>
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
                <span>●</span>
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
              <Link href="/products">View all products →</Link>
            </div>
            <div className="category-grid">
              {filters.categories.slice(0, 6).map((category, index) => (
                <Link href={`/products?category=${category.id}`} className="category-card" key={category.id}>
                  <span className={`category-symbol symbol-${(index % 4) + 1}`} aria-hidden="true">
                    {["▱", "⌁", "⌨", "◇"][index % 4]}
                  </span>
                  <strong>{category.name}</strong>
                  <small>{category.children.map((child) => child.name).slice(0, 2).join(" · ")}</small>
                </Link>
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
              <Link href="/products?sort=newest">Explore everything →</Link>
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
            <Link className="button button-light" href="/products">
              Browse store availability
            </Link>
          </div>
        </section>
      </>
  );
}
