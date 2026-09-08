"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Compass, Radar, Target, Users } from "lucide-react";

/**
 * Four destinations, matching how the product actually works: where you stand,
 * what to run, what was found, and who is doing it. No section exists here
 * because other tools have one.
 */
export const NAV = [
  { href: "/command-center", label: "Command Center", short: "Center", icon: Compass },
  { href: "/missions", label: "Missions", short: "Missions", icon: Target },
  { href: "/opportunities", label: "Opportunities", short: "Signals", icon: Radar },
  { href: "/workforce", label: "Workforce", short: "Team", icon: Users },
  { href: "/analytics", label: "Analytics", short: "Stats", icon: BarChart3 },
] as const;

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav({
  pendingCount,
  collapsed = false,
}: {
  pendingCount: number;
  collapsed?: boolean;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="space-y-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        const badge = href === "/opportunities" && pendingCount > 0;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            title={collapsed ? label : undefined}
            className={`relative flex items-center gap-3 rounded-lg py-2 text-[14px] transition-colors ${
              collapsed ? "justify-center px-0" : "px-3"
            } ${
              active
                ? "bg-tint-brand font-medium text-on-brand"
                : "text-muted hover:bg-hover hover:text-body"
            }`}
          >
            <span className="relative shrink-0">
              <Icon className="size-[18px]" aria-hidden="true" />
              {/* Collapsed has no room for a number, so the count becomes a dot
                  and the accessible name carries the detail. */}
              {badge && collapsed && (
                <span
                  className="absolute -right-1 -top-1 size-2 rounded-full bg-brand-600"
                  aria-label={`${pendingCount} awaiting your approval`}
                />
              )}
            </span>
            {!collapsed && (
              <>
                <span className="flex-1">{label}</span>
                {badge && (
                  <span
                    className="rounded-full bg-brand-600 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-white"
                    aria-label={`${pendingCount} awaiting your approval`}
                  >
                    {pendingCount}
                  </span>
                )}
              </>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNav({ pendingCount }: { pendingCount: number }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      // Sits above the home indicator on iOS rather than under it.
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="flex">
        {NAV.map(({ href, short, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
                  active ? "text-on-brand" : "text-muted"
                }`}
              >
                <span className="relative">
                  <Icon className="size-[22px]" aria-hidden="true" />
                  {href === "/opportunities" && pendingCount > 0 && (
                    <span
                      className="absolute -right-2 -top-1 grid min-w-4 place-items-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold tabular-nums text-white"
                      aria-label={`${pendingCount} awaiting your approval`}
                    >
                      {pendingCount}
                    </span>
                  )}
                </span>
                {short}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
