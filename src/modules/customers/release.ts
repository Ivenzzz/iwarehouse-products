/**
 * While this is off, shoppers see nothing new: no account link, no reviews and
 * no ratings in search data. /account/* still works by direct URL, and signed-in
 * visitors see reviews, so staff can test on production before launch.
 *
 * Changing it needs a rebuild, because pre-rendered pages include the header.
 */
export function isCustomerReviewsLive(
  environment: { CUSTOMER_REVIEWS_LIVE?: string } = process.env as {
    CUSTOMER_REVIEWS_LIVE?: string;
  },
): boolean {
  return environment.CUSTOMER_REVIEWS_LIVE === "true";
}
