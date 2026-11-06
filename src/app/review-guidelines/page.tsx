import type { Metadata } from "next";
import { isCustomerReviewsLive, ReviewGuidelinesView } from "@/modules/customers";

export const metadata: Metadata = {
  title: "Review guidelines",
  description: "What makes a good iWarehouse product review, and what we can’t publish.",
  // Search engines stay away until the wording is approved and the feature launches.
  robots: isCustomerReviewsLive() ? undefined : { index: false, follow: false },
};

export default function ReviewGuidelinesPage() {
  return <ReviewGuidelinesView live={isCustomerReviewsLive()} />;
}
