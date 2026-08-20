import Image from "next/image";
import Link from "next/link";

// Declared locally — src/components must not import feature modules.
export interface BrandLogo {
  url: string;
  name: string;
}

export function BrandMark({
  logo,
  tone = "light",
  tagline = "Products",
}: {
  logo?: BrandLogo | null;
  tone?: "light" | "dark";
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
          width={160}
          height={39}
          className="h-[39px] w-auto object-contain"
        />
      </Link>
    );
  }

  return (
    <Link
      className="inline-flex items-center gap-[11px] leading-none"
      href="/"
      aria-label="iWarehouse home"
    >
      <span
        className={`grid size-[39px] place-items-center rounded-[11px_5px_11px_5px] bg-linear-[145deg,var(--warm-800),var(--warm-900)] text-[0.83rem] font-black tracking-[-0.07em] text-brand shadow-(--shadow-sm) ${
          tone === "dark" ? "border border-white/10" : ""
        }`}
        aria-hidden="true"
      >
        iW
      </span>
      <span>
        <strong
          className={`block text-[1.02rem] tracking-[-0.04em] ${
            tone === "dark" ? "text-white" : ""
          }`}
        >
          <i className="not-italic text-brand">i</i>Warehouse
        </strong>
        <small
          className={`mt-1 block text-[0.62rem] font-bold tracking-[0.15em] uppercase ${
            tone === "dark" ? "text-[var(--brand-400)]" : "text-muted-foreground"
          }`}
        >
          {tagline}
        </small>
      </span>
    </Link>
  );
}
