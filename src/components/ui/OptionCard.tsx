"use client";

import type { ReactNode } from "react";

/**
 * A radio rendered as a card. Used where the choice deserves an explanation
 * (AI employee role, approval mode) rather than a bare label in a dropdown.
 */
export function OptionCard({
  name,
  value,
  checked,
  onSelect,
  title,
  description,
  badge,
}: {
  name: string;
  value: string;
  checked: boolean;
  onSelect: (value: string) => void;
  title: string;
  description: ReactNode;
  badge?: string;
}) {
  return (
    <label
      className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors ${
        checked
          ? "border-brand-600 bg-tint-brand"
          : "border-line-strong bg-surface hover:bg-hover"
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onSelect(value)}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border-2 ${
          checked ? "border-brand-600" : "border-line-strong"
        }`}
      >
        {checked && <span className="size-2 rounded-full bg-brand-600" />}
      </span>
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-2">
          <span className={`text-[14px] font-semibold ${checked ? "text-on-brand" : "text-body"}`}>
            {title}
          </span>
          {badge && (
            <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-medium text-muted ring-1 ring-line-strong">
              {badge}
            </span>
          )}
        </span>
        <span className="mt-1 block text-[13px] leading-relaxed text-muted">{description}</span>
      </span>
    </label>
  );
}
