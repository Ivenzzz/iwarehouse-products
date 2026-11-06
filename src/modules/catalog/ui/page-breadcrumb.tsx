import Link from "next/link";
import { Fragment } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export function PageBreadcrumb({
  parents = [],
  current,
}: {
  parents?: { href: string; label: string }[];
  current: string;
}) {
  return (
    <Breadcrumb className="mb-6">
      <BreadcrumbList>
        {[{ href: "/", label: "Home" }, ...parents].map(({ href, label }) => (
          <Fragment key={href}>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={href}>{label}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </Fragment>
        ))}
        <BreadcrumbItem>
          <BreadcrumbPage>{current}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
