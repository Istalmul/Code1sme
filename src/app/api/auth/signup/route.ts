import { NextResponse } from "next/server";
import { signupSchema } from "@/lib/auth/schema";
import { fail, fromZod, tooMany } from "@/lib/auth/respond";
import { clientIp, consume } from "@/lib/auth/rate-limit";
import { hashPassword } from "@/lib/auth/password";
import { CODE_TTL_MS, generateCode, hashCode, newChallengeId } from "@/lib/auth/codes";
import { sendCodeEmail } from "@/lib/auth/email";
import { findUserByEmail, transaction } from "@/lib/auth/store";

/**
 * Step 1 of sign-up: name, email, password.
 *
 * No account exists yet at this point — the details are held on the challenge
 * and only become a user once the emailed code is confirmed. That is what
 * makes an unverified account impossible rather than merely discouraged.
 */
export async function POST(request: Request) {
  const parsed = signupSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fromZod(parsed.error);
  const { name, email, password } = parsed.data;

  const limit = await consume("signup:ip", clientIp(request));
  if (!limit.allowed) return tooMany(limit.retryAfterSeconds);

  const existing = await transaction((db) => findUserByEmail(db, email));
  if (existing) {
    return fail(409, "An account already exists for this email. Sign in instead.", "email");
  }

  const code = generateCode();
  const passwordHash = await hashPassword(password);
  const challengeId = newChallengeId();

  await transaction((db) => {
    // Replace any earlier signup challenge for this address.
    db.challenges = db.challenges.filter((c) => !(c.email === email && c.purpose === "signup"));
    db.challenges.push({
      id: challengeId,
      email,
      purpose: "signup",
      codeHash: hashCode(code, email),
      expiresAt: Date.now() + CODE_TTL_MS,
      attempts: 0,
      resends: 0,
      lastSentAt: Date.now(),
      pendingUser: { name, passwordHash },
    });
  });

  try {
    await sendCodeEmail({ to: email, code, purpose: "signup" });
  } catch {
    return fail(502, "We couldn't send the verification email. Please try again.");
  }

  return NextResponse.json({ challengeId, email });
}
