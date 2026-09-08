/**
 * A score is never shown alone. The band word does the comparing so the reader
 * doesn't have to hold the rest of the list in their head to know if 78 is good.
 */
export function scoreBand(score: number): { label: string; classes: string } {
  if (score >= 85) return { label: "Strong", classes: "bg-tint-good text-on-good ring-on-good/30" };
  if (score >= 70) return { label: "Solid", classes: "bg-tint-brand text-on-brand ring-on-brand/30" };
  if (score >= 55) return { label: "Worth a look", classes: "bg-tint-warn text-on-warn ring-on-warn/30" };
  return { label: "Weak", classes: "bg-sunken text-muted ring-line-strong" };
}

export function ScoreBadge({ score, size = "md" }: { score: number; size?: "sm" | "md" }) {
  const band = scoreBand(score);
  return (
    <span
      className={`inline-flex items-baseline gap-1.5 rounded-full px-2.5 py-1 font-medium ring-1 ${
        band.classes
      } ${size === "sm" ? "text-[12px]" : "text-[13px]"}`}
    >
      <span className="tabular-nums">{score}</span>
      <span className="opacity-80">{band.label}</span>
    </span>
  );
}
