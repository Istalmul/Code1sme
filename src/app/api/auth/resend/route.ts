import { NextResponse } from "next/server";
import { resendSchema } from "@/lib/auth/schema";
import { fail, fromZod, tooMany } from "@/lib/auth/respond";
import { consume } from "@/lib/auth/rate-limit";
import {
  CODE_TTL_MS,
  MAX_RESENDS,
  RESEND_COOLDOWN_MS,
  generateCode,
  hashCode,
} from "@/lib/auth/codes";
import { sendCodeEmail } from "@/lib/auth/email";
import { transaction } from "@/lib/auth/store";

/**
 * Issues a fresh code for an existing challenge.
 *
 * Resending resets the attempt counter — an honest user who mistyped three
 * times should not stay locked out — but the resend count itself is capped.
 */
export async function POST(request: Request) {
  const parsed = resendSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fromZod(parsed.error);

  const prepared = await transaction((db) => {
    const challenge = db.challenges.find((c) => c.id === parsed.data.challengeId);
    if (!challenge) return { kind: "missing" as const };

    const waited = Date.now() - challenge.lastSentAt;
    if (waited < RESEND_COOLDOWN_MS) {
      return { kind: "cooldown" as const, seconds: Math.ceil((RESEND_COOLDOWN_MS - waited) / 1000) };
    }
    if (challenge.resends >= MAX_RESENDS) return { kind: "exhausted" as const };

    // Phone challenges resend through their own endpoint, which knows the
    // channel; this one only handles the email flows.
    if (challenge.purpose === "phone") return { kind: "missing" as const };

    const code = generateCode();
    challenge.codeHash = hashCode(code, challenge.email);
    challenge.expiresAt = Date.now() + CODE_TTL_MS;
    challenge.attempts = 0;
    challenge.resends += 1;
    challenge.lastSentAt = Date.now();
    return { kind: "ready" as const, code, email: challenge.email, purpose: challenge.purpose };
  });

  if (prepared.kind === "missing") {
    return fail(400, "This verification session has expired. Start again.");
  }
  if (prepared.kind === "cooldown") {
    return fail(429, `Wait ${prepared.seconds}s before requesting another code.`);
  }
  if (prepared.kind === "exhausted") {
    return fail(429, "You've requested too many codes. Start again in an hour.");
  }

  const limit = await consume("resend:email", prepared.email);
  if (!limit.allowed) return tooMany(limit.retryAfterSeconds);

  try {
    await sendCodeEmail({ to: prepared.email, code: prepared.code, purpose: prepared.purpose });
  } catch {
    return fail(502, "We couldn't send the email. Please try again.");
  }

  return NextResponse.json({ sent: true });
}
