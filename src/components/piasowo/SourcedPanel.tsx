"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Lock, Mail, Phone, Search, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "./EmptyState";
import { relativeTime } from "@/lib/piasowo/format";
import type { SourcedProspect } from "@/lib/auth/store";

/**
 * People found through the data provider, before they are scored.
 *
 * These are deliberately not shown as opportunities: nothing has happened at
 * these companies yet. Contact details stay locked until the user asks for
 * them, because revealing one spends a credit.
 */
export function SourcedPanel({
  prospects,
  apolloReady,
  employeeName,
  markets,
}: {
  prospects: SourcedProspect[];
  apolloReady: boolean;
  employeeName: string;
  markets: string[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function act(body: Record<string, unknown>, key: string) {
    setBusy(key);
    setError(null);
    setNotice(null);
    const response = await fetch("/api/sourcing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
      found?: number;
      added?: number;
    };
    setBusy(null);
    if (!response.ok) {
      setError(payload.error ?? "That didn't work. Please try again.");
      return;
    }
    if (body.action === "find") {
      setNotice(
        payload.added === 0
          ? `${employeeName} searched and found ${payload.found ?? 0} people, all of them already on this list.`
          : `${employeeName} added ${payload.added} new ${payload.added === 1 ? "person" : "people"}.`,
      );
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-muted">
          Companies matching your market, before any signal. Contact details stay locked until you
          ask — revealing one spends an Apollo credit.
        </p>
        <Button
          variant="primary"
          size="sm"
          loading={busy === "find"}
          onClick={() => act({ action: "find", count: 10 }, "find")}
        >
          <Search className="size-4" aria-hidden="true" />
          Find 10 more
        </Button>
      </div>

      {!apolloReady && (
        <Alert tone="info">
          Apollo isn&apos;t connected on this deployment. Add <code>APOLLO_API_KEY</code> to the
          server environment and this will return real companies instead of an error.
        </Alert>
      )}
      {error && <Alert tone="error">{error}</Alert>}
      {notice && <Alert tone="success">{notice}</Alert>}

      {prospects.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface shadow-card">
          <EmptyState
            icon={<Search className="size-5" aria-hidden="true" />}
            what="No sourced prospects yet"
            why={`Sourcing pulls companies matching ${markets.slice(0, 2).join(" and ")} straight from the data provider, so ${employeeName} has a list to watch for signals. Nothing is contacted at this stage.`}
          />
        </div>
      ) : (
        <ul className="space-y-3">
          {prospects.map((prospect) => (
            <li
              key={prospect.id}
              className="rounded-xl border border-line bg-surface p-card shadow-card"
            >
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                <div className="min-w-0">
                  <h3 className="text-[15px] font-semibold tracking-tight">{prospect.company}</h3>
                  <p className="mt-1 text-[13px] text-muted">
                    {prospect.name} · {prospect.title}
                  </p>
                  <p className="mt-0.5 text-[13px] text-subtle">
                    {[prospect.employees && `${prospect.employees} staff`, prospect.location]
                      .filter(Boolean)
                      .join(" · ")}
                    {" · found "}
                    {relativeTime(prospect.foundAt)}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${prospect.company}`}
                  disabled={busy === prospect.id}
                  onClick={() => act({ action: "dismiss", id: prospect.id }, prospect.id)}
                  className="rounded-md p-1.5 text-subtle hover:bg-hover hover:text-on-bad"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>

              <div className="mt-3.5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
                {prospect.enriched || prospect.email ? (
                  <>
                    {prospect.email && (
                      <span className="inline-flex items-center gap-1.5 text-muted">
                        <Mail className="size-3.5 text-subtle" aria-hidden="true" />
                        {prospect.email}
                      </span>
                    )}
                    {prospect.phone && (
                      <span className="inline-flex items-center gap-1.5 text-muted">
                        <Phone className="size-3.5 text-subtle" aria-hidden="true" />
                        {prospect.phone}
                      </span>
                    )}
                    {!prospect.email && !prospect.phone && (
                      <span className="text-muted">Apollo had no contact details for this person.</span>
                    )}
                  </>
                ) : (
                  <Button
                    size="sm"
                    loading={busy === prospect.id}
                    onClick={() => act({ action: "enrich", id: prospect.id }, prospect.id)}
                  >
                    <Lock className="size-4" aria-hidden="true" />
                    Reveal contact (1 credit)
                  </Button>
                )}

                {prospect.linkedin && (
                  <a
                    href={prospect.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded text-link hover:underline"
                  >
                    LinkedIn
                    <ExternalLink className="size-3.5" aria-hidden="true" />
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
