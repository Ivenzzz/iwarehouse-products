import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { StoreDirectoryViewModel } from "../model";

function storeReach(directory: StoreDirectoryViewModel | null): string {
  const locations = directory?.groups.flatMap((group) => group.locations) ?? [];
  if (locations.length === 0) {
    return "Our stores and kiosks, each with directions and contact details.";
  }

  const cities = new Set(
    locations.flatMap((location) => (location.city ? [location.city] : [])),
  ).size;
  const places =
    locations.length === 1
      ? "1 store or kiosk"
      : `${locations.length} stores and kiosks`;
  const across =
    cities > 0 ? ` across ${cities} ${cities === 1 ? "city" : "cities"}` : "";

  return `${places}${across}, each with directions and contact details.`;
}

/** The homepage's one bold moment: knowing which store has an item. */
export function StoreHighlights({
  directory,
}: {
  directory: StoreDirectoryViewModel | null;
}) {
  const cards = [
    {
      title: "See which store has it.",
      copy: "Every product page lists the stores that carry it, so you know where to go before you leave.",
      href: "/products",
      action: "Browse products",
    },
    {
      title: "Find a store.",
      copy: storeReach(directory),
      href: "/stores",
      action: "See all stores",
    },
  ];

  return (
    <section className="py-8 max-[680px]:py-6">
      <div className="shell grid grid-cols-2 gap-4 max-[680px]:grid-cols-1">
        {cards.map((card) => (
          <article
            className="flex min-h-[280px] flex-col items-start rounded-card bg-(--night) p-8 text-white max-[680px]:min-h-[240px] max-[680px]:p-6"
            key={card.href}
          >
            <h2 className="m-0 text-[1.75rem] leading-[1.15] font-bold tracking-[-0.02em] text-[var(--brand-400)] max-[680px]:text-[1.5rem]">
              {card.title}
            </h2>
            <p className="mt-3 mb-6 max-w-[42ch] text-base leading-[1.6] text-[var(--night-copy)]">
              {card.copy}
            </p>
            <Button asChild className="mt-auto h-10 px-5">
              <Link href={card.href}>{card.action}</Link>
            </Button>
          </article>
        ))}
      </div>
    </section>
  );
}
