import { z } from "zod";
import {
  PASSWORD_MIN_LENGTH,
  REVIEW_MAX_LENGTH,
  REVIEW_MIN_LENGTH,
  type AccountPage,
  type FormState,
  type OwnReviewPage,
  type ProductReviewsSection,
  type ReviewComposer,
  type ReviewInput,
  type Submission,
} from "./model";
import {
  CustomerSourceError,
  type CustomerSource,
  type SessionStore,
  type VerificationLink,
} from "./source";
import { reviewStructuredData } from "./structured-data";

type RawForm = Record<string, unknown>;

const CHECK_YOUR_EMAIL =
  "Almost there. Check your email for a link to confirm your account.";
const UNAVAILABLE_MESSAGE =
  "We couldn’t complete that right now. Please try again in a moment.";

const emailField = z.string().trim().toLowerCase().email("Enter a valid email address.").max(255);
const passwordField = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters.`)
  .max(255);

const registrationSchema = z.object({
  firstName: z.string().trim().min(1, "Enter your first name.").max(80),
  lastName: z.string().trim().min(1, "Enter your last name.").max(80),
  email: emailField,
  password: passwordField,
  privacyAccepted: z.literal("on", {
    error: "Please agree to the privacy notice to continue.",
  }),
});

const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Enter your password.").max(255),
});

const resetSchema = z.object({
  email: emailField,
  token: z.string().min(1, "This reset link is invalid or has expired."),
  password: passwordField,
});

const verificationSchema = z.object({
  id: z.string().min(1),
  expires: z.string().min(1),
  signature: z.string().min(1),
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

export function createCustomerWorkflows(
  source: CustomerSource,
  session: SessionStore,
  isLive: () => boolean,
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

  async function loadComposer(productId: number): Promise<ReviewComposer> {
    const token = await session.read();
    if (!token) return { status: "signed-out" };

    try {
      const account = await source.getAccount(token);
      if (!account.emailVerified) return { status: "unverified" };

      const review = await source.getOwnReviewForProduct(token, productId);
      return review
        ? { status: "reviewed", review }
        : { status: "ready", publicName: account.publicName };
    } catch (error) {
      return isOutage(error) ? { status: "unavailable" } : { status: "signed-out" };
    }
  }

  return {
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
        const [account, review] = await Promise.all([
          source.getAccount(token),
          source.getOwnReview(token, reviewId),
        ]);
        return { status: "ready", account, review };
      } catch (error) {
        if (error instanceof CustomerSourceError && error.kind === "not-found") {
          return { status: "not-found" };
        }
        return isOutage(error) ? { status: "unavailable" } : { status: "signed-out" };
      }
    },

    async hasSession(): Promise<boolean> {
      return (await session.read()) !== null;
    },

    async register(form: RawForm): Promise<FormState> {
      // A hidden field only bots fill in. They get the normal reply, so they
      // can't tell they were caught, and no account is created.
      if (form.company) return { status: "success", message: CHECK_YOUR_EMAIL };

      const parsed = registrationSchema.safeParse(form);
      if (!parsed.success) return invalidForm(parsed.error);

      try {
        await source.register(parsed.data);
        return { status: "success", message: CHECK_YOUR_EMAIL };
      } catch (error) {
        return failedForm(error);
      }
    },

    async login(form: RawForm): Promise<Submission> {
      const parsed = loginSchema.safeParse(form);
      if (!parsed.success) return invalidForm(parsed.error);

      try {
        const created = await source.login(parsed.data.email, parsed.data.password);
        await session.write(created.token, created.expiresAt);
        return { status: "done" };
      } catch (error) {
        return failedForm(error);
      }
    },

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

    async forgotPassword(form: RawForm): Promise<FormState> {
      const parsed = z.object({ email: emailField }).safeParse(form);
      if (!parsed.success) return invalidForm(parsed.error);

      try {
        await source.forgotPassword(parsed.data.email);
        return {
          status: "success",
          message: "If that email has an account, we’ve sent a link to reset the password.",
        };
      } catch (error) {
        return failedForm(error);
      }
    },

    async resetPassword(form: RawForm): Promise<Submission> {
      const parsed = resetSchema.safeParse(form);
      if (!parsed.success) return invalidForm(parsed.error);

      try {
        await source.resetPassword(parsed.data);
        await session.clear();
        return { status: "done" };
      } catch (error) {
        return failedForm(error);
      }
    },

    async verifyEmail(form: RawForm): Promise<FormState> {
      const parsed = verificationSchema.safeParse(form);
      if (!parsed.success) {
        return { status: "error", message: "This confirmation link is invalid or has expired." };
      }

      try {
        await source.verifyEmail(parsed.data satisfies VerificationLink);
        return { status: "success", message: "Your email is confirmed. You can now write reviews." };
      } catch (error) {
        return failedForm(error);
      }
    },

    resendVerification(): Promise<Submission> {
      return signedIn(async (token) => {
        await source.resendVerification(token);
        return { status: "success", message: "We’ve sent you a new confirmation link." };
      });
    },

    deleteAccount(form: RawForm): Promise<Submission> {
      const parsed = z
        .object({ password: z.string().min(1, "Enter your password to confirm.").max(255) })
        .safeParse(form);
      if (!parsed.success) return Promise.resolve(invalidForm(parsed.error));

      return signedIn(async (token) => {
        await source.deleteAccount(token, parsed.data.password);
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
