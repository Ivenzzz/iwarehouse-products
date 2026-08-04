import { RefreshCw } from "lucide-react";

export function CatalogUnavailable() {
  return (
    <div className="empty-state error-state" role="status">
      <span>
        <RefreshCw className="size-6" aria-hidden="true" />
      </span>
      <h2>We can’t load products right now</h2>
      <p>Please refresh in a moment. Our store teams can still help you by phone or in person.</p>
    </div>
  );
}
