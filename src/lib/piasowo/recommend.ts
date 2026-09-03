import type { Mission, SignalKind } from "./types";
import type { Workspace } from "@/lib/auth/store";

/**
 * Every default Piasowo pre-fills comes from here.
 *
 * The rule this file follows: a default must be derivable from something the
 * user already told us, and must be visibly editable. Nothing is decided for
 * the user that they cannot see and change on the same screen.
 */

export const INDUSTRIES = [
  "SaaS & software",
  "Professional services",
  "Marketing & creative",
  "Manufacturing",
  "Logistics & supply chain",
  "Construction & trades",
  "Healthcare",
  "Financial services",
  "Retail & e-commerce",
  "Education",
  "Real estate",
  "Hospitality",
] as const;

export const COMPANY_SIZES = ["1–10", "11–50", "51–200", "201–1,000", "1,000+"] as const;

export const REGIONS = [
  "United Kingdom",
  "Ireland",
  "Western Europe",
  "Nordics",
  "United States",
  "Canada",
  "Australia & NZ",
  "West Africa",
  "Middle East",
] as const;

export const SIGNAL_LABELS: Record<SignalKind, { label: string; blurb: string }> = {
  hiring: { label: "Hiring activity", blurb: "New roles that imply budget and a new problem to solve" },
  funding: { label: "Funding rounds", blurb: "Fresh capital, usually followed by buying" },
  expansion: { label: "Expansion", blurb: "New office, market or product line" },
  "tech-change": { label: "Tech changes", blurb: "A tool added or dropped from their stack" },
  leadership: { label: "Leadership changes", blurb: "A new decision-maker reviewing suppliers" },
  news: { label: "Company news", blurb: "Awards, contracts, press coverage" },
};

/** Free-mail domains, which tell us nothing about the company. */
const GENERIC_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "outlook.com", "hotmail.com", "live.com",
  "yahoo.com", "icloud.com", "me.com", "proton.me", "protonmail.com", "aol.com",
]);

/**
 * Guesses the company name and website from a work email, so the first
 * onboarding screen arrives partly filled instead of blank.
 */
export function companyFromEmail(email: string): { name: string; website: string } | null {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain || GENERIC_DOMAINS.has(domain)) return null;

  const root = domain.replace(/^www\./, "").split(".")[0];
  const name = root
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
  return { name, website: `https://${domain}` };
}

type Suggestion = {
  industries: string[];
  sizes: string[];
  regions: string[];
  signals: SignalKind[];
};

/**
 * Who a business in a given industry usually sells to. Deliberately narrow —
 * a suggestion the user has to trim is more useful than one they have to build.
 */
const BY_INDUSTRY: Record<string, Suggestion> = {
  "SaaS & software": {
    industries: ["SaaS & software", "Financial services", "Retail & e-commerce"],
    sizes: ["11–50", "51–200"],
    regions: ["United Kingdom", "Western Europe"],
    signals: ["funding", "hiring", "tech-change"],
  },
  "Professional services": {
    industries: ["SaaS & software", "Financial services", "Manufacturing"],
    sizes: ["51–200", "201–1,000"],
    regions: ["United Kingdom", "Ireland"],
    signals: ["expansion", "leadership", "funding"],
  },
  "Marketing & creative": {
    industries: ["Retail & e-commerce", "SaaS & software", "Hospitality"],
    sizes: ["11–50", "51–200"],
    regions: ["United Kingdom", "Western Europe"],
    signals: ["funding", "hiring", "news"],
  },
  Manufacturing: {
    industries: ["Manufacturing", "Construction & trades", "Logistics & supply chain"],
    sizes: ["51–200", "201–1,000"],
    regions: ["United Kingdom", "Western Europe"],
    signals: ["expansion", "news", "hiring"],
  },
  "Logistics & supply chain": {
    industries: ["Retail & e-commerce", "Manufacturing", "Hospitality"],
    sizes: ["51–200", "201–1,000"],
    regions: ["United Kingdom", "Western Europe"],
    signals: ["expansion", "funding", "hiring"],
  },
  "Construction & trades": {
    industries: ["Real estate", "Construction & trades", "Hospitality"],
    sizes: ["11–50", "51–200"],
    regions: ["United Kingdom"],
    signals: ["expansion", "news", "hiring"],
  },
  Healthcare: {
    industries: ["Healthcare", "Education", "Professional services"],
    sizes: ["51–200", "201–1,000"],
    regions: ["United Kingdom"],
    signals: ["hiring", "leadership", "expansion"],
  },
  "Financial services": {
    industries: ["SaaS & software", "Professional services", "Real estate"],
    sizes: ["51–200", "201–1,000"],
    regions: ["United Kingdom", "Western Europe"],
    signals: ["funding", "leadership", "hiring"],
  },
  "Retail & e-commerce": {
    industries: ["Retail & e-commerce", "Hospitality", "Logistics & supply chain"],
    sizes: ["11–50", "51–200"],
    regions: ["United Kingdom", "Western Europe"],
    signals: ["funding", "expansion", "tech-change"],
  },
  Education: {
    industries: ["Education", "Professional services", "SaaS & software"],
    sizes: ["51–200", "201–1,000"],
    regions: ["United Kingdom"],
    signals: ["hiring", "leadership", "news"],
  },
  "Real estate": {
    industries: ["Real estate", "Construction & trades", "Financial services"],
    sizes: ["11–50", "51–200"],
    regions: ["United Kingdom"],
    signals: ["expansion", "funding", "leadership"],
  },
  Hospitality: {
    industries: ["Hospitality", "Retail & e-commerce", "Real estate"],
    sizes: ["11–50", "51–200"],
    regions: ["United Kingdom"],
    signals: ["expansion", "news", "hiring"],
  },
};

const FALLBACK: Suggestion = {
  industries: ["SaaS & software", "Professional services", "Retail & e-commerce"],
  sizes: ["11–50", "51–200"],
  regions: ["United Kingdom"],
  signals: ["hiring", "funding", "expansion"],
};

export function suggestTargeting(industry: string): Suggestion {
  return BY_INDUSTRY[industry] ?? FALLBACK;
}

/** Names offered for the first AI employee. The user can type their own. */
export const EMPLOYEE_NAMES = ["Ada", "Nova", "Kene", "Juno", "Rio", "Sable"] as const;

export const EMPLOYEE_ROLES = [
  {
    id: "prospector",
    title: "Prospector",
    summary: "Finds and qualifies companies that match your market, all day.",
    bestFor: "Filling a thin pipeline",
  },
  {
    id: "signal-watcher",
    title: "Signal Watcher",
    summary: "Monitors accounts you care about and flags the moment something changes.",
    bestFor: "Selling into a known list",
  },
  {
    id: "researcher",
    title: "Researcher",
    summary: "Goes deep on each company and writes the brief before you make contact.",
    bestFor: "High-value, considered deals",
  },
] as const;

export const TONES = [
  { id: "direct", label: "Direct", sample: "Two lines, one ask, no preamble." },
  { id: "consultative", label: "Consultative", sample: "Leads with what changed at their company." },
  { id: "warm", label: "Warm", sample: "Conversational, low-pressure, human." },
] as const;

/**
 * The mission Piasowo proposes first. It is a complete, runnable mission — the
 * user's job is to review it, not to assemble it.
 */
export function suggestFirstMission(
  workspace: Workspace,
): Omit<Mission, "id" | "createdAt" | "progress" | "employeeId"> {
  const targeting = suggestTargeting(workspace.industry);
  const markets = workspace.targetMarkets.length ? workspace.targetMarkets : targeting.industries;
  const sizes = workspace.companySizes.length ? workspace.companySizes : targeting.sizes;

  return {
    name: `${markets[0]} — first 50`,
    objective: `Find ${markets[0].toLowerCase()} companies showing buying signals and open a conversation about ${workspace.offering.toLowerCase()}.`,
    status: "draft",
    targeting: {
      industries: markets,
      sizes,
      regions: targeting.regions,
      signals: targeting.signals,
    },
    outreach: {
      channel: "email",
      tone: workspace.aiEmployee.tone,
      // Approval on every message by default: trust is earned, not assumed.
      approval: "every-message",
      dailyCap: 15,
    },
  };
}
