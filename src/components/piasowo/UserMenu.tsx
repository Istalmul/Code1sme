"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut } from "lucide-react";

export function UserMenu({ name, email }: { name: string; email: string }) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  useEffect(() => {
    if (!open) return;
    function onDocument(event: MouseEvent) {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    }
    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocument);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onDocument);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  return (
    <div ref={container} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-hover"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink-700 text-[12px] font-semibold text-white">
          {initials}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium text-body">{name}</span>
          <span className="block truncate text-[12px] text-subtle">{email}</span>
        </span>
        <ChevronDown className="size-4 shrink-0 text-subtle" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute bottom-full left-0 z-40 mb-2 w-full min-w-[200px] overflow-hidden rounded-xl border border-line bg-surface shadow-pop"
        >
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] text-body hover:bg-hover"
            >
              <LogOut className="size-4 text-subtle" aria-hidden="true" />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
