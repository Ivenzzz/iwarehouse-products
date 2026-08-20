import { ExternalLink, MapPin, Phone, Store } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    <section className="shell py-[78px] max-[680px]:py-[55px]">
      <p className="eyebrow">Visit us</p>
      <h1 className="m-0 text-[clamp(2rem,3.4vw,2.9rem)] tracking-[-0.05em]">
        Our stores
      </h1>
      <p className="mt-3 mb-0 max-w-[650px] leading-[1.7] text-[var(--warm-600)]">
        Every iWarehouse store and kiosk, with contact details and directions.
        Availability is informational and does not reserve an item — contact
        the store before visiting.
      </p>

      {directory.groups.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-white p-12 text-center">
          <Store
            className="size-8 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="m-0 text-[0.9rem] font-bold">
            No stores published yet
          </p>
          <p className="m-0 text-[0.8rem] text-muted-foreground">
            Check back soon — locations appear here as they open.
          </p>
        </div>
      ) : (
        directory.groups.map((group) => (
          <div className="mt-11" key={group.city}>
            <h2 className="m-0 mb-4 flex items-center gap-2 text-[1.15rem] tracking-[-0.03em]">
              <MapPin className="size-4 text-brand" aria-hidden="true" />
              {group.city}
            </h2>
            <div className="grid grid-cols-2 gap-4 max-[980px]:grid-cols-1">
              {group.locations.map((location) => (
                <article
                  className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-5 shadow-(--shadow-sm)"
                  key={location.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <strong className="text-[0.95rem]">{location.name}</strong>
                    <Badge variant="secondary" className="shrink-0">
                      {typeLabels[location.type] ?? location.type}
                    </Badge>
                  </div>
                  <p className="m-0 text-[0.78rem] leading-[1.6] text-muted-foreground">
                    {location.address || group.city}
                  </p>
                  {location.phone ? (
                    <p className="m-0 text-[0.78rem] font-bold text-[var(--warm-700)]">
                      {location.phone}
                    </p>
                  ) : null}
                  <div className="mt-auto flex flex-wrap gap-2 pt-1">
                    {location.phone ? (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="font-extrabold text-primary"
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
                      className="font-extrabold text-primary"
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
                      className="font-extrabold text-primary"
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
