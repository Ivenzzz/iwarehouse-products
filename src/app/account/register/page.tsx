import type { Metadata } from "next";
import Link from "next/link";
import { AccountFormPage, RegisterForm } from "@/modules/customers";

export const metadata: Metadata = { title: "Create an account" };

export default function RegisterPage() {
  return (
    <AccountFormPage
      title="Create an account"
      description="An account lets you write product reviews. You don’t need one to browse."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/account/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AccountFormPage>
  );
}
