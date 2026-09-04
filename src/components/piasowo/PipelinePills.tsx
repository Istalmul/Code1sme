import Link from "next/link";

/**
 * The pipeline as a row of filters.
 *
 * Counts on a dashboard invite the question "which ones?" — so each one is the
 * link that answers it, rather than a number you then go hunting for.
 */
export function PipelinePills({
  counts,
  activeFilter,
}: {
  counts: { waiting: number; researching: number; sent: number; replied: number };
  activeFilter?: string;
}) {
  const pills = [
    { key: "waiting", label: "waiting on you", count: counts.waiting, urgent: true },
    { key: "researching", label: "in research", count: counts.researching, urgent: false },
    { key: "sent", label: "sent", count: counts.sent, urgent: false },
    { key: "replied", label: "replied", count: counts.replied, urgent: true },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {pills.map((pill) => {
        const active = activeFilter === pill.key;
        return (
          <Link
            key={pill.key}
            href={`/opportunities?filter=${pill.key}`}
            aria-current={active ? "page" : undefined}
            className={`inline-flex items-baseline gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] transition-colors ${
              active
                ? "border-brand-600 bg-tint-brand text-on-brand"
                : pill.urgent && pill.count > 0
                  ? "border-line-strong bg-surface text-body hover:bg-hover"
                  : "border-line-strong bg-surface text-muted hover:bg-hover hover:text-body"
            }`}
          >
            <span className="font-semibold tabular-nums">{pill.count}</span>
            <span>{pill.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
