import { swatchColor } from "../presentation";
import { ColorSwatch } from "./color-swatch";
import { ProductPhoto } from "./product-photo";

/**
 * The selected variant's photo. A color without a photo gets a neutral tile,
 * never another color's photo, so shoppers don't mistake what they're seeing.
 */
export function VariantVisual({
  src,
  name,
  brand,
  color,
}: {
  src: string | null;
  name: string;
  brand: string;
  color: string | null;
}) {
  return (
    <div className="sticky top-20 aspect-square overflow-hidden rounded-card bg-white shadow-(--shadow-sm) max-[980px]:relative max-[980px]:top-auto max-[980px]:h-[40svh] max-[980px]:min-h-56 max-[980px]:max-w-full max-[980px]:justify-self-center">
      {src ? (
        <ProductPhoto
          src={src}
          alt={color ? `${name} in ${color}` : name}
          brand={brand}
          width={900}
          height={900}
          sizes="(max-width: 980px) 100vw, 600px"
          priority
        />
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-3 grid place-content-center justify-items-center gap-2 rounded-[14px] bg-(--canvas) px-4 text-center"
          data-slot="variant-tile"
        >
          <span className="text-2xl font-semibold text-[var(--warm-500)]">
            {brand}
          </span>
          {color ? (
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--warm-600)]">
              <ColorSwatch color={swatchColor(color)} />
              {color}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}
