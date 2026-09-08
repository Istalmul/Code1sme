import { NextResponse } from "next/server";
import { resetSchema } from "@/lib/auth/schema";
import { fail, fromZod } from "@/lib/auth/respond";
import { hashPassword } from "@/lib/auth/password";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/auth/session";
import { transaction } from "@/lib/auth/store";

const VERIFIED_WINDOW_MS = 10 * 60 * 1000;

/**
 * Final step of a password reset. Only reachable with a challenge whose code
 * was confirmed within the last ten minutes; the challenge is consumed here so
 * one code can set exactly one password.
 */
export async function POST(request: Request) {
  const parsed = resetSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fromZod(parsed.error);
  const { challengeId, password } = parsed.data;

  const passwordHash = await hashPassword(password);

  const outcome = await transaction((db) => {
    const challenge = db.challenges.find(
      (c) => c.id === challengeId && c.purpose === "password-reset",
    );
    if (!challenge?.verifiedAt) return { kind: "unverified" as const };
    if (Date.now() - challenge.verifiedAt > VERIFIED_WINDOW_MS) return { kind: "stale" as const };

    const user = db.users.find((u) => u.email === challenge.email);
    if (!user) return { kind: "unverified" as const };

    user.passwordHash = passwordHash;
    // Completing a reset proves inbox access, so the address is verified too.
    user.emailVerifiedAt ??= new Date().toISOString();
    if (!user.providers.includes("password")) user.providers.push("password");
    db.challenges = db.challenges.filter((c) => c.id !== challengeId);
    return { kind: "done" as const, user };
  });

  if (outcome.kind === "unverified") {
    return fail(400, "This reset link is no longer valid. Start again.");
  }
  if (outcome.kind === "stale") {
    return fail(410, "This reset took too long. Request a new code.");
  }

  const { user } = outcome;
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
