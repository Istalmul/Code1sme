import crypto from "node:crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";

/**
 * Google sign-in over OpenID Connect, authorization-code flow with PKCE.
 *
 * Google already proves ownership of the email address, so accounts created
 * this way skip the 6-digit code entirely and are marked verified.
 */

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const ISSUER = "https://accounts.google.com";
const JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function redirectUri(): string {
  const origin = process.env.APP_ORIGIN ?? "http://localhost:3000";
  return `${origin.replace(/\/$/, "")}/api/auth/google/callback`;
}

export type Pkce = { verifier: string; challenge: string; state: string; nonce: string };

export function createPkce(): Pkce {
  const verifier = crypto.randomBytes(32).toString("base64url");
  const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");
  return {
    verifier,
    challenge,
    state: crypto.randomBytes(16).toString("base64url"),
    nonce: crypto.randomBytes(16).toString("base64url"),
  };
}

export function authorizationUrl(pkce: Pkce): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state: pkce.state,
    nonce: pkce.nonce,
    code_challenge: pkce.challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  });
  return `${AUTH_ENDPOINT}?${params}`;
}

export type GoogleProfile = {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string;
  picture?: string;
};

export async function exchangeCode(code: string, verifier: string, nonce: string): Promise<GoogleProfile> {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri(),
      code_verifier: verifier,
    }),
  });

  if (!response.ok) throw new Error(`Token exchange failed: ${response.status}`);
  const tokens = (await response.json()) as { id_token?: string };
  if (!tokens.id_token) throw new Error("Google response did not include an id_token.");

  const { payload } = await jwtVerify(tokens.id_token, JWKS, {
    issuer: [ISSUER, "accounts.google.com"],
    audience: process.env.GOOGLE_CLIENT_ID!,
  });

  if (payload.nonce !== nonce) throw new Error("Nonce mismatch on Google id_token.");
  if (!payload.email) throw new Error("Google account has no email address.");

  return {
    sub: String(payload.sub),
    email: String(payload.email).toLowerCase(),
    emailVerified: payload.email_verified === true,
    name: String(payload.name ?? String(payload.email).split("@")[0]),
    picture: payload.picture ? String(payload.picture) : undefined,
  };
}
