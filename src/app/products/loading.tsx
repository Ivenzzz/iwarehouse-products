import { Skeleton } from "@/components/ui/skeleton";

export default function ProductsLoading() {
  return (
    <section
      className="shell py-14 max-[680px]:py-9"
      aria-busy="true"
      aria-label="Loading products"
    >
      <Skeleton className="mb-8 h-10 w-78 max-w-full rounded-xl" />
      <div className="grid grid-cols-3 gap-4 max-[1100px]:grid-cols-2 max-[680px]:grid-cols-1">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton className="h-96 rounded-card" key={index} />
        ))}
      </div>
    </section>
  );
}
