import { cn } from "@/lib/utils";

export function SectionHeading({
  as: Tag = "h2",
  title,
  className,
}: {
  as?: "h1" | "h2";
  title: string;
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
    </Tag>
  );
}
