import type { Metadata } from "next";
import { requireWorkspace } from "@/lib/piasowo/session-data";
import { DEFAULT_PROFILE } from "@/lib/settings/defaults";
import { ProfileForm } from "@/components/settings/ProfileForm";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfileSettingsPage() {
  const { user } = await requireWorkspace();
  return (
    <ProfileForm
      email={user.email}
      providers={user.providers}
      initial={{
        name: user.name,
        avatarUrl: user.avatarUrl ?? "",
        ...DEFAULT_PROFILE,
        ...user.profile,
      }}
    />
  );
}
