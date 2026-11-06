"use client";

import { Star } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { cn } from "@/lib/utils";
import { createReviewAction, updateReviewAction } from "../actions";
import {
  IDLE_FORM_STATE,
  REVIEW_MAX_LENGTH,
  REVIEW_MIN_LENGTH,
  type FormState,
  type OwnReview,
} from "../model";
import { FormMessage, SubmitButton } from "./form-controls";

function ReviewFields({
  state,
  action,
  initial,
  submitLabel,
}: {
  state: FormState;
  action: (formData: FormData) => void;
  initial?: Pick<OwnReview, "rating" | "body">;
  submitLabel: string;
}) {
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [length, setLength] = useState(initial?.body.length ?? 0);
  const ratingError = state.status === "error" ? state.fieldErrors?.rating : undefined;
  const bodyError = state.status === "error" ? state.fieldErrors?.body : undefined;

  return (
    <form action={action} className="grid gap-4">
      <FormMessage state={state} />

      <fieldset className="m-0 grid gap-1.5 border-0 p-0">
        <legend className="mb-1.5 p-0 text-sm font-semibold text-foreground">Your rating</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <label key={value} className="relative cursor-pointer rounded-md p-0.5 has-focus-visible:ring-2 has-focus-visible:ring-ring">
              <input
                type="radio"
                name="rating"
                value={value}
                required
                checked={rating === value}
                onChange={() => setRating(value)}
                className="absolute inset-0 cursor-pointer opacity-0"
                aria-label={`${value} ${value === 1 ? "star" : "stars"}`}
              />
              <Star
                aria-hidden="true"
                className={cn(
                  "size-7",
                  value <= rating
                    ? "fill-[var(--brand-500)] text-[var(--brand-600)]"
                    : "fill-transparent text-[var(--warm-500)]",
                )}
              />
            </label>
          ))}
        </div>
        {ratingError ? <p className="m-0 text-sm text-destructive">{ratingError}</p> : null}
      </fieldset>

      <div className="grid gap-1.5">
        <label htmlFor="field-body" className="text-sm font-semibold text-foreground">
          Your review
        </label>
        <textarea
          id="field-body"
          name="body"
          rows={5}
          required
          minLength={REVIEW_MIN_LENGTH}
          maxLength={REVIEW_MAX_LENGTH}
          defaultValue={initial?.body}
          onChange={(event) => setLength(event.target.value.length)}
          aria-invalid={bodyError ? true : undefined}
          aria-describedby="field-body-hint"
          className="w-full min-w-0 resize-y rounded-xl border border-input bg-background px-2.5 py-2 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-[0.5px] focus-visible:ring-ring aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm"
        />
        <div id="field-body-hint" className="flex flex-wrap justify-between gap-x-4 text-xs text-muted-foreground">
          <span>
            {REVIEW_MIN_LENGTH} characters minimum. Please follow our{" "}
            <Link href="/review-guidelines" target="_blank" className="font-semibold text-primary hover:underline">
              review guidelines
            </Link>
            .
          </span>
          <span className="tabular-nums">
            {length} / {REVIEW_MAX_LENGTH}
          </span>
        </div>
        {bodyError ? <p className="m-0 text-sm text-destructive">{bodyError}</p> : null}
      </div>

      <div>
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}

export function NewReviewForm({
  productId,
  productPath,
}: {
  productId: number;
  productPath: string;
}) {
  const [state, action] = useActionState(
    createReviewAction.bind(null, productId, productPath),
    IDLE_FORM_STATE,
  );

  return <ReviewFields state={state} action={action} submitLabel="Submit review" />;
}

export function EditReviewForm({ review }: { review: OwnReview }) {
  const [state, action] = useActionState(
    updateReviewAction.bind(null, review.id),
    IDLE_FORM_STATE,
  );

  return (
    <ReviewFields
      state={state}
      action={action}
      initial={review}
      submitLabel="Save and send for approval"
    />
  );
}
