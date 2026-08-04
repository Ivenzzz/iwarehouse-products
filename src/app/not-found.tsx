import Link from "next/link";

export default function NotFound() {
  return (
    <section className="page-section shell">
      <div className="empty-state">
        <span aria-hidden="true">404</span>
        <h1>That product isn’t available</h1>
        <p>It may have sold out or moved out of customer-facing stock.</p>
        <Link className="button button-primary" href="/products">
          Browse available products
        </Link>
      </div>
    </section>
  );
}
