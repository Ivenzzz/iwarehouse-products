import Link from "next/link";
import { SectionHeading } from "@/components/ui/section-heading";

const PROSE =
  "text-sm leading-[1.7] text-foreground [&_h2]:mt-7 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-bold [&_li]:mb-1 [&_p]:my-2 [&_ul]:my-2 [&_ul]:pl-5";

/**
 * Stays on until launch. These pages are drafts until a named person at
 * iWarehouse has approved the wording, so they can't be mistaken for final text.
 */
function DraftNotice() {
  return (
    <p role="note" className="mt-4 mb-0 rounded-xl bg-destructive/10 px-3.5 py-2.5 text-sm font-semibold text-destructive">
      Draft: this wording has not been approved and is not yet in effect.
    </p>
  );
}

function ToConfirm({ children }: { children: React.ReactNode }) {
  return <mark className="rounded bg-[var(--brand-50)] px-1 font-semibold">[To confirm: {children}]</mark>;
}

export function PrivacyNoticeView({ live }: { live: boolean }) {
  return (
    <section className="shell py-10 max-[680px]:py-6">
      <div className="mx-auto w-full max-w-[720px] rounded-card bg-card p-7 shadow-(--shadow-sm) max-[680px]:p-5">
        <SectionHeading as="h1" title="Privacy notice" />
        {live ? null : <DraftNotice />}
        <div className={PROSE}>
          <p>
            This notice explains how iWarehouse Corporation handles your personal data when you
            create an account or write a product review on this website. Browsing products doesn’t
            require an account.
          </p>

          <h2>What we collect</h2>
          <ul>
            <li>
              From your Google account: your name, email address and Google account ID. You can
              change the name before your account is created. We don’t receive your Google password.
            </li>
            <li>The reviews you write, with their star ratings and dates.</li>
            <li>When you agreed to this notice, and which version you agreed to.</li>
            <li>Your internet address, used briefly to limit repeated sign-in attempts.</li>
          </ul>

          <h2>Why we use it</h2>
          <ul>
            <li>To run your account and keep you signed in.</li>
            <li>To check reviews before they’re published, and email you if one can’t be published.</li>
            <li>To protect the website from abuse.</li>
          </ul>
          <p>We don’t use your account to send you marketing.</p>
          <p>
            <ToConfirm>the lawful basis for this processing under the Data Privacy Act of 2012</ToConfirm>
          </p>

          <h2>What others can see</h2>
          <p>
            A published review shows your first name and last initial (like “Juan D.”), your rating,
            your text and the date. Published reviews are public and may appear in search engines,
            so please don’t include personal details in them. Our staff see the same public name,
            not your email address, when checking reviews.
          </p>

          <h2>Who else handles your data</h2>
          <p>
            Google handles the sign-in itself, under{" "}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-primary hover:underline"
            >
              its own privacy policy
            </a>
            , and sees that you signed in to this website. Your account is stored on our own
            servers. Emails are sent through{" "}
            <ToConfirm>the email provider used by the ERP, and where it stores data</ToConfirm>.
          </p>

          <h2>Cookies</h2>
          <p>
            We use essential cookies only: one keeps you signed in for up to 30 days and is deleted
            when you sign out, and short-lived ones protect sign-in and last 15 minutes at most.
          </p>

          <h2>How long we keep it</h2>
          <ul>
            <li>Your account and reviews stay until you delete them.</li>
            <li>
              Deleting your account permanently removes your account and all of your reviews.
            </li>
            <li>
              A record that staff made a decision on a review is kept for 365 days. It contains no
              review text and no name or email.
            </li>
            <li>
              <ToConfirm>how long server logs and backups keep this data after deletion</ToConfirm>
            </li>
          </ul>

          <h2>Your rights</h2>
          <p>
            Under the Data Privacy Act of 2012, you can ask to access or correct your data, object
            to its use, or have it deleted, and you can complain to the National Privacy Commission.
            You can delete your own account at any time from your account page.
          </p>

          <h2>Contact us</h2>
          <p>
            <ToConfirm>the Data Protection Officer’s name and contact details</ToConfirm>
          </p>

          <p className="text-xs text-muted-foreground">Version 2026-11</p>
        </div>
      </div>
    </section>
  );
}

export function ReviewGuidelinesView({ live }: { live: boolean }) {
  return (
    <section className="shell py-10 max-[680px]:py-6">
      <div className="mx-auto w-full max-w-[720px] rounded-card bg-card p-7 shadow-(--shadow-sm) max-[680px]:p-5">
        <SectionHeading as="h1" title="Review guidelines" />
        {live ? null : <DraftNotice />}
        <div className={PROSE}>
          <p>
            Reviews help other shoppers decide. Our team reads every review before it appears, and
            again after any edit.
          </p>

          <h2>A good review</h2>
          <ul>
            <li>Is about this product and your own experience of it.</li>
            <li>Is honest, whether your experience was good or bad.</li>
          </ul>

          <h2>We won’t publish reviews that</h2>
          <ul>
            <li>Aren’t about the product.</li>
            <li>Contain offensive, abusive or discriminatory language.</li>
            <li>Include personal details, such as phone numbers, addresses or other people’s names.</li>
            <li>Look like spam or advertising, or include links to other businesses.</li>
          </ul>
          <p>
            We don’t reject a review for being negative. If we can’t publish yours, we’ll email you
            the reason, and you can edit it and send it again.
          </p>

          <h2>iWarehouse staff</h2>
          <p>
            Staff and their families shouldn’t review products we sell, and nobody may be paid or
            rewarded for writing a review.
          </p>

          <h2>Changing your mind</h2>
          <p>
            You can edit or delete your review at any time from{" "}
            <Link href="/account" className="font-semibold text-primary hover:underline">
              your account
            </Link>
            . See our{" "}
            <Link href="/privacy" className="font-semibold text-primary hover:underline">
              privacy notice
            </Link>{" "}
            for how we handle your data.
          </p>
        </div>
      </div>
    </section>
  );
}
