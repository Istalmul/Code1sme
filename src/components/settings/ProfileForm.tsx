"use client";

import { useRouter } from "next/navigation";
import { Field } from "@/components/ui/Field";
import { Toggle } from "@/components/ui/Toggle";
import { Combobox } from "@/components/ui/Combobox";
import { SettingsGroup, SettingsShell } from "./SettingsShell";
import { SaveBar } from "./SaveBar";
import { AvatarEditor } from "./AvatarEditor";
import { ConnectedAccounts } from "./ConnectedAccounts";
import { useSettingsForm } from "@/lib/settings/client";
import { COUNTRIES, TIMEZONES } from "@/lib/settings/defaults";
import type { AuthProvider, Connections, ProfileDetails } from "@/lib/auth/store";

type Draft = ProfileDetails & { name: string; avatarUrl: string };

export function ProfileForm({
  email,
  providers,
  connections,
  dailyCap,
  initial,
}: {
  email: string;
  providers: AuthProvider[];
  connections: Connections;
  dailyCap: number;
  initial: Draft;
}) {
  const router = useRouter();
  const form = useSettingsForm<Draft>(initial);
  const { draft, update } = form;

  async function submit() {
    const ok = await form.save({
      profile: {
        name: draft.name.trim(),
        avatarUrl: draft.avatarUrl,
        jobTitle: draft.jobTitle,
        phone: draft.phone,
        country: draft.country,
        timezone: draft.timezone,
        notifications: draft.notifications,
      },
    });
    // The greeting and the sidebar read the name from the server, so they need
    // a refresh to catch up with a rename.
    if (ok) router.refresh();
  }

  return (
    <SettingsShell title="Profile" description="How you appear in Piasowo, and how we reach you.">
      <div className="space-y-6">
        <SettingsGroup>
          <AvatarEditor
            name={draft.name || "Your name"}
            value={draft.avatarUrl || undefined}
            onChange={(next) => update({ avatarUrl: next })}
          />
        </SettingsGroup>

        <SettingsGroup title="About you">
          <Field
            label="Full name"
            value={draft.name}
            autoComplete="name"
            onChange={(e) => update({ name: e.target.value })}
          />

          <Field
            label="Email"
            value={email}
            readOnly
            disabled
            hint={
              providers.includes("google")
                ? "Verified through Google. Changing it isn't supported yet."
                : "Verified. Changing it isn't supported yet."
            }
          />

          <Field
            label="Job title"
            value={draft.jobTitle ?? ""}
            placeholder="Head of Growth"
            onChange={(e) => update({ jobTitle: e.target.value })}
          />

          <Field
            label="Phone"
            type="tel"
            inputMode="tel"
            value={draft.phone ?? ""}
            placeholder="+44 7700 900000"
            hint="Include your country code."
            onChange={(e) => update({ phone: e.target.value })}
          />

          <Combobox
            label="Country"
            options={COUNTRIES}
            value={draft.country ?? ""}
            onChange={(next) => update({ country: next })}
            placeholder="Start typing…"
          />

          <Combobox
            label="Timezone"
            options={TIMEZONES}
            value={draft.timezone ?? ""}
            onChange={(next) => update({ timezone: next })}
            placeholder="Start typing…"
            hint="Your AI employee only sends during the hours you set, in this timezone."
          />
        </SettingsGroup>

        <SettingsGroup
          title="Sending accounts"
          description="Where outreach leaves from, and whether that account is warm enough to carry your volume."
        >
          <ConnectedAccounts connections={connections} dailyCap={dailyCap} />
        </SettingsGroup>

        <SettingsGroup
          title="Notifications"
          description="What's worth interrupting you for. Everything still appears in your Command Center either way."
        >
          <Toggle
            label="A strong opportunity is found"
            description="Only for scores in the top band — not every finding."
            checked={draft.notifications.strongOpportunity}
            onChange={(v) =>
              update({ notifications: { ...draft.notifications, strongOpportunity: v } })
            }
          />
          <Toggle
            label="Someone replies"
            description="A reply usually needs you the same day."
            checked={draft.notifications.reply}
            onChange={(v) => update({ notifications: { ...draft.notifications, reply: v } })}
          />
          <Toggle
            label="Daily digest"
            description="One summary of what your AI employee did."
            checked={draft.notifications.digest}
            onChange={(v) => update({ notifications: { ...draft.notifications, digest: v } })}
          />
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
