import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  hasLiveCustomerSession,
  isEmbeddedBrowser,
  safeRedirectPath,
  SignInView,
  type SignInProblem,
} from "@/modules/customers";

export const metadata: Metadata = { title: "Sign in" };

const SIGN_IN_PROBLEMS: readonly SignInProblem[] = [
  "cancelled",
  "failed",
  "unverified",
  "busy",
  "unavailable",
  "expired",
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; deleted?: string }>;
}) {
  const { next, error, deleted } = await searchParams;
  const safeNext = next ? safeRedirectPath(next) : undefined;

  if (await hasLiveCustomerSession()) redirect(safeNext ?? "/account");

  return (
    <SignInView
      next={safeNext}
      problem={SIGN_IN_PROBLEMS.find((problem) => problem === error)}
      accountDeleted={Boolean(deleted)}
      embeddedBrowser={isEmbeddedBrowser((await headers()).get("user-agent"))}
    />
  );
}
