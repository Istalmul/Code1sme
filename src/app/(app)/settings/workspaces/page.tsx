import type { Metadata } from "next";
import { requireWorkspace } from "@/lib/piasowo/session-data";
import { WorkspaceList } from "@/components/settings/WorkspaceList";

export const metadata: Metadata = { title: "Businesses" };

export default async function WorkspacesSettingsPage() {
  const { workspace, workspaces } = await requireWorkspace();
  return (
    <WorkspaceList
      activeId={workspace.id}
      workspaces={workspaces.map((w) => ({
        id: w.id,
        companyName: w.companyName,
        industry: w.industry,
        employeeName: w.aiEmployee.name,
        color: w.color ?? "blue",
        archived: Boolean(w.archived),
        paused: w.aiEmployee.paused,
        documents: w.documents?.length ?? 0,
      }))}
    />
  );
}
