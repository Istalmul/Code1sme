"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { ChipGroup } from "@/components/ui/Chip";
import { OptionCard } from "@/components/ui/OptionCard";
import { Alert } from "@/components/ui/Alert";
import {
  COMPANY_SIZES,
  INDUSTRIES,
  REGIONS,
  SIGNAL_LABELS,
} from "@/lib/piasowo/recommend";
import type { Mission, SignalKind } from "@/lib/piasowo/types";

const SIGNAL_KINDS = Object.keys(SIGNAL_LABELS) as SignalKind[];

const APPROVAL_MODES = [
  {
    id: "every-message",
    title: "Approve every message",
    description: "Nothing sends until you say so. Start here.",
  },
  {
    id: "first-five",
    title: "Approve the first five",
    description: "After five you approve, the rest send automatically on this mission.",
  },
  {
    id: "automatic",
    title: "Send automatically",
    description: "Only for missions whose drafts you already trust.",
  },
] as const;

/**
 * Mission creation is a review screen, not a blank form.
 *
 * Every field arrives filled from onboarding and the industry model. The basic
 * flow is: read four things, change what's wrong, launch. Regions, channel,
 * approval mode and volume are real controls, but they sit behind a disclosure
 * because a first mission does not need them.
 */
export function MissionForm({
  defaults,
  employeeName,
}: {
  defaults: Omit<Mission, "id" | "createdAt" | "progress">;
  employeeName: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(defaults.name);
  const [objective, setObjective] = useState(defaults.objective);
  const [industries, setIndustries] = useState(defaults.targeting.industries);
  const [sizes, setSizes] = useState(defaults.targeting.sizes);
  const [signals, setSignals] = useState<SignalKind[]>(defaults.targeting.signals);
  const [regions, setRegions] = useState(defaults.targeting.regions);
  const [approval, setApproval] = useState<string>(defaults.outreach.approval);
  const [channel, setChannel] = useState<string>(defaults.outreach.channel);
  const [dailyCap, setDailyCap] = useState(String(defaults.outreach.dailyCap));
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [launching, setLaunching] = useState(false);

  function launch(event: React.FormEvent) {
    event.preventDefault();
    const next: Record<string, string | undefined> = {};
    if (!name.trim()) next.name = "Give the mission a name";
    if (industries.length === 0) next.industries = "Choose at least one market";
    if (sizes.length === 0) next.sizes = "Choose at least one company size";
    if (signals.length === 0) next.signals = "Choose at least one signal to watch";
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    setLaunching(true);
    // Mission persistence is not part of this repository yet; the created
    // mission is represented by the existing sample mission.
    router.push("/missions/m-1");
  }

  return (
    <form onSubmit={launch} noValidate className="space-y-6">
      <div className="flex items-start gap-3 rounded-xl border border-line bg-sunken p-4">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-link" aria-hidden="true" />
        <p className="text-[13px] leading-relaxed text-muted">
          Piasowo filled this in from your workspace. Change anything that looks wrong —{" "}
          {employeeName} will follow whatever you leave here.
        </p>
      </div>

      <section className="space-y-5 rounded-xl border border-line bg-surface p-5 shadow-card">
        <Field
          label="Mission name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setErrors((x) => ({ ...x, name: undefined }));
          }}
          error={errors.name}
        />

        <div>
          <label htmlFor="objective" className="mb-1.5 block text-[13px] font-medium text-body">
            What should {employeeName} achieve?
          </label>
          <textarea
            id="objective"
            rows={3}
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            maxLength={400}
            className="w-full resize-y rounded-lg border border-line-strong bg-surface px-3.5 py-2.5
              text-[15px] leading-relaxed text-body [field-sizing:content] focus:border-brand-500
              focus:outline-none focus:ring-2 focus:ring-brand-500/35"
          />
          <p className="mt-1.5 text-[13px] text-muted">
            This shapes how findings are scored and how drafts open.
          </p>
        </div>
      </section>

      <section className="space-y-6 rounded-xl border border-line bg-surface p-5 shadow-card">
        <h2 className="text-[15px] font-semibold tracking-tight">Who to look for</h2>

        <ChipGroup
          legend="Markets"
          options={INDUSTRIES}
          selected={industries}
          error={errors.industries}
          onChange={(next) => {
            setIndustries(next);
            setErrors((x) => ({ ...x, industries: undefined }));
          }}
        />

        <ChipGroup
          legend="Company size"
          hint="Number of employees."
          options={COMPANY_SIZES}
          selected={sizes}
          error={errors.sizes}
          onChange={(next) => {
            setSizes(next);
            setErrors((x) => ({ ...x, sizes: undefined }));
          }}
        />
      </section>

      <section className="rounded-xl border border-line bg-surface p-5 shadow-card">
        <h2 className="text-[15px] font-semibold tracking-tight">What to watch for</h2>
        <p className="mt-1 text-[13px] text-muted">
          A company only becomes an opportunity when one of these happens.
        </p>

        <div className="mt-4 space-y-2.5">
          {SIGNAL_KINDS.map((kind) => {
            const checked = signals.includes(kind);
            return (
              <label
                key={kind}
                className={`flex cursor-pointer gap-3 rounded-xl border p-3.5 transition-colors ${
                  checked ? "border-brand-600 bg-tint-brand" : "border-line-strong hover:bg-hover"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    setSignals((current) =>
                      current.includes(kind)
                        ? current.filter((k) => k !== kind)
                        : [...current, kind],
                    );
                    setErrors((x) => ({ ...x, signals: undefined }));
                  }}
                  className="mt-0.5 size-4 shrink-0 accent-brand-600"
                />
                <span className="min-w-0">
                  <span
                    className={`block text-[14px] font-medium ${
                      checked ? "text-on-brand" : "text-body"
                    }`}
                  >
                    {SIGNAL_LABELS[kind].label}
                  </span>
                  <span className="mt-0.5 block text-[13px] leading-relaxed text-muted">
                    {SIGNAL_LABELS[kind].blurb}
                  </span>
                </span>
              </label>
            );
          })}
        </div>

        {errors.signals && (
          <p role="alert" className="mt-2.5 text-[13px] text-on-bad">
            {errors.signals}
          </p>
        )}
      </section>

      {/* Progressive disclosure: real controls, out of the way until wanted. */}
      <section className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
        <button
          type="button"
          onClick={() => setAdvancedOpen((v) => !v)}
          aria-expanded={advancedOpen}
          className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-hover"
        >
          <span>
            <span className="block text-[15px] font-semibold tracking-tight">
              Regions, channel and volume
            </span>
            <span className="mt-0.5 block text-[13px] text-muted">
              {regions.join(", ")} · {channel === "email" ? "Email" : "LinkedIn"} ·{" "}
              {dailyCap}/day ·{" "}
              {APPROVAL_MODES.find((m) => m.id === approval)?.title.toLowerCase()}
            </span>
          </span>
          <ChevronDown
            className={`size-5 shrink-0 text-subtle transition-transform ${
              advancedOpen ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          />
        </button>

        {advancedOpen && (
          <div className="space-y-6 border-t border-line p-5">
            <ChipGroup
              legend="Regions"
              options={REGIONS}
              selected={regions}
              onChange={setRegions}
            />

            <fieldset>
              <legend className="mb-3 text-[13px] font-medium text-body">Outreach channel</legend>
              <div className="space-y-2.5">
                <OptionCard
                  name="channel"
                  value="email"
                  checked={channel === "email"}
                  onSelect={setChannel}
                  title="Email"
                  description="Used whenever a verified work address is found."
                />
                <OptionCard
                  name="channel"
                  value="linkedin"
                  checked={channel === "linkedin"}
                  onSelect={setChannel}
                  title="LinkedIn"
                  description="Better for senior contacts whose address isn't public."
                />
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-3 text-[13px] font-medium text-body">Before anything sends</legend>
              <div className="space-y-2.5">
                {APPROVAL_MODES.map((mode) => (
                  <OptionCard
                    key={mode.id}
                    name="approval"
                    value={mode.id}
                    checked={approval === mode.id}
                    onSelect={setApproval}
                    title={mode.title}
                    description={mode.description}
                    badge={mode.id === "every-message" ? "Default" : undefined}
                  />
                ))}
              </div>
            </fieldset>

            <Field
              label="Maximum messages per day"
              type="number"
              min={1}
              max={200}
              value={dailyCap}
              onChange={(e) => setDailyCap(e.target.value)}
              hint="Keeps volume in line with what your domain can send safely."
            />
          </div>
        )}
      </section>

      {Object.values(errors).some(Boolean) && (
        <Alert tone="error">Check the highlighted fields before launching.</Alert>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" size="lg" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" size="lg" loading={launching}>
          {launching ? "Launching…" : `Launch mission`}
        </Button>
      </div>
    </form>
  );
}
