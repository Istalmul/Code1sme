import { NextResponse } from "next/server";
import { fail } from "@/lib/auth/respond";
import { currentSession } from "@/lib/auth/session";
import { activeWorkspace, transaction } from "@/lib/auth/store";
import { buildWorkspace } from "@/lib/piasowo/sample-data";
import { analyseOpportunity, draftOutreach } from "@/lib/ai/tasks";
import { clientIp, consume } from "@/lib/auth/rate-limit";

/**
 * Studies the company, then writes to it — two steps, because the analysis is
 * worth showing on its own. Model calls cost money and take seconds, so this
 * is explicitly requested rather than run on page load.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await currentSession();
  if (!session) return fail(401, "Sign in to continue.");

  const limit = await consume("ai:ip", clientIp(request));
  if (!limit.allowed) {
    return fail(429, "That's a lot of drafts at once. Give it a minute.");
  }

  const { id } = await params;
  const user = await transaction((db) => db.users.find((u) => u.id === session.sub));
  const workspace = user ? activeWorkspace(user) : undefined;
  if (!workspace) return fail(401, "Sign in to continue.");

  if (workspace.aiEmployee.paused) {
    return fail(409, `${workspace.aiEmployee.name} is paused. Resume them in Settings first.`);
  }

  const opportunity = buildWorkspace(workspace).opportunities.find((o) => o.id === id);
  if (!opportunity) return fail(404, "That opportunity is no longer in this workspace.");

  const analysis = await analyseOpportunity(workspace, opportunity);
  const draft = await draftOutreach(workspace, opportunity, analysis.value);

  return NextResponse.json({
    analysis: analysis.value,
    draft: draft.value,
    // The UI states which of these the user is looking at, every time.
    usedAI: analysis.usedAI && draft.usedAI,
    model: draft.model ?? analysis.model ?? null,
    note: draft.note ?? analysis.note ?? null,
  });
}
