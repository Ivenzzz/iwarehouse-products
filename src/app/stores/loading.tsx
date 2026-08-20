import { Skeleton } from "@/components/ui/skeleton";

export default function StoresLoading() {
  return (
    <section
      className="shell py-[78px] max-[680px]:py-[55px]"
      aria-busy="true"
      aria-label="Loading stores"
    >
      <Skeleton className="mb-9 h-12 w-78 max-w-full" />
      <div className="grid grid-cols-2 gap-4 max-[980px]:grid-cols-1">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton className="h-44 rounded-2xl" key={index} />
        ))}
      </div>
    </section>
  );
}
