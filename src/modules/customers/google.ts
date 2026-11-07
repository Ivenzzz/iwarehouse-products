import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { CustomerSourceError, type GoogleProvider } from "./source";

const GOOGLE_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

const tokenResponseSchema = z.object({ id_token: z.string().min(1) });

interface GoogleEnvironment {
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  /** Only overridden by tests, which use a fake Google. */
  GOOGLE_AUTHORIZE_URL?: string;
  GOOGLE_TOKEN_URL?: string;
  NEXT_PUBLIC_SITE_URL?: string;
}

function randomToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Google's sign-in, run on this site's server: the customer goes to Google and
 * back, and no Google script loads on our pages. The client secret never leaves
 * the server, and the redirect address comes from configuration rather than the
 * request, so it can't be influenced by a visitor.
 */
export function createGoogleProvider(
  environment: GoogleEnvironment = process.env as GoogleEnvironment,
  fetcher: typeof fetch = fetch,
): GoogleProvider {
  const clientId = environment.GOOGLE_CLIENT_ID ?? "";
  const clientSecret = environment.GOOGLE_CLIENT_SECRET ?? "";
  const siteUrl = (environment.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const redirectUri = `${siteUrl}/account/google/callback`;

  return {
    isConfigured: () => Boolean(clientId && clientSecret && siteUrl),

    begin(next) {
      const flow = {
        state: randomToken(),
        codeVerifier: randomToken(),
        nonce: randomToken(),
        next,
      };

      const url = new URL(environment.GOOGLE_AUTHORIZE_URL ?? GOOGLE_AUTHORIZE_URL);
      url.search = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "openid email profile",
        state: flow.state,
        nonce: flow.nonce,
        code_challenge: createHash("sha256").update(flow.codeVerifier).digest("base64url"),
        code_challenge_method: "S256",
        // Always ask, so nobody on a shared computer becomes the last person by accident.
        prompt: "select_account",
      }).toString();

      return { flow, url: url.toString() };
    },

    async exchangeCode(code, codeVerifier) {
      try {
        const response = await fetcher(environment.GOOGLE_TOKEN_URL ?? GOOGLE_TOKEN_URL, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            code,
            code_verifier: codeVerifier,
            grant_type: "authorization_code",
            redirect_uri: redirectUri,
          }).toString(),
          cache: "no-store",
          signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) throw new CustomerSourceError("google-token-invalid");

        return tokenResponseSchema.parse(await response.json()).id_token;
      } catch (error) {
        if (error instanceof CustomerSourceError) throw error;
        throw new CustomerSourceError("unavailable");
      }
    },
  };
}
