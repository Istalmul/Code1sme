import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";
import { fail, fromZod } from "@/lib/auth/respond";
import {
  SESSION_COOKIE,
  currentSession,
  sessionCookieOptions,
  signSession,
} from "@/lib/auth/session";
import { activeWorkspace, transaction } from "@/lib/auth/store";
import { DEFAULT_APPEARANCE, DEFAULT_CRITERIA, DEFAULT_PROFILE } from "@/lib/settings/defaults";

/** Roughly 1.4MB of base64, which comfortably holds a 256px avatar. */
const MAX_AVATAR_CHARS = 1_400_000;
const MAX_DOCUMENT_CHARS = 200_000;

const appearanceSchema = z.object({
  theme: z.enum(["system", "light", "dark"]),
  accent: z.enum(["blue", "teal", "violet", "amber", "rose"]),
  density: z.enum(["comfortable", "compact"]),
  reduceMotion: z.boolean(),
});

const profileSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(80),
  jobTitle: z.string().trim().max(80).optional(),
  phone: z.string().trim().max(32).optional(),
  country: z.string().trim().max(60).optional(),
  timezone: z.string().trim().max(60).optional(),
  // Only data: URLs are accepted, so this field can never point the app at a
  // third-party host or be used to smuggle a tracking pixel into the UI.
  avatarUrl: z
    .string()
    .max(MAX_AVATAR_CHARS, "That image is too large — try a smaller one")
    .refine((v) => v === "" || v.startsWith("data:image/"), "Unsupported image")
    .optional(),
  notifications: z.object({
    strongOpportunity: z.boolean(),
    reply: z.boolean(),
    digest: z.boolean(),
  }),
});

const employeeSchema = z.object({
  name: z.string().trim().min(1, "Give your AI employee a name").max(40),
  role: z.string().min(1),
  tone: z.string().min(1),
  paused: z.boolean(),
  approval: z.enum(["every-message", "first-five", "automatic"]),
  dailyCap: z.number().int().min(1).max(200),
  hourlyCap: z.number().int().min(1).max(60),
  sendWindow: z.object({
    start: z.number().int().min(0).max(23),
    end: z.number().int().min(1).max(24),
    weekends: z.boolean(),
  }),
  followUp: z.object({
    enabled: z.boolean(),
    afterDays: z.number().int().min(1).max(30),
    max: z.number().int().min(1).max(2),
  }),
  digest: z.enum(["daily", "twice-daily", "off"]),
});

const workspaceSchema = z.object({
  companyName: z.string().trim().min(1, "Enter your company name").max(120),
  website: z.string().trim().max(200).optional(),
  offering: z.string().trim().min(3, "Tell us what you sell").max(280),
  industry: z.string().trim().min(1, "Choose your industry"),
  targetMarkets: z.array(z.string()).min(1, "Choose at least one market"),
  companySizes: z.array(z.string()).min(1, "Choose at least one company size"),
  criteria: z.object({
    minScore: z.number().int().min(0).max(100),
    dealBreakers: z.string().max(500),
  }),
});

const documentSchema = z.object({
  name: z.string().trim().min(1).max(120),
  text: z.string().trim().min(1, "That file had no readable text").max(MAX_DOCUMENT_CHARS),
});

const bodySchema = z.object({
  appearance: appearanceSchema.optional(),
  profile: profileSchema.optional(),
  employee: employeeSchema.optional(),
  workspace: workspaceSchema.optional(),
  addDocument: documentSchema.optional(),
  removeDocumentId: z.string().optional(),
  /**
   * The minimum score lives on the workspace but is edited from the AI
   * employee screen, where it reads as "how much work reaches me".
   */
  workspaceCriteriaMinScore: z.number().int().min(0).max(100).optional(),
  connect: z
    .object({
      channel: z.enum(["email", "whatsapp"]),
      address: z.string().trim().min(3, "Enter the address to send from").max(120),
    })
    .optional(),
  disconnect: z.enum(["email", "whatsapp"]).optional(),
});

/**
 * One endpoint for every setting.
 *
 * The body carries only the sections the screen actually edits, so a page that
 * changes the theme cannot accidentally clobber the workspace by sending a
 * stale copy of it.
 */
export async function PATCH(request: Request) {
  const session = await currentSession();
  if (!session) return fail(401, "Sign in to continue.");

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fromZod(parsed.error);
  const patch = parsed.data;

  const outcome = await transaction((db) => {
    const user = db.users.find((u) => u.id === session.sub);
    if (!user) return null;

    if (patch.appearance) {
      user.appearance = patch.appearance;
    }

    if (patch.profile) {
      const { name, avatarUrl, ...details } = patch.profile;
      user.name = name;
      if (avatarUrl !== undefined) {
        user.avatarUrl = avatarUrl === "" ? undefined : avatarUrl;
      }
      user.profile = { ...DEFAULT_PROFILE, ...user.profile, ...details };
    }

    // Workspace edits always target the active one, never "the workspace".
    const workspace = activeWorkspace(user);
    if (workspace) {
      if (patch.employee) {
        workspace.aiEmployee = {
          ...workspace.aiEmployee,
          ...patch.employee,
          avatarSeed: patch.employee.name.toLowerCase(),
        };
      }
      if (patch.workspace) {
        Object.assign(workspace, patch.workspace);
      }
      if (patch.addDocument) {
        workspace.documents = [
          ...(workspace.documents ?? []),
          {
            id: crypto.randomUUID(),
            name: patch.addDocument.name,
            text: patch.addDocument.text,
            addedAt: new Date().toISOString(),
          },
        ];
      }
      if (patch.removeDocumentId) {
        workspace.documents = (workspace.documents ?? []).filter(
          (d) => d.id !== patch.removeDocumentId,
        );
      }
      workspace.criteria ??= DEFAULT_CRITERIA;
      if (patch.workspaceCriteriaMinScore !== undefined) {
        workspace.criteria.minScore = patch.workspaceCriteriaMinScore;
      }
    }

    if (patch.connect) {
      const now = new Date().toISOString();
      user.connections = {
        ...user.connections,
        [patch.connect.channel]: {
          address: patch.connect.address,
          connectedAt: now,
          // Warm-up starts the moment an account is connected; reconnecting
          // the same address should not reset the clock in a real system.
          warmupStartedAt: user.connections?.[patch.connect.channel]?.warmupStartedAt ?? now,
        },
      };
    }

    if (patch.disconnect && user.connections) {
      delete user.connections[patch.disconnect];
    }

    user.appearance ??= DEFAULT_APPEARANCE;
    return user;
  });

  if (!outcome) return fail(401, "Sign in to continue.");

  const response = NextResponse.json({ ok: true });
  // The session carries the display name, so renaming has to reissue it or the
  // greeting keeps using the old one until the next sign-in.
  if (patch.profile) {
    response.cookies.set(
      SESSION_COOKIE,
      await signSession({
        sub: outcome.id,
        email: outcome.email,
        name: outcome.name,
        onboarded: Boolean(outcome.onboardingCompletedAt),
      }),
      sessionCookieOptions(),
    );
  }
  return response;
}
