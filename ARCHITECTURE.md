# Application architecture

The app is organized around deep feature modules. A module owns its behavior,
external adapters, domain/view models, route-facing UI, and tests. Next.js route
files translate framework inputs and outcomes; they do not orchestrate feature
internals.

## Module map

- `src/modules/catalog` owns catalog browsing, product resolution, sitemap
  traversal, ERP validation/mapping, and catalog-specific UI.
- `src/app` owns routing, Next.js metadata/navigation calls, and homepage
  composition.
- `src/components/site` owns the shared header, footer, and brand mark.
- `src/components/ui` contains framework-agnostic shadcn primitives.

Dependencies point inward through public interfaces:

```text
src/app ───────────────> @/modules/catalog
   │
   └───────────────────> @/components/ui, @/components/site

src/modules/catalog/ui ─> @/components/ui
src/components/* ───────> never import feature modules
```

ESLint enforces these rules. Routes may import `@/modules/catalog`, but may not
deep-import its implementation.

## Catalog interface

The catalog module exposes four server workflows:

- `loadHomeCatalog()` hides parallel filter and newest-product requests.
- `browseCatalog(searchParams)` owns query normalization, page size, and result
  ranges.
- `resolveProduct(idSlug)` returns exhaustive ready, not-found, redirect, or
  unavailable outcomes.
- `loadSitemapProducts()` owns all-page traversal and all-or-nothing failure
  behavior.

The production implementation uses the ERP HTTP adapter. Tests compose the same
workflows with an in-memory `CatalogSource`, keeping that seam internal. ERP DTOs
are inferred from Zod schemas and mapped to camelCase models before entering the
module.

## Adding a catalog feature

1. Add a caller-observable workflow test using an in-memory `CatalogSource`.
2. Extend the Zod DTO and mapper only if the ERP contract changes.
3. Add behavior behind an existing workflow when possible; add a new public
   workflow only for a distinct caller use case.
4. Keep catalog UI inside the module and export only route-facing views.
5. Run lint, typecheck, unit tests, the production build, and Playwright.

## Styling

Tailwind utilities live with their owning markup. `globals.css` is limited to
design tokens, resets, the shared shell/eyebrow utilities, complex decorative
gradients, and the native select chevron. Desktop and mobile Playwright
screenshots protect the visual contract.
