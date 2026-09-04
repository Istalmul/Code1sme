import type { Appearance, AiEmployeeSettings, ProfileDetails } from "@/lib/auth/store";

/**
 * Every setting has a defensible default, so a brand-new account behaves
 * sensibly before the user opens Settings even once.
 *
 * The cautious defaults are deliberate: the AI starts unpaused but approves
 * nothing automatically, and only sends during working hours on weekdays.
 * Trust is something the user grants later, not something we assume.
 */

export const DEFAULT_EMPLOYEE: Omit<AiEmployeeSettings, "name" | "role" | "tone" | "avatarSeed"> = {
  paused: false,
  approval: "every-message",
  dailyCap: 15,
  sendWindow: { start: 9, end: 18, weekends: false },
  hourlyCap: 4,
  followUp: { enabled: true, afterDays: 4, max: 1 },
  digest: "daily",
};

export const DEFAULT_APPEARANCE: Appearance = {
  theme: "system",
  accent: "blue",
  density: "comfortable",
  reduceMotion: false,
};

export const DEFAULT_PROFILE: ProfileDetails = {
  notifications: { strongOpportunity: true, reply: true, digest: true },
};

export const DEFAULT_CRITERIA = { minScore: 60, dealBreakers: "" };

/** Activity presets, so nobody has to guess what a good minimum score is. */
export const ACTIVITY_PRESETS = [
  {
    id: "light",
    label: "Light",
    summary: "Fewer, stronger opportunities. Good while you're still reading every one.",
    dailyCap: 8,
    hourlyCap: 2,
    minScore: 75,
  },
  {
    id: "balanced",
    label: "Balanced",
    summary: "A steady stream you can work through in a sitting.",
    dailyCap: 15,
    hourlyCap: 4,
    minScore: 60,
  },
  {
    id: "aggressive",
    label: "Aggressive",
    summary: "Maximum coverage. Expect more weak matches to sift through.",
    dailyCap: 40,
    hourlyCap: 8,
    minScore: 45,
  },
] as const;

export const ACCENTS = [
  { id: "blue", label: "Blue", swatch: "#2450d6" },
  { id: "teal", label: "Teal", swatch: "#0d7d72" },
  { id: "violet", label: "Violet", swatch: "#6d47c9" },
  { id: "amber", label: "Amber", swatch: "#a76500" },
  { id: "rose", label: "Rose", swatch: "#c0264f" },
] as const;

export const TIMEZONES = [
  "Europe/London", "Europe/Dublin", "Europe/Paris", "Europe/Berlin", "Europe/Lisbon",
  "Africa/Lagos", "Africa/Accra", "Africa/Nairobi", "Africa/Johannesburg",
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Toronto", "Asia/Dubai", "Asia/Singapore", "Australia/Sydney", "UTC",
] as const;

export const COUNTRIES = [
  "United Kingdom", "Ireland", "Nigeria", "Ghana", "Kenya", "South Africa",
  "United States", "Canada", "Germany", "France", "Netherlands", "Spain",
  "Portugal", "United Arab Emirates", "Singapore", "Australia", "New Zealand",
] as const;

/** Suggested names for a new business's AI employee. */
export const EMPLOYEE_NAME_POOL = ["Ada", "Nova", "Kene", "Juno", "Rio", "Sable"] as const;
