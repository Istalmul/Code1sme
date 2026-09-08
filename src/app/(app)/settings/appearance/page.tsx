import type { Metadata } from "next";
import { requireWorkspace } from "@/lib/piasowo/session-data";
import { DEFAULT_APPEARANCE } from "@/lib/settings/defaults";
import { AppearanceForm } from "@/components/settings/AppearanceForm";

export const metadata: Metadata = { title: "Appearance" };

export default async function AppearanceSettingsPage() {
  const { user } = await requireWorkspace();
  return <AppearanceForm initial={user.appearance ?? DEFAULT_APPEARANCE} />;
}
