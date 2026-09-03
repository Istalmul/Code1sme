"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Mail, MessageCircle, Plug } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import type { Connections } from "@/lib/auth/store";
import { senderHealth } from "@/lib/piasowo/sender-health";

const CHANNELS = [
  {
    id: "email" as const,
    label: "Email",
    icon: Mail,
    placeholder: "you@company.com",
    hint: "The address drafts would be sent from.",
  },
  {
    id: "whatsapp" as const,
    label: "WhatsApp",
    icon: MessageCircle,
    placeholder: "+44 7700 900000",
    hint: "The business number messages would come from.",
  },
];

/**
 * Where outreach would leave from, and whether that account can carry the
 * volume the AI employee is configured for.
 *
 * The warm-up state is surfaced because it is the single thing most likely to
 * quietly ruin deliverability — a new domain sending at full rate gets filtered
 * long before anyone notices replies have stopped.
 */
export function ConnectedAccounts({
  connections,
  dailyCap,
}: {
  connections: Connections;
  dailyCap: number;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<"email" | "whatsapp" | null>(null);
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "That didn't work. Please try again.");
      return;
    }
    setEditing(null);
    setAddress("");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {error && <Alert tone="error">{error}</Alert>}

      {CHANNELS.map((channel) => {
        const account = connections[channel.id];
        const health = senderHealth(account);
        const overCap = account && dailyCap > health.safeDailyCap;
        const Icon = channel.icon;

        return (
          <div key={channel.id} className="rounded-xl border border-line p-card">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-sunken text-muted ring-1 ring-line">
                <Icon className="size-[18px]" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium text-body">{channel.label}</p>
                <p className="mt-0.5 break-all text-[13px] text-muted">
                  {account ? account.address : "Not connected"}
                </p>
              </div>
              {account ? (
                <Button size="sm" disabled={busy} onClick={() => send({ disconnect: channel.id })}>
                  Disconnect
                </Button>
              ) : (
                <Button size="sm" onClick={() => setEditing(channel.id)}>
                  <Plug className="size-4" aria-hidden="true" />
                  Connect
                </Button>
              )}
            </div>

            {account && (
              <div className="mt-3.5 rounded-lg border border-line bg-sunken p-3.5">
                <p
                  className={`flex items-center gap-1.5 text-[13px] font-medium ${
                    health.state === "ready" ? "text-on-good" : "text-on-warn"
                  }`}
                >
                  {health.state === "ready" ? (
                    <CheckCircle2 className="size-4" aria-hidden="true" />
                  ) : (
                    <AlertTriangle className="size-4" aria-hidden="true" />
                  )}
                  {health.headline}
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">{health.detail}</p>

                {/* The warm-up ramp overrides the configured cap, so a setting
                    that can't actually be honoured is called out rather than
                    silently ignored. */}
                {overCap && (
                  <p className="mt-2 text-[13px] leading-relaxed text-on-warn">
                    Your daily cap is {dailyCap}, above what this account can safely carry today.
                    Only {health.safeDailyCap} will go out until warm-up finishes.
                  </p>
                )}
              </div>
            )}

            {editing === channel.id && (
              <div className="mt-3.5 space-y-3">
                <Field
                  label={`${channel.label} address`}
                  value={address}
                  autoFocus
                  placeholder={channel.placeholder}
                  hint={channel.hint}
                  onChange={(e) => setAddress(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button fullWidth size="sm" onClick={() => setEditing(null)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    fullWidth
                    size="sm"
                    loading={busy}
                    disabled={address.trim().length < 3}
                    onClick={() => send({ connect: { channel: channel.id, address: address.trim() } })}
                  >
                    Connect
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <p className="text-[13px] leading-relaxed text-subtle">
        These record where messages would be sent from and start the warm-up clock. Actual delivery
        needs a mail or WhatsApp provider connected on the server — nothing is sent from here yet.
      </p>
    </div>
  );
}
