# Area C — pastoral-ops — Round 1 UXR Critique

Reviewer note before the feature-by-feature breakdown: all ten of these features
(#19–#28) live under `SidebarIntelligence.tsx`, i.e. inside **Locus
Intelligence — "Executive Dashboard"** (`src/layouts/IntelligenceLayout.tsx`,
subtitle rendered literally as "Executive Dashboard", `SidebarIntelligence.tsx:14`).
The persona brief calls Intelligence "read-only." Two of these ten features
(#27 Emergency Alerts, #28 Automations) have primary-action buttons that claim
to *send* things — SMS blasts, DoorDash meals, Uber rides, Slack pings,
roster removals. None of it is read-only, and none of it is real (see #27/#28
below). That is the single biggest structural problem in this area and is
called out in full at the bottom.

Overlap map for this area, stated up front because five of the ten screens are
different cuts of the same two source signals (check-ins classified into
Worship vs. Serving, `src/utils/burnout.ts:11` `classifyEvent`):

- **Burnout (#20)**, **Drift/Attrition (#21)**, and **Missing Volunteers (#22)**
  are three separate screens all answering "who has stopped showing up, and is
  that bad?" — same underlying check-in stream, three different thresholds,
  three different vocabularies (High/Medium/Low vs. Drifting/At Risk/Gone vs.
  a raw week-count), no shared screen or unified list.
- **Recruitment (#23)** and **Bus Factor (#25)** are the supply-side mirror of
  the same coin: one finds people who *could* serve but don't, the other finds
  people who serve *alone* and are a risk if they stop. They never reference
  each other even though "recruit someone new" is the obvious fix for a Bus
  Factor finding.
- **Volunteer Web (#26)** is Bus Factor's data, laid out as a force-directed
  graph instead of a table — same "who serves with whom" computation
  (`classifyEvent` + shift clustering), different visualization, no link
  between the two screens.
- **Pastoral Co-Pilot (#19)** is a chat front-end that re-runs the *exact same*
  utility functions as #20–#23 (imports `calculateBurnoutRisk`,
  `calculateRecruitmentCandidates`, `calculateMissingVolunteers` directly,
  `src/utils/copilot.ts:3-6`) and prints a worse version of each report as chat
  bubbles. It is not a sixth source of insight; it's a fourth-through-seventh
  UI for data already shown on four other screens.

---

## #19 — Pastoral Co-Pilot (`src/components/CoPilot.tsx`, `src/utils/copilot.ts`)

**Verdict: CUT**

**Evidence:**
- Regex/`includes()` intent router over ~12 hand-written branches
  (`copilot.ts:30-334`), no real NLP, no handling of compound or ambiguous
  queries.
- Welcome message advertises "health stats, burnout risks, missing volunteers,
  split households, or specific students" (`CoPilot.tsx:26`) but the router
  also silently covers ghosts, recruitment, grade search, automations, prayer,
  and sentiment — none of which are mentioned, so a user has no way to know
  the full vocabulary except by trial and error.
- **Keyword collision, concretely wrong answers:** the Burnout branch matches
  on the bare word `'risk'` (`copilot.ts:47`) and runs *before* any Attrition
  check exists. There is no Attrition/Drift intent anywhere in the file (I
  grepped for `drift`/`attrition` — zero matches). A user who types "what's my
  attrition risk?" — completely reasonable, given "Attrition" sits right next
  to "Burnout Risk" in the very same sidebar (`SidebarIntelligence.tsx:53-66`)
  — silently gets Burnout Risk data back under a response that never says
  "Burnout," compounding the confusion. Same problem for Bus Factor and
  Volunteer Web: no intent exists, and generic words like `'volunteer'` route
  to Recruitment instead (`copilot.ts:143`).
- **Missing Volunteers vs. Ghost collision:** typing bare "missing" does not
  match the Missing Volunteers branch (`copilot.ts:97`, which requires the
  phrase "missing volunteer," "haven't seen," or "missing person") and instead
  falls through to the Ghost branch (`copilot.ts:120`, which matches any
  `'missing'` substring). So "who's missing?" — the single most natural phrasing
  — returns Ghost data (2-year inactive members) instead of the dedicated
  Missing Volunteers report (2-week-missing key volunteers), two different
  populations with different pastoral urgency.
- **Dead code / broken promise:** the Sentiment intent builds a navigation
  `action: { label: "View Sentiment Pulse", view: "sentiment-pulse" }`
  (`copilot.ts:324-327`) and the text says "Head to 'Sentiment Pulse' view for
  the full word cloud" — but `Message` in `CoPilot.tsx:13-19` has no `action`
  field, `response.action` is never read, and the rendered `data-card-list`
  (`CoPilot.tsx:117-129`) has no `onClick`. Every card in every response is
  inert. The bot repeatedly tells the user to "head to" a view it gave them no
  way to reach.
- `setTimeout(..., 600)` fake "typing" delay (`CoPilot.tsx:83-96`) on top of
  an already-loaded, already-computed in-memory answer — pure theater with no
  function.

**Top defects (ranked):**
1. Wrong-answer routing for "attrition"/"risk" queries — a chatbot that
   confidently returns the wrong report is worse than no chatbot. User moment:
   Sarah, prepping for a Monday staff meeting, asks the Co-Pilot "who's at risk
   of attrition" because that's the sidebar label; she reads out Burnout Risk
   names in the meeting under the wrong headline.
2. Dead navigation links in every card and every "head to X view" sentence.
3. Zero coverage for 3 of the other 9 features in this very area (Attrition,
   Bus Factor, Volunteer Web) with no acknowledgment of the gap.

**Cheapest fix:** Delete the chat metaphor. Every intent it serves already has
a first-class report screen with better formatting (badges, avatars, export).
Replace with a single command-palette-style search (`Cmd+K`) that jumps
straight to the matching report/person — same value, none of the NLP
maintenance burden, no wrong-answer risk from keyword collisions.

**Open question:** Does anyone actually type free text here more than once?
Instrument query strings for a week before deciding whether any chat surface
is worth keeping at all.

---

## #20 — Burnout Risk (`src/components/BurnoutReport.tsx`, `src/utils/burnout.ts`)

**Verdict: MERGE** (with #21 and #22 into one "Attendance Risk" screen)

**Evidence:**
- Rule: serving ≥6 times in 8 weeks AND worship ≤2 (`burnout.ts:83-91`), fixed
  thresholds, not configurable anywhere in `ConfigModal`.
- `classifyEvent` (`burnout.ts:11-25`) is a keyword match on event *name*
  (`'team'`, `'volunteer'`, `'greeter'`, `'ministry'` → Serving;
  `'service'`, `'worship'`, `'kids church'`, `'friday night live'` → Worship).
  Any event named something else (a huge share of real PCO event names —
  "Sunday AM," "9:15," "The Gathering") falls into `'Unknown'` and is silently
  dropped from both sides of the ratio. There is no UI indicator of how many
  events were unclassified, so a small church with idiosyncratic event names
  could see an empty "All Clear!" screen and have no idea the detector simply
  couldn't read their data.
- Empty state is a generic "All Clear! 🎉" (`BurnoutReport.tsx:74-78`) —
  indistinguishable from "we found zero risk" vs. "we couldn't classify your
  events." Per the persona brief's empty/sparse-data concern, this is exactly
  the failure mode to worry about.

**Top defects:**
1. Silent unknown-event-name failure mode disguised as a clean bill of health
   — user moment: Sarah's church labels services "Sunday 9am / Sunday 11am,"
   none of which contain "service" or "worship"; Burnout Risk reports "All
   Clear" forever, and nobody is ever flagged, while the underlying problem
   (volunteers skipping worship) is real and invisible.
2. Fixed, non-configurable thresholds (6 serves / ≤2 worship) baked into code
   with no way for an admin to say "our normal is different."

**Cheapest fix:** Surface an "N events could not be classified" banner whenever
`Unknown` count crosses some threshold, and let event-type keywords be
edited in Settings rather than hardcoded.

**Open question:** How many real PCO check-in event names actually match the
hardcoded keyword lists? Pull a sample from 5 real churches before trusting
this signal at all.

---

## #21 — Predictive Attrition / Drift (`src/components/DriftReport.tsx`, `src/utils/drift.ts`)

**Verdict: MERGE** (into the same "Attendance Risk" screen as #20/#22)

**Evidence:**
- Three-tier status: Gone / Drifting (≥50% drop) / At Risk (≥25% drop)
  computed from a baseline window (month -7 to -2) vs. a recent window (last
  6 weeks) (`drift.ts:73-81`). Genuinely different math from Burnout (rate
  comparison vs. worship/serving ratio) but answers the same practical
  question a pastor has: "who is quietly leaving?"
  Burnout's own risk categories are named High/Medium/Low; Drift's are
  Gone/Drifting/At Risk. A person could plausibly appear on *both* screens
  simultaneously (someone drifting in worship attendance while still serving
  heavily would trip Burnout's "Serving ≥6, Worship ≤2" *and* look like
  "Drifting" if their historical worship rate was higher) with no
  cross-reference between the two reports telling the viewer that's the same
  person, same underlying event.
- `fetchRecentCheckIns(auth, 20)` (`DriftReport.tsx:26`) — comment claims "20
  pages = 2000 check-ins" is needed for "at least 6 months of history," but
  the *default* value of `fetchRecentCheckIns` is `maxPages = 100`
  (`src/utils/pco.ts:507`) — i.e. Burnout and Recruitment, which call the
  function with no argument, pull **5x more history** than Drift, Missing
  Volunteers, Bus Factor, and Volunteer Web, which explicitly pass `20`. This
  looks like a copy-pasted comment written against a stale default; today it
  silently under-fetches relative to sibling screens for no evident reason.
- Tenure gate requires 6+ months of history inferred from first observed
  check-in (`drift.ts:51-53`) — reasonable, but there's no messaging on the
  Drift screen telling the user that newcomers are deliberately excluded
  ("handled by Retention funnel" is a code comment, not UI text), so a
  concerned admin looking for a specific new person on this screen will find
  them silently absent with no explanation.

**Top defects:**
1. Silent overlap with Burnout Risk with no cross-linking — same person,
   different vocabulary, different screen, no "also see" pointer.
2. Inconsistent history depth (20 vs. 100 pages) across near-identical
   computations with no visible rationale — a maintainability/trust smell more
   than a UI defect, but it means the "6+ months" claims on this screen and
   the "8 weeks" claims on Burnout aren't drawing from comparably-sized
   windows of truth.
3. Newcomer exclusion is undocumented in the UI.

**Cheapest fix:** One "Attendance Risk" screen with a single person-list, a
status chip that can show multiple simultaneous flags (Burnout + Drifting),
and one shared, audited history-fetch depth.

**Open question:** When Burnout and Drift both flag the same person, does that
correlation change what a pastor should actually do? If yes, that's the
merged screen's headline feature, not a nice-to-have.

---

## #22 — Missing Volunteers (`src/components/MissingVolunteersReport.tsx`, `src/utils/missing.ts`)

**Verdict: MERGE** (into the same "Attendance Risk" screen as #20/#21)

**Evidence:**
- Simplest of the three: key volunteer (served ≥2 times in a 6-week lookback)
  who has 0 check-ins (of any kind) in the last 2 weeks (`missing.ts:77-83`).
  This is essentially Drift's "Gone" status with a shorter window and a
  volunteer-only population filter. Compare `missing.ts` line-for-line against
  `drift.ts`: both bucket check-ins into "recent window" vs. "history window,"
  both find a `lastSeen` date, both compute a missing/dropped duration. Two
  independent implementations of nearly the same idea, already producing
  overlapping membership with #21's "Gone" tier for anyone who happens to be a
  "key volunteer."
- `missingWeeks: Math.max(2, missingWeeks)` (`missing.ts:94`) floors the
  displayed number at 2 regardless of actual elapsed time — so someone who
  actually stopped coming 9 weeks ago and someone who stopped 2 weeks ago look
  identical until the floor is exceeded, understating urgency for the person
  who's been gone longest, right on a screen whose entire job is urgency
  triage.
- No export/action difference from Drift or Burnout — same avatar-card
  pattern (`MissingVolunteersReport.tsx:78-96` is nearly identical DOM
  structure to `BurnoutReport.tsx:80-102` and `DriftReport.tsx:82-108`),
  reinforcing that these are one feature split into three files.

**Top defects:**
1. Redundant with Drift's "Gone" status for the "key volunteer" subpopulation
   — a volunteer disappearing shows up as a full incident on two separate
   sidebar items.
2. `Math.max(2, ...)` floor hides real severity ordering within the "≥2 weeks"
   bucket.

**Cheapest fix:** Fold into the merged Attendance Risk screen as a filter
("Key volunteers only") rather than a separate nav item; drop the floor and
show actual missing-weeks count, sorted true-descending.

**Open question:** Does the "key volunteer" designation (≥2 serves in 6 weeks)
match how staff actually think about "key" people, or is this a proxy that
undercounts people who serve rarely but critically (e.g. quarterly tech
booth)?

---

## #23 — Recruitment Intelligence (`src/components/RecruitmentReport.tsx`, `src/utils/recruitment.ts`)

**Verdict: SIMPLIFY**

**Evidence:**
- Candidate = adult, worship ≥4/8wk, serving ≤1, scored
  `worship*10 + (parent?20:0) + (tenure>6mo?10:0)` (`recruitment.ts:120-123`) —
  score is presented as `Match Score: 73` (`RecruitmentReport.tsx:93`) with no
  explanation of what the number means or its scale/ceiling anywhere in the
  UI; it reads as a precise, validated metric but is an arbitrary unbounded
  weighted sum invented for this feature.
  This is exactly the kind of heuristic-presented-as-insight the persona
  brief calls out: nothing in the card discloses "this is a rule-of-thumb
  score, not a probability."
  If the church runs 3 worship services in 8 weeks total (small church,
  bi-weekly attendance patterns), the `worship >= 4` gate can *never fire for
  anyone*, and the empty state ("Everyone seems to be serving! Or no one is
  attending enough." — `RecruitmentReport.tsx:74`) can't distinguish this from
  a genuinely healthy roster. That empty-state copy is honest about the
  ambiguity, which is good, but it doesn't help the user resolve it.
- The "Ask Script" generator (`generateAskScript`, `recruitment.ts:141-176`)
  produces a full canned pastoral email/talking-point script per person,
  copy-to-clipboard included. This is a genuinely differentiated, actionable
  feature — the strongest thing in this whole area — but it's buried behind a
  toggle inside a report most users will only glance at.

**Top defects:**
1. Opaque "Match Score" with no legend, unit, or max — user moment: Emily
   sees "Match Score: 73" next to one candidate and "41" next to another and
   has no idea if 73 is "obviously ask this person" or "barely worth a coffee
   chat."
2. `worship >= 4` hard gate breaks for churches with fewer than 4
   opportunities to attend in the 8-week window (multi-week sermon series
   churches, monthly-cadence smaller congregations).

**Cheapest fix:** Replace the numeric score with the 2-3 factors that drove it
as plain badges (already half-done via `potentialRoles`/`parent-badge`,
`RecruitmentReport.tsx:89-96`) and drop the number entirely — the badges
already tell the real story better than "73" does.

**Open question:** Does "View Ask Script" get used, or does everyone just read
names off the card list? If the script is the actual value driver, it should
be the primary CTA, not a secondary toggle.

---

## #24 — Retention Funnel / Newcomer (`src/components/NewcomerFunnel.tsx`, `src/utils/retention.ts`)

**Verdict: SIMPLIFY**

**Evidence:**
- Funnel chart with 4 static steps (1st/2nd/3rd visit/"Member" defined as 4+
  visits) over a 12-month newcomer cohort (`retention.ts:61-66`). "Member" is
  an internal label choice equating a 4th check-in with membership — nowhere
  disclosed to the viewer that this is Locus's own definition, not a PCO
  status. A pastor reading "Member: 42%" could reasonably believe that's
  pulling from PCO's actual membership field.
- No names, no drill-down, no export (compare to every other feature in this
  area, which all list actual people with avatars and CSV export). This is
  the one screen in the whole area where the underlying people are completely
  anonymized into a single aggregate — which also makes it the one screen
  where a low number is least actionable: knowing "38 people stalled after
  visit 1" gives staff no way to act unless they can click through to who.
- Component only takes `auth`, not `students` (`NewcomerFunnel.tsx:6-8`) —
  structurally can't add a drill-down without a signature change, suggesting
  it was deliberately built as a pure aggregate viz.
- Calls `fetchRecentCheckIns(auth)` with the *default* 100-page fetch
  (`NewcomerFunnel.tsx:18`) — the largest fetch of any screen in this area,
  for arguably the least detailed output (four numbers).

**Top defects:**
1. "Member" step is an invented threshold presented with the visual authority
   of a PCO status field — trust risk per the persona brief's standing
   concern #6.
2. Zero drill-down on the one screen most likely to prompt "who, specifically,
   should I follow up with?"

**Cheapest fix:** Rename "Member" step to "4+ Visits" (say exactly what it
measures) and add a click-through from each funnel stage to the person list
behind it — the underlying `checkInsByPerson` map already has everyone's ID,
it's just discarded before reaching the component.

**Open question:** Is a funnel chart (which implies sequential, irreversible
progress) the right shape here, or would a simple retention-rate number with
a trend line read faster for a pastor skimming between meetings?

---

## #25 — Bus Factor (`src/components/BusFactorGraph.tsx`, `src/utils/busFactor.ts`)

**Verdict: KEEP** (best-designed screen in this area, minor fixes)

**Evidence:**
- Clear, single, useful question: which volunteers serve *alone* on a team,
  making them a single point of failure (`busFactor.ts:5-11`, clusters
  check-ins into 60-minute shift windows and flags shifts where cluster
  size == 1). Bar chart *and* backing table (`BusFactorGraph.tsx:74-134`) —
  the one screen in this area that pairs a chart with the literal data behind
  it, which is good practice per the accessibility/comprehension concern.
- Chart truncates to top 5 (`.slice(0, 5)`, `BusFactorGraph.tsx:60`) while the
  table shows top 10 (`.slice(0, 10)`, line 115) — two different cutoffs on
  the same screen with no stated reason and no "see all" for the rest.
- Custom tooltip is a raw `<div>` with hardcoded inline styles
  (`BusFactorGraph.tsx:84-93`), not a native SVG/HTML pattern reachable by
  keyboard — a keyboard-only or screen-reader user gets the bar chart with no
  accessible name and no way to trigger the tooltip at all; the table below is
  the only accessible path to the same data, which is fine as a fallback but
  isn't documented as intentional.

**Top defects:**
1. Chart caps at top-5 while the table caps at top-10 — arbitrary
   inconsistency likely to produce a "why isn't so-and-so on the chart"
   question.
2. Chart data is mouse-only; no keyboard/AT path to the tooltip content (table
   compensates, but only if the user knows to scroll down).

**Cheapest fix:** Match the two cutoffs (both 10, or both 5) and add a caption
under the chart pointing at the table ("full list below") so the redundancy
reads as intentional accessibility fallback rather than accidental
inconsistency.

**Open question:** Does "solo shift" always mean "risk," or are some
solo-covered roles (e.g. sound booth) fine to run with one person by design?
Right now every solo shift scores identically regardless of role criticality.

---

## #26 — Volunteer Web (`src/components/VolunteerWeb.tsx`, `src/utils/volunteerWeb.ts`)

**Verdict: CUT**

**Evidence:**
- Force-directed graph of who serves with whom, custom physics implemented
  from scratch (`computeForceLayout`, `volunteerWeb.ts:142-251`, 300
  iterations of hand-rolled repulsion/attraction/gravity). This is the same
  underlying data as Bus Factor (`buildVolunteerGraph` also imports
  `classifyEvent` and clusters by shift, `volunteerWeb.ts:3,31-56`) rendered
  as a node graph instead of a table.
- **No legend.** `getTeamColor` hashes a team name to one of 10 hardcoded hex
  colors (`VolunteerWeb.tsx:16-23`) and colors every node by team, but nothing
  on screen maps color → team name. The only way to learn a node's team is to
  hover it (`VolunteerWeb.tsx:96-172`), which also means color is the *sole*
  differentiator for anyone not actively hovering — a textbook color-only
  encoding violation the persona brief explicitly flags (concern #5), and with
  10 possible hash buckets, two visually-similar teams (`#FF6B6B` red vs.
  `#F1948A` salmon) are a real risk of misread even for a sighted user with
  normal color vision.
- Entirely `<svg>` circles/lines with mouse-only `onMouseEnter`/`onMouseLeave`
  handlers (`VolunteerWeb.tsx:135-146`) — no `role`, no `tabIndex`, no
  keyboard equivalent, no text alternative anywhere in the component. A
  screen-reader user gets nothing: no node list, no team list, no
  connection list. This is the least accessible screen in the entire area.
- No click-through to a person record, no export, no filter — purely a static
  "look at this" visualization with nothing to do afterward, which is exactly
  the persona brief's "beautiful chart nobody acts on" failure mode (concern
  #1).
- Bus Factor already surfaces the single actionable fact this graph could
  produce (who's isolated) via a table with numbers. Volunteer Web adds
  nothing actionable Bus Factor doesn't already say better.

**Top defects (ranked):**
1. No legend for a color-only team encoding — the graph is unreadable without
   hovering every node individually.
2. Zero accessibility path (no keyboard, no ARIA, no text fallback) — this
   screen is unusable by anyone not driving a mouse.
3. No action from insight — you can look, you cannot click, export, or filter.

**Cheapest fix:** If kept at all, add a legend and make it Bus Factor's
"visualize" toggle rather than a separate sidebar item — same data source,
same audience, half the maintenance surface. As a standalone item, delete it;
the hand-rolled physics engine (110 lines) is a lot of code to maintain for a
screen with no legend and no click-through.

**Open question:** Has any pastor or admin actually referenced this screen in
a real decision, or does it only get opened once out of curiosity? The
custom force-layout code is expensive to maintain (300-iteration physics loop
recomputed on every data change, `VolunteerWeb.tsx:79`) for a payoff that's
currently undocumented.

---

## #27 — Emergency Alerts (`src/components/EmergencyAlerts.tsx`)

**Verdict: CUT** (as currently built — this is not a feature, it's a
prop that lies to the user)

**Evidence:**
- Title says "Emergency Alerts (Twilio)" (`EmergencyAlerts.tsx:39`). The send
  handler is `setTimeout(() => { setSentSuccess(true); ... }, 1500)`
  (`EmergencyAlerts.tsx:26-33`) with the code comment "Mock API call to
  Twilio" directly above it (line 25). There is no Twilio integration, no
  network call, nothing — the button fabricates a success banner reading "SMS
  blast sent successfully to {recipients.length} members!" for a message that
  was never transmitted anywhere.
- This is on a screen labeled "Executive Dashboard" (read-only, per the
  persona brief and per `IntelligenceLayout`'s own subtitle) whose entire
  premise is *sending real emergency communications*. If Dr. Robert, the
  executive pastor, believes this screen is real (nothing in the UI indicates
  otherwise — no "demo mode," no disabled state, no watermark) and uses it
  during an actual emergency (weather closure, security incident — the exact
  scenario "Emergency Alerts" is named for), the congregation receives
  nothing while the pastor believes they were notified. This is the single
  most severe trust violation in the whole area, directly matching the
  persona brief's concern #6 ("Presenting a simulation as an insight destroys
  credibility permanently") — except here it's worse than a simulated
  *insight*, it's a simulated *action with real-world safety stakes*.
- Recipient count itself is real (`students.filter(s => s.phoneNumber...)`,
  `EmergencyAlerts.tsx:15-17`) which makes the fake send even more convincing
  — the setup work is real, only the payoff is fake.

**Top defects:**
1. Fabricated success state for a safety-critical action with zero visual
   indication it's non-functional. This is not a UX nit, it's a
   liability-shaped hole in the product.

**Cheapest fix:** Either wire it to a real SMS provider before shipping, or —
at minimum, immediately — replace the fake success toast with a hard-disabled
button and a banner: "SMS sending is not yet connected. This is a preview of
the composer only." Do not ship a "success" state for an unimplemented
send path, ever, regardless of target audience.

**Open question:** none needed — this is a ship-blocker, not an open
question.

---

## #28 — Automations: new baby / elderly rides / first-time giver, etc.
(`src/components/AutomationsReport.tsx`, `src/utils/automations.ts`)

**Verdict: SIMPLIFY** (real detection logic, entirely fake action layer —
split the two apart)

**Evidence:**
- 8 parallel "lanes" (First-Time Giver, New Baby/DoorDash, Elderly/Uber,
  Birthday, Expiring/Expired Background Check, Grade Promotion, College
  Send-off), each with independently-managed dismiss state
  (`AutomationsReport.tsx:31-38`) — eight `useState<Set<string>>` calls doing
  the same job, a maintainability smell suggesting each lane was copy-pasted
  rather than generalized.
- **Every "approve" action is fake**, funneled through one handler:
  `handleApprove = (id, action) => { alert('Action "${action}" approved... 
  (Mocked action)'); ... }` (`AutomationsReport.tsx:84-94`). Unlike Emergency
  Alerts, the word "Mocked" does appear — but only inside a native
  `window.alert()` dialog the user must actually read, while every button
  label makes a specific, confident claim: "Send DoorDash Meal," "Send Uber
  Ride," "Notify Pastor in Slack," "Remove from Roster," "Promote Grade."
  "Remove from Roster" in particular sits right next to "Expired Background
  Checks (Safe Sanctuary)" (`AutomationsReport.tsx:246`) — a child-safety
  compliance feature — implying a real roster mutation that never happens; the
  person stays exactly as "expired" in PCO after being dismissed from this
  list, with nothing to show a real admin the check still needs handling
  elsewhere.
- Detection logic itself is legitimate and PCO-derived for birthdays, grade
  promotions, college send-offs, and background checks
  (`automations.ts:35-147`, all reading real `Student` fields). But
  **first-time-giver detection depends on `first_time_giver`/`first_gift_date`
  custom fields** read straight off the PCO Person record
  (`src/utils/pco.ts:231,284-285`) — and the area's own standing context states
  Locus has "no Giving API access." This only works if a church is manually
  maintaining giving-status custom fields in PCO People, which is not
  something PCO People does by default. The UI presents "🎉 First Time Giver
  Alert" with the same visual confidence as the birthday lane, with nothing
  disclosing that it depends on a custom field most churches will never
  populate — for those churches this lane will silently, permanently show
  "No new first time givers this week," indistinguishable from a healthy
  state.
- Dismissing an item is purely client-side React state
  (`dismissedX: Set<string>`) with no persistence — refresh the page and every
  dismissed automation reappears. For a "process this list to zero" workflow,
  that's a broken promise of its own, independent of the fake-send issue.

**Top defects (ranked):**
1. Confident, specific action buttons ("Send Uber Ride," "Remove from
   Roster") that do nothing but pop a browser `alert()` — same class of
   defect as Emergency Alerts, one severity notch down only because the
   consequences (a missed birthday email vs. a missed evacuation notice) are
   lower stakes, but "Remove from Roster" next to an expired child-safety
   background check is not low stakes.
2. Dismissal state doesn't persist — refresh and the "processed" queue is
   back to full, with no audit trail of what was actually acted on outside
   this session.
3. First-Time Giver lane silently depends on a custom field the product has
   no way to guarantee is populated, with no in-UI disclosure.

**Cheapest fix:** Split the lanes into two visually distinct groups: "Detected
from your data" (birthdays, promotions, background checks — all real,
PCO-sourced) vs. "Requires integration" (DoorDash, Uber, Slack, Twilio-style
sends) and hard-disable the second group's buttons until they're real, exactly
as recommended for #27. Persist dismissal state to `localStorage` at minimum
so "processing the queue" survives a refresh.

**Open question:** For the four detectors that *are* real (birthdays,
promotions, checks, send-offs), does anyone currently use this screen as
their single source of truth, or does staff double-check PCO directly because
they've learned the "approve" buttons don't do anything? That would explain
away most of the workflow value this screen claims to deliver.

---

## Cross-area verdict list

| # | Feature | Verdict |
|---|---------|---------|
| 19 | Pastoral Co-Pilot | CUT |
| 20 | Burnout Risk | MERGE → Attendance Risk |
| 21 | Predictive Attrition (Drift) | MERGE → Attendance Risk |
| 22 | Missing Volunteers | MERGE → Attendance Risk |
| 23 | Recruitment Intelligence | SIMPLIFY |
| 24 | Retention Funnel (Newcomer) | SIMPLIFY |
| 25 | Bus Factor | KEEP |
| 26 | Volunteer Web | CUT |
| 27 | Emergency Alerts | CUT (as built — trust/safety issue) |
| 28 | Automations | SIMPLIFY (split real detection from fake actions) |

## Single most important finding for this area

Two of these ten "Executive Dashboard / read-only" screens — Emergency Alerts
and Automations — put confident, specific action buttons in front of a pastor
("Send SMS blast to 340 members," "Remove from Roster," "Send Uber Ride") that
are 100% client-side theater: a `setTimeout` and a `window.alert()` with
nothing behind them, on a surface the product's own architecture calls
read-only. Emergency Alerts in particular fabricates a "sent successfully"
banner for a feature literally named for crisis communication. This is not a
polish issue to fix in a later pass — it is the one place in this entire audit
where the gap between what the UI claims and what the system does could cause
real-world harm (a pastor believing an evacuation SMS went out when it did
not), and it should be treated as a ship-blocker independent of whatever the
critique loop decides about IA and merges.
