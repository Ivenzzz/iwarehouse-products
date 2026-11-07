# Application architecture

The app is organized around deep feature modules. A module owns its behavior,
external adapters, domain/view models, route-facing UI, and tests. Next.js route
files translate framework inputs and outcomes; they do not orchestrate feature
internals.

## Module map

- `src/modules/catalog` owns catalog browsing, product resolution, sitemap
  traversal, ERP validation/mapping, and catalog-specific UI.
- `src/modules/customers` owns customer accounts, the sign-in cookie, product
  reviews, and their UI. The ERP stores all of it; this module never keeps data
  of its own beyond the session cookie.
- `src/app` owns routing, Next.js metadata/navigation calls, and homepage
  composition.
- `src/components/site` owns the shared header, footer, and brand mark.
- `src/components/ui` contains framework-agnostic shadcn primitives.

Dependencies point inward through public interfaces:

```text
src/app ───────────────> @/modules/catalog, @/modules/customers
   │
   └───────────────────> @/components/ui, @/components/site

src/modules/*/ui ───────> @/components/ui
src/components/* ───────> never import feature modules
```

ESLint enforces these rules. Routes may import a module's public interface, but
may not deep-import its implementation. Modules don't import each other: the
product page route composes catalog and customer views together.

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

## Customers interface

Only this site's server talks to the ERP's `/api/v1/storefront` API. It sends the
machine token in `X-Storefront-Token`, the customer's token in `Authorization`,
and the visitor's address in `X-Storefront-Client-Ip` for per-person rate limits.

- Nothing in this module is cached, not even public reviews. The catalog's
  time-based cache serves its old copy to the next visitor however long ago it
  expired, which would let a removed review reappear on a quiet product page.
- `loadProductReviewsSection` never throws for an ERP problem, so a reviews outage
  can't break a product page.
- The root layout must not read cookies. That would render every page per visitor.
- `CUSTOMER_REVIEWS_LIVE` gates what shoppers see. See `src/modules/customers/release.ts`.

Customers sign in only with Google, and there are no passwords:

1. `/account/google/start` remembers a random state, PKCE verifier and nonce in a
   short-lived cookie, then redirects to Google. No Google script loads on our pages.
2. `/account/google/callback` checks the state, swaps the code for an ID token, and
   sends it to the ERP, which verifies it and returns a session for a known customer.
3. A new customer goes to `/account/welcome`. Nothing is saved until they agree to
   the privacy notice there, when the ERP verifies the token again and creates the
   account. The name is set here once and never updated from Google, so an approved
   review's name can't change without a check.

Tests compose workflows with an in-memory `CustomerSource`, `SessionStore`,
`GoogleProvider` and cookie stores. Playwright uses a fake Google in `e2e/mock-erp.mjs`.

## Styling

Tailwind utilities live with their owning markup. `globals.css` is limited to
design tokens, resets, the shared shell/eyebrow utilities, complex decorative
gradients, and the native select chevron. Desktop and mobile Playwright
screenshots protect the visual contract.
