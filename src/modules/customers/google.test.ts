import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { createGoogleProvider } from "./google";

const environment = {
  GOOGLE_CLIENT_ID: "client-id",
  GOOGLE_CLIENT_SECRET: "client-secret",
  NEXT_PUBLIC_SITE_URL: "https://shop.test/",
};

describe("Google provider", () => {
  it("is only ready with both credentials and the site's address", () => {
    expect(createGoogleProvider(environment).isConfigured()).toBe(true);
    expect(createGoogleProvider({ ...environment, GOOGLE_CLIENT_SECRET: "" }).isConfigured()).toBe(false);
    expect(createGoogleProvider({ ...environment, GOOGLE_CLIENT_ID: undefined }).isConfigured()).toBe(false);
    expect(createGoogleProvider({ ...environment, NEXT_PUBLIC_SITE_URL: "" }).isConfigured()).toBe(false);
  });

  it("sends customers to Google with protections, and without the secret", () => {
    const { flow, url } = createGoogleProvider(environment).begin("/products/17");
    const parsed = new URL(url);
    const params = parsed.searchParams;

    expect(parsed.origin).toBe("https://accounts.google.com");
    expect(Object.fromEntries(params)).toMatchObject({
      client_id: "client-id",
      redirect_uri: "https://shop.test/account/google/callback",
      response_type: "code",
      scope: "openid email profile",
      state: flow.state,
      nonce: flow.nonce,
      code_challenge_method: "S256",
      prompt: "select_account",
    });
    expect(params.get("code_challenge")).toBe(
      createHash("sha256").update(flow.codeVerifier).digest("base64url"),
    );
    expect(url).not.toContain("client-secret");
    expect(url).not.toContain(flow.codeVerifier);
    expect(flow.next).toBe("/products/17");
  });

  it("uses fresh random values for every attempt", () => {
    const provider = createGoogleProvider(environment);
    const first = provider.begin("/").flow;
    const second = provider.begin("/").flow;

    expect(first.state).not.toBe(second.state);
    expect(first.nonce).not.toBe(second.nonce);
    expect(first.codeVerifier).not.toBe(second.codeVerifier);
    expect(first.state.length).toBeGreaterThanOrEqual(43);
  });

  it("swaps the code for an ID token, uncached and from the server", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(JSON.stringify({ id_token: "the-id-token" })));

    await expect(
      createGoogleProvider(environment, fetcher).exchangeCode("the-code", "the-verifier"),
    ).resolves.toBe("the-id-token");

    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe("https://oauth2.googleapis.com/token");
    expect(init).toMatchObject({ method: "POST", cache: "no-store" });
    expect(Object.fromEntries(new URLSearchParams(String(init?.body)))).toEqual({
      client_id: "client-id",
      client_secret: "client-secret",
      code: "the-code",
      code_verifier: "the-verifier",
      grant_type: "authorization_code",
      redirect_uri: "https://shop.test/account/google/callback",
    });
  });

  it.each([
    ["Google refuses the code", new Response(JSON.stringify({ error: "invalid_grant" }), { status: 400 }), "google-token-invalid"],
    ["the response has no token", new Response(JSON.stringify({ access_token: "x" })), "unavailable"],
  ])("reports it when %s", async (_, response, kind) => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response);

    await expect(
      createGoogleProvider(environment, fetcher).exchangeCode("code", "verifier"),
    ).rejects.toMatchObject({ kind });
  });

  it("treats a network failure as an outage", async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new Error("offline"));

    await expect(
      createGoogleProvider(environment, fetcher).exchangeCode("code", "verifier"),
    ).rejects.toMatchObject({ kind: "unavailable" });
  });
});
