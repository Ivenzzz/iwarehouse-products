import { ChevronRight, Globe, MapPin, MessageCircle, Phone } from "lucide-react";
import Link from "next/link";
import { BrandMark, type BrandLogo } from "./brand-mark";
import { NewsletterForm } from "./newsletter-form";
import { SocialIcon, type SocialNetwork } from "./social-icons";

// Placeholder hrefs ("#") mark destinations that have no page yet; swap them
// for real routes as those pages ship.
const linkColumns: Array<{
  heading: string;
  links: Array<{ label: string; href: string }>;
}> = [
  {
    heading: "Shop",
    links: [
      { label: "Browse Products", href: "/products" },
      { label: "Store Availability", href: "/stores" },
      { label: "Latest Offers", href: "#" },
      { label: "Featured Deals", href: "#" },
    ],
  },
  {
    heading: "Visit Us",
    links: [
      { label: "Store Locations", href: "/stores" },
      { label: "Get Directions", href: "/stores" },
      { label: "Store Contact Details", href: "/stores" },
      { label: "Business Hours", href: "#" },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "Contact Us", href: "#" },
      { label: "Product Inquiries", href: "#" },
      { label: "After-Sales Support", href: "#" },
      { label: "FAQs", href: "#" },
    ],
  },
];

const socialLinks: Array<{ network: SocialNetwork; label: string }> = [
  { network: "facebook", label: "Facebook" },
  { network: "instagram", label: "Instagram" },
  { network: "tiktok", label: "TikTok" },
  { network: "x", label: "X" },
  { network: "youtube", label: "YouTube" },
];

const legalLinks = [
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Use", href: "#" },
  { label: "Cookie Policy", href: "#" },
  { label: "Sitemap", href: "/sitemap.xml" },
];

export function SiteFooter({
  logo,
  contactPhone,
}: {
  logo?: BrandLogo | null;
  contactPhone?: string | null;
}) {
  return (
    <footer className="border-t border-white/10 bg-[var(--night-raised)] pt-[58px] pb-[26px] text-white">
      <div className="shell grid grid-cols-[1.15fr_0.72fr_0.78fr_0.82fr_1.3fr] gap-x-9 gap-y-11 max-[980px]:grid-cols-2 max-[680px]:grid-cols-1">
        <div>
          <BrandMark logo={logo} tone="dark" tagline="Technology for everyone" />
          <p className="mt-5 mb-0 max-w-[280px] text-[0.83rem] leading-[1.8] text-[var(--night-copy)]">
            Find the tech you need, check store availability, and connect with
            the nearest iWarehouse branch before you visit.
          </p>
          <div className="mt-6 flex max-w-[330px] gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <MapPin className="size-4 shrink-0 text-brand" aria-hidden="true" />
            <div>
              <strong className="block text-[0.8rem]">Before you visit</strong>
              <p className="mt-1.5 mb-0 text-[0.72rem] leading-[1.7] text-[var(--night-copy)]">
                Stock and prices may change throughout the day. For the latest
                availability, we recommend confirming with your preferred
                iWarehouse store before heading out.
              </p>
            </div>
          </div>
        </div>

        <nav aria-label="Footer" className="contents">
          {linkColumns.map((column) => (
            <div key={column.heading}>
              <strong className="block text-[0.95rem]">{column.heading}</strong>
              <ul className="m-0 mt-5 flex list-none flex-col gap-4 p-0">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="flex items-center justify-between gap-3 rounded-sm text-[0.8rem] text-[var(--night-copy)] transition-colors hover:text-white"
                    >
                      {link.label}
                      <ChevronRight
                        className="size-3.5 shrink-0 text-[var(--brand-400)]"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-l border-white/10 pl-9 max-[980px]:col-span-2 max-[980px]:border-l-0 max-[980px]:pl-0 max-[680px]:col-span-1">
          <strong className="block text-[0.95rem]">Follow iWarehouse</strong>
          <ul className="m-0 mt-4 flex list-none gap-2.5 p-0">
            {socialLinks.map((social) => (
              <li key={social.network}>
                <a
                  href="#"
                  aria-label={`iWarehouse on ${social.label}`}
                  className="grid size-10 place-items-center rounded-full border border-white/15 text-white transition-colors hover:border-[var(--brand-a34)] hover:text-brand"
                >
                  <SocialIcon network={social.network} className="size-4" />
                </a>
              </li>
            ))}
          </ul>

          <strong className="mt-7 block border-t border-white/10 pt-6 text-[0.95rem]">
            Customer Assistance
          </strong>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <a
              href="#"
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2.5 text-[0.78rem] font-bold transition-colors hover:border-[var(--brand-a34)]"
            >
              <MessageCircle className="size-4 text-brand" aria-hidden="true" />
              Live Chat
            </a>
            {contactPhone ? (
              <a
                href={`tel:${contactPhone}`}
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2.5 text-[0.78rem] font-bold transition-colors hover:border-[var(--brand-a34)]"
              >
                <Phone className="size-4 text-brand" aria-hidden="true" />
                Call Us: {contactPhone}
              </a>
            ) : null}
          </div>

          <strong className="mt-7 block text-[0.88rem]">
            Get updates on new arrivals and offers
          </strong>
          <div className="mt-4">
            <NewsletterForm />
          </div>
        </div>
      </div>

      <div className="shell mt-12 flex flex-wrap items-center justify-between gap-x-8 gap-y-4 border-t border-white/10 pt-6 text-[0.75rem] text-[var(--night-copy)] max-[680px]:flex-col max-[680px]:items-start">
        <p className="m-0">
          © {new Date().getFullYear()} iWarehouse Corporation. All rights
          reserved.
        </p>
        {/* Plain anchors: none of these are app routes (placeholders + sitemap.xml). */}
        <nav aria-label="Legal" className="flex flex-wrap items-center">
          {legalLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="border-l border-white/15 px-4 transition-colors first:border-l-0 first:pl-0 last:pr-0 hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <p className="m-0 inline-flex items-center gap-2.5">
          Philippines / English
          <Globe className="size-4" aria-hidden="true" />
        </p>
      </div>
    </footer>
  );
}
