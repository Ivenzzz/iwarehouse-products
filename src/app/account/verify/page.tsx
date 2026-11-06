import type { Metadata } from "next";
import Link from "next/link";
import { AccountFormPage, VerifyEmailForm } from "@/modules/customers";

// Confirmation links carry a signature, which must not leak via the Referer header.
export const metadata: Metadata = { title: "Confirm your email", referrer: "no-referrer" };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; expires?: string; signature?: string }>;
}) {
  const { id, expires, signature } = await searchParams;

  if (!id || !expires || !signature) {
    return (
      <AccountFormPage title="This link doesn’t work">
        <p className="m-0 text-sm text-muted-foreground">
          It may be incomplete. Sign in to{" "}
          <Link href="/account" className="font-semibold text-primary hover:underline">
            your account
          </Link>{" "}
          to get a new one.
        </p>
      </AccountFormPage>
    );
  }

  return (
    <AccountFormPage title="Confirm your email" description="One last step to finish setting up your account.">
      <VerifyEmailForm id={id} expires={expires} signature={signature} />
    </AccountFormPage>
  );
}
