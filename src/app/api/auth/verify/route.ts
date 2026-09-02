import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { verifySchema } from "@/lib/auth/schema";
import { fail, fromZod, tooMany } from "@/lib/auth/respond";
import { clientIp, consume } from "@/lib/auth/rate-limit";
import { checkCode } from "@/lib/auth/codes";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/auth/session";
import { transaction, type User } from "@/lib/auth/store";

/**
 * Confirms a 6-digit code.
 *
 * For sign-up this is the moment the account is created and the user is signed
 * in. For a password reset it only unlocks the final step — the challenge is
 * marked verified and the new password is set by /api/auth/reset.
 */
export async function POST(request: Request) {
  const parsed = verifySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fromZod(parsed.error);
  const { challengeId, code } = parsed.data;

  const limit = await consume("code:ip", clientIp(request));
  if (!limit.allowed) return tooMany(limit.retryAfterSeconds);

  const outcome = await transaction((db) => {
    const challenge = db.challenges.find((c) => c.id === challengeId);
    if (!challenge) return { kind: "missing" as const };

    const result = checkCode(challenge, code);
    if (!result.ok) return { kind: result.reason, remaining: result.remaining };

    if (challenge.purpose === "password-reset") {
      challenge.verifiedAt = Date.now();
      return { kind: "reset-ready" as const };
    }

    const pending = challenge.pendingUser;
    if (!pending) return { kind: "missing" as const };

    // Guard the race where the same address signed up twice before verifying.
    if (db.users.some((u) => u.email === challenge.email)) {
      return { kind: "already-exists" as const };
    }

    const user: User = {
      id: crypto.randomUUID(),
      email: challenge.email,
      name: pending.name,
      passwordHash: pending.passwordHash,
      emailVerifiedAt: new Date().toISOString(),
      providers: ["password"],
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    db.challenges = db.challenges.filter((c) => c.id !== challengeId);
    return { kind: "signed-up" as const, user };
  });

  switch (outcome.kind) {
    case "missing":
      return fail(400, "This verification session has expired. Start again.", "code");
    case "expired":
      return fail(410, "That code has expired. Send a new one.", "code");
    case "too-many-attempts":
      return fail(429, "Too many incorrect codes. Send a new one to continue.", "code");
    case "incorrect":
      return fail(
        400,
        outcome.remaining === 1
          ? "That code isn't right. 1 attempt left."
          : `That code isn't right. ${outcome.remaining} attempts left.`,
        "code",
      );
    case "already-exists":
      return fail(409, "An account already exists for this email. Sign in instead.", "code");
    case "reset-ready":
      return NextResponse.json({ next: "set-password" as const });
    case "signed-up": {
      const { user } = outcome;
      const response = NextResponse.json({ next: "onboarding" as const });
      response.cookies.set(
        SESSION_COOKIE,
        await signSession({ sub: user.id, email: user.email, name: user.name, onboarded: false }),
        sessionCookieOptions(),
      );
      return response;
    }
  }
}
