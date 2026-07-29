# Area C — pastoral-ops — Proposal v1 (Round 1 synthesis)

Synthesised from `r1-uxr.md`, `r1-church-admin.md`, `r1-youth.md`,
`r1-children.md`. Every load-bearing claim below was re-verified against source;
where a critic was wrong or incomplete, that is stated inline.

---

## 1. Changes since last round

Round 1 — no prior proposal. Nothing is CONVERGED yet by the two-round rule.

Five findings I verified myself that change the shape of the critics' arguments:

1. **`drift.ts:21` is arithmetically broken and no critic caught it.**
   `subMonths(now, 1.5)` in date-fns v4 does not give 6 weeks — it gives **two
   calendar months** (verified: 2026-07-29 → 2026-05-29, 61 days; 2026-01-15 →
   2025-12-15, 31 days). `drift.ts:62` then divides that count by `6` weeks.
   `recentRate` is inflated ~45% on a normal month and the window length swings
   between 31 and 61 days depending on which month you open the screen. Every
   `dropPercentage` on this screen is understated by a variable amount. This
   moves #21 from "arguable model" to "wrong numbers", and it settles (a).
2. **`classifyEvent` checks Serving keywords *before* Worship keywords**
   (`burnout.ts:15` then `:20`) and `'ministry'` is a Serving keyword. An event
   named "Kids Ministry" — one of the most common PCO check-in event names in
   existence — classifies as **Serving**, so every child checking in there
   becomes a serving volunteer. The mock fixture dodges this by naming its kids
   event "Sunday Kids Church" (`mock-api/data.js:223`), which hits the Worship
   branch. This is the shared dependency of #20, #22, #25 and #26 and it is the
   single cheapest high-leverage fix in the area.
3. **That same misclassification silently zeroes the children's-safety signal.**
   `busFactor.ts:30-33` admits *all* check-ins to a Serving-classified event
   (`servingEventIds.has(eventId) || kind === 'Volunteer'`). For a church whose
   kids event is named "Kids Ministry", the children inflate `teamSize`,
   `teamSize === 1` never fires (`busFactor.ts:120`), and `soloCount` is
   permanently 0 for exactly the team the children's director cares about. This
   partially settles (c) against the critic.
4. **`copilot.ts:324` is a live type error** — `action: { label, view }` assigned
   to a field declared `action?: string` (`copilot.ts:23`). Confirmed
   `TS2322` under direct `tsc`. The navigation the bot promises was never wired
   to anything; this is not an oversight, it is dead code that never compiled
   against its own interface. Settles (b).
5. **`copilot` is the default landing view for the Intelligence role**
   (`App.tsx:83`, `setCurrentView(role === 'core' ? 'dashboard' : 'copilot')`).
   No critic noticed. Cutting #19 is not just a route deletion — it forces
   choosing a new landing surface for the entire Intelligence workspace.

Also verified as stated by critics, no correction needed: the fake Twilio send
(`EmergencyAlerts.tsx:26-33`) and its unconditional success banner (`:45-47`);
the unfiltered recipient list (`:15-17`, no `isChild`); `handleApprove` as
`alert()` + local dismiss (`AutomationsReport.tsx:84-94`); the `Math.max(2, …)`
floor (`missing.ts:94`); the 20-vs-100 page fetch split (Drift/Missing/BusFactor/
VolunteerWeb pass `20`; Burnout/Recruitment/Newcomer/CoPilot take the `100`
default at `pco.ts:507`); the unbounded `Match Score` (`recruitment.ts:120-123`);
`getNewBabies` as `age === 0` (`automations.ts:168-170`); `getCollegeSendOffs`
hardcoded to August (`automations.ts:107-111`); `drift.ts:31` restricting to
`kind === 'Regular'` (so #21 genuinely does *not* overlap #20/#22's population).

One thing no critic checked, which I am flagging as new: **`automations.ts:122-147`
filters on `s.backgroundCheckExpiresAt` being truthy.** A volunteer who has
**never had a background check at all** (null field) appears in neither the
expiring nor the expired lane. The area's most-praised feature cannot see the
worst case it exists to catch.

---

## 2. Per-feature decisions

| # | Feature | Verdict | Rationale (one line) | Converged? |
|---|---------|---------|----------------------|-----------|
| 19 | Pastoral Co-Pilot | **CUT** | Keyword router that returns the wrong report for the two most natural queries, with navigation that never compiled; every intent has a better screen one click away. | N (4/4 critics negative, split on CUT/DEMOTE/MERGE) |
| 20 | Burnout Risk | **MERGE** (becomes host: "Volunteer Attendance Risk") | Real gap PCO doesn't fill, same population and same `classifyEvent` dependency as #22 — one screen, two flags. | N |
| 21 | Predictive Attrition (Drift) | **CUT** | Window arithmetic is wrong (see §1.1), no seasonality, no ministry context, and children land on an "attrition" list; different population from #20/#22 so it does not merge either. | N (critics split 3 ways) |
| 22 | Missing Volunteers | **MERGE** into #20 | Same volunteer population, same `classifyEvent`, same card DOM, one extra threshold — a filter, not a destination. | N |
| 23 | Recruitment Intelligence | **SIMPLIFY** | Candidate list + Ask Script are the strongest thing here; the invented `Match Score` and the missing clearance gate are the defects. | N (4/4 SIMPLIFY) |
| 24 | Retention Funnel (Newcomer) | **SIMPLIFY** | Only genuinely safe aggregate in the area, but "Member" is an invented threshold with PCO-field authority and there is no drill-down. | N |
| 25 | Bus Factor | **SIMPLIFY** (+ new severity tier) | Best-built screen in the area; computing the right signal under the wrong headline, and currently blind to the case that matters (see §1.3). | N |
| 26 | Volunteer Web | **CUT** | 250 lines of hand-rolled physics rendering Bus Factor's data with no legend, no keyboard path, no click-through, no action. | N (4/4 negative) |
| 27 | Emergency Alerts | **CUT — domain veto** | Fabricated success banner on a safety-critical send, recipient list with no `isChild` filter and no guardian routing. Not a fix, a deletion. | N (4/4 CUT) |
| 28 | Automations | **SIMPLIFY + partial CUT** | Four real PCO-derived detectors buried among four dead or speculative lanes, all behind `alert()` fake writes — including two safeguarding-critical ones. | N |

Net nav effect: **10 Intelligence nav slots → 5** (`burnout` renamed, plus
`recruitment`, `retention`, `bus-factor`, `automations`). Five routes removed,
zero added.

---

## 3. Settling the four disagreements

### (a) #20/#21/#22 — MERGE all three (uxr) vs CUT #21 (youth) vs SIMPLIFY both (admin)

**Decision: merge #20 + #22 into one screen; cut #21 outright.**

The UXR agent is right that these read as one question and wrong that they are
one population. `drift.ts:31` restricts to `kind === 'Regular'` with the explicit
comment "Volunteer burnout is handled elsewhere" — Drift is a
whole-congregation attendance tool that includes children (the children's agent
verified this and correctly declined to own it). #20 and #22 both run on
`classifyEvent`-derived Serving check-ins over a volunteer population and share
the same card layout. **#20 + #22 merge cleanly; #21 does not belong in
pastoral-ops at all.**

The youth agent wins on #21 but for a weaker reason than the one available. The
attendance-count critique is correct and unfixable inside this file, but the
harder fact is §1.1: the recent window is not the window the code claims, so the
headline percentage is wrong before any modelling debate starts. A feature whose
primary number is arithmetically incorrect and unnoticed through a full build
does not get "rebuilt" — it gets deleted, and the concept re-earns its slot in a
later round if Area D wants it.

The admin agent's SIMPLIFY loses on both: it leaves three nav slots standing, and
it treats the drift thresholds as a tuning problem ("add a seasonality guard")
when the window they are applied to is itself variable-length.

### (b) #19 Pastoral Co-Pilot — CUT (uxr) vs DEMOTE (admin, children) vs MERGE (youth)

**Decision: CUT.**

UXR wins. The two decisive facts are verified: bare `"who's missing?"` routes to
Ghosts, not Missing Volunteers (`copilot.ts:120` catches any `'missing'`
substring and sits *before* nothing — the Missing Volunteers branch at `:97`
requires the full phrase "missing volunteer"/"haven't seen"/"missing person");
and `'risk'` routes to Burnout (`copilot.ts:47`) while no attrition or drift
intent exists anywhere in the file (grepped: zero matches). A user reading the
sidebar labels and typing them back gets confidently wrong reports.

DEMOTE (admin, children) loses on a mechanical point: there is no host screen
that wants a chat panel. "Demote to a card" is not available for a full-height
conversational surface; demoting it means rebuilding it as something else, which
is a cut plus a build, so call it that.

MERGE (youth) loses on the same ground — "fold the intents into a search bar" is
not a merge into an existing surface, it is a different feature. It is a good
idea and it is carried below as new idea #1, where it has to pay for itself.

**What CUT forces that no critic mentioned:** `App.tsx:83` makes `copilot` the
Intelligence workspace's landing view. Deleting it requires repointing that
default. Proposed target: the merged Volunteer Attendance Risk screen — it is
the only surface in this area with a weekly cadence and a name a pastor can act
on.

### (c) Bus Factor already computes a child-safety ratio — real, or a stretch?

**Decision: half real. The reframe is correct; the "already computes it" claim is
a stretch, and acting on it as stated would ship a signal that is silently zero
for the churches that need it.**

What `calculateBusFactor` actually computes (verified, `busFactor.ts:13-125`):
per `(person, event)` pair, how many 60-minute check-in clusters that person was
the *only* member of. That is genuinely "one adult, alone, on a serving event" —
the children's agent is right that this is the adult side of a ratio and that
the "succession planning / bus factor" headline sends it to the wrong reader.

Three reasons it is not a live ratio signal today:

1. **It cannot count children present.** Children check into a *different* event
   (fixture: "Sunday Kids Church", `mock-api/data.js:223`) from the volunteer
   team event ("Kids Ministry Team", `:234`). `calculateBusFactor` clusters
   strictly within a single `eventId` (`busFactor.ts:36-48`) and never joins two
   events by time window. It knows an adult was alone on a team; it does not
   know a child was in the room.
2. **For the realistic naming case it returns zero.** Per §1.3 — a church whose
   kids event is called "Kids Ministry" gets that event classified Serving, every
   child check-in admitted to the cluster, `teamSize` never 1, and `soloCount`
   permanently 0. The feature would be *most* silent exactly where the children's
   agent wants it loudest.
3. **There is no adult/child gate on cluster membership.** `analyzeCluster`
   (`busFactor.ts:95-125`) does not consult `student.isChild`, so a teen helper
   counts as a second adult and suppresses a real solo flag.

So: adopt the reframing, reject the premise that it is free. #25 gets a
`soloWithMinors` severity tier, an `isChild` exclusion from cluster membership,
and an explicit "we cannot see how many children were present" caveat in the UI
until an event-join exists. Do not market this as ratio compliance in v1.

### (d) #27 Emergency Alerts — domain veto

Youth and children's ministry both flagged this on minor-safety grounds
(recipients = every `Student` with a non-empty `phoneNumber`, `:15-17`, no
`isChild` exclusion, no guardian routing, no split-household handling, no
confirmation step, no audit trail) and UXR and admin both flagged the fabricated
success banner. **A domain veto is not a vote — it outranks the IA discussion
entirely.**

**What the veto forces, precisely:** delete the send path, not disable it. Both
safety critics made the same independent observation — the UX is *copy-complete*
and the only missing piece is one function body. Leaving a disabled button and a
"not yet connected" banner leaves a loaded feature one commit from shipping,
reviewed by nobody, into a building with 300 children in it. The correct state
after this round is that no code path in the repo exists which, given a Twilio
credential, sends anything.

It also forces a rule the rest of the area inherits: **any control whose label
asserts a real-world effect must either perform it or not exist.** That rule
independently kills "Remove from Roster" and "Promote Grade" in #28, which are
`alert()` + local dismiss (`AutomationsReport.tsx:84-94`) sitting on a
safeguarding gate and on the field the youth agent called worth more than every
dashboard combined.

---

## 4. The concrete work, ordered by value-per-effort

### 4.1 Delete the Emergency Alerts send path (veto; ~30 min)

- Delete `src/components/EmergencyAlerts.tsx`, `src/components/EmergencyAlerts.css`,
  `src/components/EmergencyAlerts.test.tsx`.
- Delete the `currentView === 'emergency'` block, `App.tsx:944-948`, and the
  `EmergencyAlerts` import.
- Delete the sidebar item, `SidebarIntelligence.tsx:222-226`.
- If a stub is wanted for roadmap purposes it must be static copy with **no
  `<textarea>`, no recipient count, and no button** — the recipient count is the
  part that makes the fake convincing (`:40`).

### 4.2 Delete the two fake safeguarding writes in #28 (veto tail; ~30 min)

In `src/components/AutomationsReport.tsx`:
- Remove the `Remove from Roster` action button from the expired-background-check
  lane (~`:246-267`) and the `Promote Grade` button from the promotions lane.
  Keep the lanes and their detection — only the buttons asserting a PCO write go.
- Remove those two branches from `handleApprove` (`:84-94`). Rename the remaining
  handler to `handleDismiss` so no code path is named "approve" while doing
  nothing but hiding a row.
- Replace with a link out to the person's PCO record — the only honest action
  available today.

### 4.3 Fix `classifyEvent` — unblocks #20, #22, #25 (~2 h, highest leverage)

`src/utils/burnout.ts:11-25`:
- Return a count of `'Unknown'` events alongside the classification so every
  consumer can surface "N of M events could not be classified" instead of a
  false "All Clear! 🎉" (`BurnoutReport.tsx:74-78`).
- Move the keyword lists out of the module and into `ConfigModal` /
  `GraderOptions`-style config so a church can name its own events. Both UXR and
  admin asked for this independently.
- Resolve the `'ministry'` precedence trap: an event matching a Worship keyword
  must not be captured by `'ministry'`/`'team'` first. Minimum viable rule —
  check Worship keywords before Serving keywords, and treat `kind === 'Volunteer'`
  as the authoritative Serving signal (it already overrides at `burnout.ts:58`
  and `missing.ts:55`; `busFactor.ts:32` should trust it the same way instead of
  admitting all check-ins to a name-matched event).

### 4.4 Cut #19 and repoint the Intelligence landing view (~1 h)

- Delete `src/components/CoPilot.tsx`, `src/components/CoPilot.css`,
  `src/components/CoPilot.test.tsx`, `src/utils/copilot.ts`.
- Delete `App.tsx:764-768` and the `CoPilot` import; delete
  `SidebarIntelligence.tsx:21-25`.
- **Change `App.tsx:83`** — `setCurrentView(role === 'core' ? 'dashboard' : 'copilot')`
  → point Intelligence at the merged risk screen (§4.6) or `dashboard`.
- Note for whoever does this: `copilot.ts` is also the only consumer of
  `calculateSentimentPulse` in this area; check `src/utils/sentiment.ts`'s other
  callers before assuming it can go too.

### 4.5 Cut #26 Volunteer Web (~30 min)

- Delete `src/components/VolunteerWeb.tsx`, `VolunteerWeb.css`,
  `src/utils/volunteerWeb.ts` (251 lines, incl. the 300-iteration O(n²)
  `computeForceLayout`).
- Delete `App.tsx:869-874` and `SidebarIntelligence.tsx:117-121`.
- Nothing else imports `buildVolunteerGraph` — verified.

### 4.6 Merge #22 into #20 → "Volunteer Attendance Risk" (~1 day)

- Keep `src/components/BurnoutReport.tsx` as the host, rename the component and
  the route from `burnout` to `volunteer-risk`; delete
  `src/components/MissingVolunteersReport.tsx` and its route
  (`App.tsx:821-826`) and sidebar item (`SidebarIntelligence.tsx:69-73`).
- Keep both utils. One person list, one row per person, a `flags: ('Overserving'
  | 'Missing')[]` array on the row rather than two mutually-exclusive vocabularies
  (`High/Medium/Low` vs a raw week count). The correlation case UXR asked about
  — both flags on one person — becomes visible for free and is the merged
  screen's headline.
- Drop the `Math.max(2, missingWeeks)` floor (`missing.ts:94`) and sort by true
  weeks-missing descending.
- Unify the fetch depth: `BurnoutReport.tsx:25` uses the 100-page default,
  `MissingVolunteersReport.tsx:25` passes `20`. Pick one, state it in a comment
  that matches the code.
- Remove the `ui-avatars.com` fallback (`BurnoutReport.tsx:84`,
  `MissingVolunteersReport.tsx:81`) — the youth agent is right that this sends a
  named person, possibly a minor helper, to a third-party image host to render a
  coloured circle that can be drawn locally from initials.
- Add the adult gate `burnout.ts:79` admits it lacks ("let's just flag anyone
  matching the pattern") — with §4.3 unfixed, a child in a "Kids Ministry" event
  can currently be labelled a High Risk burnout case.

### 4.7 #25 Bus Factor — reframe and unblock the minors case (~1 day)

- `busFactor.ts:95-125`: skip `student.isChild` when building cluster membership,
  so a teen helper cannot mask a solo adult.
- `busFactor.ts:30-33`: stop admitting every check-in on a name-matched Serving
  event; rely on `kind === 'Volunteer'` plus the corrected classification (§4.3).
  Without this the whole tier is silently zero for "Kids Ministry"-named events.
- Add `servesMinors: boolean` to `BusFactorCandidate` and a **"Solo with minors"**
  tier rendered above the chart as a list, not a bar — the children's agent's
  point that this is a compliance item, not ops trivia, is correct even at weekly
  cadence.
- Change the screen's framing copy (`BusFactorGraph.tsx:69-72`, "single points of
  failure") to team-level language per the admin agent — "teams that need a second
  trained volunteer" — which fixes the "named volunteer ranked as a liability"
  problem without losing the finding.
- Align the two cutoffs: chart `.slice(0, 5)` (`:60`) vs table `.slice(0, 10)`
  (`:115`).
- Add a UI caveat: this counts volunteers on a team, **not** children present.

### 4.8 #23 Recruitment — remove the score, add the gate (~half day)

- Delete `score` from `RecruitmentCandidate` (`recruitment.ts:120-123`) and the
  `Match Score: {n}` badge (`RecruitmentReport.tsx:93`). Replace with the two
  facts it is made of — "Worship 6× / Serving 0×" — which admin and UXR both
  proposed independently and which the `potentialRoles`/parent badges already
  half-render.
- **Gate the Kids/Student Ministry roles on clearance.** `recruitment.ts:112`
  pushes `'Kids Ministry'` purely on household child age, with no reference to
  `backgroundCheckExpiresAt`, while `generateAskScript` (`:141-176`) drafts a
  ready-to-send invitation. Both the youth and children's agents flagged this
  independently — it is the second-strongest safety finding in the area after
  #27. Add a clearance badge and make the script's first line the clearance step.
- Label the Ask Script "draft — edit before sending" and reconsider auto-inserting
  children's first names (`:155-159`) into a generated outbound message.
- Soften the `worship >= 4` hard gate (`:95`) so small/bi-weekly-cadence churches
  can produce candidates at all.

### 4.9 #24 Retention Funnel — say what it measures, let people click it (~half day)

- Rename the "Member" step to "4+ Visits" (`retention.ts:61-66`) — it is a Locus
  threshold rendered with the authority of a PCO status field.
- Return person IDs per stage from `calculateNewcomerFunnel` (the
  `checkInsByPerson` map already holds them and discards them) and change
  `NewcomerFunnel`'s props from `{ auth }` to `{ auth, students }` so each stage
  clicks through to the list behind it. UXR and youth both landed on this.
- Note the children's agent's counting caveat: a family's first Sunday counts as
  parent + each child, so the funnel's denominator is households-times-people.

### 4.10 #28 Automations — split real from speculative (~1 day)

- Pin one **safeguarding block** above the lanes: expired + expiring + **never
  had a check** (the null-`backgroundCheckExpiresAt` gap in
  `automations.ts:122-147` — no critic caught it; it is the largest false
  negative on the area's most-praised feature).
- Delete the DoorDash / Uber / Slack lanes and their buttons. Admin's
  third-party-egress argument is decisive: the entire UX presumes a member's home
  address will one day leave PCO for two gig platforms on one click, with no
  consent capture and no confirmation of what is being sent where. Do not teach
  staff a workflow before it is safe.
- Delete the First-Time Giver lane until the `first_time_giver` /
  `first_gift_date` custom-field dependency is real — admin proved it is
  fabricated in `mock-api/data.js:95-108` and the product has no Giving API.
- Fix `getNewBabies` (`automations.ts:168-170`) from `age === 0` to a
  born-in-last-N-days window, and give it household framing ("the Chen family,
  new baby") rather than listing the infant.
- Fix `getCollegeSendOffs` (`:102-117`) — `today.getMonth() !== 7` means the
  entire cohort is skipped for the year if nobody opens the tab in August.
- Collapse the eight `useState<Set<string>>` dismissal hooks (`:31-38`) into one
  keyed map and persist it — dismissals currently vanish on refresh.

### 4.11 Cut #21 Drift (~30 min, but see Q3)

- Delete `src/components/DriftReport.tsx`, `DriftReport.css`,
  `DriftReport.test.tsx`; delete `App.tsx:815-820` and
  `SidebarIntelligence.tsx:61-65`.
- **Do not silently delete `src/utils/drift.ts`.** File the `subMonths(now, 1.5)`
  defect (§1.1) against it and hand it to Area D — see Q3.

---

## 5. Unresolved disagreement — questions round 2 must settle

**Q1. Is `background_check_expires_at` a real PCO People field?**
The admin agent proved `prayer_topic`, `first_time_giver` and `first_gift_date`
are fabricated in `mock-api/data.js:95-108` and read as Person attributes at
`pco.ts:231,284-285`. `background_check_expires_at` is read the exact same way
(`pco.ts:17,231,275`) and generated the exact same way (`data.js:85-92,127`) —
but nobody checked it, and the children's agent's KEEP verdict on #28 rests
entirely on it. If it is a hand-maintained custom field, the area's
highest-rated feature is as dead in a real PCO instance as the lanes everyone
agreed to cut, and §4.10 changes from "harden" to "cut".

**Q2. Does "solo with minors" mean anything at weekly cadence?**
The children's agent wants a same-day alert. §3(c) establishes the code cannot
count children present without joining the kids' attendance event to the
volunteer team event by time window, which nothing in the repo does. Is that join
in scope for this area, or does the tier ship as a lagging weekly flag — and if
lagging, does it still clear the bar the safety veto implies, or is a Tuesday
report on a Sunday breach exactly the "tells you a fire already happened"
failure the children's agent rejected for #22?

**Q3. Does anyone want `drift.ts` once the window bug is fixed?**
I cut #21 from pastoral-ops. The children's agent explicitly declined it (NOT MY
LANE), the youth agent wants it rebuilt around small-group context specifically,
and the admin agent wants it kept with a seasonality guard. Nobody has claimed
ownership of a general-congregation attrition tool. Does Area D take it, or does
the concept die with the screen?

**Q4. Is Burnout's premise sound, or is it an attendance-count model too?**
The admin agent calls #20 "the most legitimate feature in the area". The youth
agent shows that a leader whose worship *is* Wednesday night reads as
`worship == 0, serving >= 6` — permanent High Risk by construction, on the most
faithful people. If that is right, the merged screen in §4.6 inherits a model
defect as bad as the one I just cut #21 for, and it needs a per-team
"expected worship event" mapping before it is worth a nav slot. Round 2 must say
whether the serving-vs-worship dichotomy survives contact with a real volunteer.

**Q5. Is pastoral-ops correctly staff-only?**
The youth agent's opening claim — no leader can reach any of these ten screens,
there is no leader role, no mobile view, and `IntelligenceLayout.tsx:17-31` is a
fixed 250px desktop shell — is unaddressed by every verdict above, mine included.
Either it is out of scope for this area (say so) or it invalidates the value
estimate on §4.6 and §4.7, which are the two items I ranked as worth a day each.

---

## 6. New ideas earned this round (3 max)

**N1. `Cmd+K` jump-to — replaces #19 Pastoral Co-Pilot (§4.4).**
All four critics granted the chat exactly one real job: find a person or a grade
fast. UXR, admin and youth each independently proposed a search box as the
replacement. Build it as a palette over `students` (fuzzy on name) plus the
static list of report routes, opened from anywhere in either layout. No intent
router, no `setTimeout` typing theatre, no wrong-answer surface. New file
`src/components/CommandPalette.tsx`; deletes four files and a route. It cannot
answer "what's my burnout risk" — it navigates you there, which is what the
router was badly imitating anyway.

**N2. "Solo with minors" tier inside #25 — replaces #26 Volunteer Web (§4.5, §4.7).**
Not a new screen; a tier at the top of an existing one. Earned by the children's
agent's finding that the app computes the adult side of a supervision signal and
labels it succession planning. Pays for itself by deleting the 251-line
force-layout module that renders the same clustering with no action attached.

**N3. Pinned safeguarding block on #28 — replaces the flat eight-lane layout and
the "Remove from Roster" fake write (§4.2, §4.10).**
Both youth and children's agents said the same thing from different angles: the
one genuinely urgent thing on that screen has the same visual weight as "first
time giver", and its one-click resolution is a browser `alert()`. One block, three
states (expired / expiring / **never checked**), pinned above the fold, with an
out-link to the PCO record instead of a button that lies. Consumes a nav-slot's
worth of attention without consuming a nav slot.
