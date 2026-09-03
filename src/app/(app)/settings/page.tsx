import type { Metadata } from "next";
import { Bot, Building2, LayoutGrid, LogOut, Palette, UserRound } from "lucide-react";
import { requireWorkspace } from "@/lib/piasowo/session-data";
import { SettingsList, SettingsRow } from "@/components/settings/SettingsRow";
import { DEFAULT_APPEARANCE } from "@/lib/settings/defaults";

export const metadata: Metadata = { title: "Settings" };

const THEME_LABEL = { system: "System", light: "Light", dark: "Dark" } as const;

export default async function SettingsPage() {
  const { user, workspace, workspaces } = await requireWorkspace();
  const live = workspaces.filter((w) => !w.archived);
  const appearance = user.appearance ?? DEFAULT_APPEARANCE;
  const employee = workspace.aiEmployee;

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-6">
        <h1 className="text-[22px] font-semibold tracking-tight sm:text-2xl">Settings</h1>
        <p className="mt-1.5 text-[15px] text-muted">
          Everything you set up during onboarding lives here, and can be changed at any time.
        </p>
      </header>

      {/* Each row shows its current value, so the list answers most questions
          without being opened. */}
      <SettingsList>
        <SettingsRow
          href="/settings/profile"
          icon={<UserRound className="size-[18px]" aria-hidden="true" />}
          label="Profile"
          description={user.email}
          value={user.name}
        />
        <SettingsRow
          href="/settings/employee"
          icon={<Bot className="size-[18px]" aria-hidden="true" />}
          label="AI employee"
          description={
            employee.paused
              ? "Paused — no research, no drafting"
              : `${employee.role} · ${employee.tone.toLowerCase()} tone`
          }
          value={employee.name}
        />
        <SettingsRow
          href="/settings/workspace"
          icon={<Building2 className="size-[18px]" aria-hidden="true" />}
          label="Workspace"
          description={`${workspace.targetMarkets.length} markets · ${
            workspace.documents?.length ?? 0
          } documents`}
          value={workspace.companyName}
        />
        <SettingsRow
          href="/settings/workspaces"
          icon={<LayoutGrid className="size-[18px]" aria-hidden="true" />}
          label="Businesses"
          description={
            live.length === 1
              ? "Add another to run a separate pipeline"
              : `${live.length} active${
                  workspaces.length > live.length ? `, ${workspaces.length - live.length} archived` : ""
                }`
          }
          value={live.length === 1 ? "1" : String(live.length)}
        />
        <SettingsRow
          href="/settings/appearance"
          icon={<Palette className="size-[18px]" aria-hidden="true" />}
          label="Appearance"
          description={`${appearance.accent} accent · ${appearance.density}`}
          value={THEME_LABEL[appearance.theme]}
        />
      </SettingsList>

      <div className="mt-6 overflow-hidden rounded-xl border border-line bg-surface shadow-card">
        <form action="/api/auth/logout" method="post">
          <button
            type="submit"
            className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-hover"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-sunken text-muted ring-1 ring-line">
              <LogOut className="size-[18px]" aria-hidden="true" />
            </span>
            <span className="text-[14px] font-medium text-body">Sign out</span>
          </button>
        </form>
      </div>
    </div>
  );
}
