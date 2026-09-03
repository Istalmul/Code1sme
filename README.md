# Piasowo

AI Workforce Operating System that helps businesses discover prospects, identify
opportunity signals, conduct AI-powered research, and execute growth missions.

## Running it

### In the browser, with no local setup

On GitHub: **Code → Codespaces → Create codespace on this branch**. Dependencies
install automatically; then run `npm run dev` in the terminal and the app opens
on port 3000.

### Locally

Requires Node 20.9 or newer.

```bash
npm install
cp .env.example .env.local   # then fill in AUTH_SECRET
npm run dev
```

`AUTH_SECRET` is the only required variable; generate one with
`openssl rand -base64 32`. Without `RESEND_API_KEY`, verification codes are
printed to the server log so the flow is testable locally. Without
`GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`, the "Continue with Google" button
says it isn't configured rather than failing silently.

```bash
npm run typecheck
npm run build
```

`next-env.d.ts` is committed in the form `next build` writes. Running
`next dev` rewrites its two imports to point at `.next/dev/types/` instead;
that local change is expected and can be discarded.

## What is real and what is sample

The authentication system is real: accounts, hashing, verification codes, rate
limits, sessions and Google OIDC all work end to end, backed by a JSON file in
`.data/` for development (`src/lib/auth/store.ts` is the single module to
replace with a database).

The product screens run on a fixed dataset in
`src/lib/piasowo/sample-data.ts`, because Piasowo's discovery pipeline is not
part of this repository. The app shell labels it "Sample" so nothing on screen
can be mistaken for live findings. Swapping that one module for real API calls
is the only change the UI needs.

## The redesign

Six principles were applied, each to a specific problem rather than uniformly.

**Smart defaults.** Sign-up asks for three fields. Onboarding guesses the
company name and website from the work email domain; choosing an industry
seeds target markets, company sizes and which signals to watch
(`src/lib/piasowo/recommend.ts`). Mission creation is a review screen — every
field arrives filled, and the user edits rather than assembles.

**Goal gradient.** The step meter fills only on steps actually completed, and
the caption names the step being worked on. Mission progress is shown as a
funnel where each stage is what survived the one above it, so a drop-off is
visible without arithmetic.

**Reciprocity.** Onboarding ends by handing over a complete, runnable mission
built from the answers just given, rather than asking for more setup.

**Endowment.** The AI employee is named and given a focus and a writing tone
during onboarding, and that name appears on every finding, draft and activity
entry afterwards.

**Loss aversion, honestly.** Opportunity cards carry a timing line, but only
where there is evidence for it. Where nothing is closing, the card says so —
"No deadline was found in the postings" — so waiting stays a real option. There
is no countdown, no fake scarcity, and no invented consequence.

**Contrast and anchoring.** A score is never shown alone: it carries a band
word, and the detail page itemises every factor against its maximum, so the
reader can see where points were held back. Exactly one action per screen is a
filled button.

### Settings

Everything collected during onboarding is editable afterwards, under
`/settings` — a flat list where each row shows its current value, so most
questions are answered without opening anything.

- **Profile** — photo with a real crop step (drag to position, zoom, saved as a
  256px square), name, job title, phone, country, timezone, and which events
  are worth a notification.
- **AI employee** — rename it, choose its focus and writing voice, and set what
  it may do unsupervised: approval mode, minimum score, send window, hourly and
  daily pacing, follow-up, digest frequency. A preset sets volume, pacing and
  threshold together for anyone who doesn't want to reason about each one.
  Pause is a hard stop, distinct from approving each message.
- **Workspace** — company details, an industry typeahead, target markets,
  deal-breakers, and proof points. Proof points are what the AI writes *from*:
  paste one, or upload a `.docx`, `.txt`, `.md` or `.csv` (parsed in the
  browser — only the extracted text is stored). Without one, an opportunity's
  draft says so and links here.
- **Appearance** — system/light/dark, five accents, comfortable or compact
  density, and an in-app reduce-motion override. Changes preview live and are
  only kept on Done. Theme is resolved on the server and stamped onto `<html>`,
  so there is no flash of the wrong theme on load.

The sidebar collapses to an icon rail, and the toggle that brings it back never
disappears. The choice persists across reloads.

### Per-screen decisions

| Screen | Problem | Change |
| --- | --- | --- |
| Sign-up | Registration doubled as a questionnaire | Name, email, password. Business details move to onboarding, where they can be pre-filled and acted on |
| Verification | No proof the address was real | 6-digit code, hashed at rest, constant-time compared, 10-minute expiry, 5 attempts, resend with countdown. An account cannot exist unverified |
| Login | Repeated what sign-up already said | Email, password, Google, forgot-password. Errors are enumeration-resistant and timing-equalised |
| Google | Re-asked for what Google supplies | One button for both paths; no name re-entry, no second verification |
| Onboarding | Blank forms up front | Four steps, each pre-answered from the last, ending on a launchable mission |
| Command Center | Everything at equal weight | One "Start here" card for the highest-scoring item waiting, then supporting detail. Skips are shown too — knowing what was rejected is how trust builds |
| Missions | Empty configuration form | Pre-configured; regions, channel, approval mode and volume sit behind a disclosure |
| AI employee | Read as a chatbot | Doing now / next / on mission, stated plainly, before any history |
| Opportunities | A number with no reasoning | What happened, why it matters, the itemised score, the draft with its sources, and one recommended action |
| Empty states | "No opportunities found." | What is empty, why it matters, and a preconfigured next step |
| Settings | Did not exist — onboarding answers were write-once | A flat list of sub-pages; every answer editable, each row showing its value |
| Pipeline counts | Numbers with no way to act on them | Each count is the link that filters to it |
| Small option sets | Hidden in dropdowns | Shown as pills or cards; only long lists keep a typeahead |

### Accessibility and responsive behaviour

All text meets WCAG AA (4.5:1, or 3:1 for large text) across **every
theme and accent combination** — ten in total — verified by measuring computed
colours against their painted backgrounds on every screen. No horizontal
overflow at 320px. Every interactive element has an accessible name. One focus
treatment throughout; `prefers-reduced-motion` is respected globally, and the
in-app override is honoured independently.

Mobile is not a shrunken desktop: navigation moves to the thumb zone, and on
the opportunity detail the recommended action is placed before the draft rather
than below it.
