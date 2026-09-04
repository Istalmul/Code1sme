import type { Metadata } from "next";
import { requireWorkspace } from "@/lib/piasowo/session-data";
import { DEFAULT_CRITERIA } from "@/lib/settings/defaults";
import { EmployeeForm } from "@/components/settings/EmployeeForm";

export const metadata: Metadata = { title: "AI employee" };

export default async function EmployeeSettingsPage() {
  const { workspace } = await requireWorkspace();
  return (
    <EmployeeForm
      initial={workspace.aiEmployee}
      minScore={(workspace.criteria ?? DEFAULT_CRITERIA).minScore}
    />
  );
}
