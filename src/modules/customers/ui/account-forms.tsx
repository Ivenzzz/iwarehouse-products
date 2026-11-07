"use client";

import { useActionState } from "react";
import { deleteAccountAction, deleteReviewAction } from "../actions";
import { IDLE_FORM_STATE } from "../model";
import { Field, FormMessage, SubmitButton } from "./form-controls";

export function DeleteReviewForm({ reviewId }: { reviewId: number }) {
  const [state, action] = useActionState(
    deleteReviewAction.bind(null, reviewId),
    IDLE_FORM_STATE,
  );

  return (
    <form
      action={action}
      className="grid justify-items-start gap-3"
      onSubmit={(event) => {
        if (!window.confirm("Delete this review? This can’t be undone.")) event.preventDefault();
      }}
    >
      <FormMessage state={state} />
      <SubmitButton variant="destructive">Delete review</SubmitButton>
    </form>
  );
}

export function DeleteAccountForm({ email }: { email: string }) {
  const [state, action] = useActionState(deleteAccountAction, IDLE_FORM_STATE);

  return (
    <form action={action} className="grid max-w-[360px] gap-3">
      <FormMessage state={state} />
      <Field
        name="email"
        label={`Type ${email} to confirm`}
        type="text"
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        required
        state={state}
      />
      <div>
        <SubmitButton variant="destructive">Delete my account and reviews</SubmitButton>
      </div>
    </form>
  );
}
