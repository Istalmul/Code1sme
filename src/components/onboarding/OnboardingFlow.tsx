"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { ChipGroup } from "@/components/ui/Chip";
import { OptionCard } from "@/components/ui/OptionCard";
import { Logo } from "@/components/ui/Logo";
import { StepMeter } from "@/components/auth/StepMeter";
import { post } from "@/lib/api";
import {
  COMPANY_SIZES,
  EMPLOYEE_NAMES,
  EMPLOYEE_ROLES,
  INDUSTRIES,
  SIGNAL_LABELS,
  TONES,
  suggestTargeting,
} from "@/lib/piasowo/recommend";

const STEPS = ["Your business", "Your market", "Your AI employee", "Your first mission"] as const;

/**
 * Four short steps, each one pre-answered from what came before.
 *
 * The user's job across this flow is to review and correct, not to fill in
 * blanks — and the flow ends on a mission that is ready to run, so the first
 * useful action is one click away rather than another empty form.
 */
export function OnboardingFlow({
  firstName,
  guess,
}: {
  firstName: string;
  guess: { name: string; website: string } | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const [companyName, setCompanyName] = useState(guess?.name ?? "");
  const [website, setWebsite] = useState(guess?.website ?? "");
  const [industry, setIndustry] = useState("");
  const [offering, setOffering] = useState("");

  const [markets, setMarkets] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [marketsTouched, setMarketsTouched] = useState(false);

  const [employeeName, setEmployeeName] = useState<string>(EMPLOYEE_NAMES[0]);
  const [role, setRole] = useState<string>(EMPLOYEE_ROLES[0].id);
  const [tone, setTone] = useState<string>(TONES[1].id);

  const suggestion = useMemo(() => suggestTargeting(industry), [industry]);

  /** Choosing an industry seeds the market step, unless the user edited it. */
  function chooseIndustry(next: string) {
    setIndustry(next);
    setErrors((e) => ({ ...e, industry: undefined }));
    if (!marketsTouched) {
      const seeded = suggestTargeting(next);
      setMarkets(seeded.industries);
      setSizes(seeded.sizes);
    }
  }

  function validateStep(): boolean {
    const next: Record<string, string | undefined> = {};
    if (step === 0) {
      if (!companyName.trim()) next.companyName = "Enter your company name";
      if (!industry) next.industry = "Choose the closest industry";
      if (offering.trim().length < 3) next.offering = "One line is enough";
    }
    if (step === 1) {
      if (markets.length === 0) next.markets = "Choose at least one market";
      if (sizes.length === 0) next.sizes = "Choose at least one company size";
    }
    if (step === 2 && !employeeName.trim()) next.employeeName = "Give them a name";
    setErrors(next);
    return Object.values(next).every((v) => !v);
  }

  function forward() {
    if (validateStep()) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function finish() {
    setSubmitting(true);
    setFormError(null);
    const result = await post("/api/onboarding", {
      companyName: companyName.trim(),
      website: website.trim() || undefined,
      offering: offering.trim(),
      industry,
      targetMarkets: markets,
      companySizes: sizes,
      aiEmployee: {
        name: employeeName.trim(),
        role: EMPLOYEE_ROLES.find((r) => r.id === role)!.title,
        tone: TONES.find((t) => t.id === tone)!.label,
        avatarSeed: employeeName.trim().toLowerCase(),
      },
    });
    setSubmitting(false);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    router.push("/command-center");
    router.refresh();
  }

  return (
    <div className="min-h-dvh bg-surface">
      <header className="border-b border-line px-6 py-4 sm:px-10">
        <Logo />
      </header>

      <main id="main" className="mx-auto w-full max-w-[600px] px-6 py-10 sm:py-14">
        <StepMeter step={step} total={STEPS.length} label={STEPS[step]} />

        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="mb-6 inline-flex items-center gap-1.5 rounded text-[13px] text-muted hover:text-body"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back
          </button>
        )}

        {step === 0 && (
          <section>
            <h1 className="text-[26px] font-semibold tracking-tight">
              Welcome, {firstName}. Tell us about your business.
            </h1>
            <p className="mt-2 text-[15px] text-muted">
              {guess
                ? "We filled in what we could from your email. Correct anything that's wrong."
                : "Four short steps. Your AI employee starts working at the end of them."}
            </p>

            <div className="mt-7 space-y-5">
              <Field
                label="Company name"
                value={companyName}
                autoFocus={!guess}
                onChange={(e) => {
                  setCompanyName(e.target.value);
                  setErrors((x) => ({ ...x, companyName: undefined }));
                }}
                error={errors.companyName}
                placeholder="Acme Ltd"
              />

              <Field
                label="Website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://acme.com"
                hint="Optional. It helps your AI employee understand what you do."
              />

              <div>
                <label
                  htmlFor="industry"
                  className="mb-1.5 block text-[13px] font-medium text-body"
                >
                  Your industry
                </label>
                <select
                  id="industry"
                  value={industry}
                  onChange={(e) => chooseIndustry(e.target.value)}
                  aria-invalid={errors.industry ? true : undefined}
                  className={`h-11 w-full rounded-lg border bg-surface px-3.5 text-[15px] text-body
                    focus:outline-none focus:ring-2 focus:ring-brand-500/35 ${
                      errors.industry ? "border-bad-600" : "border-line-strong focus:border-brand-500"
                    }`}
                >
                  <option value="">Choose the closest match</option>
                  {INDUSTRIES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {errors.industry ? (
                  <p role="alert" className="mt-1.5 text-[13px] text-on-bad">
                    {errors.industry}
                  </p>
                ) : (
                  <p className="mt-1.5 text-[13px] text-muted">
                    We use this to suggest who to target next.
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="offering"
                  className="mb-1.5 block text-[13px] font-medium text-body"
                >
                  What do you sell?
                </label>
                <textarea
                  id="offering"
                  rows={3}
                  value={offering}
                  onChange={(e) => {
                    setOffering(e.target.value);
                    setErrors((x) => ({ ...x, offering: undefined }));
                  }}
                  maxLength={280}
                  aria-invalid={errors.offering ? true : undefined}
                  placeholder="Warehouse management software for mid-size distributors"
                  className={`w-full resize-y rounded-lg border bg-surface px-3.5 py-2.5 text-[15px]
                    leading-relaxed text-body [field-sizing:content] placeholder:text-subtle
                    focus:outline-none focus:ring-2 focus:ring-brand-500/35 ${
                      errors.offering ? "border-bad-600" : "border-line-strong focus:border-brand-500"
                    }`}
                />
                {errors.offering ? (
                  <p role="alert" className="mt-1.5 text-[13px] text-on-bad">
                    {errors.offering}
                  </p>
                ) : (
                  <p className="mt-1.5 text-[13px] text-muted">
                    One line. This becomes the opening line of your outreach.
                  </p>
                )}
              </div>

              <Button variant="primary" size="lg" fullWidth onClick={forward}>
                Continue
              </Button>
            </div>
          </section>
        )}

        {step === 1 && (
          <section>
            <h1 className="text-[26px] font-semibold tracking-tight">Who do you sell to?</h1>
            <p className="mt-2 text-[15px] text-muted">
              We picked a starting point from your industry. Remove anything that doesn&apos;t fit
              — you can widen it later without losing work.
            </p>

            <div className="mt-7 space-y-7">
              <ChipGroup
                legend="Target markets"
                options={INDUSTRIES}
                selected={markets}
                error={errors.markets}
                onChange={(next) => {
                  setMarketsTouched(true);
                  setMarkets(next);
                  setErrors((x) => ({ ...x, markets: undefined }));
                }}
              />

              <ChipGroup
                legend="Company size"
                hint="Number of employees."
                options={COMPANY_SIZES}
                selected={sizes}
                error={errors.sizes}
                onChange={(next) => {
                  setMarketsTouched(true);
                  setSizes(next);
                  setErrors((x) => ({ ...x, sizes: undefined }));
                }}
              />

              <div className="rounded-xl border border-line bg-sunken p-4">
                <p className="text-[13px] font-medium text-body">
                  Signals we&apos;ll watch for on these companies
                </p>
                <ul className="mt-2.5 space-y-1.5">
                  {suggestion.signals.map((signal) => (
                    <li key={signal} className="text-[13px] text-muted">
                      <span className="font-medium text-body">{SIGNAL_LABELS[signal].label}</span>
                      {" — "}
                      {SIGNAL_LABELS[signal].blurb}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-[13px] text-subtle">
                  You can change these per mission. Nothing is locked in here.
                </p>
              </div>

              <Button variant="primary" size="lg" fullWidth onClick={forward}>
                Continue
              </Button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section>
            <h1 className="text-[26px] font-semibold tracking-tight">Meet your AI employee</h1>
            <p className="mt-2 text-[15px] text-muted">
              They&apos;ll run your missions, and you&apos;ll see their name on every finding. Make
              them yours.
            </p>

            <div className="mt-7 space-y-7">
              <div>
                <Field
                  label="Name"
                  value={employeeName}
                  onChange={(e) => {
                    setEmployeeName(e.target.value);
                    setErrors((x) => ({ ...x, employeeName: undefined }));
                  }}
                  error={errors.employeeName}
                  maxLength={40}
                />
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {EMPLOYEE_NAMES.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setEmployeeName(option)}
                      className={`rounded-full border px-3 py-1 text-[13px] transition-colors ${
                        employeeName === option
                          ? "border-brand-600 bg-tint-brand font-medium text-on-brand"
                          : "border-line-strong text-muted hover:bg-hover hover:text-body"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <fieldset>
                <legend className="mb-3 text-[13px] font-medium text-body">What they focus on</legend>
                <div className="space-y-2.5">
                  {EMPLOYEE_ROLES.map((option) => (
                    <OptionCard
                      key={option.id}
                      name="role"
                      value={option.id}
                      checked={role === option.id}
                      onSelect={setRole}
                      title={option.title}
                      description={option.summary}
                      badge={option.bestFor}
                    />
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-3 text-[13px] font-medium text-body">
                  How they write to prospects
                </legend>
                <div className="space-y-2.5">
                  {TONES.map((option) => (
                    <OptionCard
                      key={option.id}
                      name="tone"
                      value={option.id}
                      checked={tone === option.id}
                      onSelect={setTone}
                      title={option.label}
                      description={option.sample}
                    />
                  ))}
                </div>
              </fieldset>

              <Button variant="primary" size="lg" fullWidth onClick={forward}>
                Continue
              </Button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section>
            <h1 className="text-[26px] font-semibold tracking-tight">
              {employeeName}&apos;s first mission is ready
            </h1>
            <p className="mt-2 text-[15px] text-muted">
              Built from your answers. Launch it now, or change anything from the mission page
              afterwards.
            </p>

            <div className="mt-7 rounded-xl border border-line bg-surface shadow-card">
              <div className="flex items-start gap-3 border-b border-line px-5 py-4">
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-tint-brand text-on-brand">
                  <Sparkles className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-[15px] font-semibold">{markets[0]} — first 50</h2>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted">
                    Find {markets[0]?.toLowerCase()} companies showing buying signals and open a
                    conversation about {offering.toLowerCase() || "what you sell"}.
                  </p>
                </div>
              </div>

              <dl className="divide-y divide-[color:var(--border)]">
                {[
                  { term: "Run by", detail: `${employeeName}, ${EMPLOYEE_ROLES.find((r) => r.id === role)!.title}` },
                  { term: "Markets", detail: markets.join(", ") },
                  { term: "Company size", detail: `${sizes.join(", ")} employees` },
                  { term: "Regions", detail: suggestion.regions.join(", ") },
                  {
                    term: "Signals",
                    detail: suggestion.signals.map((s) => SIGNAL_LABELS[s].label).join(", "),
                  },
                  {
                    term: "Before sending",
                    detail: "You approve every message. Change this once you trust the drafts.",
                  },
                ].map((row) => (
                  <div key={row.term} className="flex gap-4 px-5 py-3 text-[13px]">
                    <dt className="w-28 shrink-0 text-muted">{row.term}</dt>
                    <dd className="min-w-0 flex-1 text-body">{row.detail}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {formError && (
              <div className="mt-5">
                <Alert tone="error">{formError}</Alert>
              </div>
            )}

            <Button
              variant="primary"
              size="lg"
              fullWidth
              className="mt-6"
              loading={submitting}
              onClick={finish}
            >
              {submitting ? "Starting…" : `Launch mission and meet ${employeeName}`}
            </Button>

            <p className="mt-3 text-center text-[13px] text-muted">
              Nothing is sent without your approval.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
