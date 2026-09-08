"use client";

import { useId, type ComponentProps, type ReactNode } from "react";

const control =
  "w-full rounded-lg border bg-surface px-3.5 text-[15px] text-body transition-colors " +
  "placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-brand-500/35 " +
  "focus:border-brand-500 disabled:opacity-60";

export type FieldProps = Omit<ComponentProps<"input">, "id"> & {
  label: string;
  /** Rendered under the field, and read out by screen readers. */
  hint?: ReactNode;
  error?: string | null;
  /** Extra control rendered inside the field on the right (e.g. show/hide). */
  trailing?: ReactNode;
  /** Rendered on the label row, right-aligned (e.g. "Forgot password?"). */
  labelAction?: ReactNode;
};

export function Field({
  label,
  hint,
  error,
  trailing,
  labelAction,
  className = "",
  ...input
}: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ");

  return (
    <div className={className}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[13px] font-medium text-body">
          {label}
        </label>
        {labelAction}
      </div>

      <div className="relative">
        <input
          {...input}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={`${control} h-11 ${trailing ? "pr-11" : ""} ${
            error ? "border-bad-600 focus:border-bad-600 focus:ring-bad-600/25" : "border-line-strong"
          }`}
        />
        {trailing && (
          <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div>
        )}
      </div>

      {/* Errors replace the hint rather than stacking, so the field never jumps
          by more than one line. */}
      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 text-[13px] text-on-bad">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-1.5 text-[13px] text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
