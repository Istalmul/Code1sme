import crypto from "node:crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";

/**
 * Google sign-in over OpenID Connect, authorization-code flow with PKCE.
 *
 * Google already proves ownership of the email address, so accounts created
 * this way skip the 6-digit code entirely and are marked verified.
 */

/**
 * Google's endpoints, overridable outside production only.
 *
 * The override exists so the whole flow — including id_token verification —
 * can be exercised against a local stub. Honouring it in production would let
 * an environment variable redirect authentication at an attacker's issuer, so
 * it is ignored there.
 */
const OVERRIDE = process.env.NODE_ENV !== "production" ? process.env.GOOGLE_OIDC_BASE_URL : undefined;

const AUTH_ENDPOINT = OVERRIDE
  ? `${OVERRIDE}/auth`
  : "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = OVERRIDE ? `${OVERRIDE}/token` : "https://oauth2.googleapis.com/token";
const ISSUER = OVERRIDE ?? "https://accounts.google.com";
const JWKS = createRemoteJWKSet(
  new URL(OVERRIDE ? `${OVERRIDE}/certs` : "https://www.googleapis.com/oauth2/v3/certs"),
);

export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

/**
 * The origin this request actually arrived on.
 *
 * Hardcoding localhost breaks the moment the app runs anywhere else — a
 * Codespace, a preview deploy, a tunnel — because Google matches the redirect
 * URI exactly and rejects anything it wasn't told about. Reading it from the
 * request means the URI is always right for wherever you are running.
 *
 * APP_ORIGIN still wins where it is set, for production behind a proxy that
 * doesn't forward the public host.
 */
export function originOf(request: Request): string {
  const configured = process.env.APP_ORIGIN?.trim();
  if (configured) return configured.replace(/\/$/, "");

  const headers = request.headers;
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  if (!host) return new URL(request.url).origin;

  // Anything that isn't plain localhost is served over TLS in practice.
  const forwardedProto = headers.get("x-forwarded-proto")?.split(",")[0].trim();
  const proto = forwardedProto ?? (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  return `${proto}://${host}`;
}

export function redirectUri(request: Request): string {
  return `${originOf(request)}/api/auth/google/callback`;
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

export function authorizationUrl(pkce: Pkce, request: Request): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(request),
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

export async function exchangeCode(
  code: string,
  verifier: string,
  nonce: string,
  request: Request,
): Promise<GoogleProfile> {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri(request),
      code_verifier: verifier,
    }),
  });

  if (!response.ok) {
    // Google's own error body names the cause — nearly always a redirect URI
    // that wasn't registered — so it is worth logging rather than swallowing.
    const detail = await response.text().catch(() => "");
    throw new Error(`Token exchange failed (${response.status}): ${detail.slice(0, 300)}`);
  }
  const tokens = (await response.json()) as { id_token?: string };
  if (!tokens.id_token) throw new Error("Google response did not include an id_token.");

  const { payload } = await jwtVerify(tokens.id_token, JWKS, {
    issuer: OVERRIDE ? [ISSUER] : [ISSUER, "accounts.google.com"],
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
