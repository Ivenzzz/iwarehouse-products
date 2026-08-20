"use client";

import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

// src/components must not import feature modules, so the nav data contract
// is declared locally and layout passes conforming data down.
export interface NavBrand {
  id: number;
  name: string;
}

export interface NavCategory extends NavBrand {
  children: NavBrand[];
}

export interface SiteNavData {
  categories: NavCategory[];
  brands: NavBrand[];
}

function PlainItem({ href, label }: { href: string; label: string }) {
  return (
    <NavigationMenuItem>
      <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
        <Link href={href}>{label}</Link>
      </NavigationMenuLink>
    </NavigationMenuItem>
  );
}

export function SiteNav({ nav }: { nav: SiteNavData }) {
  return (
    <NavigationMenu aria-label="Main navigation">
      <NavigationMenuList>
        <PlainItem href="/products" label="Products" />

        {nav.categories.length === 0 ? (
          <PlainItem href="/products" label="Categories" />
        ) : (
          <NavigationMenuItem>
            <NavigationMenuTrigger>Categories</NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="grid max-h-[min(560px,70vh)] w-[460px] grid-cols-2 gap-x-6 gap-y-4 overflow-y-auto p-2 max-[980px]:w-auto">
                {nav.categories.map((category) => (
                  <div key={category.id}>
                    <NavigationMenuLink asChild>
                      <Link
                        href={`/products?category=${category.id}`}
                        className="text-[0.8rem] font-extrabold text-foreground"
                      >
                        {category.name}
                      </Link>
                    </NavigationMenuLink>
                    {category.children.length > 0 ? (
                      <ul className="m-0 mt-2 grid list-none gap-1.5 p-0">
                        {category.children.map((child) => (
                          <li key={child.id}>
                            <NavigationMenuLink asChild>
                              <Link
                                href={`/products?category=${child.id}`}
                                className="text-[0.76rem] font-bold text-[var(--warm-600)]"
                              >
                                {child.name}
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))}
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
        )}

        {nav.brands.length === 0 ? (
          <PlainItem href="/products" label="Brands" />
        ) : (
          <NavigationMenuItem>
            <NavigationMenuTrigger>Brands</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="m-0 grid max-h-[340px] w-[380px] list-none grid-cols-2 gap-1.5 overflow-y-auto p-2">
                {nav.brands.map((brand) => (
                  <li key={brand.id}>
                    <NavigationMenuLink asChild>
                      <Link
                        href={`/products?brand=${brand.id}`}
                        className="rounded-lg px-2 py-1.5 text-[0.78rem] font-bold text-[var(--warm-700)] hover:bg-[var(--brand-50)]"
                      >
                        {brand.name}
                      </Link>
                    </NavigationMenuLink>
                  </li>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        )}

        <PlainItem href="/stores" label="Stores" />
      </NavigationMenuList>
    </NavigationMenu>
  );
}
