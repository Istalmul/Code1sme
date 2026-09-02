import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Inbox } from "lucide-react";
import { requireWorkspace } from "@/lib/piasowo/session-data";
import { greeting } from "@/lib/piasowo/format";
import { OpportunityCard } from "@/components/piasowo/OpportunityCard";
import { EmployeeStatusPanel } from "@/components/piasowo/EmployeeStatus";
import { ActivityFeed } from "@/components/piasowo/ActivityFeed";
import { EmptyState } from "@/components/piasowo/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import { CardHeader } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Command Center" };

export default async function CommandCenterPage() {
  const { user, data } = await requireWorkspace();
  const employee = data.employees[0];
  const mission = data.missions[0];

  const waiting = data.opportunities
    .filter((o) => o.status === "awaiting-approval")
    .sort((a, b) => b.score - a.score);

  // One item is the recommended next action. Everything else on this screen is
  // deliberately quieter than it.
  const [top, ...rest] = waiting;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-[22px] font-semibold tracking-tight sm:text-2xl">
          {greeting(user.name.split(" ")[0])}
        </h1>
        <p className="mt-1.5 text-[15px] text-muted">
          {employee.name} researched {mission.progress.researched} companies on{" "}
          <Link href={`/missions/${mission.id}`} className="rounded font-medium text-body hover:underline">
            {mission.name}
          </Link>
          .{" "}
          {waiting.length > 0
            ? `${waiting.length} ${waiting.length === 1 ? "item needs" : "items need"} your decision.`
            : "Nothing needs your decision right now."}
        </p>
      </header>

      {top ? (
        <section aria-labelledby="start-here">
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <h2 id="start-here" className="text-[15px] font-semibold tracking-tight">
              Start here
            </h2>
            <p className="text-[13px] text-subtle">
              Highest-scoring item waiting on you
            </p>
          </div>
          <OpportunityCard opportunity={top} emphasis />
        </section>
      ) : (
        <section className="rounded-xl border border-line bg-surface shadow-card">
          <EmptyState
            icon={<Inbox className="size-5" aria-hidden="true" />}
            what="Nothing is waiting on you"
            why={`${employee.name} is still researching. New findings appear here as soon as they clear the mission's criteria — you don't need to check back.`}
            action={
              <ButtonLink href={`/missions/${mission.id}`} variant="secondary">
                Review mission criteria
              </ButtonLink>
            }
          />
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {rest.length > 0 && (
            <section aria-labelledby="also-waiting">
              <div className="mb-3 flex items-baseline justify-between gap-4">
                <h2 id="also-waiting" className="text-[15px] font-semibold tracking-tight">
                  Also waiting
                </h2>
                <Link
                  href="/opportunities"
                  className="inline-flex items-center gap-1 rounded text-[13px] font-medium text-link hover:underline"
                >
                  All opportunities
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              </div>
              <div className="space-y-3">
                {rest.map((opportunity) => (
                  <OpportunityCard key={opportunity.id} opportunity={opportunity} />
                ))}
              </div>
            </section>
          )}

          <section className="rounded-xl border border-line bg-surface shadow-card">
            <CardHeader
              title="Completed today"
              description={`${employee.name} finished ${employee.completedToday} tasks so far.`}
            />
            <ActivityFeed events={data.activity} />
          </section>
        </div>

        <div className="space-y-6">
          <EmployeeStatusPanel employee={employee} mission={mission} />

          <section className="rounded-xl border border-line bg-surface shadow-card">
            <CardHeader title="Mission progress" description={mission.name} />
            <dl className="grid grid-cols-2 divide-x divide-y divide-[color:var(--border)]">
              {[
                { term: "Researched", value: mission.progress.researched },
                { term: "Qualified", value: mission.progress.qualified },
                { term: "Opportunities", value: mission.progress.opportunities },
                { term: "Contacted", value: mission.progress.contacted },
              ].map((stat) => (
                <div key={stat.term} className="px-5 py-3.5">
                  <dt className="text-[12px] text-muted">{stat.term}</dt>
                  <dd className="mt-0.5 text-[20px] font-semibold tabular-nums tracking-tight">
                    {stat.value.toLocaleString()}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="border-t border-line px-5 py-3">
              <p className="text-[13px] text-muted">
                <span className="font-medium text-body">{mission.progress.replies} replies</span>{" "}
                from {mission.progress.contacted} contacted.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
