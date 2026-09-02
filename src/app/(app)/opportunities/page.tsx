import type { Metadata } from "next";
import Link from "next/link";
import { Radar } from "lucide-react";
import { requireWorkspace } from "@/lib/piasowo/session-data";
import { OpportunityCard } from "@/components/piasowo/OpportunityCard";
import { EmptyState } from "@/components/piasowo/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import type { OpportunityStatus } from "@/lib/piasowo/types";

export const metadata: Metadata = { title: "Opportunities" };

type Filter = {
  key: string;
  label: string;
  /** null means "no status filter". */
  statuses: OpportunityStatus[] | null;
};

const FILTERS: Filter[] = [
  { key: "waiting", label: "Waiting on you", statuses: ["awaiting-approval"] },
  { key: "researching", label: "In research", statuses: ["researching"] },
  { key: "all", label: "All", statuses: null },
];

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter = "waiting" } = await searchParams;
  const { data } = await requireWorkspace();
  const employee = data.employees[0];
  const mission = data.missions[0];

  const active = FILTERS.find((f) => f.key === filter) ?? FILTERS[0];
  const visible = data.opportunities
    .filter((o) => !active.statuses || active.statuses.includes(o.status))
    .sort((a, b) => b.score - a.score);

  return (
    <div>
      <header className="mb-5">
        <h1 className="text-[22px] font-semibold tracking-tight sm:text-2xl">Opportunities</h1>
        <p className="mt-1.5 text-[15px] text-muted">
          Ranked by how well each one fits {mission.name}. The strongest is always first.
        </p>
      </header>

      {/* A short row of filters, not a filter panel. Anything more would be
          configuration the user has to think about before reading anything. */}
      <nav aria-label="Filter opportunities" className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((option) => {
          const count = data.opportunities.filter(
            (o) => !option.statuses || option.statuses.includes(o.status),
          ).length;
          const isActive = option.key === active.key;
          return (
            <Link
              key={option.key}
              href={`/opportunities?filter=${option.key}`}
              aria-current={isActive ? "page" : undefined}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                isActive
                  ? "border-brand-600 bg-tint-brand text-on-brand"
                  : "border-line-strong bg-surface text-muted hover:bg-hover hover:text-body"
              }`}
            >
              {option.label}
              <span className="tabular-nums opacity-70">{count}</span>
            </Link>
          );
        })}
      </nav>

      {visible.length > 0 ? (
        <div className="space-y-3">
          {visible.map((opportunity, index) => (
            <OpportunityCard
              key={opportunity.id}
              opportunity={opportunity}
              // Only the top of the "waiting" list is emphasised — emphasising
              // everything would emphasise nothing.
              emphasis={index === 0 && active.key === "waiting"}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-line bg-surface shadow-card">
          <EmptyState
            icon={<Radar className="size-5" aria-hidden="true" />}
            what={
              active.key === "waiting"
                ? "Nothing is waiting on your decision"
                : "No opportunities in this view"
            }
            why={
              active.key === "waiting"
                ? `${employee.name} has cleared the queue. New findings land here automatically as ${mission.name} keeps running — there's nothing to check.`
                : `${employee.name} is researching ${mission.progress.researched} companies on ${mission.name}. Anything that clears the mission's criteria shows up here.`
            }
            action={
              <ButtonLink href="/opportunities?filter=all" variant="secondary">
                See all opportunities
              </ButtonLink>
            }
            secondary={
              <>
                Not seeing the right companies?{" "}
                <Link href={`/missions/${mission.id}`} className="rounded font-medium text-link hover:underline">
                  Widen the mission&apos;s targeting
                </Link>
                .
              </>
            }
          />
        </div>
      )}
    </div>
  );
}
