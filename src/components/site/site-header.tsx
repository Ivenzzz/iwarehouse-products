import { MapPin, Menu, UserRound } from "lucide-react";
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
    <header className="sticky top-0 z-50 border-b border-[var(--border-a82)] bg-white/[0.92] backdrop-blur-[16px]">
      <div className="shell flex min-h-[74px] items-center justify-between gap-6 max-[680px]:min-h-[66px]">
        <BrandMark logo={logo} />

        <div className="max-[980px]:hidden">
          <SiteNav nav={nav} />
        </div>

        <div className="flex items-center gap-3 max-[680px]:gap-2">
          <Link
            href="/stores"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border-a82)] bg-white px-4 py-2 text-[0.8rem] font-extrabold whitespace-nowrap text-primary shadow-(--shadow-sm) transition-colors hover:bg-[var(--brand-50)] max-[680px]:px-3 max-[680px]:text-[0.74rem]"
          >
            <MapPin className="size-4 text-brand" aria-hidden="true" />
            Search stores
          </Link>

          {/* Visual-only per the mock: the site has no accounts, so the
              avatar is decorative and hidden from assistive tech. */}
          <span
            aria-hidden="true"
            className="grid size-10 place-items-center rounded-full border border-[var(--border-a82)] bg-white text-[var(--warm-600)] shadow-(--shadow-sm) max-[680px]:hidden"
          >
            <UserRound className="size-[18px]" />
          </span>

          <details className="relative hidden max-[980px]:block">
            <summary
              className="grid size-10 cursor-pointer list-none place-items-center rounded-full border border-[var(--border-a82)] bg-white text-[var(--warm-700)] shadow-(--shadow-sm) [&::-webkit-details-marker]:hidden"
              aria-label="Menu"
            >
              <Menu className="size-5" aria-hidden="true" />
            </summary>
            <nav
              aria-label="Mobile navigation"
              className="absolute top-[calc(100%+10px)] right-0 z-50 grid w-48 gap-1 rounded-[14px] border border-[var(--border-a82)] bg-white p-2 shadow-(--shadow-raise) [&_a]:rounded-lg [&_a]:px-3 [&_a]:py-2 [&_a]:text-[0.82rem] [&_a]:font-bold [&_a]:text-[var(--warm-700)] [&_a:hover]:bg-[var(--brand-50)] [&_a:hover]:text-primary"
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
