import { redirect } from "next/navigation";
import { AccountUnavailableView, AccountView, loadAccountPage } from "@/modules/customers";

export default async function AccountPage() {
  const page = await loadAccountPage();

  switch (page.status) {
    case "signed-out":
      redirect("/account/login");
    case "unavailable":
      return <AccountUnavailableView />;
    case "ready":
      return <AccountView account={page.account} reviews={page.reviews} />;
  }
}
