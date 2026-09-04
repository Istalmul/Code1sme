import type { Workspace } from "@/lib/auth/store";

/**
 * Apollo.io lead sourcing.
 *
 * Search and enrichment are deliberately separate calls because Apollo prices
 * them differently: searching is cheap and withholds contact details, while
 * revealing an email or phone spends a credit. Auto-enriching every search
 * result would burn credits on companies the user goes on to reject.
 */

/** Overridable so the request shape can be tested against a local stub. */
const BASE_URL = process.env.APOLLO_BASE_URL ?? "https://api.apollo.io/api/v1";
const SEARCH_ENDPOINT = `${BASE_URL}/mixed_people/search`;
const ENRICH_ENDPOINT = `${BASE_URL}/people/match`;

export class SourcingUnavailable extends Error {}

export function apolloConfigured(): boolean {
  return Boolean(process.env.APOLLO_API_KEY);
}

export type SourcedProspect = {
  id: string;
  /** Apollo's person id, needed to enrich this person later. */
  externalId?: string;
  name: string;
  title: string;
  company: string;
  domain?: string;
  location?: string;
  employees?: string;
  linkedin?: string;
  email?: string;
  phone?: string;
  enriched: boolean;
  foundAt: string;
};

/** Maps our size buckets onto the ranges Apollo's API expects. */
const SIZE_RANGES: Record<string, string> = {
  "1–10": "1,10",
  "11–50": "11,50",
  "51–200": "51,200",
  "201–1,000": "201,1000",
  "1,000+": "1001,100000",
};

/** Titles worth reaching, derived from what the business sells to. */
const DECISION_MAKER_TITLES = [
  "founder",
  "owner",
  "chief executive officer",
  "chief operating officer",
  "managing director",
  "operations director",
  "head of operations",
  "head of procurement",
  "director",
];

async function call(url: string, body: unknown): Promise<Record<string, unknown>> {
  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) throw new SourcingUnavailable("APOLLO_API_KEY is not set.");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    if (response.status === 401 || response.status === 403) {
      throw new SourcingUnavailable(
        "Apollo rejected the key. Check it is valid and that your plan includes API access.",
      );
    }
    throw new SourcingUnavailable(`Apollo returned ${response.status}: ${detail.slice(0, 200)}`);
  }
  return (await response.json()) as Record<string, unknown>;
}

type ApolloPerson = {
  id?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  linkedin_url?: string;
  email?: string;
  phone_numbers?: { sanitized_number?: string }[];
  city?: string;
  country?: string;
  organization?: { name?: string; primary_domain?: string; estimated_num_employees?: number };
};

function toProspect(person: ApolloPerson): SourcedProspect {
  const email = person.email;
  return {
    id: crypto.randomUUID(),
    externalId: person.id,
    name: person.name ?? [person.first_name, person.last_name].filter(Boolean).join(" ") ?? "Unknown",
    title: person.title ?? "Unknown role",
    company: person.organization?.name ?? "Unknown company",
    domain: person.organization?.primary_domain,
    location: [person.city, person.country].filter(Boolean).join(", ") || undefined,
    employees: person.organization?.estimated_num_employees
      ? String(person.organization.estimated_num_employees)
      : undefined,
    linkedin: person.linkedin_url,
    // Apollo returns a locked placeholder until a credit is spent.
    email: email && !email.includes("email_not_unlocked") ? email : undefined,
    phone: person.phone_numbers?.[0]?.sanitized_number,
    enriched: false,
    foundAt: new Date().toISOString(),
  };
}

/** Turns the workspace's own ICP into an Apollo search. */
export async function findProspects(
  workspace: Workspace,
  perPage = 10,
): Promise<SourcedProspect[]> {
  const ranges = workspace.companySizes.map((s) => SIZE_RANGES[s]).filter(Boolean);

  const payload: Record<string, unknown> = {
    page: 1,
    per_page: Math.min(25, perPage),
    person_titles: DECISION_MAKER_TITLES,
    q_organization_keyword_tags: workspace.targetMarkets,
    ...(ranges.length ? { organization_num_employees_ranges: ranges } : {}),
  };

  const result = await call(SEARCH_ENDPOINT, payload);
  const people = (result.people ?? result.contacts ?? []) as ApolloPerson[];
  if (!Array.isArray(people)) return [];
  return people.map(toProspect);
}

/** Spends a credit to reveal one person's contact details. */
export async function enrichProspect(prospect: SourcedProspect): Promise<SourcedProspect> {
  const result = await call(ENRICH_ENDPOINT, {
    id: prospect.externalId,
    reveal_personal_emails: false,
    reveal_phone_number: false,
  });
  const person = result.person as ApolloPerson | undefined;
  if (!person) throw new SourcingUnavailable("Apollo had no record for that person.");

  const enriched = toProspect(person);
  return {
    ...prospect,
    email: enriched.email ?? prospect.email,
    phone: enriched.phone ?? prospect.phone,
    linkedin: enriched.linkedin ?? prospect.linkedin,
    enriched: true,
  };
}
