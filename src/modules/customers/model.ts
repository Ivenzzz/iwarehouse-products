export const PASSWORD_MIN_LENGTH = 10;
export const REVIEW_MIN_LENGTH = 20;
export const REVIEW_MAX_LENGTH = 2000;

/**
 * Stored with the customer's agreement at sign-up. Change it whenever the
 * privacy notice's wording changes.
 */
export const PRIVACY_NOTICE_VERSION = "2026-11";

export interface CustomerAccount {
  id: number;
  firstName: string;
  lastName: string;
  publicName: string;
  email: string;
  emailVerified: boolean;
}

export type ReviewStatus = "pending" | "approved" | "rejected";

export interface OwnReview {
  id: number;
  rating: number;
  body: string;
  status: ReviewStatus;
  rejectionReason: string | null;
  submittedAt: string | null;
  product: { id: number; name: string; slug: string };
}

export interface PublicReview {
  id: number;
  author: string;
  rating: number;
  body: string;
  submittedAt: string | null;
}

export interface ReviewSummary {
  average: number | null;
  count: number;
  breakdown: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface PublicReviewPage {
  summary: ReviewSummary;
  reviews: PublicReview[];
  meta: { currentPage: number; perPage: number; total: number; lastPage: number };
}

export interface ReviewInput {
  rating: number;
  body: string;
}

/** What the "write a review" area of a product page should offer this visitor. */
export type ReviewComposer =
  | { status: "signed-out" }
  | { status: "unverified" }
  | { status: "ready"; publicName: string }
  | { status: "reviewed"; review: OwnReview }
  | { status: "unavailable" };

export type ProductReviewsSection =
  | { status: "hidden" }
  | {
      status: "visible";
      productId: number;
      reviews: { status: "ready"; data: PublicReviewPage } | { status: "unavailable" };
      composer: ReviewComposer;
      /** Extra schema.org Product fields. Omitted until the feature is live. */
      structuredData?: Record<string, unknown>;
    };

export type AccountPage =
  | { status: "signed-out" }
  | { status: "unavailable" }
  | { status: "ready"; account: CustomerAccount; reviews: OwnReview[] };

export type OwnReviewPage =
  | { status: "signed-out" }
  | { status: "not-found" }
  | { status: "unavailable" }
  | { status: "ready"; account: CustomerAccount; review: OwnReview };

/** The result a form shows after submitting. */
export type FormState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> };

export const IDLE_FORM_STATE: FormState = { status: "idle" };

/** Form submissions that need a follow-up navigation rather than a message. */
export type Submission = FormState | { status: "done" } | { status: "signed-out" };
