import { ExternalLink, Phone, Store } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import type { StoreDirectoryViewModel } from "../model";
import { directionsUrl } from "../presentation";

const typeLabels: Record<string, string> = {
  store: "Store",
  kiosk: "Kiosk",
};

export function StoreDirectoryView({
  directory,
}: {
  directory: StoreDirectoryViewModel;
}) {
  return (
    <section className="shell py-14 max-[680px]:py-9">
      <SectionHeading
        as="h1"
        title="Our stores"
      />
      <p className="mt-4 mb-0 max-w-[65ch] text-base leading-[1.6] text-muted-foreground">
        Availability is informational and does not reserve an item — contact the
        store before visiting.
      </p>

      {directory.groups.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-2 rounded-card bg-card p-12 text-center shadow-(--shadow-sm)">
          <Store
            className="size-8 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="m-0 text-base font-bold">No stores published yet</p>
          <p className="m-0 text-sm text-muted-foreground">
            Check back soon — locations appear here as they open.
          </p>
        </div>
      ) : (
        directory.groups.map((group) => (
          <div className="mt-10" key={group.city}>
            <h2 className="m-0 mb-4 text-xl font-bold tracking-[-0.02em]">
              {group.city}
            </h2>
            <div className="grid grid-cols-2 gap-4 max-[980px]:grid-cols-1">
              {group.locations.map((location) => (
                <article
                  className="flex flex-col gap-2.5 rounded-card bg-card p-5 shadow-(--shadow-sm)"
                  key={location.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <strong className="text-base font-semibold">
                      {location.name}
                    </strong>
                    <Badge variant="secondary" className="shrink-0">
                      {typeLabels[location.type] ?? location.type}
                    </Badge>
                  </div>
                  <p className="m-0 text-sm leading-[1.5] text-muted-foreground">
                    {location.address || group.city}
                  </p>
                  {location.phone ? (
                    <p className="m-0 text-sm font-semibold">
                      {location.phone}
                    </p>
                  ) : null}
                  <div className="mt-auto flex flex-wrap gap-2 pt-2">
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
                        Get directions
                        <ExternalLink data-icon="inline-end" />
                      </a>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="text-primary"
                    >
                      <Link href={`/products?location=${location.id}`}>
                        Browse stock
                      </Link>
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))
      )}
    </section>
  );
}
