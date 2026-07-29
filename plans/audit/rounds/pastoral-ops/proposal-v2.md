# Area C — pastoral-ops — Proposal v2 (Round 2 synthesis)

Synthesised from `r2-uxr.md`, `r2-church-admin.md`, `r2-youth.md`,
`r2-children.md`, attacking `proposal-v1.md`. Claims re-verified against source;
corrections stated inline.

---

## 1. Changes since v1

### 1.1 Killed darling: the safeguarding block was built on a fabricated field

**v1's N3 — "pin one safeguarding block above the lanes" — was wrong, and it was
my strongest remaining feature.** Q1 is answered NO by two critics independently.
I re-verified and it is worse than either stated:

- `mock-api/data.js:81-93` generates `background_check_expires_at` under the
  literal comment `// Simulate Background Check Expiry`, in the same adult loop,
  same `Math.random()`-bucket technique, **three lines above** `prayer_topic`
  (`:95-100`) and `first_time_giver`/`first_gift_date` (`:102-108`) — fields
  already proven fabricated in round 1. It is emitted into the same
  `attributes` literal (`data.js:127-130`) and read straight off the flat
  attributes object at `pco.ts:231,275` with no transform, no `include=`, no
  call to a Background Checks resource.
- The real People API exposes exactly one background-check attribute on the
  Person resource: **`passed_background_check` (boolean)**. There is no expiry
  date on Person. PCO does track expiration dates, but through the dedicated
  Background Checks feature — a different resource this codebase never touches.
- **New, and neither critic caught it:** `grep -rn "passed_background_check"
  src/ mock-api/` returns **zero matches**. Locus does not merely read a
  fabricated field — it *also* fails to read the one real field PCO does
  provide. The honest signal was available the whole time and was never fetched.

**Consequence:** the "Expired Background Checks (Safe Sanctuary)" and
"Background Checks (Expiring Soon)" lanes are dead in production, identical in
kind to First-Time-Giver. v1's §4.10 changes from *harden* to *cut*. The
null-field gap I flagged in v1 as "the largest false negative" is a bug in a
feature that cannot produce a true positive at all. Adopted in full.

### 1.2 Sandbox Mode is inert — standing constraint for this area

Verified myself: `pco.ts:365-373` sets `headers['X-Locus-Sandbox'] = 'true'` when
`sandboxMode` is passed, then falls through to the same live `api.patch` /
`api.post`. `grep -ri sandbox mock-api/` returns zero matches — nothing consumes
the header. **Sandbox Mode is not a mitigation for any write path in this area
and must not be cited as one.** Area C's post-v2 state has zero PCO write paths;
that is now a property to preserve, not an accident.

### 1.3 Adopted from critics without argument

- **Fail-closed clearance, four states** (admin + children). v1's clearance gate
  fails open on missing data — the fabricated field's absence reads as "all
  clear." Adopted, and N2 below gives it a real data source.
- **Team-silo detection is a real loss from cutting #26** (UXR). Adopted as a
  ~15-line set-intersection folded into #25; see N3. v1's "nothing lost" framing
  was wrong for #26 (it was right for #19).
- **#21 CUT is permanent, not provisional** (youth). Adopted, with a ruling on
  the honest replacement in §3.1.
- **N1 Cmd+K as specified rebuilt the same unguarded name→age/grade lookup**
  (children). Adopted; N1 is rescoped to routes only in §6.
- **#24 Retention deserves a distinct verdict** (admin). Conceded — moved
  SIMPLIFY → **FIX**; see §3.3.
- **Dropped items restored**: hardcoded numeric thresholds (§4.4), CSV export of
  named risk labels (§4.5), Bus Factor keyboard/ARIA gap (§4.7).

### 1.4 Q5 answered, not deferred again (youth's demand)

**Pastoral-ops is staff-only, and that is correct for v2.** `App.tsx:79` types
the role as `'core' | 'intelligence'` — there is no third value anywhere in the
repo. `IntelligenceLayout.tsx:17-31` is a fixed 250px desktop shell.
A leader role, a mobile shell and a permission model are three pieces of
platform work, none of which belong to a feature-level audit of ten screens.
**What this costs:** the youth agent is right that §4.6 and §4.7 are therefore
weekly-cadence, staff-read, no-notification surfaces. Their value-per-effort
ranking is downgraded accordingly below — the merged risk screen drops from
"~1 day, top-three" to "~1 day, after the deletions and the classifier fix."
I am no longer selling either as a leader-facing tool.

---

## 2. Per-feature decisions

| # | Feature | Verdict | Rationale (one line) | Converged? |
|---|---------|---------|----------------------|-----------|
| 19 | Pastoral Co-Pilot | **CUT** | Keyword router returning wrong reports, with an `action` field that never type-checked and that `CoPilot.tsx:13-19` has no field to receive; 4/4 critics accept the cut in r2. | **Y** |
| 20 | Burnout Risk | **MERGE** (host: "Volunteer Attendance Risk") | Same population, same `classifyEvent` dependency, same card DOM as #22 — one screen, a `flags` array, two vocabularies collapsed. | **Y** (verdict; spec gained 3 conditions) |
| 21 | Predictive Attrition (Drift) | **CUT** — permanent | Window is 8.4–8.9wk eleven months a year and ~4.4wk in January, divided by a hardcoded `6`; the concept returns as a population filter, not a screen (§3.1). | **Y** |
| 22 | Missing Volunteers | **MERGE** into #20 | A filter and a threshold, not a destination. | **Y** |
| 23 | Recruitment Intelligence | **SIMPLIFY** | Candidate list + Ask Script are sound; the invented `Match Score` and the missing (now fail-closed) clearance gate are the defects. | **Y** |
| 24 | Retention Funnel (Newcomer) | **FIX** (was SIMPLIFY) | Conceded to admin: the only screen in the area with zero live safety findings; it has two specific defects and no ornament to strip. | N (verdict moved this round) |
| 25 | Bus Factor | **SIMPLIFY** (+ minors tier, + silo list, + a11y) | Best-built screen here, wrong headline, silently zero for the churches that need it most until §4.3 lands. | N (scope grew twice) |
| 26 | Volunteer Web | **CUT** | 251 lines of hand-rolled physics with no legend, keyboard path, click-through or action — but its connectivity question is real and moves to #25 (N3). | **Y** (cut); N (successor) |
| 27 | Emergency Alerts | **CUT — domain veto** | Fabricated success banner on a safety-critical send; recipient list with no `isChild` filter, no guardian routing. 4/4 both rounds. | **Y** |
| 28 | Automations | **CUT 3 lanes + SIMPLIFY the rest** | Both background-check lanes join First-Time-Giver as fabricated-field features; the remaining detectors are real but sat behind `alert()` writes. | N (hardened from v1's SIMPLIFY) |

Net nav effect unchanged: **10 Intelligence nav slots → 5** (`volunteer-risk`,
`recruitment`, `retention`, `bus-factor`, `automations`). Five routes removed,
zero added. N1–N3 add **zero** nav slots.

---

## 3. Settling this round's disagreements

### 3.1 Youth: build the honest student-drift signal, or state the gap?

**Ruling: build it — but as a population toggle on the merged screen, not as a
screen. And state the small-group gap explicitly and permanently.**

The youth agent's minimum honest signal is *structurally the same computation
`missing.ts` already performs*: absolute-zero check-ins over a trailing window
(`missing.ts:76`, `stats.recentCount === 0`). The only difference is the
eligibility gate — `historyServingCount >= 2` (key volunteer) versus
`pcoGrade` in 6–12 (student). That is a predicate swap on a function that
already exists. It costs no nav slot, no new file, and no new fetch. Refusing to
ship it would be subtraction as an excuse rather than a principle.

**Rejected: rebuilding it as a screen.** A rebuilt Drift screen would re-earn a
nav slot for a signal that is one filter on a list I am already building.

**The gap, stated permanently:** small-group-specific drift ("quit small group,
still shows up Sunday") — the youth agent's highest-value case — is **not
honestly buildable in Locus today and this proposal does not attempt it.** The
only event taxonomy in the repo is `classifyEvent` (`burnout.ts:11-25`), which
§4.3 proves misfires on the most common real kids/student event name. PCO Groups
is out of scope by standing context. Building it on the keyword classifier would
manufacture exactly the confident-wrong-answer we cut twice this round. It
becomes buildable **only if** §4.3's config-driven event tagging ships *and* a
church tags its own small-group events — a distinct, larger piece of work. If
§4.3 never lands, CUT-without-replacement is correct permanently. Recorded.

### 3.2 Admin + children: the clearance gate fails open

**Ruling: both are right, v1 was wrong, and the fix is not a fourth UI state
bolted onto a fabricated field — it is a real field.**

The children's agent asks for a fourth state ("clearance data unavailable for
this org"). Adopted, but a fourth state over `backgroundCheckExpiresAt` is a
label on a field that is null for 100% of real records — an honest UI on top of
a dead pipe, which is the same failure one layer up. Since
`passed_background_check` is a real Person attribute that Locus simply never
fetches (§1.1), the correct move is to fetch it and derive the states from data
that exists. See **N2**. Three states come from the boolean, the fourth from its
absence:

| Data | UI state | Behaviour |
|---|---|---|
| `passed_background_check === true` | **Cleared** | Kids/Student roles offerable |
| `passed_background_check === false` | **Not cleared** | Roles suppressed; hard block |
| `passed_background_check == null` | **Unknown — verify manually** | Roles suppressed; fail closed |
| attribute absent from the whole response | **Clearance data unavailable for this org** | Roles suppressed org-wide + banner |

The fourth state must be distinguishable from the third at the screen level, not
just the row level — otherwise an org with the attribute disabled reads as "a lot
of unknowns" instead of "we cannot see clearance at all." That is the children's
agent's point and it survives the change of data source.

**Note what this deliberately cannot do:** no expiry. `passed_background_check`
is a boolean with no date on the Person resource, so "expiring in 30 days" is not
recoverable. The expiring-soon lane does not come back in any form. Locus can
answer "is this person cleared right now," not "when does it lapse."

### 3.3 Admin: #24 Retention is KEEP, not SIMPLIFY

**Conceded on substance, resolved as FIX.** Admin is right that folding the one
screen with zero live safety findings under the same verdict as #23 and #25
(both carrying live safety findings) destroys a distinction a church board would
use to decide what ships first. But KEEP implies no work, and there are two real
defects: `retention.ts:61-66` renders a Locus-invented 4-visit threshold with the
authority of a PCO status field labelled "Member," and no stage clicks through.
**FIX** is the honest verdict: right feature, two named defects, two named
repairs, ships first because nothing on it is dangerous.

### 3.4 UXR: is team-silo detection a real loss from cutting #26?

**Ruling: yes. v1's "nothing lost" framing was wrong for #26, and the fix is
cheap enough that stating the gap would be lazy.**

UXR is right that Bus Factor is per-`(person, event)` (`busFactor.ts:13-125`,
no cross-event join) and structurally cannot express "which teams never share a
volunteer." I verified the successor is nearly free: `volunteerWeb.ts:35-56`
already builds `shiftGroups: Map<"eventId:date", Set<personId>>` and
`eventNameMap: Map<eventId, teamName>`. Collapsing that to
`Map<teamName, Set<personId>>` and doing pairwise `Set` intersection is ~15 lines
with no physics, no SVG, no layout loop. Folded into #25 as a short list (N3).
The 251-line force-layout module still dies.

### 3.5 Children: group the merged screen by team

**Adopted.** "Jane: Overserving + Missing" is a person-level HR nudge; "the 9am
Pre-K room is short two" is an operations answer. `eventNameMap` is already built
in both `burnout.ts` and `missing.ts`. Ships as a grouping toggle
(By person / By team), defaulting to By team. Person-level rows remain reachable.

### 3.6 Admin: sequence the `isChild` gate as a prerequisite, not a line item

**Adopted, and it re-orders §4.** v1 listed "add the adult gate" as one of six
bullets inside a one-day merge. Admin is right that this is backwards: until
§4.3 lands *and* an explicit `!isChild` filter exists, the merged screen can
print a child's name next to "High Risk." §4.3 and the gate are now a hard
prerequisite; `volunteer-risk` does not enter the nav until both land.

---

## 4. The concrete work, ordered by value-per-effort

Deletions first — they are the highest-value, lowest-risk items and several are
safety vetoes. **§4.3 gates §4.6 and §4.7.**

### 4.1 Delete the Emergency Alerts send path (veto; ~30 min) — CONVERGED

- Delete `src/components/EmergencyAlerts.tsx`, `EmergencyAlerts.css`,
  `EmergencyAlerts.test.tsx`.
- Delete the `currentView === 'emergency'` block (`App.tsx:944-948`) and import.
- Delete the sidebar item (`SidebarIntelligence.tsx:222-226`).
- No stub with a `<textarea>`, a recipient count or a button. The recipient count
  is what makes the fake convincing.

### 4.2 Cut the three fabricated-field lanes and the two fake writes in #28 (~1 h)

In `src/components/AutomationsReport.tsx` (lane map verified by read):

- **Delete lane 1, "First Time Giver Alert"** (`:107-132`) — fabricated
  (`data.js:102-108`), no Giving API. Delete `getFirstTimeGivers`
  (`automations.ts:152-166`).
- **Delete lane 5, "Background Checks (Expiring Soon)"** (`:216-240`) and
  **lane 6, "Expired Background Checks (Safe Sanctuary)"** (`:243-267`) —
  fabricated per §1.1. Delete `getExpiringBackgroundChecks` and
  `getExpiredBackgroundChecks` (`automations.ts:122-151`).
- Delete `background_check_expires_at` from `PcoAttributes` (`pco.ts:17`), from
  the destructure (`pco.ts:231`), and `backgroundCheckExpiresAt` from `Student`
  (`pco.ts:86`) and its mapping (`pco.ts:275`). Update
  `automations.test.ts:171`, `AutomationsReport.test.tsx:9`, `pco.test.ts:64`,
  `copilot.test.ts:90` (the last dies with §4.4 anyway).
- **Delete the DoorDash action** from lane 2 and the **Uber action** from lane 3.
  Admin's third-party-egress argument is decisive: a member's home address
  leaving PCO for a gig platform on one click, no consent capture, no confirmation
  of payload. Keep both *detections*.
- **Delete the "Promote Grade" button** (lane 7) and any remaining action button
  asserting a PCO write. Remove those branches from `handleApprove`
  (`:84-94`); rename the survivor `handleDismiss` so no code path is named
  "approve" while only hiding a row. Replace every action with an out-link to
  the person's PCO record — the only honest action available, and read-only,
  which matters now that Sandbox Mode is known inert (§1.2).
- Fix `getNewBabies` (`automations.ts:168-170`) from `age === 0` to a
  born-in-last-N-days window, with household framing ("the Chen family") rather
  than listing the infant.
- Fix `getCollegeSendOffs` (`:102-117`) — `today.getMonth() !== 7` skips the
  entire cohort for the year if nobody opens the tab in August.
- Collapse the eight `useState<Set<string>>` dismissal hooks (`:31-38`) into one
  keyed map and persist it; dismissals currently vanish on refresh.

Result: eight lanes → five, all five backed by real PCO People fields
(birthdate, grade, graduation year, household).

### 4.3 Fix `classifyEvent` — **prerequisite** for §4.6 and §4.7 (~2 h)

`src/utils/burnout.ts:11-25`:

- Resolve the `'ministry'` precedence trap: check Worship keywords **before**
  Serving keywords, and treat `kind === 'Volunteer'` as the authoritative
  Serving signal (already overriding at `burnout.ts:58` and `missing.ts:55`).
- `busFactor.ts:30-33` and `volunteerWeb.ts:30-38` both admit *every* check-in on
  a name-matched Serving event. `busFactor.ts` must trust `kind === 'Volunteer'`
  the same way; without this, `teamSize === 1` (`busFactor.ts:120`) never fires
  and `soloCount` is permanently 0 for exactly the team the children's director
  cares about.
- Return an `'Unknown'` count so consumers surface "N of M events could not be
  classified" instead of `BurnoutReport.tsx:74-78`'s false "All Clear! 🎉".
- Move the keyword lists into `ConfigModal` so a church can name its own events.
  This is also the precondition for the small-group signal in §3.1.

### 4.4 Move the numeric thresholds into config (restored drop; ~2 h)

Raised by UXR in round 1, dropped by v1, restored by UXR and admin this round —
and more load-bearing now that they gate a *flag on a shared screen* rather than
a separate report's population:

- `burnout.ts:86-91` — `serving >= 6`, `worship === 0` (High), `worship <= 2`
  (Medium).
- `missing.ts:76` — `historyServingCount >= 2` ("key volunteer") and the 2-week
  absence / 6-week history split (`missing.ts:39-42`).
- `recruitment.ts:95` — `worship >= 4 && serving <= 1`.

Ship with today's values as defaults, in the same `ConfigModal` section as §4.3.
**UXR's open question stands and is not settled by making it configurable:** does
≥2-serves-in-6-weeks match how staff think about "key," or does it miss the
quarterly tech-booth volunteer who is critical and rare? Carried to §5.

### 4.5 Cut #19 and repoint the Intelligence landing view (~1 h) — CONVERGED

- Delete `src/components/CoPilot.tsx`, `CoPilot.css`, `CoPilot.test.tsx`,
  `src/utils/copilot.ts`, `src/utils/copilot.test.ts`.
- Delete `App.tsx:764-768` and the import; delete `SidebarIntelligence.tsx:21-25`.
- **Change `App.tsx:83`** — `setCurrentView(role === 'core' ? 'dashboard' :
  'copilot')`. Given §1.4 (staff-only, no leader role) and §4.3 gating
  `volunteer-risk`, point Intelligence at **`retention`** — it is the only Area C
  surface with zero live safety findings (§3.3) and it is the one that will be
  ready first. Repoint to `volunteer-risk` only after §4.3 and the `isChild`
  gate both land.
- `copilot.ts` is the only Area C consumer of `calculateSentimentPulse`; check
  `src/utils/sentiment.ts`'s Area D callers before assuming it can go too.

### 4.6 Cut #26 Volunteer Web, keeping the silo question (~1 h)

- Delete `src/components/VolunteerWeb.tsx`, `VolunteerWeb.css`, and the physics:
  `computeForceLayout` and the node/link layout half of
  `src/utils/volunteerWeb.ts` (300-iteration O(n²) loop).
- Delete `App.tsx:869-874` and `SidebarIntelligence.tsx:117-121`.
- **Keep and relocate ~40 lines**: the serving-check-in filter and `shiftGroups`
  builder (`volunteerWeb.ts:30-56`) move into `busFactor.ts` to feed N3. Nothing
  else imports `buildVolunteerGraph` — verified.

### 4.7 Cut #21 Drift; carry the student signal as a filter (~1 h)

- Delete `src/components/DriftReport.tsx`, `DriftReport.css`,
  `DriftReport.test.tsx`, `src/utils/drift.ts`, `src/utils/drift.test.ts`;
  delete `App.tsx:815-820` and `SidebarIntelligence.tsx:61-65`.
- `drift.ts` goes with the screen this time. v1 held it back for Area D; Q3 got
  no taker from any critic in either round, and the youth agent has now ruled the
  concept CUT-without-replacement permanently. Keeping a module with a known
  arithmetic defect and no owner is worse than deleting it — the fix is one line
  and reproducible from this document if Area D ever wants it
  (`subMonths(now, 1.5)` → `subWeeks(now, 6)`, `drift.ts:21`).
- **The honest student signal ships in §4.8**, not here.

### 4.8 Merge #22 into #20 → "Volunteer Attendance Risk" (~1.5 days; gated on §4.3)

- Host: `src/components/BurnoutReport.tsx`, renamed; route `burnout` →
  `volunteer-risk`. Delete `src/components/MissingVolunteersReport.tsx`, its
  route (`App.tsx:821-826`) and sidebar item (`SidebarIntelligence.tsx:69-73`).
- **Hard prerequisite (admin, §3.6):** §4.3 landed *and* an explicit
  `!student.isChild` filter on the population — `burnout.ts:79`'s comment ("let's
  just flag anyone matching the pattern") is the live defect. Do not re-enter the
  nav until both.
- One person list, one row per person, `flags: ('Overserving' | 'Missing')[]`
  replacing the `High/Medium/Low` vs raw-week-count vocabularies.
- **Restate the correlation story (UXR, §2.1).** v1 inherited UXR's round-1
  headline (Burnout × Drift = drifting while overserving) and silently swapped
  the second term. The actual surviving pairing is Burnout × Missing: served ≥6
  times in the first 6 of the last 8 weeks, then zero for the most recent 2 —
  **burned out and then quit, an ending rather than a trend.** Arguably sharper,
  definitely different. Whoever builds this must not describe it as a
  continuation of the original idea.
- **Group by team by default** (children, §3.5), person-level rows expandable.
  `eventNameMap` is already built in both utils.
- **Population toggle: Volunteers / Students (§3.1).** Second tab reuses
  `missing.ts`'s absolute-zero predicate with the eligibility gate swapped from
  `historyServingCount >= 2` to `pcoGrade` in 6–12; suppressed entirely
  June 1 – Aug 15 (reuse the date gate already in
  `automations.ts:67-96`); grade-12 dropped from the population each spring.
  Label it "no check-ins of any kind," never "drift" or "attrition."
- Drop the `Math.max(2, missingWeeks)` floor (`missing.ts:94`); sort by true
  weeks-missing descending.
- Unify fetch depth: `BurnoutReport.tsx:25` uses the 100-page default,
  `MissingVolunteersReport.tsx:25` passes `20`. Pick one; comment must match code.
- Remove the `ui-avatars.com` fallback (`BurnoutReport.tsx:84`,
  `MissingVolunteersReport.tsx:81`) — sends a named person, possibly a minor
  helper, to a third-party image host to draw a coloured circle.
- **CSV export (restored drop, admin).** `BurnoutReport.tsx:46-55` and
  `MissingVolunteersReport.tsx:43-51` both `downloadCSV` named individuals
  labelled with risk categories to an ungoverned file. The merge does not make
  this safe. Minimum: a confirm step naming what is in the file and who it
  identifies, a timestamped filename, and the risk label rendered as the
  underlying counts ("Serving 7 / Worship 0") rather than the word "High Risk"
  attached to a name in a file that will end up in a shared drive.

### 4.9 #25 Bus Factor — reframe, unblock, and absorb the silo list (~1.5 days)

- `busFactor.ts:95-125`: exclude `student.isChild` from cluster membership so a
  teen helper cannot mask a solo adult.
- `busFactor.ts:30-33`: per §4.3, stop admitting every check-in on a name-matched
  Serving event.
- Add `servesMinors: boolean` to `BusFactorCandidate` and a **"Solo with minors"**
  tier rendered above the chart as a list, not a bar. **Mandatory caveat in the
  UI:** this counts volunteers on a team, **not children present** — Locus cannot
  count children in the room, because children check into a *different* event
  (`mock-api/data.js:223` vs `:234`) and `calculateBusFactor` never joins two
  events by time window. Do not market this as ratio compliance.
- **Team-silo list (N3, §3.4)**: `Map<teamName, Set<personId>>` from the
  relocated `shiftGroups` (§4.6), pairwise `Set` intersection, render the empty
  intersections as a short list — "Kids Ministry and Production Team have never
  shared a volunteer." No graph, no physics, no SVG.
- **Clearance column from N2** — a "Not cleared" / "Unknown" badge on rows in the
  solo-with-minors tier, fail closed.
- Reframe the headline (`BusFactorGraph.tsx:69-72`, "single points of failure")
  to team-level language — "teams that need a second trained volunteer" — which
  fixes "named volunteer ranked as a liability" without losing the finding.
- Align cutoffs: chart `.slice(0, 5)` (`:60`) vs table `.slice(0, 10)` (`:115`).
- **Accessibility (restored drop, UXR round 1).** The custom tooltip is a raw
  `<div>`, mouse-only, no ARIA, no keyboard path. This is now the area's
  compliance surface; it is the wrong screen to leave keyboard-inaccessible.
  Tooltip content must also exist as table text, not only on hover.

### 4.10 #23 Recruitment — remove the score, add the fail-closed gate (~1 day)

- Delete `score` from `RecruitmentCandidate` (`recruitment.ts:120-123`) and the
  `Match Score: {n}` badge (`RecruitmentReport.tsx:93`). Replace with the two
  facts it is composed of — "Worship 6× / Serving 0×".
- **Fail-closed clearance gate (§3.2).** `recruitment.ts:112` pushes
  `'Kids Ministry'` purely on household child age while `generateAskScript`
  (`:141-176`) drafts a ready-to-send invitation. Suppress Kids/Student Ministry
  roles unless `passed_background_check === true` (N2). Default state for every
  candidate is **not cleared**. Render the fourth state ("clearance data
  unavailable for this org") as a screen-level banner, not a row badge.
- Label the Ask Script "draft — edit before sending" and stop auto-inserting
  children's first names (`:155-159`) into a generated outbound message.
- Soften the `worship >= 4` gate (`:95`) via §4.4's config so small or
  bi-weekly-cadence churches can produce candidates at all.

### 4.11 #24 Retention Funnel — FIX (~half day, ships first)

- Rename the "Member" step to "4+ Visits" (`retention.ts:61-66`) — a Locus
  threshold currently rendered with the authority of a PCO status field.
- Return person IDs per stage from `calculateNewcomerFunnel` (the
  `checkInsByPerson` map already holds and discards them); change
  `NewcomerFunnel`'s props from `{ auth }` to `{ auth, students }` so each stage
  clicks through.
- Document the counting caveat: a family's first Sunday counts as parent + each
  child, so the denominator is households × people.

---

## 5. Unresolved disagreement — questions round 3 must settle

**Q6 (sharpest). Does the "Solo with minors" tier survive its own standard?**
This is the strongest remaining item in the area and it now carries three
admissions: it cannot count children present (no event join — §4.9); its
clearance data is a boolean that is `null` for most real records (§3.2); and it
returns zero for the exact churches that need it until §4.3 lands. We cut #21,
#27 and three #28 lanes this round for the offence of presenting an unreliable
computation as a confident answer on a safety-adjacent surface. **Round 3 must
say whether "one adult alone on an event we classified as serving minors, whose
clearance we mostly cannot see" clears the bar we just set, or whether the
consistent verdict is to ship the solo-count as ops information with the
safeguarding framing removed entirely.** I lean ship-with-caveats; I am not
confident, and I would rather the loop break the tie than have me defend it.

**Q7. Weekly-cadence safeguarding: report or theatre?**
Carried unchanged from v1's Q2 — no critic engaged with it. If the join to count
children present is out of scope, is a Tuesday report on a Sunday two-adult-rule
breach the exact "tells you a fire already happened" failure the children's agent
rejected for #22? Or is a lagging compliance record still worth having as an
audit artifact, on different grounds than prevention? Answer this and Q6
resolves with it.

**Q8. What replaces Emergency Alerts on the roadmap?**
The children's agent's round-1 ask — check-in-scoped messaging ("text the parents
of children currently checked in to Room 204") — was carried by neither v1 nor
v2, and the agent correctly names that as a real building's emergency tool
leaving the roadmap, not just this version. This proposal will not build it:
it needs a real messaging backend, guardian routing, split-household handling, an
audit trail and a confirmation step, none of which exist. **Round 3 should say
whether that is a scoping decision this audit is entitled to make silently, or
whether "we deleted the fake one and built nothing" needs to be stated as an
explicit product gap with an owner.**

**Q9. Is ≥2 serves / 6 weeks the right definition of "key volunteer"?**
UXR's round-1 question, dropped by v1, restored here. §4.4 makes it
configurable, which is not the same as answering it — a default that
systematically misses the quarterly tech-booth volunteer is still wrong for
every church that never opens the config screen. Does the gate need a
*rarity-weighted* notion (serves seldom but is the only one who can) rather than
a frequency floor? That is the same question #25's solo-count answers from the
other direction, so the two may want to be one computation.

**Q10 (retired). Q1, Q3, Q4, Q5 are closed.** Q1 answered NO (§1.1). Q3 answered:
nobody wants `drift.ts`, it dies with the screen (§4.7). Q5 answered:
staff-only, value ranking downgraded (§1.4). **Q4 (does Burnout's
serving-vs-worship dichotomy survive a leader whose worship *is* Wednesday
night?) got no direct engagement from any critic this round** — I am closing it
by decision rather than consensus: §4.4 makes the thresholds configurable and
§4.3 makes the event classification church-defined, which is the only mechanism
available; a per-team "expected worship event" mapping is a config-shaped
problem, not a new model. If round 3 disagrees, reopen it against §4.4.

---

## 6. New ideas earned this round (3 max)

**N1 (revised). `Cmd+K` route jump — replaces #19 Pastoral Co-Pilot (§4.5).**
**Rescoped in response to the children's veto.** v1 specified a palette "fuzzy on
name over `students`, opened from anywhere in either layout" — which is the same
unguarded name→age/grade lookup I cut the Co-Pilot's `who is` intent for, wearing
a keyboard shortcut. Adopted without argument. **N1 v2 indexes routes only** —
the static list of report destinations, no person index, no roster search, no
child records. It answers the one job the router did adequately (get me to the
screen) and none of the jobs it did dangerously. Person search re-earns its
place behind a real permission model, which §1.4 establishes does not exist.
New file `src/components/CommandPalette.tsx`; deletes five files and a route.

**N2. Fetch `passed_background_check` — replaces the entire fabricated
`background_check_expires_at` read path (§4.2, §4.10, §4.9).**
Not an addition: a substitution that is net-negative in code. Delete the
fabricated field from `PcoAttributes` (`pco.ts:17`), `Student` (`pco.ts:86`) and
both mappings; add the one real boolean PCO actually exposes, which this codebase
has never fetched (zero grep matches). It powers the four-state fail-closed gate
in §3.2 and the clearance column in §4.9. It deliberately cannot do expiry —
that lives in PCO's separate Background Checks feature and is out of scope until
someone scopes that integration. **Earned by:** admin and children's both
demanded a fail-closed gate; neither had a data source to point it at.

**N3. Team-silo list inside #25 — replaces #26 Volunteer Web (§4.6, §4.9).**
Not a new screen; ~15 lines and a short list on an existing one. Earned by UXR's
finding that "which teams never share a volunteer" is a connectivity property no
successor screen in v1 could express, and that v1's "nothing lost" framing on
#26 was wrong. Pays for itself by deleting 251 lines of force-layout physics that
rendered the same data with no action attached.

**Retired: v1's N3 (pinned safeguarding block).** Killed by §1.1 — it was a
pinned UI element over a field that is never populated in production. Its honest
descendant is N2.
