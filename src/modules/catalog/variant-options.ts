import type { CatalogLocation, CatalogVariant } from "./model";
import { compareMemory, swatchColor } from "./presentation";

/**
 * Turns the ERP's flat variant list into the choices a shopper makes: rows of
 * options (condition, color, memory, then anything else that differs), plus the
 * offers those choices lead to. The selection is always a whole offer, so a
 * pairing that isn't in stock can never be selected.
 */

const NONE = "";
const NOT_SPECIFIED = "Not specified";

const CONDITION = "condition";
const COLOR = "color";
const MEMORY = "memory";
const BRAND_NEW = "brand new";

/** Fixed rather than read from the attributes, whose order isn't guaranteed. */
const OTHER_DIMENSIONS: Record<string, string> = {
  cpu: "Processor",
  gpu: "Graphics",
  ram_type: "RAM type",
  rom_type: "Storage type",
  operating_system: "Operating system",
  screen: "Screen",
};

export interface VariantOption {
  key: string;
  label: string;
  /** Only color options with a name have a swatch. */
  swatch: string | null;
}

export interface VariantRow {
  dimension: string;
  label: string;
  options: VariantOption[];
}

export interface VariantOffer {
  /** The cheapest variant among those that look identical to a shopper. */
  id: number;
  memberIds: number[];
  values: Record<string, string>;
  cashPriceFrom: number | null;
  srpPrice: number | null;
  imageUrl: string | null;
  locations: CatalogLocation[];
}

export interface VariantModel {
  /** Cheapest first, with unpriced offers last. */
  offers: VariantOffer[];
  rows: VariantRow[];
  /** Values every variant has in common, so there's nothing to choose. */
  sharedSpecs: string[];
  /** The condition when every variant has the same one. */
  condition: string | null;
  hasColors: boolean;
  labels: Map<string, Map<string, string>>;
}

function normalize(value: string | null | undefined): string {
  return (value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

function attributeValue(variant: CatalogVariant, key: string): string | null {
  return variant.attributes.find((item) => item.key === key)?.value ?? null;
}

function isAllCaps(value: string): boolean {
  return value === value.toUpperCase() && value !== value.toLowerCase();
}

/** Prefers "Black" over "BLACK", then the most used spelling, then A to Z. */
function pickSpelling(counts: Map<string, number>): string {
  return [...counts.entries()].sort(
    ([a, aCount], [b, bCount]) =>
      Number(isAllCaps(a)) - Number(isAllCaps(b)) ||
      bCount - aCount ||
      a.localeCompare(b),
  )[0][0];
}

class SpellingBook {
  private readonly entries = new Map<string, Map<string, Map<string, number>>>();

  add(dimension: string, value: string | null | undefined): string {
    const key = normalize(value);
    if (key === NONE) return NONE;

    const display = (value ?? "").trim().replace(/\s+/g, " ");
    const keys = this.entries.get(dimension) ?? new Map();
    const counts: Map<string, number> = keys.get(key) ?? new Map();
    counts.set(display, (counts.get(display) ?? 0) + 1);
    keys.set(key, counts);
    this.entries.set(dimension, keys);

    return key;
  }

  label(dimension: string, key: string): string {
    const counts = this.entries.get(dimension)?.get(key);
    return counts ? pickSpelling(counts) : NOT_SPECIFIED;
  }
}

function priceRank(price: number | null): number {
  // A zero price is placeholder data, so it ranks with unpriced variants.
  return price !== null && price > 0 ? price : Number.POSITIVE_INFINITY;
}

function compareOffers(
  a: { cashPriceFrom: number | null; id: number },
  b: { cashPriceFrom: number | null; id: number },
): number {
  const aRank = priceRank(a.cashPriceFrom);
  const bRank = priceRank(b.cashPriceFrom);
  return aRank === bRank ? a.id - b.id : aRank - bRank;
}

function otherDimensionKeys(variants: CatalogVariant[]): string[] {
  const present = new Set(
    variants.flatMap((variant) => variant.attributes.map((item) => item.key)),
  );
  ["color", "ram", "rom"].forEach((key) => present.delete(key));

  const known = Object.keys(OTHER_DIMENSIONS).filter((key) => present.has(key));
  const unknown = [...present].filter((key) => !(key in OTHER_DIMENSIONS));

  return [...known, ...unknown];
}

function buildOffers(
  variants: CatalogVariant[],
  valuesOf: (variant: CatalogVariant) => Record<string, string>,
  dimensions: string[],
): VariantOffer[] {
  const groups = new Map<string, CatalogVariant[]>();

  for (const variant of [...variants].sort(compareOffers)) {
    const values = valuesOf(variant);
    const signature = JSON.stringify(dimensions.map((key) => values[key]));
    groups.set(signature, [...(groups.get(signature) ?? []), variant]);
  }

  return [...groups.values()]
    .map((members) => {
      const cheapest = members[0];
      const locations = new Map(
        members.flatMap((member) =>
          member.locations.map((location) => [location.id, location] as const),
        ),
      );

      return {
        id: cheapest.id,
        memberIds: members.map((member) => member.id),
        values: valuesOf(cheapest),
        cashPriceFrom: cheapest.cashPriceFrom,
        srpPrice: cheapest.srpPrice,
        imageUrl: members.find((member) => member.imageUrl)?.imageUrl ?? null,
        locations: [...locations.values()],
      };
    })
    .sort(compareOffers);
}

export function buildVariantModel(variants: CatalogVariant[]): VariantModel {
  const spellings = new SpellingBook();
  const otherKeys = otherDimensionKeys(variants);
  const otherLabels = new Map<string, string>();
  const ramKeys = new Set<string>();
  const memoryParts = new Map<string, { ram: string; rom: string }>();
  const valuesById = new Map<number, Record<string, string>>();

  for (const variant of variants) {
    const ram = spellings.add("ram", attributeValue(variant, "ram"));
    const rom = spellings.add("rom", attributeValue(variant, "rom"));
    const memory = ram === NONE && rom === NONE ? NONE : `${ram}|${rom}`;
    ramKeys.add(ram);
    if (memory !== NONE) memoryParts.set(memory, { ram, rom });

    const values: Record<string, string> = {
      [CONDITION]: spellings.add(CONDITION, variant.condition),
      [COLOR]: spellings.add(COLOR, attributeValue(variant, "color")),
      [MEMORY]: memory,
    };
    for (const key of otherKeys) {
      values[key] = spellings.add(key, attributeValue(variant, key));
      const attribute = variant.attributes.find((item) => item.key === key);
      if (attribute) otherLabels.set(key, attribute.label);
    }
    valuesById.set(variant.id, values);
  }

  const dimensions = [CONDITION, COLOR, MEMORY, ...otherKeys];
  const sharedRam =
    ramKeys.size === 1 && !ramKeys.has(NONE) ? [...ramKeys][0] : null;

  const labels = new Map<string, Map<string, string>>();
  const distinctKeys = (dimension: string) => [
    ...new Set(variants.map((item) => valuesById.get(item.id)![dimension])),
  ];

  const memoryLabel = (key: string): string => {
    const { ram, rom } = memoryParts.get(key)!;
    if (ram === sharedRam && rom !== NONE) return spellings.label("rom", rom);
    return [ram, rom]
      .map((part, index) =>
        part === NONE ? null : spellings.label(index === 0 ? "ram" : "rom", part),
      )
      .filter(Boolean)
      .join("/");
  };

  const rows: VariantRow[] = [];
  const sharedSpecs: string[] = [];
  let condition: string | null = null;

  for (const dimension of dimensions) {
    const keys = distinctKeys(dimension);
    const labelFor = (key: string): string => {
      if (key === NONE) return NOT_SPECIFIED;
      return dimension === MEMORY
        ? memoryLabel(key)
        : spellings.label(dimension, key);
    };
    labels.set(dimension, new Map(keys.map((key) => [key, labelFor(key)])));

    if (keys.length > 1) {
      rows.push({
        dimension,
        label:
          dimension === CONDITION
            ? "Condition"
            : dimension === COLOR
              ? "Color"
              : dimension === MEMORY
                ? "Memory"
                : (OTHER_DIMENSIONS[dimension] ?? otherLabels.get(dimension) ?? dimension),
        options: sortKeys(dimension, keys, memoryParts).map((key) => ({
          key,
          label: labelFor(key),
          swatch:
            dimension === COLOR && key !== NONE
              ? swatchColor(labelFor(key))
              : null,
        })),
      });
    }

    if (keys.length === 1 && keys[0] !== NONE) {
      if (dimension === CONDITION) {
        condition = labelFor(keys[0]);
      } else if (dimension === MEMORY) {
        const { ram, rom } = memoryParts.get(keys[0])!;
        if (ram !== NONE) sharedSpecs.push(`${spellings.label("ram", ram)} RAM`);
        if (rom !== NONE) sharedSpecs.push(`${spellings.label("rom", rom)} storage`);
      } else {
        sharedSpecs.push(labelFor(keys[0]));
      }
    }

    if (dimension === MEMORY && keys.length > 1 && sharedRam) {
      sharedSpecs.push(`${spellings.label("ram", sharedRam)} RAM`);
    }
  }

  return {
    offers: buildOffers(variants, (item) => valuesById.get(item.id)!, dimensions),
    rows,
    sharedSpecs,
    condition,
    hasColors: distinctKeys(COLOR).some((key) => key !== NONE),
    labels,
  };
}

function sortKeys(
  dimension: string,
  keys: string[],
  memoryParts: Map<string, { ram: string; rom: string }>,
): string[] {
  const named = keys.filter((key) => key !== NONE);
  const missing = keys.filter((key) => key === NONE);

  if (dimension === MEMORY) {
    named.sort((a, b) =>
      compareMemory(
        nullableParts(memoryParts.get(a)!),
        nullableParts(memoryParts.get(b)!),
      ),
    );
  } else if (dimension === CONDITION) {
    named.sort(
      (a, b) =>
        Number(b === BRAND_NEW) - Number(a === BRAND_NEW) || a.localeCompare(b),
    );
  }

  return [...named, ...missing];
}

function nullableParts({ ram, rom }: { ram: string; rom: string }) {
  return { ram: ram === NONE ? null : ram, rom: rom === NONE ? null : rom };
}

/** A known variant ID, including a merged one, or else the cheapest offer. */
export function resolveOffer(
  model: VariantModel,
  rawId: string | null | undefined,
): VariantOffer | null {
  const id = rawId && /^\d+$/.test(rawId) ? Number(rawId) : null;

  return (
    model.offers.find((offer) => id !== null && offer.memberIds.includes(id)) ??
    model.offers[0] ??
    null
  );
}

/** True when choosing this value would have to change another row. */
export function isDimmed(
  model: VariantModel,
  selected: VariantOffer,
  dimension: string,
  key: string,
): boolean {
  const others = model.rows
    .map((row) => row.dimension)
    .filter((other) => other !== dimension);

  return !model.offers.some(
    (offer) =>
      offer.values[dimension] === key &&
      others.every((other) => offer.values[other] === selected.values[other]),
  );
}

function labelOf(
  model: VariantModel,
  dimension: string,
  key: string,
): string | null {
  return key === NONE ? null : (model.labels.get(dimension)?.get(key) ?? null);
}

function switchNote(
  model: VariantModel,
  dimension: string,
  key: string,
  selected: VariantOffer,
  offer: VariantOffer,
  candidates: VariantOffer[],
): string | null {
  const changed = model.rows
    .map((row) => row.dimension)
    .filter(
      (other) =>
        other !== dimension && offer.values[other] !== selected.values[other],
    );
  if (changed.length === 0) return null;

  const labelsFor = (source: VariantOffer) =>
    changed.flatMap((other) => labelOf(model, other, source.values[other]) ?? []);
  const newLabels = labelsFor(offer).join(", ");
  const oldLabels = labelsFor(selected).join(", ");
  const clicked = labelOf(model, dimension, key);

  if (!clicked) return newLabels ? `Showing ${newLabels}.` : null;

  const isOnlyChoice = changed.every((other) =>
    candidates.every(
      (candidate) => candidate.values[other] === offer.values[other],
    ),
  );
  if (isOnlyChoice && newLabels) {
    return `${clicked} is only in stock in ${newLabels}.`;
  }

  const missing = oldLabels
    ? `${clicked} isn't in stock in ${oldLabels}.`
    : `${clicked} isn't in stock with your other choices.`;
  return newLabels ? `${missing} Showing ${newLabels}.` : missing;
}

/**
 * Selects a value and moves the other rows as little as possible: keep the
 * condition, change the fewest rows, prefer changing later rows, then lowest
 * price and ID (offers are already in that order).
 */
export function selectOption(
  model: VariantModel,
  selected: VariantOffer,
  dimension: string,
  key: string,
): { offer: VariantOffer; note: string | null } {
  const candidates = model.offers.filter(
    (offer) => offer.values[dimension] === key,
  );
  if (selected.values[dimension] === key || candidates.length === 0) {
    return { offer: selected, note: null };
  }

  const others = model.rows
    .map((row) => row.dimension)
    .filter((other) => other !== dimension);
  const rank = (offer: VariantOffer): number[] => {
    const changed = others.flatMap((other, index) =>
      offer.values[other] === selected.values[other] ? [] : [index],
    );
    return [
      others.includes(CONDITION) &&
      offer.values[CONDITION] !== selected.values[CONDITION]
        ? 1
        : 0,
      changed.length,
      changed.length > 0 ? -changed[0] : Number.NEGATIVE_INFINITY,
    ];
  };

  let offer = candidates[0];
  for (const candidate of candidates.slice(1)) {
    const best = rank(offer);
    const next = rank(candidate);
    const difference = next.map((value, index) => value - best[index]);
    if ((difference.find((value) => value !== 0) ?? 0) < 0) offer = candidate;
  }

  return {
    offer,
    note: switchNote(model, dimension, key, selected, offer, candidates),
  };
}

/** The choices that identify this offer, for example "Black, 256GB". */
export function describeOffer(model: VariantModel, offer: VariantOffer): string {
  return model.rows
    .flatMap(
      (row) => labelOf(model, row.dimension, offer.values[row.dimension]) ?? [],
    )
    .join(", ");
}

export function offerColor(model: VariantModel, offer: VariantOffer): string | null {
  return labelOf(model, COLOR, offer.values[COLOR]);
}
