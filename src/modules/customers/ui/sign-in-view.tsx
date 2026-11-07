import type { SignInProblem } from "../model";
import { AccountFormPage } from "./account-form-page";
import { CopyLinkButton } from "./copy-link-button";

const PROBLEM_MESSAGES: Record<SignInProblem, string> = {
  cancelled: "Google sign-in was cancelled. You can try again whenever you’re ready.",
  failed: "We couldn’t finish signing you in with Google. Please try again.",
  unverified: "Please verify the email address on your Google account, then try again.",
  busy: "Too many attempts. Please wait a few minutes and try again.",
  unavailable: "Sign-in isn’t available right now. Please try again in a moment.",
  expired: "That took a little too long, so please continue with Google again.",
};

function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="size-[18px] shrink-0">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

/**
 * A plain link, not next/link: it leaves the site for Google, and prefetching it
 * would start a sign-in nobody asked for.
 */
function GoogleButton({ next }: { next?: string }) {
  const href = next
    ? `/account/google/start?next=${encodeURIComponent(next)}`
    : "/account/google/start";

  return (
    <a
      href={href}
      className="inline-flex h-11 w-full items-center justify-center gap-3 rounded-full border border-[#747775] bg-white px-5 text-sm font-medium text-[#1f1f1f] transition-colors hover:bg-[#f7f8f8] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <GoogleLogo />
      Continue with Google
    </a>
  );
}

function EmbeddedBrowserSteps() {
  return (
    <div className="grid gap-3" role="note">
      <p className="m-0 text-sm font-semibold text-foreground">
        Google sign-in doesn’t work inside this app’s browser.
      </p>
      <ol className="m-0 grid gap-1.5 pl-5 text-sm text-muted-foreground">
        <li>Tap the menu button (⋯ or ⋮) at the top or bottom of this screen.</li>
        <li>Choose “Open in browser”, “Open in Chrome” or “Open in Safari”.</li>
      </ol>
      <p className="m-0 text-sm text-muted-foreground">
        Can’t find it? Copy the link and paste it into Chrome or Safari.
      </p>
      <CopyLinkButton />
    </div>
  );
}

export function SignInView({
  next,
  problem,
  accountDeleted,
  embeddedBrowser,
}: {
  next?: string;
  problem?: SignInProblem;
  accountDeleted: boolean;
  embeddedBrowser: boolean;
}) {
  return (
    <AccountFormPage
      title="Sign in"
      description="Sign in to write product reviews. New here? This also creates your account. You don’t need one to browse."
    >
      <div className="grid gap-4">
        {problem ? (
          <p role="alert" className="m-0 rounded-xl bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
            {PROBLEM_MESSAGES[problem]}
          </p>
        ) : null}
        {accountDeleted ? (
          <p role="status" className="m-0 rounded-xl bg-[var(--brand-50)] px-3.5 py-2.5 text-sm">
            Your account and reviews have been deleted.
          </p>
        ) : null}
        {embeddedBrowser ? <EmbeddedBrowserSteps /> : <GoogleButton next={next} />}
      </div>
    </AccountFormPage>
  );
}
