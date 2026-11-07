import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountFormPage, loadWelcomePage, WelcomeForm } from "@/modules/customers";

export const metadata: Metadata = { title: "Finish creating your account" };

export default async function WelcomePage() {
  const page = await loadWelcomePage();

  switch (page.status) {
    case "signed-in":
      redirect("/account");
    case "expired":
      redirect("/account/login?error=expired");
    case "ready":
      return (
        <AccountFormPage
          title="One last step"
          description="Check your name and agree to the privacy notice. We won’t save anything until you do."
        >
          <WelcomeForm firstName={page.firstName} lastName={page.lastName} email={page.email} />
        </AccountFormPage>
      );
  }
}
