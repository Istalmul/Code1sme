"use client";

/**
 * A small set of choices, all visible.
 *
 * Anything with five or fewer options belongs here rather than in a dropdown —
 * hiding a short list behind a click costs the user a step and hides the range
 * of what's available.
 */
export function Segmented<T extends string>({
  legend,
  hint,
  options,
  value,
  onChange,
  columns,
}: {
  legend: string;
  hint?: string;
  options: readonly { id: T; label: string; sub?: string }[];
  value: T;
  onChange: (next: T) => void;
  columns?: number;
}) {
  return (
    <fieldset>
      <legend className="text-[13px] font-medium text-body">{legend}</legend>
      {hint && <p className="mt-1 text-[13px] text-muted">{hint}</p>}
      <div
        className="mt-2.5 grid gap-2"
        style={{ gridTemplateColumns: `repeat(${columns ?? options.length}, minmax(0, 1fr))` }}
      >
        {options.map((option) => {
          const active = option.id === value;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(option.id)}
              className={`rounded-lg border px-3 py-2 text-center transition-colors ${
                active
                  ? "border-brand-600 bg-tint-brand text-on-brand"
                  : "border-line-strong bg-surface text-muted hover:bg-hover hover:text-body"
              }`}
            >
              <span className="block text-[13px] font-medium">{option.label}</span>
              {option.sub && <span className="mt-0.5 block text-[12px] opacity-80">{option.sub}</span>}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
