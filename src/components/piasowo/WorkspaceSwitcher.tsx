"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import type { Appearance } from "@/lib/auth/store";

export type SwitcherWorkspace = {
  id: string;
  companyName: string;
  employeeName: string;
  color?: Appearance["accent"];
  archived?: boolean;
};

const DOT: Record<string, string> = {
  blue: "bg-brand-600",
  teal: "bg-good-600",
  violet: "bg-live-600",
  amber: "bg-warn-600",
  rose: "bg-bad-600",
};

/**
 * Switching business switches everything: the pipeline, the AI employee, the
 * criteria. Because that is a bigger jump than it looks, the switch is
 * confirmed and the confirmation names the employee you'll land on.
 */
export function WorkspaceSwitcher({
  workspaces,
  activeId,
  collapsed = false,
}: {
  workspaces: SwitcherWorkspace[];
  activeId: string;
  collapsed?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<SwitcherWorkspace | null>(null);
  const [busy, setBusy] = useState(false);
  const container = useRef<HTMLDivElement>(null);

  const live = workspaces.filter((w) => !w.archived);
  const active = workspaces.find((w) => w.id === activeId) ?? live[0];

  useEffect(() => {
    if (!open) return;
    function onDocument(event: MouseEvent) {
      if (!container.current?.contains(event.target as Node)) {
        setOpen(false);
        setPending(null);
      }
    }
    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setPending(null);
      }
    }
    document.addEventListener("mousedown", onDocument);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onDocument);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  async function confirmSwitch(workspace: SwitcherWorkspace) {
    setBusy(true);
    await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "switch", id: workspace.id }),
    });
    setBusy(false);
    setPending(null);
    setOpen(false);
    router.push("/command-center");
    router.refresh();
  }

  if (!active) return null;

  return (
    <div ref={container} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        title={collapsed ? active.companyName : undefined}
        className={`flex w-full items-center gap-2.5 rounded-lg py-2 text-left transition-colors hover:bg-hover ${
          collapsed ? "justify-center px-0" : "px-2"
        }`}
      >
        <span
          aria-hidden="true"
          className={`size-2.5 shrink-0 rounded-full ${DOT[active.color ?? "blue"]}`}
        />
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-body">
                {active.companyName}
              </span>
              <span className="block truncate text-[12px] text-subtle">{active.employeeName}</span>
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-subtle" aria-hidden="true" />
          </>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="motion-enter motion-enter-top-left absolute left-0 top-full z-40 mt-1.5 min-w-[240px] overflow-hidden rounded-xl border border-line bg-surface shadow-pop"
        >
          {pending ? (
            <div className="p-3.5">
              <p className="text-[13px] leading-relaxed text-body">
                Switch to <span className="font-semibold">{pending.companyName}</span>? Your AI
                employee becomes <span className="font-semibold">{pending.employeeName}</span>, with
                its own pipeline and settings.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setPending(null)}
                  className="h-8 flex-1 rounded-lg border border-line-strong text-[13px] font-medium text-body hover:bg-hover"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => confirmSwitch(pending)}
                  className="h-8 flex-1 rounded-lg bg-brand-600 text-[13px] font-medium text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  {busy ? "Switching…" : "Switch"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <ul className="max-h-72 overflow-auto py-1">
                {live.map((workspace) => {
                  const isActive = workspace.id === active.id;
                  return (
                    <li key={workspace.id}>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => (isActive ? setOpen(false) : setPending(workspace))}
                        className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left hover:bg-hover"
                      >
                        <span
                          aria-hidden="true"
                          className={`size-2.5 shrink-0 rounded-full ${DOT[workspace.color ?? "blue"]}`}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-medium text-body">
                            {workspace.companyName}
                          </span>
                          <span className="block truncate text-[12px] text-subtle">
                            {workspace.employeeName}
                          </span>
                        </span>
                        {isActive && (
                          <Check className="size-4 shrink-0 text-brand-600" aria-hidden="true" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <Link
                href="/settings/workspaces"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 border-t border-line px-3.5 py-2.5 text-[13px] font-medium text-body hover:bg-hover"
              >
                <Plus className="size-4 text-subtle" aria-hidden="true" />
                Add or manage businesses
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
