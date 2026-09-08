"use client";

import { useCallback, useState } from "react";

/**
 * Shared save mechanics for every settings screen: dirty tracking, a save
 * call, a transient "Saved" confirmation, and rollback on discard.
 */
export function useSettingsForm<T>(initial: T) {
  const [baseline, setBaseline] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);

  const update = useCallback((patch: Partial<T>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setSaved(false);
    setError(null);
  }, []);

  const save = useCallback(
    async (body: unknown) => {
      setSaving(true);
      setError(null);
      try {
        const response = await fetch("/api/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        if (!response.ok) {
          setError(payload.error ?? "Couldn't save. Please try again.");
          return false;
        }
        setBaseline(draft);
        setSaved(true);
        return true;
      } catch {
        setError("Couldn't reach Piasowo. Check your connection and try again.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [draft],
  );

  const reset = useCallback(() => {
    setDraft(baseline);
    setError(null);
    setSaved(false);
  }, [baseline]);

  return { draft, update, setDraft, dirty, saving, saved, error, save, reset };
}
