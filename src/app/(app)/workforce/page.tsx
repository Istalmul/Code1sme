import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import { requireWorkspace } from "@/lib/piasowo/session-data";
import { EmployeeAvatar } from "@/components/piasowo/EmployeeStatus";
import { EmptyState } from "@/components/piasowo/EmptyState";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Workforce" };

export default async function WorkforcePage() {
  const { data } = await requireWorkspace();

  return (
    <div>
      <header className="mb-5">
        <h1 className="text-[22px] font-semibold tracking-tight sm:text-2xl">Workforce</h1>
        <p className="mt-1.5 text-[15px] text-muted">
          Your AI employees, what they&apos;re working on, and what they need from you.
        </p>
      </header>

      {data.employees.length > 0 ? (
        <ul className="space-y-3">
          {data.employees.map((employee) => {
            const mission = data.missions.find((m) => m.id === employee.missionId);
            return (
              <li key={employee.id}>
                <Link
                  href={`/workforce/${employee.id}`}
                  className="block rounded-xl border border-line bg-surface p-5 shadow-card transition-colors hover:border-line-strong"
                >
                  <div className="flex items-start gap-3.5">
                    <EmployeeAvatar name={employee.name} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <h2 className="text-[15px] font-semibold tracking-tight">{employee.name}</h2>
                        <span className="text-[13px] text-muted">{employee.role}</span>
                      </div>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                        {employee.currentTask}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[13px]">
                        {mission && <span className="text-muted">On {mission.name}</span>}
                        <span className="tabular-nums text-muted">
                          {employee.completedToday} done today
                        </span>
                        {employee.awaitingApproval > 0 && (
                          <span className="font-medium text-on-warn">
                            {employee.awaitingApproval} waiting on you
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="mt-1 size-4 shrink-0 text-subtle" aria-hidden="true" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="rounded-xl border border-line bg-surface shadow-card">
          <EmptyState
            icon={<Users className="size-5" aria-hidden="true" />}
            what="No AI employees yet"
            why="An AI employee is what actually runs a mission — without one, nothing is researched and no signals are watched."
            action={
              <ButtonLink href="/missions/new" variant="primary">
                Create a mission and hire one
              </ButtonLink>
            }
          />
        </div>
      )}
    </div>
  );
}
