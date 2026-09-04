import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, readSession } from "@/lib/auth/session";

const PROTECTED = ["/command-center", "/missions", "/opportunities", "/workforce", "/onboarding"];
const AUTH_PAGES = ["/login", "/signup", "/forgot-password", "/verify"];

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = await readSession(request.cookies.get(SESSION_COOKIE)?.value);

  if (!session && PROTECTED.some((p) => pathname.startsWith(p))) {
    const login = new URL("/login", request.url);
    // Remember where they were headed so sign-in returns them there.
    if (pathname !== "/command-center") login.searchParams.set("next", pathname + search);
    return NextResponse.redirect(login);
  }

  if (session && AUTH_PAGES.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(
      new URL(session.onboarded ? "/command-center" : "/onboarding", request.url),
    );
  }

  // Onboarding is a gate, not a destination to wander away from.
  if (session && !session.onboarded && pathname.startsWith("/command-center")) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
