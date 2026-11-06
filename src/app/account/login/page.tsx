import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AccountFormPage,
  hasCustomerSession,
  LoginForm,
  safeRedirectPath,
} from "@/modules/customers";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reset?: string; deleted?: string }>;
}) {
  const { next, reset, deleted } = await searchParams;
  const safeNext = next ? safeRedirectPath(next) : undefined;

  if (await hasCustomerSession()) redirect(safeNext ?? "/account");

  const registerHref = safeNext
    ? `/account/register?next=${encodeURIComponent(safeNext)}`
    : "/account/register";

  return (
    <AccountFormPage
      title="Sign in"
      footer={
        <>
          New to iWarehouse?{" "}
          <Link href={registerHref} className="font-semibold text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      {reset ? (
        <p role="status" className="mt-0 mb-4 rounded-xl bg-[var(--brand-50)] px-3.5 py-2.5 text-sm">
          Your password has been changed. Please sign in.
        </p>
      ) : null}
      {deleted ? (
        <p role="status" className="mt-0 mb-4 rounded-xl bg-[var(--brand-50)] px-3.5 py-2.5 text-sm">
          Your account and reviews have been deleted.
        </p>
      ) : null}
      <LoginForm next={safeNext} />
    </AccountFormPage>
  );
}
