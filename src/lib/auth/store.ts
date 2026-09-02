import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Development-grade persistence.
 *
 * Everything the auth flow needs goes through this module, so swapping in a
 * real database means reimplementing this one file rather than touching the
 * route handlers.
 */

export type AuthProvider = "password" | "google";

export type User = {
  id: string;
  email: string;
  name: string;
  /** Absent for accounts created through Google. */
  passwordHash?: string;
  emailVerifiedAt?: string;
  providers: AuthProvider[];
  googleSub?: string;
  avatarUrl?: string;
  createdAt: string;
  /** Set once the user finishes onboarding; drives the post-login redirect. */
  onboardingCompletedAt?: string;
  workspace?: Workspace;
};

export type Workspace = {
  companyName: string;
  website?: string;
  /** What the business sells, in the user's words. */
  offering: string;
  industry: string;
  targetMarkets: string[];
  companySizes: string[];
  aiEmployee: { name: string; role: string; tone: string; avatarSeed: string };
};

/** A pending 6-digit code. The code itself is never stored in the clear. */
export type Challenge = {
  id: string;
  email: string;
  purpose: "signup" | "password-reset";
  codeHash: string;
  expiresAt: number;
  attempts: number;
  resends: number;
  lastSentAt: number;
  /** Populated for signup so the account can be created on verification. */
  pendingUser?: { name: string; passwordHash: string };
  /** Set once the code is confirmed, allowing the final step to proceed. */
  verifiedAt?: number;
};

type Db = {
  users: User[];
  challenges: Challenge[];
  hits: Record<string, number[]>;
};

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "auth.json");
const EMPTY: Db = { users: [], challenges: [], hits: {} };

/**
 * Serialises reads/writes within the process. A real database would use a
 * transaction; this keeps concurrent requests from clobbering the file.
 */
let queue: Promise<unknown> = Promise.resolve();

async function read(): Promise<Db> {
  try {
    const raw = await fs.readFile(DB_FILE, "utf8");
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<Db>) };
  } catch {
    return structuredClone(EMPTY);
  }
}

async function write(db: Db): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DB_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tmp, DB_FILE);
}

/** Runs `fn` against the database with exclusive access. */
export function transaction<T>(fn: (db: Db) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const db = await read();
    const before = JSON.stringify(db);
    const result = await fn(db);
    // Expired challenges are pruned on every write so the file cannot grow
    // without bound.
    db.challenges = db.challenges.filter((c) => c.expiresAt > Date.now());
    if (JSON.stringify(db) !== before) await write(db);
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function findUserByEmail(db: Db, email: string): User | undefined {
  const target = normaliseEmail(email);
  return db.users.find((u) => u.email === target);
}
