import Link from "next/link";
import { joinQuery } from "@/lib/catalog/presentation";
import type { PaginationMeta } from "@/lib/catalog/types";

export function Pagination({
  meta,
  query,
}: {
  meta: PaginationMeta;
  query: Record<string, string | string[] | undefined>;
}) {
  if (meta.last_page <= 1) return null;

  return (
    <nav className="pagination" aria-label="Product pages">
      {meta.current_page > 1 ? (
        <Link href={`/products${joinQuery(query, { page: meta.current_page - 1 })}`}>← Previous</Link>
      ) : (
        <span />
      )}
      <span>
        Page {meta.current_page} of {meta.last_page}
      </span>
      {meta.current_page < meta.last_page ? (
        <Link href={`/products${joinQuery(query, { page: meta.current_page + 1 })}`}>Next →</Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
