import type { SenderAccount } from "@/lib/auth/store";

/**
 * Domain reputation is earned, not configured.
 *
 * A cold domain sending at full volume gets filtered, and the damage is slow to
 * undo — so the warm-up stage caps what the AI employee may actually send,
 * regardless of what the daily cap is set to. The numbers below follow the
 * conventional ramp: a handful a day in week one, roughly doubling weekly.
 */

export type SenderHealth = {
  state: "not-connected" | "warming" | "ready";
  daysWarmed: number;
  /** What this account can safely send today, whatever the setting says. */
  safeDailyCap: number;
  headline: string;
  detail: string;
};

const WARMUP_DAYS = 28;

export function senderHealth(account: SenderAccount | undefined): SenderHealth {
  if (!account) {
    return {
      state: "not-connected",
      daysWarmed: 0,
      safeDailyCap: 0,
      headline: "Not connected",
      detail: "Nothing can be sent until an account is connected here.",
    };
  }

  const started = new Date(account.warmupStartedAt).getTime();
  const daysWarmed = Math.max(0, Math.floor((Date.now() - started) / 86_400_000));

  if (daysWarmed >= WARMUP_DAYS) {
    return {
      state: "ready",
      daysWarmed,
      safeDailyCap: 60,
      headline: "Warm-up complete",
      detail: `Sending from ${account.address} since ${new Date(account.connectedAt).toLocaleDateString()}. Full volume is safe.`,
    };
  }

  const week = Math.floor(daysWarmed / 7);
  const safeDailyCap = [5, 12, 25, 40][Math.min(week, 3)];
  return {
    state: "warming",
    daysWarmed,
    safeDailyCap,
    headline: `Warming up — day ${daysWarmed + 1} of ${WARMUP_DAYS}`,
    detail: `${account.address} is capped at ${safeDailyCap} messages a day for now. Sending harder than this is what gets a new domain filtered.`,
  };
}

/** True when the configured cap is more than the sender can safely carry. */
export function capExceedsHealth(dailyCap: number, health: SenderHealth): boolean {
  return health.state !== "not-connected" && dailyCap > health.safeDailyCap;
}
