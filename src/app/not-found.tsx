import { PackageSearch } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="shell py-[78px] max-[680px]:py-[55px]">
      <div className="grid min-h-[380px] place-items-center content-center rounded-[17px] border border-dashed border-[var(--warm-300)] bg-white px-5 py-[55px] text-center">
        <span className="mb-[18px] grid h-[60px] min-w-[60px] place-items-center rounded-full bg-[var(--brand-50)] text-2xl font-extrabold text-primary">
          <PackageSearch className="size-6" aria-hidden="true" />
        </span>
        <h1 className="m-0 text-foreground">That product isn’t available</h1>
        <p className="mx-auto mt-2.5 mb-[22px] max-w-[500px] text-[0.85rem] leading-[1.7] text-muted-foreground">
          It may have sold out or moved out of customer-facing stock.
        </p>
        <Button asChild className="h-11 px-6 text-[0.83rem] font-extrabold">
          <Link href="/products">Browse available products</Link>
        </Button>
      </div>
    </section>
  );
}
