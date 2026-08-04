import { expect, test } from "@playwright/test";

test("customer browses from the homepage to a product and store actions", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /find the right tech/i })).toBeVisible();
  await page.getByRole("link", { name: "View Apple iPhone 17 Pro" }).click();

  await expect(page).toHaveURL(/\/products\/17-apple-iphone-17-pro$/);
  await expect(page.getByRole("heading", { name: "Apple iPhone 17 Pro" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Call" })).toHaveAttribute("href", "tel:+63281234567");
  await expect(page.getByRole("link", { name: /directions/i })).toHaveAttribute(
    "href",
    /google\.com\/maps/,
  );
  await expect(page.getByText(/does not reserve an item/i)).toBeVisible();
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
