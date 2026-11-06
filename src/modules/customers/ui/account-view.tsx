import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { logoutAction } from "../actions";
import type { CustomerAccount, OwnReview } from "../model";
import { DeleteAccountForm, DeleteReviewForm, ResendVerificationForm } from "./account-forms";
import { EditReviewForm } from "./review-form";
import { formatReviewDate, ReviewStatusBadge } from "./review-status";
import { Stars } from "./stars";

function VerifyEmailNotice() {
  return (
    <div className="mt-6 rounded-card bg-[var(--brand-50)] p-5">
      <h2 className="m-0 text-base font-bold">Confirm your email to write reviews</h2>
      <p className="mt-1 mb-3 text-sm text-muted-foreground">
        We sent you a link when you signed up. It works for 60 minutes.
      </p>
      <ResendVerificationForm />
    </div>
  );
}

export function AccountView({
  account,
  reviews,
}: {
  account: CustomerAccount;
  reviews: OwnReview[];
}) {
  return (
    <section className="shell py-10 max-[680px]:py-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SectionHeading as="h1" title={`Hi, ${account.firstName}`} />
        <form action={logoutAction}>
          <Button type="submit" variant="outline" className="h-10 px-4 text-primary">
            Sign out
          </Button>
        </form>
      </div>

      {account.emailVerified ? null : <VerifyEmailNotice />}

      <div className="mt-6 rounded-card bg-card p-5 shadow-(--shadow-sm)">
        <h2 className="m-0 text-base font-bold">Your details</h2>
        <dl className="mt-3 mb-0 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
          <dt className="text-muted-foreground">Name</dt>
          <dd className="m-0 font-semibold break-words">
            {account.firstName} {account.lastName}
          </dd>
          <dt className="text-muted-foreground">Email</dt>
          <dd className="m-0 font-semibold break-words">{account.email}</dd>
          <dt className="text-muted-foreground">On reviews</dt>
          <dd className="m-0 font-semibold break-words">{account.publicName}</dd>
        </dl>
        <p className="mt-3 mb-0 text-xs text-muted-foreground">
          To change your name or email, please contact one of our stores. To change your password,
          use{" "}
          <Link href="/account/forgot-password" className="font-semibold text-primary hover:underline">
            forgot password
          </Link>
          .
        </p>
      </div>

      <section className="mt-10">
        <SectionHeading title="Your reviews" className="mb-4" />
        {reviews.length ? (
          <ul className="m-0 grid list-none gap-4 p-0">
            {reviews.map((review) => (
              <li key={review.id} className="rounded-card bg-card p-5 shadow-(--shadow-sm)">
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                  <Link
                    href={`/products/${review.product.id}-${review.product.slug}`}
                    className="text-sm font-bold text-foreground hover:underline"
                  >
                    {review.product.name}
                  </Link>
                  <ReviewStatusBadge status={review.status} />
                </div>
                <Stars rating={review.rating} className="mt-2" />
                <p className="mt-2 mb-0 text-sm leading-[1.6] break-words whitespace-pre-line">{review.body}</p>
                {review.rejectionReason ? (
                  <p className="mt-2 mb-0 text-sm text-destructive">Reason: {review.rejectionReason}</p>
                ) : null}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm">
                  <Link href={`/account/reviews/${review.id}`} className="font-semibold text-primary hover:underline">
                    Edit or delete
                  </Link>
                  {formatReviewDate(review.submittedAt) ? (
                    <span className="text-xs text-muted-foreground">{formatReviewDate(review.submittedAt)}</span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="m-0 text-sm text-muted-foreground">
            You haven’t written any reviews yet.{" "}
            <Link href="/products" className="font-semibold text-primary hover:underline">
              Browse products
            </Link>
          </p>
        )}
      </section>

      <section className="mt-10 rounded-card bg-card p-5 shadow-(--shadow-sm)">
        <h2 className="m-0 text-base font-bold">Delete your account</h2>
        <p className="mt-1 mb-3 text-sm text-muted-foreground">
          This permanently deletes your account and all your reviews. It can’t be undone.
        </p>
        <DeleteAccountForm />
      </section>
    </section>
  );
}

export function OwnReviewView({ review, emailVerified }: { review: OwnReview; emailVerified: boolean }) {
  return (
    <section className="shell py-10 max-[680px]:py-6">
      <div className="mx-auto w-full max-w-[640px]">
        <Link href="/account" className="text-sm font-semibold text-primary hover:underline">
          Back to my account
        </Link>
        <div className="mt-3 rounded-card bg-card p-6 shadow-(--shadow-sm) max-[680px]:p-5">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <SectionHeading as="h1" title="Your review" className="text-[1.75rem] max-[680px]:text-[1.5rem]" />
            <ReviewStatusBadge status={review.status} />
          </div>
          <p className="mt-1 mb-0 text-sm text-muted-foreground">{review.product.name}</p>
          {review.rejectionReason ? (
            <p className="mt-3 mb-0 rounded-xl bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
              We couldn’t publish this. Reason: {review.rejectionReason}
            </p>
          ) : null}
          {review.status === "approved" ? (
            <p className="mt-3 mb-0 text-sm text-muted-foreground">
              If you edit this review, it’s hidden until our team approves the new version.
            </p>
          ) : null}
          <div className="mt-5">
            {emailVerified ? (
              <EditReviewForm review={review} />
            ) : (
              <p className="m-0 text-sm text-muted-foreground">
                Please confirm your email address before editing this review.
              </p>
            )}
          </div>
        </div>
        <div className="mt-4 rounded-card bg-card p-6 shadow-(--shadow-sm) max-[680px]:p-5">
          <h2 className="m-0 mb-3 text-base font-bold">Delete this review</h2>
          <DeleteReviewForm reviewId={review.id} />
        </div>
      </div>
    </section>
  );
}
