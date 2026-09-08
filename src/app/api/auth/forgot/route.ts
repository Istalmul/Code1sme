import { NextResponse } from "next/server";
import { forgotSchema } from "@/lib/auth/schema";
import { fromZod, tooMany } from "@/lib/auth/respond";
import { clientIp, consume } from "@/lib/auth/rate-limit";
import { CODE_TTL_MS, generateCode, hashCode, newChallengeId } from "@/lib/auth/codes";
import { sendCodeEmail } from "@/lib/auth/email";
import { findUserByEmail, transaction } from "@/lib/auth/store";

/**
 * Starts a password reset.
 *
 * The response is identical whether or not the address has an account, so this
 * endpoint cannot be used to discover who is registered. A challenge id is
 * always returned; one for an unknown address simply never matches a code.
 */
export async function POST(request: Request) {
  const parsed = forgotSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fromZod(parsed.error);
  const { email } = parsed.data;

  for (const [action, id] of [
    ["code:ip", clientIp(request)],
    ["reset:email", email],
  ] as const) {
    const limit = await consume(action, id);
    if (!limit.allowed) return tooMany(limit.retryAfterSeconds);
  }

  const challengeId = newChallengeId();
  const code = generateCode();

  const user = await transaction((db) => {
    const found = findUserByEmail(db, email);
    db.challenges = db.challenges.filter(
      (c) => !(c.email === email && c.purpose === "password-reset"),
    );
    db.challenges.push({
      id: challengeId,
      email,
      purpose: "password-reset",
      // An unknown address gets an unguessable hash that no code can satisfy.
      codeHash: found ? hashCode(code, email) : hashCode(newChallengeId(), email),
      expiresAt: Date.now() + CODE_TTL_MS,
      attempts: 0,
      resends: 0,
      lastSentAt: Date.now(),
    });
    return found;
  });

  if (user) {
    try {
      await sendCodeEmail({ to: email, code, purpose: "password-reset" });
    } catch {
      // Still answer identically; the user can resend.
    }
  }

  return NextResponse.json({ challengeId, email });
}
