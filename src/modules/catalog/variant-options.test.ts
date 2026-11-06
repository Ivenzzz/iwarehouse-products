import { describe, expect, it } from "vitest";
import type { CatalogLocation, CatalogVariant } from "./model";
import {
  buildVariantModel,
  describeOffer,
  isDimmed,
  offerColor,
  resolveOffer,
  selectOption,
  type VariantModel,
  type VariantOffer,
} from "./variant-options";

function store(id: number): CatalogLocation {
  return {
    id,
    name: `Store ${id}`,
    type: "store",
    address: `Address ${id}`,
    city: "Bacolod",
    phone: null,
    latitude: null,
    longitude: null,
  };
}

let nextId = 1;

function variant(
  attributes: Record<string, string | null>,
  overrides: Partial<CatalogVariant> = {},
): CatalogVariant {
  const id = overrides.id ?? nextId++;
  return {
    id,
    name: `Variant ${id}`,
    condition: "Brand New",
    attributes: Object.entries(attributes).map(([key, value]) => ({
      key,
      label: key.toUpperCase(),
      value,
    })),
    imageUrl: null,
    cashPriceFrom: 1000 + id,
    srpPrice: null,
    locations: [store(1)],
    ...overrides,
  };
}

function iphone(color: string, rom: string, overrides: Partial<CatalogVariant> = {}) {
  return variant(
    { color, ram: "12GB", rom, cpu: "Apple A20 Pro", gpu: "Apple 7-core GPU" },
    overrides,
  );
}

function offerWith(
  model: VariantModel,
  values: Record<string, string>,
): VariantOffer {
  const offer = model.offers.find((item) =>
    Object.entries(values).every(([key, value]) => item.values[key] === value),
  );
  if (!offer) throw new Error(`No offer for ${JSON.stringify(values)}`);
  return offer;
}

function rowLabels(model: VariantModel, dimension: string) {
  return model.rows
    .find((row) => row.dimension === dimension)
    ?.options.map((option) => option.label);
}

describe("buildVariantModel", () => {
  it("collapses the iPhone list into color and storage rows", () => {
    const model = buildVariantModel([
      iphone("Black", "256GB"),
      iphone("Silver", "256GB"),
      iphone("Glacier", "256GB"),
      iphone("Burgundy", "256GB"),
      iphone("Black", "512GB"),
      iphone("Silver", "512GB"),
      iphone("Glacier", "512GB"),
      iphone("Glacier", "1TB"),
    ]);

    expect(model.rows.map((row) => row.label)).toEqual(["Color", "Memory"]);
    expect(rowLabels(model, "color")).toEqual([
      "Black",
      "Silver",
      "Glacier",
      "Burgundy",
    ]);
    expect(rowLabels(model, "memory")).toEqual(["256GB", "512GB", "1TB"]);
    expect(model.sharedSpecs).toEqual([
      "12GB RAM",
      "Apple A20 Pro",
      "Apple 7-core GPU",
    ]);
    expect(model.condition).toBe("Brand New");
  });

  it("keeps RAM in the chip when it varies, sorted by real size", () => {
    const model = buildVariantModel([
      variant({ ram: "12GB", rom: "1TB" }),
      variant({ ram: "8GB", rom: "256GB" }),
      variant({ ram: "12GB", rom: "256GB" }),
    ]);

    expect(rowLabels(model, "memory")).toEqual([
      "8GB/256GB",
      "12GB/256GB",
      "12GB/1TB",
    ]);
    expect(model.sharedSpecs).toEqual([]);
  });

  it("shows a single memory option as specs instead of a row", () => {
    const model = buildVariantModel([
      variant({ color: "Black", ram: "8GB", rom: "256GB" }),
      variant({ color: "White", ram: "8GB", rom: "256GB" }),
    ]);

    expect(model.rows.map((row) => row.label)).toEqual(["Color"]);
    expect(model.sharedSpecs).toEqual(["8GB RAM", "256GB storage"]);
  });

  it("puts condition first, Brand New before others, only when both exist", () => {
    const model = buildVariantModel([
      variant({ color: "Black" }, { condition: "Certified Pre-Owned" }),
      variant({ color: "Black" }, { condition: "Brand New" }),
    ]);

    expect(model.rows[0].label).toBe("Condition");
    expect(rowLabels(model, "condition")).toEqual([
      "Brand New",
      "Certified Pre-Owned",
    ]);
    expect(model.condition).toBeNull();
  });

  it("adds a row for any other attribute that differs", () => {
    const model = buildVariantModel([
      variant({ ram: "16GB", rom: "512GB", cpu: "Core i5", gpu: "Iris Xe" }),
      variant({ ram: "16GB", rom: "512GB", cpu: "Core i7", gpu: "Iris Xe" }),
    ]);

    expect(model.rows.map((row) => row.label)).toEqual(["Processor"]);
    expect(model.sharedSpecs).toEqual(["16GB RAM", "512GB storage", "Iris Xe"]);
  });

  it("does not depend on the order of the attributes", () => {
    const model = buildVariantModel([
      variant({ rom: "256GB", ram: "8GB", color: "Black" }),
      variant({ color: "White", ram: "8GB", rom: "512GB" }),
    ]);

    expect(model.rows.map((row) => row.label)).toEqual(["Color", "Memory"]);
  });

  it("uses an attribute's own label when it isn't a known one", () => {
    const model = buildVariantModel([
      variant({ wattage: "20W" }),
      variant({ wattage: "30W" }),
    ]);

    expect(model.rows[0].label).toBe("WATTAGE");
  });

  it("merges values that differ only by case, keeping the readable spelling", () => {
    const model = buildVariantModel([
      variant({ color: "BLACK", rom: "256GB" }, { id: 501 }),
      variant({ color: "Black", rom: "512GB" }, { id: 502 }),
    ]);

    expect(rowLabels(model, "color")).toBeUndefined();
    expect(model.sharedSpecs).toContain("Black");
    expect(rowLabels(model, "memory")).toEqual(["256GB", "512GB"]);
  });

  it("merges identical variants into the lowest price and all their stores", () => {
    const model = buildVariantModel([
      variant(
        { color: "Black", rom: "256GB" },
        { id: 601, cashPriceFrom: 900, locations: [store(1)] },
      ),
      variant(
        { color: "black", rom: "256GB" },
        { id: 602, cashPriceFrom: 800, locations: [store(1), store(2)] },
      ),
    ]);

    expect(model.offers).toHaveLength(1);
    expect(model.offers[0]).toMatchObject({
      id: 602,
      memberIds: [602, 601],
      cashPriceFrom: 800,
    });
    expect(model.offers[0].locations.map((item) => item.id)).toEqual([1, 2]);
    expect(resolveOffer(model, "601")?.id).toBe(602);
    expect(resolveOffer(model, "602")?.id).toBe(602);
  });

  it("offers 'Not specified' when only some variants have a value", () => {
    const model = buildVariantModel([
      variant({ color: "Black" }),
      variant({ color: null }),
    ]);

    expect(rowLabels(model, "color")).toEqual(["Black", "Not specified"]);
    expect(model.rows[0].options[1].swatch).toBeNull();
    expect(model.rows[0].options[0].swatch).not.toBeNull();
    expect(model.hasColors).toBe(true);
  });

  it("has no rows for a single variant", () => {
    const model = buildVariantModel([iphone("Black", "256GB")]);

    expect(model.rows).toEqual([]);
    expect(model.sharedSpecs).toEqual([
      "Black",
      "12GB RAM",
      "256GB storage",
      "Apple A20 Pro",
      "Apple 7-core GPU",
    ]);
  });

  it("merges variants with no attributes and reports no colors", () => {
    const model = buildVariantModel([variant({}), variant({})]);

    expect(model.rows).toEqual([]);
    expect(model.offers).toHaveLength(1);
    expect(model.hasColors).toBe(false);
  });

  it("handles a product with no variants", () => {
    const model = buildVariantModel([]);

    expect(model.offers).toEqual([]);
    expect(resolveOffer(model, null)).toBeNull();
  });
});

describe("resolveOffer", () => {
  const cheap = variant({ rom: "256GB" }, { id: 702, cashPriceFrom: 500 });
  const dear = variant({ rom: "512GB" }, { id: 701, cashPriceFrom: 900 });
  const model = buildVariantModel([dear, cheap]);

  it("opens on the cheapest offer, whatever the ERP order", () => {
    expect(resolveOffer(model, null)?.id).toBe(702);
  });

  it("uses a valid ID from the URL", () => {
    expect(resolveOffer(model, "701")?.id).toBe(701);
  });

  it.each(["999", "abc", "701x", ""])(
    "falls back to the cheapest for %j",
    (raw) => {
      expect(resolveOffer(model, raw)?.id).toBe(702);
    },
  );

  it("puts unpriced and zero-priced variants last", () => {
    const priced = buildVariantModel([
      variant({ rom: "64GB" }, { id: 711, cashPriceFrom: null }),
      variant({ rom: "128GB" }, { id: 712, cashPriceFrom: 0 }),
      variant({ rom: "256GB" }, { id: 713, cashPriceFrom: 2000 }),
    ]);

    expect(resolveOffer(priced, null)?.id).toBe(713);
  });

  it("uses the lowest ID when nothing is priced", () => {
    const unpriced = buildVariantModel([
      variant({ rom: "128GB" }, { id: 722, cashPriceFrom: null }),
      variant({ rom: "64GB" }, { id: 721, cashPriceFrom: null }),
    ]);

    expect(resolveOffer(unpriced, null)?.id).toBe(721);
  });
});

describe("isDimmed and selectOption", () => {
  const model = buildVariantModel([
    iphone("Black", "256GB"),
    iphone("Silver", "256GB"),
    iphone("Glacier", "256GB"),
    iphone("Black", "512GB"),
    iphone("Silver", "512GB"),
    iphone("Glacier", "1TB"),
  ]);
  const black256 = offerWith(model, { color: "black", memory: "12gb|256gb" });

  it("dims only what isn't in stock with the other choices", () => {
    expect(isDimmed(model, black256, "memory", "12gb|256gb")).toBe(false);
    expect(isDimmed(model, black256, "memory", "12gb|512gb")).toBe(false);
    expect(isDimmed(model, black256, "memory", "12gb|1tb")).toBe(true);
    expect(isDimmed(model, black256, "color", "glacier")).toBe(false);
  });

  it("never dims the selected values", () => {
    for (const offer of model.offers) {
      for (const row of model.rows) {
        expect(
          isDimmed(model, offer, row.dimension, offer.values[row.dimension]),
        ).toBe(false);
      }
    }
  });

  it("changes nothing else and adds no note when the value is available", () => {
    const { offer, note } = selectOption(
      model,
      black256,
      "memory",
      "12gb|512gb",
    );

    expect(offer.values).toMatchObject({
      color: "black",
      memory: "12gb|512gb",
    });
    expect(note).toBeNull();
  });

  it("says when a value exists in only one other color", () => {
    const { offer, note } = selectOption(model, black256, "memory", "12gb|1tb");

    expect(offer.values.color).toBe("glacier");
    expect(note).toBe("1TB is only in stock in Glacier.");
  });

  it("says what it switched to when several colors have the value", () => {
    const glacier1tb = offerWith(model, { color: "glacier", memory: "12gb|1tb" });
    const { offer, note } = selectOption(
      model,
      glacier1tb,
      "memory",
      "12gb|512gb",
    );

    expect(offer.values.memory).toBe("12gb|512gb");
    expect(note).toMatch(/^512GB isn't in stock in Glacier\. Showing (Black|Silver)\.$/);
  });

  it("moves to the cheaper offer when two are equally close", () => {
    const tied = buildVariantModel([
      variant({ color: "Red", rom: "256GB" }, { id: 801, cashPriceFrom: 100 }),
      variant({ color: "Red", rom: "512GB" }, { id: 802, cashPriceFrom: 900 }),
      variant({ color: "Blue", rom: "128GB" }, { id: 803, cashPriceFrom: 700 }),
    ]);
    const selected = offerWith(tied, { color: "blue" });

    expect(selectOption(tied, selected, "color", "red").offer.id).toBe(801);
  });

  it("keeps the condition rather than another row", () => {
    const conditions = buildVariantModel([
      variant({ color: "Red", rom: "256GB" }, { id: 811, cashPriceFrom: 900 }),
      variant({ color: "Blue", rom: "512GB" }, { id: 812, cashPriceFrom: 900 }),
      variant(
        { color: "Blue", rom: "256GB" },
        { id: 813, cashPriceFrom: 100, condition: "Certified Pre-Owned" },
      ),
    ]);
    const selected = conditions.offers.find((offer) => offer.id === 811)!;

    const { offer } = selectOption(conditions, selected, "color", "blue");

    expect(offer.id).toBe(812);
  });

  it("changes the fewest rows, then prefers changing a later row", () => {
    const laptops = buildVariantModel([
      variant({ color: "Gray", ram: "8GB", rom: "256GB", cpu: "i5" }, { id: 821 }),
      variant({ color: "Gray", ram: "16GB", rom: "512GB", cpu: "i7" }, { id: 822 }),
      variant({ color: "Blue", ram: "16GB", rom: "256GB", cpu: "i5" }, { id: 823 }),
      variant({ color: "Blue", ram: "8GB", rom: "256GB", cpu: "i7" }, { id: 824 }),
    ]);
    const selected = laptops.offers.find((offer) => offer.id === 821)!;

    const { offer } = selectOption(laptops, selected, "color", "blue");

    // Both Blue offers change one other row, so the later row (CPU) changes.
    expect(offer.id).toBe(824);
  });

  it("only ever selects a CPU and GPU pairing that exists", () => {
    const laptops = buildVariantModel([
      variant({ cpu: "i5", gpu: "Iris" }, { id: 831 }),
      variant({ cpu: "i7", gpu: "RTX" }, { id: 832 }),
    ]);
    const selected = laptops.offers.find((offer) => offer.id === 831)!;

    expect(isDimmed(laptops, selected, "gpu", "rtx")).toBe(true);

    const { offer, note } = selectOption(laptops, selected, "gpu", "rtx");

    expect(offer.id).toBe(832);
    expect(offer.values).toMatchObject({ cpu: "i7", gpu: "rtx" });
    expect(note).toBe("RTX is only in stock in i7.");
  });

  it("leaves 'Not specified' out of the note", () => {
    const partial = buildVariantModel([
      variant({ color: "Black", rom: "256GB" }, { id: 841 }),
      variant({ color: null, rom: "512GB" }, { id: 842 }),
    ]);
    const black = partial.offers.find((offer) => offer.id === 841)!;
    const unnamed = partial.offers.find((offer) => offer.id === 842)!;

    expect(selectOption(partial, black, "color", "").note).toBe("Showing 512GB.");
    expect(selectOption(partial, unnamed, "memory", "|256gb").note).toBe(
      "256GB is only in stock in Black.",
    );
    expect(selectOption(partial, black, "memory", "|512gb").note).toBe(
      "512GB isn't in stock in Black.",
    );
  });

  it("returns the selection unchanged for its own or an unknown value", () => {
    expect(
      selectOption(model, black256, "memory", "12gb|256gb").offer,
    ).toBe(black256);
    expect(selectOption(model, black256, "memory", "nope").offer).toBe(black256);
  });

  it("reaches every variant from every other variant", () => {
    const variants = [
      iphone("Black", "256GB"),
      iphone("Glacier", "1TB"),
      iphone("Silver", "512GB", { condition: "Certified Pre-Owned" }),
      variant({ color: null, rom: null, cpu: "Other" }),
    ];
    const mixed = buildVariantModel(variants);

    for (const variantItem of variants) {
      expect(resolveOffer(mixed, String(variantItem.id))?.memberIds).toContain(
        variantItem.id,
      );
    }
    for (const from of mixed.offers) {
      for (const target of mixed.offers) {
        let current = from;
        for (const row of mixed.rows) {
          current = selectOption(
            mixed,
            current,
            row.dimension,
            target.values[row.dimension],
          ).offer;
        }
        // Applying the target's values row by row, twice, always settles there.
        for (const row of mixed.rows) {
          current = selectOption(
            mixed,
            current,
            row.dimension,
            target.values[row.dimension],
          ).offer;
        }
        expect(current.id).toBe(target.id);
      }
    }
  });
});

describe("describeOffer and offerColor", () => {
  it("lists the row choices and skips what isn't specified", () => {
    const model = buildVariantModel([
      variant({ color: "Black", rom: "256GB" }, { id: 901 }),
      variant({ color: null, rom: "512GB" }, { id: 902 }),
    ]);
    const black = model.offers.find((offer) => offer.id === 901)!;
    const unnamed = model.offers.find((offer) => offer.id === 902)!;

    expect(describeOffer(model, black)).toBe("Black, 256GB");
    expect(describeOffer(model, unnamed)).toBe("512GB");
    expect(offerColor(model, black)).toBe("Black");
    expect(offerColor(model, unnamed)).toBeNull();
  });

  it("is empty when there's nothing to choose", () => {
    const model = buildVariantModel([iphone("Black", "256GB")]);

    expect(describeOffer(model, model.offers[0])).toBe("");
    expect(offerColor(model, model.offers[0])).toBe("Black");
  });
});
