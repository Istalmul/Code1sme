import bcrypt from "bcryptjs";

const COST = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * A dummy comparison used when no account exists for the submitted email, so
 * that a wrong email and a wrong password take the same amount of time.
 */
const DUMMY = "$2b$12$C6UzMDM.H6dfI/f/IKcEe.7jGqvWfN0lJnCk1kQfWJ5gGpHqZ8dPu";
export async function equaliseTiming(): Promise<void> {
  await bcrypt.compare("timing-equaliser", DUMMY);
}

export type Strength = { score: 0 | 1 | 2 | 3 | 4; label: string; hints: string[] };

/**
 * Feedback shown live under the password field. It reports what is missing
 * rather than only refusing, so the user can fix it in one pass.
 */
export function scorePassword(pw: string): Strength {
  const hints: string[] = [];
  if (pw.length < 10) hints.push("Use at least 10 characters");
  if (!/[a-z]/.test(pw) || !/[A-Z]/.test(pw)) hints.push("Mix upper and lower case");
  if (!/[0-9]/.test(pw) && !/[^\w\s]/.test(pw)) hints.push("Add a number or symbol");

  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw) || /[^\w\s]/.test(pw)) score++;
  const clamped = Math.min(4, score) as Strength["score"];

  const labels = ["Too short", "Weak", "Fair", "Good", "Strong"];
  return { score: clamped, label: labels[clamped], hints };
}
