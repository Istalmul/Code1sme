"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/**
 * A value meant to be pasted somewhere else, with a one-tap copy.
 *
 * Retyping a redirect URI by hand is how the trailing-slash mistake happens,
 * so the value is selectable and copyable rather than merely readable.
 */
export function CopyField({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be blocked; the text is selectable either way.
    }
  }

  return (
    <div className="rounded-lg border border-line bg-sunken">
      <div className="flex items-center justify-between gap-3 border-b border-line px-3.5 py-2">
        <span className="text-[12px] font-medium text-muted">{label}</span>
        <button
          type="button"
          onClick={copy}
          className="press inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium text-muted hover:bg-hover hover:text-body"
        >
          {copied ? (
            <Check className="size-3.5 text-on-good" aria-hidden="true" />
          ) : (
            <Copy className="size-3.5" aria-hidden="true" />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre
        className={`overflow-x-auto px-3.5 py-2.5 font-mono text-[13px] leading-relaxed text-body ${
          multiline ? "whitespace-pre" : "whitespace-nowrap"
        }`}
      >
        {value}
      </pre>
    </div>
  );
}
