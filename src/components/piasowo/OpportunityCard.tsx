import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import type { Opportunity } from "@/lib/piasowo/types";
import { ScoreBadge } from "./ScoreBadge";
import { SignalBadge } from "./SignalBadge";
import { relativeTime } from "@/lib/piasowo/format";

/**
 * The card answers, in reading order: what happened, how strong it is, why it
 * matters here, and the one thing to do about it. Everything else — the full
 * score breakdown, the draft, the sources — lives on the detail page.
 */
export function OpportunityCard({
  opportunity,
  emphasis = false,
}: {
  opportunity: Opportunity;
  emphasis?: boolean;
}) {
  const { prospect, signal, recommendation, timing } = opportunity;

  return (
    <article
      className={`rounded-xl border bg-surface shadow-card transition-colors ${
        emphasis ? "border-brand-600 shadow-pop" : "border-line hover:border-line-strong"
      }`}
    >
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold tracking-tight">
              {/* What happened, not the company name alone — the event is the news. */}
              {prospect.company} {signal.headline.charAt(0).toLowerCase() + signal.headline.slice(1)}
            </h3>
            <p className="mt-1 text-[13px] text-subtle">
              {prospect.industry} · {prospect.employees} staff · {prospect.location}
            </p>
          </div>
          <ScoreBadge score={opportunity.score} />
        </div>

        <p className="mt-3 text-[14px] leading-relaxed text-muted">{opportunity.whyItMatters}</p>

        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          <SignalBadge kind={signal.kind} />
          <span className="text-[12px] text-subtle">Found {relativeTime(opportunity.foundAt)}</span>
        </div>

        {/* Timing is stated only where there is evidence for it. When nothing
            is closing, the card says that too, so waiting stays a real option. */}
        <p
          className={`mt-3 flex items-start gap-1.5 text-[13px] leading-relaxed ${
            timing.decaying ? "text-on-warn" : "text-subtle"
          }`}
        >
          <Clock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {timing.note}
        </p>
      </div>

      <div className="flex flex-col gap-3 border-t border-line bg-sunken px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-5">
        <p className="min-w-0 text-[13px] leading-relaxed text-muted sm:flex-1">
          <span className="font-medium text-body">Recommended: </span>
          {recommendation.reason}
        </p>
        <Link
          href={`/opportunities/${opportunity.id}`}
          className={`inline-flex h-10 w-full shrink-0 items-center justify-center gap-1.5 rounded-lg px-3.5 text-[13px] font-medium transition-colors sm:h-9 sm:w-auto ${
            emphasis
              ? "bg-brand-600 text-white hover:bg-brand-700"
              : "border border-line-strong bg-surface text-body hover:bg-hover"
          }`}
        >
          {recommendation.label}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
