"use client";

import { useState } from "react";
import { Cpu, Quote, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { EmployeeAvatar } from "./EmployeeStatus";
import type { Opportunity } from "@/lib/piasowo/types";

type Analysis = { situation: string; pressure: string; angle: string };
type Draft = { channel: "email" | "linkedin"; subject: string; body: string; grounding: string[] };
type Result = { analysis: Analysis; draft: Draft; usedAI: boolean; model: string | null; note: string | null };

/**
 * Research, then a draft written from it.
 *
 * The two are shown separately because the analysis is what makes the draft
 * checkable — if the reasoning is wrong, the message will be too, and that is
 * easier to see in prose than in a finished email.
 */
export function AiDraftPanel({
  opportunity,
  employeeName,
  destination,
  hasProofPoints,
}: {
  opportunity: Opportunity;
  employeeName: string;
  destination: string;
  hasProofPoints: boolean;
}) {
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/opportunities/${opportunity.id}/draft`, { method: "POST" });
      const payload = (await response.json().catch(() => ({}))) as Result & { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Couldn't write a draft. Please try again.");
        return;
      }
      setResult(payload);
    } catch {
      setError("Couldn't reach Piasowo. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  const draft = result?.draft ?? opportunity.draft;

  return (
    <section className="rounded-xl border border-line bg-surface shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <EmployeeAvatar name={employeeName} size={32} />
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold tracking-tight">
              {draft ? `${employeeName}'s draft` : `${employeeName} hasn't written this one yet`}
            </h2>
            <p className="mt-0.5 break-all text-[13px] text-muted">{destination}</p>
          </div>
        </div>
        <Button size="sm" loading={busy} onClick={run}>
          {result ? (
            <RefreshCw className="size-4" aria-hidden="true" />
          ) : (
            <Sparkles className="size-4" aria-hidden="true" />
          )}
          {busy ? "Researching…" : result ? "Write it again" : "Research and draft"}
        </Button>
      </div>

      {error && (
        <div className="p-card">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      {result && (
        <div className="border-b border-line px-5 py-4">
          <p className="text-[13px] font-medium text-body">What {employeeName} found</p>
          <dl className="mt-2 space-y-2 text-[13px] leading-relaxed">
            {[
              { term: "Situation", detail: result.analysis.situation },
              { term: "Pressure", detail: result.analysis.pressure },
              { term: "Angle", detail: result.analysis.angle },
            ].map((row) => (
              <div key={row.term} className="flex gap-3">
                <dt className="w-20 shrink-0 text-subtle">{row.term}</dt>
                <dd className="min-w-0 flex-1 text-muted">{row.detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {draft ? (
        <>
          <div className="px-5 py-4">
            {draft.subject && (
              <p className="mb-3 text-[14px]">
                <span className="text-muted">Subject: </span>
                <span className="font-medium text-body">{draft.subject}</span>
              </p>
            )}
            <p className="whitespace-pre-line text-[14px] leading-relaxed text-body">{draft.body}</p>
          </div>

          <div className="border-t border-line bg-sunken px-5 py-4">
            <p className="flex items-center gap-1.5 text-[13px] font-medium text-body">
              <Quote className="size-3.5 text-subtle" aria-hidden="true" />
              Written from
            </p>
            <ul className="mt-2 space-y-1">
              {draft.grounding.map((source) => (
                <li key={source} className="text-[13px] leading-relaxed text-muted">
                  {source}
                </li>
              ))}
            </ul>

            {!hasProofPoints && (
              <p className="mt-3 border-t border-line pt-3 text-[13px] leading-relaxed text-muted">
                Nothing here says why you&apos;re worth a reply. Add a proof point in Settings →
                Workspace and {employeeName} will work one in.
              </p>
            )}

            {/* Never let a template pass for model output — the difference is
                exactly what the user is deciding to trust. */}
            {result && (
              <p className="mt-3 flex items-start gap-1.5 border-t border-line pt-3 text-[13px] leading-relaxed text-subtle">
                <Cpu className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                {result.usedAI
                  ? `Written by ${result.model} just now.`
                  : `Template, not model output. ${result.note ?? ""}`}
              </p>
            )}
          </div>
        </>
      ) : (
        <div className="px-5 py-4">
          <p className="text-[14px] leading-relaxed text-muted">
            The signal is real but thin. Have {employeeName} study {opportunity.prospect.company}{" "}
            properly and write an opening from what it finds.
          </p>
        </div>
      )}
    </section>
  );
}
