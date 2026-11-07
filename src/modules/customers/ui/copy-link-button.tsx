"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CopyLinkButton() {
  const [outcome, setOutcome] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setOutcome("copied");
    } catch {
      setOutcome("failed");
    }
  }

  return (
    <div className="grid justify-items-start gap-2">
      <Button type="button" variant="outline" className="h-10 px-5 text-primary" onClick={copy}>
        {outcome === "copied" ? "Link copied" : "Copy link"}
      </Button>
      {outcome === "failed" ? (
        <p role="alert" className="m-0 text-sm break-all text-muted-foreground">
          We couldn’t copy it automatically. Please copy this: {window.location.href}
        </p>
      ) : null}
    </div>
  );
}
