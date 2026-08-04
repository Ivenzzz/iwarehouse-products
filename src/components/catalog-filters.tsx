import Link from "next/link";
import type { CatalogFilters, CatalogQuery } from "@/lib/catalog/types";

function selected(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export function CatalogFilterForm({
  filters,
  query,
}: {
  filters: CatalogFilters;
  query: Record<string, string | string[] | undefined>;
}) {
  const values = query as CatalogQuery;

  return (
    <form className="filter-panel" action="/products" method="get">
      <div className="filter-heading">
        <div>
          <p className="eyebrow">Narrow your search</p>
          <h2>Filters</h2>
        </div>
        <Link href="/products">Clear all</Link>
      </div>
      <div className="field">
        <label htmlFor="catalog-search">Search</label>
        <input
          id="catalog-search"
          type="search"
          name="q"
          defaultValue={selected(values.q)}
          placeholder="Brand, model, color…"
        />
      </div>
      <div className="field">
        <label htmlFor="catalog-category">Category</label>
        <select id="catalog-category" name="category" defaultValue={selected(values.category)}>
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
        <label htmlFor="catalog-brand">Brand</label>
        <select id="catalog-brand" name="brand" defaultValue={selected(values.brand)}>
          <option value="">All brands</option>
          {filters.brands.map((brand) => (
            <option value={brand.id} key={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="catalog-condition">Condition</label>
        <select id="catalog-condition" name="condition" defaultValue={selected(values.condition)}>
          <option value="">Any condition</option>
          {filters.conditions.map((condition) => (
            <option value={condition} key={condition}>
              {condition}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="catalog-location">Store or kiosk</label>
        <select id="catalog-location" name="location" defaultValue={selected(values.location)}>
          <option value="">All locations</option>
          {filters.locations.map((location) => (
            <option value={location.id} key={location.id}>
              {location.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="catalog-city">City</label>
        <select id="catalog-city" name="city" defaultValue={selected(values.city)}>
          <option value="">All cities</option>
          {filters.cities.map((city) => (
            <option value={city} key={city}>
              {city}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="catalog-sort">Sort by</label>
        <select id="catalog-sort" name="sort" defaultValue={selected(values.sort) || "relevance"}>
          <option value="relevance">Most relevant</option>
          <option value="newest">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>
      </div>
      <button className="button button-primary" type="submit">
        Show products
      </button>
    </form>
  );
}
