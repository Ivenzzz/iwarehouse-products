import type {
  CustomerAccount,
  OwnReview,
  PublicReviewPage,
  ReviewInput,
} from "./model";

export type CustomerSourceErrorKind =
  | "validation"
  | "unauthenticated"
  | "email-unverified"
  | "already-reviewed"
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

export interface RegistrationInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface VerificationLink {
  id: string;
  expires: string;
  signature: string;
}

export interface CustomerSession {
  token: string;
  expiresAt: string | null;
  account: CustomerAccount;
}

export interface CustomerSource {
  register(input: RegistrationInput): Promise<void>;
  login(email: string, password: string): Promise<CustomerSession>;
  logout(token: string): Promise<void>;
  forgotPassword(email: string): Promise<void>;
  resetPassword(input: { email: string; token: string; password: string }): Promise<void>;
  verifyEmail(link: VerificationLink): Promise<void>;
  resendVerification(token: string): Promise<void>;
  getAccount(token: string): Promise<CustomerAccount>;
  deleteAccount(token: string, password: string): Promise<void>;
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
