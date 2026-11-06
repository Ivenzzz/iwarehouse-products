import { cn } from "@/lib/utils";
import {
  isDimmed,
  type VariantModel,
  type VariantOffer,
  type VariantRow,
} from "../variant-options";
import { ColorSwatch } from "./color-swatch";

function OptionRow({
  row,
  model,
  selected,
  onSelect,
}: {
  row: VariantRow;
  model: VariantModel;
  selected: VariantOffer;
  onSelect: (dimension: string, key: string) => void;
}) {
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="mb-2 p-0 text-sm font-semibold">{row.label}</legend>
      <div className="flex flex-wrap gap-2">
        {row.options.map((option) => {
          const checked = selected.values[row.dimension] === option.key;
          const dimmed = isDimmed(model, selected, row.dimension, option.key);

          return (
            <label
              className={cn(
                "relative inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border bg-card px-4 text-sm font-semibold has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring max-[680px]:min-h-11",
                checked &&
                  "border-[var(--brand-600)] bg-brand text-primary-foreground",
                !checked &&
                  !dimmed &&
                  "border-border hover:border-[var(--warm-300)]",
                dimmed &&
                  "border-dashed border-[var(--warm-300)] text-[var(--warm-500)] hover:border-[var(--warm-500)]",
              )}
              key={option.key}
            >
              <input
                checked={checked}
                className="sr-only"
                name={`variant-${row.dimension}`}
                onChange={() => onSelect(row.dimension, option.key)}
                type="radio"
                value={option.key}
              />
              {option.swatch ? <ColorSwatch color={option.swatch} /> : null}
              {option.label}
              {dimmed ? (
                <span className="sr-only">
                  (not in stock with your other choices)
                </span>
              ) : null}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function VariantPicker({
  model,
  selected,
  note,
  onSelect,
}: {
  model: VariantModel;
  selected: VariantOffer;
  note: string | null;
  onSelect: (dimension: string, key: string) => void;
}) {
  return (
    <div className="grid gap-5">
      {model.condition ? (
        <p className="m-0 text-sm font-semibold">{model.condition}</p>
      ) : null}
      {model.rows.map((row) => (
        <OptionRow
          key={row.dimension}
          model={model}
          onSelect={onSelect}
          row={row}
          selected={selected}
        />
      ))}
      {note ? (
        <p className="m-0 text-sm font-medium text-[var(--warm-700)]">{note}</p>
      ) : null}
      {model.sharedSpecs.length > 0 ? (
        <p className="m-0 text-sm leading-[1.5] text-muted-foreground">
          {model.sharedSpecs.join(", ")}
        </p>
      ) : null}
    </div>
  );
}
