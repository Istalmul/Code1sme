import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";
import { MobileNav, SidebarNav } from "@/components/piasowo/AppNav";
import { UserMenu } from "@/components/piasowo/UserMenu";
import { requireWorkspace } from "@/lib/piasowo/session-data";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { user, data } = await requireWorkspace();
  const pending = data.opportunities.filter((o) => o.status === "awaiting-approval").length;

  return (
    <div className="min-h-dvh bg-sunken">
      {/* Desktop: a persistent rail, so the user always knows where they are. */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-line bg-surface px-3 py-4 lg:flex">
        <div className="mb-6 flex items-center justify-between px-2">
          <Link href="/command-center" className="inline-flex rounded-md">
            <Logo />
          </Link>
          {/* The screens run on a fixed sample dataset, and say so. */}
          <span className="rounded-full bg-sunken px-2 py-0.5 text-[10px] font-medium text-muted ring-1 ring-line">
            Sample
          </span>
        </div>
        <div className="flex-1">
          <SidebarNav pendingCount={pending} />
        </div>
        <div className="border-t border-line pt-3">
          <UserMenu name={user.name} email={user.email} />
        </div>
      </aside>

      {/* Mobile: a compact bar, with navigation moved to the thumb zone. */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-surface px-4 py-3 lg:hidden">
        <Link href="/command-center" className="inline-flex rounded-md">
          <Logo size={26} />
        </Link>
        <span className="rounded-full bg-sunken px-2 py-1 text-[11px] font-medium text-muted ring-1 ring-line">
          Sample data
        </span>
      </header>

      <div className="lg:pl-60">
        <main id="main" className="mx-auto max-w-5xl px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">
          {children}
        </main>
      </div>

      <MobileNav pendingCount={pending} />
    </div>
  );
}
