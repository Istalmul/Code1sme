import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { requireWorkspace } from "@/lib/piasowo/session-data";
import { relativeTime } from "@/lib/piasowo/format";
import { ScoreBadge } from "@/components/piasowo/ScoreBadge";
import { SignalBadge } from "@/components/piasowo/SignalBadge";
import { ScoreBreakdown } from "@/components/piasowo/ScoreBreakdown";
import { DecisionPanel } from "@/components/piasowo/DecisionPanel";
import { ContactCard } from "@/components/piasowo/ContactCard";
import { AiDraftPanel } from "@/components/piasowo/AiDraftPanel";

export const metadata: Metadata = { title: "Opportunity" };

export default async function OpportunityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { workspace, data } = await requireWorkspace();
  const opportunity = data.opportunities.find((o) => o.id === id);
  if (!opportunity) notFound();

  const employee = data.employees.find((e) => e.id === opportunity.employeeId)!;
  const mission = data.missions.find((m) => m.id === opportunity.missionId)!;
  const { prospect, signal } = opportunity;

  return (
    <div>
      <Link
        href="/opportunities"
        className="inline-flex items-center gap-1.5 rounded text-[13px] text-muted hover:text-body"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Opportunities
      </Link>

      <header className="mt-4">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <h1 className="text-[22px] font-semibold tracking-tight sm:text-[26px]">
              {prospect.company}
            </h1>
            <p className="mt-1.5 text-[14px] text-muted">
              {prospect.industry} · {prospect.employees} staff · {prospect.location} ·{" "}
              <a
                href={`https://${prospect.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded text-link hover:underline"
              >
                {prospect.domain}
                <ExternalLink className="size-3.5" aria-hidden="true" />
              </a>
            </p>
          </div>
          <ScoreBadge score={opportunity.score} />
        </div>
      </header>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
        {/* On a phone the decision comes before the reading. On desktop grid
            placement puts it back at the top of the right column, so the same
            markup serves both without duplicating the panel's state. */}
        <div className="lg:col-start-2 lg:row-start-1">
          <DecisionPanel opportunity={opportunity} />
        </div>

        <div className="space-y-6 lg:col-start-1 lg:row-start-1 lg:row-span-2">
          {/* 1. What happened */}
          <section className="rounded-xl border border-line bg-surface p-5 shadow-card">
            <div className="flex flex-wrap items-center gap-2">
              <SignalBadge kind={signal.kind} />
              <span className="text-[12px] text-subtle">
                Detected {relativeTime(signal.observedAt)} · {signal.source}
              </span>
            </div>
            <h2 className="mt-3 text-[17px] font-semibold tracking-tight">What happened</h2>
            <p className="mt-2 text-[15px] font-medium leading-relaxed text-body">
              {signal.headline}
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-muted">{signal.detail}</p>
          </section>

          {/* 2. Why it matters, and what is actually known about timing */}
          <section className="rounded-xl border border-line bg-surface p-5 shadow-card">
            <h2 className="text-[17px] font-semibold tracking-tight">Why it matters to you</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-muted">{opportunity.whyItMatters}</p>

            <div
              className={`mt-4 rounded-lg border p-3.5 ${
                opportunity.timing.decaying
                  ? "border-on-warn/30 bg-tint-warn"
                  : "border-line bg-sunken"
              }`}
            >
              <p
                className={`text-[13px] font-medium ${
                  opportunity.timing.decaying ? "text-on-warn" : "text-body"
                }`}
              >
                Timing
              </p>
              <p
                className={`mt-1 text-[13px] leading-relaxed ${
                  opportunity.timing.decaying ? "text-on-warn" : "text-muted"
                }`}
              >
                {opportunity.timing.note}
              </p>
            </div>
          </section>

          {/* Research and the draft written from it, on demand. */}
          <AiDraftPanel
            opportunity={opportunity}
            employeeName={employee.name}
            destination={
              prospect.contact.email
                ? `To ${prospect.contact.name} at ${prospect.contact.email}`
                : `To ${prospect.contact.name} on ${prospect.contact.linkedin ?? "LinkedIn"}`
            }
            hasProofPoints={Boolean(workspace.documents?.length)}
          />
        </div>

        <div className="space-y-6 lg:col-start-2 lg:row-start-2">
          {/* How strong, and why */}
          <section className="rounded-xl border border-line bg-surface shadow-card">
            <div className="border-b border-line px-5 py-4">
              <h2 className="text-[15px] font-semibold tracking-tight">Why it scored {opportunity.score}</h2>
              <p className="mt-1 text-[13px] text-muted">
                Scored against{" "}
                <Link href={`/missions/${mission.id}`} className="rounded text-link hover:underline">
                  {mission.name}
                </Link>
                .
              </p>
            </div>
            <div className="p-5">
              <ScoreBreakdown factors={opportunity.factors} score={opportunity.score} />
            </div>
          </section>

          <ContactCard prospect={prospect} />
        </div>
      </div>
    </div>
  );
}
