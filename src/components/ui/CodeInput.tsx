"use client";

import { useEffect, useId, useRef, type ClipboardEvent, type KeyboardEvent } from "react";

type Props = {
  value: string;
  onChange: (next: string) => void;
  /** Called once six digits are present, so the user never hunts for a button. */
  onComplete?: (code: string) => void;
  error?: string | null;
  disabled?: boolean;
  label: string;
};

const LENGTH = 6;

export function CodeInput({ value, onChange, onComplete, error, disabled, label }: Props) {
  const groupId = useId();
  const errorId = `${groupId}-error`;
  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(LENGTH).split("").slice(0, LENGTH);

  useEffect(() => {
    if (value.length === LENGTH) onComplete?.(value);
    // Re-firing on every keystroke would submit twice; only the length matters.
  }, [value, onComplete]);

  function write(next: string) {
    onChange(next.replace(/\D/g, "").slice(0, LENGTH));
  }

  function handleInput(index: number, raw: string) {
    const typed = raw.replace(/\D/g, "");
    if (!typed) return;
    const next = (value.slice(0, index) + typed + value.slice(index + typed.length))
      .replace(/\D/g, "")
      .slice(0, LENGTH);
    write(next);
    boxes.current[Math.min(index + typed.length, LENGTH - 1)]?.focus();
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      event.preventDefault();
      if (value[index]) {
        write(value.slice(0, index) + value.slice(index + 1));
      } else if (index > 0) {
        write(value.slice(0, index - 1) + value.slice(index));
        boxes.current[index - 1]?.focus();
      }
    }
    if (event.key === "ArrowLeft" && index > 0) boxes.current[index - 1]?.focus();
    if (event.key === "ArrowRight" && index < LENGTH - 1) boxes.current[index + 1]?.focus();
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    // Pasting the whole code from the email is the common case; make it work
    // from any box rather than only the first.
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, LENGTH);
    if (!pasted) return;
    write(pasted);
    boxes.current[Math.min(pasted.length, LENGTH - 1)]?.focus();
  }

  return (
    <div role="group" aria-labelledby={groupId} aria-describedby={error ? errorId : undefined}>
      <span id={groupId} className="sr-only">
        {label}
      </span>
      <div className="flex justify-between gap-1.5 sm:gap-2.5">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              boxes.current[index] = el;
            }}
            value={digit.trim()}
            disabled={disabled}
            onChange={(e) => handleInput(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            inputMode="numeric"
            // Lets iOS and Android offer the code straight from the SMS/email.
            autoComplete={index === 0 ? "one-time-code" : "off"}
            aria-label={`Digit ${index + 1} of ${LENGTH}`}
            maxLength={LENGTH}
            className={`h-14 w-full min-w-0 rounded-lg border bg-surface text-center text-xl font-medium
              tabular-nums text-body transition-colors focus:outline-none focus:ring-2
              focus:ring-brand-500/35 disabled:opacity-60 sm:h-16 sm:text-2xl ${
                error ? "border-bad-600 focus:border-bad-600" : "border-line-strong focus:border-brand-500"
              }`}
          />
        ))}
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-2.5 text-[13px] text-on-bad">
          {error}
        </p>
      )}
    </div>
  );
}
