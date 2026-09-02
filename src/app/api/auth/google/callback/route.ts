import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { exchangeCode, googleConfigured } from "@/lib/auth/google";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/auth/session";
import { transaction, type User } from "@/lib/auth/store";

function backToLogin(request: Request, error: string) {
  const response = NextResponse.redirect(new URL(`/login?error=${error}`, request.url));
  for (const name of ["g_state", "g_nonce", "g_verifier"]) response.cookies.delete(name);
  return response;
}

/**
 * Completes Google sign-in.
 *
 * The same endpoint serves both cases the brief calls for: an unknown Google
 * account creates a user, a known one signs in. Neither is asked to re-enter a
 * name or verify an email Google has already verified.
 */
export async function GET(request: Request) {
  if (!googleConfigured()) return backToLogin(request, "google-unconfigured");

  const url = new URL(request.url);
  if (url.searchParams.get("error")) return backToLogin(request, "google-cancelled");

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieHeader = request.headers.get("cookie") ?? "";
  const jar = Object.fromEntries(
    cookieHeader.split(";").map((part) => {
      const [k, ...v] = part.trim().split("=");
      return [k, decodeURIComponent(v.join("="))];
    }),
  );

  if (!code || !state || !jar.g_state || state !== jar.g_state || !jar.g_verifier || !jar.g_nonce) {
    return backToLogin(request, "google-failed");
  }

  let profile;
  try {
    profile = await exchangeCode(code, jar.g_verifier, jar.g_nonce);
  } catch (cause) {
    console.error("[piasowo] google callback failed", cause);
    return backToLogin(request, "google-failed");
  }

  if (!profile.emailVerified) return backToLogin(request, "google-unverified");

  const user = await transaction((db) => {
    const existing = db.users.find(
      (u) => u.googleSub === profile.sub || u.email === profile.email,
    );

    if (existing) {
      // Linking Google to an account created with a password is safe here
      // because Google asserts the same, verified address.
      existing.googleSub ??= profile.sub;
      if (!existing.providers.includes("google")) existing.providers.push("google");
      existing.emailVerifiedAt ??= new Date().toISOString();
      existing.avatarUrl ??= profile.picture;
      return existing;
    }

    const created: User = {
      id: crypto.randomUUID(),
      email: profile.email,
      name: profile.name,
      emailVerifiedAt: new Date().toISOString(),
      providers: ["google"],
      googleSub: profile.sub,
      avatarUrl: profile.picture,
      createdAt: new Date().toISOString(),
    };
    db.users.push(created);
    return created;
  });

  const destination = user.onboardingCompletedAt ? "/command-center" : "/onboarding";
  const response = NextResponse.redirect(new URL(destination, request.url));
  for (const name of ["g_state", "g_nonce", "g_verifier"]) response.cookies.delete(name);
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
