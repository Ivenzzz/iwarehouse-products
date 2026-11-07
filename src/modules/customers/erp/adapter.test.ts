import { describe, expect, it, vi } from "vitest";
import { CustomerSourceError } from "../source";
import { createErpCustomerSource } from "./adapter";

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status });
}

function sourceWith(response: Response, clientIp: string | null = "203.0.113.5") {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response);
  const source = createErpCustomerSource({
    storefrontUrl: "https://erp.test/api/v1/storefront/",
    token: "machine-token",
    clientIp: async () => clientIp,
    fetcher,
  });
  return { source, fetcher };
}

const accountDto = {
  id: 1,
  first_name: "Juan",
  last_name: "dela Cruz",
  public_name: "Juan D.",
  email: "juan@example.com",
};

describe("ERP customer source", () => {
  it("sends personal requests uncached with both tokens and the visitor's address", async () => {
    const { source, fetcher } = sourceWith(json(200, { data: accountDto }));

    await expect(source.getAccount("customer-token")).resolves.toMatchObject({
      firstName: "Juan",
      publicName: "Juan D.",
    });

    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe("https://erp.test/api/v1/storefront/me");
    expect(init).toMatchObject({
      method: "GET",
      cache: "no-store",
      headers: {
        "X-Storefront-Token": "machine-token",
        "X-Storefront-Client-Ip": "203.0.113.5",
        Authorization: "Bearer customer-token",
      },
    });
  });

  it("signs a known customer in", async () => {
    const { source, fetcher } = sourceWith(
      json(200, {
        status: "signed_in",
        token: "session-token",
        expires_at: "2026-12-06T00:00:00+00:00",
        account: accountDto,
      }),
    );

    await expect(source.signInWithGoogle("id-token", "nonce")).resolves.toEqual({
      status: "signed-in",
      session: {
        token: "session-token",
        expiresAt: "2026-12-06T00:00:00+00:00",
        account: expect.objectContaining({ publicName: "Juan D." }),
      },
    });

    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe("https://erp.test/api/v1/storefront/auth/google");
    expect(JSON.parse(String(init?.body))).toEqual({ id_token: "id-token", nonce: "nonce" });
  });

  it("recognises a new customer who still needs to confirm", async () => {
    const { source } = sourceWith(
      json(200, {
        status: "needs_confirmation",
        first_name: "Juan",
        last_name: "",
        email: "juan@example.com",
      }),
    );

    await expect(source.signInWithGoogle("id-token", "nonce")).resolves.toEqual({
      status: "needs-confirmation",
      firstName: "Juan",
      lastName: "",
      email: "juan@example.com",
    });
  });

  it("sends the agreement and the chosen name, but never an email, when registering", async () => {
    const { source, fetcher } = sourceWith(
      json(200, { status: "signed_in", token: "t", expires_at: null, account: accountDto }),
    );

    await source.registerWithGoogle({
      idToken: "id-token",
      nonce: "nonce",
      firstName: "Johnny",
      lastName: "Cruz",
    });

    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe("https://erp.test/api/v1/storefront/auth/google/register");
    expect(JSON.parse(String(init?.body))).toEqual({
      id_token: "id-token",
      nonce: "nonce",
      first_name: "Johnny",
      last_name: "Cruz",
      privacy_accepted: true,
      privacy_notice_version: "2026-11",
    });
  });

  it("reads public reviews uncached, so a takedown shows at once, with no customer token", async () => {
    const { source, fetcher } = sourceWith(
      json(200, {
        summary: { average: 5, count: 1, breakdown: { 5: 1, 4: 0, 3: 0, 2: 0, 1: 0 } },
        data: [{ id: 1, author: "Ana R.", rating: 5, body: "Great phone indeed.", submitted_at: null }],
        meta: { current_page: 1, per_page: 10, total: 1, last_page: 1 },
      }),
    );

    await expect(source.getPublicReviews(17, 1)).resolves.toMatchObject({
      reviews: [{ author: "Ana R." }],
      meta: { currentPage: 1, lastPage: 1 },
    });

    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe("https://erp.test/api/v1/storefront/products/17/reviews?page=1");
    expect(init).toMatchObject({
      cache: "no-store",
      headers: {
        "X-Storefront-Token": "machine-token",
        "X-Storefront-Client-Ip": "203.0.113.5",
      },
    });
    expect((init?.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it("maps ERP field errors to the form's field names", async () => {
    const { source } = sourceWith(
      json(422, { message: "Invalid", errors: { first_name: ["Enter your first name."] } }),
    );

    await expect(
      source.registerWithGoogle({ idToken: "t", nonce: "n", firstName: "", lastName: "" }),
    ).rejects.toMatchObject({
      kind: "validation",
      message: "Enter your first name.",
      fieldErrors: { firstName: "Enter your first name." },
    });
  });

  it.each([
    [401, { message: "Unauthenticated." }, "unauthenticated"],
    [401, { message: "Invalid storefront API token." }, "unavailable"],
    [404, {}, "not-found"],
    [409, { code: "already_reviewed", message: "Already reviewed" }, "conflict"],
    [409, { code: "email_in_use", message: "Email in use" }, "conflict"],
    [422, { code: "google_token_invalid", message: "Bad token" }, "google-token-invalid"],
    [422, { code: "google_email_unverified", message: "Unverified" }, "google-email-unverified"],
    [429, {}, "rate-limited"],
    [500, {}, "unavailable"],
  ])("treats a %i with %j as %s", async (status, body, kind) => {
    const { source } = sourceWith(json(status, body));

    await expect(source.getAccount("token")).rejects.toMatchObject({ kind });
  });

  it("treats a network failure or surprising response as an outage", async () => {
    const down = createErpCustomerSource({
      storefrontUrl: "https://erp.test",
      token: "t",
      clientIp: async () => null,
      fetcher: vi.fn<typeof fetch>().mockRejectedValue(new Error("offline")),
    });
    await expect(down.getAccount("token")).rejects.toBeInstanceOf(CustomerSourceError);

    const { source } = sourceWith(json(200, { data: { unexpected: true } }));
    await expect(source.getAccount("token")).rejects.toMatchObject({ kind: "unavailable" });
  });
});
