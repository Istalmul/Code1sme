"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { PasswordField } from "@/components/ui/PasswordField";
import { Alert } from "@/components/ui/Alert";
import { GoogleButton } from "@/components/ui/GoogleButton";
import { Divider } from "./Divider";
import { VerifyStep } from "./VerifyStep";
import { post } from "@/lib/api";
import { emailField } from "@/lib/auth/schema";

/** Google redirects back with a reason rather than a silent failure. */
const OAUTH_MESSAGES: Record<string, string> = {
  "google-unconfigured": "Google sign-in isn't configured on this deployment yet.",
  "google-cancelled": "Google sign-in was cancelled. You can try again or use your password.",
  "google-failed": "We couldn't complete Google sign-in. Please try again.",
  "google-unverified": "That Google account's email isn't verified, so we can't use it to sign in.",
};

type Errors = Partial<Record<"email" | "password" | "form", string>>;

export function LoginForm({
  googleReady,
  oauthError,
  nextPath,
}: {
  googleReady: boolean;
  oauthError?: string;
  nextPath?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [challenge, setChallenge] = useState<{ id: string; email: string } | null>(null);

  const banner = oauthError ? OAUTH_MESSAGES[oauthError] : undefined;

  function goto(next: string) {
    // A protected page the user was aiming for wins over the default landing.
    if (next === "command-center" && nextPath?.startsWith("/")) router.push(nextPath);
    else router.push(next === "onboarding" ? "/onboarding" : "/command-center");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const emailError = emailField.safeParse(email).success
      ? undefined
      : "Enter a valid email address";
    const passwordError = password ? undefined : "Enter your password";
    setTouched(true);
    setErrors({ email: emailError, password: passwordError });
    if (emailError || passwordError) return;

    setSubmitting(true);
    const result = await post<{ next: string; challengeId?: string; email?: string }>(
      "/api/auth/login",
      { email, password },
    );
    setSubmitting(false);

    if (!result.ok) {
      setErrors({ [result.field ?? "form"]: result.error });
      return;
    }
    if (result.data.next === "verify" && result.data.challengeId) {
      setChallenge({ id: result.data.challengeId, email: result.data.email ?? email });
      return;
    }
    goto(result.data.next);
  }

  if (challenge) {
    return (
      <VerifyStep
        challengeId={challenge.id}
        email={challenge.email}
        backLabel="Back to sign in"
        onBack={() => setChallenge(null)}
        onVerified={goto}
      />
    );
  }

  return (
    <>
      <h1 className="text-[26px] font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-2 text-[15px] text-muted">Sign in to your Piasowo workspace.</p>

      {banner && (
        <div className="mt-6">
          <Alert tone="error">{banner}</Alert>
        </div>
      )}

      <div className="mt-7">
        <GoogleButton configured={googleReady} label="Continue with Google" />
      </div>

      <Divider label="or" />

      <form onSubmit={submit} noValidate className="space-y-5">
        {errors.form && <Alert tone="error">{errors.form}</Alert>}

        <Field
          label="Email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (touched) setErrors((x) => ({ ...x, email: undefined, form: undefined }));
          }}
          onBlur={() =>
            setErrors((x) => ({
              ...x,
              email: !email || emailField.safeParse(email).success ? undefined : "Enter a valid email address",
            }))
          }
          error={errors.email}
          placeholder="you@company.com"
        />

        <PasswordField
          label="Password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (touched) setErrors((x) => ({ ...x, password: undefined, form: undefined }));
          }}
          error={errors.password}
          labelAction={
            <Link
              href="/forgot-password"
              className="rounded text-[13px] font-medium text-link hover:underline"
            >
              Forgot password?
            </Link>
          }
        />

        <Button type="submit" variant="primary" size="lg" fullWidth loading={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-[14px] text-muted">
        New to Piasowo?{" "}
        <Link href="/signup" className="rounded font-medium text-link hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
