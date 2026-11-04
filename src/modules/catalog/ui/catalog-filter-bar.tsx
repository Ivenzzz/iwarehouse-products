"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { CatalogFilters, RawSearchParams } from "../model";
import { joinQuery } from "../presentation";

interface MenuOption {
  value: string;
  label: string;
  /** A child category's parent, used for indenting and for search. */
  parent?: string;
  isParent?: boolean;
}

interface FilterDefinition {
  param: string;
  label: string;
  allLabel: string;
  options: MenuOption[];
  /** Long lists get a search box; "brands" gives "Search brands". */
  searchNoun?: string;
}

const SORT_PARAM = "sort";
const DEFAULT_SORT = "relevance";
const SORT_OPTIONS: MenuOption[] = [
  { value: DEFAULT_SORT, label: "Most relevant" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

function filterDefinitions(filters: CatalogFilters): FilterDefinition[] {
  return [
    {
      param: "category",
      label: "Category",
      allLabel: "All categories",
      searchNoun: "categories",
      options: filters.categories.flatMap((category) => [
        {
          value: String(category.id),
          label: category.name,
          isParent: category.children.length > 0,
        },
        ...category.children.map((child) => ({
          value: String(child.id),
          label: child.name,
          parent: category.name,
        })),
      ]),
    },
    {
      param: "brand",
      label: "Brand",
      allLabel: "All brands",
      searchNoun: "brands",
      options: filters.brands.map((brand) => ({
        value: String(brand.id),
        label: brand.name,
      })),
    },
    {
      param: "condition",
      label: "Condition",
      allLabel: "Any condition",
      options: filters.conditions.map((condition) => ({
        value: condition,
        label: condition,
      })),
    },
    {
      param: "location",
      label: "Store or kiosk",
      allLabel: "All locations",
      options: filters.locations.map((location) => ({
        value: String(location.id),
        label: location.name,
      })),
    },
    {
      param: "city",
      label: "City",
      allLabel: "All cities",
      options: filters.cities.map((city) => ({ value: city, label: city })),
    },
  ];
}

function queryValue(query: RawSearchParams, key: string): string {
  const value = query[key];
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/** Keeps a child visible for its parent's name, and a parent for its child's. */
function matchingOptions(options: MenuOption[], search: string): MenuOption[] {
  const term = search.trim().toLowerCase();
  if (!term) return options;

  const matches = (text?: string) => text?.toLowerCase().includes(term);

  return options.filter(
    (option) =>
      matches(option.label) ||
      matches(option.parent) ||
      options.some(
        (child) => child.parent === option.label && matches(child.label),
      ),
  );
}

function OptionLink({
  href,
  label,
  selected,
  isParent,
  indented,
  onSelect,
}: {
  href: string;
  label: string;
  selected: boolean;
  isParent?: boolean;
  indented?: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onSelect}
        aria-current={selected ? "true" : undefined}
        className={cn(
          "flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-sm hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary",
          isParent && "font-semibold",
          indented && "pl-5",
          selected && "font-semibold",
        )}
      >
        {label}
        {selected ? (
          <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />
        ) : null}
      </Link>
    </li>
  );
}

/** Rendered only while open, so its search text resets each time. */
function MenuOptions({
  options,
  allOption,
  searchNoun,
  current,
  hrefFor,
  onSelect,
}: {
  options: MenuOption[];
  allOption?: string;
  searchNoun?: string;
  current: string;
  hrefFor: (value: string | undefined) => string;
  onSelect: () => void;
}) {
  const [search, setSearch] = useState("");
  const visible = matchingOptions(options, search);
  const searching = search.trim() !== "";
  const listRef = useRef<HTMLUListElement>(null);

  // Long lists open at the current choice, not at the top.
  useEffect(() => {
    const list = listRef.current;
    const current = list?.querySelector<HTMLElement>('[aria-current="true"]');
    if (list && current) list.scrollTop = current.offsetTop - list.offsetTop;
  }, []);

  return (
    <>
      {searchNoun ? (
        <div className="border-b border-border p-2">
          <Input
            type="search"
            aria-label={`Search ${searchNoun}`}
            placeholder={`Search ${searchNoun}`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-9"
          />
        </div>
      ) : null}
      <ul
        ref={listRef}
        className="m-0 max-h-[300px] list-none overflow-y-auto p-1.5"
      >
        {allOption && !searching ? (
          <OptionLink
            href={hrefFor(undefined)}
            label={allOption}
            selected={current === ""}
            onSelect={onSelect}
          />
        ) : null}
        {visible.map((option) => (
          <OptionLink
            key={option.value}
            href={hrefFor(option.value)}
            label={option.label}
            selected={option.value === current}
            isParent={option.isParent}
            indented={Boolean(option.parent)}
            onSelect={onSelect}
          />
        ))}
        {visible.length === 0 ? (
          <li className="px-2.5 py-3 text-sm text-muted-foreground">
            No {searchNoun} match
          </li>
        ) : null}
      </ul>
    </>
  );
}

function Menu({
  title,
  align,
  trigger,
  triggerLabel,
  triggerClassName,
  width,
  children,
}: {
  title: string;
  align?: "start" | "end";
  trigger: ReactNode;
  triggerLabel?: string;
  triggerClassName: string;
  width: string;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={triggerLabel}
        className={cn("group/menu", triggerClassName)}
      >
        {trigger}
        <ChevronDown
          className="size-4 shrink-0 transition-transform duration-150 group-data-[state=open]/menu:rotate-180 motion-reduce:transition-none"
          aria-hidden="true"
        />
      </PopoverTrigger>
      <PopoverContent
        align={align}
        aria-label={title}
        className={cn(width, "max-w-[calc(100vw-28px)]")}
      >
        {children(() => setOpen(false))}
      </PopoverContent>
    </Popover>
  );
}

function FilterChip({
  filter,
  query,
}: {
  filter: FilterDefinition;
  query: RawSearchParams;
}) {
  const current = queryValue(query, filter.param);
  const active = filter.options.find((option) => option.value === current);

  return (
    <Menu
      title={filter.label}
      trigger={active?.label ?? filter.label}
      triggerLabel={active ? `${filter.label}: ${active.label}` : undefined}
      triggerClassName={cn(
        "inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-xl border bg-card px-3.5 text-sm font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-primary data-[state=open]:border-foreground",
        active
          ? "border-foreground"
          : "border-border hover:border-[var(--warm-300)]",
      )}
      width="w-72"
    >
      {(close) => (
        <MenuOptions
          options={filter.options}
          allOption={filter.allLabel}
          searchNoun={filter.searchNoun}
          current={active?.value ?? ""}
          hrefFor={(value) =>
            `/products${joinQuery(query, { [filter.param]: value, page: undefined })}`
          }
          onSelect={close}
        />
      )}
    </Menu>
  );
}

function SortMenu({ query }: { query: RawSearchParams }) {
  const requested = queryValue(query, SORT_PARAM);
  const current =
    SORT_OPTIONS.find((option) => option.value === requested) ??
    SORT_OPTIONS[0];

  return (
    <Menu
      title="Sort"
      align="end"
      trigger={
        <span>
          <span className="font-semibold">Sort</span>{" "}
          <span className="text-muted-foreground">{current.label}</span>
        </span>
      }
      triggerClassName="inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-lg text-sm whitespace-nowrap outline-none focus-visible:ring-3 focus-visible:ring-primary"
      width="w-60"
    >
      {(close) => (
        <MenuOptions
          options={SORT_OPTIONS}
          current={current.value}
          hrefFor={(value) =>
            `/products${joinQuery(query, {
              [SORT_PARAM]: value === DEFAULT_SORT ? undefined : value,
              page: undefined,
            })}`
          }
          onSelect={close}
        />
      )}
    </Menu>
  );
}

export function CatalogFilterBar({
  filters,
  query,
  total,
}: {
  filters: CatalogFilters;
  query: RawSearchParams;
  total: number;
}) {
  const definitions = filterDefinitions(filters);
  const searchTerm = queryValue(query, "q");
  const keptBySearch = [
    ...definitions.map((filter) => filter.param),
    SORT_PARAM,
  ].filter((param) => queryValue(query, param));
  const hasActiveFilters =
    searchTerm !== "" ||
    definitions.some((filter) => queryValue(query, filter.param));

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-border pb-3">
        <div className="mr-auto flex items-center gap-3 text-sm">
          <span className="font-semibold">Filters</span>
          <span className="h-4 w-px bg-border" aria-hidden="true" />
          <span data-slot="result-count">
            <strong className="font-semibold">
              {total.toLocaleString("en-PH")}
            </strong>{" "}
            {total === 1 ? "Result" : "Results"}
          </span>
          {hasActiveFilters ? (
            <>
              <span className="h-4 w-px bg-border" aria-hidden="true" />
              <Link
                href="/products"
                className="font-semibold text-primary hover:underline"
              >
                Clear all
              </Link>
            </>
          ) : null}
        </div>

        <form
          key={searchTerm}
          role="search"
          action="/products"
          className="relative order-last w-full min-[681px]:order-none min-[681px]:w-60"
        >
          {keptBySearch.map((param) => (
            <input
              key={param}
              type="hidden"
              name={param}
              value={queryValue(query, param)}
            />
          ))}
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            name="q"
            aria-label="Search products"
            placeholder="Search products"
            defaultValue={searchTerm}
            className="h-10 bg-card pl-9"
          />
        </form>

        <SortMenu query={query} />
      </div>

      {/* A single sideways row on phones, running to the screen's edges. */}
      <div className="flex flex-wrap gap-2.5 pt-4 max-[680px]:-mx-3.5 max-[680px]:flex-nowrap max-[680px]:overflow-x-auto max-[680px]:px-3.5 max-[680px]:pb-1 max-[680px]:[scrollbar-width:none]">
        {definitions.map((filter) => (
          <FilterChip key={filter.param} filter={filter} query={query} />
        ))}
      </div>
    </div>
  );
}
