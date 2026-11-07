import type {
  CustomerAccount,
  OwnReview,
  PublicReviewPage,
  ReviewInput,
} from "./model";

export type CustomerSourceErrorKind =
  | "validation"
  | "unauthenticated"
  | "google-token-invalid"
  | "google-email-unverified"
  | "conflict"
  | "not-found"
  | "rate-limited"
  | "unavailable";

export class CustomerSourceError extends Error {
  constructor(
    public readonly kind: CustomerSourceErrorKind,
    message = "This service is temporarily unavailable.",
    public readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = "CustomerSourceError";
  }
}

export interface CustomerSession {
  token: string;
  expiresAt: string | null;
  account: CustomerAccount;
}

export type GoogleSignInOutcome =
  | { status: "signed-in"; session: CustomerSession }
  | { status: "needs-confirmation"; firstName: string; lastName: string; email: string };

export interface GoogleRegistration {
  idToken: string;
  nonce: string;
  firstName: string;
  lastName: string;
}

export interface CustomerSource {
  signInWithGoogle(idToken: string, nonce: string): Promise<GoogleSignInOutcome>;
  registerWithGoogle(registration: GoogleRegistration): Promise<CustomerSession>;
  logout(token: string): Promise<void>;
  getAccount(token: string): Promise<CustomerAccount>;
  deleteAccount(token: string, email: string): Promise<void>;
  listOwnReviews(token: string): Promise<OwnReview[]>;
  getOwnReview(token: string, reviewId: number): Promise<OwnReview>;
  getOwnReviewForProduct(token: string, productId: number): Promise<OwnReview | null>;
  createReview(token: string, productId: number, input: ReviewInput): Promise<OwnReview>;
  updateReview(token: string, reviewId: number, input: ReviewInput): Promise<OwnReview>;
  deleteReview(token: string, reviewId: number): Promise<void>;
  getPublicReviews(productId: number, page: number): Promise<PublicReviewPage>;
}

/** Holds the signed-in customer's token. Backed by a cookie in production. */
export interface SessionStore {
  read(): Promise<string | null>;
  write(token: string, expiresAt: string | null): Promise<void>;
  clear(): Promise<void>;
}

/** Remembered while the customer is away at Google. */
export interface GoogleFlow {
  state: string;
  codeVerifier: string;
  nonce: string;
  next: string;
}

/** A new customer who has been to Google but hasn't agreed to anything yet. */
export interface PendingGoogleAccount {
  idToken: string;
  nonce: string;
  next: string;
  firstName: string;
  lastName: string;
  email: string;
}

/** A short-lived value kept for one visitor. Backed by a cookie in production. */
export interface VisitorStore<T> {
  read(): Promise<T | null>;
  write(value: T): Promise<void>;
  clear(): Promise<void>;
}

export interface GoogleProvider {
  isConfigured(): boolean;
  begin(next: string): { flow: GoogleFlow; url: string };
  /** Swaps Google's one-time code for an ID token. */
  exchangeCode(code: string, codeVerifier: string): Promise<string>;
}
