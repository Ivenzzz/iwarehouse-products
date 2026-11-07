"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { confirmGoogleAccountAction } from "../actions";
import { IDLE_FORM_STATE, previewPublicName } from "../model";
import { Field, FormMessage, SubmitButton } from "./form-controls";

export function WelcomeForm({
  firstName,
  lastName,
  email,
}: {
  firstName: string;
  lastName: string;
  email: string;
}) {
  const [state, action] = useActionState(confirmGoogleAccountAction, IDLE_FORM_STATE);
  const [first, setFirst] = useState(firstName);
  const [last, setLast] = useState(lastName);
  const privacyError = state.status === "error" ? state.fieldErrors?.privacyAccepted : undefined;
  const publicName = previewPublicName(first, last);

  return (
    <form action={action} className="grid gap-4">
      <FormMessage state={state} />
      <p className="m-0 text-sm text-muted-foreground">
        Signed in with Google as <span className="font-semibold text-foreground break-all">{email}</span>
      </p>
      <div className="grid grid-cols-2 gap-4 max-[480px]:grid-cols-1">
        <Field
          name="firstName"
          label="First name"
          autoComplete="given-name"
          maxLength={80}
          required
          value={first}
          onChange={(event) => setFirst(event.target.value)}
          state={state}
        />
        <Field
          name="lastName"
          label="Last name"
          autoComplete="family-name"
          maxLength={80}
          value={last}
          onChange={(event) => setLast(event.target.value)}
          state={state}
        />
      </div>
      <div className="rounded-xl bg-[var(--brand-50)] px-3.5 py-2.5 text-sm text-foreground">
        <p className="m-0" aria-live="polite">
          Your name on reviews: <strong>{publicName || "…"}</strong>
        </p>
        <p className="mt-1 mb-0 text-xs text-muted-foreground">
          You can’t change this later without contacting a store.
        </p>
      </div>
      <div className="grid gap-1.5">
        <label className="flex items-start gap-2.5 text-sm text-foreground">
          <input
            type="checkbox"
            name="privacyAccepted"
            required
            aria-invalid={privacyError ? true : undefined}
            className="mt-0.5 size-4 accent-[var(--brand-600)]"
          />
          <span>
            I have read and agree to the{" "}
            <Link href="/privacy" target="_blank" className="font-semibold text-primary hover:underline">
              privacy notice
            </Link>
            .
          </span>
        </label>
        {privacyError ? <p className="m-0 text-sm text-destructive">{privacyError}</p> : null}
      </div>
      <SubmitButton>Create my account</SubmitButton>
    </form>
  );
}
