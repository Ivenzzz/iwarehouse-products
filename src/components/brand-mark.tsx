import Link from "next/link";

export function BrandMark() {
  return (
    <Link className="brand-mark" href="/" aria-label="iWarehouse home">
      <span className="brand-icon" aria-hidden="true">
        iW
      </span>
      <span>
        <strong>iWarehouse</strong>
        <small>Products</small>
      </span>
    </Link>
  );
}
