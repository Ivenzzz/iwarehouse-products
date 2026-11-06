"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

/**
 * Reads the live URL rather than the server's copy, because choosing a color or
 * memory option changes ?variant= in the browser without a server round trip.
 */
export function ReviewPagination({
  currentPage,
  lastPage,
}: {
  currentPage: number;
  lastPage: number;
}) {
  const searchParams = useSearchParams();

  if (lastPage <= 1) return null;

  function hrefFor(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (page === 1) params.delete("reviews_page");
    else params.set("reviews_page", String(page));

    const query = params.toString();
    return `${query ? `?${query}` : "?"}#reviews`;
  }

  return (
    <nav aria-label="Review pages" className="mt-6 flex items-center justify-between gap-4">
      {currentPage > 1 ? (
        <Button asChild variant="outline" className="h-10 px-4 text-primary">
          <Link href={hrefFor(currentPage - 1)} aria-label="Previous reviews">
            <ChevronLeft data-icon="inline-start" />
            Previous
          </Link>
        </Button>
      ) : (
        <span />
      )}
      <span className="text-sm text-muted-foreground">
        Page {currentPage} of {lastPage}
      </span>
      {currentPage < lastPage ? (
        <Button asChild variant="outline" className="h-10 px-4 text-primary">
          <Link href={hrefFor(currentPage + 1)} aria-label="More reviews">
            Next
            <ChevronRight data-icon="inline-end" />
          </Link>
        </Button>
      ) : (
        <span />
      )}
    </nav>
  );
}
