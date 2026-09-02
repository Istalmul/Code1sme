"use client";

import { useState } from "react";
import { Check, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Opportunity } from "@/lib/piasowo/types";

type Decision = "pending" | "approved" | "snoozed" | "dismissed";

const DONE: Record<Exclude<Decision, "pending">, { title: string; body: string }> = {
  approved: {
    title: "Queued to send",
    body: "It goes out on the mission's next send window. You can still stop it from the mission page.",
  },
  snoozed: {
    title: "Set aside for 3 weeks",
    body: "It comes back to your Command Center if anything changes at the company before then.",
  },
  dismissed: {
    title: "Dismissed",
    body: "This company won't be raised again on this mission unless a stronger signal appears.",
  },
};

/**
 * The recommended action is the only filled button here. Snooze and dismiss are
 * always visible and equally easy to reach — a decision the user can't reverse
 * cheaply isn't a decision they'll trust making.
 */
export function DecisionPanel({ opportunity }: { opportunity: Opportunity }) {
  const [decision, setDecision] = useState<Decision>("pending");

  if (decision !== "pending") {
    const state = DONE[decision];
    return (
      <div className="rounded-xl border border-on-good/30 bg-tint-good p-5">
        <p className="flex items-center gap-2 text-[14px] font-semibold text-on-good">
          <Check className="size-4" aria-hidden="true" />
          {state.title}
        </p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-on-good">{state.body}</p>
        <button
          type="button"
          onClick={() => setDecision("pending")}
          className="mt-3 rounded text-[13px] font-medium text-on-good underline hover:no-underline"
        >
          Undo
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-brand-600 bg-surface shadow-pop">
      <div className="border-b border-line px-5 py-4">
        <p className="text-[12px] font-medium uppercase tracking-wider text-on-brand">
          Recommended
        </p>
        <h2 className="mt-1 text-[15px] font-semibold tracking-tight">
          {opportunity.recommendation.label}
        </h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
          {opportunity.recommendation.reason}
        </p>
      </div>

      <div className="space-y-2 p-4">
        <Button variant="primary" size="lg" fullWidth onClick={() => setDecision("approved")}>
          {opportunity.draft
            ? `Approve and send ${opportunity.draft.channel === "email" ? "email" : "message"}`
            : "Approve"}
        </Button>

        <div className="flex gap-2">
          <Button fullWidth onClick={() => setDecision("snoozed")}>
            <Clock className="size-4" aria-hidden="true" />
            Snooze
          </Button>
          <Button fullWidth onClick={() => setDecision("dismissed")}>
            <X className="size-4" aria-hidden="true" />
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}
