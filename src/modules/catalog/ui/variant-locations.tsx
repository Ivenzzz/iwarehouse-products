import { ExternalLink, Phone } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import type { CatalogLocation } from "../model";
import { directionsUrl, locationCountLabel } from "../presentation";

function headingFor(summary: string, count: number): string {
  if (count === 0) {
    return summary
      ? `${summary} isn't listed at any location`
      : "Not listed at any location";
  }

  const locations = locationCountLabel(count);
  return summary ? `${summary} is at ${locations}` : `Available at ${locations}`;
}

export function VariantLocations({
  summary,
  locations,
}: {
  summary: string;
  locations: CatalogLocation[];
}) {
  return (
    <section className="mt-8" id="locations">
      <SectionHeading
        title={headingFor(summary, locations.length)}
        className="mb-4 text-xl max-[680px]:text-xl"
      />
      {locations.length > 0 ? (
        <ul className="m-0 list-none divide-y divide-border rounded-card bg-card p-0 shadow-(--shadow-sm)">
          {locations.map((location) => (
            <li
              className="flex items-center justify-between gap-5 p-4 max-[680px]:flex-col max-[680px]:items-start max-[680px]:gap-3"
              key={location.id}
            >
              <div>
                <strong className="text-sm font-semibold">
                  {location.name}
                </strong>
                <p className="mt-1 mb-0 text-xs leading-[1.5] text-muted-foreground">
                  {location.address || location.city}
                </p>
              </div>
              <div className="flex shrink-0 gap-2 max-[680px]:w-full max-[680px]:[&_a]:h-11 max-[680px]:[&_a]:flex-1">
                {location.phone ? (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="text-primary"
                  >
                    <a href={`tel:${location.phone}`}>
                      <Phone data-icon="inline-start" />
                      Call
                    </a>
                  </Button>
                ) : null}
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="text-primary"
                >
                  <a
                    href={directionsUrl(location)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Directions
                    <ExternalLink data-icon="inline-end" />
                  </a>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="m-0 text-sm text-muted-foreground">
          <Link className="font-semibold text-primary underline" href="/stores">
            Contact a store
          </Link>{" "}
          to check whether it has one.
        </p>
      )}
      <p className="mt-3 mb-0 text-xs leading-[1.6] text-[var(--warm-500)]">
        Availability is informational and does not reserve an item. Contact the
        store before visiting.
      </p>
    </section>
  );
}
