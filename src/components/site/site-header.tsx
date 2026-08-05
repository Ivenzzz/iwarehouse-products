import Link from "next/link";
import { BrandMark } from "./brand-mark";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border-a82)] bg-white/[0.92] backdrop-blur-[16px]">
      <div className="shell flex min-h-[74px] items-center justify-between gap-8 max-[680px]:min-h-[66px]">
        <BrandMark />
        <nav
          className="flex items-center gap-7 text-[0.85rem] font-bold text-[var(--warm-700)] [&_a:focus-visible]:text-primary [&_a:hover]:text-primary max-[680px]:gap-0 max-[680px]:text-[0.73rem] max-[680px]:[&_a:last-child]:hidden"
          aria-label="Main navigation"
        >
          <Link href="/products">Browse products</Link>
          <Link href="/#locations">Store availability</Link>
        </nav>
      </div>
    </header>
  );
}
