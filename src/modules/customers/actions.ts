"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState, Submission } from "./model";
import { safeRedirectPath } from "./safe-redirect";
import { customerWorkflows as workflows } from "./server";

function fieldsOf(formData: FormData): Record<string, unknown> {
  return Object.fromEntries(formData);
}

const LOGIN_PATH = "/account/login";

/** Follows up on a submission. `redirect` works by throwing, so it stays outside any try. */
function settle(
  submission: Submission,
  { next, onSignedOut = LOGIN_PATH }: { next?: string; onSignedOut?: string } = {},
): FormState {
  if (submission.status === "signed-out") redirect(onSignedOut);
  if (submission.status === "done") {
    if (next) redirect(next);
    return { status: "idle" };
  }
  return submission;
}

export async function registerAction(_: FormState, formData: FormData): Promise<FormState> {
  return workflows.register(fieldsOf(formData));
}

export async function loginAction(_: FormState, formData: FormData): Promise<FormState> {
  return settle(await workflows.login(fieldsOf(formData)), {
    next: safeRedirectPath(formData.get("next")),
  });
}

export async function logoutAction(): Promise<void> {
  await workflows.logout();
  redirect("/");
}

export async function forgotPasswordAction(_: FormState, formData: FormData): Promise<FormState> {
  return workflows.forgotPassword(fieldsOf(formData));
}

export async function resetPasswordAction(_: FormState, formData: FormData): Promise<FormState> {
  return settle(await workflows.resetPassword(fieldsOf(formData)), {
    next: `${LOGIN_PATH}?reset=1`,
  });
}

export async function verifyEmailAction(_: FormState, formData: FormData): Promise<FormState> {
  return workflows.verifyEmail(fieldsOf(formData));
}

export async function resendVerificationAction(): Promise<FormState> {
  return settle(await workflows.resendVerification());
}

export async function deleteAccountAction(_: FormState, formData: FormData): Promise<FormState> {
  return settle(await workflows.deleteAccount(fieldsOf(formData)), {
    next: `${LOGIN_PATH}?deleted=1`,
  });
}

/**
 * The bound values come from the browser, so neither is trusted: the ERP checks
 * the product and the customer, and the path can only ever be on this site.
 */
export async function createReviewAction(
  productId: number,
  returnPath: string,
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const path = safeRedirectPath(returnPath);
  const submission = await workflows.createReview(productId, fieldsOf(formData));

  if (submission.status === "done") revalidatePath(path);

  return settle(submission, {
    onSignedOut: `${LOGIN_PATH}?next=${encodeURIComponent(path)}`,
  });
}

export async function updateReviewAction(
  reviewId: number,
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const submission = await workflows.updateReview(reviewId, fieldsOf(formData));

  if (submission.status === "success") revalidatePath("/account", "layout");

  return settle(submission);
}

export async function deleteReviewAction(reviewId: number): Promise<FormState> {
  const submission = await workflows.deleteReview(reviewId);

  if (submission.status === "done") revalidatePath("/account", "layout");

  return settle(submission, { next: "/account" });
}
