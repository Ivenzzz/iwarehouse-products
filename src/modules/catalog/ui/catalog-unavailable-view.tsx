import { RefreshCw } from "lucide-react";

export function CatalogUnavailableView() {
  return (
    <div
      className="grid min-h-[430px] place-items-center content-center rounded-card bg-card px-5 py-[55px] text-center shadow-(--shadow-sm)"
      role="status"
    >
      <span className="mb-[18px] grid h-[60px] min-w-[60px] place-items-center rounded-full bg-[var(--brand-50)] text-primary">
        <RefreshCw className="size-6" aria-hidden="true" />
      </span>
      <h2 className="m-0 text-xl font-bold tracking-[-0.02em] text-foreground">
        We can’t load products right now
      </h2>
      <p className="mx-auto mt-2.5 mb-0 max-w-[500px] text-sm leading-[1.7] text-muted-foreground">
        Please refresh in a moment. Our store teams can still help you by phone
        or in person.
      </p>
    </div>
  );
}
