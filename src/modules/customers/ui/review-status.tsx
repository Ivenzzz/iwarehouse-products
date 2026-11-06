import { Badge } from "@/components/ui/badge";
import type { ReviewStatus } from "../model";

const LABELS: Record<ReviewStatus, string> = {
  pending: "Waiting for approval",
  approved: "Published",
  rejected: "Not published",
};

export function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  return (
    <Badge variant={status === "rejected" ? "destructive" : status === "approved" ? "default" : "secondary"}>
      {LABELS[status]}
    </Badge>
  );
}

export function formatReviewDate(value: string | null): string | null {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  // A fixed zone, so the server and every visitor agree on the date shown.
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Manila",
  });
}
