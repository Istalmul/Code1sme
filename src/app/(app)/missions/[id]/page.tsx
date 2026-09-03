import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Radar } from "lucide-react";
import { requireWorkspace } from "@/lib/piasowo/session-data";
import { SIGNAL_LABELS } from "@/lib/piasowo/recommend";
import { OpportunityCard } from "@/components/piasowo/OpportunityCard";
import { EmployeeStatusPanel } from "@/components/piasowo/EmployeeStatus";
import { ActivityFeed } from "@/components/piasowo/ActivityFeed";
import { EmptyState } from "@/components/piasowo/EmptyState";
import { CardHeader } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Mission" };

export default async function MissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data } = await requireWorkspace();
  const mission = data.missions.find((m) => m.id === id);
  if (!mission) notFound();

  const employee = data.employees.find((e) => e.id === mission.employeeId) ?? data.employees[0];
  if (!employee) notFound();
  const found = data.opportunities
    .filter((o) => o.missionId === mission.id)
    .sort((a, b) => b.score - a.score);
  const events = data.activity.filter((a) => a.missionId === mission.id);

  // A funnel reads better than four unrelated numbers: each step is a share of
  // the one before it, so a drop-off is visible without arithmetic.
  const funnel = [
    { label: "Researched", value: mission.progress.researched },
    { label: "Qualified", value: mission.progress.qualified },
    { label: "Opportunities", value: mission.progress.opportunities },
    { label: "Contacted", value: mission.progress.contacted },
    { label: "Replies", value: mission.progress.replies },
  ];
  const peak = funnel[0].value || 1;

  return (
    <div>
      <Link
        href="/missions"
        className="inline-flex items-center gap-1.5 rounded text-[13px] text-muted hover:text-body"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Missions
      </Link>

      <header className="mt-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-[22px] font-semibold tracking-tight sm:text-[26px]">
              {mission.name}
            </h1>
            <p className="mt-1.5 max-w-2xl text-[15px] leading-relaxed text-muted">
              {mission.objective}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-tint-good px-2.5 py-1 text-[12px] font-medium text-on-good ring-1 ring-on-good/30">
            Running
          </span>
        </div>
      </header>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="rounded-xl border border-line bg-surface shadow-card">
            <CardHeader
              title="Progress"
              description="Each step is what survived the one above it."
            />
            <ul className="space-y-3.5 p-5">
              {funnel.map((step) => (
                <li key={step.label}>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-[13px] text-body">{step.label}</span>
                    <span className="text-[13px] font-medium tabular-nums">
                      {step.value.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-sunken">
                    <span
                      style={{ width: `${Math.max(1.5, (step.value / peak) * 100)}%` }}
                      className="block h-full rounded-full bg-brand-600"
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-[15px] font-semibold tracking-tight">
              Found on this mission
            </h2>
            {found.length > 0 ? (
              <div className="space-y-3">
                {found.map((opportunity) => (
                  <OpportunityCard key={opportunity.id} opportunity={opportunity} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-line bg-surface shadow-card">
                <EmptyState
                  icon={<Radar className="size-5" aria-hidden="true" />}
                  what="Nothing found yet on this mission"
                  why={`${employee.name} has looked at ${mission.progress.researched} companies but none have shown one of the signals this mission watches for. That usually means the signal list is too narrow rather than the market being wrong.`}
                  action={
                    <ButtonLink href={`/missions/${mission.id}`} variant="secondary">
                      Add more signals to watch
                    </ButtonLink>
                  }
                />
              </div>
            )}
          </section>

          <section className="rounded-xl border border-line bg-surface shadow-card">
            <CardHeader title="Activity" description={`Everything ${employee.name} did here.`} />
            <ActivityFeed events={events} />
          </section>
        </div>

        <div className="space-y-6 lg:sticky lg:top-8 lg:self-start">
          <EmployeeStatusPanel employee={employee} mission={mission} />

          <section className="rounded-xl border border-line bg-surface shadow-card">
            <CardHeader title="Targeting" />
            <dl className="divide-y divide-[color:var(--border)] text-[13px]">
              {[
                { term: "Markets", detail: mission.targeting.industries.join(", ") },
                { term: "Size", detail: `${mission.targeting.sizes.join(", ")} employees` },
                { term: "Regions", detail: mission.targeting.regions.join(", ") },
                {
                  term: "Signals",
                  detail: mission.targeting.signals.map((s) => SIGNAL_LABELS[s].label).join(", "),
                },
                {
                  term: "Approval",
                  detail:
                    mission.outreach.approval === "every-message"
                      ? "You approve every message"
                      : mission.outreach.approval === "first-five"
                        ? "You approve the first five"
                        : "Sends automatically",
                },
                { term: "Daily cap", detail: `${mission.outreach.dailyCap} messages` },
              ].map((row) => (
                <div key={row.term} className="px-5 py-3">
                  <dt className="text-muted">{row.term}</dt>
                  <dd className="mt-0.5 text-body">{row.detail}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
