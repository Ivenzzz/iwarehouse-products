import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Pagination as PaginationRoot,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import { joinQuery } from "@/lib/catalog/presentation";
import type { PaginationMeta } from "@/lib/catalog/types";

/**
 * Uses Button asChild + next/link rather than shadcn's PaginationPrevious /
 * PaginationNext: those render a bare <a>, which would drop client-side
 * navigation on a route that is already server-rendered per request.
 */
export function Pagination({
  meta,
  query,
}: {
  meta: PaginationMeta;
  query: Record<string, string | string[] | undefined>;
}) {
  if (meta.last_page <= 1) return null;

  return (
    <PaginationRoot className="mt-9 justify-between">
      <PaginationContent className="w-full justify-between gap-4">
        <PaginationItem>
          {meta.current_page > 1 ? (
            <Button asChild variant="ghost" size="default" className="font-extrabold text-primary">
              <Link
                href={`/products${joinQuery(query, { page: meta.current_page - 1 })}`}
                aria-label="Go to previous page"
              >
                <ChevronLeft data-icon="inline-start" />
                Previous
              </Link>
            </Button>
          ) : (
            <span />
          )}
        </PaginationItem>

        <PaginationItem className="text-xs text-muted-foreground">
          Page {meta.current_page} of {meta.last_page}
        </PaginationItem>

        <PaginationItem>
          {meta.current_page < meta.last_page ? (
            <Button asChild variant="ghost" size="default" className="font-extrabold text-primary">
              <Link
                href={`/products${joinQuery(query, { page: meta.current_page + 1 })}`}
                aria-label="Go to next page"
              >
                Next
                <ChevronRight data-icon="inline-end" />
              </Link>
            </Button>
          ) : (
            <span />
          )}
        </PaginationItem>
      </PaginationContent>
    </PaginationRoot>
  );
}
