import { redirect } from "next/navigation";
import { currentSession } from "@/lib/auth/session";
import { transaction, type User, type Workspace } from "@/lib/auth/store";
import { buildWorkspace, type WorkspaceData } from "./sample-data";

/**
 * Loads the signed-in user plus their workspace contents for a server
 * component, redirecting rather than rendering a half-empty screen.
 */
export async function requireWorkspace(): Promise<{
  user: User;
  workspace: Workspace;
  data: WorkspaceData;
}> {
  const session = await currentSession();
  if (!session) redirect("/login");

  const user = await transaction((db) => db.users.find((u) => u.id === session.sub));
  if (!user) redirect("/login");
  if (!user.workspace) redirect("/onboarding");

  return { user, workspace: user.workspace, data: buildWorkspace(user.workspace) };
}

export async function requireUser(): Promise<User> {
  const session = await currentSession();
  if (!session) redirect("/login");
  const user = await transaction((db) => db.users.find((u) => u.id === session.sub));
  if (!user) redirect("/login");
  return user;
}
