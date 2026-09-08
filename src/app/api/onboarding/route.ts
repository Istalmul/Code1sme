import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";
import { fromZod, fail } from "@/lib/auth/respond";
import {
  SESSION_COOKIE,
  currentSession,
  sessionCookieOptions,
  signSession,
} from "@/lib/auth/session";
import { transaction } from "@/lib/auth/store";
import {
  DEFAULT_APPEARANCE,
  DEFAULT_CRITERIA,
  DEFAULT_EMPLOYEE,
  DEFAULT_PROFILE,
} from "@/lib/settings/defaults";

const workspaceSchema = z.object({
  companyName: z.string().trim().min(1, "Enter your company name").max(120),
  website: z.string().trim().max(200).optional(),
  offering: z.string().trim().min(3, "Tell us what you sell").max(280),
  industry: z.string().trim().min(1, "Choose your industry"),
  targetMarkets: z.array(z.string()).min(1, "Choose at least one market"),
  companySizes: z.array(z.string()).min(1, "Choose at least one company size"),
  aiEmployee: z.object({
    name: z.string().trim().min(1, "Give your AI employee a name").max(40),
    role: z.string().min(1),
    tone: z.string().min(1),
    avatarSeed: z.string().min(1),
  }),
});

export async function POST(request: Request) {
  const session = await currentSession();
  if (!session) return fail(401, "Sign in to continue.");

  const parsed = workspaceSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fromZod(parsed.error);

  const user = await transaction((db) => {
    const found = db.users.find((u) => u.id === session.sub);
    if (!found) return null;
    // Onboarding collects identity; the operational settings arrive as
    // defaults the user can revise in Settings whenever they want to.
    const workspace = {
      ...parsed.data,
      id: crypto.randomUUID(),
      color: "blue" as const,
      aiEmployee: { ...parsed.data.aiEmployee, ...DEFAULT_EMPLOYEE },
      criteria: DEFAULT_CRITERIA,
      documents: [],
    };
    found.workspaces = [...(found.workspaces ?? []), workspace];
    found.activeWorkspaceId = workspace.id;
    found.appearance ??= DEFAULT_APPEARANCE;
    found.profile ??= DEFAULT_PROFILE;
    found.onboardingCompletedAt ??= new Date().toISOString();
    return found;
  });

  if (!user) return fail(401, "Sign in to continue.");

  const response = NextResponse.json({ ok: true });
  // The session carries `onboarded`, so it has to be reissued here or the
  // middleware would send the user straight back to onboarding.
  response.cookies.set(
    SESSION_COOKIE,
    await signSession({
      sub: user.id,
      email: user.email,
      name: user.name,
      onboarded: true,
    }),
    sessionCookieOptions(),
  );
  return response;
}
