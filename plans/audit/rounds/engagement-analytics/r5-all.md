# Area D — engagement-analytics — Round 5 (sign-off, all four personas)

Scope: final ruling on `proposal-v4.md`. The eight per-feature verdicts are
CONVERGED 4/4 and are not reopened by anyone below. This round exists to do one
thing v4 could not: **assign the three items that have sat unowned for three
rounds** — the `useCheckIns` shared hook, the N3 placeholder-birthdate detector,
and the Intelligence landing view. Each persona assigns an owner or says the item
should not be built. No fourth deferral.

**Tree state at time of review.** Commit `96daaa0`, plus a large set of *staged*
deletions from other areas executing in parallel: `RobertReport.{tsx,css,test.tsx}`,
`GenealogyGraph.*`, `VolunteerWeb.*`, `src/utils/volunteerWeb.ts`,
`src/utils/genealogy.ts`, `EmergencyAlerts.*`, with `App.tsx`,
`SidebarIntelligence.tsx` and two integration tests modified. Global Pulse, Giving
River and Giving Trends are **fully deleted and committed** (`63fe9f4`), suite
green. Every line number below was re-read against that tree today; where a line
has drifted again, trust the symbol.

---

## UXR

**Verdict on proposal-v4: SIGN OFF.** Eight per-feature verdicts, four rounds, no
movement. The document is buildable as written except for three stale facts and
one piece of wording that would mislead whoever executes it. All four are below.

### Corrections that must land before this document is executed

1. **D2 is finished — delete the item, don't "finish" it.** v4 §1.3a and §D2 say
   `SidebarIntelligence.test.tsx:39` asserts a Global Pulse button and is "red
   today". It is not. Line 39 now reads
   `expect(screen.getByRole('button', { name: /Sentiment Pulse/i }))`. The Global
   Pulse assertion is gone, the component, CSS, test, route and nav row are gone,
   the suite is green. Anyone following D2 as written will hunt for a failing test
   that does not exist. **D2 has no remaining work.**

2. **D13 is not Area D's item any more.** `RobertReport.{tsx,css,test.tsx}` are
   staged deletions in the working tree right now — Area E's W8
   (`content-giving-comms/proposal-v4.md` §3b item 8) covers the same files plus
   the two integration-test mocks. v4 found this independently and correctly, but
   duplicating it in Area D's manifest will produce a merge conflict, not a second
   deletion. **What survives from D13 is the sequencing constraint, and it is
   real:** `RobertReport.tsx:9,12,13` hold compile-time references to
   `AttendancePulse`, `CheckInVelocity` and `LifeEventsHeatmap`. If Area D's
   deletions land before Area E's W8, the typecheck breaks. Record it as a
   dependency, not as work.

3. **Line numbers have drifted again** (`VolunteerWeb`'s nav row and route are
   staged out from under this document). Current, verified today:
   - `src/App.tsx` routes: `attendance` **843-848**, `velocity` **850-855**,
     `heatmap` **857-861**, `solar-system` **863-868**, `demographics` **870-875**,
     `map-view` **877-881**, `sentiment-pulse` **893-897**.
   - `src/App.tsx` imports: **14, 16, 17, 18, 22, 23, 30**. The commented-out
     `RobertReport` import formerly at `:11` is **already gone**.
   - `src/components/SidebarIntelligence.tsx` nav blocks: `sentiment-pulse`
     **29-35**, `attendance` **85-91**, `velocity` **93-99**, `solar-system`
     **110-116**, `heatmap` **118-124**, `demographics` **126-132**, `map-view`
     **134-140**.
   - The landing line is **`App.tsx:77`**, not `:80`. `:80` is
     `useState('dashboard')`.
   - `SidebarIntelligence.test.tsx` assertions that die with Area D's rows:
     **39, 50, 51, 53, 54, 55, 56**. (`:52` Volunteer Web and `:62` Emergency
     Alerts are already stale from the in-flight work — not Area D's to fix.)

4. **"Zero nav rows / no route" is imprecise and will be executed wrong.** v4 §2
   says "8 analytics nav rows → 0" and D9 says "delete the nav row **and** the
   route", then says the page is "reached by an explicit link". Those cannot all
   be true: a link calls `onChangeView`, which needs a `currentView` branch.
   The accurate statement, and the one I sign off on:
   **eight nav rows → zero; eight routes → one.** The `map-view` route block is
   *rewritten* as `city-distribution`; what is deleted is its **nav row**, and the
   page's single entry point is one plain text link — not a `nav-item` with an
   icon — at the foot of the Intelligence sidebar. One entry point, de-emphasised,
   never in the scan path. That link is a change to `SidebarIntelligence.tsx`,
   which Area D already owns, so it does not wait on anyone.

### The three unowned items

**1. `useCheckIns` → Area C (pastoral-ops). Owner assigned; not Area D's.**
Re-counted the call sites against today's tree: **12 live**, not 13 —
`VolunteerWeb.tsx:43` is staged out. After Area D deletes `AttendancePulse.tsx:27`
and `CheckInVelocity.tsx:22`, and Area E's W5/W6 delete `SermonCorrelator.tsx:29`
and `SermonSentiment.tsx:29`, **eight callers remain**:
`BurnoutReport.tsx:26`, `CoPilot.tsx:43`, `NewcomerFunnel.tsx:18`,
`RecruitmentReport.tsx:27`, `MissingVolunteersReport.tsx:26`, `DriftReport.tsx:27`,
`BusFactorGraph.tsx:25` — **seven of them Area C screens** — plus
`Dashboard.tsx:33` (Area A). Area D contributes exactly one new consumer. An area
that owns 7 of 8 consumers owns the shared hook; nobody else has standing to
specify its refresh semantics. Assigned to Area C, file `src/hooks/useCheckIns.ts`.

The condition I care about is unchanged and blocking: **a cache with no visible
age is a worse defect than the one it fixes.** Emily opens Burnout at 10:40 on a
Sunday and sees numbers built at 09:05 with nothing on screen saying so. TTL ~5
min, an "as of HH:MM" line on every consuming surface, and a manual refresh
control. Those are UI requirements, which is why they cannot be waived by whoever
writes the hook.

**2. N3 placeholder-birthdate detector → Area A (core-hygiene), on Data Health.
Not a new screen.** Area A has already built the place this belongs: its
two-candidate repair card, which orders birthdate-correction first and names the
`1/1` placeholder as the common case in its own words
(`core-hygiene/proposal-v3.md:270`). N3 is a detection rule feeding an existing
card — logic in `src/utils/grader.ts`, surfaced on `GradeScatter.tsx`. It is a new
*flag*, not a new destination, and it earns no nav row. If Area A declines the
rule, then **it should not be built anywhere**: as a standalone screen it fails my
frequency test outright, and Area D has no surface left to host it.

**3. The Intelligence landing view → Area C. And Area D does not build
`IntelligenceHome.tsx`.** This is the one place I am changing v4's disposition
rather than confirming it. D10 proposes a home screen whose landing status depends
on `App.tsx:77`, a line Area D has correctly refused to touch for three rounds.
A "home" that is not the landing is not a home — it is a twenty-first nav row that
a pastor visits when they remember it exists, which is the exact failure I have
been cutting all area long. So:

- If Area C makes it the landing, **Area C owns the component** — its first card
  is Area C's needs-attention counts, and the landing line is Area C's call. Area
  D supplies two cards as content and zero nav rows.
- If Area C keeps `copilot` as the landing, **Intelligence Home is not built.**
  Co-Pilot is a chat transcript (`CoPilot.tsx:105-150`: header, message list,
  input) and standing cards do not belong inside a transcript.

**And the consequence must be stated, not hidden:** in the second branch Area D's
two demoted cards have no host, so the demographics card and the Weekly Check-ins
card are not built either, and Area D's net product change is eight deletions plus
one link-only report. That is an acceptable outcome. It is not a reason to build a
screen nobody lands on.

**Open question I would still put to a real user:** with the eight rows gone, does
a pastor go looking for a "how are we doing" number at all, or does he ask Co-Pilot?
If it is the latter, branch two is not a consolation prize — it is the right answer.

---

## Church-Admin

**Verdict on proposal-v4: SIGN OFF.** Nothing in here generates work for my office
that it does not pay for. Eight screens gone, one report that costs nothing to
keep, three real bugs fixed. I have one budget-side correction and three ownership
calls.

**Would we actually open this (what's left of it)?** The city report: once every
few years, by whoever is doing site work — priced that in r4 and it still clears,
because after D9 the standing cost is a text link and a util nobody maintains.
Everything else Area D leaves behind is a card on somebody else's screen, which is
the correct price for a number you glance at.

**PCO overlap:** unchanged from r4 — none for the household-deduplicated,
k-anonymised city rollup; total overlap for everything Area D is deleting.

**Governance / privacy:** D9's three fixes remain all-or-nothing. I re-read
`geospatial.ts` today: `:22` still increments **per person**, `:8-30` still has no
floor, `MapView.tsx:28` still slices top-20 off an unsuppressed list. None of the
three has been quietly done. If they ship partially, pull the export.

### Correction on the deletion budget

v4 counts `RobertReport` into Area D's manifest as "a free win". It is a real win
and it is **already being taken** — the files are staged deletions in the tree
under Area E's W8 as I write. Area D should not book the same three files twice;
Area E's audit already counted them (`content-giving-comms/proposal-v4.md` §2 #42a,
CONVERGED 4). What Area D keeps is the ordering constraint. That drops Area D's
file count from v4's 24 to **21**, and I would rather the number be right than
flattering.

### Q8 — I am closing it, it does not need a sixth round

v4 leaves `GENERATIONS` alive pending Area C's ruling on Sermon Correlator. Wrong
area, and the ruling already exists: **Sermon Correlator and Sermon Sentiment are
Area E (#38, #37) and both are CUT, CONVERGED 4 rounds**, with W5/W6 deleting
`src/utils/sermons.ts` in its entirety. `sermons.ts:3,54` is the only consumer of
`GENERATIONS` outside `demographics.ts` itself. Meanwhile D8 removes Area D's own
use — and note the import at `GenerationStack.tsx:4` is **already unused today**;
the component renders `calculateDemographics` output and never touches
`GENERATIONS`. So: keep the export while Area E's W6 is outstanding, then delete
it as the last step of D8, gated on `grep -rn GENERATIONS src/` returning only
`demographics.ts`. That is a two-minute check, not an open question.

### The three unowned items

**1. `useCheckIns` → Area C.** Seven of the eight surviving callers are Area C
reports. This is the item on the list with the sharpest operational consequence and
it has now gone three rounds with nobody's name on it, which is how a rate-limit
incident gets written into a post-mortem instead of a ticket. Concretely: twelve
components each pulling up to ~10,000 check-in records against a shared PCO API
ceiling. When that ceiling is hit on a Sunday morning it is not a slow dashboard —
it is the check-in stations degrading while 300 kids are being tagged. **Area C
builds `src/hooks/useCheckIns.ts`, with UXR's TTL + "as of HH:MM" + manual refresh
as non-negotiable.** Area D converts its one new card to it on day one.

**2. N3 → Area A, Data Health.** Agreed, and I will put it in my own terms: a
guessed `1/1` birthdate is not a data-quality curiosity, it is the input to a grade
calculation that a volunteer will then trust. Area A already fixes birthdates on
that screen; this is one more reason a row appears there. **No new screen, no nav
slot, no licence-fee argument required.** If Area A won't take it, it does not get
built — I will not pay for a screen that lists suspicious dates and does not fix
them.

**3. Intelligence landing → Area C, and I would rather have nothing than a
non-landing home.** Robert opens the intelligence surface maybe weekly. If the
first thing he sees is Co-Pilot, then Co-Pilot is the home, and building a second
home he has to navigate to is exactly the "generates work instead of removing it"
pattern I reject. Area C owns `App.tsx:77` and therefore owns this. I sign off on
UXR's two branches including the honest second one: **no landing change → no
Intelligence Home → Area D's two cards are not built, and `attendance.ts` and
`demographics.ts` lose their last consumers and go with them.** Say that out loud
in the report so nobody discovers it during execution.

**What would make it worth the licence fee:** the three fixes in §D12/D9, not the
screens. The `Guest` predicate alone changes a number I put in front of a board.

---

## Youth Ministry

**Verdict on proposal-v4: SIGN OFF.** Two of the three assignments are NOT MY LANE
and I say so rather than inventing relevance. The one that is my lane is the one
that has been unowned longest and matters most to me.

**Does it survive the school year?** The surviving Area D output is a weekly
check-in count and a ministry-band demographic card. Ministry bands (nursery,
preschool, elementary, middle, high) are the right axis — they move on Promotion
Sunday with the students, unlike birth-year generations, which put a 6th grader and
a 12th grader in the same bucket and were useless to me. That fix stands.

**False positive / false negative cost:** unchanged from r4 and now routed —
`drift.ts:31` filters `kind === 'Regular'`, dropping guest check-ins from both the
baseline and the recent window, which can only bias `dropPercentage` upward. That
manufactures false positives, i.e. a leader calls a student who is fine. Confirmed
still present in today's tree. Area C's fix, correctly assigned in D12, and I want
`pco.ts` `kind` tightened to the union **first** so this cannot recur a fourth time.

**Minor-safety flag:** none outstanding in Area D. Solar System (named minors in a
decorative family graph) and Sentiment Pulse (inferred emotional state from a
prayer field) are both CUT, four rounds, and my `isChild`-as-a-minor-predicate
rejection stands unreopened.

### The three unowned items

**1. `useCheckIns` → Area C. Agreed, and my hand-off rides on it.** Every screen I
would ever hand a volunteer leader — drift, missing volunteers — is on the Area C
side of that list. If the hook lands there it lands under the people who understand
what the data is for. NOT MY LANE to specify the caching; my only requirement is
that a leader looking at a drift list on a Wednesday night can tell whether it was
computed tonight or Sunday, which is UXR's "as of HH:MM" line. A stale drift list
is worse than no drift list: it names a student who came back on Sunday.

**2. N3 → Area A, Data Health. This is the one I care about and it must not go
unowned again.** `transformPerson` (`pco.ts:257-265`) rejects a *missing* or
*unparseable* birthdate — and accepts, silently and completely, a placeholder that
parses. `1/1/2012` is a perfectly valid date. It flows straight into
`calculateExpectedGrade`, which produces a confident grade for a student whose
birthdate somebody guessed at a check-in desk. That grade then drives the
ministry-band card (D8), any cliff-cohort work built on `calculatedGrade`, and the
Data Health scatter's whole notion of "expected". **A confidently wrong grade is
strictly worse than a missing one** — a missing grade gets fixed, a wrong one gets
trusted. This is the single most volatile field in the database and the detector is
one predicate. Area A, in `grader.ts`, surfaced through the repair card that
already exists on Data Health. If Area A declines it, say plainly in the report
that the ministry-band card ships on an axis nobody is validating — I would rather
that be written down than discovered.

**3. Intelligence landing → NOT MY LANE.** Nothing about which screen a pastor
lands on touches grade, drift, cliffs or minor safety. Area C owns the line; I
defer to UXR and admin, and I have no objection to the branch where it isn't built.
One condition if it *is* built: the demographics card is a count per band and
nothing else. **No drill-through to a student list from a landing screen**, and no
per-student anything on a page that is open on a laptop in a coffee shop.

---

## Children's Ministry

**Verdict on proposal-v4: SIGN OFF**, with my r3/r4 condition on D9 carried
forward one last time, unchanged.

**Safety impact:** none from anything Area D ships or deletes. Nothing here reads
or writes at the check-in desk. **Sunday-morning cost: zero seconds**, both
directions — the `attendance.ts` and `retention.ts` predicate fixes are downstream
aggregation changes that no volunteer ever sees.

**Minor-data flag — D9, restated and still binding.** k-anonymity floor computed
inside `calculateCityClusters` and never rendered as a number; household dedupe on
`Student.householdId` before tallying (`geospatial.ts:22` still counts per person —
a family of five still inflates its city fivefold in today's tree); null-household
records excluded with the excluded count displayed. **All three or none.** If one
slips, the page and the CSV both come out — an artifact that looks anonymised
without being anonymised is worse than no artifact, because staff will share it.

**Household / guardian correctness:** the null-`householdId` population that D9
excludes is the same population `SolarSystem.tsx:44-46` silently dropped — foster
placements, grandparent caregivers, kids whose record was never linked. D4 hands
them to Area A's Family Audit. That hand-off is the only reason I am comfortable
excluding them from D9 rather than guessing at them.

### The three unowned items

**1. `useCheckIns` → Area C**, and the reason I hold an opinion at all on a caching
hook is the failure mode. Twelve components hammering the check-ins endpoint, and
the ceiling that gets hit is shared with the iPads at my folding table between 9:22
and 9:30. My floor: **this gets an owner today, and if Area C will not take it, it
goes to whoever owns `src/utils/pco.ts` (Area A) rather than sitting unowned a
fourth round.** Area C is the right owner on the merits — seven of eight callers.
The stale-data condition is not optional for the same reason it is not optional at
my desk: a number with no timestamp gets treated as current.

**2. N3 → Area A, on Data Health, and I will name the mechanism.** A guessed or
`1/1` birthdate does not come from carelessness — it comes from a grandparent
filling in a form on a phone at the door while a toddler pulls at her sleeve,
because the system will not let her finish without a date. That is the true source
of the defect and it is Area A's whole subject. Nursery rooms are banded in
*months*; a placeholder birthdate puts a child in the wrong room on the wrong
roster, and that is a ratio question before it is an analytics question. Detection
rule in `grader.ts`, row on Data Health, into the repair card that already exists.
**No new screen** — a screen that lists suspicious dates without a one-click fix is
a to-do list I will not staff.

**3. Intelligence landing → Area C, and I am content with the branch where it is
not built.** Not my surface; a pastor's dashboard changes nothing at the desk.
One condition if it ships, unchanged from my standing position: the Weekly
Check-ins card must say on its face that it folds children's check-ins into a
congregation-wide number. v4's caption ("Regular and guest check-ins only —
volunteer team check-ins and small groups excluded") is close but does not say the
number includes kids. A pastor who reads "attendance" as adults and then makes a
room-planning decision on it will be wrong by roughly a third. Add "includes
children's check-ins" to the caption, or the card does not ship.

---

## Round 5 outcome

**Sign-off: 4/4.** No persona holds a residual objection to any of the eight
verdicts, and none has moved in three rounds.

**Ownership, assigned 4/4 — no further deferral:**

| Item | Owner | Screen / file | If the owner declines |
|---|---|---|---|
| `useCheckIns` shared cache | **Area C — pastoral-ops** | new `src/hooks/useCheckIns.ts`; 7 of 8 surviving callers are Area C reports | Falls to Area A as owner of `src/utils/pco.ts`. It does not go unowned. |
| N3 placeholder-birthdate detector | **Area A — core-hygiene** | rule in `src/utils/grader.ts`, surfaced on Data Health (`GradeScatter.tsx`) via the existing repair card | **Do not build it.** No standalone screen. |
| Intelligence landing view | **Area C — pastoral-ops** | `App.tsx:77` + `IntelligenceHome.tsx` if built | **Do not build it**, and Area D's two demoted cards are not built either. |

**Also closed this round, from evidence rather than argument:**
- **Q8 (`GENERATIONS`)** — resolved. Area E cuts both sermon screens (CONVERGED 4)
  and deletes `sermons.ts`; delete the `GENERATIONS` export as the final step of
  D8, gated on a grep.
- **D2** — complete. No remaining work; v4's "red test at `:39`" is stale.
- **D13** — reassigned to Area E's W8 (already staged). Area D keeps only the
  sequencing constraint.
- **"Zero routes"** — corrected to eight nav rows → zero, eight routes → one.
