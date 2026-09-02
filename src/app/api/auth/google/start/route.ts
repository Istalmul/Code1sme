import { NextResponse } from "next/server";
import { authorizationUrl, createPkce, googleConfigured } from "@/lib/auth/google";

const TEN_MINUTES = 600;

export async function GET(request: Request) {
  if (!googleConfigured()) {
    return NextResponse.redirect(new URL("/login?error=google-unconfigured", request.url));
  }

  const pkce = createPkce();
  const response = NextResponse.redirect(authorizationUrl(pkce));

  // State, nonce and verifier travel in short-lived httpOnly cookies rather
  // than session storage, so the callback can validate them server-side.
  const options = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TEN_MINUTES,
  };
  response.cookies.set("g_state", pkce.state, options);
  response.cookies.set("g_nonce", pkce.nonce, options);
  response.cookies.set("g_verifier", pkce.verifier, options);
  return response;
}
