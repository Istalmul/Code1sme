import type { ReactNode } from "react";

/**
 * Every empty state answers the same three things: what is empty, why that
 * matters, and the one thing to do about it. A bare "nothing found" is a bug.
 */
export function EmptyState({
  icon,
  what,
  why,
  action,
  secondary,
}: {
  icon: ReactNode;
  what: string;
  why: string;
  action?: ReactNode;
  secondary?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <span className="mb-4 grid size-11 place-items-center rounded-xl bg-sunken text-muted ring-1 ring-line">
        {icon}
      </span>
      <p className="text-[15px] font-semibold text-body">{what}</p>
      <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted">{why}</p>
      {action && <div className="mt-5">{action}</div>}
      {secondary && <div className="mt-3 text-[13px] text-subtle">{secondary}</div>}
    </div>
  );
}
