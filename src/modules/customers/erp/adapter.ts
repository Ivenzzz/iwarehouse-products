import { PRIVACY_NOTICE_VERSION, type CustomerAccount, type OwnReview } from "../model";
import {
  CustomerSourceError,
  type CustomerSession,
  type CustomerSource,
} from "../source";
import {
  accountResponseDtoSchema,
  errorDtoSchema,
  googleRegisterResponseDtoSchema,
  googleSignInResponseDtoSchema,
  nullableOwnReviewResponseDtoSchema,
  ownReviewResponseDtoSchema,
  ownReviewsResponseDtoSchema,
  publicReviewsResponseDtoSchema,
  type AccountDto,
  type OwnReviewDto,
} from "./schema";

interface ErpCustomerOptions {
  storefrontUrl: string;
  token: string;
  /** The visitor's address, so the ERP can rate-limit per person. */
  clientIp: () => Promise<string | null>;
  fetcher?: typeof fetch;
}

interface CustomerEnvironment {
  ERP_STOREFRONT_API_URL?: string;
  ERP_CATALOG_API_TOKEN?: string;
}

/** ERP field names mapped to the names our forms use. */
const FIELD_NAMES: Record<string, string> = {
  first_name: "firstName",
  last_name: "lastName",
  privacy_accepted: "privacyAccepted",
};

function mapAccount(account: AccountDto): CustomerAccount {
  return {
    id: account.id,
    firstName: account.first_name,
    lastName: account.last_name,
    publicName: account.public_name,
    email: account.email,
  };
}

function mapSession(dto: {
  token: string;
  expires_at: string | null;
  account: AccountDto;
}): CustomerSession {
  return {
    token: dto.token,
    expiresAt: dto.expires_at,
    account: mapAccount(dto.account),
  };
}

function mapOwnReview(review: OwnReviewDto): OwnReview {
  return {
    id: review.id,
    rating: review.rating,
    body: review.body,
    status: review.status,
    rejectionReason: review.rejection_reason,
    submittedAt: review.submitted_at,
    product: review.product,
  };
}

async function errorFrom(response: Response): Promise<CustomerSourceError> {
  const parsed = errorDtoSchema.safeParse(await response.json().catch(() => ({})));
  const body = parsed.success ? parsed.data : {};

  switch (response.status) {
    case 401:
      // A bad machine token is our misconfiguration, not a signed-out customer.
      return body.message === "Unauthenticated."
        ? new CustomerSourceError("unauthenticated", "Please sign in again.")
        : new CustomerSourceError("unavailable");
    case 404:
      return new CustomerSourceError("not-found", "We couldn’t find that.");
    case 409:
      return new CustomerSourceError("conflict", body.message ?? "That couldn’t be completed.");
    case 422: {
      if (body.code === "google_token_invalid") {
        return new CustomerSourceError("google-token-invalid", body.message);
      }
      if (body.code === "google_email_unverified") {
        return new CustomerSourceError("google-email-unverified", body.message);
      }

      const fieldErrors = Object.fromEntries(
        Object.entries(body.errors ?? {}).map(([field, messages]) => [
          FIELD_NAMES[field] ?? field,
          messages[0] ?? "This field is invalid.",
        ]),
      );
      const [firstError] = Object.values(fieldErrors);
      return new CustomerSourceError(
        "validation",
        firstError ?? "Please check the form and try again.",
        fieldErrors,
      );
    }
    case 429:
      return new CustomerSourceError(
        "rate-limited",
        "Too many attempts. Please wait a few minutes and try again.",
      );
    default:
      return new CustomerSourceError("unavailable");
  }
}

export function createErpCustomerSource({
  storefrontUrl,
  token,
  clientIp,
  fetcher = fetch,
}: ErpCustomerOptions): CustomerSource {
  const normalizedStorefrontUrl = storefrontUrl.replace(/\/$/, "");

  /** Nothing here is cached, and it's only ever sent from this server. */
  async function storefront(
    method: string,
    path: string,
    { customerToken, body }: { customerToken?: string; body?: unknown } = {},
  ): Promise<unknown> {
    try {
      const ip = await clientIp();
      const response = await fetcher(`${normalizedStorefrontUrl}${path}`, {
        method,
        headers: {
          Accept: "application/json",
          "X-Storefront-Token": token,
          ...(ip ? { "X-Storefront-Client-Ip": ip } : {}),
          ...(customerToken ? { Authorization: `Bearer ${customerToken}` } : {}),
          ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) throw await errorFrom(response);

      return response.status === 204 ? null : await response.json();
    } catch (error) {
      if (error instanceof CustomerSourceError) throw error;
      throw new CustomerSourceError("unavailable");
    }
  }

  /** Runs a call, treating a surprising response shape as an outage. */
  async function parsed<T>(call: () => Promise<T>): Promise<T> {
    try {
      return await call();
    } catch (error) {
      if (error instanceof CustomerSourceError) throw error;
      throw new CustomerSourceError("unavailable");
    }
  }

  return {
    signInWithGoogle(idToken, nonce) {
      return parsed(async () => {
        const dto = googleSignInResponseDtoSchema.parse(
          await storefront("POST", "/auth/google", { body: { id_token: idToken, nonce } }),
        );

        return dto.status === "signed_in"
          ? { status: "signed-in" as const, session: mapSession(dto) }
          : {
              status: "needs-confirmation" as const,
              firstName: dto.first_name,
              lastName: dto.last_name,
              email: dto.email,
            };
      });
    },

    registerWithGoogle(registration) {
      return parsed(async () =>
        mapSession(
          googleRegisterResponseDtoSchema.parse(
            await storefront("POST", "/auth/google/register", {
              body: {
                id_token: registration.idToken,
                nonce: registration.nonce,
                first_name: registration.firstName,
                last_name: registration.lastName,
                privacy_accepted: true,
                privacy_notice_version: PRIVACY_NOTICE_VERSION,
              },
            }),
          ),
        ),
      );
    },

    async logout(customerToken) {
      await storefront("DELETE", "/auth/logout", { customerToken });
    },

    getAccount(customerToken) {
      return parsed(async () =>
        mapAccount(
          accountResponseDtoSchema.parse(
            await storefront("GET", "/me", { customerToken }),
          ).data,
        ),
      );
    },

    async deleteAccount(customerToken, email) {
      await storefront("DELETE", "/me", { customerToken, body: { email } });
    },

    listOwnReviews(customerToken) {
      return parsed(async () =>
        ownReviewsResponseDtoSchema
          .parse(await storefront("GET", "/me/reviews", { customerToken }))
          .data.map(mapOwnReview),
      );
    },

    getOwnReview(customerToken, reviewId) {
      return parsed(async () =>
        mapOwnReview(
          ownReviewResponseDtoSchema.parse(
            await storefront("GET", `/me/reviews/${reviewId}`, { customerToken }),
          ).data,
        ),
      );
    },

    getOwnReviewForProduct(customerToken, productId) {
      return parsed(async () => {
        const { data } = nullableOwnReviewResponseDtoSchema.parse(
          await storefront("GET", `/products/${productId}/my-review`, { customerToken }),
        );
        return data === null ? null : mapOwnReview(data);
      });
    },

    createReview(customerToken, productId, input) {
      return parsed(async () =>
        mapOwnReview(
          ownReviewResponseDtoSchema.parse(
            await storefront("POST", `/products/${productId}/reviews`, {
              customerToken,
              body: input,
            }),
          ).data,
        ),
      );
    },

    updateReview(customerToken, reviewId, input) {
      return parsed(async () =>
        mapOwnReview(
          ownReviewResponseDtoSchema.parse(
            await storefront("PUT", `/reviews/${reviewId}`, { customerToken, body: input }),
          ).data,
        ),
      );
    },

    async deleteReview(customerToken, reviewId) {
      await storefront("DELETE", `/reviews/${reviewId}`, { customerToken });
    },

    /**
     * Deliberately uncached, unlike the catalog. A time-based cache keeps serving
     * its old copy to the next visitor however long ago it expired, so on a quiet
     * product page a removed review could reappear long after a takedown.
     */
    getPublicReviews(productId, page) {
      return parsed(async () => {
        const dto = publicReviewsResponseDtoSchema.parse(
          await storefront("GET", `/products/${productId}/reviews?page=${page}`),
        );
        return {
          summary: dto.summary,
          reviews: dto.data.map((review) => ({
            id: review.id,
            author: review.author,
            rating: review.rating,
            body: review.body,
            submittedAt: review.submitted_at,
          })),
          meta: {
            currentPage: dto.meta.current_page,
            perPage: dto.meta.per_page,
            total: dto.meta.total,
            lastPage: dto.meta.last_page,
          },
        };
      });
    },
  };
}

export function createErpCustomerSourceFromEnvironment(
  clientIp: () => Promise<string | null>,
  environment: CustomerEnvironment = process.env as CustomerEnvironment,
  fetcher: typeof fetch = fetch,
): CustomerSource {
  return createErpCustomerSource({
    // Blank values fail each request with "unavailable", the same outcome the
    // catalog gives when its connection isn't configured.
    storefrontUrl: environment.ERP_STOREFRONT_API_URL ?? "",
    token: environment.ERP_CATALOG_API_TOKEN ?? "",
    clientIp,
    fetcher,
  });
}
