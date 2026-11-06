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
  const locations = page.locator("#locations");
  await expect(locations.getByRole("link", { name: "Call" })).toHaveAttribute("href", "tel:+63281234567");
  await expect(
    locations.getByRole("link", { name: "Directions" }),
  ).toHaveAttribute("href", /google\.com\/maps/);
  await expect(page.getByText(/does not reserve an item/i)).toBeVisible();
  expect(
    await page.locator('script[type="application/ld+json"]').textContent(),
  ).toContain('"@type":"Product"');
});

function newArrivalsSection(page: Page) {
  return page.locator("section", {
    has: page.getByRole("heading", { name: "New arrivals" }),
  });
}

test("the homepage hero features the two newest products that qualify", async ({
  page,
}) => {
  await page.goto("/");

  const section = newArrivalsSection(page);
  const cards = section.getByRole("link", { name: /^View / });
  await expect(cards).toHaveCount(2);
  await expect(cards.nth(0)).toHaveAccessibleName("View Newest Phone");
  await expect(cards.nth(0)).toHaveAttribute("href", "/products/101-newest-phone");
  await expect(cards.nth(1)).toHaveAccessibleName("View Second Newest Phone");
  await expect(section.getByText("₱40,101", { exact: true })).toBeVisible();
  await expect(
    section.getByRole("link", { name: "See all new arrivals" }),
  ).toHaveAttribute("href", "/products?sort=newest");

  const images = section.locator("img");
  await expect(images).toHaveCount(2);
  for (const image of await images.all()) {
    await expect
      .poll(() => image.evaluate((node: HTMLImageElement) => node.naturalWidth))
      .toBeGreaterThan(0);
  }
});

test("a new arrival card opens its product with the right tab title", async ({
  page,
}) => {
  await page.goto("/");

  await newArrivalsSection(page)
    .getByRole("link", { name: "View Newest Phone" })
    .click();

  await expect(page).toHaveURL(/\/products\/101-newest-phone$/);
  await expect(page.getByRole("heading", { level: 1, name: "Newest Phone" })).toBeVisible();
  await expect(page).toHaveTitle("Newest Phone | iWarehouse");
});

test("the row below the hero skips its products and what can't feature", async ({
  page,
}) => {
  await page.goto("/");

  const row = page.locator("section", {
    has: page.getByRole("heading", { name: "Recently available" }),
  });
  await expect(row.getByRole("link", { name: /^View / })).toHaveCount(4);
  expect(
    await row
      .getByRole("link", { name: /^View / })
      .evaluateAll((links) => links.map((link) => link.getAttribute("aria-label"))),
  ).toEqual([
    "View Pre-Owned Phone",
    "View Third Phone",
    "View Fourth Phone",
    "View Fifth Phone",
  ]);

  // Featured nowhere on the homepage, and no product is shown twice.
  await expect(page.getByRole("link", { name: "View New Charger" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "View Photoless Phone" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "View Newest Phone" })).toHaveCount(1);
  await expect(page.getByRole("link", { name: "View Second Newest Phone" })).toHaveCount(1);
});

test("search comes before new arrivals when the hero stacks", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/");

  const search = await page.getByRole("textbox", { name: "Search products" }).boundingBox();
  const cards = await newArrivalsSection(page)
    .getByRole("link", { name: /^View / })
    .evaluateAll((links) => links.map((link) => link.getBoundingClientRect().top));

  expect(search).not.toBeNull();
  expect(cards[0]).toBeGreaterThan(search!.y);
  // Two across, so both cards start on the same line.
  expect(cards[1]).toBe(cards[0]);
});

test("the homepage hero fits without sideways scrolling at every width", async ({
  page,
}) => {
  await page.goto("/");

  for (const width of [1280, 1100, 980, 860, 680, 375]) {
    await page.setViewportSize({ width, height: 800 });
    expect
      .soft(
        await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        ),
        `overflow at ${width}px`,
      )
      .toBeLessThanOrEqual(0);
  }
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

  // A pointer left resting on Categories can reopen it by hover, which made
  // this keyboard check fail about 1 run in 25.
  await page.mouse.move(0, 0);
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

  // exact: true — the header's "Brands" menu would otherwise match too.
  await page.getByRole("button", { name: "Brand", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Brand" })
    .getByRole("link", { name: "Apple", exact: true })
    .click();
  await expect(page).toHaveURL(/brand=1/);
  await expect(page.getByRole("button", { name: "Brand: Apple" })).toBeVisible();

  await page.getByRole("button", { name: "City" }).click();
  await page
    .getByRole("dialog", { name: "City" })
    .getByRole("link", { name: "Makati", exact: true })
    .click();
  await expect(page).toHaveURL(/brand=1/);
  await expect(page).toHaveURL(/city=Makati/);
  await expect(page.getByText("1 Result", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Clear all" })).toBeVisible();

  await page.goto("/products?q=unavailable");
  await expect(page.getByRole("heading", { name: /can’t load products right now/i })).toBeVisible();
});

test("catalog and stores pages link back to the homepage with a breadcrumb", async ({
  page,
}) => {
  const breadcrumb = page.getByRole("navigation", { name: "breadcrumb" });

  for (const [path, current] of [
    ["/products", "Products"],
    ["/products?brand=1", "Products"],
    ["/stores", "Our stores"],
  ]) {
    await page.goto(path);
    await expect(breadcrumb.getByText(current, { exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await breadcrumb.getByRole("link", { name: "Home" }).click();
    await expect(page).toHaveURL("/");
    await expect(
      page.getByRole("heading", { name: /your next tech upgrade/i }),
    ).toBeVisible();
  }

  // The catalog-unavailable screen deliberately has no breadcrumb.
  await page.goto("/products?q=unavailable");
  await expect(
    page.getByRole("heading", { name: /can’t load products right now/i }),
  ).toBeVisible();
  await expect(breadcrumb).toHaveCount(0);
});

test("non-canonical product URLs redirect to the stable slug", async ({ page }) => {
  await page.goto("/products/17-old-name");
  await expect(page).toHaveURL(/\/products\/17-apple-iphone-17-pro$/);
});

const PRODUCT_PATH = "/products/17-apple-iphone-17-pro";

function storesHeading(page: Page, name: string) {
  return page.getByRole("heading", { name });
}

function chip(page: Page, name: string) {
  return page.locator("label", { hasText: name });
}

test("customer chooses a color and memory and sees the price and stores change", async ({
  page,
}) => {
  await page.goto(PRODUCT_PATH);

  // Opens on the cheapest variant, whatever order the ERP sends them in.
  await expect(page.getByText("₱42,000", { exact: true })).toBeVisible();
  await expect(storesHeading(page, "Black, 8GB/256GB is at 1 location")).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`${PRODUCT_PATH}$`));

  await chip(page, "12GB/512GB").click();

  await expect(page.getByText("₱52,000", { exact: true })).toBeVisible();
  await expect(storesHeading(page, "Black, 12GB/512GB is at 2 locations")).toBeVisible();
  await expect(page.locator("#locations").getByText("BGC Kiosk")).toBeVisible();
  await expect(page).toHaveURL(/\?variant=22$/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `http://127.0.0.1:3100${PRODUCT_PATH}`,
  );
});

test("choosing memory that isn't in the current color moves to one that has it", async ({
  page,
}) => {
  await page.goto(PRODUCT_PATH);

  await expect(
    page.getByRole("radio", { name: "12GB/1TB (not in stock with your other choices)" }),
  ).toBeAttached();

  await chip(page, "12GB/1TB").click();

  await expect(
    page.getByText("12GB/1TB is only in stock in Natural Titanium.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("radio", { name: "Natural Titanium" })).toBeChecked();
  await expect(page.getByText("₱65,000", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\?variant=24$/);
});

test("the variant picker works with the keyboard", async ({ page }) => {
  await page.goto(PRODUCT_PATH);

  const black = page.getByRole("radio", { name: "Black" });
  await black.focus();
  await page.keyboard.press("ArrowRight");

  const iceBlue = page.getByRole("radio", { name: "Ice Blue" });
  await expect(iceBlue).toBeChecked();
  await expect(iceBlue).toBeFocused();
  await expect(page.getByText("₱43,000", { exact: true })).toBeVisible();
});

test("a variant link renders that variant from the server", async ({ request }) => {
  const shared = await (await request.get(`${PRODUCT_PATH}?variant=22`)).text();
  expect(shared).toContain("Black, 12GB/512GB is at 2 locations");

  const unknown = await (await request.get(`${PRODUCT_PATH}?variant=999`)).text();
  expect(unknown).toContain("Black, 8GB/256GB is at 1 location");
});

test("a non-canonical product URL keeps the chosen variant", async ({ page }) => {
  await page.goto("/products/17-old-name?variant=22");

  await expect(page).toHaveURL(new RegExp(`${PRODUCT_PATH}\\?variant=22$`));
  await expect(storesHeading(page, "Black, 12GB/512GB is at 2 locations")).toBeVisible();
});

test("Back returns to the chosen variant after leaving the page", async ({ page }) => {
  await page.goto(PRODUCT_PATH);
  await chip(page, "Ice Blue").click();
  await expect(page).toHaveURL(/\?variant=23$/);

  await page
    .getByRole("navigation", { name: "breadcrumb" })
    .getByRole("link", { name: "Products" })
    .click();
  await expect(page).toHaveURL(/\/products$/);

  await page.goBack();

  await expect(page).toHaveURL(/\?variant=23$/);
  await expect(storesHeading(page, "Ice Blue, 8GB/256GB is at 1 location")).toBeVisible();
  await expect(page.getByRole("radio", { name: "Ice Blue" })).toBeChecked();
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
