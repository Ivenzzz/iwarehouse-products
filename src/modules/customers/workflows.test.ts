import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CustomerAccount, OwnReview, PublicReviewPage } from "./model";
import { CustomerSourceError, type CustomerSource, type SessionStore } from "./source";
import { createCustomerWorkflows } from "./workflows";

const account: CustomerAccount = {
  id: 1,
  firstName: "Juan",
  lastName: "dela Cruz",
  publicName: "Juan D.",
  email: "juan@example.com",
  emailVerified: true,
};

const ownReview: OwnReview = {
  id: 9,
  rating: 4,
  body: "Solid phone with a great battery.",
  status: "pending",
  rejectionReason: null,
  submittedAt: "2026-11-06T00:00:00+00:00",
  product: { id: 17, name: "Apple iPhone 17 Pro", slug: "apple-iphone-17-pro" },
};

const publicPage: PublicReviewPage = {
  summary: { average: 4.5, count: 2, breakdown: { 5: 1, 4: 1, 3: 0, 2: 0, 1: 0 } },
  reviews: [
    {
      id: 1,
      author: "Ana R.",
      rating: 5,
      body: "Lovely screen and fast too.",
      submittedAt: "2026-11-01T00:00:00+00:00",
    },
  ],
  meta: { currentPage: 1, perPage: 10, total: 2, lastPage: 1 },
};

function fakeSource(overrides: Partial<CustomerSource> = {}): CustomerSource {
  return {
    register: vi.fn().mockResolvedValue(undefined),
    login: vi.fn().mockResolvedValue({ token: "new-token", expiresAt: null, account }),
    logout: vi.fn().mockResolvedValue(undefined),
    forgotPassword: vi.fn().mockResolvedValue(undefined),
    resetPassword: vi.fn().mockResolvedValue(undefined),
    verifyEmail: vi.fn().mockResolvedValue(undefined),
    resendVerification: vi.fn().mockResolvedValue(undefined),
    getAccount: vi.fn().mockResolvedValue(account),
    deleteAccount: vi.fn().mockResolvedValue(undefined),
    listOwnReviews: vi.fn().mockResolvedValue([ownReview]),
    getOwnReview: vi.fn().mockResolvedValue(ownReview),
    getOwnReviewForProduct: vi.fn().mockResolvedValue(null),
    createReview: vi.fn().mockResolvedValue(ownReview),
    updateReview: vi.fn().mockResolvedValue(ownReview),
    deleteReview: vi.fn().mockResolvedValue(undefined),
    getPublicReviews: vi.fn().mockResolvedValue(publicPage),
    ...overrides,
  };
}

function fakeSession(initial: string | null = "token") {
  let token = initial;
  const store: SessionStore = {
    read: async () => token,
    write: async (value) => {
      token = value;
    },
    clear: async () => {
      token = null;
    },
  };
  return { store, current: () => token };
}

const validReview = { rating: "5", body: "A proper review with enough words in it." };
const validRegistration = {
  firstName: "Juan",
  lastName: "dela Cruz",
  email: " JUAN@Example.com ",
  password: "correct-horse-battery",
  privacyAccepted: "on",
};

describe("product page reviews", () => {
  let session: ReturnType<typeof fakeSession>;

  beforeEach(() => {
    session = fakeSession(null);
  });

  it("shows shoppers nothing and makes no ERP calls before launch", async () => {
    const source = fakeSource();
    const workflows = createCustomerWorkflows(source, session.store, () => false);

    await expect(workflows.loadProductReviewsSection(17, undefined)).resolves.toEqual({
      status: "hidden",
    });
    expect(source.getPublicReviews).not.toHaveBeenCalled();
    expect(source.getAccount).not.toHaveBeenCalled();
  });

  it("lets signed-in staff test reviews before launch, without search data", async () => {
    const workflows = createCustomerWorkflows(fakeSource(), fakeSession().store, () => false);

    const section = await workflows.loadProductReviewsSection(17, undefined);

    expect(section).toMatchObject({ status: "visible", composer: { status: "ready" } });
    expect(section).toMatchObject({ structuredData: undefined });
  });

  it("shows everyone reviews and search data once live", async () => {
    const workflows = createCustomerWorkflows(fakeSource(), session.store, () => true);

    const section = await workflows.loadProductReviewsSection(17, undefined);

    expect(section).toMatchObject({
      status: "visible",
      composer: { status: "signed-out" },
      reviews: { status: "ready" },
      structuredData: {
        aggregateRating: { ratingValue: 4.5, reviewCount: 2 },
        review: [{ author: { name: "Ana R." }, reviewBody: "Lovely screen and fast too." }],
      },
    });
  });

  it("leaves search data out when a product has no approved reviews", async () => {
    const source = fakeSource({
      getPublicReviews: vi.fn().mockResolvedValue({
        ...publicPage,
        summary: { average: null, count: 0, breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } },
        reviews: [],
      }),
    });
    const workflows = createCustomerWorkflows(source, session.store, () => true);

    const section = await workflows.loadProductReviewsSection(17, undefined);

    expect(section).toMatchObject({ status: "visible", structuredData: undefined });
  });

  it("keeps the rating but lists no reviews in search data past page one", async () => {
    const source = fakeSource({
      getPublicReviews: vi.fn().mockResolvedValue({
        ...publicPage,
        meta: { ...publicPage.meta, currentPage: 2 },
      }),
    });
    const workflows = createCustomerWorkflows(source, session.store, () => true);

    const section = await workflows.loadProductReviewsSection(17, "2");

    expect(source.getPublicReviews).toHaveBeenCalledWith(17, 2);
    if (section.status !== "visible") throw new Error("expected a visible section");
    expect(section.structuredData).toHaveProperty("aggregateRating");
    expect(section.structuredData).not.toHaveProperty("review");
  });

  it.each([["0"], ["-3"], ["abc"], ["1.5"], [undefined]])(
    "treats page %s as page one",
    async (page) => {
      const source = fakeSource();
      const workflows = createCustomerWorkflows(source, session.store, () => true);

      await workflows.loadProductReviewsSection(17, page);

      expect(source.getPublicReviews).toHaveBeenCalledWith(17, 1);
    },
  );

  it("survives a reviews outage so the product page still renders", async () => {
    const source = fakeSource({
      getPublicReviews: vi.fn().mockRejectedValue(new CustomerSourceError("unavailable")),
    });
    const workflows = createCustomerWorkflows(source, session.store, () => true);

    const section = await workflows.loadProductReviewsSection(17, undefined);

    expect(section).toMatchObject({ status: "visible", reviews: { status: "unavailable" } });
    expect(section).not.toHaveProperty("structuredData");
  });

  it("does not hide a real programming bug behind the outage message", async () => {
    const source = fakeSource({
      getPublicReviews: vi.fn().mockRejectedValue(new TypeError("bug")),
    });
    const workflows = createCustomerWorkflows(source, session.store, () => true);

    await expect(workflows.loadProductReviewsSection(17, undefined)).rejects.toThrow("bug");
  });

  it.each([
    ["an unverified account", { getAccount: vi.fn().mockResolvedValue({ ...account, emailVerified: false }) }, { status: "unverified" }],
    ["an existing review", { getOwnReviewForProduct: vi.fn().mockResolvedValue(ownReview) }, { status: "reviewed", review: ownReview }],
    ["an expired session", { getAccount: vi.fn().mockRejectedValue(new CustomerSourceError("unauthenticated")) }, { status: "signed-out" }],
    ["an account service outage", { getAccount: vi.fn().mockRejectedValue(new CustomerSourceError("unavailable")) }, { status: "unavailable" }],
  ])("offers the right form state for %s", async (_, overrides, composer) => {
    const workflows = createCustomerWorkflows(fakeSource(overrides), fakeSession().store, () => true);

    await expect(workflows.loadProductReviewsSection(17, undefined)).resolves.toMatchObject({ composer });
  });
});

describe("accounts", () => {
  it("registers with a tidied email", async () => {
    const source = fakeSource();
    const workflows = createCustomerWorkflows(source, fakeSession(null).store, () => true);

    await expect(workflows.register(validRegistration)).resolves.toMatchObject({ status: "success" });
    expect(source.register).toHaveBeenCalledWith(
      expect.objectContaining({ email: "juan@example.com" }),
    );
  });

  it("requires agreement to the privacy notice and a long enough password", async () => {
    const source = fakeSource();
    const workflows = createCustomerWorkflows(source, fakeSession(null).store, () => true);

    const result = await workflows.register({
      ...validRegistration,
      password: "short",
      privacyAccepted: undefined,
    });

    expect(result).toMatchObject({
      status: "error",
      fieldErrors: {
        password: expect.any(String),
        privacyAccepted: expect.stringContaining("privacy notice"),
      },
    });
    expect(source.register).not.toHaveBeenCalled();
  });

  it("gives bots that fill the hidden field a normal reply and creates nothing", async () => {
    const source = fakeSource();
    const workflows = createCustomerWorkflows(source, fakeSession(null).store, () => true);

    await expect(
      workflows.register({ ...validRegistration, company: "Spam Inc" }),
    ).resolves.toMatchObject({ status: "success" });
    expect(source.register).not.toHaveBeenCalled();
  });

  it("stores the token on login", async () => {
    const session = fakeSession(null);
    const workflows = createCustomerWorkflows(fakeSource(), session.store, () => true);

    await expect(
      workflows.login({ email: "juan@example.com", password: "whatever" }),
    ).resolves.toEqual({ status: "done" });
    expect(session.current()).toBe("new-token");
  });

  it("shows the ERP's generic message when login fails and stores nothing", async () => {
    const session = fakeSession(null);
    const source = fakeSource({
      login: vi.fn().mockRejectedValue(
        new CustomerSourceError("validation", "Incorrect email or password.", {
          email: "Incorrect email or password.",
        }),
      ),
    });
    const workflows = createCustomerWorkflows(source, session.store, () => true);

    await expect(
      workflows.login({ email: "juan@example.com", password: "wrong" }),
    ).resolves.toMatchObject({ status: "error", message: "Incorrect email or password." });
    expect(session.current()).toBeNull();
  });

  it("signs out locally even when the ERP can't be reached", async () => {
    const session = fakeSession("token");
    const source = fakeSource({
      logout: vi.fn().mockRejectedValue(new CustomerSourceError("unavailable")),
    });
    const workflows = createCustomerWorkflows(source, session.store, () => true);

    await workflows.logout();

    expect(session.current()).toBeNull();
  });

  it("clears the session after deleting the account, but not on a wrong password", async () => {
    const session = fakeSession("token");
    const deleteAccount = vi
      .fn()
      .mockRejectedValueOnce(
        new CustomerSourceError("validation", "That password is incorrect.", {
          password: "That password is incorrect.",
        }),
      )
      .mockResolvedValueOnce(undefined);
    const workflows = createCustomerWorkflows(fakeSource({ deleteAccount }), session.store, () => true);

    await expect(workflows.deleteAccount({ password: "wrong" })).resolves.toMatchObject({
      status: "error",
    });
    expect(session.current()).toBe("token");

    await expect(workflows.deleteAccount({ password: "right" })).resolves.toEqual({ status: "done" });
    expect(session.current()).toBeNull();
  });

  it("treats a stale cookie as signed out on the account page", async () => {
    const source = fakeSource({
      getAccount: vi.fn().mockRejectedValue(new CustomerSourceError("unauthenticated")),
    });
    const workflows = createCustomerWorkflows(source, fakeSession().store, () => true);

    await expect(workflows.loadAccountPage()).resolves.toEqual({ status: "signed-out" });
  });

  it("reports an outage on the account page instead of signing people out", async () => {
    const source = fakeSource({
      getAccount: vi.fn().mockRejectedValue(new CustomerSourceError("unavailable")),
    });
    const workflows = createCustomerWorkflows(source, fakeSession().store, () => true);

    await expect(workflows.loadAccountPage()).resolves.toEqual({ status: "unavailable" });
  });

  it("rejects a confirmation link with missing parts without calling the ERP", async () => {
    const source = fakeSource();
    const workflows = createCustomerWorkflows(source, fakeSession(null).store, () => true);

    await expect(workflows.verifyEmail({ id: "1" })).resolves.toMatchObject({ status: "error" });
    expect(source.verifyEmail).not.toHaveBeenCalled();
  });
});

describe("writing reviews", () => {
  it("creates a review with a numeric rating and trimmed text", async () => {
    const source = fakeSource();
    const workflows = createCustomerWorkflows(source, fakeSession().store, () => true);

    await expect(
      workflows.createReview(17, { ...validReview, body: `   ${validReview.body}   ` }),
    ).resolves.toEqual({ status: "done" });
    expect(source.createReview).toHaveBeenCalledWith("token", 17, {
      rating: 5,
      body: validReview.body,
    });
  });

  it.each([
    ["no rating", { body: validReview.body }, "rating"],
    ["a rating out of range", { rating: "6", body: validReview.body }, "rating"],
    ["too little text", { rating: "5", body: "Too short" }, "body"],
    ["too much text", { rating: "5", body: "x".repeat(2001) }, "body"],
  ])("rejects %s before calling the ERP", async (_, form, field) => {
    const source = fakeSource();
    const workflows = createCustomerWorkflows(source, fakeSession().store, () => true);

    const result = await workflows.createReview(17, form);

    expect(result).toMatchObject({ status: "error", fieldErrors: { [field]: expect.any(String) } });
    expect(source.createReview).not.toHaveBeenCalled();
  });

  it("asks visitors to sign in if the session has gone, and clears the stale cookie", async () => {
    const session = fakeSession("expired");
    const source = fakeSource({
      createReview: vi.fn().mockRejectedValue(new CustomerSourceError("unauthenticated")),
    });
    const workflows = createCustomerWorkflows(source, session.store, () => true);

    await expect(workflows.createReview(17, validReview)).resolves.toEqual({ status: "signed-out" });
    expect(session.current()).toBeNull();
  });

  it("explains when the customer has already reviewed the product", async () => {
    const source = fakeSource({
      createReview: vi
        .fn()
        .mockRejectedValue(
          new CustomerSourceError("already-reviewed", "You have already reviewed this product."),
        ),
    });
    const workflows = createCustomerWorkflows(source, fakeSession().store, () => true);

    await expect(workflows.createReview(17, validReview)).resolves.toMatchObject({
      status: "error",
      message: "You have already reviewed this product.",
    });
  });

  it("tells the customer an edit goes back for approval", async () => {
    const workflows = createCustomerWorkflows(fakeSource(), fakeSession().store, () => true);

    await expect(workflows.updateReview(9, validReview)).resolves.toMatchObject({
      status: "success",
      message: expect.stringContaining("approved"),
    });
  });

  it("returns not found for a review the ERP won't show this customer", async () => {
    const source = fakeSource({
      getOwnReview: vi.fn().mockRejectedValue(new CustomerSourceError("not-found")),
    });
    const workflows = createCustomerWorkflows(source, fakeSession().store, () => true);

    await expect(workflows.loadOwnReviewPage("9")).resolves.toEqual({ status: "not-found" });
    await expect(workflows.loadOwnReviewPage("not-a-number")).resolves.toEqual({ status: "not-found" });
  });
});
