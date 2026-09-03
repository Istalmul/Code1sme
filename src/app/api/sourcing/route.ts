import { NextResponse } from "next/server";
import { z } from "zod";
import { fail, fromZod } from "@/lib/auth/respond";
import { currentSession } from "@/lib/auth/session";
import { activeWorkspace, transaction } from "@/lib/auth/store";
import { clientIp, consume } from "@/lib/auth/rate-limit";
import { SourcingUnavailable, apolloConfigured, enrichProspect, findProspects } from "@/lib/sourcing/apollo";

const bodySchema = z.union([
  z.object({ action: z.literal("find"), count: z.number().int().min(1).max(25).default(10) }),
  z.object({ action: z.literal("enrich"), id: z.string().min(1) }),
  z.object({ action: z.literal("dismiss"), id: z.string().min(1) }),
]);

export async function POST(request: Request) {
  const session = await currentSession();
  if (!session) return fail(401, "Sign in to continue.");

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fromZod(parsed.error);
  const body = parsed.data;

  const user = await transaction((db) => db.users.find((u) => u.id === session.sub));
  const workspace = user ? activeWorkspace(user) : undefined;
  if (!user || !workspace) return fail(401, "Sign in to continue.");

  if (body.action === "dismiss") {
    await transaction((db) => {
      const target = activeWorkspace(db.users.find((u) => u.id === session.sub)!);
      if (target) target.sourced = (target.sourced ?? []).filter((p) => p.id !== body.id);
    });
    return NextResponse.json({ ok: true });
  }

  if (!apolloConfigured()) {
    return fail(
      503,
      "Apollo isn't connected. Add APOLLO_API_KEY to the server environment to source real prospects.",
    );
  }

  const limit = await consume("sourcing:ip", clientIp(request));
  if (!limit.allowed) return fail(429, "That's a lot of searches. Try again in a little while.");

  try {
    if (body.action === "find") {
      const found = await findProspects(workspace, body.count);

      const added = await transaction((db) => {
        const target = activeWorkspace(db.users.find((u) => u.id === session.sub)!);
        if (!target) return 0;
        const existing = new Set((target.sourced ?? []).map((p) => p.externalId ?? p.name));
        // Re-running a search shouldn't duplicate people already in the list.
        const fresh = found.filter((p) => !existing.has(p.externalId ?? p.name));
        target.sourced = [...fresh, ...(target.sourced ?? [])].slice(0, 200);
        return fresh.length;
      });

      return NextResponse.json({ ok: true, found: found.length, added });
    }

    const stored = (workspace.sourced ?? []).find((p) => p.id === body.id);
    if (!stored) return fail(404, "That prospect is no longer in this workspace.");

    const enriched = await enrichProspect(stored);
    await transaction((db) => {
      const target = activeWorkspace(db.users.find((u) => u.id === session.sub)!);
      if (!target) return;
      target.sourced = (target.sourced ?? []).map((p) => (p.id === body.id ? enriched : p));
    });
    return NextResponse.json({ ok: true, prospect: enriched });
  } catch (cause) {
    if (cause instanceof SourcingUnavailable) return fail(502, cause.message);
    console.error("[piasowo] sourcing failed", cause);
    return fail(502, "Apollo didn't respond. Please try again.");
  }
}
