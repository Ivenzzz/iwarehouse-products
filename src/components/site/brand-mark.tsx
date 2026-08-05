import Link from "next/link";

export function BrandMark() {
  return (
    <Link
      className="inline-flex items-center gap-[11px] leading-none"
      href="/"
      aria-label="iWarehouse home"
    >
      <span
        className="grid size-[39px] place-items-center rounded-[11px_5px_11px_5px] bg-linear-[145deg,var(--warm-800),var(--warm-900)] text-[0.83rem] font-black tracking-[-0.07em] text-brand shadow-(--shadow-sm)"
        aria-hidden="true"
      >
        iW
      </span>
      <span>
        <strong className="block text-[1.02rem] tracking-[-0.04em]">
          <i className="not-italic text-brand">i</i>Warehouse
        </strong>
        <small className="mt-1 block text-[0.62rem] font-bold tracking-[0.15em] text-muted-foreground uppercase">
          Products
        </small>
      </span>
    </Link>
  );
}
