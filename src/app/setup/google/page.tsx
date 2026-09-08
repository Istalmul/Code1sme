import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { CheckCircle2, CircleDashed } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { CopyField } from "@/components/setup/CopyField";
import { googleConfigured } from "@/lib/auth/google";

export const metadata: Metadata = { title: "Enable Google sign-in" };

/**
 * The setup screen for Google sign-in.
 *
 * Google matches the redirect URI character for character, and getting it
 * wrong is the single most common reason this fails. So rather than describing
 * the URI, this page derives it from the address you are actually reading it
 * on and gives you the exact string to paste.
 */
export default async function GoogleSetupPage() {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
  const proto =
    headerList.get("x-forwarded-proto")?.split(",")[0].trim() ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  const origin = process.env.APP_ORIGIN?.replace(/\/$/, "") || `${proto}://${host}`;
  const configured = googleConfigured();

  const steps = [
    {
      title: "Open the Google Cloud Console",
      body: (
        <>
          Go to{" "}
          <a
            href="https://console.cloud.google.com/apis/credentials"
            target="_blank"
            rel="noopener noreferrer"
            className="break-all rounded font-medium text-link hover:underline"
          >
            console.cloud.google.com/apis/credentials
          </a>{" "}
          and pick a project, or create one. It&apos;s free.
        </>
      ),
    },
    {
      title: "Configure the consent screen, once",
      body: (
        <>
          Under <span className="font-medium text-body">OAuth consent screen</span>, choose{" "}
          <span className="font-medium text-body">External</span>, give the app a name and your
          email, and save. While it is in testing, add your own Google address under{" "}
          <span className="font-medium text-body">Test users</span> — otherwise Google blocks your
          own sign-in.
        </>
      ),
    },
    {
      title: "Create an OAuth client",
      body: (
        <>
          <span className="font-medium text-body">Credentials</span> →{" "}
          <span className="font-medium text-body">Create credentials</span> →{" "}
          <span className="font-medium text-body">OAuth client ID</span> → application type{" "}
          <span className="font-medium text-body">Web application</span>.
        </>
      ),
    },
  ];

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <header className="px-6 pt-7 sm:px-10">
        <Link href="/login" className="inline-flex rounded-md">
          <Logo />
        </Link>
      </header>

      <main id="main" className="mx-auto w-full max-w-2xl flex-1 px-6 py-10 sm:py-14">
        <h1 className="text-[26px] font-semibold tracking-tight">Enable Google sign-in</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          Piasowo has the Google flow built in. It needs a client ID and secret from your own Google
          account — nobody else can create those for you. This takes about five minutes.
        </p>

        <div
          className={`mt-6 flex items-start gap-3 rounded-xl border p-card ${
            configured ? "border-on-good/30 bg-tint-good" : "border-line bg-sunken"
          }`}
        >
          {configured ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-on-good" aria-hidden="true" />
          ) : (
            <CircleDashed className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />
          )}
          <p className={`text-[13px] leading-relaxed ${configured ? "text-on-good" : "text-muted"}`}>
            {configured
              ? "Credentials are set on this deployment. If sign-in still fails, the redirect URI below is almost certainly not registered in Google exactly as shown."
              : "No credentials are set yet, so the Google button is switched off rather than shown broken."}
          </p>
        </div>

        <ol className="mt-8 space-y-6">
          {steps.map((step, index) => (
            <li key={step.title} className="flex gap-4">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-sunken text-[13px] font-semibold text-muted ring-1 ring-line">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <h2 className="text-[15px] font-semibold tracking-tight">{step.title}</h2>
                <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{step.body}</p>
              </div>
            </li>
          ))}

          <li className="flex gap-4">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-sunken text-[13px] font-semibold text-muted ring-1 ring-line">
              4
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <h2 className="text-[15px] font-semibold tracking-tight">
                Paste these two values in, exactly
              </h2>
              <p className="mt-1.5 text-[14px] leading-relaxed text-muted">
                Google compares these character for character. A trailing slash or{" "}
                <code className="rounded bg-sunken px-1 py-0.5 text-[13px]">http</code> where it
                expects <code className="rounded bg-sunken px-1 py-0.5 text-[13px]">https</code> is
                enough to fail with <span className="font-medium text-body">redirect_uri_mismatch</span>.
              </p>
              <div className="mt-4 space-y-3">
                <CopyField label="Authorised JavaScript origin" value={origin} />
                <CopyField
                  label="Authorised redirect URI"
                  value={`${origin}/api/auth/google/callback`}
                />
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-subtle">
                These are taken from the address you are reading this on. If you later run Piasowo
                somewhere else, come back to this page there and add that address too — Google
                accepts several.
              </p>
            </div>
          </li>

          <li className="flex gap-4">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-sunken text-[13px] font-semibold text-muted ring-1 ring-line">
              5
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <h2 className="text-[15px] font-semibold tracking-tight">
                Put the credentials in <code className="text-[14px]">.env.local</code>
              </h2>
              <p className="mt-1.5 text-[14px] leading-relaxed text-muted">
                Google shows a client ID and secret once you create the client. Add them to a file
                called <code className="rounded bg-sunken px-1 py-0.5 text-[13px]">.env.local</code>{" "}
                in the project root, then restart the server — environment changes are only read at
                startup.
              </p>
              <div className="mt-4">
                <CopyField
                  label=".env.local"
                  multiline
                  value={`GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com\nGOOGLE_CLIENT_SECRET=your-client-secret`}
                />
              </div>
            </div>
          </li>
        </ol>

        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href="/login" variant="primary">
            Back to sign in
          </ButtonLink>
          <ButtonLink href="/signup">Create an account with email instead</ButtonLink>
        </div>

        <p className="mt-6 text-[13px] leading-relaxed text-subtle">
          Everything in Piasowo works without Google — email sign-up is the full experience. This is
          only about offering the one-tap option.
        </p>
      </main>
    </div>
  );
}
