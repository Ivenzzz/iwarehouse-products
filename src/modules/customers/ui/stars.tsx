import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stars({ rating, className }: { rating: number; className?: string }) {
  const rounded = Math.round(rating);

  return (
    <span
      role="img"
      aria-label={`${rating} out of 5 stars`}
      className={cn("inline-flex items-center gap-0.5", className)}
    >
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          aria-hidden="true"
          className={cn(
            "size-4",
            value <= rounded
              ? "fill-[var(--brand-500)] text-[var(--brand-600)]"
              : "fill-transparent text-[var(--warm-500)]",
          )}
        />
      ))}
    </span>
  );
}
