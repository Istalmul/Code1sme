"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Field, type FieldProps } from "./Field";
import { scorePassword } from "@/lib/auth/password";

const BARS = ["bg-bad-600", "bg-bad-600", "bg-warn-600", "bg-warn-600", "bg-good-600"];

type Props = Omit<FieldProps, "type" | "trailing"> & {
  /** Shows a live strength meter. Only used when choosing a password. */
  showStrength?: boolean;
  value: string;
};

export function PasswordField({ showStrength = false, value, ...rest }: Props) {
  const [visible, setVisible] = useState(false);
  const strength = showStrength && value ? scorePassword(value) : null;

  return (
    <div>
      <Field
        {...rest}
        value={value}
        type={visible ? "text" : "password"}
        trailing={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            // The label states the action, not the state, so it is unambiguous.
            aria-label={visible ? "Hide password" : "Show password"}
            className="mr-1 grid size-9 place-items-center rounded-md text-subtle hover:bg-hover hover:text-body"
          >
            {visible ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
          </button>
        }
      />

      {strength && (
        <div className="mt-2.5">
          <div className="flex items-center gap-2">
            <div className="flex h-1 flex-1 gap-1" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={`h-full flex-1 rounded-full transition-colors ${
                    i < strength.score ? BARS[strength.score] : "bg-line"
                  }`}
                />
              ))}
            </div>
            <span className="text-[12px] font-medium text-muted">{strength.label}</span>
          </div>
          {strength.hints.length > 0 && (
            <p className="mt-1.5 text-[13px] text-muted">{strength.hints[0]}</p>
          )}
        </div>
      )}
    </div>
  );
}
