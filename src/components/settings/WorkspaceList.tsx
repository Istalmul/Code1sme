"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, Copy, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { Combobox } from "@/components/ui/Combobox";
import { SettingsGroup, SettingsShell } from "./SettingsShell";
import { INDUSTRIES } from "@/lib/piasowo/recommend";
import { ACCENTS, EMPLOYEE_NAME_POOL } from "@/lib/settings/defaults";
import type { Appearance } from "@/lib/auth/store";

type Row = {
  id: string;
  companyName: string;
  industry: string;
  employeeName: string;
  color: Appearance["accent"];
  archived: boolean;
  paused: boolean;
  documents: number;
};

const DOT: Record<string, string> = {
  blue: "bg-brand-600",
  teal: "bg-good-600",
  violet: "bg-live-600",
  amber: "bg-warn-600",
  rose: "bg-bad-600",
};

/** Search only earns its place once the list is long enough to scan badly. */
const SEARCH_THRESHOLD = 4;

export function WorkspaceList({ workspaces, activeId }: { workspaces: Row[]; activeId: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [offering, setOffering] = useState("");
  const [employeeName, setEmployeeName] = useState<string>(EMPLOYEE_NAME_POOL[1]);
  const [color, setColor] = useState<Appearance["accent"]>("teal");

  const live = workspaces.filter((w) => !w.archived);
  const archived = workspaces.filter((w) => w.archived);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return live;
    return live.filter(
      (w) =>
        w.companyName.toLowerCase().includes(q) ||
        w.industry.toLowerCase().includes(q) ||
        w.employeeName.toLowerCase().includes(q),
    );
  }, [live, query]);

  async function act(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    const response = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "That didn't work. Please try again.");
      return false;
    }
    router.refresh();
    return true;
  }

  async function create() {
    if (!name.trim() || !industry.trim() || offering.trim().length < 3) {
      setError("Give the business a name, an industry, and one line on what it sells.");
      return;
    }
    const ok = await act({
      action: "create",
      companyName: name.trim(),
      industry: industry.trim(),
      offering: offering.trim(),
      employeeName: employeeName.trim(),
      color,
    });
    if (ok) {
      setAdding(false);
      setName("");
      setIndustry("");
      setOffering("");
    }
  }

  return (
    <SettingsShell
      title="Businesses"
      description="Each one runs its own AI employee, criteria and pipeline. Nothing crosses between them."
    >
      <div className="space-y-6">
        {error && <Alert tone="error">{error}</Alert>}

        {live.length >= SEARCH_THRESHOLD && (
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle"
              aria-hidden="true"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, industry or AI employee"
              aria-label="Search businesses"
              className="h-11 w-full rounded-lg border border-line-strong bg-surface pl-10 pr-3.5 text-[15px] text-body placeholder:text-subtle focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/35"
            />
          </div>
        )}

        <ul className="space-y-3">
          {visible.map((workspace) => {
            const isActive = workspace.id === activeId;
            return (
              <li
                key={workspace.id}
                className={`rounded-xl border bg-surface p-card shadow-card ${
                  isActive ? "border-brand-600" : "border-line"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className={`mt-1.5 size-2.5 shrink-0 rounded-full ${DOT[workspace.color]}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <h2 className="text-[15px] font-semibold tracking-tight">
                        {workspace.companyName}
                      </h2>
                      {isActive && (
                        <span className="rounded-full bg-tint-brand px-2 py-0.5 text-[11px] font-medium text-on-brand">
                          Active
                        </span>
                      )}
                      {workspace.paused && (
                        <span className="rounded-full bg-tint-warn px-2 py-0.5 text-[11px] font-medium text-on-warn">
                          Paused
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[13px] text-muted">
                      {workspace.industry} · {workspace.employeeName} ·{" "}
                      {workspace.documents === 0
                        ? "no proof points"
                        : `${workspace.documents} proof ${
                            workspace.documents === 1 ? "point" : "points"
                          }`}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {!isActive && (
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() => act({ action: "switch", id: workspace.id })}
                    >
                      Switch to this
                    </Button>
                  )}
                  <Button
                    size="sm"
                    disabled={busy}
                    onClick={() => act({ action: "duplicate", id: workspace.id })}
                  >
                    <Copy className="size-4" aria-hidden="true" />
                    Duplicate
                  </Button>
                  {live.length > 1 && (
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() => act({ action: "archive", id: workspace.id })}
                    >
                      <Archive className="size-4" aria-hidden="true" />
                      Archive
                    </Button>
                  )}
                  {workspaces.length > 1 &&
                    (confirmDelete === workspace.id ? (
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-[13px] text-on-bad">
                          Delete {workspace.companyName} and its settings?
                        </span>
                        <Button size="sm" onClick={() => setConfirmDelete(null)}>
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={busy}
                          onClick={async () => {
                            if (await act({ action: "delete", id: workspace.id })) {
                              setConfirmDelete(null);
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </span>
                    ) : (
                      <Button size="sm" onClick={() => setConfirmDelete(workspace.id)}>
                        <Trash2 className="size-4" aria-hidden="true" />
                        Delete
                      </Button>
                    ))}
                </div>
              </li>
            );
          })}
        </ul>

        {visible.length === 0 && query && (
          <p className="text-[13px] text-muted">Nothing matches &ldquo;{query.trim()}&rdquo;.</p>
        )}

        {adding ? (
          <SettingsGroup
            title="Add a business"
            description="It starts with markets and signals suggested from its industry, the same way your first one did."
          >
            <Field
              label="Business name"
              value={name}
              autoFocus
              placeholder="Ashgrove Interiors"
              onChange={(e) => setName(e.target.value)}
            />
            <Combobox
              label="Industry"
              options={INDUSTRIES}
              value={industry}
              onChange={setIndustry}
              placeholder="Start typing…"
            />
            <Field
              label="What it sells"
              value={offering}
              placeholder="Commercial interior fit-outs for hospitality"
              onChange={(e) => setOffering(e.target.value)}
            />
            <Field
              label="Its AI employee"
              value={employeeName}
              maxLength={40}
              onChange={(e) => setEmployeeName(e.target.value)}
              hint="Each business gets its own, so you always know whose work you're reading."
            />
            <div>
              <span className="mb-2 block text-[13px] font-medium text-body">Colour</span>
              <div className="flex flex-wrap gap-2.5">
                {ACCENTS.map((accent) => (
                  <button
                    key={accent.id}
                    type="button"
                    role="radio"
                    aria-checked={color === accent.id}
                    aria-label={accent.label}
                    onClick={() => setColor(accent.id)}
                    className={`size-8 rounded-full ring-2 ring-offset-2 ${
                      color === accent.id ? "ring-brand-600" : "ring-transparent"
                    }`}
                    style={{ backgroundColor: accent.swatch }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button fullWidth onClick={() => setAdding(false)}>
                Cancel
              </Button>
              <Button variant="primary" fullWidth loading={busy} onClick={create}>
                Add business
              </Button>
            </div>
          </SettingsGroup>
        ) : (
          <Button variant="primary" onClick={() => setAdding(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Add a business
          </Button>
        )}

        {archived.length > 0 && (
          <SettingsGroup
            title={`Archived (${archived.length})`}
            description="Out of the switcher, but nothing is lost. Restore one at any time."
          >
            <ul className="space-y-2">
              {archived.map((workspace) => (
                <li
                  key={workspace.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line px-3.5 py-2.5"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-medium text-body">
                      {workspace.companyName}
                    </span>
                    <span className="block truncate text-[13px] text-muted">
                      {workspace.industry}
                    </span>
                  </span>
                  <Button
                    size="sm"
                    disabled={busy}
                    onClick={() => act({ action: "restore", id: workspace.id })}
                  >
                    <ArchiveRestore className="size-4" aria-hidden="true" />
                    Restore
                  </Button>
                </li>
              ))}
            </ul>
          </SettingsGroup>
        )}
      </div>
    </SettingsShell>
  );
}
