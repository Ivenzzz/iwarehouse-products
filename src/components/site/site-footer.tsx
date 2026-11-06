import { Globe, Phone } from "lucide-react";
import Link from "next/link";
import { BrandMark, type BrandLogo } from "./brand-mark";

const linkColumns: Array<{
  heading: string;
  links: Array<{ label: string; href: string }>;
}> = [
  {
    heading: "Shop",
    links: [
      { label: "Browse Products", href: "/products" },
      { label: "Store Availability", href: "/stores" },
    ],
  },
  {
    heading: "Visit Us",
    links: [
      { label: "Store Locations", href: "/stores" },
      { label: "Get Directions", href: "/stores" },
      { label: "Store Contact Details", href: "/stores" },
    ],
  },
];

export function SiteFooter({
  logo,
  contactPhone,
  showCustomerPolicies = false,
}: {
  logo?: BrandLogo | null;
  contactPhone?: string | null;
  showCustomerPolicies?: boolean;
}) {
  return (
    <footer className="border-t border-border pt-10 pb-6 text-xs leading-[1.6] text-muted-foreground">
      <div className="shell grid grid-cols-[1.2fr_0.7fr_0.8fr_1.3fr] gap-x-10 gap-y-8 max-[980px]:grid-cols-2 max-[680px]:grid-cols-1">
        <div>
          <BrandMark logo={logo} tagline="Technology for everyone" />
          <p className="mt-4 mb-0 max-w-[36ch]">
            Find the tech you need, check store availability, and connect with
            the nearest iWarehouse branch before you visit.
          </p>
        </div>

        <nav aria-label="Footer" className="contents">
          {linkColumns.map((column) => (
            <div key={column.heading}>
              <strong className="block font-semibold text-foreground">
                {column.heading}
              </strong>
              <ul className="m-0 mt-2.5 flex list-none flex-col gap-2 p-0">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="transition-colors hover:text-foreground hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div>
          <strong className="block font-semibold text-foreground">
            Before you visit
          </strong>
          <p className="mt-2.5 mb-0 max-w-[44ch]">
            Stock and prices may change throughout the day. For the latest
            availability, we recommend confirming with your preferred iWarehouse
            store before heading out.
          </p>
          {contactPhone ? (
            <a
              href={`tel:${contactPhone}`}
              className="mt-3 inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
            >
              <Phone className="size-3.5" aria-hidden="true" />
              Call Us: {contactPhone}
            </a>
          ) : null}
        </div>
      </div>

      <div className="shell mt-8 flex flex-wrap items-center justify-between gap-x-8 gap-y-2 border-t border-border pt-5 max-[680px]:flex-col max-[680px]:items-start">
        <p className="m-0">
          © {new Date().getFullYear()} iWarehouse Corporation. All rights
          reserved.
        </p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {showCustomerPolicies ? (
            <>
              <Link href="/privacy" className="transition-colors hover:text-foreground hover:underline">
                Privacy notice
              </Link>
              <Link href="/review-guidelines" className="transition-colors hover:text-foreground hover:underline">
                Review guidelines
              </Link>
            </>
          ) : null}
          {/* A plain anchor: sitemap.xml is not an app page. */}
          <a
            href="/sitemap.xml"
            className="transition-colors hover:text-foreground hover:underline"
          >
            Sitemap
          </a>
          <p className="m-0 inline-flex items-center gap-1.5">
            Philippines / English
            <Globe className="size-3.5" aria-hidden="true" />
          </p>
        </div>
      </div>
    </footer>
  );
}
