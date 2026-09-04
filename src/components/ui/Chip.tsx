"use client";

import { Check } from "lucide-react";

/**
 * A pre-selected, removable choice. Used everywhere Piasowo recommends a set
 * of values — the recommendation arrives selected, and unselecting is one tap.
 */
export function Chip({
  label,
  selected,
  onToggle,
  hint,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
  hint?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      onClick={onToggle}
      title={hint}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px]
        font-medium transition-colors ${
          selected
            ? "border-brand-600 bg-tint-brand text-on-brand"
            : "border-line-strong bg-surface text-muted hover:bg-hover hover:text-body"
        }`}
    >
      {selected && <Check className="size-3.5" aria-hidden="true" />}
      {label}
    </button>
  );
}

export function ChipGroup({
  legend,
  hint,
  options,
  selected,
  onChange,
  error,
}: {
  legend: string;
  hint?: string;
  options: readonly string[];
  selected: string[];
  onChange: (next: string[]) => void;
  error?: string | null;
}) {
  return (
    <fieldset>
      <legend className="text-[13px] font-medium text-body">{legend}</legend>
      {hint && <p className="mt-1 text-[13px] text-muted">{hint}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => (
          <Chip
            key={option}
            label={option}
            selected={selected.includes(option)}
            onToggle={() =>
              onChange(
                selected.includes(option)
                  ? selected.filter((v) => v !== option)
                  : [...selected, option],
              )
            }
          />
        ))}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-[13px] text-on-bad">
          {error}
        </p>
      )}
    </fieldset>
  );
}
