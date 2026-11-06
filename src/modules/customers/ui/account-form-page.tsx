import { SectionHeading } from "@/components/ui/section-heading";

/** The narrow, centred card shared by sign-in, sign-up and password pages. */
export function AccountFormPage({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <section className="shell py-14 max-[680px]:py-8">
      <div className="mx-auto w-full max-w-[460px]">
        <div className="relative rounded-card bg-card p-7 shadow-(--shadow-sm) max-[680px]:p-5">
          <SectionHeading as="h1" title={title} className="text-[1.75rem] max-[680px]:text-[1.5rem]" />
          {description ? (
            <p className="mt-2 mb-0 text-sm leading-[1.6] text-muted-foreground">{description}</p>
          ) : null}
          <div className="mt-5">{children}</div>
        </div>
        {footer ? (
          <div className="mt-4 text-center text-sm text-muted-foreground">{footer}</div>
        ) : null}
      </div>
    </section>
  );
}

export function AccountUnavailableView() {
  return (
    <section className="shell py-14 max-[680px]:py-8" role="status">
      <div className="mx-auto max-w-[520px] rounded-card bg-card p-7 text-center shadow-(--shadow-sm)">
        <h1 className="m-0 text-xl font-bold tracking-[-0.02em] text-foreground">
          We can’t load your account right now
        </h1>
        <p className="mt-2.5 mb-0 text-sm leading-[1.7] text-muted-foreground">
          Please refresh in a moment.
        </p>
      </div>
    </section>
  );
}
