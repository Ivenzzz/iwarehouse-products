import { expect, test, type Page } from "@playwright/test";

const MOCK_ERP = "http://127.0.0.1:4010";
const PRODUCT = "/products/17-apple-iphone-17-pro";
const LIVE = process.env.CUSTOMER_REVIEWS_LIVE === "true";
const REVIEW_TEXT = "Bought this for my mother and she loves the camera.";

const FACEBOOK_ANDROID =
  "Mozilla/5.0 (Linux; Android 14; SM-A546E; wv) AppleWebKit/537.36 Chrome/128.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/482.0.0.40.81;]";
const MESSENGER_IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 LightSpeed [FBAN/MessengerLiteForiOS;FBAV/470.0;]";

function uniqueEmail() {
  return `shopper-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

/** Clicks through to the fake Google and approves, as the real customer would. */
async function continueWithGoogle(
  page: Page,
  email: string,
  { lastName, unverified = false }: { lastName?: string; unverified?: boolean } = {},
) {
  await page.getByRole("link", { name: "Continue with Google" }).click();
  await page.getByLabel("Google email").fill(email);
  if (lastName !== undefined) await page.getByLabel("Google last name").fill(lastName);
  if (unverified) await page.getByLabel("Email not verified").check();
  await page.getByRole("button", { name: "Approve" }).click();
}

async function createAccount(page: Page, email = uniqueEmail(), next?: string) {
  await page.goto(next ? `/account/login?next=${encodeURIComponent(next)}` : "/account/login");
  await continueWithGoogle(page, email);
  await expect(page).toHaveURL(/\/account\/welcome$/);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create my account" }).click();
  return email;
}

async function signedInShopper(page: Page) {
  const email = await createAccount(page);
  await expect(page.getByRole("heading", { name: "Hi, Juan" })).toBeVisible();
  return email;
}

async function writeReview(page: Page, body: string) {
  await page.getByRole("radio", { name: "4 stars" }).check({ force: true });
  await page.getByLabel("Your review").fill(body);
  await page.getByRole("button", { name: "Submit review" }).click();
}

test("a new customer signs up with Google, reviews a product, and sees it wait for approval", async ({ page }) => {
  await createAccount(page, uniqueEmail(), PRODUCT);

  await expect(page).toHaveURL(new RegExp(`${PRODUCT}$`));
  const reviews = page.locator("#reviews");
  await expect(reviews.getByText("It will appear as Juan D.")).toBeVisible();

  await writeReview(page, REVIEW_TEXT);

  await expect(reviews.getByText("Waiting for approval")).toBeVisible();
  await expect(reviews.getByText(REVIEW_TEXT)).toBeVisible();
  await expect(reviews.getByRole("button", { name: "Submit review" })).toHaveCount(0);

  await page.goto("/account");
  await expect(page.getByRole("link", { name: "Apple iPhone 17 Pro" })).toBeVisible();
  await expect(page.getByText("Waiting for approval")).toBeVisible();
});

test("a returning customer skips the confirm screen and keeps the name they chose", async ({ page }) => {
  const email = uniqueEmail();
  await page.goto("/account/login");
  await continueWithGoogle(page, email);

  const firstName = page.getByLabel("First name");
  await expect(firstName).toHaveValue("Juan");
  await expect(page.getByLabel("Last name")).toHaveValue("dela Cruz");
  await expect(page.getByText(email)).toBeVisible();

  await firstName.fill("Johnny");
  await page.getByLabel("Last name").fill("Reyes");
  await expect(page.getByText("Your name on reviews").locator("strong")).toHaveText("Johnny R.");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create my account" }).click();
  await expect(page.getByRole("heading", { name: "Hi, Johnny" })).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/127\.0\.0\.1:3100\/$/);

  await page.goto("/account/login");
  await continueWithGoogle(page, email);

  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByRole("heading", { name: "Hi, Johnny" })).toBeVisible();
  await expect(page.getByText("Johnny R.")).toBeVisible();
});

test("nothing is saved until the customer agrees to the privacy notice", async ({ page }) => {
  const email = uniqueEmail();
  await page.goto("/account/login");
  await continueWithGoogle(page, email);

  // Past the browser's own check, to prove the server checks too.
  await page.locator("form").first().evaluate((form) => form.setAttribute("novalidate", ""));
  await page.getByRole("button", { name: "Create my account" }).click();
  await expect(page.getByText("Please agree to the privacy notice to continue.")).toBeVisible();

  // Abandoning here leaves no account: Google sign-in still treats them as new.
  await page.context().clearCookies();
  await page.goto("/account/login");
  await continueWithGoogle(page, email);
  await expect(page).toHaveURL(/\/account\/welcome$/);
});

test("a customer with no last name appears by first name only", async ({ page }) => {
  await page.goto("/account/login");
  await continueWithGoogle(page, uniqueEmail(), { lastName: "" });

  await expect(page.getByText("Your name on reviews").locator("strong")).toHaveText("Juan");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create my account" }).click();

  await expect(page.getByRole("heading", { name: "Hi, Juan" })).toBeVisible();
});

test("cancelling at Google returns to sign-in with a gentle message and the same destination", async ({ page }) => {
  await page.goto(`/account/login?next=${encodeURIComponent(PRODUCT)}`);
  await page.getByRole("link", { name: "Continue with Google" }).click();
  await page.getByRole("link", { name: "Cancel" }).click();

  await expect(page.locator("main").getByRole("alert")).toContainText("Google sign-in was cancelled");
  await expect(page).toHaveURL(/next=%2Fproducts%2F17-apple-iphone-17-pro/);
});

test("a Google email that isn't verified is refused", async ({ page }) => {
  await page.goto("/account/login");
  await continueWithGoogle(page, uniqueEmail(), { unverified: true });

  await expect(page.locator("main").getByRole("alert")).toContainText("verify the email address on your Google account");
  await expect(page).toHaveURL(/\/account\/login/);
});

test("a crafted callback can't sign anyone in", async ({ page }) => {
  await page.goto("/account/google/callback?code=stolen-code&state=forged");
  await expect(page.locator("main").getByRole("alert")).toContainText("couldn’t finish signing you in");

  // Even during a real attempt, a state that doesn't match is refused.
  await page.goto("/account/login");
  await page.getByRole("link", { name: "Continue with Google" }).click();
  await expect(page.getByLabel("Google email")).toBeVisible();
  await page.goto("/account/google/callback?code=stolen-code&state=forged");
  await expect(page.locator("main").getByRole("alert")).toContainText("couldn’t finish signing you in");

  await page.goto("/account");
  await expect(page).toHaveURL(/\/account\/login$/);
});

test("an old session cookie doesn't lock anyone out of signing in", async ({ page }) => {
  await page.context().addCookies([
    { name: "iw_customer_session", value: "1|revoked-token", domain: "127.0.0.1", path: "/" },
  ]);

  // Both used to bounce between each other until the browser gave up.
  await page.goto("/account/login");
  await expect(page.getByRole("link", { name: "Continue with Google" })).toBeVisible();

  await page.goto("/account");
  await expect(page).toHaveURL(/\/account\/login$/);

  // A new customer can get all the way through, which replaces the old cookie.
  await continueWithGoogle(page, uniqueEmail());
  await expect(page).toHaveURL(/\/account\/welcome$/);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create my account" }).click();
  await expect(page.getByRole("heading", { name: "Hi, Juan" })).toBeVisible();
});

test("the welcome screen needs a sign-in in progress", async ({ page }) => {
  await page.goto("/account/welcome");

  await expect(page).toHaveURL(/\/account\/login\?error=expired$/);
  await expect(page.locator("main").getByRole("alert")).toContainText("continue with Google again");
});

test("signing in never returns a customer to another site", async ({ page }) => {
  await createAccount(page, uniqueEmail(), "https://evil.example/phish");
  await expect(page).toHaveURL(/127\.0\.0\.1:3100\/account$/);

  await page.context().clearCookies();
  await page.goto("/account/google/start?next=//evil.example/phish");
  await page.getByLabel("Google email").fill(uniqueEmail());
  await page.getByRole("button", { name: "Approve" }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create my account" }).click();
  await expect(page).toHaveURL(/127\.0\.0\.1:3100\/account$/);
});

test("sign-in secrets stay out of the browser", async ({ page }) => {
  await page.goto("/account/login");
  expect(await page.content()).not.toContain("e2e-google-secret");

  await continueWithGoogle(page, uniqueEmail());
  await expect(page).toHaveURL(/\/account\/welcome$/);

  const pending = (await page.context().cookies()).find((cookie) => cookie.name === "iw_google_pending");
  expect(pending).toMatchObject({ httpOnly: true, sameSite: "Lax" });
  const pageText = await page.content();
  expect(pageText).not.toContain(pending?.value ?? "missing");
  expect(pageText).not.toContain("mock.");
  expect(pageText).not.toContain("e2e-google-secret");

  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create my account" }).click();
  await expect(page.getByRole("heading", { name: "Hi, Juan" })).toBeVisible();

  const cookies = await page.context().cookies();
  expect(cookies.find((cookie) => cookie.name === "iw_google_pending")).toBeUndefined();
  expect(cookies.find((cookie) => cookie.name === "iw_google_flow")).toBeUndefined();
  expect(cookies.find((cookie) => cookie.name === "iw_customer_session")).toMatchObject({
    httpOnly: true,
    sameSite: "Lax",
  });
  expect(await page.evaluate(() => document.cookie)).not.toContain("iw_");
});

test.describe("inside an app's built-in browser", () => {
  for (const [app, userAgent] of [
    ["Facebook", FACEBOOK_ANDROID],
    ["Messenger", MESSENGER_IPHONE],
  ]) {
    test(`${app} shows steps and a copy link instead of the Google button`, async ({ browser }) => {
      const context = await browser.newContext({ userAgent });
      const page = await context.newPage();

      await page.goto(`/account/login?next=${encodeURIComponent(PRODUCT)}`);

      await expect(page.getByRole("note")).toContainText("doesn’t work inside this app’s browser");
      await expect(page.getByRole("button", { name: "Copy link" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Continue with Google" })).toHaveCount(0);

      await context.close();
    });
  }
});

test("a rejected review shows its reason and can be edited and resent", async ({ page }) => {
  const email = await signedInShopper(page);
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
  await signedInShopper(page);
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

test("the review form explains problems without losing the customer's place", async ({ page }) => {
  await signedInShopper(page);
  await page.goto(PRODUCT);

  // Past the browser's own checks, to prove the server checks too.
  await page.locator("#reviews form").evaluate((form) => form.setAttribute("novalidate", ""));
  await page.getByLabel("Your review").fill("Too short");
  await page.getByRole("button", { name: "Submit review" }).click();

  await expect(page.getByText("Choose a star rating.")).toBeVisible();
  await expect(page.getByText("Please write at least 20 characters.")).toBeVisible();
});

test("the account page needs a session, and signing out ends it", async ({ page }) => {
  await page.goto("/account");
  await expect(page).toHaveURL(/\/account\/login$/);

  await signedInShopper(page);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/127\.0\.0\.1:3100\/$/);

  await page.goto("/account");
  await expect(page).toHaveURL(/\/account\/login$/);
});

test("deleting an account needs the email typed, then removes it", async ({ page }) => {
  const email = await signedInShopper(page);

  await page.getByLabel(`Type ${email} to confirm`).fill("someone.else@example.com");
  await page.getByRole("button", { name: "Delete my account and reviews" }).click();
  await expect(page.getByText("That doesn't match your account email.")).toBeVisible();

  await page.getByLabel(`Type ${email} to confirm`).fill(email.toUpperCase());
  await page.getByRole("button", { name: "Delete my account and reviews" }).click();
  await expect(page.getByText("Your account and reviews have been deleted.")).toBeVisible();

  // The same Google account now counts as new again.
  await continueWithGoogle(page, email);
  await expect(page).toHaveURL(/\/account\/welcome$/);
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
  async function readReviewsAsVisitor(page: Page) {
    // Before launch only signed-in visitors see reviews; after it, everyone does.
    if (!LIVE) await signedInShopper(page);
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
  if (!LIVE) await signedInShopper(page);

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
    await signedInShopper(page);
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
