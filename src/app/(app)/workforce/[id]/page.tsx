import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CircleDot, Inbox } from "lucide-react";
import { requireWorkspace } from "@/lib/piasowo/session-data";
import { EmployeeAvatar } from "@/components/piasowo/EmployeeStatus";
import { ActivityFeed } from "@/components/piasowo/ActivityFeed";
import { OpportunityCard } from "@/components/piasowo/OpportunityCard";
import { EmptyState } from "@/components/piasowo/EmptyState";
import { CardHeader } from "@/components/ui/Card";

export const metadata: Metadata = { title: "AI employee" };

export default async function EmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data } = await requireWorkspace();
  const employee = data.employees.find((e) => e.id === id);
  if (!employee) notFound();

  const mission = data.missions.find((m) => m.id === employee.missionId)!;
  const events = data.activity.filter((a) => a.employeeId === employee.id);
  const waiting = data.opportunities
    .filter((o) => o.employeeId === employee.id && o.status === "awaiting-approval")
    .sort((a, b) => b.score - a.score);

  return (
    <div>
      <Link
        href="/workforce"
        className="inline-flex items-center gap-1.5 rounded text-[13px] text-muted hover:text-body"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Workforce
      </Link>

      <header className="mt-4 flex items-start gap-4">
        <EmployeeAvatar name={employee.name} size={48} />
        <div className="min-w-0">
          <h1 className="text-[22px] font-semibold tracking-tight sm:text-[26px]">
            {employee.name}
          </h1>
          <p className="mt-1 text-[15px] text-muted">
            {employee.role} · writes in a {employee.tone.toLowerCase()} tone · on{" "}
            <Link href={`/missions/${mission.id}`} className="rounded text-link hover:underline">
              {mission.name}
            </Link>
          </p>
        </div>
      </header>

      {/* Right now / next, stated plainly, before any history. */}
      <section className="mt-6 rounded-xl border border-line bg-surface shadow-card">
        <div className="grid gap-px bg-[color:var(--border)] sm:grid-cols-2">
          <div className="bg-surface p-5">
            <p className="flex items-center gap-1.5 text-[13px] font-medium text-body">
              <CircleDot className="size-3.5 text-on-live" aria-hidden="true" />
              Doing now
            </p>
            <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{employee.currentTask}</p>
          </div>
          <div className="bg-surface p-5">
            <p className="text-[13px] font-medium text-body">Next</p>
            <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{employee.nextTask}</p>
          </div>
        </div>
      </section>

      <div className="mt-6 space-y-6">
        <section>
          <h2 className="mb-3 text-[15px] font-semibold tracking-tight">
            Needs your approval
            {waiting.length > 0 && (
              <span className="ml-2 font-normal text-muted">{waiting.length}</span>
            )}
          </h2>
          {waiting.length > 0 ? (
            <div className="space-y-3">
              {waiting.map((opportunity, index) => (
                <OpportunityCard
                  key={opportunity.id}
                  opportunity={opportunity}
                  emphasis={index === 0}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-line bg-surface shadow-card">
              <EmptyState
                icon={<Inbox className="size-5" aria-hidden="true" />}
                what={`${employee.name} isn't waiting on anything`}
                why={`Everything found so far has been decided. ${employee.name} keeps researching in the background and will raise the next finding here.`}
              />
            </div>
          )}
        </section>

        <section className="rounded-xl border border-line bg-surface shadow-card">
          <CardHeader
            title="Today's work"
            description={`${employee.completedToday} tasks completed, including the ones that led nowhere.`}
          />
          <ActivityFeed events={events} />
        </section>
      </div>
    </div>
  );
}
