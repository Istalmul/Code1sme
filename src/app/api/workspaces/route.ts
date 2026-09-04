import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";
import { fail, fromZod } from "@/lib/auth/respond";
import { currentSession } from "@/lib/auth/session";
import { transaction, type Workspace } from "@/lib/auth/store";
import { DEFAULT_CRITERIA, DEFAULT_EMPLOYEE } from "@/lib/settings/defaults";
import { suggestTargeting } from "@/lib/piasowo/recommend";

const MAX_WORKSPACES = 12;

const createSchema = z.object({
  action: z.literal("create"),
  companyName: z.string().trim().min(1, "Enter a name").max(120),
  industry: z.string().trim().min(1, "Choose an industry"),
  offering: z.string().trim().min(3, "Say what this business sells").max(280),
  employeeName: z.string().trim().min(1, "Give the AI employee a name").max(40),
  color: z.enum(["blue", "teal", "violet", "amber", "rose"]),
});

const targetSchema = z.object({
  action: z.enum(["switch", "archive", "restore", "duplicate", "delete"]),
  id: z.string().min(1),
});

const bodySchema = z.union([createSchema, targetSchema]);

export async function POST(request: Request) {
  const session = await currentSession();
  if (!session) return fail(401, "Sign in to continue.");

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fromZod(parsed.error);
  const body = parsed.data;

  const outcome = await transaction((db) => {
    const user = db.users.find((u) => u.id === session.sub);
    if (!user) return { kind: "no-user" as const };

    if (body.action === "create") {
      if (user.workspaces.length >= MAX_WORKSPACES) return { kind: "too-many" as const };
      const suggestion = suggestTargeting(body.industry);
      const workspace: Workspace = {
        id: crypto.randomUUID(),
        color: body.color,
        companyName: body.companyName,
        offering: body.offering,
        industry: body.industry,
        // Seeded from the industry, exactly as onboarding does — a second
        // business shouldn't start from a blank page either.
        targetMarkets: suggestion.industries,
        companySizes: suggestion.sizes,
        aiEmployee: {
          name: body.employeeName,
          role: "Prospector",
          tone: "Consultative",
          avatarSeed: body.employeeName.toLowerCase(),
          ...DEFAULT_EMPLOYEE,
        },
        criteria: { ...DEFAULT_CRITERIA },
        documents: [],
      };
      user.workspaces.push(workspace);
      user.activeWorkspaceId = workspace.id;
      return { kind: "ok" as const, id: workspace.id };
    }

    const index = user.workspaces.findIndex((w) => w.id === body.id);
    if (index === -1) return { kind: "not-found" as const };
    const target = user.workspaces[index];

    switch (body.action) {
      case "switch":
        if (target.archived) return { kind: "archived" as const };
        user.activeWorkspaceId = target.id;
        return { kind: "ok" as const, id: target.id };

      case "archive": {
        // Never leave the account with nothing to work in.
        if (user.workspaces.filter((w) => !w.archived).length <= 1) {
          return { kind: "last-one" as const };
        }
        target.archived = true;
        if (user.activeWorkspaceId === target.id) {
          user.activeWorkspaceId = user.workspaces.find((w) => !w.archived)?.id;
        }
        return { kind: "ok" as const, id: target.id };
      }

      case "restore":
        target.archived = false;
        return { kind: "ok" as const, id: target.id };

      case "duplicate": {
        if (user.workspaces.length >= MAX_WORKSPACES) return { kind: "too-many" as const };
        const copy: Workspace = {
          ...structuredClone(target),
          id: crypto.randomUUID(),
          companyName: `${target.companyName} (copy)`,
          archived: false,
        };
        user.workspaces.splice(index + 1, 0, copy);
        return { kind: "ok" as const, id: copy.id };
      }

      case "delete": {
        if (user.workspaces.length <= 1) return { kind: "last-one" as const };
        user.workspaces.splice(index, 1);
        if (user.activeWorkspaceId === target.id) {
          user.activeWorkspaceId = user.workspaces.find((w) => !w.archived)?.id;
        }
        return { kind: "ok" as const, id: target.id };
      }
    }
  });

  switch (outcome.kind) {
    case "no-user":
      return fail(401, "Sign in to continue.");
    case "not-found":
      return fail(404, "That business no longer exists.");
    case "archived":
      return fail(400, "Restore this business before switching to it.");
    case "last-one":
      return fail(400, "This is your only business — you can't remove it.");
    case "too-many":
      return fail(400, `You can run up to ${MAX_WORKSPACES} businesses.`);
    case "ok":
      return NextResponse.json({ ok: true, id: outcome.id });
  }
}
