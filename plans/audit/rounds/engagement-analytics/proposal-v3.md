# Area D — engagement-analytics — Proposal v3 (Round 3 synthesis)

Synthesised from `r3-uxr.md`, `r3-church-admin.md`, `r3-youth.md`, `r3-children.md`,
attacking `proposal-v2.md`.

**Headline: this area is settled.** Every verdict in §2 is CONVERGED. All four
critics converged on the same eight rulings, the two ministry critics conceded
their standing objection, and the one question v2 flagged as most wanting attack
(does `city-distribution` survive?) came back 2/4 explicit and 0/4 opposed. What
remains for rounds 4–5 is **one new defect found during verification** (§1.3) and
**five cross-area ownership assignments** (§5) — none of which Area D can settle
by arguing with itself again.

---

## 1. Changes since last round

### 1.1 Area D goes to zero analytics nav slots. My v2 kept one; that was wrong.

v2 §5.1 invited round 3 to apply UXR's own nav-slot test to the one screen UXR
left standing. It did, and the screen failed.

- **UXR** (r3 §1): a nav slot is earned by "distinct, repeated, time-pressured
  task completion." Campus siting is a multi-year board decision — rarer than the
  "once or twice a year" cadence that justified demoting Demographics. Correctness
  earns the right to exist; frequency earns the right to a standing sidebar row.
  `city-distribution` clears the first gate only.
- **Church-admin** (r3 §3), independently: same frequency test, plus a governance
  point — a per-family location roster including minors' addresses, permanently
  visible to anyone with Intelligence access, for a decision made once every five
  years, does not buy proportionate exposure. Ships as an export/table.
- **Children's** (r3 §3): explicitly declines to join on safety grounds and hands
  the frequency question to UXR/admin. **Youth**: silent.

2/4 explicit, 2/4 unopposed. **Adopted.** The eight Area D analytics rows go to
**zero**. See §1.2 for the one row that is honestly still there.

**Where I go further than either critic, and why.** UXR wants the page kept and
reached by link; admin wants a static table and an export. These are compatible,
and taking admin's half kills a blocking item outright: once you accept that the
value is not in ongoing interactive tuning, **the threshold slider goes**
(`MapView.tsx:21,52-61`). With no user-facing threshold number, v2's D9 sub-item
"clamp the slider so it can never display below the k-floor" has nothing left to
clamp and is deleted from the work list.

And with the slider gone, `suggestCampusLocations` (`geospatial.ts:32-41`) is
dead too. It is a `count >= threshold` filter over an already-sorted descending
table that additionally drops `clusters[0]` by construction (`:36,39`) — it
renders a second copy of rows the table above it already shows, minus the biggest
one. **Cut the function, cut the "Predictive Planting Suggestions" panel
(`MapView.tsx:104-113`).** Three deletions where v2 had a rename and a clamp.

### 1.2 The nav arithmetic, stated honestly so round 4 doesn't have to catch it

"8 → 0" is true of the analytics destinations and false of the total row count.
Precisely:

| | v2 claim | v3 |
|---|---|---|
| Original Area D analytics rows | 8 | 8 |
| Surviving analytics rows | 1 (`map-view`) | **0** |
| New rows added by Area D | 1 (`intel-home`) | 1 (`intel-home`) |
| Pages with no row | 0 | 1 (`city-distribution`, link-only) |

So Area D contributes **one** sidebar row where it contributed eight, and that
row is a home, not a chart. `intel-home` needs *some* affordance because
`App.tsx:83` still lands the intelligence role on `copilot` and Area D is not
changing that (Q3). If Area C rules that `intel-home` becomes the landing view,
the row can go and Area D contributes zero. Flagged as the residual, not hidden.

### 1.3 New defect, found verifying N2: `calculateNewcomerFunnel` drops guests

Admin certified N2 clean (r3 §1) and the certification holds — `created_at` and
the person relationship are core documented Check-Ins v2 fields, structurally
unlike the fabricated `attributes` reads. But verifying the reducer N2 reuses
surfaced a live undercount that no critic and no prior proposal caught:

`calculateNewcomerFunnel` (`retention.ts:23-24`) opens with
`if (checkIn.attributes.kind !== 'Regular') return;`. `kind` is typed
`kind: string` (`pco.ts:115`) — unconstrained. PCO Check-Ins v2 documents
**`Guest`** as a `kind` value alongside `Regular` and `Volunteer`. The fixture
contains only `Regular` and `Volunteer` (grepped `mock-api/data.js`: 6 and 3
literals, zero `Guest`), so against dev data the filter is a no-op.

Against real PCO data, **the newcomer funnel silently excludes every check-in
recorded as a guest — the exact population it exists to count.** A first-time
visitor checked in at the welcome desk is the canonical `Guest` row.

This does not reverse admin's ruling; N2 is still buildable and still real. It
changes the predicate: **`kind !== 'Volunteer'`, not `kind === 'Regular'`**,
everywhere newcomer or attendance volume is computed.

**Second-order consequence for the card.** `aggregateCheckInsByWeek`
(`attendance.ts:10-33`) filters on `kind` **not at all** — it counts every row.
So v2's D7 card would have plotted two lines with different denominators: a total
that includes volunteer-team check-ins against a first-time series that excludes
them. Both series must share the `kind !== 'Volunteer'` predicate.

**Note on consistency, pre-empting the obvious round-4 attack:** v2 cut the
`kind` *control* because `kind` is collinear with `event.data.id` in the fixture.
That is a fixture property, not a schema property. `kind` remains a real,
documented, semantically meaningful field; a fixed `!== 'Volunteer'` predicate is
legitimate and is what `retention.ts` already (imperfectly) does. A user-facing
*filter* over it is degenerate against this data. Both statements are true.

### 1.4 The `isChild` rejection is converged by concession from both objectors

Children's (r3 §1): "Both of my grounds fail under scrutiny. Conceded,
unqualified." Youth (r3 §3): re-derived independently and reached the same place,
adding the k-math — the floor is computed against `totalHouseholds`, so a fixed
floor covers a much larger share of "households with kids in city X" than of
"households in city X," making the minors-only cut *more* identifying, not less.

The distinction that settled it, in children's own framing: household dedupe is a
**structural** removal of the child as a countable unit; an `isChild` filter is a
**policy label** that narrows the artifact's subject to "where our minors live."
**CONVERGED 4/4.** Closed; not to be reopened.

### 1.5 Children's third blocking requirement — adopted, and it is buildable on real data

Children's (r3 §2) found the gap in v2's dedupe bullet: `householdId` is
`string | null` (`pco.ts:85`), set to `null` by `transformPerson` (`pco.ts:274`)
whenever a person has no household relationship, and D9 never said which way
`null` falls. Both branches are live safety failures — collapse them all into one
bucket and you permanently suppress a city; treat `null` as "no key, don't
collapse" and every unlinked child is re-plotted as an individual, through the one
population that has no adult to hide behind. This is the same population D4 handed
to Area A's Family Audit (`SolarSystem.tsx:44-46`).

**Adopted as the third blocking item.** Verification adds one fact in its favour:
`householdId` is **not** the fabricated-attributes pattern. `PEOPLE_INCLUDES`
(`pco.ts:444`) requests `households`, and `pco.ts:193,219-222` hydrates
`attributes.household_id` from the included resource when the raw attribute is
absent. So the dedupe key is real PCO data, and `null` genuinely means "no
household relationship," not "field we invented." The exclusion is honest and the
count of excluded records must be displayed.

Children's ACCEPT is conditional: **floor + household dedupe + null exclusion ship
together or the verdict reverses to zero.** With the route already gone this is
now a condition on whether the export ships at all. Honored as stated.

### 1.6 Corrections accepted without argument

- **UXR on the consumer split.** `BurnoutReport.tsx:25` calls
  `fetchRecentCheckIns(auth)` with no page argument, taking the `maxPages = 100`
  default (`pco.ts:507`). Verified by grep across all 13 non-test call sites. The
  real split is **7 at ~10k records** (`AttendancePulse:27`, `BurnoutReport:25`,
  `CheckInVelocity:22`, `CoPilot:43`, `Dashboard:33`, `NewcomerFunnel:18`,
  `RecruitmentReport:26`) and **6 at ~2k** (`BusFactorGraph:25`, `DriftReport:26`,
  `MissingVolunteersReport:25`, `SermonCorrelator:29`, `SermonSentiment:29`,
  `VolunteerWeb:43`). My v2 finding was understated.
- **UXR on Area D's own consumer count.** Deleting `AttendancePulse.tsx` relocates
  a consumer rather than removing one — the Weekly Check-ins card needs the same
  data. Area D goes 2 → 1, not 2 → 0, and the card must be built against
  `useCheckIns` from day one.
- **Admin on the cache shape.** A session-lifetime cache trades rate-limiting for
  silent staleness on exactly the screens opened *during* live Sunday check-in.
  **~5 minute TTL plus a visible "as of HH:MM" marker and a manual refresh, as a
  blocking condition on D1, not a nice-to-have.**
- **UXR on demographics-mini.** Correctly diagnosed as filler surviving on the
  same low-frequency logic that just zeroed city-distribution's slot. My response
  is in §3.6 — I keep the card and delete its control.

---

## 2. Per-feature decisions

| # | Feature | Verdict | Rationale | Converged? |
|---|---------|---------|-----------|---|
| 29 | Attendance Pulse | **DEMOTE** to one card on Intelligence Home; delete route | `kind` split is collinear with the event filter beside it; ceiling is a glanceable weekly number. | **Y (4/4, 2 rounds)** |
| 30 | Check-in Velocity | **CUT** | Sunday-only by construction (`velocity.ts:12-16`), 7am–1pm hardcoded, no station dimension reachable. Children's r3 §4 re-accepts with no replacement. | **Y (4/4, 2 rounds)** |
| 31 | Solar System | **CUT** | Decorative family-tree over named minors; drops single-parent households. | **Y (4/4, 3 rounds)** |
| 32 | Heatmap of Life | **CUT** | Deaths + anniversaries read fabricated fields; birthdays are a worse copy of PCO Lists, which filters *and* messages. Youth conceded r3 §2, conditional on N3. | **Y (4/4, 2 rounds)** |
| 33 | Demographics / Generation Stack | **FIX** (`calculatedGrade` banding) + **SIMPLIFY** (drop generations mode) + **DEMOTE** to card | The only honest chart in the area, but UXR is right it is filler in a fixed 3-slot layout. Kept at zero controls, marked first-out. | **Y (verdict); N (the toggle cut is new)** |
| 34 | Map View | **CUT the route** → link-only page + CSV export, with 3 blocking fixes | Fails the frequency test harder than Demographics did. UXR + admin explicit, children's declines to oppose, youth silent. | **Y (4/4 on the nav slot)** |
| 35 | Global Pulse | **CUT** | Fabricated benchmark in front of the budget-signer. | **Y (4/4, 3 rounds)** |
| 36 | Sentiment Pulse | **CUT** | Safeguarding veto + `prayer_topic` never populated. | **Y (4/4, 3 rounds)** |

**Net: 8 analytics nav rows → 0.** One new row (`intel-home`), one link-only page
(`city-distribution`). Seven components, seven CSS files and four utils deleted.

---

## 3. Rulings on the items sent to this round

### 3.1 `city-distribution` — CUT the route, ship the page + export. CONVERGED.
Adopted per §1.1. Concretely, versus v2's D9: **no slider, no suggestions panel,
no `suggestCampusLocations`, no clamp sub-item.** What ships is a top-N table of
household counts by city, a stated suppressed-city count, a stated
excluded-null-household count, and a CSV export, on a page reached by an explicit
link — never a sidebar row.

### 3.2 The three blocking fixes — all mandatory, all-or-nothing. CONVERGED.
1. `minClusterSize = max(10, ceil(0.05 * totalHouseholds))`, computed internally,
   never a prop, never exposed.
2. Dedupe on `householdId` before tallying (`geospatial.ts:11` counts people).
3. Exclude `householdId === null` records entirely, and display the count.

Children's condition stands: any partial ship "looks anonymized without being
anonymized" and is worse than the status quo. If only two of three land, **do not
ship the export at all** — the computation is deleted with the route.

### 3.3 `isChild` — REJECTED, converged by concession. CONVERGED 4/4.
Per §1.4. Closed.

### 3.4 N2 first-time-guest — REAL, with a corrected predicate.
Admin's certification (r3 §1) is accepted in full. The `Guest` defect (§1.3)
changes the predicate to `kind !== 'Volunteer'` on both series and additionally
fixes a live undercount in the existing `NewcomerFunnel` screen, which is Area C's
surface, not Area D's. **Cross-area hand-off, new: Area C owns
`retention.ts:23-24`.**

### 3.5 `useCheckIns` — direction accepted, TTL is blocking.
Per §1.6. Admin holds the token and is unambiguous about the failure mode: a 429
against a shared PCO rate ceiling does not degrade Locus, it degrades the check-in
station iPads on Sunday morning. That is a pastoral-risk-grade outage caused by an
analytics app. This remains the highest value-per-effort item in the document and
Area D cannot own it (Q4).

### 3.6 Demographics-mini — UXR's filler diagnosis sustained; the card survives, the control does not.
UXR is right that "the proposal needed a second card once #32 was cut" is filler
logic, and right that a card is a lower bar than a route so a lower standard is
defensible. Both being true, the consistent move is to make the card as cheap as
the job justifies: **drop the `mode` toggle entirely and ship ministry bands
only.** Generations (Boomer/GenX/…) is a vanity framing with no ministry action
attached; ministry bands map to rooms and leaders. This is *less* work than v2
specified — a replacement, not a new mode prop — and it takes the whole card set
to **zero controls**, tighter than UXR's own toggle-only budget.

Card order accepted as UXR ordered it: **1. Needs-attention, 2. Weekly Check-ins,
3. Demographics-mini (first-out under the one-in-one-out rule).**

### 3.7 Youth's Area C hand-off — confirmed zero-cost, two dependencies attached.
Youth verified `DriftCandidate.person` is a full `Student` (`drift.ts:5,85`)
already carrying `calculatedGrade` (`pco.ts:79`), so grade banding on Predictive
Attrition (#21) and Missing Volunteers (#22) is a filter chip with no new fetch,
join or computation. Free safety bonus: `calculateExpectedGrade` (`grader.ts:29-32`)
returns 13+ for graduated seniors, so a "middle/high" band excludes them by
construction — a senior leaving for college can never false-positive as attrition.

Two dependencies that must travel with the hand-off:
- **Area C:** `drift.ts:21-24` uses a 7-month rolling baseline vs a 6-week recent
  window, calendar-blind and not school-year-aware. A grade filter over a
  summer-blind engine false-positives every August. The filter makes the
  *population* right; it does not fix the *window*.
- **Area A:** the filter bands on `calculatedGrade`, which is derived from a
  birthdate that `transformPerson` (`pco.ts:233-241`) accepts as long as it
  parses. A Jan-1 placeholder bands a student into the wrong cohort silently. N3
  is a dependency of the one youth signal left standing, not optional cleanup.

---

## 4. The concrete work, ordered by value-per-effort

### D1. `useCheckIns` shared cache with TTL — app-wide, top item (owner: TBD, Q4)
- New `src/hooks/useCheckIns.ts`: module-level promise cache keyed on
  `auth` + `maxPages`; a cached deeper result satisfies a shallower request.
- **Blocking: ~5 minute TTL**, plus an "as of HH:MM" line and a manual refresh on
  every consuming surface. A cache with no expiry trades a rate-limit bug for a
  silent-staleness bug on the Sunday-morning screens that most need to be current.
- Migrate all 13 call sites (§1.6). Build the Weekly Check-ins card against the
  hook from day one — Area D's consumer count is 2 → 1, not 2 → 0.
- Do not add `kind`/event params to the fetch: nothing is left to push server-side.

### D2. Delete Global Pulse — CONVERGED, unchanged
- Delete `GlobalPulse.tsx`, `.css`, `.test.tsx`; nav `SidebarIntelligence.tsx:28-34`; route `App.tsx:986-990`; update `IntelligenceLayout.test.tsx:29`.
- Do not port the `accuracy - 10` Health Score (`GlobalPulse.tsx:17`); it disagrees with `Dashboard.tsx:79`.

### D3. Delete Sentiment Pulse — safeguarding veto, CONVERGED, unchanged
- Delete `SentimentPulse.tsx`, `.css`, `.test.tsx`, `src/utils/sentiment.ts`, `sentiment.test.ts`; nav `:36-42`; route `App.tsx:906-910`.
- **Cross-area:** delete `copilot.ts:304-328`, the import at `:10`, and "Spiritual Climate" from the fallback at `:334`, or Co-Pilot deep-links to a dead route.

### D4. Delete Solar System — CONVERGED, unchanged
- Delete `SolarSystem.tsx`, `.css`, `.test.tsx`; nav `:124-130`; route `App.tsx:876-881`.
- Hand "children with no linked adult" (`SolarSystem.tsx:44-46`) to Area A's Family Audit. Note this is the same population D9 must exclude for null `householdId`.

### D5. Delete Check-in Velocity — CONVERGED
- Delete `CheckInVelocity.tsx`, `.css`, test, `src/utils/velocity.ts`, `velocity.test.ts`; nav `:100-106`; route `App.tsx:856-861`.
- Record the revisit condition children's named: `include=locations` on
  `fetchRecentCheckIns` (`pco.ts:508`) giving `PcoCheckIn` a station relationship.
  Until that field is on the wire, no chart design makes this actionable.

### D6. Delete Heatmap of Life — CONVERGED
- Delete `LifeEventsHeatmap.tsx`, `.css`, `.test.tsx`, `src/utils/heatmap.ts`, `heatmap.test.ts`; nav `:132-138`; route `App.tsx:863-867`.
- Drop `deathDate`/`anniversary` from `Student` (`pco.ts:97-98`) and from `transformPerson` (`:231, 286-287`) — fabricated, no PCO People source.
- Surviving value moves to Area A as N3.

### D7. Demote Attendance Pulse to one card, with the corrected predicate
- Delete route `App.tsx:849-854`, nav `:92-98`, and `AttendancePulse.tsx`.
- **Keep `src/utils/attendance.ts`**, and add `kind !== 'Volunteer'` to
  `aggregateCheckInsByWeek` (`attendance.ts:13`) so both card series share a
  denominator (§1.3).
- Card: weekly total + first-time series (N2), titled **"Weekly Check-ins,"**
  captioned "Regular and guest check-ins only — volunteer team check-ins and small
  groups excluded," with an "open in PCO Check-Ins" link. Drop the `♥` glyph
  (`AttendancePulse.tsx:70`) and the word "Pulse."

### D8. Demographics — fix the axis, delete the toggle, demote
- `src/utils/demographics.ts`: **replace** generation banding with exported
  `MINISTRY_BANDS` (nursery 0-2, preschool 3-4, elementary K-5, middle 6-8,
  high 9-12, adults 19+). Band on `calculatedGrade` only, `age` for pre-K.
- `GenerationStack.tsx`: **no `mode` prop, no toggle** (§3.6). Delete the
  generations code path rather than keeping it behind a control.
- Keep the disagreement caption: `students.filter(s => s.pcoGrade !== null && s.delta !== 0).length` → "N students' recorded grade disagrees with expected grade → fix in Data Health." `delta` is already on the record (`pco.ts:249`).
- Delete route `App.tsx:883-888`, nav `:140-146`; render as home card 3.

### D9. City distribution — three blocking fixes, then export, no route
- **Blocking 1 (k-anonymity):** in `calculateCityClusters` (`geospatial.ts:8-30`)
  apply an internal floor `max(10, ceil(0.05 * totalHouseholds))`; return a
  `suppressed` count. Remove `clusters.slice(0, 20)` (`MapView.tsx:28`).
- **Blocking 2 (denominator):** dedupe on `householdId` before tallying —
  `geospatial.ts:11` increments once per person, so a family of five inflates its
  city 5×.
- **Blocking 3 (null households, new):** exclude `householdId === null` records
  entirely and surface the excluded count. They cannot be safely represented at
  household level and they are D4's unlinked-child population.
- Normalise addresses before grouping (`geospatial.ts:13-19` only title-cases):
  collapse `St./Saint`, `Ft./Fort`, `Mt./Mount`.
- **Delete:** `suggestCampusLocations` (`geospatial.ts:32-41`), the threshold state
  and slider (`MapView.tsx:21,52-61`), the "Predictive Planting Suggestions" panel
  (`:104-113`), the 🗺️ icon (`MapView.tsx:36`).
- **Delete the nav row** `SidebarIntelligence.tsx:148-154` and the route block
  `App.tsx:890-895`. Rename `MapView.tsx` → `CityDistribution.tsx`,
  `geospatial.ts` → `cityClusters.ts`.
- Ships as a table + CSV export reached by an explicit link, not a sidebar row.
- **All-or-nothing:** if any of the three blocking fixes does not land, delete the
  computation with the route (§3.2).

### D10. Build Intelligence Home — 3 cards, zero controls, non-default
- `src/components/IntelligenceHome.tsx`, route `intel-home`. **Do not change `App.tsx:83`.**
- Cards, in order: (1) needs-attention counts linking to Area C burnout/attrition/missing, (2) Weekly Check-ins (D7/N2), (3) ministry-band demographics (D8, first-out).
- Fixed height, no internal scroll, **no controls at all**, no aggregate health score, no "Reports" overflow page.
- Plus the plain-text coverage line (D11) and the "as of HH:MM" marker (D1).
- Section `SidebarIntelligence.tsx:18` into *Needs attention* / *Reports*, with the `city-distribution` link living under *Reports*.

### D11. Honest-denominator fix (hand to Area A)
`transformPerson` (`pco.ts:233-241`) discards every person lacking a parseable
birthdate before `App.tsx:236-237,397` builds `students`. Every count in Areas C,
D and F is over an unstated subset. Expose the discard count, or carry
`birthdate: null` through with per-chart exclusion.

### D12. `Guest` kind predicate (hand to Area C) — new
`retention.ts:23-24` filters `kind !== 'Regular'`, silently dropping `Guest`
check-ins from the newcomer funnel — the population the funnel exists to measure.
Change to `kind !== 'Volunteer'`. Also tighten `kind: string` (`pco.ts:115`) to
`'Regular' | 'Guest' | 'Volunteer'` so the next such filter fails at compile time.

---

## 5. Unresolved — and none of it is Area D arguing with itself

No critic disagreement remains open in this area. Every item below is an
**ownership assignment**: work Area D found, verified and specified, that Area D
cannot execute because it lives in someone else's files. Rounds 4–5 should confirm
owners, not re-litigate verdicts.

1. **Q4 — who owns `useCheckIns`?** Highest-value item in the document; Area D is
   deleting both of its own call sites and inherits one new one. Unowned, it does
   not get built and 12 components keep re-pulling. **Two rounds unowned.**
2. **Q5 — does Area A take N3 (placeholder-date detector)?** Now load-bearing:
   youth's cliff-cohort filter bands on `calculatedGrade`, derived from a
   birthdate that only has to parse. Declining N3 makes the one surviving youth
   signal untrustworthy. **Two rounds unowned.**
3. **Q3 — who owns the Intelligence landing view?** `App.tsx:83` lands the exec on
   `copilot`. If Area C moves it to `intel-home`, Area D's sidebar contribution
   drops from 1 row to 0 (§1.2). Area C must rule.
4. **Q6 (new) — the `Guest` predicate.** §1.3/D12. Live undercount on an Area C
   screen against real data, invisible in the fixture.
5. **Q7 (new) — Area C's calendar-blind drift window.** `drift.ts:21-24`. Youth's
   hand-off is only trustworthy once it lands.
6. **Q2 (standing) — is the raw-`attributes` read a systemic defect with an
   owner?** `prayer_topic`, `death_date`, `anniversary`, `first_time_giver`,
   `first_gift_date` are all read straight off `attributes` (`pco.ts:231,284-287`)
   with no `field_data` traversal, all synthesised in `mock-api/data.js`, none of
   them PCO People core attributes. Area D found five by accident;
   `AutomationsReport.tsx:64` is already shipping one to users. Nobody has grepped
   the other five areas. Verification this round adds the useful contrast:
   `household_id` looks like the same pattern and **is not** — it is hydrated from
   the real `households` include (`pco.ts:193,219-222,444`). So the audit is a real
   discrimination task, not a blanket suspicion of `attributes`.

**The one thing round 4 could still overturn in this area:** whether
`city-distribution` should exist at all, even as an export. Admin came closest to
arguing no ("at most, someone screenshots this chart once into a deck"). Nobody
argued it outright. If round 4 wants a target, that is the only live one.

---

## 6. New ideas — none earned this round

v2's three (N1 Intelligence Home, N2 first-time-guest series, N3 placeholder-date
detector) all survived round 3 intact and are now specified in §4 as D10, D7 and
D11/N3 respectively. N2 gained a corrected predicate (§1.3); N3 gained a second
consumer (youth's cliff filter depends on it). **No fourth idea is proposed.** The
area is at eight cuts, one demoted card set and one export; adding a new surface
now would violate the rule that a proposal adding a screen must delete two, and
there is nothing left in Area D to delete.
