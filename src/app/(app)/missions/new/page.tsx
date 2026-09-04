import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireWorkspace } from "@/lib/piasowo/session-data";
import { suggestFirstMission } from "@/lib/piasowo/recommend";
import { MissionForm } from "@/components/missions/MissionForm";

export const metadata: Metadata = { title: "New mission" };

export default async function NewMissionPage() {
  const { workspace, data } = await requireWorkspace();

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/missions"
        className="inline-flex items-center gap-1.5 rounded text-[13px] text-muted hover:text-body"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Missions
      </Link>

      <header className="mb-6 mt-4">
        <h1 className="text-[22px] font-semibold tracking-tight sm:text-2xl">New mission</h1>
        <p className="mt-1.5 text-[15px] text-muted">
          Review the setup below and launch. Nothing here is permanent — every setting can be
          changed while the mission runs.
        </p>
      </header>

      <MissionForm
        defaults={suggestFirstMission(workspace)}
        employeeName={data.employees[0].name}
      />
    </div>
  );
}
