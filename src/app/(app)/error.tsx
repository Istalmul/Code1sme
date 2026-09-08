"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md rounded-xl border border-line bg-surface p-8 text-center shadow-card">
      <span className="mx-auto mb-4 grid size-11 place-items-center rounded-xl bg-tint-bad text-on-bad">
        <AlertTriangle className="size-5" aria-hidden="true" />
      </span>
      <h1 className="text-[17px] font-semibold tracking-tight">This screen didn&apos;t load</h1>
      <p className="mt-2 text-[14px] leading-relaxed text-muted">
        Your missions kept running — nothing was lost. Trying again usually works.
      </p>
      {error.digest && (
        <p className="mt-3 font-mono text-[12px] text-subtle">Reference: {error.digest}</p>
      )}
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
        <ButtonLink href="/command-center">Command Center</ButtonLink>
        <Button variant="primary" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}
