import { expect, test, type Page } from "@playwright/test";

async function hideDevelopmentChrome(page: Page) {
  await page.locator("nextjs-portal").evaluateAll((portals) => {
    portals.forEach((portal) => portal.remove());
  });
}

test("customer browses from the homepage to a product and store actions", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /your next tech upgrade/i })).toBeVisible();

  // Category cards stretch a single link across the whole card.
  const categorySection = page.locator("section", {
    has: page.getByRole("heading", { name: "Shop by category" }),
  });
  await expect(
    categorySection.getByRole("link", { name: "Smartphones", exact: true }),
  ).toHaveAttribute("href", "/products?category=2");
  await expect(
    categorySection.getByRole("link", { name: "Accessories", exact: true }),
  ).toHaveAttribute("href", "/products?category=35");

  await page.getByRole("link", { name: "View Apple iPhone 17 Pro" }).click();

  await expect(page).toHaveURL(/\/products\/17-apple-iphone-17-pro$/);
  await expect(page).toHaveTitle(
    "Apple iPhone 17 Pro | iWarehouse",
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "http://127.0.0.1:3100/products/17-apple-iphone-17-pro",
  );
  await expect(page.getByRole("heading", { name: "Apple iPhone 17 Pro" })).toBeVisible();
  // exact: true — the footer's "Call Us" / "Get Directions" links would otherwise match too.
  await expect(page.getByRole("link", { name: "Call", exact: true })).toHaveAttribute("href", "tel:+63281234567");
  await expect(
    page.getByRole("link", { name: "Directions", exact: true }),
  ).toHaveAttribute("href", /google\.com\/maps/);
  await expect(page.getByText(/does not reserve an item/i)).toBeVisible();
  expect(
    await page.locator('script[type="application/ld+json"]').textContent(),
  ).toContain('"@type":"Product"');
});

test("header navigation exposes catalog dropdowns and the stores page", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: "Search stores" }),
  ).toHaveAttribute("href", "/stores");

  if (isMobile) {
    await page.getByLabel("Menu").click();
    await expect(
      page
        .getByLabel("Mobile navigation")
        .getByRole("link", { name: "Stores" }),
    ).toHaveAttribute("href", "/stores");
    return;
  }

  const nav = page.getByLabel("Main navigation");
  await expect(nav.getByRole("link", { name: "Products" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Stores" })).toBeVisible();

  await nav.getByRole("button", { name: "Categories" }).click();
  await expect(
    nav.getByRole("link", { name: "Mobile Devices", exact: true }),
  ).toHaveAttribute("href", "/products?category=1");

  await page.keyboard.press("Escape");
  const brandsTrigger = nav.getByRole("button", { name: "Brands" });
  await brandsTrigger.focus();
  await brandsTrigger.press("Enter");
  await expect(
    nav.getByRole("link", { name: "Apple", exact: true }),
  ).toHaveAttribute("href", "/products?brand=1");
});

test("stores page lists locations grouped by city with store actions", async ({
  page,
}) => {
  await page.goto("/stores");

  await expect(page.getByRole("heading", { name: "Our stores" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Makati" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Taguig" })).toBeVisible();

  const makatiCard = page.locator("article", { hasText: "Makati Store" });
  await expect(makatiCard.getByRole("link", { name: "Call" })).toHaveAttribute(
    "href",
    "tel:+63281234567",
  );
  await expect(
    makatiCard.getByRole("link", { name: /get directions/i }),
  ).toHaveAttribute("href", /google\.com\/maps/);
  await expect(
    makatiCard.getByRole("link", { name: "Browse stock" }),
  ).toHaveAttribute("href", "/products?location=3");

  // Kiosks without a phone number must not offer a dead Call action.
  const kioskCard = page.locator("article", { hasText: "BGC Kiosk" });
  await expect(kioskCard.getByRole("link", { name: "Call" })).toHaveCount(0);
});

test("catalog filters stay in the URL and ERP failures have a friendly state", async ({ page }) => {
  await page.goto("/products");
  await page.getByLabel("Brand").selectOption("1");
  await page.getByLabel("City").selectOption("Makati");
  await page.getByRole("button", { name: "Show products" }).click();

  await expect(page).toHaveURL(/brand=1/);
  await expect(page).toHaveURL(/city=Makati/);
  await expect(page.getByText("Showing 1–1 of 1")).toBeVisible();

  await page.goto("/products?q=unavailable");
  await expect(page.getByRole("heading", { name: /can’t load products right now/i })).toBeVisible();
});

test("non-canonical product URLs redirect to the stable slug", async ({ page }) => {
  await page.goto("/products/17-old-name");
  await expect(page).toHaveURL(/\/products\/17-apple-iphone-17-pro$/);
});

test("product detail ERP failures use the friendly unavailable state", async ({
  page,
}) => {
  await page.goto("/products/503-outage");
  await expect(
    page.getByRole("heading", { name: /can’t load products right now/i }),
  ).toBeVisible();
});

test("key catalog pages preserve their visual contract", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await hideDevelopmentChrome(page);
  await expect(page).toHaveScreenshot("homepage.png", {
    animations: "disabled",
    caret: "initial",
    fullPage: true,
  });

  await page.goto("/products");
  await hideDevelopmentChrome(page);
  await expect(page).toHaveScreenshot("catalog.png", {
    animations: "disabled",
    caret: "initial",
    fullPage: true,
  });

  await page.goto("/products/17-apple-iphone-17-pro");
  await hideDevelopmentChrome(page);
  await expect(page).toHaveScreenshot("product-detail.png", {
    animations: "disabled",
    caret: "initial",
    fullPage: true,
  });

  await page.goto("/stores");
  await hideDevelopmentChrome(page);
  await expect(page).toHaveScreenshot("stores.png", {
    animations: "disabled",
    caret: "initial",
    fullPage: true,
  });
});
