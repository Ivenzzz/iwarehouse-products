import { PackageSearch } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="page-section shell">
      <div className="empty-state">
        <span>
          <PackageSearch className="size-6" aria-hidden="true" />
        </span>
        <h1>That product isn’t available</h1>
        <p>It may have sold out or moved out of customer-facing stock.</p>
        <Button asChild className="h-11 px-6 text-[0.83rem] font-extrabold">
          <Link href="/products">Browse available products</Link>
        </Button>
      </div>
    </section>
  );
}
