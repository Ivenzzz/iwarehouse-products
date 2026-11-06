import type { Metadata } from "next";
import Link from "next/link";
import { AccountFormPage, ResetPasswordForm } from "@/modules/customers";

// Reset links carry a secret, which must not leak to other sites via the Referer header.
export const metadata: Metadata = { title: "Choose a new password", referrer: "no-referrer" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { token, email } = await searchParams;

  if (!token || !email) {
    return (
      <AccountFormPage title="This link doesn’t work">
        <p className="m-0 text-sm text-muted-foreground">
          It may be incomplete or out of date.{" "}
          <Link href="/account/forgot-password" className="font-semibold text-primary hover:underline">
            Ask for a new reset link
          </Link>
        </p>
      </AccountFormPage>
    );
  }

  return (
    <AccountFormPage
      title="Choose a new password"
      description="This also signs you out on every device."
    >
      <ResetPasswordForm email={email} token={token} />
    </AccountFormPage>
  );
}
