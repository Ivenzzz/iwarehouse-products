import { Skeleton } from "@/components/ui/skeleton";

export default function ProductsLoading() {
  return (
    <section
      className="shell bg-(--canvas) py-[78px] max-[680px]:py-[55px]"
      aria-busy="true"
      aria-label="Loading products"
    >
      <Skeleton className="mb-9 h-12 w-78 max-w-full" />
      <div className="grid grid-cols-3 gap-5 max-[980px]:grid-cols-2 max-[680px]:grid-cols-1">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton className="h-108 rounded-xl" key={index} />
        ))}
      </div>
    </section>
  );
}
