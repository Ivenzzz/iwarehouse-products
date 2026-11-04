import { PackageSearch } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="shell py-16 max-[680px]:py-12">
      <div className="grid min-h-[380px] place-items-center content-center rounded-card bg-card px-5 py-[55px] text-center shadow-(--shadow-sm)">
        <span className="mb-[18px] grid h-[60px] min-w-[60px] place-items-center rounded-full bg-[var(--brand-50)] text-primary">
          <PackageSearch className="size-6" aria-hidden="true" />
        </span>
        <h1 className="m-0 text-xl font-bold tracking-[-0.02em] text-foreground">
          That product isn’t available
        </h1>
        <p className="mx-auto mt-2.5 mb-[22px] max-w-[500px] text-sm leading-[1.7] text-muted-foreground">
          It may have sold out or moved out of customer-facing stock.
        </p>
        <Button asChild className="h-11 px-6">
          <Link href="/products">Browse available products</Link>
        </Button>
      </div>
    </section>
  );
}
