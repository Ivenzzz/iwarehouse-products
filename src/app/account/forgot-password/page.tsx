import type { Metadata } from "next";
import Link from "next/link";
import { AccountFormPage, ForgotPasswordForm } from "@/modules/customers";

export const metadata: Metadata = { title: "Forgot your password?" };

export default function ForgotPasswordPage() {
  return (
    <AccountFormPage
      title="Forgot your password?"
      description="Enter your email and we’ll send you a link to choose a new one."
      footer={
        <Link href="/account/login" className="font-semibold text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AccountFormPage>
  );
}
