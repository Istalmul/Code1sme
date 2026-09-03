"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { Segmented } from "@/components/ui/Segmented";
import { Toggle } from "@/components/ui/Toggle";
import { SettingsGroup, SettingsShell } from "./SettingsShell";
import { SaveBar } from "./SaveBar";
import { useSettingsForm } from "@/lib/settings/client";
import { ACCENTS } from "@/lib/settings/defaults";
import type { Appearance } from "@/lib/auth/store";

const THEMES = [
  { id: "system", label: "System", icon: Monitor },
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
] as const;

export function AppearanceForm({ initial }: { initial: Appearance }) {
  const router = useRouter();
  const form = useSettingsForm<Appearance>(initial);
  const { draft, update } = form;

  /**
   * Appearance previews live, before saving — you should see a theme before
   * committing to it. The server still holds the saved value, so discarding
   * or navigating away restores it.
   */
  useEffect(() => {
    const root = document.documentElement;
    if (draft.theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", draft.theme);
    root.setAttribute("data-accent", draft.accent);
    root.setAttribute("data-density", draft.density);
    if (draft.reduceMotion) root.setAttribute("data-reduce-motion", "true");
    else root.removeAttribute("data-reduce-motion");
  }, [draft]);

  async function submit() {
    if (await form.save({ appearance: draft })) router.refresh();
  }

  return (
    <SettingsShell
      title="Appearance"
      description="Changes preview immediately. Nothing is kept until you press Done."
    >
      <div className="space-y-6">
        <SettingsGroup title="Theme">
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map(({ id, label, icon: Icon }) => {
              const active = draft.theme === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => update({ theme: id })}
                  className={`flex flex-col items-center gap-2 rounded-xl border px-3 py-4 transition-colors ${
                    active
                      ? "border-brand-600 bg-tint-brand text-on-brand"
                      : "border-line-strong bg-surface text-muted hover:bg-hover hover:text-body"
                  }`}
                >
                  <Icon className="size-5" aria-hidden="true" />
                  <span className="text-[13px] font-medium">{label}</span>
                </button>
              );
            })}
          </div>
          <p className="text-[13px] text-muted">
            System follows whatever your device is set to, and changes with it.
          </p>
        </SettingsGroup>

        <SettingsGroup
          title="Accent"
          description="Used for the recommended action on each screen, and nothing else."
        >
          <div className="flex flex-wrap gap-2.5">
            {ACCENTS.map((accent) => {
              const active = draft.accent === accent.id;
              return (
                <button
                  key={accent.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={accent.label}
                  onClick={() => update({ accent: accent.id })}
                  className={`grid size-10 place-items-center rounded-full ring-2 ring-offset-2 transition-shadow ${
                    active ? "ring-brand-600" : "ring-transparent"
                  }`}
                  style={{ backgroundColor: accent.swatch, boxShadow: "inset 0 0 0 1px rgb(0 0 0 / 0.1)" }}
                >
                  {active && <Check className="size-4 text-white" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </SettingsGroup>

        <SettingsGroup title="Reading">
          <Segmented
            legend="Density"
            hint="Compact fits more on screen. Text size never changes — only spacing."
            options={[
              { id: "comfortable", label: "Comfortable" },
              { id: "compact", label: "Compact" },
            ]}
            value={draft.density}
            onChange={(next) => update({ density: next })}
          />

          <Toggle
            label="Reduce motion"
            description="Turns off transitions here, regardless of your device setting."
            checked={draft.reduceMotion}
            onChange={(v) => update({ reduceMotion: v })}
          />
        </SettingsGroup>

        {/* A live sample, so the accent and density can be judged on a real
            component rather than on the swatches alone. */}
        <SettingsGroup title="Preview">
          <div className="rounded-xl border border-line bg-surface p-card">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[15px] font-semibold tracking-tight">Northgate Logistics</p>
                <p className="mt-1 text-[13px] text-muted">Opened a second depot in Warrington</p>
              </div>
              <span className="shrink-0 rounded-full bg-tint-brand px-2.5 py-1 text-[13px] font-medium text-on-brand ring-1 ring-on-brand/30">
                92 Strong
              </span>
            </div>
            <button
              type="button"
              className="mt-4 h-9 rounded-lg bg-brand-600 px-3.5 text-[13px] font-medium text-white"
            >
              Approve the drafted email
            </button>
          </div>
        </SettingsGroup>

        <SaveBar
          dirty={form.dirty}
          saving={form.saving}
          saved={form.saved}
          error={form.error}
          onSave={submit}
          onReset={form.reset}
        />
      </div>
    </SettingsShell>
  );
}
