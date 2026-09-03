"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { PanelLeftClose, PanelLeftOpen, Settings } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { MobileNav, SidebarNav } from "./AppNav";
import { UserMenu } from "./UserMenu";
import { WorkspaceSwitcher, type SwitcherWorkspace } from "./WorkspaceSwitcher";

const STORAGE_KEY = "piasowo:sidebar-collapsed";

/**
 * Desktop keeps the sidebar in place; it can be collapsed to an icon rail and
 * brought back from the same control, which never disappears. Mobile keeps the
 * overlay pattern, where a persistent rail would eat the screen.
 */
export function AppShell({
  user,
  workspaces,
  activeWorkspaceId,
  pendingCount,
  children,
}: {
  user: { name: string; email: string; avatarUrl?: string };
  workspaces: SwitcherWorkspace[];
  activeWorkspaceId: string;
  pendingCount: number;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Read after mount so the server and client markup agree on first paint.
  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "true");
    } catch {
      // Private mode or blocked storage: the default is fine.
    }
  }, []);

  function toggle() {
    setCollapsed((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // Preference simply won't persist; the toggle still works this session.
      }
      return next;
    });
  }

  const settingsActive = pathname.startsWith("/settings");

  return (
    <div className="min-h-dvh bg-sunken">
      <aside
        className={`fixed inset-y-0 left-0 z-20 hidden flex-col border-r border-line bg-surface py-4 transition-[width] lg:flex ${
          collapsed ? "w-[68px] px-2" : "w-60 px-3"
        }`}
      >
        <div className={`mb-6 flex items-center ${collapsed ? "justify-center" : "justify-between px-2"}`}>
          {!collapsed && (
            <Link href="/command-center" className="inline-flex rounded-md">
              <Logo />
            </Link>
          )}
          <button
            type="button"
            onClick={toggle}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="grid size-8 place-items-center rounded-lg text-subtle hover:bg-hover hover:text-body"
          >
            {collapsed ? (
              <PanelLeftOpen className="size-[18px]" aria-hidden="true" />
            ) : (
              <PanelLeftClose className="size-[18px]" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* The switcher sits above navigation because which business you are
            in changes what every item below it means. */}
        <div className={`mb-2 ${collapsed ? "" : "border-b border-line pb-2"}`}>
          <WorkspaceSwitcher
            workspaces={workspaces}
            activeId={activeWorkspaceId}
            collapsed={collapsed}
          />
        </div>

        <div className="flex-1">
          <SidebarNav pendingCount={pendingCount} collapsed={collapsed} />
        </div>

        <div className="space-y-1 border-t border-line pt-3">
          <Link
            href="/settings"
            aria-current={settingsActive ? "page" : undefined}
            title={collapsed ? "Settings" : undefined}
            className={`flex items-center gap-3 rounded-lg py-2 text-[14px] transition-colors ${
              collapsed ? "justify-center px-0" : "px-3"
            } ${
              settingsActive
                ? "bg-tint-brand font-medium text-on-brand"
                : "text-muted hover:bg-hover hover:text-body"
            }`}
          >
            <Settings className="size-[18px] shrink-0" aria-hidden="true" />
            {!collapsed && <span>Settings</span>}
          </Link>
          <UserMenu
            name={user.name}
            email={user.email}
            avatarUrl={user.avatarUrl}
            collapsed={collapsed}
          />
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-surface px-4 py-3 lg:hidden">
        <Link href="/command-center" className="inline-flex rounded-md">
          <Logo size={26} />
        </Link>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-sunken px-2 py-1 text-[11px] font-medium text-muted ring-1 ring-line">
            Sample data
          </span>
          <Link
            href="/settings"
            aria-label="Settings"
            className="grid size-9 place-items-center rounded-lg text-muted hover:bg-hover hover:text-body"
          >
            <Settings className="size-[18px]" aria-hidden="true" />
          </Link>
        </div>
      </header>

      <div className={collapsed ? "lg:pl-[68px]" : "lg:pl-60"}>
        <main
          id="main"
          className="mx-auto max-w-5xl px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8"
        >
          {children}
        </main>
      </div>

      <MobileNav pendingCount={pendingCount} />
    </div>
  );
}
