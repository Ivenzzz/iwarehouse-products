import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CatalogFilters, CatalogQuery } from "../model";

function selected(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

/**
 * Native <select> on purpose. This panel is a server component and the form is
 * a plain GET submit, so filtering works before any JS loads. Swapping in the
 * Radix-based shadcn Select would force "use client" and break that.
 * The class list below matches shadcn's Input so the controls read as one set.
 */
const selectClass =
  "catalog-select flex h-10 w-full min-w-0 appearance-none rounded-md border border-input bg-background px-3 py-1 text-[0.76rem] shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

export function CatalogFilterForm({
  filters,
  query,
}: {
  filters: CatalogFilters;
  query: Record<string, string | string[] | undefined>;
}) {
  const values = query as CatalogQuery;

  return (
    <form
      className="sticky top-24 rounded-[15px] border border-border bg-white p-5 [&_.field]:mt-[15px] [&_.field]:block [&_.field>label]:mb-[7px] [&_.field>label]:text-[0.67rem] [&_.field>label]:font-extrabold max-[980px]:static max-[980px]:grid max-[980px]:grid-cols-3 max-[980px]:gap-x-[14px] max-[680px]:grid-cols-1"
      action="/products"
      method="get"
    >
      <div className="mb-5 flex items-end justify-between max-[980px]:col-span-full max-[680px]:col-span-auto">
        <div>
          <p className="eyebrow">Narrow your search</p>
          <h2 className="m-0 text-[1.12rem]">Filters</h2>
        </div>
        <Link
          className="inline-flex shrink-0 items-center gap-1.5 text-[0.8rem] font-extrabold whitespace-nowrap text-primary [&_svg]:size-[14px]"
          href="/products"
        >
          Clear all
        </Link>
      </div>
      <div className="field">
        <Label htmlFor="catalog-search">Search</Label>
        <Input
          id="catalog-search"
          type="search"
          name="q"
          defaultValue={selected(values.q)}
          placeholder="Brand, model, color…"
          className="h-10 text-[0.76rem]"
        />
      </div>
      <div className="field">
        <Label htmlFor="catalog-category">Category</Label>
        <select
          id="catalog-category"
          name="category"
          defaultValue={selected(values.category)}
          className={selectClass}
        >
          <option value="">All categories</option>
          {filters.categories.map((category) => (
            <optgroup key={category.id} label={category.name}>
              <option value={category.id}>{category.name}</option>
              {category.children.map((child) => (
                <option value={child.id} key={child.id}>
                  {child.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      <div className="field">
        <Label htmlFor="catalog-brand">Brand</Label>
        <select
          id="catalog-brand"
          name="brand"
          defaultValue={selected(values.brand)}
          className={selectClass}
        >
          <option value="">All brands</option>
          {filters.brands.map((brand) => (
            <option value={brand.id} key={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <Label htmlFor="catalog-condition">Condition</Label>
        <select
          id="catalog-condition"
          name="condition"
          defaultValue={selected(values.condition)}
          className={selectClass}
        >
          <option value="">Any condition</option>
          {filters.conditions.map((condition) => (
            <option value={condition} key={condition}>
              {condition}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <Label htmlFor="catalog-location">Store or kiosk</Label>
        <select
          id="catalog-location"
          name="location"
          defaultValue={selected(values.location)}
          className={selectClass}
        >
          <option value="">All locations</option>
          {filters.locations.map((location) => (
            <option value={location.id} key={location.id}>
              {location.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <Label htmlFor="catalog-city">City</Label>
        <select
          id="catalog-city"
          name="city"
          defaultValue={selected(values.city)}
          className={selectClass}
        >
          <option value="">All cities</option>
          {filters.cities.map((city) => (
            <option value={city} key={city}>
              {city}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <Label htmlFor="catalog-sort">Sort by</Label>
        <select
          id="catalog-sort"
          name="sort"
          defaultValue={selected(values.sort) || "relevance"}
          className={selectClass}
        >
          <option value="relevance">Most relevant</option>
          <option value="newest">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>
      </div>
      <Button
        type="submit"
        className="mt-6 h-11 w-full text-[0.83rem] font-extrabold max-[980px]:col-span-full max-[680px]:col-span-auto"
      >
        Show products
      </Button>
    </form>
  );
}
