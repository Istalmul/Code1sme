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
  /**
   * A person may run several businesses — an agency with clients, a founder
   * with a side venture. Each gets its own AI employee, criteria and pipeline;
   * nothing leaks between them.
   */
  workspaces: Workspace[];
  activeWorkspaceId?: string;
  /** Legacy single-workspace field, migrated on read. Never written. */
  workspace?: Workspace;
  appearance?: Appearance;
  profile?: ProfileDetails;
  connections?: Connections;
};

/** Where outreach would actually leave from, and whether it is safe to. */
export type Connections = {
  email?: SenderAccount;
  whatsapp?: SenderAccount;
};

export type SenderAccount = {
  address: string;
  connectedAt: string;
  /**
   * Domain reputation is earned over weeks of low, steady volume. Sending at
   * full rate from a cold domain is what gets it filtered, so the warm-up day
   * count gates the cap the AI employee is allowed to use.
   */
  warmupStartedAt: string;
};

export type Workspace = {
  id: string;
  /** Hidden from the switcher without losing its history. */
  archived?: boolean;
  /** A colour dot in the switcher, so several businesses stay scannable. */
  color?: Appearance["accent"];
  companyName: string;
  website?: string;
  /** What the business sells, in the user's words. */
  offering: string;
  industry: string;
  targetMarkets: string[];
  companySizes: string[];
  aiEmployee: AiEmployeeSettings;
  /**
   * Proof points the AI draws on when drafting — case studies, results, a CV.
   * Uploaded text lands here, and a draft may cite at most one line of it.
   */
  documents?: WorkspaceDocument[];
  /** Hard rules the AI applies before an opportunity ever reaches the user. */
  criteria?: { minScore: number; dealBreakers: string };
  /** People found through a real data provider, before they are scored. */
  sourced?: SourcedProspect[];
};

export type SourcedProspect = {
  id: string;
  externalId?: string;
  name: string;
  title: string;
  company: string;
  domain?: string;
  location?: string;
  employees?: string;
  linkedin?: string;
  email?: string;
  phone?: string;
  /** Whether a credit has been spent to reveal contact details. */
  enriched: boolean;
  foundAt: string;
};

export type WorkspaceDocument = {
  id: string;
  name: string;
  /** Extracted plain text. Binary formats are converted before storage. */
  text: string;
  addedAt: string;
};

export type AiEmployeeSettings = {
  name: string;
  role: string;
  tone: string;
  avatarSeed: string;
  /** A hard stop: no research, no drafting, nothing. Distinct from manual. */
  paused: boolean;
  approval: "every-message" | "first-five" | "automatic";
  dailyCap: number;
  /**
   * Outreach only leaves during these hours, in the user's timezone. Without
   * this an automated mission would happily email someone at 3am.
   */
  sendWindow: { start: number; end: number; weekends: boolean };
  /** Messages per hour, so a daily cap isn't spent in one burst. */
  hourlyCap: number;
  followUp: { enabled: boolean; afterDays: number; max: number };
  digest: "daily" | "twice-daily" | "off";
};

export type Appearance = {
  theme: "system" | "light" | "dark";
  accent: "blue" | "teal" | "violet" | "amber" | "rose";
  density: "comfortable" | "compact";
  reduceMotion: boolean;
};

export type ProfileDetails = {
  jobTitle?: string;
  phone?: string;
  country?: string;
  timezone?: string;
  notifications: {
    strongOpportunity: boolean;
    reply: boolean;
    digest: boolean;
  };
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
    const db = { ...EMPTY, ...(JSON.parse(raw) as Partial<Db>) };
    db.users.forEach(migrateUser);
    return db;
  } catch {
    return structuredClone(EMPTY);
  }
}

/**
 * Brings a stored user up to the current shape.
 *
 * Accounts created before multi-workspace support hold a single `workspace`;
 * they are folded into the list on read so nothing downstream has to know two
 * shapes existed.
 */
function migrateUser(user: User): void {
  user.workspaces ??= [];
  if (user.workspace) {
    const legacy = user.workspace;
    if (!user.workspaces.some((w) => w.id === "ws-1")) {
      user.workspaces.unshift({ ...legacy, id: legacy.id ?? "ws-1" });
    }
    delete user.workspace;
  }
  user.workspaces.forEach((w, index) => {
    w.id ||= `ws-${index + 1}`;
  });
  const active = user.workspaces.find((w) => w.id === user.activeWorkspaceId && !w.archived);
  if (!active) {
    user.activeWorkspaceId = user.workspaces.find((w) => !w.archived)?.id;
  }
}

/** The workspace a request should act on, or undefined before onboarding. */
export function activeWorkspace(user: User): Workspace | undefined {
  return (
    user.workspaces.find((w) => w.id === user.activeWorkspaceId) ??
    user.workspaces.find((w) => !w.archived)
  );
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
