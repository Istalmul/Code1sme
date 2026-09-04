"use client";

import { useRouter } from "next/navigation";
import { Field } from "@/components/ui/Field";
import { ChipGroup } from "@/components/ui/Chip";
import { Combobox } from "@/components/ui/Combobox";
import { SettingsGroup, SettingsShell } from "./SettingsShell";
import { SaveBar } from "./SaveBar";
import { DocumentsPanel } from "./DocumentsPanel";
import { useSettingsForm } from "@/lib/settings/client";
import { COMPANY_SIZES, INDUSTRIES } from "@/lib/piasowo/recommend";
import type { WorkspaceDocument } from "@/lib/auth/store";

type Draft = {
  companyName: string;
  website: string;
  offering: string;
  industry: string;
  targetMarkets: string[];
  companySizes: string[];
  criteria: { minScore: number; dealBreakers: string };
};

export function WorkspaceForm({
  initial,
  documents,
  employeeName,
}: {
  initial: Draft;
  documents: WorkspaceDocument[];
  employeeName: string;
}) {
  const router = useRouter();
  const form = useSettingsForm<Draft>(initial);
  const { draft, update } = form;

  async function submit() {
    const ok = await form.save({
      workspace: {
        companyName: draft.companyName.trim(),
        website: draft.website.trim() || undefined,
        offering: draft.offering.trim(),
        industry: draft.industry.trim(),
        targetMarkets: draft.targetMarkets,
        companySizes: draft.companySizes,
        criteria: draft.criteria,
      },
    });
    if (ok) router.refresh();
  }

  return (
    <SettingsShell
      title="Workspace"
      description="What you sell, who you sell to, and what your AI employee writes from."
    >
      <div className="space-y-6">
        <SettingsGroup title="Your business">
          <Field
            label="Company name"
            value={draft.companyName}
            onChange={(e) => update({ companyName: e.target.value })}
          />

          <Field
            label="Website"
            type="url"
            value={draft.website}
            placeholder="https://acme.com"
            onChange={(e) => update({ website: e.target.value })}
          />

          {/* Typeahead rather than a free-text field: a typo here silently
              splits one industry into two and skews every recommendation. */}
          <Combobox
            label="Your industry"
            options={INDUSTRIES}
            value={draft.industry}
            onChange={(next) => update({ industry: next })}
            placeholder="Start typing…"
            hint="Drives which markets and signals we suggest."
          />

          <div>
            <label htmlFor="offering" className="mb-1.5 block text-[13px] font-medium text-body">
              What you sell
            </label>
            <textarea
              id="offering"
              rows={3}
              maxLength={280}
              value={draft.offering}
              onChange={(e) => update({ offering: e.target.value })}
              className="w-full resize-y rounded-lg border border-line-strong bg-surface px-3.5 py-2.5 text-[15px] leading-relaxed text-body [field-sizing:content] focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/35"
            />
            <p className="mt-1.5 text-[13px] text-muted">
              One line. This shapes how every draft opens.
            </p>
          </div>
        </SettingsGroup>

        <SettingsGroup title="Who you sell to">
          <ChipGroup
            legend="Target markets"
            options={INDUSTRIES}
            selected={draft.targetMarkets}
            onChange={(next) => update({ targetMarkets: next })}
          />
          <ChipGroup
            legend="Company size"
            hint="Number of employees."
            options={COMPANY_SIZES}
            selected={draft.companySizes}
            onChange={(next) => update({ companySizes: next })}
          />
        </SettingsGroup>

        <SettingsGroup
          title="Deal-breakers"
          description="Hard no's. Anything matching these is never raised, whatever it scores."
        >
          <textarea
            rows={3}
            maxLength={500}
            value={draft.criteria.dealBreakers}
            placeholder="Agencies&#10;Anyone already using a competitor&#10;Under 10 staff"
            onChange={(e) =>
              update({ criteria: { ...draft.criteria, dealBreakers: e.target.value } })
            }
            aria-label="Deal-breakers"
            className="w-full resize-y rounded-lg border border-line-strong bg-surface px-3.5 py-2.5 text-[15px] leading-relaxed text-body [field-sizing:content] placeholder:text-subtle focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/35"
          />
          <p className="text-[13px] text-muted">One per line.</p>
        </SettingsGroup>

        <SettingsGroup
          title="Proof points"
          description={`What ${employeeName} draws on when writing. A draft cites at most one — never a wall of your credentials.`}
        >
          <DocumentsPanel documents={documents} employeeName={employeeName} />
        </SettingsGroup>

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
