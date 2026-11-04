import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Fills a positioned white container. Most products have no photo yet, so the
 * fallback is a quiet tile with the brand name. It is decorative because the
 * brand and product name are always in the text beside it.
 */
export function ProductPhoto({
  src,
  alt,
  brand,
  width,
  height,
  sizes,
  priority,
  className,
  fallbackClassName,
}: {
  src: string | null;
  alt: string;
  brand: string;
  width: number;
  height: number;
  sizes?: string;
  priority?: boolean;
  className?: string;
  fallbackClassName?: string;
}) {
  if (!src) {
    return (
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-3 grid place-items-center rounded-[14px] bg-(--canvas) px-4 text-center font-semibold text-[var(--warm-500)]",
          fallbackClassName,
        )}
      >
        {brand}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      priority={priority}
      unoptimized
      className={cn("size-full object-contain", className)}
    />
  );
}
