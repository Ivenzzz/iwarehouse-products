"use client";

import { ArrowRight, Check } from "lucide-react";
import { useState } from "react";

// Visual-only signup: no backend exists yet, so submitting just confirms
// locally. Wire this to a real endpoint before relying on it for capture.
export function NewsletterForm() {
  const [subscribed, setSubscribed] = useState(false);

  if (subscribed) {
    return (
      <p className="m-0 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 text-[0.8rem] font-bold text-white">
        <Check className="size-4 text-brand" aria-hidden="true" />
        You&rsquo;re on the list. Watch your inbox for new arrivals and offers.
      </p>
    );
  }

  return (
    <form
      className="relative"
      onSubmit={(event) => {
        event.preventDefault();
        setSubscribed(true);
      }}
    >
      <label className="sr-only" htmlFor="footer-newsletter-email">
        Email address
      </label>
      <input
        id="footer-newsletter-email"
        type="email"
        required
        autoComplete="email"
        placeholder="Enter email address"
        className="h-13 w-full rounded-full border border-white/10 bg-white/[0.06] pr-16 pl-5 text-[0.83rem] text-white placeholder:text-[var(--night-copy)] focus-visible:border-[var(--brand-a34)] focus-visible:outline-none"
      />
      <button
        type="submit"
        aria-label="Subscribe for updates"
        className="absolute top-1/2 right-1.5 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-brand text-white transition-colors hover:bg-[var(--brand-600)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-400)]"
      >
        <ArrowRight className="size-4" aria-hidden="true" />
      </button>
    </form>
  );
}
