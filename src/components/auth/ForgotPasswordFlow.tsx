"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { PasswordField } from "@/components/ui/PasswordField";
import { Alert } from "@/components/ui/Alert";
import { StepMeter } from "./StepMeter";
import { VerifyStep } from "./VerifyStep";
import { post } from "@/lib/api";
import { emailField, passwordField } from "@/lib/auth/schema";

type Stage = "email" | "code" | "password";

/**
 * Three short steps on one screen. Nothing is asked twice: the email typed in
 * step one carries through, and the confirm field only appears where it does
 * real work — confirming a password the user cannot see.
 */
export function ForgotPasswordFlow() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("email");
  const [email, setEmail] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function requestCode(event: React.FormEvent) {
    event.preventDefault();
    if (!emailField.safeParse(email).success) {
      setError("Enter a valid email address");
      return;
    }
    setError(null);
    setSubmitting(true);
    const result = await post<{ challengeId: string }>("/api/auth/forgot", { email });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setChallengeId(result.data.challengeId);
    setStage("code");
  }

  async function setNewPassword(event: React.FormEvent) {
    event.preventDefault();
    const pwError = passwordField.safeParse(password).success
      ? null
      : passwordField.safeParse(password).error!.issues[0].message;
    const mismatch = password !== confirm ? "Both passwords need to match" : null;
    setError(pwError);
    setConfirmError(mismatch);
    if (pwError || mismatch) return;

    setSubmitting(true);
    const result = await post<{ next: string }>("/api/auth/reset", { challengeId, password });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    // The reset proved inbox access, so we sign them straight in rather than
    // sending them back to a login form to retype what they just chose.
    router.push(result.data.next === "onboarding" ? "/onboarding" : "/command-center");
  }

  const stepIndex = { email: 0, code: 1, password: 2 }[stage];

  return (
    <>
      <StepMeter step={stepIndex} total={3} label="Resetting your password" />

      {stage === "email" && (
        <>
          <Link
            href="/login"
            className="mb-6 inline-flex items-center gap-1.5 rounded text-[13px] text-muted hover:text-body"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to sign in
          </Link>

          <h1 className="text-[26px] font-semibold tracking-tight">Reset your password</h1>
          <p className="mt-2 text-[15px] text-muted">
            Enter your email and we&apos;ll send a 6-digit code.
          </p>

          <form onSubmit={requestCode} noValidate className="mt-7 space-y-5">
            <Field
              label="Email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              error={error}
              placeholder="you@company.com"
            />
            <Button type="submit" variant="primary" size="lg" fullWidth loading={submitting}>
              {submitting ? "Sending code…" : "Send code"}
            </Button>
          </form>
        </>
      )}

      {stage === "code" && (
        <VerifyStep
          challengeId={challengeId}
          email={email}
          backLabel="Use a different email"
          onBack={() => setStage("email")}
          onVerified={() => setStage("password")}
        />
      )}

      {stage === "password" && (
        <>
          <h1 className="text-[26px] font-semibold tracking-tight">Choose a new password</h1>
          <p className="mt-2 text-[15px] text-muted">
            You&apos;ll be signed in as soon as it&apos;s saved.
          </p>

          <form onSubmit={setNewPassword} noValidate className="mt-7 space-y-5">
            {error && <Alert tone="error">{error}</Alert>}

            <PasswordField
              label="New password"
              autoComplete="new-password"
              autoFocus
              showStrength
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              placeholder="At least 10 characters"
            />

            <PasswordField
              label="Confirm new password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                setConfirmError(null);
              }}
              error={confirmError}
            />

            <Button type="submit" variant="primary" size="lg" fullWidth loading={submitting}>
              {submitting ? "Saving…" : "Save and sign in"}
            </Button>
          </form>
        </>
      )}
    </>
  );
}
