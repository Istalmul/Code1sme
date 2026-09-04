import type { Metadata } from "next";
import { requireWorkspace } from "@/lib/piasowo/session-data";
import { DEFAULT_CRITERIA } from "@/lib/settings/defaults";
import { WorkspaceForm } from "@/components/settings/WorkspaceForm";

export const metadata: Metadata = { title: "Workspace" };

export default async function WorkspaceSettingsPage() {
  const { workspace } = await requireWorkspace();
  return (
    <WorkspaceForm
      initial={{
        companyName: workspace.companyName,
        website: workspace.website ?? "",
        offering: workspace.offering,
        industry: workspace.industry,
        targetMarkets: workspace.targetMarkets,
        companySizes: workspace.companySizes,
        criteria: workspace.criteria ?? DEFAULT_CRITERIA,
      }}
      documents={workspace.documents ?? []}
      employeeName={workspace.aiEmployee.name}
    />
  );
}
