import { cn } from "@/lib/utils";

/** A two-tone heading: the title in black, then a short note in gray. */
export function SectionHeading({
  as: Tag = "h2",
  title,
  note,
  className,
}: {
  as?: "h1" | "h2";
  title: string;
  note?: string;
  className?: string;
}) {
  return (
    <Tag
      className={cn(
        "m-0 max-w-[40ch] leading-[1.15] font-bold tracking-[-0.02em] text-foreground",
        Tag === "h1"
          ? "text-[clamp(2rem,4vw,2.5rem)]"
          : "text-[1.75rem] max-[680px]:text-[1.5rem]",
        className,
      )}
    >
      {title}
      {note ? (
        <>
          {" "}
          <span className="text-[var(--warm-500)]">{note}</span>
        </>
      ) : null}
    </Tag>
  );
}
