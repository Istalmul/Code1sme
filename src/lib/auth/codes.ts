import crypto from "node:crypto";
import type { Challenge } from "./store";

/**
 * Verification codes.
 *
 * Codes are stored as salted SHA-256 digests, compared in constant time, and
 * capped on both attempts and resends so the endpoint cannot be brute-forced
 * or used to spam an inbox.
 */

export const CODE_LENGTH = 6;
export const CODE_TTL_MS = 10 * 60 * 1000;
export const RESEND_COOLDOWN_MS = 30 * 1000;
export const MAX_ATTEMPTS = 5;
export const MAX_RESENDS = 4;

const PEPPER = process.env.AUTH_SECRET ?? "piasowo-dev-pepper";

export function generateCode(): string {
  // randomInt is uniform; Math.random is not, and this guards an account.
  return crypto.randomInt(0, 10 ** CODE_LENGTH).toString().padStart(CODE_LENGTH, "0");
}

export function hashCode(code: string, email: string): string {
  return crypto.createHmac("sha256", PEPPER).update(`${email}:${code}`).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export type CheckResult =
  | { ok: true }
  | { ok: false; reason: "expired" | "too-many-attempts" | "incorrect"; remaining?: number };

export function checkCode(challenge: Challenge, code: string): CheckResult {
  if (challenge.expiresAt <= Date.now()) return { ok: false, reason: "expired" };
  if (challenge.attempts >= MAX_ATTEMPTS) return { ok: false, reason: "too-many-attempts" };

  challenge.attempts += 1;
  if (safeEqual(challenge.codeHash, hashCode(code, challenge.email))) return { ok: true };

  const remaining = Math.max(0, MAX_ATTEMPTS - challenge.attempts);
  return remaining === 0
    ? { ok: false, reason: "too-many-attempts" }
    : { ok: false, reason: "incorrect", remaining };
}

export function newChallengeId(): string {
  return crypto.randomUUID();
}
