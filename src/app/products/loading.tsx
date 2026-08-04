import { Skeleton } from "@/components/ui/skeleton";

export default function ProductsLoading() {
  return (
    <section className="catalog-page shell" aria-busy="true" aria-label="Loading products">
      <Skeleton className="mb-9 h-12 w-78 max-w-full" />
      <div className="skeleton-grid">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton className="h-108 rounded-xl" key={index} />
        ))}
      </div>
    </section>
  );
}
