import { NextResponse } from "next/server";
import type { ZodError } from "zod";

/**
 * A single response shape for every auth endpoint:
 *   { error: string, field?: string }
 * The client maps `field` to the input it belongs to and renders `error`
 * beneath it, so messages land where the user is looking.
 */
export type FieldError = { error: string; field?: string };

export function fail(status: number, error: string, field?: string) {
  return NextResponse.json<FieldError>({ error, field }, { status });
}

export function fromZod(issues: ZodError) {
  const first = issues.issues[0];
  return fail(400, first.message, first.path[0] ? String(first.path[0]) : undefined);
}

export function tooMany(retryAfterSeconds: number) {
  const minutes = Math.ceil(retryAfterSeconds / 60);
  return NextResponse.json<FieldError>(
    {
      error:
        minutes <= 1
          ? "Too many attempts. Try again in a minute."
          : `Too many attempts. Try again in about ${minutes} minutes.`,
    },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}
