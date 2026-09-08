import { NextResponse } from "next/server";
import { loginSchema } from "@/lib/auth/schema";
import { fail, fromZod, tooMany } from "@/lib/auth/respond";
import { clientIp, consume } from "@/lib/auth/rate-limit";
import { equaliseTiming, verifyPassword } from "@/lib/auth/password";
import { CODE_TTL_MS, generateCode, hashCode, newChallengeId } from "@/lib/auth/codes";
import { sendCodeEmail } from "@/lib/auth/email";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/auth/session";
import { findUserByEmail, transaction } from "@/lib/auth/store";

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fromZod(parsed.error);
  const { email, password } = parsed.data;

  for (const [action, id] of [
    ["login:ip", clientIp(request)],
    ["login:email", email],
  ] as const) {
    const limit = await consume(action, id);
    if (!limit.allowed) return tooMany(limit.retryAfterSeconds);
  }

  const user = await transaction((db) => findUserByEmail(db, email));

  // Wrong-email and wrong-password must be indistinguishable, in both the
  // message and the time taken.
  const invalid = fail(401, "That email and password don't match an account.", "password");
  if (!user?.passwordHash) {
    await equaliseTiming();
    if (user && user.providers.includes("google")) {
      return fail(
        401,
        "This account uses Google. Continue with Google to sign in.",
        "email",
      );
    }
    return invalid;
  }
  if (!(await verifyPassword(password, user.passwordHash))) return invalid;

  // An account can only exist verified, but a legacy or imported record might
  // not be — in that case finish verification rather than refuse the sign-in.
  if (!user.emailVerifiedAt) {
    const code = generateCode();
    const challengeId = newChallengeId();
    await transaction((db) => {
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
      });
    });
    await sendCodeEmail({ to: email, code, purpose: "signup" });
    return NextResponse.json({ next: "verify" as const, challengeId, email }, { status: 200 });
  }

  const response = NextResponse.json({
    next: user.onboardingCompletedAt ? ("command-center" as const) : ("onboarding" as const),
  });
  response.cookies.set(
    SESSION_COOKIE,
    await signSession({
      sub: user.id,
      email: user.email,
      name: user.name,
      onboarded: Boolean(user.onboardingCompletedAt),
    }),
    sessionCookieOptions(),
  );
  return response;
}
