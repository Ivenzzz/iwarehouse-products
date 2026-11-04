import Image from "next/image";
import Link from "next/link";

// Declared locally — src/components must not import feature modules.
export interface BrandLogo {
  url: string;
  name: string;
}

export function BrandMark({
  logo,
  tagline = "Products",
}: {
  logo?: BrandLogo | null;
  tagline?: string;
}) {
  if (logo) {
    return (
      <Link
        className="inline-flex items-center leading-none"
        href="/"
        aria-label="iWarehouse home"
      >
        <Image
          src={logo.url}
          alt={logo.name || "iWarehouse"}
          width={132}
          height={32}
          className="h-8 w-auto object-contain"
        />
      </Link>
    );
  }

  return (
    <Link
      className="inline-flex items-center gap-2.5 leading-none"
      href="/"
      aria-label="iWarehouse home"
    >
      <span
        className="grid size-8 place-items-center rounded-[9px_4px_9px_4px] bg-linear-[145deg,var(--night-raised),var(--night)] text-[0.72rem] font-bold tracking-[-0.04em] text-brand"
        aria-hidden="true"
      >
        iW
      </span>
      <span>
        <strong className="block text-[0.95rem] font-bold tracking-[-0.02em]">
          <i className="not-italic text-brand">i</i>Warehouse
        </strong>
        <small className="mt-0.5 block text-[0.6875rem] text-muted-foreground">
          {tagline}
        </small>
      </span>
    </Link>
  );
}
