import { BrandMark } from "./brand-mark";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-[var(--warm-50)] pt-[52px] pb-[22px]">
      <div className="shell grid grid-cols-[1.3fr_1fr] gap-[100px] max-[680px]:grid-cols-1 max-[680px]:gap-[26px]">
        <div>
          <BrandMark />
          <p className="max-w-[470px] text-[0.78rem] leading-[1.75] text-muted-foreground">
            Browse current products available at iWarehouse stores and kiosks.
          </p>
        </div>
        <div>
          <strong className="text-[0.78rem]">Availability notice</strong>
          <p className="max-w-[470px] text-[0.78rem] leading-[1.75] text-muted-foreground">
            Stock and pricing are informational and may change before your store
            visit.
          </p>
        </div>
      </div>
      <div className="shell mt-[35px] border-t border-border pt-5 text-[0.68rem] text-[var(--warm-500)]">
        © {new Date().getFullYear()} iWarehouse by Ivenzzz
      </div>
    </footer>
  );
}
