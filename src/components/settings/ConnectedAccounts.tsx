"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, BadgeCheck, CheckCircle2, Mail, MessageCircle, Phone, Plug } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { CodeInput } from "@/components/ui/CodeInput";
import { senderHealth } from "@/lib/piasowo/sender-health";
import type { Connections, SenderChannel } from "@/lib/auth/store";

const RESEND_SECONDS = 30;

const CHANNELS = [
  {
    id: "email" as const,
    label: "Email",
    icon: Mail,
    kind: "email" as const,
    placeholder: "you@company.com",
    hint: "The address drafts would be sent from.",
  },
  {
    id: "sms" as const,
    label: "SMS",
    icon: Phone,
    kind: "phone" as const,
    placeholder: "+44 7700 900000",
    hint: "Include the country code. We'll text a code to confirm it's yours.",
  },
  {
    id: "whatsapp" as const,
    label: "WhatsApp",
    icon: MessageCircle,
    kind: "phone" as const,
    placeholder: "+44 7700 900000",
    hint: "The business number messages would come from.",
  },
];

type Pending = { challengeId: string; phone: string; channel: SenderChannel; delivered: boolean };

/**
 * Where outreach would leave from, and whether that account is both proven and
 * warm enough to carry the configured volume.
 *
 * Phone numbers go through the same code check as email: a number nobody has
 * proved they control is a number the AI employee must never send from.
 */
export function ConnectedAccounts({
  connections,
  dailyCap,
  accountEmail,
}: {
  connections: Connections;
  dailyCap: number;
  accountEmail: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<SenderChannel | null>(null);
  const [value, setValue] = useState("");
  const [pending, setPending] = useState<Pending | null>(null);
  const [code, setCode] = useState("");
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pending || seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [pending, seconds]);

  async function post(url: string, body: unknown, method: "POST" | "PATCH" = "POST") {
    setBusy(true);
    setError(null);
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    setBusy(false);
    if (!response.ok) {
      setError((payload.error as string) ?? "That didn't work. Please try again.");
      return null;
    }
    return payload;
  }

  async function startPhone(channel: SenderChannel) {
    const payload = await post("/api/settings/phone", { action: "start", channel, phone: value });
    if (!payload) return;
    setPending({
      challengeId: payload.challengeId as string,
      phone: payload.phone as string,
      channel,
      delivered: Boolean(payload.delivered),
    });
    setCode("");
    setSeconds(RESEND_SECONDS);
  }

  async function confirmPhone(entered: string) {
    if (!pending || entered.length !== 6) return;
    const payload = await post("/api/settings/phone", {
      action: "confirm",
      challengeId: pending.challengeId,
      code: entered,
    });
    if (!payload) {
      setCode("");
      return;
    }
    setPending(null);
    setEditing(null);
    setValue("");
    router.refresh();
  }

  async function connectEmail() {
    const payload = await post("/api/settings", { connect: { channel: "email", address: value } }, "PATCH");
    if (!payload) return;
    setEditing(null);
    setValue("");
    router.refresh();
  }

  async function disconnect(channel: SenderChannel) {
    if (await post("/api/settings", { disconnect: channel }, "PATCH")) router.refresh();
  }

  // Verifying a phone number takes over the panel: one thing to do at a time.
  if (pending) {
    const label = pending.channel === "whatsapp" ? "WhatsApp" : "SMS";
    return (
      <div className="step-enter rounded-xl border border-line p-card">
        <p className="text-[14px] font-medium text-body">Confirm your number</p>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">
          We sent a 6-digit code by {label} to{" "}
          <span className="font-medium text-body">{pending.phone}</span>.
        </p>

        {!pending.delivered && (
          <div className="mt-3">
            <Alert tone="info">
              No {label} provider is configured on this deployment, so the code was written to the
              server log instead of being sent. Set the <code>TWILIO_*</code> variables to send for
              real.
            </Alert>
          </div>
        )}

        <div className="mt-4">
          <CodeInput
            label={`${label} verification code`}
            value={code}
            onChange={setCode}
            onComplete={confirmPhone}
            error={error}
            disabled={busy}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            loading={busy}
            disabled={code.length !== 6}
            onClick={() => confirmPhone(code)}
          >
            Confirm number
          </Button>
          <Button
            size="sm"
            disabled={busy}
            onClick={() => {
              setPending(null);
              setError(null);
            }}
          >
            Use a different number
          </Button>
          <span className="text-[13px] text-muted">
            {seconds > 0 ? (
              <span className="text-subtle">Resend in {seconds}s</span>
            ) : (
              <button
                type="button"
                onClick={() => startPhone(pending.channel)}
                className="rounded font-medium text-link hover:underline"
              >
                Send a new code
              </button>
            )}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && <Alert tone="error">{error}</Alert>}

      {CHANNELS.map((channel) => {
        const account = connections[channel.id];
        const health = senderHealth(account);
        const overCap = account && dailyCap > health.safeDailyCap;
        const Icon = channel.icon;
        // The account's own address is already proven by sign-up; any other
        // sender is not, and says so.
        const proven =
          account &&
          (Boolean(account.verifiedAt) ||
            (channel.id === "email" && account.address.toLowerCase() === accountEmail));

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
                {account && (
                  <p
                    className={`mt-1 inline-flex items-center gap-1.5 text-[12px] font-medium ${
                      proven ? "text-on-good" : "text-on-warn"
                    }`}
                  >
                    {proven ? (
                      <BadgeCheck className="size-3.5" aria-hidden="true" />
                    ) : (
                      <AlertTriangle className="size-3.5" aria-hidden="true" />
                    )}
                    {proven ? "Verified" : "Not verified — nothing will send from here"}
                  </p>
                )}
              </div>
              {account ? (
                <Button size="sm" disabled={busy} onClick={() => disconnect(channel.id)}>
                  Disconnect
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => {
                    setEditing(channel.id);
                    setValue("");
                    setError(null);
                  }}
                >
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
                {overCap && (
                  <p className="mt-2 text-[13px] leading-relaxed text-on-warn">
                    Your daily cap is {dailyCap}, above what this account can safely carry today.
                    Only {health.safeDailyCap} will go out until warm-up finishes.
                  </p>
                )}
              </div>
            )}

            {editing === channel.id && (
              <div className="step-enter mt-3.5 space-y-3">
                <Field
                  label={channel.kind === "phone" ? "Phone number" : "Email address"}
                  type={channel.kind === "phone" ? "tel" : "email"}
                  inputMode={channel.kind === "phone" ? "tel" : "email"}
                  value={value}
                  autoFocus
                  placeholder={channel.placeholder}
                  hint={channel.hint}
                  onChange={(e) => setValue(e.target.value)}
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
                    disabled={value.trim().length < 3}
                    onClick={() =>
                      channel.kind === "phone" ? startPhone(channel.id) : connectEmail()
                    }
                  >
                    {channel.kind === "phone" ? "Send code" : "Connect"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <p className="text-[13px] leading-relaxed text-subtle">
        Verifying proves the account is yours and starts its warm-up clock. Delivery itself needs a
        mail or messaging provider configured on the server.
      </p>
    </div>
  );
}
