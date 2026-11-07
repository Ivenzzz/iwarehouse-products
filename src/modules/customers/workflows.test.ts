import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CustomerAccount, OwnReview, PublicReviewPage } from "./model";
import {
  CustomerSourceError,
  type CustomerSource,
  type GoogleFlow,
  type GoogleProvider,
  type PendingGoogleAccount,
  type SessionStore,
  type VisitorStore,
} from "./source";
import { createCustomerWorkflows } from "./workflows";

const account: CustomerAccount = {
  id: 1,
  firstName: "Juan",
  lastName: "dela Cruz",
  publicName: "Juan D.",
  email: "juan@example.com",
};

const session_ = { token: "new-token", expiresAt: null, account };

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
    signInWithGoogle: vi.fn().mockResolvedValue({ status: "signed-in", session: session_ }),
    registerWithGoogle: vi.fn().mockResolvedValue(session_),
    logout: vi.fn().mockResolvedValue(undefined),
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

function fakeStore<T>(initial: T | null = null) {
  let value = initial;
  const store: VisitorStore<T> = {
    read: async () => value,
    write: async (next) => {
      value = next;
    },
    clear: async () => {
      value = null;
    },
  };
  return { store, current: () => value };
}

const flow: GoogleFlow = {
  state: "the-state",
  codeVerifier: "the-verifier",
  nonce: "the-nonce",
  next: "/products/17-phone",
};

const pending: PendingGoogleAccount = {
  idToken: "the-id-token",
  nonce: "the-nonce",
  next: "/products/17-phone",
  firstName: "Juan",
  lastName: "dela Cruz",
  email: "juan@example.com",
};

function fakeGoogle(overrides: Partial<GoogleProvider> = {}): GoogleProvider {
  return {
    isConfigured: () => true,
    begin: vi.fn().mockImplementation((next: string) => ({
      flow: { ...flow, next },
      url: "https://accounts.google.test/auth",
    })),
    exchangeCode: vi.fn().mockResolvedValue("the-id-token"),
    ...overrides,
  };
}

function compose({
  source = fakeSource(),
  session = fakeSession(),
  live = true,
  google = fakeGoogle(),
  flows = fakeStore<GoogleFlow>(),
  pendingAccounts = fakeStore<PendingGoogleAccount>(),
}: {
  source?: CustomerSource;
  session?: ReturnType<typeof fakeSession>;
  live?: boolean;
  google?: GoogleProvider;
  flows?: ReturnType<typeof fakeStore<GoogleFlow>>;
  pendingAccounts?: ReturnType<typeof fakeStore<PendingGoogleAccount>>;
} = {}) {
  return createCustomerWorkflows(
    source,
    session.store,
    () => live,
    google,
    flows.store,
    pendingAccounts.store,
  );
}

const validReview = { rating: "5", body: "A proper review with enough words in it." };

describe("starting Google sign-in", () => {
  it("remembers the attempt and goes to Google", async () => {
    const flows = fakeStore<GoogleFlow>();

    await expect(compose({ flows }).startGoogleSignIn("/products/17-phone")).resolves.toBe(
      "https://accounts.google.test/auth",
    );
    expect(flows.current()).toMatchObject({ state: "the-state", next: "/products/17-phone" });
  });

  it.each([
    ["another site", "https://evil.example/phish"],
    ["a protocol-relative address", "//evil.example"],
    ["nothing", null],
  ])("never plans to return to %s", async (_, next) => {
    const flows = fakeStore<GoogleFlow>();

    await compose({ flows }).startGoogleSignIn(next);

    expect(flows.current()?.next).toBe("/account");
  });

  it("explains itself instead of failing when Google isn't set up", async () => {
    const flows = fakeStore<GoogleFlow>();
    const google = fakeGoogle({ isConfigured: () => false });

    const path = await compose({ google, flows }).startGoogleSignIn("/products/17-phone");

    expect(path).toContain("error=unavailable");
    expect(path.startsWith("/account/login")).toBe(true);
    expect(flows.current()).toBeNull();
  });
});

describe("returning from Google", () => {
  const returned = { code: "the-code", state: "the-state", error: null };

  it("signs a known customer in and returns them where they were", async () => {
    const session = fakeSession(null);
    const flows = fakeStore(flow);
    const source = fakeSource();
    const google = fakeGoogle();

    await expect(
      compose({ source, session, flows, google }).finishGoogleSignIn(returned),
    ).resolves.toBe("/products/17-phone");

    expect(google.exchangeCode).toHaveBeenCalledWith("the-code", "the-verifier");
    expect(source.signInWithGoogle).toHaveBeenCalledWith("the-id-token", "the-nonce");
    expect(session.current()).toBe("new-token");
    expect(flows.current()).toBeNull();
  });

  it("sends a new customer to confirm, with no session and no account yet", async () => {
    const session = fakeSession(null);
    const pendingAccounts = fakeStore<PendingGoogleAccount>();
    const source = fakeSource({
      signInWithGoogle: vi.fn().mockResolvedValue({
        status: "needs-confirmation",
        firstName: "Juan",
        lastName: "dela Cruz",
        email: "juan@example.com",
      }),
    });

    await expect(
      compose({ source, session, pendingAccounts, flows: fakeStore(flow) }).finishGoogleSignIn(returned),
    ).resolves.toBe("/account/welcome");

    expect(session.current()).toBeNull();
    expect(source.registerWithGoogle).not.toHaveBeenCalled();
    expect(pendingAccounts.current()).toEqual(pending);
  });

  it.each([
    ["a forged state", { code: "the-code", state: "forged", error: null }, fakeStore(flow)],
    ["a missing state", { code: "the-code", state: null, error: null }, fakeStore(flow)],
    ["no attempt in progress", returned, fakeStore<GoogleFlow>()],
  ])("refuses %s without contacting Google or the ERP", async (_, params, flows) => {
    const session = fakeSession(null);
    const source = fakeSource();
    const google = fakeGoogle();

    const path = await compose({ source, session, google, flows }).finishGoogleSignIn(params);

    expect(path).toBe("/account/login?error=failed");
    expect(google.exchangeCode).not.toHaveBeenCalled();
    expect(source.signInWithGoogle).not.toHaveBeenCalled();
    expect(session.current()).toBeNull();
  });

  it("can't be replayed, because the attempt is used up", async () => {
    const flows = fakeStore(flow);
    const workflows = compose({ flows, session: fakeSession(null) });

    await workflows.finishGoogleSignIn(returned);

    await expect(workflows.finishGoogleSignIn(returned)).resolves.toBe("/account/login?error=failed");
  });

  it("treats a customer cancelling at Google gently, and keeps their place", async () => {
    const google = fakeGoogle();

    const path = await compose({ google, flows: fakeStore(flow) }).finishGoogleSignIn({
      code: null,
      state: "the-state",
      error: "access_denied",
    });

    expect(path).toBe("/account/login?error=cancelled&next=%2Fproducts%2F17-phone");
    expect(google.exchangeCode).not.toHaveBeenCalled();
  });

  it.each([
    ["an unverified Google email", "google-email-unverified", "unverified"],
    ["a token the ERP won't trust", "google-token-invalid", "failed"],
    ["too many attempts", "rate-limited", "busy"],
    ["an outage", "unavailable", "unavailable"],
  ] as const)("explains %s", async (_, kind, problem) => {
    const session = fakeSession(null);
    const source = fakeSource({
      signInWithGoogle: vi.fn().mockRejectedValue(new CustomerSourceError(kind)),
    });

    const path = await compose({ source, session, flows: fakeStore(flow) }).finishGoogleSignIn(returned);

    expect(path).toContain(`error=${problem}`);
    expect(session.current()).toBeNull();
  });

  it("explains it when Google won't exchange the code", async () => {
    const google = fakeGoogle({
      exchangeCode: vi.fn().mockRejectedValue(new CustomerSourceError("google-token-invalid")),
    });

    await expect(
      compose({ google, flows: fakeStore(flow) }).finishGoogleSignIn(returned),
    ).resolves.toContain("error=failed");
  });

  it("does not hide a real programming bug", async () => {
    const source = fakeSource({ signInWithGoogle: vi.fn().mockRejectedValue(new TypeError("bug")) });

    await expect(
      compose({ source, flows: fakeStore(flow) }).finishGoogleSignIn(returned),
    ).rejects.toThrow("bug");
  });
});

describe("confirming a new account", () => {
  const agreed = { firstName: " Johnny ", lastName: " Cruz ", privacyAccepted: "on" };

  it("shows the details from Google", async () => {
    const page = await compose({
      session: fakeSession(null),
      pendingAccounts: fakeStore(pending),
    }).loadWelcomePage();

    expect(page).toEqual({
      status: "ready",
      firstName: "Juan",
      lastName: "dela Cruz",
      email: "juan@example.com",
    });
  });

  it("restarts if the Google details have gone, and skips ahead if already signed in", async () => {
    await expect(compose({ session: fakeSession(null) }).loadWelcomePage()).resolves.toEqual({
      status: "expired",
    });
    await expect(
      compose({ session: fakeSession("token"), pendingAccounts: fakeStore(pending) }).loadWelcomePage(),
    ).resolves.toEqual({ status: "signed-in" });
  });

  it("creates the account with the chosen name, then signs in and returns them", async () => {
    const session = fakeSession(null);
    const pendingAccounts = fakeStore(pending);
    const source = fakeSource();

    await expect(
      compose({ source, session, pendingAccounts }).confirmGoogleAccount(agreed),
    ).resolves.toEqual({ status: "done", next: "/products/17-phone" });

    expect(source.registerWithGoogle).toHaveBeenCalledWith({
      idToken: "the-id-token",
      nonce: "the-nonce",
      firstName: "Johnny",
      lastName: "Cruz",
    });
    expect(session.current()).toBe("new-token");
    expect(pendingAccounts.current()).toBeNull();
  });

  it("allows an empty last name", async () => {
    const source = fakeSource();

    await compose({ source, pendingAccounts: fakeStore(pending) }).confirmGoogleAccount({
      firstName: "Juan",
      privacyAccepted: "on",
    });

    expect(source.registerWithGoogle).toHaveBeenCalledWith(expect.objectContaining({ lastName: "" }));
  });

  it("saves nothing without agreement and a first name", async () => {
    const source = fakeSource();
    const pendingAccounts = fakeStore(pending);

    const result = await compose({ source, pendingAccounts }).confirmGoogleAccount({
      firstName: "   ",
      lastName: "Cruz",
    });

    expect(result).toMatchObject({
      status: "error",
      fieldErrors: {
        firstName: expect.any(String),
        privacyAccepted: expect.stringContaining("privacy notice"),
      },
    });
    expect(source.registerWithGoogle).not.toHaveBeenCalled();
    expect(pendingAccounts.current()).toEqual(pending);
  });

  it("restarts when the Google details have gone or Google's token has expired", async () => {
    await expect(compose().confirmGoogleAccount(agreed)).resolves.toEqual({ status: "signed-out" });

    const pendingAccounts = fakeStore(pending);
    const source = fakeSource({
      registerWithGoogle: vi.fn().mockRejectedValue(new CustomerSourceError("google-token-invalid")),
    });

    await expect(
      compose({ source, pendingAccounts }).confirmGoogleAccount(agreed),
    ).resolves.toEqual({ status: "signed-out" });
    expect(pendingAccounts.current()).toBeNull();
  });

  it("explains it when another account already uses the email", async () => {
    const pendingAccounts = fakeStore(pending);
    const source = fakeSource({
      registerWithGoogle: vi
        .fn()
        .mockRejectedValue(new CustomerSourceError("conflict", "Another account already uses this email address.")),
    });

    await expect(
      compose({ source, pendingAccounts }).confirmGoogleAccount(agreed),
    ).resolves.toMatchObject({ status: "error", message: expect.stringContaining("Another account") });
  });
});

describe("product page reviews", () => {
  let session: ReturnType<typeof fakeSession>;

  beforeEach(() => {
    session = fakeSession(null);
  });

  it("shows shoppers nothing and makes no ERP calls before launch", async () => {
    const source = fakeSource();
    const workflows = compose({ source, session, live: false });

    await expect(workflows.loadProductReviewsSection(17, undefined)).resolves.toEqual({
      status: "hidden",
    });
    expect(source.getPublicReviews).not.toHaveBeenCalled();
    expect(source.getAccount).not.toHaveBeenCalled();
  });

  it("lets signed-in staff test reviews before launch, without search data", async () => {
    const workflows = compose({ live: false });

    const section = await workflows.loadProductReviewsSection(17, undefined);

    expect(section).toMatchObject({ status: "visible", composer: { status: "ready" } });
    expect(section).toMatchObject({ structuredData: undefined });
  });

  it("shows everyone reviews and search data once live", async () => {
    const section = await compose({ session }).loadProductReviewsSection(17, undefined);

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

    const section = await compose({ source, session }).loadProductReviewsSection(17, undefined);

    expect(section).toMatchObject({ status: "visible", structuredData: undefined });
  });

  it("keeps the rating but lists no reviews in search data past page one", async () => {
    const source = fakeSource({
      getPublicReviews: vi.fn().mockResolvedValue({
        ...publicPage,
        meta: { ...publicPage.meta, currentPage: 2 },
      }),
    });

    const section = await compose({ source, session }).loadProductReviewsSection(17, "2");

    expect(source.getPublicReviews).toHaveBeenCalledWith(17, 2);
    if (section.status !== "visible") throw new Error("expected a visible section");
    expect(section.structuredData).toHaveProperty("aggregateRating");
    expect(section.structuredData).not.toHaveProperty("review");
  });

  it.each([["0"], ["-3"], ["abc"], ["1.5"], [undefined]])(
    "treats page %s as page one",
    async (page) => {
      const source = fakeSource();

      await compose({ source, session }).loadProductReviewsSection(17, page);

      expect(source.getPublicReviews).toHaveBeenCalledWith(17, 1);
    },
  );

  it("survives a reviews outage so the product page still renders", async () => {
    const source = fakeSource({
      getPublicReviews: vi.fn().mockRejectedValue(new CustomerSourceError("unavailable")),
    });

    const section = await compose({ source, session }).loadProductReviewsSection(17, undefined);

    expect(section).toMatchObject({ status: "visible", reviews: { status: "unavailable" } });
    expect(section).not.toHaveProperty("structuredData");
  });

  it("does not hide a real programming bug behind the outage message", async () => {
    const source = fakeSource({
      getPublicReviews: vi.fn().mockRejectedValue(new TypeError("bug")),
    });

    await expect(
      compose({ source, session }).loadProductReviewsSection(17, undefined),
    ).rejects.toThrow("bug");
  });

  it.each([
    ["an existing review", { getOwnReviewForProduct: vi.fn().mockResolvedValue(ownReview) }, { status: "reviewed", review: ownReview }],
    ["an expired session", { getAccount: vi.fn().mockRejectedValue(new CustomerSourceError("unauthenticated")) }, { status: "signed-out" }],
    ["an account service outage", { getAccount: vi.fn().mockRejectedValue(new CustomerSourceError("unavailable")) }, { status: "unavailable" }],
  ])("offers the right form state for %s", async (_, overrides, composer) => {
    await expect(
      compose({ source: fakeSource(overrides) }).loadProductReviewsSection(17, undefined),
    ).resolves.toMatchObject({ composer });
  });
});

describe("accounts", () => {
  it("signs out locally even when the ERP can't be reached", async () => {
    const session = fakeSession("token");
    const source = fakeSource({
      logout: vi.fn().mockRejectedValue(new CustomerSourceError("unavailable")),
    });

    await compose({ source, session }).logout();

    expect(session.current()).toBeNull();
  });

  it("clears the session after deleting the account, but not on a wrong email", async () => {
    const session = fakeSession("token");
    const deleteAccount = vi
      .fn()
      .mockRejectedValueOnce(
        new CustomerSourceError("validation", "That doesn't match your account email.", {
          email: "That doesn't match your account email.",
        }),
      )
      .mockResolvedValueOnce(undefined);
    const workflows = compose({ source: fakeSource({ deleteAccount }), session });

    await expect(workflows.deleteAccount({ email: "wrong@example.com" })).resolves.toMatchObject({
      status: "error",
    });
    expect(session.current()).toBe("token");

    await expect(workflows.deleteAccount({ email: "juan@example.com" })).resolves.toEqual({ status: "done" });
    expect(deleteAccount).toHaveBeenLastCalledWith("token", "juan@example.com");
    expect(session.current()).toBeNull();
  });

  it("needs something typed before deleting", async () => {
    const source = fakeSource();

    await expect(compose({ source }).deleteAccount({ email: "  " })).resolves.toMatchObject({
      status: "error",
    });
    expect(source.deleteAccount).not.toHaveBeenCalled();
  });

  it("treats a stale cookie as signed out on the account page", async () => {
    const source = fakeSource({
      getAccount: vi.fn().mockRejectedValue(new CustomerSourceError("unauthenticated")),
    });

    await expect(compose({ source }).loadAccountPage()).resolves.toEqual({ status: "signed-out" });
  });

  it("reports an outage on the account page instead of signing people out", async () => {
    const source = fakeSource({
      getAccount: vi.fn().mockRejectedValue(new CustomerSourceError("unavailable")),
    });

    await expect(compose({ source }).loadAccountPage()).resolves.toEqual({ status: "unavailable" });
  });
});

describe("writing reviews", () => {
  it("creates a review with a numeric rating and trimmed text", async () => {
    const source = fakeSource();

    await expect(
      compose({ source }).createReview(17, { ...validReview, body: `   ${validReview.body}   ` }),
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

    const result = await compose({ source }).createReview(17, form);

    expect(result).toMatchObject({ status: "error", fieldErrors: { [field]: expect.any(String) } });
    expect(source.createReview).not.toHaveBeenCalled();
  });

  it("asks visitors to sign in if the session has gone, and clears the stale cookie", async () => {
    const session = fakeSession("expired");
    const source = fakeSource({
      createReview: vi.fn().mockRejectedValue(new CustomerSourceError("unauthenticated")),
    });

    await expect(compose({ source, session }).createReview(17, validReview)).resolves.toEqual({
      status: "signed-out",
    });
    expect(session.current()).toBeNull();
  });

  it("explains when the customer has already reviewed the product", async () => {
    const source = fakeSource({
      createReview: vi
        .fn()
        .mockRejectedValue(new CustomerSourceError("conflict", "You have already reviewed this product.")),
    });

    await expect(compose({ source }).createReview(17, validReview)).resolves.toMatchObject({
      status: "error",
      message: "You have already reviewed this product.",
    });
  });

  it("tells the customer an edit goes back for approval", async () => {
    await expect(compose().updateReview(9, validReview)).resolves.toMatchObject({
      status: "success",
      message: expect.stringContaining("approved"),
    });
  });

  it("returns not found for a review the ERP won't show this customer", async () => {
    const source = fakeSource({
      getOwnReview: vi.fn().mockRejectedValue(new CustomerSourceError("not-found")),
    });
    const workflows = compose({ source });

    await expect(workflows.loadOwnReviewPage("9")).resolves.toEqual({ status: "not-found" });
    await expect(workflows.loadOwnReviewPage("not-a-number")).resolves.toEqual({ status: "not-found" });
  });
});
