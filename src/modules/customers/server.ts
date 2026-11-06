import "server-only";

import { cookies, headers } from "next/headers";
import { createErpCustomerSourceFromEnvironment } from "./erp/adapter";
import { isCustomerReviewsLive } from "./release";
import type { SessionStore } from "./source";
import { createCustomerWorkflows } from "./workflows";

const SESSION_COOKIE = "iw_customer_session";
const SESSION_FALLBACK_DAYS = 30;

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
      // Follows the site's address, so sign-in also works on a local http server.
      secure: (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://"),
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
);

export const loadProductReviewsSection = workflows.loadProductReviewsSection;
export const loadAccountPage = workflows.loadAccountPage;
export const loadOwnReviewPage = workflows.loadOwnReviewPage;
export const hasCustomerSession = workflows.hasSession;
export const customerWorkflows = workflows;
