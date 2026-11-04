import { MapPin, Menu } from "lucide-react";
import Link from "next/link";
import { BrandMark, type BrandLogo } from "./brand-mark";
import { SiteNav, type SiteNavData } from "./site-nav";

export function SiteHeader({
  logo,
  nav,
}: {
  logo?: BrandLogo | null;
  nav: SiteNavData;
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border-a82)] bg-background/80 backdrop-blur-[16px]">
      <div className="shell flex min-h-14 items-center justify-between gap-6">
        <BrandMark logo={logo} />

        <div className="max-[980px]:hidden">
          <SiteNav nav={nav} />
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/stores"
            className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold whitespace-nowrap text-primary transition-colors hover:bg-[var(--brand-50)]"
          >
            <MapPin className="size-4" aria-hidden="true" />
            Search stores
          </Link>

          <details className="relative hidden max-[980px]:block">
            <summary
              className="grid size-9 cursor-pointer list-none place-items-center rounded-full bg-card text-[var(--warm-700)] shadow-(--shadow-sm) [&::-webkit-details-marker]:hidden"
              aria-label="Menu"
            >
              <Menu className="size-5" aria-hidden="true" />
            </summary>
            <nav
              aria-label="Mobile navigation"
              className="absolute top-[calc(100%+10px)] right-0 z-50 grid w-48 gap-1 rounded-2xl bg-card p-2 shadow-(--shadow-raise) [&_a]:rounded-lg [&_a]:px-3 [&_a]:py-2 [&_a]:text-sm [&_a]:font-semibold [&_a]:text-[var(--warm-700)] [&_a:hover]:bg-[var(--brand-50)] [&_a:hover]:text-primary"
            >
              <Link href="/products">Products</Link>
              <Link href="/products">Categories</Link>
              <Link href="/products">Brands</Link>
              <Link href="/stores">Stores</Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
