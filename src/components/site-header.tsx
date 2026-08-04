import Link from "next/link";
import { BrandMark } from "./brand-mark";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <BrandMark />
        <nav aria-label="Main navigation">
          <Link href="/products">Browse products</Link>
          <Link href="/#locations">Store availability</Link>
        </nav>
      </div>
    </header>
  );
}
