export type SignalKind =
  | "hiring"
  | "funding"
  | "expansion"
  | "tech-change"
  | "leadership"
  | "news";

export type Signal = {
  kind: SignalKind;
  /** One line, past tense: what actually happened. */
  headline: string;
  /** The supporting detail Piasowo read. */
  detail: string;
  observedAt: string;
  source: string;
};

export type Prospect = {
  id: string;
  company: string;
  domain: string;
  industry: string;
  employees: string;
  location: string;
  /** Where this company was found, named so the user can judge the source. */
  foundVia: string;
  contact: Contact;
};

export type Contact = {
  name: string;
  title: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  linkedin?: string;
  /**
   * Whether the address was checked before it reached a draft. Bounces damage
   * sender reputation, so an unverified contact is worth flagging rather than
   * quietly sending to.
   */
  verification: "verified" | "risky" | "unverified";
};

/** One line of the score, so a number is never shown without its reasoning. */
export type ScoreFactor = {
  label: string;
  points: number;
  max: number;
  why: string;
};

export type OpportunityStatus =
  | "awaiting-approval"
  | "researching"
  | "approved"
  | "sent"
  | "replied"
  | "dismissed";

export type Opportunity = {
  id: string;
  missionId: string;
  employeeId: string;
  prospect: Prospect;
  signal: Signal;
  score: number;
  factors: ScoreFactor[];
  /** Why this matters to *this* business, in plain language. */
  whyItMatters: string;
  /**
   * What is genuinely known about timing. Never invented urgency — when there
   * is no evidence a window is closing, `note` says so.
   */
  timing: { note: string; decaying: boolean };
  recommendation: {
    action: "approve-outreach" | "review-research" | "schedule-followup";
    label: string;
    reason: string;
  };
  draft?: { channel: "email" | "linkedin"; subject: string; body: string; grounding: string[] };
  status: OpportunityStatus;
  foundAt: string;
};

export type MissionStatus = "running" | "paused" | "draft" | "completed";

export type Mission = {
  id: string;
  name: string;
  objective: string;
  status: MissionStatus;
  employeeId: string;
  targeting: {
    industries: string[];
    sizes: string[];
    regions: string[];
    signals: SignalKind[];
  };
  outreach: {
    channel: "email" | "linkedin";
    tone: string;
    approval: "every-message" | "first-five" | "automatic";
    dailyCap: number;
  };
  progress: {
    researched: number;
    qualified: number;
    opportunities: number;
    contacted: number;
    replies: number;
  };
  createdAt: string;
};

export type EmployeeStatus = "working" | "waiting-on-you" | "idle" | "paused";

export type Employee = {
  id: string;
  name: string;
  role: string;
  tone: string;
  status: EmployeeStatus;
  missionId: string;
  /** Present tense, specific: what it is doing right now. */
  currentTask: string;
  /** What it will do once the current task finishes. */
  nextTask: string;
  completedToday: number;
  awaitingApproval: number;
};

export type ActivityKind = "researched" | "found" | "drafted" | "sent" | "reply" | "skipped";

export type ActivityEvent = {
  id: string;
  at: string;
  employeeId: string;
  missionId: string;
  kind: ActivityKind;
  summary: string;
  detail?: string;
  opportunityId?: string;
};
