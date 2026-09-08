import { currentSession } from "@/lib/auth/session";
import { transaction, type Appearance } from "@/lib/auth/store";
import { DEFAULT_APPEARANCE } from "./defaults";

/**
 * Appearance is resolved on the server and stamped onto <html>, so the page
 * arrives already in the right theme. Doing it client-side would paint the
 * default first and flash.
 */
export async function loadAppearance(): Promise<Appearance> {
  const session = await currentSession();
  if (!session) return DEFAULT_APPEARANCE;
  const user = await transaction((db) => db.users.find((u) => u.id === session.sub));
  return user?.appearance ?? DEFAULT_APPEARANCE;
}

/** The attributes `<html>` needs for a given appearance. */
export function htmlAttributes(appearance: Appearance) {
  return {
    // "system" stamps nothing, letting prefers-color-scheme decide.
    ...(appearance.theme === "system" ? {} : { "data-theme": appearance.theme }),
    "data-accent": appearance.accent,
    "data-density": appearance.density,
    ...(appearance.reduceMotion ? { "data-reduce-motion": "true" } : {}),
  };
}
