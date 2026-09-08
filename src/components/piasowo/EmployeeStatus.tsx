import Link from "next/link";
import { ArrowRight, CircleDot, Pause } from "lucide-react";
import type { Employee, Mission } from "@/lib/piasowo/types";

const STATUS: Record<Employee["status"], { label: string; dot: string; text: string }> = {
  working: { label: "Working", dot: "bg-good-600", text: "text-on-good" },
  "waiting-on-you": { label: "Waiting on you", dot: "bg-warn-600", text: "text-on-warn" },
  idle: { label: "Idle", dot: "bg-ink-400", text: "text-muted" },
  paused: { label: "Paused", dot: "bg-ink-400", text: "text-muted" },
};

export function EmployeeAvatar({ name, size = 36 }: { name: string; size?: number }) {
  return (
    <span
      style={{ width: size, height: size }}
      className="grid shrink-0 place-items-center rounded-lg bg-tint-live text-[13px] font-semibold text-on-live"
      aria-hidden="true"
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

/**
 * What the AI employee is doing, on which mission, and what comes next — the
 * three things that stop it reading as a chatbot with a spinner.
 */
export function EmployeeStatusPanel({
  employee,
  mission,
}: {
  employee: Employee;
  mission: Mission;
}) {
  const status = STATUS[employee.status];

  return (
    <section className="rounded-xl border border-line bg-surface shadow-card">
      <div className="flex items-start gap-3 border-b border-line px-5 py-4">
        <EmployeeAvatar name={employee.name} />
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-semibold tracking-tight">{employee.name}</h2>
          <p className="text-[13px] text-muted">{employee.role}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${status.text}`}>
          <span className={`size-2 rounded-full ${status.dot}`} aria-hidden="true" />
          {status.label}
        </span>
      </div>

      <dl className="divide-y divide-[color:var(--border)] text-[13px]">
        <div className="px-5 py-3">
          <dt className="mb-1 flex items-center gap-1.5 font-medium text-body">
            <CircleDot className="size-3.5 text-on-live" aria-hidden="true" />
            Doing now
          </dt>
          <dd className="leading-relaxed text-muted">{employee.currentTask}</dd>
        </div>
        <div className="px-5 py-3">
          <dt className="mb-1 flex items-center gap-1.5 font-medium text-body">
            <ArrowRight className="size-3.5 text-subtle" aria-hidden="true" />
            Next
          </dt>
          <dd className="leading-relaxed text-muted">{employee.nextTask}</dd>
        </div>
        <div className="px-5 py-3">
          <dt className="mb-1 flex items-center gap-1.5 font-medium text-body">
            <Pause className="size-3.5 text-subtle" aria-hidden="true" />
            On mission
          </dt>
          <dd>
            <Link
              href={`/missions/${mission.id}`}
              className="rounded font-medium text-link hover:underline"
            >
              {mission.name}
            </Link>
          </dd>
        </div>
      </dl>

      <div className="border-t border-line px-5 py-3">
        <Link
          href={`/workforce/${employee.id}`}
          className="inline-flex items-center gap-1.5 rounded text-[13px] font-medium text-link hover:underline"
        >
          See everything {employee.name} did today
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
