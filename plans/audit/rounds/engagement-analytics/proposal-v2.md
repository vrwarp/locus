# Area D — engagement-analytics — Proposal v2 (Round 2 synthesis)

Synthesised from `r2-uxr.md`, `r2-church-admin.md`, `r2-youth.md`, `r2-children.md`,
attacking `proposal-v1.md`. Every critic claim below was re-verified against source
before being ruled on. Two new facts surfaced that no critic found; both cut
against v1.

---

## 1. Changes since last round

### D4 is dead. I was wrong, and the critics under-stated how wrong.

v1's central move was keeping a merged `attendance` route on the strength of a
`kind` (Regular vs Volunteer) split that would "beat PCO's native report." All
four critics attacked it. I verified their claims and then found the fact that
finishes the argument:

**In the fixture, `kind` is a deterministic function of `event.data.id`.**
Traced `mock-api/data.js:213-241` (events) against `:280-419` (check-ins):

| Event | Name | Who checks in | `kind` |
|---|---|---|---|
| `'1'` | Friday Night Live | children only | `Regular` (100%) |
| `'2'` | Sunday Kids Church | children only | `Regular` (100%) |
| `'3'` | Sunday Worship Service | adults only | `Regular` (100%) |
| `'4'` | Kids Ministry Team | volunteers only | `Volunteer` (100%) |
| `'5'` | Greeter Team | volunteers only | `Volunteer` (100%) |

There is no event with both `Regular` and `Volunteer` check-ins. So children's
claim — "select event `'2'` and the volunteer series is always zero" — is correct,
and the stronger consequence is that **the `kind` control carries zero information
beyond the event dropdown it would ship next to.** Two controls, one degree of
freedom. The two-series chart is degenerate for every possible selection, not just
for kids' rooms. v1 built its whole KEEP case on a filter that is redundant with
the filter beside it.

The supporting claims all hold too:
- **No room dimension, ever.** `PcoEvent` (`pco.ts:100-107`) carries `name` and
  `frequency` only. `PcoCheckIn` (`pco.ts:109-121`) carries `person` and `event`
  relationships only — no location, no team. `fetchRecentCheckIns`
  (`pco.ts:508`) requests `?per_page=100` with no `include=`. Church-admin and
  children's are both right: the room-level live ratio PCO Check-Ins ships at the
  station is structurally unreachable from what Locus fetches.
- **No 9am/11am split exists.** One `'Sunday Kids Church'`, one `'Sunday Worship
  Service'`, for the whole year. v1 claimed the event filter "answers children's
  9am vs 11am objection." It does not; nothing can.
- **No per-student dimension.** `aggregateCheckInsByWeek` (`attendance.ts:10-33`)
  is a `Record<string, number>` week-bucket reducer returning `{week, date,
  count}`. Youth is right: filtering its input narrows the population, it does not
  add a student axis.
- **Velocity is Sunday-only.** `calculateCheckInVelocity` (`velocity.ts:12-16`)
  hard-filters `getDay(date) === 0`. So the event filter v1 promised youth
  ("Friday Night Live only") would render an empty velocity tab by construction.
  Neither v1 nor any critic caught this.

**Ruling: D4 collapses.** `#30` is CUT outright. `#29` survives only as an
unfiltered card, which is what all four critics independently landed on. UXR is
also right that v1's reasoning was circular — I justified a nav slot with
engineering that did not exist, while demoting Demographics, which is honest
today. Area D's nav goes **8 → 1**.

### Second new fact: the duplicate fetch is 13-way, not 2-way

v1 called `AttendancePulse` + `CheckInVelocity` "one feature charted twice." Grep
for `fetchRecentCheckIns` consumers returns **13 components**, each with its own
uncached `useEffect`. Six run at the 100-page default (~10,000 records):
`Dashboard.tsx:33`, `CoPilot.tsx:43`, `RecruitmentReport.tsx:26`,
`NewcomerFunnel.tsx:18`, `AttendancePulse.tsx:27`, `CheckInVelocity.tsx:22`.
Seven more run at 20 pages (`BurnoutReport`, `MissingVolunteersReport`,
`DriftReport`, `BusFactorGraph`, `VolunteerWeb`, `SermonCorrelator`,
`SermonSentiment`). Navigating the Intelligence sidebar therefore re-pulls the
same check-in history a dozen times per session against a rate-limited API.

This upgrades `useCheckIns` (N2) from a side-effect of a merge that is no longer
happening into the **highest value-per-effort item to come out of this area**, and
it is app-wide, not Area D's to own alone.

### Third: `first_time_giver` / `anniversary` are the `prayer_topic` pattern again

Chasing church-admin's dropped ask surfaced a class of defect. `transformPerson`
(`pco.ts:284-286`) reads `first_time_giver`, `first_gift_date` and `anniversary`
straight off `attributes`, with no `field_data` custom-field traversal — exactly
the pattern that got Sentiment Pulse's `prayer_topic` cut in v1. All three exist
only because `mock-api/data.js:103-107,131` synthesises them. PCO People has no
such core attributes and the standing context says Locus has **no Giving API
access**. This kills half of church-admin's ask and implicates Area C
(`automations.ts:154`, `AutomationsReport.tsx:64` consume `firstTimeGiver`).

### Conceded to critics without qualification

- **Youth on D6.** `calculatedGrade` primary, not `pcoGrade`. I had it backwards. §3.1.
- **Church-admin on anniversaries.** I marked a 3/4 as converged where admin
  explicitly opposed. Silence is not a vote; that was sloppy. §3.4.
- **UXR on N1 sizing and on the default-view change.** Both accepted as stated. §3.3.
- **Children's on the k-anonymity constant.** A fixed 5 was set before the
  denominator changed to households and never re-derived. §3.2.

---

## 2. Per-feature decisions

| # | Feature | Verdict | Rationale | Converged? |
|---|---------|---------|-----------|---|
| 29 | Attendance Pulse | **DEMOTE** to one card on Intelligence Home; delete route | Real data, but the `kind` split that justified its route is redundant with the event filter and yields no ratio. Ceiling is a glanceable weekly number. All four critics landed here. | **Y (4/4)** |
| 30 | Check-in Velocity | **CUT** | Sunday-only by construction (`velocity.ts:12-16`), 7am–1pm hardcoded, no room/station dimension possible, "Real-time" false. No critic defends it as a destination. | **Y (4/4)** |
| 31 | Solar System | **CUT** | Decorative family-tree over named minors that drops single-parent households. Unchanged 2 rounds. | **Y (4/4, 2 rounds)** |
| 32 | Heatmap of Life | **CUT** (was SIMPLIFY+DEMOTE) | Deaths + anniversaries both read fabricated fields. Birthdays are real but unactionable — PCO Lists filters *and* messages; a grid cannot. Admin's own test ("cut it if it ships without export") fails. Value moves to N3. | N (changed this round) |
| 33 | Demographics / Generation Stack | **FIX** (`calculatedGrade` banding) then **DEMOTE** to card | The only honest chart in the area. Defect is the axis, not its existence. Youth's source-of-truth flip accepted. | N |
| 34 | Map View | **FIX** (blocking) + rename + **KEEP** as Area D's only route | Real gap PCO doesn't fill, but ships city-labelled bars with no floor over a roster containing minors, counted per-person. Now the sole survivor — and therefore the sharpest open question. | N |
| 35 | Global Pulse | **CUT** | Fabricated benchmark in front of the budget-signer. Unchanged 2 rounds. | **Y (4/4, 2 rounds)** |
| 36 | Sentiment Pulse | **CUT** | Safeguarding veto + `prayer_topic` never populated. Unchanged 2 rounds. | **Y (4/4, 2 rounds)** |

**Net nav change: 8 Intelligence slots → 1** (`city-distribution`), plus 1 new
home surface. Net **−6 destinations**. Six components, six CSS files and three
utils deleted outright.

---

## 3. Rulings on the four items sent to this round

### 3.1 D6 source-of-truth — youth wins, flip it. CONVERGED by concession.

Verified: `calculateExpectedGrade` (`grader.ts:12-30`) derives grade from
birthdate against a Sept-1 cutoff. `calculatedGrade` is typed `number` — **not
nullable** — on every `Student` (`pco.ts:78`), and is guaranteed populated because
`transformPerson` already returns `null` for any unparseable birthdate
(`pco.ts:233-241`). `pcoGrade` is `number | null` (`pco.ts:73`) and is the raw
manual field. `delta` (`pco.ts:249`) already holds `calculatedGrade - grade`.

So youth is right on every count, and there is a consequence neither of us stated:
**banding on `pcoGrade` would make the chart's bars move when a Core user fixes
data in Data Health.** A demographic chart that reports hygiene churn as
population change is worse than no chart. `pcoGrade` is the field the product
exists to *catch errors in*; it cannot also be the axis a chart trusts.

**Ruling:** band on `calculatedGrade` exclusively. `pcoGrade` appears only as a
free caption — `students.filter(s => s.pcoGrade !== null && s.delta !== 0).length`
— rendered as "N students' recorded grade disagrees with expected grade → fix in
Data Health." Zero new computation; `delta` is already on the record.

### 3.2 The k-anonymity floor — youth and children's are compatible; adopt both. `isChild` rejected.

**On the number.** Youth wants 10, non-adjustable. Children's says a fixed
constant is the wrong *shape* and wants `max(10, ceil(0.05 * totalHouseholds))`.
These are not in conflict — children's formula has youth's constant as its floor.
Youth's supporting catch is verified and damning: `MapView.tsx:56` sets the
existing suggestion slider `min="5"`, so v1's "safeguarding floor of 5" was the
same number as a discretionary business slider's weakest setting.

**Ruling: `minClusterSize = max(10, ceil(0.05 * totalHouseholds))`, computed
internally, never exposed in the UI, not a prop.** The suggestion threshold
(`MapView.tsx:53-61`) stays user-adjustable — it drives a business decision — but
it is now clamped to never display below the k-floor.

**On the `isChild` filter — REJECTED, and this is not overruling a veto.**
Children's is right that I dropped it silently; I owe the explicit argument.

The safeguarding concern is re-identification. The instrument proposed does not
close it and **inverts the risk**: a chart filtered to `isChild` is literally
"cities where our minors live" — a strictly more sensitive artifact than the
whole-roster version, and the exact shape of thing the Solar System veto killed.
What closes re-identification is the fix already in D5: **dedupe on
`householdId`** (`geospatial.ts:11` currently iterates people). Once the unit of
count is the household, no minor is individually represented in the chart at all;
the minor-bearing rows disappear into the household rows that contain them.

Children's second argument — that a whole-roster chart "delivers zero
children's-ministry value" — is a fitness argument, not a safety veto, and it
loses on fitness grounds: the chart's one legitimate job (campus siting) is a
whole-household question. Filtering to children would break the only job it does
while making the output more sensitive. The veto is honored by the floor and the
dedupe; the proposed remedy is declined because it points the wrong way.

### 3.3 UXR's N1 objections — both accepted in full

**Sequencing (3a/3c).** Accepted. `IntelligenceHome` ships **first**, and the
demotions land into it, not the other way round. Card budget accepted verbatim:
**3 cards, above the fold, fixed height, no internal scroll, no control heavier
than a toggle.** With #32 now CUT the budget is comfortable — attendance,
demographics-mini, needs-attention. No "Reports" overflow page; if a fourth card
is ever proposed, one of the three must go.

**Cross-area default view (3b).** Accepted, and UXR is right that I flagged the
smaller `copilot.ts` dependency while missing the larger one. **Do not touch
`App.tsx:82`.** `intel-home` lands as an added route only; the intelligence role
keeps landing on `copilot` until the Area C synthesis rules on it. Logged as
cross-area question Q3.

**UXR's two dropped R1 items, now answered.** (a) YoY/seasonal context — declined:
`fetchRecentCheckIns` at 100 pages does not reliably reach 52 weeks back for a
large church, so a same-week-last-year line would silently render against a
truncated window. Replaced by the first-time-guest series (N2), which is
computable from the fetched window. (b) "Pulse" brand-word overload — accepted;
the card is titled **"Weekly Check-ins,"** and `AttendancePulse.tsx` is deleted as
a page component.

### 3.4 Church-admin's named drop — taken up, and it splits three ways

Admin's R1 ask was "combine #29 with something PCO's native report doesn't do:
giving, volunteer scheduling, or first-time guest counts on the same week axis."
Admin is right that v1 spent its entire budget on the `kind` split instead. Ruling
on each:

- **Giving overlay — NOT BUILDABLE, and blocking if attempted.** `firstTimeGiver`
  / `firstGiftDate` (`pco.ts:284-285`) are read raw off `attributes` and exist
  only in `mock-api/data.js:103-107`. Locus has no Giving API access. Building
  this would ship mock data as insight — the same defect that cut Global Pulse.
  **Cross-area hand-off:** Area C's Automations (`automations.ts:154`,
  `AutomationsReport.tsx:64`) already renders a "first-time givers" action list
  off this fabricated field. That is a live instance of the defect and Area C
  should be told.
- **Volunteer-scheduling overlay — NOT BUILDABLE.** Scheduling lives in PCO
  Services; Locus reads People + Check-Ins only.
- **First-time-guest overlay — BUILDABLE, and it is now the card's reason to
  exist.** `calculateNewcomerFunnel` (`retention.ts:10-42`) already derives each
  person's first check-in date by grouping `relationships.person.data.id` over the
  same array `aggregateCheckInsByWeek` consumes. A "first check-ins this week"
  series is a groupBy over data already in memory, and PCO's native attendance
  report genuinely does not overlay new-guest counts on weekly volume. **This
  replaces the dead `kind` split** as the thing the card carries beyond raw
  volume. See N2.

**Admin's D8 cost objection.** Partly accepted: the "what would we cancel to pay
for this" math is now explicit — Intelligence Home is paid for by six deleted
components. Admin's cheaper alternative (a header strip on `CoPilot.tsx`) is
**declined**: it would make Area D's demotions a permanent edit to Area C's
component, which is the same cross-area overreach UXR flagged in 3b. One new file,
one route, no default-view change, three cards, hard cap.

**Admin's anniversaries process objection — sustained on process, verdict
unchanged on new grounds.** Admin is right that I folded a 3/4 into a 4/4 and that
silence is not a vote. But `anniversary` is read raw off `attributes`
(`pco.ts:286`) and synthesised at `mock-api/data.js:131`; PCO People has no such
core attribute. It is the `prayer_topic` pattern. It is cut because the field is
fabricated, not because two critics didn't need it — a different and better
argument, and admin is entitled to attack that one in round 3.

### 3.5 Youth's per-student ledger — real job, wrong area

Youth's ask (join `PcoCheckIn.relationships.person.data.id` back to `Student` so a
leader sees *which* kids attended) is the strongest unserved need in the critique
set. It is also **already implemented** — `retention.ts:10-30` builds exactly that
`checkInsByPerson` map. So it is not net-new engineering; it is a pattern that
exists one area over.

**Ruling: it does not become a new Area D screen.** "Which students have lapsed"
is a pastoral-care question and Area C already owns two surfaces for it
(Predictive Attrition #21, Missing Volunteers #22). Adding a grade dimension to an
Area C surface that already does the per-person join beats adding a ninth chart to
an area being cut from eight to one. **Hand to Area C** with youth's grade-cliff
requirement attached. Youth's honesty demand is separately accepted: the card is
titled "Weekly Check-ins," never "attendance," and carries the line "Check-Ins
only — small groups are not included."

---

## 4. The concrete work, ordered by value-per-effort

### D1. `useCheckIns` shared cache — app-wide, now the top item
Thirteen components independently pull check-in history uncached; six at ~10,000
records. This is a rate-limit and latency defect on every Intelligence navigation.
- New `src/hooks/useCheckIns.ts`: module-level promise cache keyed on
  `auth` + `maxPages`, so the pull happens once per session. Callers request a
  page depth; a cached deeper result satisfies a shallower request.
- Migrate all 13 call sites (listed in §1). Area D owns two of them and both are
  being deleted, so **this must be handed to a cross-area owner to be worth
  doing.** Flagged as Q4.
- Do **not** add `kind`/event params to the fetch (v1's open Q5): with `kind`
  collinear to event and both filters now cut, there is nothing to push server-side.

### D2. Delete Global Pulse — blocking, trivial (unchanged from v1, CONVERGED)
- Delete `src/components/GlobalPulse.tsx`, `GlobalPulse.css`, `GlobalPulse.test.tsx`.
- Delete nav `SidebarIntelligence.tsx:28-34` (`onChangeView('global-pulse')` at `:30`); route `App.tsx:986-990`.
- Update `src/layouts/IntelligenceLayout.test.tsx:29`.
- Do not port the `accuracy - 10` Health Score (`GlobalPulse.tsx:17`); it disagrees with `Dashboard.tsx:79`.

### D3. Delete Sentiment Pulse — safeguarding veto (unchanged, CONVERGED)
- Delete `SentimentPulse.tsx`, `.css`, `.test.tsx`, `src/utils/sentiment.ts`, `sentiment.test.ts`.
- Delete nav `SidebarIntelligence.tsx:36-42`; route `App.tsx:906-910`.
- **Cross-area:** delete `copilot.ts:304-328`, the import at `:10`, and "Spiritual Climate" from the fallback string at `:334`. Without this Co-Pilot deep-links to a dead route.

### D4. Delete Solar System — unanimous, zero dependents (unchanged, CONVERGED)
- Delete `SolarSystem.tsx`, `.css`, `.test.tsx`.
- Delete nav `SidebarIntelligence.tsx:124-130`; route `App.tsx:876-881`.
- Hand the one real signal (children with no linked adult, `SolarSystem.tsx:44-46`) to Area A's Family Audit as a row.

### D5. Delete Check-in Velocity outright — new this round
- Delete `src/components/CheckInVelocity.tsx`, `CheckInVelocity.css`, its test, `src/utils/velocity.ts`, `velocity.test.ts`.
- Delete nav `SidebarIntelligence.tsx:100-106`; route `App.tsx:856-861`.
- Rationale of record: Sunday-hardcoded (`velocity.ts:12-16`), window hardcoded 420–780 minutes (`:40-42`), no station dimension possible, and its `latest` series is a single unlabelled Sunday presented beside a 52-week average.

### D6. Delete Heatmap of Life outright — changed from v1's SIMPLIFY
- Delete `LifeEventsHeatmap.tsx`, `.css`, `.test.tsx`, `src/utils/heatmap.ts`, `heatmap.test.ts`.
- Delete nav `SidebarIntelligence.tsx:132-138`; route `App.tsx:863-867`.
- Also drop `deathDate` from `Student` (`pco.ts:98`), `anniversary` (`:97`), and `death_date`/`anniversary` from `transformPerson` (`pco.ts:286-287`) — fabricated fields with no PCO People source.
- The surviving value (placeholder-date detection) moves to Area A. See N3.

### D7. Demote Attendance Pulse to one card
- Delete route `App.tsx:849-854` and nav `SidebarIntelligence.tsx:92-98`.
- Delete `src/components/AttendancePulse.tsx`. **Keep `src/utils/attendance.ts`** — `aggregateCheckInsByWeek` is correct and feeds the card.
- Card renders: weekly total sparkline + first-time-check-ins series (N2), titled **"Weekly Check-ins,"** with the line "Check-Ins only — small groups not included" and an "open in PCO Check-Ins" link.
- Drop the unlabelled `♥` glyph (`AttendancePulse.tsx:70`) and the word "Pulse".

### D8. Demographics — fix the axis, then demote
- `src/utils/demographics.ts`: export `MINISTRY_BANDS` (nursery 0-2, preschool 3-4, elementary K-5, middle 6-8, high 9-12, adults 19+) and add `mode: 'generations' | 'ministry'` to `calculateDemographics`. **Band on `calculatedGrade` only** (§3.1) with `age` for pre-K.
- `GenerationStack.tsx`: `mode` prop + two-option toggle (the one control the card budget allows).
- Add the `delta !== 0` disagreement caption (§3.1).
- Delete route `App.tsx:883-888` and nav `SidebarIntelligence.tsx:140-146`; render as home card 2.

### D9. Map View — blocking fixes, then rename, then keep as the one route
- **Blocking (k-anonymity):** in `calculateCityClusters` (`geospatial.ts:8-30`) add an internal floor `max(10, ceil(0.05 * totalHouseholds))`, filter below it, return a `suppressed` count. Remove the unguarded `clusters.slice(0, 20)` (`MapView.tsx:28`). Clamp the suggestion slider (`MapView.tsx:56`) so it can never display below the floor.
- **Blocking (denominator):** dedupe on `student.householdId` before tallying (`geospatial.ts:11` currently counts people). A family of five inflates its city 5×, and `suggestCampusLocations`'s threshold (`geospatial.ts:39`) sits on that inflated number. This is also what closes the minor-exposure concern (§3.2).
- Normalise address strings before grouping (`geospatial.ts:13-19` only title-cases): collapse `St./Saint`, `Ft./Fort`, `Mt./Mount`.
- **Rename:** route `map-view` → `city-distribution`; `MapView.tsx` → `CityDistribution.tsx`; `geospatial.ts` → `cityClusters.ts`; drop the 🗺️ icon (`SidebarIntelligence.tsx:152`, `MapView.tsx:36`); "Predictive Planting Suggestions" (`MapView.tsx:105`) → **"Cities Above Threshold"** — it is a `count >= threshold` filter, nothing predictive.

### D10. Build Intelligence Home — 3 cards, capped, non-default
- `src/components/IntelligenceHome.tsx`, route `intel-home`. **Do not change `App.tsx:82`.**
- Cards: (1) Weekly Check-ins (D7/N2), (2) `<GenerationStack mode="ministry">` (D8), (3) needs-attention counts linking to Area C's burnout/attrition/missing.
- Fixed height per card, no internal scroll, no control heavier than a toggle, no aggregate health score.
- Plus a plain-text coverage line (D11).
- Section `SidebarIntelligence.tsx:18` into *Needs attention* / *Reports*.

### D11. Global honest-denominator fix (hand to Area A)
`transformPerson` (`pco.ts:233-241`) discards every person lacking a parseable
birthdate before `App.tsx:236-237,397` builds `students`. Every count in Areas C,
D and F is over an unstated subset. Either expose the discard count, or carry
`birthdate: null` through with per-chart exclusion. Cross-area; Area D is only
where it does the most visible damage.

---

## 5. Unresolved disagreement — questions round 3 must settle

1. **Does `city-distribution` survive being the last one standing?** This is the
   question I most want attacked, and it is an attack on myself. I demoted
   Demographics partly on church-admin's "once or twice a year" frequency
   argument. Campus siting is a *once every several years* decision. If frequency
   is the test, `city-distribution` fails it harder than Demographics did, and
   Area D should go to **zero routes** with a suppressed-count city table as home
   card 4 (or as an export). The only argument for the route is that the threshold
   slider and suppression disclosure need more room than a card allows — which is
   exactly the "interaction earns a slot" test UXR proposed. Round 3: apply UXR's
   own test to the one screen UXR left standing.
2. **Is the raw-`attributes` read a systemic defect needing one owner?**
   `prayer_topic`, `death_date`, `anniversary`, `first_time_giver`,
   `first_gift_date` are all read directly off `attributes` (`pco.ts:284-286`,
   `:276`, `:288`) with no `field_data` traversal, all synthesised in
   `mock-api/data.js`, none of them PCO People core attributes. Area D found five
   by accident. Someone should grep the other five areas — Area C is already
   shipping one to users (`AutomationsReport.tsx:64`).
3. **Who owns the Intelligence landing screen?** `App.tsx:82` currently lands the
   exec on `copilot`. Area D built the home but is not changing the default.
   Area C must rule.
4. **Who owns `useCheckIns`?** It is the highest-value item in this document and
   Area D is deleting both of its own call sites. If no cross-area owner takes it,
   it does not get built and eleven components keep re-pulling 10k records.
5. **Does the placeholder-date detector still have a consumer?** With the heatmap
   cut, N3 has no chart to grey out. It is now purely an Area A Data Health row.
   If Area A declines it, the finding dies — round 3 should confirm Area A wants it.

**Withdrawn from v1's open questions:** Q1 (settled — PCO does ship the
Regular/Volunteer split, and `kind` is collinear with event anyway); Q2 (settled,
§3.2); Q4 (settled — heatmap CUT); Q5 (moot — no filters left to push server-side).

---

## 6. New ideas earned this round (3)

### N1. Intelligence Home — revised, capped, non-default
**Replaces:** the `global-pulse` and `solar-system` nav slots outright, plus three
routes collapsed into cards (`attendance`, `demographics`, and the deleted
`heatmap`'s intended card). Net **−6 destinations for +1**.
**Changed from v1:** hard cap of 3 cards with a fixed-height/no-scroll/toggle-only
interaction budget (UXR 3a), and the default-view change is **removed** (UXR 3b).
Unserved job unchanged: the exec lands on `copilot` facing a 23-item flat list
where Burnout Risk and a family-astronomy toy are visually identical.

### N2. First-time-guest series on the Weekly Check-ins card
**Replaces:** the `kind`-split two-series chart from v1's D4, which §1 shows is
degenerate. This is church-admin's actual R1 ask, finally taken up, minus the two
thirds of it that read fabricated fields.
**Unserved job:** "is our weekly volume moving because regulars lapsed or because
new people stopped arriving?" PCO's native attendance report does not overlay
new-guest counts on the week axis.
**Build:** reuse the per-person first-check-in grouping already in
`retention.ts:10-30` to emit a `firstTimeCount` per week alongside
`aggregateCheckInsByWeek`'s `count`. Same array, one extra reducer, no new fetch,
no new field. Two lines on one sparkline, no controls — fits the card budget.

### N3. Placeholder-date detector as an Area A Data Health signal
**Replaces:** the entire Heatmap of Life (v1 had it replacing only two of three
modes). With the chart cut, this is the only thing worth salvaging from it.
**Unserved job:** children's found that Jan 1 is what a rushed volunteer types when
they don't know a birthdate, and the heatmap's own fixture encodes that pattern
(`LifeEventsHeatmap.test.tsx:40`) while treating it as valid. Nothing in Locus
detects placeholder dates, despite data hygiene being the product's premise — and
because `transformPerson` requires a parseable birthdate, a placeholder date is
strictly *worse* than a blank one: it silently passes the gate and enters every
chart in the app as a real value.
**Build:** `detectPlaceholderDates(students)` in `src/utils/hygiene.ts`, flagging
day/month clusters exceeding a multiple of the roster mean. Consumed as a fixable
row in Data Health / Smart Fix. Turns Area D's most prominent false signal into
Area A's next bounty. Contingent on Q5.
