import { z } from "zod";
import {
  REVIEW_MAX_LENGTH,
  REVIEW_MIN_LENGTH,
  type AccountPage,
  type FormState,
  type OwnReviewPage,
  type ProductReviewsSection,
  type ReviewComposer,
  type ReviewInput,
  type SignInProblem,
  type Submission,
  type WelcomePage,
} from "./model";
import { safeRedirectPath } from "./safe-redirect";
import {
  CustomerSourceError,
  type CustomerSource,
  type GoogleFlow,
  type GoogleProvider,
  type PendingGoogleAccount,
  type SessionStore,
  type VisitorStore,
} from "./source";
import { reviewStructuredData } from "./structured-data";

type RawForm = Record<string, unknown>;

const LOGIN_PATH = "/account/login";
const WELCOME_PATH = "/account/welcome";
const UNAVAILABLE_MESSAGE =
  "We couldn’t complete that right now. Please try again in a moment.";

const welcomeSchema = z.object({
  firstName: z.string().trim().min(1, "Enter your first name.").max(80),
  lastName: z.string().trim().max(80),
  privacyAccepted: z.literal("on", {
    error: "Please agree to the privacy notice to continue.",
  }),
});

const reviewSchema = z.object({
  rating: z.coerce
    .number({ error: "Choose a star rating." })
    .int("Choose a star rating.")
    .min(1, "Choose a star rating.")
    .max(5, "Choose a star rating."),
  body: z
    .string()
    .trim()
    .min(REVIEW_MIN_LENGTH, `Please write at least ${REVIEW_MIN_LENGTH} characters.`)
    .max(REVIEW_MAX_LENGTH, `Please keep it under ${REVIEW_MAX_LENGTH} characters.`),
});

function invalidForm(error: z.ZodError): FormState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "form");
    fieldErrors[field] ??= issue.message;
  }

  return {
    status: "error",
    message: Object.values(fieldErrors)[0] ?? "Please check the form and try again.",
    fieldErrors,
  };
}

/** Turns an expected ERP refusal into a form message; real bugs still throw. */
function failedForm(error: unknown): FormState {
  if (!(error instanceof CustomerSourceError)) throw error;

  return {
    status: "error",
    message: error.kind === "unavailable" ? UNAVAILABLE_MESSAGE : error.message,
    ...(Object.keys(error.fieldErrors).length ? { fieldErrors: error.fieldErrors } : {}),
  };
}

function isOutage(error: unknown): boolean {
  if (error instanceof CustomerSourceError) {
    return error.kind !== "unauthenticated" && error.kind !== "not-found";
  }
  throw error;
}

function pageNumber(raw: string | string[] | undefined): number {
  const page = Number(Array.isArray(raw) ? raw[0] : raw);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function signInProblemPath(problem: SignInProblem, next: string | null): string {
  const params = new URLSearchParams({ error: problem });
  if (next) params.set("next", next);
  return `${LOGIN_PATH}?${params}`;
}

function problemFrom(error: unknown): SignInProblem {
  if (!(error instanceof CustomerSourceError)) throw error;

  switch (error.kind) {
    case "google-email-unverified":
      return "unverified";
    case "rate-limited":
      return "busy";
    case "unavailable":
      return "unavailable";
    default:
      return "failed";
  }
}

export function createCustomerWorkflows(
  source: CustomerSource,
  session: SessionStore,
  isLive: () => boolean,
  google: GoogleProvider,
  googleFlows: VisitorStore<GoogleFlow>,
  pendingAccounts: VisitorStore<PendingGoogleAccount>,
) {
  /** Runs a signed-in form action; an expired session clears the stale cookie. */
  async function signedIn(
    action: (token: string) => Promise<Submission>,
  ): Promise<Submission> {
    const token = await session.read();
    if (!token) return { status: "signed-out" };

    try {
      return await action(token);
    } catch (error) {
      if (error instanceof CustomerSourceError && error.kind === "unauthenticated") {
        await session.clear();
        return { status: "signed-out" };
      }
      return failedForm(error);
    }
  }

  /**
   * A cookie alone proves nothing: its session may have been revoked or the account
   * deleted. Pages can't remove a stale cookie while rendering, so sign-in has to ask
   * the ERP here, or it and /account would keep redirecting to each other. During an
   * outage this says no, so the visitor sees the sign-in page instead of a loop.
   */
  async function hasLiveSession(): Promise<boolean> {
    const token = await session.read();
    if (!token) return false;

    try {
      await source.getAccount(token);
      return true;
    } catch (error) {
      if (error instanceof CustomerSourceError) return false;
      throw error;
    }
  }

  async function loadComposer(productId: number): Promise<ReviewComposer> {
    const token = await session.read();
    if (!token) return { status: "signed-out" };

    try {
      const account = await source.getAccount(token);
      const review = await source.getOwnReviewForProduct(token, productId);
      return review
        ? { status: "reviewed", review }
        : { status: "ready", publicName: account.publicName };
    } catch (error) {
      return isOutage(error) ? { status: "unavailable" } : { status: "signed-out" };
    }
  }

  return {
    /** Remembers this attempt and returns the address to send the customer to. */
    async startGoogleSignIn(rawNext: string | null): Promise<string> {
      const next = safeRedirectPath(rawNext);
      if (!google.isConfigured()) return signInProblemPath("unavailable", next);

      const { flow, url } = google.begin(next);
      await googleFlows.write(flow);
      return url;
    },

    /**
     * Handles Google sending the customer back, and returns where to go next.
     * The state check is what stops a crafted link signing a visitor in to
     * somebody else's Google account, so nothing happens without it.
     */
    async finishGoogleSignIn({
      code,
      state,
      error,
    }: {
      code: string | null;
      state: string | null;
      error: string | null;
    }): Promise<string> {
      const flow = await googleFlows.read();
      await googleFlows.clear();

      if (!flow || !state || flow.state !== state) return signInProblemPath("failed", null);
      if (error) return signInProblemPath("cancelled", flow.next);
      if (!code) return signInProblemPath("failed", flow.next);

      try {
        const idToken = await google.exchangeCode(code, flow.codeVerifier);
        const outcome = await source.signInWithGoogle(idToken, flow.nonce);

        if (outcome.status === "signed-in") {
          await session.write(outcome.session.token, outcome.session.expiresAt);
          return flow.next;
        }

        await pendingAccounts.write({
          idToken,
          nonce: flow.nonce,
          next: flow.next,
          firstName: outcome.firstName,
          lastName: outcome.lastName,
          email: outcome.email,
        });
        return WELCOME_PATH;
      } catch (caught) {
        return signInProblemPath(problemFrom(caught), flow.next);
      }
    },

    async loadWelcomePage(): Promise<WelcomePage> {
      if (await hasLiveSession()) return { status: "signed-in" };

      const pending = await pendingAccounts.read();
      return pending
        ? {
            status: "ready",
            firstName: pending.firstName,
            lastName: pending.lastName,
            email: pending.email,
          }
        : { status: "expired" };
    },

    /** The account only comes to exist here, once the customer has agreed. */
    async confirmGoogleAccount(form: RawForm): Promise<Submission> {
      const pending = await pendingAccounts.read();
      if (!pending) return { status: "signed-out" };

      const parsed = welcomeSchema.safeParse({ lastName: "", ...form });
      if (!parsed.success) return invalidForm(parsed.error);

      try {
        const created = await source.registerWithGoogle({
          idToken: pending.idToken,
          nonce: pending.nonce,
          firstName: parsed.data.firstName,
          lastName: parsed.data.lastName,
        });
        await session.write(created.token, created.expiresAt);
        await pendingAccounts.clear();
        return { status: "done", next: pending.next };
      } catch (error) {
        // Google's token only lasts about an hour, so a form left open has to restart.
        if (error instanceof CustomerSourceError && error.kind === "google-token-invalid") {
          await pendingAccounts.clear();
          return { status: "signed-out" };
        }
        return failedForm(error);
      }
    },

    /**
     * Everything the product page needs. It never throws for an ERP problem, so
     * a reviews outage can't take the product page down with it.
     */
    async loadProductReviewsSection(
      productId: number,
      rawPage: string | string[] | undefined,
    ): Promise<ProductReviewsSection> {
      const composer = await loadComposer(productId);
      const live = isLive();

      if (!live && composer.status === "signed-out") return { status: "hidden" };

      try {
        const data = await source.getPublicReviews(productId, pageNumber(rawPage));
        return {
          status: "visible",
          productId,
          composer,
          reviews: { status: "ready", data },
          structuredData: live ? reviewStructuredData(data) : undefined,
        };
      } catch (error) {
        if (!(error instanceof CustomerSourceError)) throw error;
        return { status: "visible", productId, composer, reviews: { status: "unavailable" } };
      }
    },

    async loadAccountPage(): Promise<AccountPage> {
      const token = await session.read();
      if (!token) return { status: "signed-out" };

      try {
        const [account, reviews] = await Promise.all([
          source.getAccount(token),
          source.listOwnReviews(token),
        ]);
        return { status: "ready", account, reviews };
      } catch (error) {
        return isOutage(error) ? { status: "unavailable" } : { status: "signed-out" };
      }
    },

    async loadOwnReviewPage(rawId: string): Promise<OwnReviewPage> {
      const token = await session.read();
      if (!token) return { status: "signed-out" };

      const reviewId = Number(rawId);
      if (!Number.isInteger(reviewId) || reviewId <= 0) return { status: "not-found" };

      try {
        return { status: "ready", review: await source.getOwnReview(token, reviewId) };
      } catch (error) {
        if (error instanceof CustomerSourceError && error.kind === "not-found") {
          return { status: "not-found" };
        }
        return isOutage(error) ? { status: "unavailable" } : { status: "signed-out" };
      }
    },

    hasLiveSession,

    /** The cookie always goes, even if the ERP can't be told right now. */
    async logout(): Promise<void> {
      const token = await session.read();
      await session.clear();

      if (token) {
        await source.logout(token).catch((error: unknown) => {
          if (!(error instanceof CustomerSourceError)) throw error;
        });
      }
    },

    deleteAccount(form: RawForm): Promise<Submission> {
      const parsed = z
        .object({ email: z.string().trim().min(1, "Enter your email to confirm.").max(255) })
        .safeParse(form);
      if (!parsed.success) return Promise.resolve(invalidForm(parsed.error));

      return signedIn(async (token) => {
        await source.deleteAccount(token, parsed.data.email);
        await session.clear();
        return { status: "done" };
      });
    },

    createReview(productId: number, form: RawForm): Promise<Submission> {
      const parsed = reviewSchema.safeParse(form);
      if (!parsed.success) return Promise.resolve(invalidForm(parsed.error));

      return signedIn(async (token) => {
        await source.createReview(token, productId, parsed.data satisfies ReviewInput);
        return { status: "done" };
      });
    },

    updateReview(reviewId: number, form: RawForm): Promise<Submission> {
      const parsed = reviewSchema.safeParse(form);
      if (!parsed.success) return Promise.resolve(invalidForm(parsed.error));

      return signedIn(async (token) => {
        await source.updateReview(token, reviewId, parsed.data satisfies ReviewInput);
        return { status: "success", message: "Thanks. Your review will appear again once it’s approved." };
      });
    },

    deleteReview(reviewId: number): Promise<Submission> {
      return signedIn(async (token) => {
        await source.deleteReview(token, reviewId);
        return { status: "done" };
      });
    },
  };
}
