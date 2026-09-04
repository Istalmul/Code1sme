import type { ReactNode } from "react";
import { AppShell } from "@/components/piasowo/AppShell";
import { requireWorkspace } from "@/lib/piasowo/session-data";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { user, workspace, workspaces, data } = await requireWorkspace();
  const pending = data.opportunities.filter((o) => o.status === "awaiting-approval").length;

  return (
    <AppShell
      user={{ name: user.name, email: user.email, avatarUrl: user.avatarUrl }}
      workspaces={workspaces.map((w) => ({
        id: w.id,
        companyName: w.companyName,
        employeeName: w.aiEmployee.name,
        color: w.color,
        archived: w.archived,
      }))}
      activeWorkspaceId={workspace.id}
      pendingCount={pending}
    >
      {children}
    </AppShell>
  );
}
