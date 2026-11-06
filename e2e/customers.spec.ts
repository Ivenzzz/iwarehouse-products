import { expect, test, type Page } from "@playwright/test";

const MOCK_ERP = "http://127.0.0.1:4010";
const PASSWORD = "correct-horse-battery";
const PRODUCT = "/products/17-apple-iphone-17-pro";
const LIVE = process.env.CUSTOMER_REVIEWS_LIVE === "true";

function uniqueEmail() {
  return `shopper-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

async function signUp(page: Page, email = uniqueEmail()) {
  await page.goto("/account/register");
  await page.getByLabel("First name").fill("Juan");
  await page.getByLabel("Last name").fill("dela Cruz");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("status")).toContainText("Check your email");
  return email;
}

async function confirmEmail(page: Page, email: string) {
  const { id } = await (await page.request.get(`${MOCK_ERP}/__test/account?email=${encodeURIComponent(email)}`)).json();
  await page.goto(`/account/verify?id=${id}&expires=9999999999&signature=valid-signature`);
  await page.getByRole("button", { name: "Confirm my email" }).click();
  await expect(page.getByRole("status")).toContainText("Your email is confirmed");
}

async function signIn(page: Page, email: string, next?: string) {
  await page.goto(next ? `/account/login?next=${encodeURIComponent(next)}` : "/account/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
}

async function verifiedShopper(page: Page) {
  const email = await signUp(page);
  await confirmEmail(page, email);
  await signIn(page, email);
  await expect(page.getByRole("heading", { name: "Hi, Juan" })).toBeVisible();
  return email;
}

async function writeReview(page: Page, body: string) {
  await page.getByRole("radio", { name: "4 stars" }).check({ force: true });
  await page.getByLabel("Your review").fill(body);
  await page.getByRole("button", { name: "Submit review" }).click();
}

const REVIEW_TEXT = "Bought this for my mother and she loves the camera.";

test("a shopper signs up, confirms their email, reviews a product, and sees it wait for approval", async ({ page }) => {
  await verifiedShopper(page);

  await page.goto(PRODUCT);
  await expect(page.getByText("It will appear as Juan D.")).toBeVisible();
  await writeReview(page, REVIEW_TEXT);

  const reviews = page.locator("#reviews");
  await expect(reviews.getByText("Waiting for approval")).toBeVisible();
  await expect(reviews.getByText(REVIEW_TEXT)).toBeVisible();
  await expect(reviews.getByRole("button", { name: "Submit review" })).toHaveCount(0);

  await page.goto("/account");
  await expect(page.getByRole("link", { name: "Apple iPhone 17 Pro" })).toBeVisible();
  await expect(page.getByText("Waiting for approval")).toBeVisible();
});

test("a rejected review shows its reason and can be edited and resent", async ({ page }) => {
  const email = await verifiedShopper(page);
  await page.goto(PRODUCT);
  await writeReview(page, REVIEW_TEXT);
  await expect(page.locator("#reviews").getByText("Waiting for approval")).toBeVisible();

  await page.request.get(`${MOCK_ERP}/__test/reject?email=${encodeURIComponent(email)}`);

  await page.goto("/account");
  await expect(page.getByText("Not published")).toBeVisible();
  await expect(page.getByText("Reason: It isn't about this product")).toBeVisible();

  await page.getByRole("link", { name: "Edit or delete" }).click();
  await page.getByLabel("Your review").fill("A better, on-topic review of this phone's camera.");
  await page.getByRole("button", { name: "Save and send for approval" }).click();
  await expect(page.getByRole("status")).toContainText("once it’s approved");

  await page.goto("/account");
  await expect(page.getByText("Waiting for approval")).toBeVisible();
  await expect(page.getByText("Not published")).toHaveCount(0);
});

test("a shopper deletes their review", async ({ page }) => {
  await verifiedShopper(page);
  await page.goto(PRODUCT);
  await writeReview(page, REVIEW_TEXT);
  await expect(page.locator("#reviews").getByText("Waiting for approval")).toBeVisible();

  await page.goto("/account");
  await page.getByRole("link", { name: "Edit or delete" }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete review" }).click();

  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByText("You haven’t written any reviews yet.")).toBeVisible();
});

test("an unconfirmed shopper is asked to confirm before reviewing", async ({ page }) => {
  const email = await signUp(page);
  await signIn(page, email);

  await expect(page.getByRole("heading", { name: "Confirm your email to write reviews" })).toBeVisible();

  await page.goto(PRODUCT);
  await expect(page.getByText("Please confirm your email address before writing a review.")).toBeVisible();
  await expect(page.getByLabel("Your review")).toHaveCount(0);
});

test("the review form explains problems without losing the customer's place", async ({ page }) => {
  await verifiedShopper(page);
  await page.goto(PRODUCT);

  // Past the browser's own checks, to prove the server checks too.
  await page.locator("#reviews form").evaluate((form) => form.setAttribute("novalidate", ""));
  await page.getByLabel("Your review").fill("Too short");
  await page.getByRole("button", { name: "Submit review" }).click();

  await expect(page.getByText("Choose a star rating.")).toBeVisible();
  await expect(page.getByText("Please write at least 20 characters.")).toBeVisible();
});

test("a wrong password gets a generic error", async ({ page }) => {
  const email = await signUp(page);

  await page.goto("/account/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByText("Incorrect email or password.")).toBeVisible();
  await expect(page).toHaveURL(/\/account\/login/);
});

test("signing in returns a shopper to the page they came from, but never another site", async ({ page }) => {
  const email = await signUp(page);

  await signIn(page, email, PRODUCT);
  await expect(page).toHaveURL(new RegExp(`${PRODUCT}$`));

  await page.context().clearCookies();
  await signIn(page, email, "https://evil.example/phish");
  await expect(page).toHaveURL(/127\.0\.0\.1:3100\/account$/);
});

test("the session cookie can't be read by page scripts", async ({ page }) => {
  await verifiedShopper(page);

  const session = (await page.context().cookies()).find((cookie) => cookie.name === "iw_customer_session");
  expect(session).toMatchObject({ httpOnly: true, sameSite: "Lax" });
  expect(await page.evaluate(() => document.cookie)).not.toContain("iw_customer_session");
});

test("the account page needs a session, and signing out ends it", async ({ page }) => {
  await page.goto("/account");
  await expect(page).toHaveURL(/\/account\/login$/);

  await verifiedShopper(page);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/127\.0\.0\.1:3100\/$/);

  await page.goto("/account");
  await expect(page).toHaveURL(/\/account\/login$/);
});

test("deleting an account needs the password, then removes it", async ({ page }) => {
  const email = await verifiedShopper(page);

  await page.getByLabel("Confirm your password").fill("not-the-password");
  await page.getByRole("button", { name: "Delete my account and reviews" }).click();
  await expect(page.getByText("That password is incorrect.")).toBeVisible();

  await page.getByLabel("Confirm your password").fill(PASSWORD);
  await page.getByRole("button", { name: "Delete my account and reviews" }).click();
  await expect(page.getByText("Your account and reviews have been deleted.")).toBeVisible();

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Incorrect email or password.")).toBeVisible();
});

test("a reset link changes the password; a bad one explains itself", async ({ page }) => {
  const email = await signUp(page);

  await page.goto(`/account/reset-password?email=${encodeURIComponent(email)}&token=wrong`);
  await page.getByLabel("New password").fill("a-brand-new-password");
  await page.getByRole("button", { name: "Save new password" }).click();
  await expect(page.getByText("This reset link is invalid or has expired.")).toBeVisible();

  await page.goto(`/account/reset-password?email=${encodeURIComponent(email)}&token=valid-reset-token`);
  await page.getByLabel("New password").fill("a-brand-new-password");
  await page.getByRole("button", { name: "Save new password" }).click();
  await expect(page.getByText("Your password has been changed.")).toBeVisible();
});

test("a confirmation link with a bad signature is refused", async ({ page }) => {
  const email = await signUp(page);
  const { id } = await (await page.request.get(`${MOCK_ERP}/__test/account?email=${encodeURIComponent(email)}`)).json();

  await page.goto(`/account/verify?id=${id}&expires=9999999999&signature=tampered`);
  await page.getByRole("button", { name: "Confirm my email" }).click();

  await expect(page.getByText("This verification link is invalid or has expired.")).toBeVisible();
});

test("account pages are kept out of search engines", async ({ page, request }) => {
  await page.goto("/account/login");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);

  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /account");

  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).not.toContain("/account");
});

test.describe("published reviews", () => {
  test.skip(({ browserName }) => browserName !== "chromium");

  async function readReviewsAsVisitor(page: Page) {
    // Before launch only signed-in visitors see reviews; after it, everyone does.
    if (!LIVE) await verifiedShopper(page);
    await page.goto(PRODUCT);
  }

  test("review text can't run as a script, on the page or in the search data", async ({ page }) => {
    await readReviewsAsVisitor(page);

    const reviews = page.locator("#reviews");
    await expect(reviews.getByText("Ana R.")).toBeVisible();
    await expect(reviews.getByText("window.__reviewXss = true")).toBeVisible();
    expect(await page.evaluate(() => "__reviewXss" in window)).toBe(false);

    const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
    expect(jsonLd).not.toContain("</script>");
    expect(() => JSON.parse(jsonLd ?? "")).not.toThrow();
  });

  test("the summary shows the average and paging keeps the chosen variant", async ({ page }) => {
    await readReviewsAsVisitor(page);

    const reviews = page.locator("#reviews");
    await expect(reviews.getByRole("img", { name: "4.5 out of 5 stars" })).toBeVisible();
    await expect(reviews.getByText("12 reviews")).toBeVisible();

    await page.goto(`${PRODUCT}?variant=not-a-real-variant`);
    await page.getByRole("link", { name: "More reviews" }).click();

    await expect(page).toHaveURL(/reviews_page=2/);
    await expect(page).toHaveURL(/variant=/);
    await expect(reviews.getByText("A review on the second page of results.")).toBeVisible();
  });
});

test("a reviews outage leaves the product page working", async ({ page }) => {
  // The mock serves this product normally but fails its reviews.
  if (!LIVE) await verifiedShopper(page);

  await page.goto("/products/101-newest-phone");

  await expect(page.getByRole("heading", { name: "Newest Phone" })).toBeVisible();
  await expect(page.locator("#reviews").getByText("Reviews are unavailable right now.")).toBeVisible();
});

test.describe("before launch", () => {
  test.skip(LIVE, "only applies while the release setting is off");

  test("shoppers see no account link, reviews, policies, or ratings", async ({ page }) => {
    await page.goto(PRODUCT);

    await expect(page.getByRole("heading", { name: "Apple iPhone 17 Pro" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Your account" })).toHaveCount(0);
    await expect(page.locator("#reviews")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Privacy notice" })).toHaveCount(0);

    const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
    expect(jsonLd).not.toContain("aggregateRating");
  });

  test("signed-in staff can test reviews, and draft policies are labelled and unindexed", async ({ page }) => {
    await verifiedShopper(page);
    await page.goto(PRODUCT);
    await expect(page.getByRole("heading", { name: "Customer reviews" })).toBeVisible();

    const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
    expect(jsonLd).not.toContain("aggregateRating");

    await page.goto("/privacy");
    await expect(page.getByRole("note")).toContainText("Draft");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });
});

test.describe("after launch", () => {
  test.skip(!LIVE, "run with CUSTOMER_REVIEWS_LIVE=true");

  test("everyone sees reviews, the account link, policies, and ratings in search data", async ({ page }) => {
    await page.goto(PRODUCT);

    await expect(page.getByRole("link", { name: "Your account" })).toBeVisible();
    await expect(page.locator("#reviews").getByRole("link", { name: "Sign in to write a review" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Privacy notice" })).toBeVisible();

    const jsonLd = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? "{}");
    expect(jsonLd.aggregateRating).toMatchObject({ ratingValue: 4.5, reviewCount: 12 });
    expect(jsonLd.review[0].author.name).toBe("Ana R.");

    await page.goto("/privacy");
    await expect(page.getByRole("note")).toHaveCount(0);
  });
});
