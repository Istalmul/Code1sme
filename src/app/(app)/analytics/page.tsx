import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { requireWorkspace } from "@/lib/piasowo/session-data";
import { TrendChart } from "@/components/analytics/TrendChart";
import { ExportButton } from "@/components/analytics/ExportButton";
import { ActivityFeed } from "@/components/piasowo/ActivityFeed";
import { EmptyState } from "@/components/piasowo/EmptyState";
import { CardHeader } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Analytics" };

function percent(part: number, whole: number) {
  if (whole === 0) return "—";
  return `${Math.round((part / whole) * 100)}%`;
}

export default async function AnalyticsPage() {
  const { workspace, data } = await requireWorkspace();
  const { daily, opportunities, activity } = data;
  const employee = data.employees[0];

  const totals = daily.reduce(
    (acc, row) => ({
      researched: acc.researched + row.researched,
      opportunities: acc.opportunities + row.opportunities,
      sent: acc.sent + row.sent,
      replied: acc.replied + row.replied,
    }),
    { researched: 0, opportunities: 0, sent: 0, replied: 0 },
  );

  // Rates carry their own denominator, so a percentage is never floating free.
  const tiles = [
    { label: "Researched", value: totals.researched.toLocaleString(), sub: "companies looked at" },
    { label: "Opportunities", value: String(totals.opportunities), sub: `${percent(totals.opportunities, totals.researched)} of those researched` },
    { label: "Contacted", value: String(totals.sent), sub: `${percent(totals.sent, totals.opportunities)} of opportunities` },
    { label: "Replies", value: String(totals.replied), sub: `${percent(totals.replied, totals.sent)} of those contacted` },
  ];

  const exportRows = opportunities.map((o) => ({
    company: o.prospect.company,
    domain: o.prospect.domain,
    industry: o.prospect.industry,
    employees: o.prospect.employees,
    location: o.prospect.location,
    contact: o.prospect.contact.name,
    title: o.prospect.contact.title,
    score: o.score,
    signal: o.signal.headline,
    status: o.status,
    found: o.foundAt.slice(0, 10),
  }));

  const slug = workspace.companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight sm:text-2xl">Analytics</h1>
          <p className="mt-1.5 text-[15px] text-muted">
            The last 14 days for {workspace.companyName}.
          </p>
        </div>
        <ExportButton
          rows={exportRows}
          filename={`piasowo-${slug}-opportunities.csv`}
          label="Export opportunities"
        />
      </header>

      {totals.sent === 0 && totals.replied === 0 ? (
        <section className="rounded-xl border border-line bg-surface shadow-card">
          <EmptyState
            icon={<BarChart3 className="size-5" aria-hidden="true" />}
            what="Nothing to measure yet"
            why={`${employee.name} hasn't sent anything on this business, so there's no reply rate to report. Numbers appear here once the first approved message goes out.`}
            action={
              <ButtonLink href="/opportunities?filter=waiting" variant="primary">
                Review what&apos;s waiting
              </ButtonLink>
            }
          />
        </section>
      ) : (
        <>
          <section className="grid gap-px overflow-hidden rounded-xl border border-line bg-[color:var(--border)] shadow-card sm:grid-cols-2 lg:grid-cols-4">
            {tiles.map((tile) => (
              <div key={tile.label} className="bg-surface p-card">
                <p className="text-[13px] text-muted">{tile.label}</p>
                <p className="mt-1 text-[26px] font-semibold tabular-nums tracking-tight">
                  {tile.value}
                </p>
                <p className="mt-0.5 text-[13px] text-subtle">{tile.sub}</p>
              </div>
            ))}
          </section>

          <section className="rounded-xl border border-line bg-surface shadow-card">
            <CardHeader
              title="Sent and replied"
              description="Weekends are quiet because the send window excludes them by default."
            />
            <div className="p-card">
              <TrendChart rows={daily} />
            </div>
          </section>
        </>
      )}

      <section className="rounded-xl border border-line bg-surface shadow-card">
        <CardHeader
          title="Activity log"
          description={`What ${employee.name} actually did, including the work that led nowhere.`}
        />
        <ActivityFeed events={activity} />
        <div className="border-t border-line px-5 py-3">
          <Link
            href="/opportunities?filter=all"
            className="rounded text-[13px] font-medium text-link hover:underline"
          >
            See every opportunity
          </Link>
        </div>
      </section>
    </div>
  );
}
