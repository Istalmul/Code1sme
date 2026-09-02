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
import { StepMeter } from "./StepMeter";
import { VerifyStep } from "./VerifyStep";
import { post } from "@/lib/api";
import { nameField, emailField, passwordField } from "@/lib/auth/schema";

type Errors = Partial<Record<"name" | "email" | "password" | "form", string>>;

/**
 * Sign-up is three fields and a code. Company, industry, target market and
 * everything else Piasowo needs is asked for during onboarding, where the
 * answers can be pre-filled and immediately acted on.
 */
export function SignupForm({ googleReady }: { googleReady: boolean }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [challenge, setChallenge] = useState<{ id: string; email: string } | null>(null);

  /** Validate one field. Runs on blur, then on every change once touched. */
  function validate(field: "name" | "email" | "password", value: string): string | undefined {
    const schema = { name: nameField, email: emailField, password: passwordField }[field];
    const result = schema.safeParse(value);
    return result.success ? undefined : result.error.issues[0].message;
  }

  function onBlur(field: "name" | "email" | "password", value: string) {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors((e) => ({ ...e, [field]: validate(field, value) }));
  }

  function onChange(field: "name" | "email" | "password", value: string) {
    const setters = { name: setName, email: setEmail, password: setPassword };
    setters[field](value);
    // Don't scold while the user is still typing something for the first time;
    // once they've seen an error, correct it live.
    if (touched[field]) setErrors((e) => ({ ...e, [field]: validate(field, value), form: undefined }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const next: Errors = {
      name: validate("name", name),
      email: validate("email", email),
      password: validate("password", password),
    };
    setTouched({ name: true, email: true, password: true });
    setErrors(next);
    if (next.name || next.email || next.password) return;

    setSubmitting(true);
    const result = await post<{ challengeId: string; email: string }>("/api/auth/signup", {
      name,
      email,
      password,
    });
    setSubmitting(false);

    if (!result.ok) {
      setErrors({ [result.field ?? "form"]: result.error });
      return;
    }
    setChallenge({ id: result.data.challengeId, email: result.data.email });
  }

  if (challenge) {
    return (
      <>
        <StepMeter step={1} total={2} label="Creating your account" />
        <VerifyStep
          challengeId={challenge.id}
          email={challenge.email}
          backLabel="Use a different email"
          onBack={() => setChallenge(null)}
          onVerified={() => router.push("/onboarding")}
        />
      </>
    );
  }

  return (
    <>
      <StepMeter step={0} total={2} label="Creating your account" />

      <h1 className="text-[26px] font-semibold tracking-tight">Create your account</h1>
      <p className="mt-2 text-[15px] text-muted">
        Three fields to start. We&apos;ll set up your AI workforce next.
      </p>

      <div className="mt-7">
        <GoogleButton configured={googleReady} label="Continue with Google" />
      </div>

      <Divider label="or" />

      <form onSubmit={submit} noValidate className="space-y-5">
        {errors.form && <Alert tone="error">{errors.form}</Alert>}

        <Field
          label="Full name"
          name="name"
          autoComplete="name"
          autoFocus
          value={name}
          onChange={(e) => onChange("name", e.target.value)}
          onBlur={(e) => onBlur("name", e.target.value)}
          error={errors.name}
          placeholder="Ada Okafor"
        />

        <Field
          label="Work email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => onChange("email", e.target.value)}
          onBlur={(e) => onBlur("email", e.target.value)}
          error={errors.email}
          placeholder="you@company.com"
        />

        <PasswordField
          label="Password"
          name="password"
          autoComplete="new-password"
          showStrength
          value={password}
          onChange={(e) => onChange("password", e.target.value)}
          onBlur={(e) => onBlur("password", e.target.value)}
          error={errors.password}
          placeholder="At least 10 characters"
        />

        <Button type="submit" variant="primary" size="lg" fullWidth loading={submitting}>
          {submitting ? "Sending code…" : "Continue"}
        </Button>
      </form>

      <p className="mt-6 text-center text-[14px] text-muted">
        Already have an account?{" "}
        <Link href="/login" className="rounded font-medium text-link hover:underline">
          Sign in
        </Link>
      </p>

      <p className="mt-6 text-center text-[12px] leading-relaxed text-subtle">
        By continuing you agree to our{" "}
        <Link href="/terms" className="rounded underline hover:text-muted">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="rounded underline hover:text-muted">
          Privacy Policy
        </Link>
        .
      </p>
    </>
  );
}
