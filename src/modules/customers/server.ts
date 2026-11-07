import "server-only";

import { cookies, headers } from "next/headers";
import { createErpCustomerSourceFromEnvironment } from "./erp/adapter";
import { createGoogleProvider } from "./google";
import { isCustomerReviewsLive } from "./release";
import type {
  GoogleFlow,
  PendingGoogleAccount,
  SessionStore,
  VisitorStore,
} from "./source";
import { createCustomerWorkflows } from "./workflows";

const SESSION_COOKIE = "iw_customer_session";
const SESSION_FALLBACK_DAYS = 30;

/** Follows the site's address, so sign-in also works on a local http server. */
function usesHttps(): boolean {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://");
}

const session: SessionStore = {
  async read() {
    return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
  },

  async write(token, expiresAt) {
    const expires = expiresAt
      ? new Date(expiresAt)
      : new Date(Date.now() + SESSION_FALLBACK_DAYS * 24 * 60 * 60 * 1000);

    (await cookies()).set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: usesHttps(),
      sameSite: "lax",
      path: "/",
      expires,
    });
  },

  async clear() {
    (await cookies()).delete(SESSION_COOKIE);
  },
};

/**
 * Keeps a short-lived value for one visitor. These hold secrets for the sign-in in
 * progress, so scripts can't read them, and they only go to the paths that need them.
 * SameSite=Lax still sends them when Google redirects the customer back.
 */
function visitorCookie<T>(name: string, path: string, maxAgeSeconds: number): VisitorStore<T> {
  return {
    async read() {
      const value = (await cookies()).get(name)?.value;
      if (!value) return null;

      try {
        return JSON.parse(value) as T;
      } catch {
        return null;
      }
    },

    async write(value) {
      (await cookies()).set(name, JSON.stringify(value), {
        httpOnly: true,
        secure: usesHttps(),
        sameSite: "lax",
        path,
        maxAge: maxAgeSeconds,
      });
    },

    async clear() {
      (await cookies()).delete({ name, path });
    },
  };
}

/**
 * nginx appends the address it saw to X-Forwarded-For, so only the last entry is
 * trustworthy; anything before it was sent by the visitor and could be made up.
 */
async function clientIp(): Promise<string | null> {
  const forwardedFor = (await headers()).get("x-forwarded-for");

  return forwardedFor?.split(",").at(-1)?.trim() || null;
}

const workflows = createCustomerWorkflows(
  createErpCustomerSourceFromEnvironment(clientIp),
  session,
  isCustomerReviewsLive,
  createGoogleProvider(),
  visitorCookie<GoogleFlow>("iw_google_flow", "/account/google", 10 * 60),
  visitorCookie<PendingGoogleAccount>("iw_google_pending", "/account", 15 * 60),
);

export const startGoogleSignIn = workflows.startGoogleSignIn;
export const finishGoogleSignIn = workflows.finishGoogleSignIn;
export const loadWelcomePage = workflows.loadWelcomePage;
export const loadProductReviewsSection = workflows.loadProductReviewsSection;
export const loadAccountPage = workflows.loadAccountPage;
export const loadOwnReviewPage = workflows.loadOwnReviewPage;
export const hasCustomerSession = workflows.hasSession;
export const customerWorkflows = workflows;
