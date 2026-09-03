import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

/**
 * One row of the settings list.
 *
 * The value sits on the row itself, so the list answers most questions without
 * being opened — you can see your theme and your agent's name at a glance.
 */
export function SettingsRow({
  href,
  icon,
  label,
  value,
  description,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  value?: string;
  description?: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3.5 rounded-xl px-4 py-3.5 transition-colors hover:bg-hover"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-sunken text-muted ring-1 ring-line">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-medium text-body">{label}</span>
        {description && (
          <span className="mt-0.5 block truncate text-[13px] text-muted">{description}</span>
        )}
      </span>
      {value && (
        <span className="hidden max-w-[40%] truncate text-[13px] text-muted xs:inline">{value}</span>
      )}
      <ChevronRight className="size-4 shrink-0 text-subtle" aria-hidden="true" />
    </Link>
  );
}

export function SettingsList({ children }: { children: ReactNode }) {
  return (
    <div className="divide-y divide-[color:var(--border)] overflow-hidden rounded-xl border border-line bg-surface shadow-card">
      {children}
    </div>
  );
}
