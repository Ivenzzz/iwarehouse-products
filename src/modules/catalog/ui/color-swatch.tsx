/** A dot in an approximate color. The color's name always sits beside it. */
export function ColorSwatch({ color }: { color: string }) {
  return (
    <span
      aria-hidden="true"
      className="size-3.5 shrink-0 rounded-full ring-1 ring-black/25"
      data-slot="swatch"
      style={{ backgroundColor: color }}
    />
  );
}
