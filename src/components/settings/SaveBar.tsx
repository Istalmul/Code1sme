"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

/**
 * Explicit save, not save-on-blur.
 *
 * Settings that change how outreach behaves shouldn't commit while the user is
 * still deciding — and a visible confirmation is what tells them it worked.
 */
export function SaveBar({
  dirty,
  saving,
  saved,
  error,
  onSave,
  onReset,
}: {
  dirty: boolean;
  saving: boolean;
  saved: boolean;
  error?: string | null;
  onSave: () => void;
  onReset: () => void;
}) {
  return (
    <div className="sticky bottom-0 z-10 -mx-4 mt-6 border-t border-line bg-surface px-4 py-3 shadow-pop sm:mx-0 sm:rounded-xl sm:border">
      {error && (
        <div className="mb-3">
          <Alert tone="error">{error}</Alert>
        </div>
      )}
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] text-muted" role="status">
          {saved ? (
            <span className="inline-flex items-center gap-1.5 font-medium text-on-good">
              <Check className="size-4" aria-hidden="true" />
              Saved
            </span>
          ) : dirty ? (
            "Unsaved changes"
          ) : (
            "Everything is up to date"
          )}
        </p>
        <div className="flex gap-2">
          {dirty && (
            <Button size="sm" onClick={onReset} disabled={saving}>
              Discard
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={onSave}
            loading={saving}
            disabled={!dirty && !saving}
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
