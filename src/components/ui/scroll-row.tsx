"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

/**
 * A sideways-scrolling list that lines up with .shell and runs off the right
 * edge of the page. Touch and keyboard focus scroll it natively; the previous
 * and next buttons are for pointer users, who have no easy way to scroll
 * sideways. They only appear once there is something to scroll to.
 */
export function ScrollRow({
  label,
  header,
  action,
  itemClassName,
  children,
}: {
  label: string;
  header: React.ReactNode;
  action?: React.ReactNode;
  itemClassName?: string;
  children: React.ReactNode;
}) {
  const trackRef = React.useRef<HTMLUListElement>(null);
  const [edges, setEdges] = React.useState({ previous: false, next: false });

  React.useEffect(() => {
    const track = trackRef.current;
    if (!track || typeof ResizeObserver === "undefined") return;

    const update = () => {
      const end = track.scrollWidth - track.clientWidth;
      setEdges({
        previous: track.scrollLeft > 1,
        next: track.scrollLeft < end - 1,
      });
    };

    // ResizeObserver also reports once on observe, which sets the first state.
    const observer = new ResizeObserver(update);
    observer.observe(track);
    track.addEventListener("scroll", update, { passive: true });

    return () => {
      observer.disconnect();
      track.removeEventListener("scroll", update);
    };
  }, []);

  const scroll = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    track.scrollBy({
      left: direction * track.clientWidth * 0.8,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  };

  return (
    <div>
      <div className="shell mb-5 flex items-end justify-between gap-6">
        <div className="min-w-0">{header}</div>
        <div className="flex shrink-0 items-center gap-4">
          {action}
          {edges.previous || edges.next ? (
            <div className="flex gap-2 max-[980px]:hidden">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-9"
                aria-label={`Scroll ${label} back`}
                disabled={!edges.previous}
                onClick={() => scroll(-1)}
              >
                <ChevronLeft />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-9"
                aria-label={`Scroll ${label} forward`}
                disabled={!edges.next}
                onClick={() => scroll(1)}
              >
                <ChevronRight />
              </Button>
            </div>
          ) : null}
        </div>
      </div>
      <ul
        ref={trackRef}
        aria-label={label}
        className="shell-bleed m-0 -mb-8 flex list-none snap-x snap-proximity gap-4 overflow-x-auto pt-1 pb-8"
      >
        {React.Children.map(children, (child) => (
          <li className={cn("flex shrink-0 snap-start", itemClassName)}>
            {child}
          </li>
        ))}
      </ul>
    </div>
  );
}
