# Area E — content-giving-comms — Round 1 (Discovery) — church-admin

Standing fact I'm holding the whole area against: **Locus has no Giving API
access.** It reads PCO People and Check-Ins only (`plans/audit/feature-inventory.md`
line 99, confirmed by grep — no Stripe/Giving import exists anywhere in
`src/`). Every dollar figure in this area is therefore synthetic. That's not a
nitpick, it's the headline of this whole audit area.

---

## #37 — Sermon Sentiment (`src/components/SermonSentiment.tsx`)

The chart itself is real: attendance is grouped from actual PCO check-ins
(`correlateSermonsAndAttendance`, `src/utils/sermons.ts:24-101`). But the
"sermon topic" on the X-axis is not from a sermon — it's
`SERMON_TOPICS[index % 8]` (`sermons.ts:13-22,83-84`), a hardcoded list of
eight generic titles ("The Prodigal Son", "Faith Over Fear"...) cycled by week
index. Locus has no connection to a sermon library, planning tool, or Church
Center content feed. Every week is mislabeled with a topic nobody preached.

The "Overlay Giving Volume" checkbox (`SermonSentiment.tsx:63-72`) then plots
`givingVolume = attendance * 25`, doubled-and-a-half if the fake topic string
happens to contain "generous" or "giving" (`sermons.ts:87-90`). That is a
fabricated dollar figure, deterministically rigged to spike on a fabricated
topic label, rendered on a $ axis next to real attendance data with no visual
distinction between the two. A pastor toggling this on sees "my 'Living
Generously' sermon drove a giving spike" — a causal story Locus invented from
`attendance * 25 * 2.5`.

- **Verdict: CUT** (the topic-correlation framing; the underlying attendance-by-week
  chart could survive as a plain attendance trend, which Attendance Pulse (#29)
  already covers).
- **Would we actually open this?** Once, out of curiosity. Never again once
  someone notices the topics don't match what was actually preached.
- **PCO overlap:** none directly (PCO doesn't do sermon tagging either), but
  Attendance Pulse (#29) already shows attendance-over-time from the same
  check-in data honestly.
- **Governance/privacy risk:** low directly, but real reputational risk — if a
  pastor repeats "sermons about generosity increase giving 250%" in a board
  meeting or a stewardship campaign pitch, that's a fabricated statistic now
  informing real financial strategy.
- **What would make it worth the licence fee:** a real sermon topic feed (even
  a manually-entered log per Sunday) and real giving data. Neither exists.
  Without both, this is a random number generator with a chart around it.

## #38 — Sermon Correlator (`src/components/SermonCorrelator.tsx`)

Same fake `SERMON_TOPICS` cycling, this time driving "Small Group Signups"
and "Volunteer Applications" — both of which are also fabricated:
`smallGroupSignups = attendance * 0.05`, `volunteerApplications =
attendance * 0.02`, then multiplied 1.5x or 4.0x if the fake topic string
contains "community"/"together" or "serve"/"purpose"
(`sermons.ts:125-135`). Locus has no forms endpoint, no small-group signup
data, no volunteer application data feeding this — it's flatly invented from
attendance count and a keyword match on a made-up topic name.

Worse, the "AI Insights" panel underneath hardcodes the exact conclusion as
prose: *"Sermons addressing 'Community' correlate with a 50% increase in
Small Group Signups"* and *"'Finding Purpose' resulted in a 400% spike in
Volunteer Applications"* (`SermonCorrelator.tsx:128-129`). This isn't even
computed from the chart's own data — it's a static string. The code comment
in `sermons.ts:117-119` admits it outright: *"To simulate this without a real
'forms' or 'signups' endpoint... The vision doc says: 'Sermons about
Community result in a 15% spike'"* — someone read the marketing copy in the
vision doc and hardcoded the app to always prove it true.

- **Verdict: CUT.** This is the single most dishonest screen in the area — a
  chart and a written insight that always confirm a canned narrative
  regardless of input.
- **Would we actually open this?** Once, then never trusted again the moment
  anyone checks whether the underlying data is real.
- **PCO overlap:** none — but that's the point, PCO doesn't claim causality it
  can't back up either.
- **Governance/privacy risk:** none re: PII, but a serious integrity risk — a
  pastor citing "400% spike in volunteer applications" from this screen to a
  board or an elder team is citing a number that was never computed from any
  real event.
- **What would make it worth the licence fee:** delete the fabricated
  insights panel entirely. If Locus ever gets real forms/signup data, rebuild
  the correlation from scratch with real topics — and never hardcode the
  conclusion before the data exists to support it.

## #39 — Giving River (`src/components/GivingRiver.tsx`, `src/utils/giving.ts`)

This is not "giving data presented misleadingly" — it is not connected to any
data source at all. `getGivingFlowData` (`giving.ts:18-52`) returns a
completely static Sankey diagram: literal numbers like
`{ source: 1, target: 0, value: 500000 }` for "Tithe → General Fund," scaled
down by a fixed multiplier (1 / 0.3 / 0.05) depending on which date-range
dropdown option is picked. The component takes zero props, calls no `fetch`,
touches no `auth`, no PCO, nothing (`GivingRiver.tsx:34-36`). Changing the
date range doesn't query different real weeks — it just multiplies the same
made-up $500,000 by 0.3 or 0.05.

To be direct about what this means: if you open this screen and show a pastor
"Tithe → General Fund: $500,000; Building Fund: $100,000," those are not this
church's numbers in any sense — not scaled, not estimated, not derived. They
are literally the same six-figure constants every Locus installation on earth
would show, dressed up as "the flow of generosity" for *your* congregation.
This is the worst kind of mock data because the UI gives zero indication it's
fake — no "sample data" badge, no disabled state, no tooltip. It looks and
behaves exactly like a real report.

- **Verdict: CUT.** Not simplify, not gate behind a "connect Stripe" banner —
  remove it from navigation until real giving data exists. Leaving a screen
  titled "The Giving River" with invented six-figure numbers reachable by
  anyone with a login is a landmine.
- **Would we actually open this?** The executive pastor or finance chair would
  open exactly this kind of chart — giving flow by fund is a real, wanted
  report. Which is exactly why the fake version is dangerous: it looks like
  the thing they need.
- **PCO overlap:** none (PCO Giving product would own this, and Locus has no
  access to it).
- **Governance/privacy risk:** high in the sense that matters most for a
  finance officer: financial numbers presented as institutional fact that are
  actually a shared demo fixture. If this figure gets photographed off a
  screen in a finance meeting and repeated, that is fabricated financial data
  now circulating as if audited.
- **What would make it worth the licence fee:** a real PCO Giving (or Stripe)
  API connection, full stop. Until then this screen should not exist in a
  build anyone outside the dev team can open.

## #40 — Stripe / Giving Trends (`src/components/GivingTrends.tsx`, `src/utils/givingTrends.ts`)

Same root problem as #39, with a twist: this one is currently unreachable
through normal navigation too. `App.tsx:918-922` wires the route as
`<GivingTrends checkIns={[]} events={[]} />` — literal empty arrays, hardcoded
at the call site. There is no `checkIns`/`events` state anywhere in
`App.tsx` (confirmed by search) feeding this component real data. So as
currently wired, clicking into "Stripe Giving Trends" always renders "Not
enough check-in data to visualize trends" (`GivingTrends.tsx:25-36`) — dead
on arrival, a broken route no one caught.

But don't mistake the broken wiring for the real problem, because the logic
underneath is exactly as fabricated as the Giving River even when fed real
check-in data (e.g. via the Robert Report's data plumbing, or if someone
fixes the empty-array bug): `calculateGivingTrends`
(`givingTrends.ts:54-60`) computes real weekly attendance from real check-ins,
then invents `givingVolume = attendance * 25`, jittered by
`1 + sin(index * 1.5) * 0.15` "to look natural" — the comment says so
explicitly: *"Simulate 'Stripe' giving volume... Variance... based on a sine
wave of the index to look natural"* (`givingTrends.ts:53-59`). The header
literally says **"Stripe Giving Trends"** and computes a **"$25 average
giving per attendee"** headline stat (`GivingTrends.tsx:47-50`) with no Stripe
integration anywhere in the codebase. This is naming a specific real payment
processor on a chart of numbers that processor never sent.

To be maximally plain, because the task calls for it: **showing a pastor a
giving chart with a sine-wave "looks natural" jitter applied to a flat
$25/attendee assumption, under a header that says "Stripe," is telling that
pastor a lie with a chart wrapped around it.** A giving chart is not a UI
mockup category like a "sample dashboard" — it's the number a pastor uses to
decide whether the church can make payroll, fund missions, or needs a
stewardship campaign. If Sarah (data admin) or the executive pastor ever
learns this number was `attendance * 25 * jitter` and not from Stripe, every
other chart in Locus becomes suspect by association — the trust cost radiates
far past this one screen.

- **Verdict: CUT.** Fix nothing about the wiring — the underlying formula is
  the actual defect, and it's worse than #39 because it borrows a real
  vendor's name to look verified.
- **Would we actually open this?** Currently, opening it shows an empty
  state, so functionally: never, by accident of a bug. If fixed to show data,
  the finance chair would open it weekly — which is the danger.
- **PCO overlap:** PCO Giving reporting is the real answer here and Locus has
  no access to it.
- **Governance/privacy risk:** high — financial figures fabricated under a
  named real vendor ("Stripe"), which could be read by staff, auditors, or a
  board as literally sourced from Stripe.
- **What would make it worth the licence fee:** real Stripe or PCO Giving API
  access. Nothing less. Do not ship a "giving" screen with invented numbers
  under any circumstance, branded or not — it's not a place for a
  placeholder.

## #41 — Newsletter Architect (`src/components/NewsletterArchitect.tsx`, `src/utils/newsletter.ts`)

This one is honest and useful. It pulls real upcoming events from PCO
(`fetchEvents`, `NewsletterArchitect.tsx:27`) and real upcoming birthdays from
real student records (`generateNewsletter`, `newsletter.ts:20-38`, filtered
to the next 7 days from actual `birthdate` fields), and assembles a markdown
draft with a copy-to-clipboard button. The "Sermon Topic" and "Pastor's
Notes" fields are plain free-text inputs the user types themselves — not
AI-generated, despite "AI-assisted" in the subtitle
(`NewsletterArchitect.tsx:65`), which overstates what's really a mail-merge.
No fabricated numbers, no invented insight. This is the one screen in the
area that does what a church office actually needs: turn "who has a birthday
this week" and "what's on the calendar" into copy-paste-ready text, which
today is a 20-minute manual task in Planning Center + a spreadsheet.

- **Verdict: KEEP**, but fix the "AI-assisted" claim — there's no LLM call
  here, it's template assembly. Calling it AI when a volunteer later learns
  otherwise costs credibility for the rest of the app's claims.
- **Would we actually open this?** Weekly, by whoever writes the bulletin/eblast
  — realistic, high-frequency use.
- **PCO overlap:** PCO doesn't have a newsletter composer; this fills a real
  gap. Church Center posts and email tools (Mailchimp, Constant Contact) are
  the actual endpoint this markdown gets pasted into — worth a literal "copy
  to Mailchimp" affordance instead of the fake Mailchimp toggle in #43.
- **Governance/privacy risk:** low — uses names and birthdates already used in
  the birthday-card process every church runs; nothing new exposed.
- **What would make it worth the licence fee:** it already mostly is. Bigger
  win: let it also pull sermon topic from wherever the church already plans
  services (if that ever gets built) instead of a manual text box, and drop
  the "AI-assisted" language until there's a model behind it.

## #42 — Robert Report (+ Genealogy tab) (`src/components/RobertReport.tsx`, `GenealogyGraph.tsx`)

This feature is dead. `App.tsx:11` imports it commented out:
`// import { RobertReport } from './components/RobertReport' // Deprecated in
favor of direct views`. It is not rendered from any route, not linked from
either sidebar (`SidebarCore.tsx`, `SidebarIntelligence.tsx` — no match for
"Robert" or an export trigger in either), and the only remaining references
in the app are its own test file and two unrelated integration tests that
mock it out to a no-op (`App.ghost.integration.test.tsx:60-61`). It was
apparently an earlier all-in-one tabbed report (health, demographics,
burnout, recruiting, pulse, retention, bus factor, velocity, heatmap,
network, attrition, genealogy) that got superseded by giving each of those
its own standalone route, and nobody deleted the file. The Genealogy tab
(household relationship graph, `GenealogyGraph.tsx`) is real code built on
real household/birthdate data and is reasonably done, but it's orphaned
inside dead code — unreachable by any user today.

- **Verdict: CUT** the `RobertReport.tsx` shell outright (it's unreferenced
  dead code inflating the bundle and confusing anyone reading the codebase).
  **KEEP and re-route Genealogy** as its own standalone view if a household
  relationship map is wanted — it doesn't depend on RobertReport internally in
  any way that would block extracting it.
- **Would we actually open this?** Currently: nobody can, it's not wired up.
  If it were, a genealogy/household graph is a mild curiosity, not a weekly
  tool — PCO's household grouping in the People list already answers "who's
  in this family" faster.
- **PCO overlap:** PCO People already shows household membership per
  person; a graph view is a nice-to-have visualization, not new capability.
- **Governance/privacy risk:** none beyond what's already exposed via PCO
  household data — but note it does render inferred parent/child/spouse/sibling
  links; if that inference is ever wrong (e.g. a blended family, a housemate
  incorrectly grouped), the visual graph states a relationship as fact more
  confidently than the underlying data warrants. Worth a caveat if revived.
- **What would make it worth the licence fee:** delete the dead shell. Ship
  the genealogy graph on its own route if there's real demand, otherwise
  leave it cut — it's not solving a problem the People household view
  doesn't already solve faster.

## #43 — Integrations Hub (`src/components/IntegrationsHub.tsx`)

This is a UI mockup, not an integrations feature, and it should be described
that way to anyone evaluating Locus. There are four cards — Mailchimp, Zoom,
Eventbrite, Typeform. Toggling one does exactly one thing:
`onSaveConfig({ ...config, integrations: { ...integrations, [key]:
!integrations[key] } })` (`IntegrationsHub.tsx:13-22`) — it flips a boolean in
local browser storage (confirmed against `src/utils/storage.ts:6-9`, an
`IntegrationConfig` interface with four optional booleans, nothing else).
There is no OAuth flow, no API client, no network call, no webhook receiver
for any of these four services anywhere in `src/` (grepped the whole tree for
mailchimp/zoom/eventbrite/typeform outside this component and its test — zero
hits beyond the toggle definitions and the unit test that checks the toggle
flips).

Yet the second the toggle is flicked on, the card displays invented,
specific-sounding operational status text as if a real sync just ran:
*"Syncing 423 profiles. 12 ghosts paused."* / *"Listening for meeting
webhooks..."* / *"Event 'Fall Retreat' mapped. 54 tickets synced."* / *"2
active surveys mapped."* (`IntegrationsHub.tsx:64-67`) — all four are literal
static strings, not computed from anything, not even the app's own data
(there's no "423" anywhere connected to actual profile counts). A staff
member who flips this switch and sees "Syncing 423 profiles" has every reason
to believe something happened. Nothing happened. If they then go looking in
Mailchimp for the 12 paused sends, they won't find them, and they'll rightly
conclude Locus is broken — or worse, they won't check, and just believe
sends were paused for ghosts that are still getting emailed.

- **Verdict: CUT.** Not simplify — an integrations page with zero working
  integrations and fabricated success text is worse than no page, because "no
  page" doesn't actively tell staff a sync happened when it didn't. If this
  screen must exist as a roadmap teaser, it needs to say "Coming soon" with
  no toggle and no fake status line — not simulate a working state.
- **Would we actually open this?** Once, to try connecting Mailchimp for real
  — and then never trust the "Integrations" label in this app again once the
  toggle does nothing verifiable.
- **PCO overlap:** none — PCO itself has real Mailchimp/Zapier-style
  integrations in its own ecosystem that actually move data; this duplicates
  the concept with none of the substance.
- **Governance/privacy risk:** concrete and serious — this is a false
  operational-state claim about ghost-suppression ("12 ghosts paused")
  touching real people's email deliverability, and about ticket/contact sync
  ("54 tickets synced," "profiles" syncing) implying PII left the building to
  a third party when it did not (and, if it were real, would need its own
  data-sharing consent review per the persona's governance concerns — none of
  that exists either).
- **What would make it worth the licence fee:** actual OAuth + API
  integration with at least one of the four, with real, computed status
  (real profile counts, real last-sync timestamp). Anything short of that
  should not claim to be "active."

---

## Summary verdicts

| # | Feature | Verdict |
|---|---------|---------|
| 37 | Sermon Sentiment | CUT |
| 38 | Sermon Correlator | CUT |
| 39 | Giving River | CUT |
| 40 | Stripe / Giving Trends | CUT |
| 41 | Newsletter Architect | KEEP (fix "AI-assisted" claim) |
| 42 | Robert Report / Genealogy | CUT shell, KEEP Genealogy standalone if revived |
| 43 | Integrations Hub | CUT |

Five of seven features in this area either fabricate financial/behavioral
data under a professional-looking chart, simulate a vendor integration that
does not exist, or are dead code nobody removed. Only the Newsletter
Architect does real work with real data today.
