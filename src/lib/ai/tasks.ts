import type { Workspace } from "@/lib/auth/store";
import type { Opportunity } from "@/lib/piasowo/types";
import { AiUnavailable, activeModel, aiConfigured, complete, parseJson } from "./openrouter";

/**
 * The two things the AI actually does for a user: study a company, then write
 * to it. Both fall back to deterministic text when no key is configured, and
 * every result says which one you got — a template dressed up as AI output
 * would quietly destroy trust in the scoring.
 */

export type Analysis = {
  situation: string;
  pressure: string;
  angle: string;
};

export type Draft = {
  channel: "email" | "linkedin";
  subject: string;
  body: string;
  grounding: string[];
};

export type AiResult<T> = { value: T; usedAI: boolean; model?: string; note?: string };

/**
 * Written to counter the default failure mode of an LLM asked to assess a
 * sales lead: agreeable, evidence-free enthusiasm. It is told what it may not
 * assume, and that "not enough to go on" is an acceptable answer.
 */
const ANALYSIS_SYSTEM = `You analyse a business that has shown a buying signal, for a salesperson deciding whether to make contact.

Rules:
- Use only the facts given. Never invent headcount, revenue, tooling, timelines or names.
- Be sceptical. If the signal is weak or ambiguous, say so plainly.
- No flattery, no filler, no "in today's fast-paced world".
- British English. Plain words.

Reply with JSON only:
{"situation": "what is most likely happening inside this company right now, 1-2 sentences",
 "pressure": "the operational problem this creates for them, 1-2 sentences",
 "angle": "the single most specific opening this suggests, 1 sentence"}`;

const DRAFT_SYSTEM = `You write a first outreach message for a salesperson.

Rules:
- Open on what changed at THEIR company. Never open with who you are or "I hope this finds you well".
- Under 90 words. Short sentences. No adjective stacking.
- Never invent facts, shared connections, or prior contact.
- Use at most ONE proof point from the sender's material, only if it genuinely fits. Never list credentials.
- End with one low-friction question. Do not ask for a 30-minute call.
- British English.

Reply with JSON only:
{"subject": "email subject, under 8 words; empty string for LinkedIn",
 "body": "the message",
 "grounding": ["each fact you used, and where it came from"]}`;

function context(workspace: Workspace, opportunity: Opportunity): string {
  const proofPoints = (workspace.documents ?? [])
    .flatMap((d) => d.text.split("\n"))
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 6);

  return [
    `SENDER: ${workspace.companyName}, ${workspace.industry}.`,
    `SELLS: ${workspace.offering}`,
    proofPoints.length
      ? `SENDER PROOF POINTS:\n${proofPoints.map((p) => `- ${p}`).join("\n")}`
      : "SENDER PROOF POINTS: none provided.",
    "",
    `TARGET: ${opportunity.prospect.company} — ${opportunity.prospect.industry}, ${opportunity.prospect.employees} staff, ${opportunity.prospect.location}.`,
    `CONTACT: ${opportunity.prospect.contact.name}, ${opportunity.prospect.contact.title}.`,
    `SIGNAL: ${opportunity.signal.headline}`,
    `SIGNAL DETAIL: ${opportunity.signal.detail}`,
    `SOURCE: ${opportunity.signal.source}, observed ${opportunity.signal.observedAt.slice(0, 10)}.`,
    `TIMING EVIDENCE: ${opportunity.timing.note}`,
  ].join("\n");
}

export async function analyseOpportunity(
  workspace: Workspace,
  opportunity: Opportunity,
): Promise<AiResult<Analysis>> {
  const fallback: Analysis = {
    situation: opportunity.whyItMatters,
    pressure: opportunity.timing.note,
    angle: opportunity.recommendation.reason,
  };

  if (!aiConfigured()) {
    return {
      value: fallback,
      usedAI: false,
      note: "Set OPENROUTER_API_KEY to have this written fresh for each company.",
    };
  }

  try {
    const text = await complete({
      system: ANALYSIS_SYSTEM,
      user: context(workspace, opportunity),
      maxTokens: 700,
    });
    const parsed = parseJson<Partial<Analysis>>(text);
    if (!parsed.situation || !parsed.pressure || !parsed.angle) {
      throw new AiUnavailable("Reply was missing a field.");
    }
    return { value: parsed as Analysis, usedAI: true, model: activeModel() };
  } catch (cause) {
    console.error("[piasowo] analysis fell back:", cause);
    return {
      value: fallback,
      usedAI: false,
      note: cause instanceof Error ? cause.message : "The model call failed.",
    };
  }
}

export async function draftOutreach(
  workspace: Workspace,
  opportunity: Opportunity,
  analysis: Analysis,
): Promise<AiResult<Draft>> {
  // Channel follows what the contact actually has, not a preference.
  const channel: Draft["channel"] = opportunity.prospect.contact.email ? "email" : "linkedin";

  const fallback: Draft = opportunity.draft ?? {
    channel,
    subject: `${opportunity.signal.headline.split(" ").slice(0, 5).join(" ")} — quick question`,
    body: `Hi ${opportunity.prospect.contact.name.split(" ")[0]},\n\nI saw that ${opportunity.prospect.company} ${opportunity.signal.headline.charAt(0).toLowerCase() + opportunity.signal.headline.slice(1)}.\n\n${opportunity.whyItMatters}\n\nWorth a short conversation?`,
    grounding: [`${opportunity.signal.source}, ${opportunity.signal.observedAt.slice(0, 10)}`],
  };

  if (!aiConfigured()) {
    return {
      value: fallback,
      usedAI: false,
      note: "Set OPENROUTER_API_KEY to have this written for this company specifically.",
    };
  }

  try {
    const text = await complete({
      system: DRAFT_SYSTEM,
      user: [
        context(workspace, opportunity),
        "",
        `CHANNEL: ${channel}`,
        `TONE: ${workspace.aiEmployee.tone}`,
        "",
        "ANALYSIS TO BUILD ON:",
        `- Situation: ${analysis.situation}`,
        `- Pressure: ${analysis.pressure}`,
        `- Angle: ${analysis.angle}`,
      ].join("\n"),
      maxTokens: 900,
    });
    const parsed = parseJson<Partial<Draft>>(text);
    if (!parsed.body) throw new AiUnavailable("Reply had no message body.");
    return {
      value: {
        channel,
        subject: channel === "email" ? (parsed.subject ?? "") : "",
        body: parsed.body,
        grounding: Array.isArray(parsed.grounding) ? parsed.grounding : fallback.grounding,
      },
      usedAI: true,
      model: activeModel(),
    };
  } catch (cause) {
    console.error("[piasowo] draft fell back:", cause);
    return {
      value: fallback,
      usedAI: false,
      note: cause instanceof Error ? cause.message : "The model call failed.",
    };
  }
}
