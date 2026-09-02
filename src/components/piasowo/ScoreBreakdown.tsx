import type { ScoreFactor } from "@/lib/piasowo/types";

/**
 * The score, itemised. Anchoring works here only because each row shows the
 * maximum alongside the points — the reader can see where the number came from
 * and where it was held back.
 */
export function ScoreBreakdown({ factors, score }: { factors: ScoreFactor[]; score: number }) {
  return (
    <div>
      <ul className="space-y-4">
        {factors.map((factor) => {
          const pct = Math.round((factor.points / factor.max) * 100);
          return (
            <li key={factor.label}>
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-[13px] font-medium text-body">{factor.label}</span>
                <span className="text-[13px] tabular-nums text-muted">
                  {factor.points}
                  <span className="text-subtle">/{factor.max}</span>
                </span>
              </div>
              <div
                className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sunken"
                role="img"
                aria-label={`${factor.label}: ${factor.points} out of ${factor.max}`}
              >
                <span
                  style={{ width: `${pct}%` }}
                  className={`block h-full rounded-full ${
                    pct >= 85 ? "bg-good-600" : pct >= 60 ? "bg-brand-600" : "bg-warn-600"
                  }`}
                />
              </div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{factor.why}</p>
            </li>
          );
        })}
      </ul>

      <div className="mt-5 flex items-baseline justify-between border-t border-line pt-4">
        <span className="text-[13px] font-medium text-body">Total</span>
        <span className="text-[15px] font-semibold tabular-nums">{score}/100</span>
      </div>
    </div>
  );
}
