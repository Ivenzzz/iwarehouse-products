import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Pagination as PaginationRoot,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import type { PaginationMeta } from "../model";
import { joinQuery } from "../presentation";

/**
 * Uses Button asChild + next/link rather than shadcn's PaginationPrevious /
 * PaginationNext: those render a bare <a>, which would drop client-side
 * navigation on a route that is already server-rendered per request.
 */
export function CatalogPagination({
  meta,
  query,
}: {
  meta: PaginationMeta;
  query: Record<string, string | string[] | undefined>;
}) {
  if (meta.lastPage <= 1) return null;

  return (
    <PaginationRoot className="mt-9 justify-between">
      <PaginationContent className="w-full justify-between gap-4">
        <PaginationItem>
          {meta.currentPage > 1 ? (
            <Button asChild variant="ghost" size="default" className="font-extrabold text-primary">
              <Link
                href={`/products${joinQuery(query, { page: meta.currentPage - 1 })}`}
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
          Page {meta.currentPage} of {meta.lastPage}
        </PaginationItem>

        <PaginationItem>
          {meta.currentPage < meta.lastPage ? (
            <Button asChild variant="ghost" size="default" className="font-extrabold text-primary">
              <Link
                href={`/products${joinQuery(query, { page: meta.currentPage + 1 })}`}
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
