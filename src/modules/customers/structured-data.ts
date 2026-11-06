import type { PublicReviewPage } from "./model";

/**
 * schema.org fields for the product page. Nothing is added until a product has
 * an approved review, and only the first page's reviews are listed, since those
 * are the ones visible at the page's canonical URL.
 */
export function reviewStructuredData(
  page: PublicReviewPage,
): Record<string, unknown> | undefined {
  if (page.summary.count === 0 || page.summary.average === null) return undefined;

  return {
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: page.summary.average,
      reviewCount: page.summary.count,
      bestRating: 5,
      worstRating: 1,
    },
    ...(page.meta.currentPage === 1
      ? {
          review: page.reviews.map((review) => ({
            "@type": "Review",
            author: { "@type": "Person", name: review.author },
            reviewRating: {
              "@type": "Rating",
              ratingValue: review.rating,
              bestRating: 5,
              worstRating: 1,
            },
            reviewBody: review.body,
            ...(review.submittedAt ? { datePublished: review.submittedAt } : {}),
          })),
        }
      : {}),
  };
}
