import type { Metadata } from "next";
import Link from "next/link";
import { Target } from "lucide-react";
import { requireWorkspace } from "@/lib/piasowo/session-data";
import { EmptyState } from "@/components/piasowo/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import { EmployeeAvatar } from "@/components/piasowo/EmployeeStatus";
import type { MissionStatus } from "@/lib/piasowo/types";

export const metadata: Metadata = { title: "Missions" };

const STATUS: Record<MissionStatus, { label: string; classes: string }> = {
  running: { label: "Running", classes: "bg-tint-good text-on-good ring-on-good/30" },
  paused: { label: "Paused", classes: "bg-sunken text-muted ring-line-strong" },
  draft: { label: "Draft", classes: "bg-tint-warn text-on-warn ring-on-warn/30" },
  completed: { label: "Completed", classes: "bg-sunken text-muted ring-line-strong" },
};

export default async function MissionsPage() {
  const { data } = await requireWorkspace();

  return (
    <div>
      <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight sm:text-2xl">Missions</h1>
          <p className="mt-1.5 text-[15px] text-muted">
            Each mission is a standing instruction: who to look for, and what makes them worth
            contacting.
          </p>
        </div>
        <ButtonLink href="/missions/new" variant="primary">
          New mission
        </ButtonLink>
      </header>

      {data.missions.length > 0 ? (
        <ul className="space-y-3">
          {data.missions.map((mission) => {
            const employee = data.employees.find((e) => e.id === mission.employeeId);
            const status = STATUS[mission.status];
            const pending = data.opportunities.filter(
              (o) => o.missionId === mission.id && o.status === "awaiting-approval",
            ).length;

            return (
              <li key={mission.id}>
                <Link
                  href={`/missions/${mission.id}`}
                  className="block rounded-xl border border-line bg-surface p-5 shadow-card transition-colors hover:border-line-strong"
                >
                  <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                    <div className="min-w-0">
                      <h2 className="text-[15px] font-semibold tracking-tight">{mission.name}</h2>
                      <p className="mt-1 text-[13px] leading-relaxed text-muted">
                        {mission.objective}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[12px] font-medium ring-1 ${status.classes}`}
                    >
                      {status.label}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-muted">
                    {employee && (
                      <span className="inline-flex items-center gap-2">
                        <EmployeeAvatar name={employee.name} size={22} />
                        {employee.name}
                      </span>
                    )}
                    <span className="tabular-nums">
                      {mission.progress.researched.toLocaleString()} researched
                    </span>
                    <span className="tabular-nums">
                      {mission.progress.opportunities} opportunities
                    </span>
                    {pending > 0 && (
                      <span className="font-medium text-on-warn">
                        {pending} waiting on you
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="rounded-xl border border-line bg-surface shadow-card">
          <EmptyState
            icon={<Target className="size-5" aria-hidden="true" />}
            what="No missions running"
            why="Without a mission your AI employees have nothing to work on, so no signals are being watched and nothing new will appear in your Command Center."
            action={
              <ButtonLink href="/missions/new" variant="primary">
                Start from a pre-filled mission
              </ButtonLink>
            }
            secondary="We'll fill it in from your workspace — you review it rather than build it."
          />
        </div>
      )}
    </div>
  );
}
