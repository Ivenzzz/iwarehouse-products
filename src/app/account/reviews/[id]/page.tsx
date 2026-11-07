import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AccountUnavailableView, loadOwnReviewPage, OwnReviewView } from "@/modules/customers";

export const metadata: Metadata = { title: "Your review" };

export default async function OwnReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const page = await loadOwnReviewPage(id);

  switch (page.status) {
    case "signed-out":
      redirect(`/account/login?next=${encodeURIComponent(`/account/reviews/${id}`)}`);
    case "not-found":
      notFound();
    case "unavailable":
      return <AccountUnavailableView />;
    case "ready":
      return <OwnReviewView review={page.review} />;
  }
}
