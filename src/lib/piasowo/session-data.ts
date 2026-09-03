import { redirect } from "next/navigation";
import { currentSession } from "@/lib/auth/session";
import { activeWorkspace, transaction, type User, type Workspace } from "@/lib/auth/store";
import { buildWorkspace, type WorkspaceData } from "./sample-data";

/**
 * Loads the signed-in user and the workspace they are currently working in.
 *
 * Every screen goes through this, so nothing can accidentally read across
 * workspaces — the pipeline a page renders is always the active one's.
 */
export async function requireWorkspace(): Promise<{
  user: User;
  workspace: Workspace;
  /** Every workspace the user owns, archived ones included. */
  workspaces: Workspace[];
  data: WorkspaceData;
}> {
  const user = await requireUser();
  const workspace = activeWorkspace(user);
  if (!workspace) redirect("/onboarding");

  return {
    user,
    workspace,
    workspaces: user.workspaces,
    data: buildWorkspace(workspace),
  };
}

export async function requireUser(): Promise<User> {
  const session = await currentSession();
  if (!session) redirect("/login");
  const user = await transaction((db) => db.users.find((u) => u.id === session.sub));
  if (!user) redirect("/login");
  return user;
}
