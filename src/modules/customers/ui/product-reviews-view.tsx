import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import type { ProductReviewsSection, PublicReviewPage, ReviewComposer } from "../model";
import { NewReviewForm } from "./review-form";
import { ReviewPagination } from "./review-pagination";
import { formatReviewDate, ReviewStatusBadge } from "./review-status";
import { Stars } from "./stars";

function RatingSummary({ summary }: { summary: PublicReviewPage["summary"] }) {
  if (summary.count === 0 || summary.average === null) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
      <div>
        <p className="m-0 text-[2.5rem] leading-none font-bold tracking-[-0.02em] text-foreground">
          {summary.average.toFixed(1)}
        </p>
        <Stars rating={summary.average} className="mt-2" />
        <p className="mt-1 mb-0 text-sm text-muted-foreground">
          {summary.count} {summary.count === 1 ? "review" : "reviews"}
        </p>
      </div>
      <ul className="m-0 grid min-w-[200px] flex-1 list-none gap-1 p-0">
        {([5, 4, 3, 2, 1] as const).map((stars) => {
          const count = summary.breakdown[stars];
          return (
            <li key={stars} className="grid grid-cols-[3.25rem_1fr_1.5rem] items-center gap-2 text-xs text-muted-foreground">
              <span>
                {stars} {stars === 1 ? "star" : "stars"}
              </span>
              <span aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full bg-[var(--brand-500)]"
                  style={{ width: `${(count / summary.count) * 100}%` }}
                />
              </span>
              <span className="text-right tabular-nums">{count}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Composer({
  composer,
  productId,
  productPath,
}: {
  composer: ReviewComposer;
  productId: number;
  productPath: string;
}) {
  switch (composer.status) {
    case "signed-out":
      return (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="m-0 text-sm text-muted-foreground">Own this product? Share what you think.</p>
          <Button asChild variant="outline" className="h-10 px-4 text-primary">
            <Link href={`/account/login?next=${encodeURIComponent(`${productPath}#reviews`)}`}>
              Sign in to write a review
            </Link>
          </Button>
        </div>
      );
    case "reviewed":
      return (
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="m-0 text-base font-bold">Your review</h3>
            <ReviewStatusBadge status={composer.review.status} />
          </div>
          <Stars rating={composer.review.rating} />
          <p className="m-0 text-sm leading-[1.6] break-words whitespace-pre-line">{composer.review.body}</p>
          {composer.review.rejectionReason ? (
            <p className="m-0 text-sm text-destructive">{composer.review.rejectionReason}</p>
          ) : null}
          <Link
            href={`/account/reviews/${composer.review.id}`}
            className="text-sm font-semibold text-primary hover:underline"
          >
            Edit or delete your review
          </Link>
        </div>
      );
    case "ready":
      return (
        <div className="grid gap-3">
          <div>
            <h3 className="m-0 text-base font-bold">Write a review</h3>
            <p className="mt-1 mb-0 text-sm text-muted-foreground">
              It will appear as {composer.publicName} once our team has approved it.
            </p>
          </div>
          <NewReviewForm productId={productId} productPath={productPath} />
        </div>
      );
    case "unavailable":
      return (
        <p className="m-0 text-sm text-muted-foreground">
          We can’t load your review details right now. Please try again in a moment.
        </p>
      );
  }
}

export function ProductReviewsView({
  section,
  productPath,
}: {
  section: Extract<ProductReviewsSection, { status: "visible" }>;
  productPath: string;
}) {
  return (
    <section id="reviews" className="mt-16 scroll-mt-20 max-[680px]:mt-12">
      <SectionHeading title="Customer reviews" className="mb-5" />

      <div className="grid gap-4">
        {section.reviews.status === "unavailable" ? (
          <div className="rounded-card bg-card p-5 shadow-(--shadow-sm)" role="status">
            <p className="m-0 text-sm text-muted-foreground">
              Reviews are unavailable right now. Please check back soon.
            </p>
          </div>
        ) : (
          <>
            {section.reviews.data.summary.count > 0 ? (
              <div className="rounded-card bg-card p-5 shadow-(--shadow-sm)">
                <RatingSummary summary={section.reviews.data.summary} />
              </div>
            ) : null}

            <div className="rounded-card bg-card p-5 shadow-(--shadow-sm)">
              <Composer composer={section.composer} productId={section.productId} productPath={productPath} />
            </div>

            {section.reviews.data.reviews.length ? (
              <ul className="m-0 grid list-none gap-4 p-0">
                {section.reviews.data.reviews.map((review) => (
                  <li key={review.id} className="rounded-card bg-card p-5 shadow-(--shadow-sm)">
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                      <span className="text-sm font-bold text-foreground">{review.author}</span>
                      {formatReviewDate(review.submittedAt) ? (
                        <span className="text-xs text-muted-foreground">{formatReviewDate(review.submittedAt)}</span>
                      ) : null}
                    </div>
                    <Stars rating={review.rating} className="mt-1.5" />
                    <p className="mt-2.5 mb-0 text-sm leading-[1.7] break-words whitespace-pre-line text-foreground">
                      {review.body}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="m-0 text-sm text-muted-foreground">
                No reviews yet. Be the first to share what you think.
              </p>
            )}

            <ReviewPagination
              currentPage={section.reviews.data.meta.currentPage}
              lastPage={section.reviews.data.meta.lastPage}
            />
          </>
        )}
      </div>
    </section>
  );
}
