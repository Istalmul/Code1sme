"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CodeInput } from "@/components/ui/CodeInput";
import { Alert } from "@/components/ui/Alert";
import { post } from "@/lib/api";

const RESEND_SECONDS = 30;

type Props = {
  challengeId: string;
  email: string;
  /** Called with the server's `next` value once the code is accepted. */
  onVerified: (next: string) => void;
  onBack: () => void;
  backLabel: string;
};

export function VerifyStep({ challengeId, email, onVerified, onBack, backLabel }: Props) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const submittedFor = useRef<string | null>(null);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  const submit = useCallback(
    async (value: string) => {
      if (value.length !== 6 || submittedFor.current === value) return;
      submittedFor.current = value;
      setSubmitting(true);
      setError(null);
      setNotice(null);

      const result = await post<{ next: string }>("/api/auth/verify", {
        challengeId,
        code: value,
      });
      setSubmitting(false);

      if (!result.ok) {
        setError(result.error);
        setCode("");
        // Allow the same digits again after a failure — the code may have been
        // resent in the meantime.
        submittedFor.current = null;
        return;
      }
      onVerified(result.data.next);
    },
    [challengeId, onVerified],
  );

  async function resend() {
    setError(null);
    setNotice(null);
    const result = await post<{ sent: boolean }>("/api/auth/resend", { challengeId });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCode("");
    submittedFor.current = null;
    setSeconds(RESEND_SECONDS);
    setNotice(`A new code is on its way to ${email}.`);
  }

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-1.5 rounded text-[13px] text-muted hover:text-body"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {backLabel}
      </button>

      <h1 className="text-[26px] font-semibold tracking-tight">Check your email</h1>
      <p className="mt-2 text-[15px] text-muted">
        We sent a 6-digit code to{" "}
        <span className="font-medium text-body">{email}</span>. It expires in 10 minutes.
      </p>

      <div className="mt-7">
        <CodeInput
          label="Verification code"
          value={code}
          onChange={setCode}
          onComplete={submit}
          error={error}
          disabled={submitting}
        />
      </div>

      {notice && (
        <div className="mt-4">
          <Alert tone="success">{notice}</Alert>
        </div>
      )}

      <Button
        variant="primary"
        size="lg"
        fullWidth
        className="mt-5"
        loading={submitting}
        disabled={code.length !== 6}
        onClick={() => submit(code)}
      >
        {submitting ? "Verifying…" : "Verify email"}
      </Button>

      <p className="mt-5 text-center text-[13px] text-muted">
        Didn&apos;t get it? Check spam, or{" "}
        {seconds > 0 ? (
          // A countdown rather than a dead button, so the wait is explained.
          <span className="text-subtle">resend in {seconds}s</span>
        ) : (
          <button type="button" onClick={resend} className="rounded font-medium text-brand-600 hover:underline">
            send a new code
          </button>
        )}
        .
      </p>
    </div>
  );
}
