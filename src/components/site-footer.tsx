import { BrandMark } from "./brand-mark";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div>
          <BrandMark />
          <p>
            Browse current products available at iWarehouse stores and kiosks.
          </p>
        </div>
        <div>
          <strong>Availability notice</strong>
          <p>
            Stock and pricing are informational and may change before your store
            visit.
          </p>
        </div>
      </div>
      <div className="shell footer-bottom">
        © {new Date().getFullYear()} iWarehouse by Ivenzzz
      </div>
    </footer>
  );
}
