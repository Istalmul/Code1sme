"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

/**
 * Type to filter, click to commit.
 *
 * A plain text field invites typos that silently split one industry into two;
 * a plain <select> makes a 30-item list a scroll hunt. This does both: filter
 * as you type, but never refuse a value that isn't on the list.
 */
export function Combobox({
  label,
  hint,
  options,
  value,
  onChange,
  placeholder,
  error,
}: {
  label: string;
  hint?: string;
  options: readonly string[];
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  error?: string | null;
}) {
  const id = useId();
  const listId = `${id}-list`;
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => setQuery(value), [value]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    function onDocument(event: MouseEvent) {
      if (!container.current?.contains(event.target as Node)) {
        setOpen(false);
        // Whatever is typed stands, even when it matched nothing — a niche
        // industry shouldn't be rejected just because it isn't in our list.
        onChange(query.trim());
      }
    }
    document.addEventListener("mousedown", onDocument);
    return () => document.removeEventListener("mousedown", onDocument);
  }, [open, query, onChange]);

  function commit(option: string) {
    onChange(option);
    setQuery(option);
    setOpen(false);
  }

  return (
    <div ref={container} className="relative">
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-body">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-invalid={error ? true : undefined}
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setActive((i) => Math.min(i + 1, matches.length - 1));
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => Math.max(i - 1, 0));
            }
            if (e.key === "Enter" && open && matches[active]) {
              e.preventDefault();
              commit(matches[active]);
            }
            if (e.key === "Escape") setOpen(false);
          }}
          onBlur={() => onChange(query.trim())}
          className={`h-11 w-full rounded-lg border bg-surface pl-3.5 pr-10 text-[15px] text-body
            placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-brand-500/35 ${
              error ? "border-bad-600" : "border-line-strong focus:border-brand-500"
            }`}
        />
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-subtle"
          aria-hidden="true"
        />
      </div>

      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1.5 max-h-64 w-full overflow-auto rounded-xl border border-line bg-surface py-1 shadow-pop"
        >
          {matches.length > 0 ? (
            matches.map((option, index) => (
              <li key={option}>
                <button
                  type="button"
                  role="option"
                  aria-selected={option === value}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => commit(option)}
                  className={`flex w-full items-center justify-between gap-2 px-3.5 py-2 text-left text-[14px] ${
                    index === active ? "bg-hover text-body" : "text-muted"
                  }`}
                >
                  {option}
                  {option === value && <Check className="size-4 text-brand-600" aria-hidden="true" />}
                </button>
              </li>
            ))
          ) : (
            <li className="px-3.5 py-2.5 text-[13px] text-muted">
              Not on our list — we&apos;ll use &ldquo;{query.trim()}&rdquo; as you typed it.
            </li>
          )}
        </ul>
      )}

      {error ? (
        <p role="alert" className="mt-1.5 text-[13px] text-on-bad">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-[13px] text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
