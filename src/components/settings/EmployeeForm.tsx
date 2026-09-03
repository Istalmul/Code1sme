"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, PauseCircle, PlayCircle, ShieldCheck } from "lucide-react";
import { Field } from "@/components/ui/Field";
import { Toggle } from "@/components/ui/Toggle";
import { Slider } from "@/components/ui/Slider";
import { Segmented } from "@/components/ui/Segmented";
import { OptionCard } from "@/components/ui/OptionCard";
import { Button } from "@/components/ui/Button";
import { SettingsGroup, SettingsShell } from "./SettingsShell";
import { SaveBar } from "./SaveBar";
import { useSettingsForm } from "@/lib/settings/client";
import { ACTIVITY_PRESETS } from "@/lib/settings/defaults";
import { EMPLOYEE_ROLES, TONES } from "@/lib/piasowo/recommend";
import type { AiEmployeeSettings } from "@/lib/auth/store";

type Draft = AiEmployeeSettings & { minScore: number };

const APPROVAL = [
  {
    id: "every-message",
    title: "Approve every message",
    description: "Nothing sends until you say so. Start here.",
    badge: "Default",
  },
  {
    id: "first-five",
    title: "Approve the first five",
    description: "After five you approve, the rest send on their own.",
  },
  {
    id: "automatic",
    title: "Send automatically",
    description: "Only once the drafts are consistently right.",
  },
] as const;

function hourLabel(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

export function EmployeeForm({
  initial,
  minScore,
}: {
  initial: AiEmployeeSettings;
  minScore: number;
}) {
  const router = useRouter();
  const form = useSettingsForm<Draft>({ ...initial, minScore });
  const { draft, update } = form;
  const [advancedOpen, setAdvancedOpen] = useState(false);

  /** A preset is "active" only while every value it sets still matches. */
  const activePreset = ACTIVITY_PRESETS.find(
    (p) =>
      p.dailyCap === draft.dailyCap && p.hourlyCap === draft.hourlyCap && p.minScore === draft.minScore,
  );

  async function submit() {
    const { minScore: score, ...employee } = draft;
    const ok = await form.save({
      employee: {
        name: employee.name.trim(),
        role: employee.role,
        tone: employee.tone,
        paused: employee.paused,
        approval: employee.approval,
        dailyCap: employee.dailyCap,
        hourlyCap: employee.hourlyCap,
        sendWindow: employee.sendWindow,
        followUp: employee.followUp,
        digest: employee.digest,
      },
      workspaceCriteriaMinScore: score,
    });
    if (ok) router.refresh();
  }

  return (
    <SettingsShell
      title={draft.name}
      description="How your AI employee works, and what it's allowed to do without asking."
    >
      <div className="space-y-6">
        {draft.paused && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-on-warn/30 bg-tint-warn px-4 py-3.5">
            <p className="text-[13px] font-medium text-on-warn">
              {draft.name} is paused — no research, no drafting, nothing sending.
            </p>
            <Button size="sm" onClick={() => update({ paused: false })}>
              <PlayCircle className="size-4" aria-hidden="true" />
              Resume
            </Button>
          </div>
        )}

        <SettingsGroup title="Identity">
          <Field
            label="Name"
            value={draft.name}
            maxLength={40}
            onChange={(e) => update({ name: e.target.value })}
            hint="Appears on every finding, draft and activity entry."
          />

          <fieldset>
            <legend className="mb-2.5 text-[13px] font-medium text-body">What they focus on</legend>
            <div className="space-y-2.5">
              {EMPLOYEE_ROLES.map((role) => (
                <OptionCard
                  key={role.id}
                  name="role"
                  value={role.title}
                  checked={draft.role === role.title}
                  onSelect={(next) => update({ role: next })}
                  title={role.title}
                  description={role.summary}
                  badge={role.bestFor}
                />
              ))}
            </div>
          </fieldset>

          <Segmented
            legend="Writing voice"
            hint="Changes how drafts open and sign off."
            options={TONES.map((t) => ({ id: t.label, label: t.label, sub: t.sample }))}
            value={draft.tone}
            onChange={(next) => update({ tone: next })}
            columns={1}
          />
        </SettingsGroup>

        <SettingsGroup
          title="How much work"
          description="A preset sets volume, pacing and the minimum score together. Adjust any of them and you're on custom."
        >
          <div className="grid gap-2 sm:grid-cols-3">
            {ACTIVITY_PRESETS.map((preset) => {
              const active = activePreset?.id === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() =>
                    update({
                      dailyCap: preset.dailyCap,
                      hourlyCap: preset.hourlyCap,
                      minScore: preset.minScore,
                    })
                  }
                  className={`rounded-xl border p-3.5 text-left transition-colors ${
                    active
                      ? "border-brand-600 bg-tint-brand"
                      : "border-line-strong bg-surface hover:bg-hover"
                  }`}
                >
                  <span
                    className={`block text-[14px] font-semibold ${
                      active ? "text-on-brand" : "text-body"
                    }`}
                  >
                    {preset.label}
                  </span>
                  <span className="mt-1 block text-[13px] leading-relaxed text-muted">
                    {preset.summary}
                  </span>
                </button>
              );
            })}
          </div>
          {!activePreset && (
            <p className="text-[13px] text-muted">
              Custom — {draft.dailyCap}/day, {draft.hourlyCap}/hour, minimum score {draft.minScore}.
            </p>
          )}
        </SettingsGroup>

        <SettingsGroup title="Before anything sends">
          {/* The trust scaffolding, stated plainly — it's a feature, not a
              background behaviour the user has to discover. */}
          <div className="flex gap-3 rounded-xl border border-line bg-sunken p-3.5">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-on-good" aria-hidden="true" />
            <p className="text-[13px] leading-relaxed text-muted">
              Approval is on by default, weak matches are held back by your minimum score, and every
              decision can be undone. You can loosen any of it — we won&apos;t do it for you.
            </p>
          </div>

          <fieldset>
            <legend className="mb-2.5 text-[13px] font-medium text-body">Approval</legend>
            <div className="space-y-2.5">
              {APPROVAL.map((mode) => (
                <OptionCard
                  key={mode.id}
                  name="approval"
                  value={mode.id}
                  checked={draft.approval === mode.id}
                  onSelect={(next) => update({ approval: next as Draft["approval"] })}
                  title={mode.title}
                  description={mode.description}
                  badge={"badge" in mode ? mode.badge : undefined}
                />
              ))}
            </div>
          </fieldset>

          <Slider
            label="Minimum score to reach you"
            hint="Anything below this is held back and counted, not silently dropped."
            min={0}
            max={95}
            step={5}
            value={draft.minScore}
            onChange={(v) => update({ minScore: v })}
          />
        </SettingsGroup>

        {/* Progressive disclosure: real controls, out of the way until wanted. */}
        <section className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
          <button
            type="button"
            onClick={() => setAdvancedOpen((v) => !v)}
            aria-expanded={advancedOpen}
            className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left hover:bg-hover"
          >
            <span>
              <span className="block text-[15px] font-semibold tracking-tight">
                Schedule, pacing and follow-up
              </span>
              <span className="mt-0.5 block text-[13px] text-muted">
                {hourLabel(draft.sendWindow.start)}–{hourLabel(draft.sendWindow.end)}
                {draft.sendWindow.weekends ? ", incl. weekends" : ", weekdays only"} ·{" "}
                {draft.hourlyCap}/hour ·{" "}
                {draft.followUp.enabled ? `${draft.followUp.max} follow-up` : "no follow-up"}
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
            <div className="space-y-5 border-t border-line p-card">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="window-start" className="mb-1.5 block text-[13px] font-medium text-body">
                    Send from
                  </label>
                  <select
                    id="window-start"
                    value={draft.sendWindow.start}
                    onChange={(e) =>
                      update({ sendWindow: { ...draft.sendWindow, start: Number(e.target.value) } })
                    }
                    className="h-11 w-full rounded-lg border border-line-strong bg-surface px-3.5 text-[15px] text-body focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/35"
                  >
                    {Array.from({ length: 24 }, (_, h) => (
                      <option key={h} value={h}>
                        {hourLabel(h)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="window-end" className="mb-1.5 block text-[13px] font-medium text-body">
                    Send until
                  </label>
                  <select
                    id="window-end"
                    value={draft.sendWindow.end}
                    onChange={(e) =>
                      update({ sendWindow: { ...draft.sendWindow, end: Number(e.target.value) } })
                    }
                    className="h-11 w-full rounded-lg border border-line-strong bg-surface px-3.5 text-[15px] text-body focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/35"
                  >
                    {Array.from({ length: 24 }, (_, h) => h + 1).map((h) => (
                      <option key={h} value={h}>
                        {hourLabel(h)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="-mt-2 text-[13px] text-muted">
                Uses the timezone on your profile. Outside these hours, drafts queue instead of
                sending.
              </p>

              <Toggle
                label="Send at weekends"
                description="Most B2B replies come on weekdays."
                checked={draft.sendWindow.weekends}
                onChange={(v) => update({ sendWindow: { ...draft.sendWindow, weekends: v } })}
              />

              <Slider
                label="Messages per day"
                min={1}
                max={100}
                value={draft.dailyCap}
                onChange={(v) => update({ dailyCap: v })}
              />

              <Slider
                label="Messages per hour"
                hint="A daily cap alone would let the whole day's volume go out in one burst, which is what gets a domain flagged."
                min={1}
                max={30}
                value={draft.hourlyCap}
                onChange={(v) => update({ hourlyCap: v })}
              />

              <Toggle
                label="Follow up once if there's no reply"
                description="Most replies come from the follow-up rather than the first message."
                checked={draft.followUp.enabled}
                onChange={(v) => update({ followUp: { ...draft.followUp, enabled: v } })}
              />

              {draft.followUp.enabled && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Slider
                    label="Wait before following up"
                    min={1}
                    max={21}
                    value={draft.followUp.afterDays}
                    onChange={(v) => update({ followUp: { ...draft.followUp, afterDays: v } })}
                    format={(v) => `${v} ${v === 1 ? "day" : "days"}`}
                  />
                  <Slider
                    label="Maximum follow-ups"
                    hint="Capped at two. Beyond that it reads as pestering."
                    min={1}
                    max={2}
                    value={draft.followUp.max}
                    onChange={(v) => update({ followUp: { ...draft.followUp, max: v } })}
                  />
                </div>
              )}

              <Segmented
                legend="Digest"
                hint="A summary of what your AI employee did."
                options={[
                  { id: "daily", label: "Daily" },
                  { id: "twice-daily", label: "Twice daily" },
                  { id: "off", label: "Off" },
                ]}
                value={draft.digest}
                onChange={(next) => update({ digest: next })}
              />
            </div>
          )}
        </section>

        {!draft.paused && (
          <button
            type="button"
            onClick={() => update({ paused: true })}
            className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3.5 text-left shadow-card transition-colors hover:bg-hover"
          >
            <PauseCircle className="size-[18px] shrink-0 text-muted" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block text-[14px] font-medium text-body">Pause {draft.name}</span>
              <span className="mt-0.5 block text-[13px] text-muted">
                Stops everything, not just sending. Nothing already found is lost.
              </span>
            </span>
          </button>
        )}

        <SaveBar
          dirty={form.dirty}
          saving={form.saving}
          saved={form.saved}
          error={form.error}
          onSave={submit}
          onReset={form.reset}
        />
      </div>
    </SettingsShell>
  );
}
