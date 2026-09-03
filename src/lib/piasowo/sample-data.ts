import type { Workspace } from "@/lib/auth/store";
import type { ActivityEvent, Employee, Mission, Opportunity, Prospect } from "./types";
import { suggestFirstMission } from "./recommend";

/**
 * Sample workspace contents.
 *
 * Piasowo's own discovery pipeline is not part of this repository, so the
 * screens are driven by a fixed, clearly-labelled dataset that adapts its copy
 * to the answers given during onboarding. The app shell shows a "Sample data"
 * badge so nothing here can be mistaken for live findings. Replacing this one
 * module with real API calls is the only change the UI needs.
 */

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 3_600_000).toISOString();
}

/**
 * A small deterministic generator, seeded from the workspace id, so the daily
 * history is stable across reloads and differs between businesses.
 */
function seeded(seed: string): () => number {
  let h = 2166136261;
  for (const ch of seed) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 1000) / 1000;
  };
}

export type DailyRow = {
  date: string;
  researched: number;
  opportunities: number;
  sent: number;
  replied: number;
};

/**
 * Fourteen days of activity, generated once and then read by the chart, the
 * table and the CSV alike — so all three agree. Nothing here is interpolated
 * from a total after the fact.
 */
function buildDaily(seed: string, days = 14): DailyRow[] {
  const random = seeded(seed);
  const rows: DailyRow[] = [];
  for (let offset = days - 1; offset >= 0; offset--) {
    const date = new Date(Date.now() - offset * 86_400_000);
    const weekend = date.getDay() === 0 || date.getDay() === 6;
    // Weekends are quiet because the default send window excludes them.
    const scale = weekend ? 0.15 : 1;
    const researched = Math.round((28 + random() * 34) * scale);
    const opportunities = Math.round(researched * (0.05 + random() * 0.05));
    const sent = Math.round(opportunities * (0.4 + random() * 0.5));
    const replied = Math.round(sent * (0.1 + random() * 0.25));
    rows.push({
      date: date.toISOString().slice(0, 10),
      researched,
      opportunities,
      sent,
      replied,
    });
  }
  return rows;
}

const PROSPECTS: Prospect[] = [
  {
    id: "p-1",
    company: "Northgate Logistics",
    domain: "northgate-logistics.co.uk",
    industry: "Logistics & supply chain",
    employees: "180",
    location: "Manchester, UK",
    foundVia: "Companies House + company newsroom",
    contact: {
      name: "Priya Raman",
      title: "Operations Director",
      email: "p.raman@northgate-logistics.co.uk",
      phone: "+44 161 496 0142",
      linkedin: "linkedin.com/in/priyaraman",
      verification: "verified",
    },
  },
  {
    id: "p-2",
    company: "Halden Foods",
    domain: "haldenfoods.com",
    industry: "Manufacturing",
    employees: "420",
    location: "Leeds, UK",
    foundVia: "Careers page monitoring",
    contact: {
      name: "Tom Whitaker",
      title: "Head of Procurement",
      email: "t.whitaker@haldenfoods.com",
      linkedin: "linkedin.com/in/tomwhitaker",
      verification: "risky",
    },
  },
  {
    id: "p-3",
    company: "Verity Health",
    domain: "verityhealth.io",
    industry: "Healthcare",
    employees: "65",
    location: "Bristol, UK",
    foundVia: "LinkedIn company page",
    contact: {
      name: "Dr. Amara Nwosu",
      title: "Clinical Operations Lead",
      linkedin: "linkedin.com/in/amaranwosu",
      verification: "unverified",
    },
  },
  {
    id: "p-4",
    company: "Bramble & Co",
    domain: "brambleandco.com",
    industry: "Retail & e-commerce",
    employees: "38",
    location: "Dublin, IE",
    foundVia: "Funding announcement feed",
    contact: {
      name: "Sean Doyle",
      title: "Founder",
      email: "sean@brambleandco.com",
      whatsapp: "+353 1 902 4471",
      verification: "verified",
    },
  },
  {
    id: "p-5",
    company: "Kestrel Financial",
    domain: "kestrelfinancial.com",
    industry: "Financial services",
    employees: "240",
    location: "London, UK",
    foundVia: "Company announcements feed",
    contact: {
      name: "Laura Beckett",
      title: "COO",
      email: "l.beckett@kestrelfinancial.com",
      phone: "+44 20 7946 0812",
      verification: "verified",
    },
  },
];

export function buildWorkspace(workspace: Workspace) {
  const suggested = suggestFirstMission(workspace);
  const employeeName = workspace.aiEmployee.name;

  /**
   * Ids are namespaced by workspace, so a link copied out of one business
   * cannot resolve inside another. This is the shape a real database would
   * enforce with a foreign key.
   */
  const key = workspace.id.slice(0, 8);
  const id = (local: string) => `${key}-${local}`;

  const missions: Mission[] = [
    {
      ...suggested,
      id: id("m-1"),
      status: "running",
      createdAt: hoursAgo(72),
      progress: { researched: 412, qualified: 87, opportunities: 12, contacted: 31, replies: 6 },
    },
  ];

  const employees: Employee[] = [
    {
      id: id("emp-1"),
      name: employeeName,
      role: workspace.aiEmployee.role,
      tone: workspace.aiEmployee.tone,
      // A paused employee is idle by definition, whatever else is outstanding.
      status: workspace.aiEmployee.paused ? "paused" : "waiting-on-you",
      missionId: id("m-1"),
      currentTask: workspace.aiEmployee.paused
        ? "Nothing — paused. Everything already found is still here."
        : `Reading Northgate Logistics' new depot announcement to check it fits ${
            workspace.targetMarkets[0] ?? "your market"
          }`,
      nextTask: workspace.aiEmployee.paused
        ? "Resume from Settings to pick up where this left off"
        : "Draft an opening email for Halden Foods once you approve the three waiting",
      completedToday: 46,
      awaitingApproval: 3,
    },
  ];

  const opportunities: Opportunity[] = [
    {
      id: id("o-1"),
      missionId: id("m-1"),
      employeeId: id("emp-1"),
      prospect: PROSPECTS[0],
      signal: {
        kind: "expansion",
        headline: "Opened a second distribution depot in Warrington",
        detail:
          "Announced on 12 March. The listing describes 40,000 sq ft of additional capacity and names a go-live date of 1 May.",
        observedAt: hoursAgo(20),
        source: "Company newsroom",
      },
      score: 92,
      factors: [
        { label: "Market fit", points: 28, max: 30, why: `Logistics, 180 staff, Manchester — inside your target market.` },
        { label: "Signal strength", points: 26, max: 30, why: "A funded, dated expansion is a stronger buying indicator than a press mention." },
        { label: "Timing", points: 24, max: 25, why: "The depot goes live in 6 weeks, so supplier decisions are being made now." },
        { label: "Reachability", points: 14, max: 15, why: "Operations Director identified, with a verified work address." },
      ],
      whyItMatters:
        "A second depot means new operational spend that is being decided in the next few weeks. This is the window where a supplier gets evaluated rather than displaced later.",
      timing: {
        note: "The announced go-live is 1 May. Vendor selection for a depot this size typically closes several weeks before that date.",
        decaying: true,
      },
      recommendation: {
        action: "approve-outreach",
        label: "Approve the drafted email",
        reason: `${employeeName} has a draft ready that opens on the depot, not on your product. Sending it this week reaches Priya while the decision is still open.`,
      },
      draft: {
        channel: "email",
        subject: "Warrington depot — capacity question",
        body: `Hi Priya,\n\nI saw Northgate is opening the Warrington depot on 1 May — 40,000 sq ft is a big step up from the Manchester site alone.\n\nMost operations teams we work with hit the same snag about six weeks before a second site goes live. Worth a short call before you lock in suppliers?\n\nEither way, congratulations on the expansion.`,
        grounding: [
          "Depot announcement, company newsroom, 12 March",
          "Site size and go-live date from the same announcement",
          "Priya Raman's title confirmed on the company team page",
        ],
      },
      status: "awaiting-approval",
      foundAt: hoursAgo(20),
    },
    {
      id: id("o-2"),
      missionId: id("m-1"),
      employeeId: id("emp-1"),
      prospect: PROSPECTS[1],
      signal: {
        kind: "hiring",
        headline: "Posted 4 procurement roles in 3 weeks",
        detail:
          "Three Procurement Analyst roles and one Senior Category Manager, all based in Leeds, all posted since 22 February.",
        observedAt: hoursAgo(44),
        source: "Careers page",
      },
      score: 78,
      factors: [
        { label: "Market fit", points: 26, max: 30, why: "Manufacturing, 420 staff — larger than your typical account but inside range." },
        { label: "Signal strength", points: 22, max: 30, why: "Four roles in one function is a real build-out, not routine backfill." },
        { label: "Timing", points: 16, max: 25, why: "Hiring implies a change in progress, but no dated deadline was found." },
        { label: "Reachability", points: 14, max: 15, why: "Head of Procurement identified and active on LinkedIn." },
      ],
      whyItMatters:
        "Building out a procurement team usually precedes a supplier review. Reaching Tom while the team is forming means being considered rather than compared.",
      timing: {
        note: "No deadline was found in the postings. There is no evidence this closes soon — this one can wait behind stronger signals.",
        decaying: false,
      },
      recommendation: {
        action: "review-research",
        label: "Read the research brief",
        reason: `${employeeName} found the hiring pattern but not what is driving it. Ten minutes of your judgement here decides whether it is worth a message.`,
      },
      status: "researching",
      foundAt: hoursAgo(44),
    },
    {
      id: id("o-3"),
      missionId: id("m-1"),
      employeeId: id("emp-1"),
      prospect: PROSPECTS[2],
      signal: {
        kind: "leadership",
        headline: "Appointed a new Clinical Operations Lead",
        detail: "Dr. Amara Nwosu joined from a 900-bed NHS trust, announced 4 March.",
        observedAt: hoursAgo(70),
        source: "LinkedIn announcement",
      },
      score: 71,
      factors: [
        { label: "Market fit", points: 21, max: 30, why: "Healthcare, 65 staff — smaller than your usual account size." },
        { label: "Signal strength", points: 21, max: 30, why: "A new operations lead reviews existing suppliers, typically in the first quarter." },
        { label: "Timing", points: 18, max: 25, why: "Appointed 3 weeks ago, so the review window is open but not urgent." },
        { label: "Reachability", points: 11, max: 15, why: "No direct address found; LinkedIn is the reliable route." },
      ],
      whyItMatters:
        "New operations leads reassess what they inherited. Amara is three weeks in, which is early enough to be introduced rather than compared to an incumbent.",
      timing: {
        note: "Supplier reviews after a leadership change commonly run over the first quarter. No specific date was found.",
        decaying: false,
      },
      recommendation: {
        action: "approve-outreach",
        label: "Approve the LinkedIn message",
        reason: "No work address was found, so this one goes out on LinkedIn. The draft is short and references her previous trust, not your product.",
      },
      draft: {
        channel: "linkedin",
        subject: "",
        body: `Congratulations on the move to Verity, Amara.\n\nComing from a 900-bed trust to a 65-person team is a real change of gear. If you're taking stock of what you've inherited, happy to share what we've seen work at similar-sized clinical ops teams — no pitch.`,
        grounding: [
          "Appointment announcement, LinkedIn, 4 March",
          "Previous employer size from her public profile",
          "Verity Health headcount from their about page",
        ],
      },
      status: "awaiting-approval",
      foundAt: hoursAgo(70),
    },
    {
      id: id("o-4"),
      missionId: id("m-1"),
      employeeId: id("emp-1"),
      prospect: PROSPECTS[3],
      signal: {
        kind: "funding",
        headline: "Raised a €4.2M Series A",
        detail: "Led by Frontline Ventures, announced 28 February. Stated use of funds is UK market entry.",
        observedAt: hoursAgo(96),
        source: "Press release",
      },
      score: 64,
      factors: [
        { label: "Market fit", points: 18, max: 30, why: "Retail, 38 staff — below your usual size, so deal value may be small." },
        { label: "Signal strength", points: 24, max: 30, why: "A funded round with a stated spending plan is a strong indicator." },
        { label: "Timing", points: 14, max: 25, why: "Announced 4 days ago; post-raise spending usually starts after a hiring push." },
        { label: "Reachability", points: 8, max: 15, why: "Founder-led, so the inbox is likely busy right after a raise." },
      ],
      whyItMatters:
        "The raise names UK entry specifically, which is your home market. The size of the company is the reason this scores lower than the others, not the signal.",
      timing: {
        note: "Post-raise buying typically follows hiring by a month or two. Waiting a few weeks here costs little.",
        decaying: false,
      },
      recommendation: {
        action: "schedule-followup",
        label: "Check back in 3 weeks",
        reason: `${employeeName} will re-check Bramble in three weeks and raise this again if they start hiring in the UK. Nothing is lost by waiting.`,
      },
      status: "awaiting-approval",
      foundAt: hoursAgo(96),
    },
    {
      id: id("o-5"),
      missionId: id("m-1"),
      employeeId: id("emp-1"),
      prospect: PROSPECTS[4],
      signal: {
        kind: "leadership",
        headline: "Named a new COO",
        detail: "Laura Beckett stepped up from Operations Director on 18 February.",
        observedAt: hoursAgo(120),
        source: "Company announcement",
      },
      score: 84,
      factors: [
        { label: "Market fit", points: 25, max: 30, why: "Financial services, 240 staff, London — a good size for you." },
        { label: "Signal strength", points: 23, max: 30, why: "An internal promotion to COO usually comes with a mandate to change something." },
        { label: "Timing", points: 22, max: 25, why: "Six weeks in, which is when new COOs start reviewing suppliers." },
        { label: "Reachability", points: 14, max: 15, why: "Direct address found and verified." },
      ],
      whyItMatters:
        "Laura ran operations before this, so she already knows where the friction is. A promoted COO acts faster than an external hire still learning the business.",
      timing: {
        note: "You sent this five days ago and Laura replied asking for pricing. That reply is the thing waiting on you, not the signal.",
        decaying: false,
      },
      recommendation: {
        action: "schedule-followup",
        label: "Answer the pricing question",
        reason: "Laura asked for pricing directly. This is the one on this list closest to becoming revenue.",
      },
      status: "replied",
      foundAt: hoursAgo(120),
    },
    {
      id: id("o-6"),
      missionId: id("m-1"),
      employeeId: id("emp-1"),
      prospect: {
        id: "p-6",
        company: "Ashgrove Interiors",
        domain: "ashgroveinteriors.co.uk",
        industry: "Construction & trades",
        employees: "54",
        location: "Birmingham, UK",
        foundVia: "Trade press monitoring",
        contact: {
      name: "Marcus Bell",
      title: "Managing Director",
      email: "hello@ashgroveinteriors.co.uk",
      whatsapp: "+44 7700 900318",
      verification: "risky",
    },
      },
      signal: {
        kind: "news",
        headline: "Won a 40-unit residential fit-out contract",
        detail: "Announced 26 February in the trade press, delivery through to autumn.",
        observedAt: hoursAgo(140),
        source: "Trade press",
      },
      score: 69,
      factors: [
        { label: "Market fit", points: 20, max: 30, why: "Construction, 54 staff — adjacent to your core market rather than in it." },
        { label: "Signal strength", points: 21, max: 30, why: "A named contract with a delivery window is concrete, not a press mention." },
        { label: "Timing", points: 18, max: 25, why: "Delivery runs to autumn, so the pressure builds rather than passes." },
        { label: "Reachability", points: 10, max: 15, why: "Generic company address only; the MD's direct line wasn't found." },
      ],
      whyItMatters:
        "A 40-unit fit-out is a step up in scale for a 54-person firm. That gap between won work and current capacity is usually where they start buying.",
      timing: {
        note: "You approved this two days ago and it went out yesterday. Nothing to do until they reply.",
        decaying: false,
      },
      recommendation: {
        action: "schedule-followup",
        label: "Wait for a reply",
        reason: `${employeeName} will follow up once if there's no reply after four days, in line with your settings.`,
      },
      status: "sent",
      foundAt: hoursAgo(140),
    },
  ];

  const activity: ActivityEvent[] = [
    {
      id: id("a-1"),
      at: hoursAgo(1),
      employeeId: id("emp-1"),
      missionId: id("m-1"),
      kind: "found",
      summary: "Found Northgate Logistics' depot expansion",
      detail: "Scored 92 — the strongest signal this week.",
      opportunityId: id("o-1"),
    },
    {
      id: id("a-2"),
      at: hoursAgo(2),
      employeeId: id("emp-1"),
      missionId: id("m-1"),
      kind: "skipped",
      summary: "Skipped 14 companies from the Manchester batch",
      detail: "All under 10 staff, which is outside the size range on this mission.",
    },
    {
      id: id("a-3"),
      at: hoursAgo(4),
      employeeId: id("emp-1"),
      missionId: id("m-1"),
      kind: "reply",
      summary: "Kestrel Financial replied",
      detail: "Laura Beckett asked for pricing. This one needs you.",
    },
    {
      id: id("a-4"),
      at: hoursAgo(7),
      employeeId: id("emp-1"),
      missionId: id("m-1"),
      kind: "sent",
      summary: "Sent 8 approved emails",
      detail: "All eight were approved by you yesterday evening.",
    },
    {
      id: id("a-5"),
      at: hoursAgo(9),
      employeeId: id("emp-1"),
      missionId: id("m-1"),
      kind: "researched",
      summary: "Researched 46 companies",
      detail: "12 matched the mission criteria closely enough to score.",
    },
  ];

  return {
    missions,
    employees,
    opportunities,
    activity,
    prospects: PROSPECTS,
    daily: buildDaily(workspace.id),
  };
}

export type WorkspaceData = ReturnType<typeof buildWorkspace>;
