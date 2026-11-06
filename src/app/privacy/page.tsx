import type { Metadata } from "next";
import { isCustomerReviewsLive, PrivacyNoticeView } from "@/modules/customers";

export const metadata: Metadata = {
  title: "Privacy notice",
  description: "How iWarehouse handles your personal data when you create an account or write a review.",
  // Search engines stay away until the wording is approved and the feature launches.
  robots: isCustomerReviewsLive() ? undefined : { index: false, follow: false },
};

export default function PrivacyPage() {
  return <PrivacyNoticeView live={isCustomerReviewsLive()} />;
}
