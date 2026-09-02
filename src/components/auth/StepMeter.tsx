/**
 * Two or three honest segments. Each one fills only when that step is actually
 * finished — there is no head-start fill and no animation toward a step the
 * user has not completed.
 */
export function StepMeter({ step, total, label }: { step: number; total: number; label: string }) {
  // `step` counts finished steps, which is what fills the bar. The caption
  // names the step being worked on, so the two never disagree.
  const current = Math.min(step + 1, total);

  return (
    <div className="mb-7">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[13px] font-medium text-muted">{label}</span>
        <span className="text-[13px] tabular-nums text-subtle">
          Step {current} of {total}
        </span>
      </div>
      <div
        className="flex gap-1.5"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`${label}: step ${current} of ${total}`}
      >
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < step ? "bg-brand-600" : "bg-line"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
