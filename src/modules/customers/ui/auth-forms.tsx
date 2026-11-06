"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  forgotPasswordAction,
  loginAction,
  registerAction,
  resetPasswordAction,
  verifyEmailAction,
} from "../actions";
import { IDLE_FORM_STATE, PASSWORD_MIN_LENGTH } from "../model";
import { Field, FormMessage, SubmitButton } from "./form-controls";

const PASSWORD_HINT = `At least ${PASSWORD_MIN_LENGTH} characters.`;

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(loginAction, IDLE_FORM_STATE);

  return (
    <form action={action} className="grid gap-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <FormMessage state={state} />
      <Field name="email" label="Email" type="email" autoComplete="email" required state={state} />
      <Field
        name="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        required
        state={state}
      />
      <SubmitButton>Sign in</SubmitButton>
      <p className="m-0 text-sm text-muted-foreground">
        <Link href="/account/forgot-password" className="font-semibold text-primary hover:underline">
          Forgot your password?
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const [state, action] = useActionState(registerAction, IDLE_FORM_STATE);

  if (state.status === "success") return <FormMessage state={state} />;

  const privacyError = state.status === "error" ? state.fieldErrors?.privacyAccepted : undefined;

  return (
    <form action={action} className="grid gap-4">
      <FormMessage state={state} />
      <div className="grid grid-cols-2 gap-4 max-[480px]:grid-cols-1">
        <Field
          name="firstName"
          label="First name"
          autoComplete="given-name"
          maxLength={80}
          required
          state={state}
        />
        <Field
          name="lastName"
          label="Last name"
          autoComplete="family-name"
          maxLength={80}
          required
          state={state}
        />
      </div>
      <p className="-mt-2 mb-0 text-xs text-muted-foreground">
        Reviews show your first name and last initial, like “Juan D.”. You can’t change your name
        later without contacting a store, so please use your real one.
      </p>
      <Field name="email" label="Email" type="email" autoComplete="email" required state={state} />
      <Field
        name="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        hint={PASSWORD_HINT}
        required
        state={state}
      />
      {/* Hidden from people; a bot that fills every field reveals itself here. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-px w-px overflow-hidden">
        <label htmlFor="field-company">Company</label>
        <input id="field-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
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
      <SubmitButton>Create account</SubmitButton>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState(forgotPasswordAction, IDLE_FORM_STATE);

  if (state.status === "success") return <FormMessage state={state} />;

  return (
    <form action={action} className="grid gap-4">
      <FormMessage state={state} />
      <Field name="email" label="Email" type="email" autoComplete="email" required state={state} />
      <SubmitButton>Send reset link</SubmitButton>
    </form>
  );
}

export function ResetPasswordForm({ email, token }: { email: string; token: string }) {
  const [state, action] = useActionState(resetPasswordAction, IDLE_FORM_STATE);

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="token" value={token} />
      <FormMessage
        state={
          state.status === "error" && state.fieldErrors?.token
            ? { status: "error", message: state.fieldErrors.token }
            : state
        }
      />
      <Field
        name="password"
        label="New password"
        type="password"
        autoComplete="new-password"
        hint={PASSWORD_HINT}
        required
        state={state}
      />
      <SubmitButton>Save new password</SubmitButton>
    </form>
  );
}

/**
 * A button rather than verifying on page load: email scanners open links
 * automatically, and that alone shouldn't confirm an account.
 */
export function VerifyEmailForm({
  id,
  expires,
  signature,
}: {
  id: string;
  expires: string;
  signature: string;
}) {
  const [state, action] = useActionState(verifyEmailAction, IDLE_FORM_STATE);

  if (state.status === "success") {
    return (
      <div className="grid gap-4">
        <FormMessage state={state} />
        <Link href="/account" className="text-sm font-semibold text-primary hover:underline">
          Go to my account
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="expires" value={expires} />
      <input type="hidden" name="signature" value={signature} />
      <FormMessage
        state={
          state.status === "error"
            ? { status: "error", message: state.fieldErrors?.signature ?? state.message }
            : state
        }
      />
      <SubmitButton>Confirm my email</SubmitButton>
    </form>
  );
}
