import Link from "next/link";
import { CheckCircle2, MailOpen, PenLine, Search, Send, SkipForward } from "lucide-react";
import type { ActivityEvent, ActivityKind } from "@/lib/piasowo/types";
import { relativeTime } from "@/lib/piasowo/format";

const ICONS: Record<ActivityKind, { icon: typeof Search; tone: string }> = {
  researched: { icon: Search, tone: "text-muted" },
  found: { icon: CheckCircle2, tone: "text-on-good" },
  drafted: { icon: PenLine, tone: "text-on-live" },
  sent: { icon: Send, tone: "text-link" },
  reply: { icon: MailOpen, tone: "text-on-warn" },
  // Skips are shown, not hidden: knowing what was rejected is how trust builds.
  skipped: { icon: SkipForward, tone: "text-subtle" },
};

export function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  return (
    <ol className="divide-y divide-[color:var(--border)]">
      {events.map((event) => {
        const { icon: Icon, tone } = ICONS[event.kind];
        return (
          <li key={event.id} className="flex gap-3 px-5 py-3.5">
            <Icon className={`mt-0.5 size-4 shrink-0 ${tone}`} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-body">
                {event.opportunityId ? (
                  <Link href={`/opportunities/${event.opportunityId}`} className="rounded hover:underline">
                    {event.summary}
                  </Link>
                ) : (
                  event.summary
                )}
              </p>
              {event.detail && (
                <p className="mt-0.5 text-[13px] leading-relaxed text-muted">{event.detail}</p>
              )}
            </div>
            <time
              dateTime={event.at}
              className="shrink-0 text-[12px] tabular-nums text-subtle"
            >
              {relativeTime(event.at)}
            </time>
          </li>
        );
      })}
    </ol>
  );
}
