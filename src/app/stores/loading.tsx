import { Skeleton } from "@/components/ui/skeleton";

export default function StoresLoading() {
  return (
    <section
      className="shell py-14 max-[680px]:py-9"
      aria-busy="true"
      aria-label="Loading stores"
    >
      <Skeleton className="mb-8 h-10 w-78 max-w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-4 max-[980px]:grid-cols-1">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton className="h-44 rounded-card" key={index} />
        ))}
      </div>
    </section>
  );
}
