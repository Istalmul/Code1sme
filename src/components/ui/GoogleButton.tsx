"use client";

import { useState } from "react";

function GoogleMark() {
  return (
    <svg viewBox="0 0 18 18" className="size-[18px]" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.49h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.63Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.17l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.97 10.73a5.4 5.4 0 0 1 0-3.46V4.94H.96a9 9 0 0 0 0 8.12l3.01-2.33Z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.94l3.01 2.33C4.68 5.15 6.66 3.58 9 3.58Z" />
    </svg>
  );
}

/**
 * One button for both sign-up and sign-in: Google tells us which it is, so the
 * user does not have to.
 *
 * When Google is not configured the button says so plainly instead of failing
 * silently — a dead primary path is worse than an honest one.
 */
export function GoogleButton({ configured, label }: { configured: boolean; label: string }) {
  const [busy, setBusy] = useState(false);

  if (!configured) {
    return (
      <div className="rounded-lg border border-dashed border-line-strong px-4 py-3 text-center">
        <p className="text-[13px] text-muted">
          Google sign-in isn&apos;t configured on this deployment.
        </p>
      </div>
    );
  }

  return (
    <a
      href="/api/auth/google/start"
      onClick={() => setBusy(true)}
      aria-busy={busy || undefined}
      className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border
        border-line-strong bg-surface text-[15px] font-medium text-body transition-colors
        hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <GoogleMark />
      {busy ? "Redirecting to Google…" : label}
    </a>
  );
}
