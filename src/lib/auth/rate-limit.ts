import { transaction } from "./store";

/**
 * Sliding-window limiter keyed by action + identifier (IP or email).
 *
 * Signup, login, code checks and resends are all cheap to script, so each one
 * gets a budget. The window state lives with the rest of the auth data.
 */
export type Limit = { limit: number; windowMs: number };

export const LIMITS = {
  "signup:ip": { limit: 10, windowMs: 60 * 60 * 1000 },
  "login:ip": { limit: 20, windowMs: 15 * 60 * 1000 },
  "login:email": { limit: 8, windowMs: 15 * 60 * 1000 },
  "code:ip": { limit: 30, windowMs: 15 * 60 * 1000 },
  "resend:email": { limit: 5, windowMs: 60 * 60 * 1000 },
  "reset:email": { limit: 5, windowMs: 60 * 60 * 1000 },
  // Model calls cost real money, so the budget is per-IP and deliberately low.
  "ai:ip": { limit: 30, windowMs: 60 * 60 * 1000 },
  "sourcing:ip": { limit: 12, windowMs: 60 * 60 * 1000 },
} satisfies Record<string, Limit>;

export type LimitKey = keyof typeof LIMITS;

export type LimitResult = { allowed: boolean; retryAfterSeconds: number };

export async function consume(action: LimitKey, identifier: string): Promise<LimitResult> {
  const { limit, windowMs } = LIMITS[action];
  const key = `${action}|${identifier.toLowerCase()}`;

  return transaction((db) => {
    const now = Date.now();
    const hits = (db.hits[key] ?? []).filter((t) => now - t < windowMs);

    if (hits.length >= limit) {
      db.hits[key] = hits;
      const retryAfterSeconds = Math.ceil((windowMs - (now - hits[0])) / 1000);
      return { allowed: false, retryAfterSeconds };
    }

    hits.push(now);
    db.hits[key] = hits;
    return { allowed: true, retryAfterSeconds: 0 };
  });
}

/** Best-effort client address, used only for rate limiting. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
