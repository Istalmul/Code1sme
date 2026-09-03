import type { ReactNode } from "react";
import { AppShell } from "@/components/piasowo/AppShell";
import { requireWorkspace } from "@/lib/piasowo/session-data";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { user, data } = await requireWorkspace();
  const pending = data.opportunities.filter((o) => o.status === "awaiting-approval").length;

  return (
    <AppShell
      user={{ name: user.name, email: user.email, avatarUrl: user.avatarUrl }}
      pendingCount={pending}
    >
      {children}
    </AppShell>
  );
}
