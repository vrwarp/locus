# Area D — engagement-analytics — Proposal v1 (Round 1 synthesis)

Synthesised from `r1-uxr.md`, `r1-church-admin.md`, `r1-youth.md`, `r1-children.md`.
Every claim below was re-verified against the source before being built on;
corrections to the critics are marked **[CORRECTION]**.

## 1. Changes since last round

**Initial proposal.** No prior round exists for this area; nothing is CONVERGED
yet. Four items are unanimous across all four critics and should be treated as
converging on the first pass (#31, #35, #36, and the Deaths mode of #32).

Three corrections to the critics carried into this proposal:

* **[CORRECTION — UXR #33]** UXR says `GenerationStack` "silently drops members
  with missing/invalid birthdates." The drop is real but happens **one layer
  up**: `transformPerson` (`src/utils/pco.ts:233-241`) returns `null` for any
  person with a missing or unparseable `birthdate`, and `App.tsx:237,397` maps
  it into `students`. So the `'Unknown'` bucket in `calculateDemographics`
  (`src/utils/demographics.ts:26,30-38,44-47`) is near-dead code — it can only
  ever catch a birth year outside 0–present. **The honest-denominator problem is
  area-wide, not a GenerationStack bug**: *every* Area D chart fed `students`
  silently excludes every birthdate-less PCO record, including Map View,
  Heatmap, Solar System and Sentiment Pulse. Fix once, globally; do not caption
  eight charts.
* **[CORRECTION — UXR nav]** The Intelligence sidebar is not "a single flat
  unsectioned 24-item list". It is **26 items in two labelled sections** —
  23 under `Intelligence`, 3 under `Tools` (`SidebarIntelligence.tsx:18,204`).
  All 8 Area D features sit in the 23-item block. The substance of the critique
  (one undifferentiated block, toys next to Burnout Risk) stands.
* **[CORRECTION — both UXR and church-admin]** Both propose demoting features
  "to the Dashboard". **There is no Dashboard on the Intelligence surface.**
  `SidebarIntelligence.tsx` has no `dashboard` entry (verified: zero matches),
  and `handleSelectRole` (`App.tsx:81-83`) lands the intelligence role on
  `copilot`. `Dashboard.tsx` is Core-only. Demotion has nowhere to go until an
  Intelligence home exists — which is why it is New Idea #1 below.

**Verified as stated by the critics** (no correction needed): the hardcoded
radar literals in `GlobalPulse.tsx:24,30,35-36,41-42,47-49`; the `// Mocked`
comments; "Real-time" copy at `CheckInVelocity.tsx:60` against a one-shot mount
fetch at `:20-22`; the absence of any map in `MapView.tsx` (Recharts `BarChart`,
`:70-97`); `clusters.slice(0, 20)` with no minimum count (`MapView.tsx:28`);
per-person not per-household counting (`geospatial.ts:11`); the `deaths` mode
(`heatmap.ts:65-67`, `LifeEventsHeatmap.tsx:10,49`); `Math.random()` colour on
every render (`SentimentPulse.tsx:64`); the household filter that drops
single-parent and guardian-only households (`SolarSystem.tsx:44-46`).

**Two new facts neither round-1 critic surfaced, both load-bearing:**

1. **#29 and #30 issue the identical fetch.** `AttendancePulse.tsx:27` calls
   `fetchRecentCheckIns(auth)` and `CheckInVelocity.tsx:22` calls
   `fetchRecentCheckIns(auth, 100)` — the default `maxPages` is **100**
   (`pco.ts:507`), so both pull the same ~10,000 check-ins, uncached, from two
   nav slots, and render two views of one array. This is not two features. It
   is one feature charted twice.
2. **Cutting #36 has a cross-area dependency.** `copilot.ts:304-328` has a
   "Spiritual Climate" intent that calls `calculateSentimentPulse` and
   deep-links `view: "sentiment-pulse"`. Area C's Pastoral Co-Pilot (#19)
   must be edited in the same change or it will route to a dead view.

## 2. Per-feature decisions

| # | Feature | Verdict | Rationale | Converged? |
|---|---------|---------|-----------|---|
| 29 | Attendance Pulse | **MERGE** (into one Attendance screen with #30) + FIX | Real PCO data, but an unfiltered single line is strictly less capable than PCO Check-Ins' own native attendance report. Earns its slot only with the `kind` (Regular vs Volunteer) split and an event filter. | N |
| 30 | Check-in Velocity | **MERGE** (tab 2 of #29) + FIX copy | The arrival curve is the one thing PCO doesn't offer — but "Real-time" is false, and it re-fetches the same 10k records #29 already has. | N |
| 31 | Solar System | **CUT** | Unanimous. Decorative family-tree with zero action, built from named minors' ages, that silently deletes single-parent and guardian-only households. | Y (4/4) |
| 32 | Heatmap of Life | **SIMPLIFY** — cut `deaths` and `anniversaries` modes, keep birthdays, gate on placeholder detection | Deaths mode is unshippable on tone and reads a field real PCO never returns. Birthdays are real but Jan-1 placeholders will dominate the grid. | Partial (deaths 4/4) |
| 33 | Demographics / Generation Stack | **FIX** (add ministry-band mode) then **DEMOTE** to a card | The honest, correct, cheapest chart in the area. Its defect is the bucketing axis, not its existence. | N |
| 34 | Map View | **FIX** (blocking, safeguarding) + rename + DEMOTE | Fills a real PCO gap, but ships a city-labelled bar with no minimum group size over a roster that includes minors, counted per-person not per-household, under a false "Map"/"Predictive" label. | N |
| 35 | Global Pulse | **CUT** | Fabricated benchmark presented to the most senior user in the building. Blocking. No cheap fix preserves the premise. | Y (4/4) |
| 36 | Sentiment Pulse | **CUT** | Safeguarding veto (children's + youth). Also reads `prayer_topic`, which is not a PCO People attribute — permanently empty in production. | Y (4/4) |

**Net nav change: 8 Intelligence slots → 2** (`attendance`, `map-view`
renamed), plus 1 new home surface. Three components and three CSS files deleted
outright; two routes collapsed into cards.

## 3. Settling the two live disagreements

### #29 Attendance Pulse — KEEP (uxr) vs SIMPLIFY (church-admin) vs DEMOTE (children) vs CUT (youth)

**Verdict: MERGE with #30 into one `attendance` screen, then FIX the two data
defects.** Not KEEP, not CUT.

*Why youth's CUT loses.* Youth is right that the aggregate line cannot see an
individual student, an event, or a grade — verified: zero references to `grade`,
`pcoGrade` or `isChild` anywhere in the eight Area D files except
`SolarSystem.tsx:36`. But that is an argument for a filter, not a funeral. The
data is genuinely real, already fetched, and the fix is a `groupBy` on
`relationships.event.data.id` (`pco.ts:113-119` — the relationship is already on
the wire) plus a `kind` filter. CUT would be correct if the numbers were
fabricated; they are not. Deleting the only real attendance surface in the
product, in the area named "engagement-analytics", because it lacks a dropdown
is subtraction as reflex rather than as judgement.

*Why UXR's KEEP loses.* UXR never weighs the competitive fact and church-admin
does: PCO Check-Ins' native Attendance report already gives weekly volume
**broken down by event and location**. Locus's version is one flat line with no
event filter and no service split. Shipping it as-is means shipping a worse copy
of a report the customer already pays for and occupying a nav slot with it.
UXR's proposed fix (a same-week-last-year dashed line) is a good idea that does
not address why the screen exists.

*Where children's DEMOTE lands.* Children's is directionally right and supplies
the single most valuable missing feature in the area: `kind: 'Regular'` vs
`kind: 'Volunteer'` are both present in `PcoCheckIn.attributes.kind`
(`pco.ts:113`) and in the mock fixture (`mock-api/data.js:307,354,375,413`), and
**nothing in Area D filters on it**. So the weekly line is kids-in-class plus
adults-clocking-in summed together, and the kid-to-volunteer ratio — a
ratio/safety number a director needs every Sunday — is computable from data
already in memory and is computed nowhere. That single split is what makes this
screen beat PCO's native report. DEMOTE-to-a-card is deferred only because there
is no Intelligence home to demote into yet (see New Idea #1); once there is, the
summary goes on the card and the filterable view keeps the route.

### #33 Demographics — KEEP (uxr) / KEEP-as-widget (church-admin) vs CUT (youth) / NOT MY LANE (children)

**Verdict: FIX the bucketing, then DEMOTE to a card. Not CUT.**

*Why youth's CUT loses — by youth's own words.* The critique states: *"This
exact file could be that with a two-line change to the bucketing function."*
That is a FIX argument filed under a CUT verdict. The complaint is that
`GENERATIONS` (`demographics.ts:9-17`) uses 15-25-year marketing bins that put a
6th and a 12th grader in the same bar — true, and children's critique
independently confirms the same defect from the other end ("Gen Alpha" spans
ages 0-13, collapsing nursery, preschool and elementary into one bar). Two
critics describing the same wrong axis is strong evidence the axis is the
defect. It is not evidence the feature should not exist. `calculateDemographics`
is the only function in Area D that is honest, correct, cheap and free of
fabrication; deleting it would leave the area with strictly less truth in it.

*Why UXR's plain KEEP is insufficient.* KEEP-as-is means keeping a chart that
two of four critics say cannot answer their planning question. Church-admin's
"don't over-invest, a widget is plenty" is the right ceiling and the right
placement.

*The fix that satisfies all three complaints with one control.* Add a `mode`
segmented control to `GenerationStack.tsx`: **Generations** (existing bins —
church-admin's whole-church strategy question) | **Ministry bands** (nursery
0-2, preschool 3-4, elementary 5-11, middle 6-8, high 9-12, adults 19+ — derived
from `pcoGrade` with `age` fallback, which serves children's room-staffing
question and youth's 5→6 / 8→9 / graduation cliffs). One new exported band array
in `demographics.ts`, one prop in `GenerationStack.tsx`. Same data, same file,
three answered questions.

### Domain vetoes — recorded as vetoes, not votes

Per the synthesis rules, these outrank every usability and business argument in
this document and are not open for re-litigation in round 2 on UX grounds:

* **#36 Sentiment Pulse.** Children's and youth both flag it as a
  confidentiality failure over minors: `calculateSentimentPulse`
  (`sentiment.ts:12-20`) runs the unfiltered roster, `SentimentPulse.tsx:62`
  makes the *most sensitive* topic the *physically largest* thing on a
  read-only executive dashboard, with no minimum-count threshold and no
  `isChild` exclusion. In a small group, one rare topic is trivially
  re-identifiable. **VETO — CUT.** Independently, the copy at
  `SentimentPulse.tsx:53` ("anonymized prayer requests and comment themes") is
  false on all three counts: nothing is anonymized, there are no free-text
  requests, and there are no comments — it is a tally of one categorical field.
* **#32 Deaths mode.** Three critics; youth notes the code path will render over
  the minor roster the day the field is populated. **VETO — CUT the mode.**
* **#34 Map View k-anonymity.** Youth flags city-level re-identification with
  n=1 as a live gap, not a hypothetical: `MapView.tsx:28` charts the top 20
  cities *regardless of count*, so a city with one household is a named,
  labelled bar. Church-admin independently records "do not add address-level
  markers" and children's makes city-level granularity a hard ceiling.
  **VETO — the minimum-cluster-size floor is blocking, and no future change may
  introduce per-address pins for a roster containing minors.**

Note the interaction youth identified and I am carrying forward as a design
constraint: Solar System (named minor + age + household) plus Map View (that
household's city, n=1) was a two-screen re-identification path. Cutting Solar
System closes it; the k-anonymity floor closes it independently.

## 4. The concrete work, ordered by value-per-effort

### D1. Delete Global Pulse — blocking, trivial
Fabricated data in front of the budget-signer. Highest value-per-effort in the area.
* Delete `src/components/GlobalPulse.tsx` (77 lines), `src/components/GlobalPulse.css` (33), `src/components/GlobalPulse.test.tsx`.
* Delete the nav button `SidebarIntelligence.tsx:28-34` and the route branch `App.tsx:986-990`.
* Update `src/layouts/IntelligenceLayout.test.tsx:29`, which asserts `onChangeView` fires with `'global-pulse'`.
* Do **not** port the `accuracy - 10` "Health Score" (`GlobalPulse.tsx:17`) anywhere — it is an unexplained constant offset that disagrees with `Dashboard.tsx:79`'s own Health Score. Two health scores, one app, no reconciliation: keep the Dashboard one, delete this one.

### D2. Delete Sentiment Pulse — safeguarding veto, small blast radius
* Delete `src/components/SentimentPulse.tsx`, `SentimentPulse.css`, `SentimentPulse.test.tsx`, `src/utils/sentiment.ts`, `src/utils/sentiment.test.ts`.
* Delete nav button `SidebarIntelligence.tsx:36-42`; route branch `App.tsx:906-910`.
* **Cross-area:** delete the Co-Pilot intent at `src/utils/copilot.ts:304-328` and the `calculateSentimentPulse` import at `:10`, and strike "Spiritual Climate" from the fallback help string at `copilot.ts:333`. Without this, Co-Pilot deep-links to a removed route.
* Move `plans/graveyard/sentiment_pulse_implementation.md` note forward: record that `prayer_topic` is read raw off `attributes.prayer_topic` (`pco.ts:276`) with no `field_data` custom-field traversal, so it is undefined against any real PCO org. This is the pattern to grep for elsewhere in the audit.

### D3. Delete Solar System — unanimous, zero dependents
* Delete `src/components/SolarSystem.tsx` (182 lines), `SolarSystem.css` (164), `SolarSystem.test.tsx`.
* Delete nav button `SidebarIntelligence.tsx:124-130`; route branch `App.tsx:876-881` (including its `style={{height: '800px'}}` container).
* The one real signal buried in it — households failing the `parents.length > 0 && children.length > 0` test (`SolarSystem.tsx:44-46`), i.e. children with no linked adult — is a **data-hygiene defect and belongs in Area A's Family Audit** (`src/components/FamilyModal.tsx`, `src/utils/family.ts`), as a row, not a galaxy. Hand this to the Area A synthesis.

### D4. Merge #30 into #29 as one `attendance` screen with one fetch
Highest-value *build* item; kills a duplicate 10k-record fetch and a nav slot at the same time.
* New shared hook `src/hooks/useCheckIns.ts` wrapping `fetchRecentCheckIns` with a module-level cache keyed on `auth`, so the ~10,000-record pull happens **once per session**, not once per screen per mount. Both `AttendancePulse.tsx:27` and `CheckInVelocity.tsx:22` currently fetch it independently.
* Keep route `attendance`; delete route `velocity` (`App.tsx:856-861`) and nav button `SidebarIntelligence.tsx:100-106`. Render `CheckInVelocity` as a second tab inside `AttendancePulse`.
* **Copy fix, blocking on trust:** delete the word "Real-time" from `CheckInVelocity.tsx:60`; retitle `:58` from `The "Check-in Velocity"` to **"Sunday Arrival Pace"**. Add "last updated <timestamp>" so staleness is visible. Children's critique is correct that this is not a bottleneck tool — `PcoCheckIn` (`pco.ts:108-121`) carries no location/station relationship and `fetchRecentCheckIns` (`pco.ts:509`) requests no `include=locations` — so the copy must claim arrival *pace*, never station or queue.
* **Data fix, the thing that earns the slot:** add a `kind` filter. `aggregateCheckInsByWeek` (`attendance.ts:10`) and `calculateCheckInVelocity` (`velocity.ts:11`) both take `PcoCheckIn[]`; add a `kind?: 'Regular' | 'Volunteer' | 'all'` parameter to both and a segmented control in the UI. Then render **two series** on the weekly chart — attendees and volunteers — which yields the volunteer-to-attendee ratio children's asked for and which PCO's native report does not give.
* **Event filter:** `PcoCheckIn.relationships.event.data.id` is already on the wire. Add an event `<select>` populated from `fetchEvents` (already exists, `pco.ts:~495`). This answers youth's "Friday Night Live only" and children's "9am vs 11am" objections with data already fetched. Without it the line mixes kids church, adult worship, youth and serving teams into one number — the defect all four critics circled.
* Drop the unlabelled `♥` glyph (`AttendancePulse.tsx:70`).

### D5. Map View — blocking safeguarding fix, then rename, then demote
* **Blocking:** in `calculateCityClusters` (`geospatial.ts:8-30`), add a `minClusterSize` parameter (default 5) and filter below it, and return a `suppressed` count so the UI can honestly say "12 cities with fewer than 5 members not shown." Remove the raw `clusters.slice(0, 20)` exposure at `MapView.tsx:28`.
* **Blocking:** count **households, not people.** `geospatial.ts:11` iterates `students`; dedupe on `student.householdId` (falling back to a normalised address key when null) before tallying. As shipped, a family of five inflates its city 5×, and the "Predictive Planting" threshold (`geospatial.ts:39`) sits directly on top of that inflated number.
* Add address-string normalisation before grouping (`geospatial.ts:13-19` currently only title-cases): strip `St./St/Saint`, `Ft./Fort`, `Mt./Mount` variants and trailing punctuation, so "St. Louis"/"Saint Louis"/"St Louis" collapse into one bar instead of three.
* **Rename:** route `map-view` → `city-distribution`; component `MapView.tsx` → `CityDistribution.tsx`; drop the 🗺️ nav icon (`SidebarIntelligence.tsx:152`) and the 🗺️ empty state (`MapView.tsx:36`); rename the "Predictive Planting Suggestions" header (`MapView.tsx:105`) to **"Cities Above Threshold"** — it is a `count >= threshold` filter (`geospatial.ts:39`), and "Predictive" is doing unearned work in front of a multi-year, multi-million-dollar decision.
* Rename `src/utils/geospatial.ts` → `src/utils/cityClusters.ts`; nothing in it is geospatial.

### D6. Demographics — add the ministry-band mode, then demote to a card
* In `src/utils/demographics.ts`, export a second bucket set `MINISTRY_BANDS` (nursery 0-2, preschool 3-4, elementary 5-11 / grades K-5, middle 6-8, high 9-12, adults 19+) and give `calculateDemographics` a `mode: 'generations' | 'ministry'` parameter. Band assignment: `pcoGrade` when present, `age` as fallback.
* In `src/components/GenerationStack.tsx`, add a `mode` prop and a two-option segmented control above the chart. Everything else in the file is fine as-is.
* Then **demote:** delete route `demographics` (`App.tsx:883-888`) and nav button (`SidebarIntelligence.tsx:140-146`); render `<GenerationStack>` as a card on the new Intelligence home (D8). Church-admin's frequency estimate — "once or twice a year" — does not justify a permanent nav slot.

### D7. Heatmap of Life — cut two modes, gate the third
* Delete `calculateDeathHeatmap` (`heatmap.ts:65-67`) and `calculateAnniversaryHeatmap` (`heatmap.ts:61-63`), the `<option value="deaths">` and `<option value="anniversaries">` (`LifeEventsHeatmap.tsx:47-48`), the `eventType` state union (`:10`) and the `switch` (`:13-19`). Retitle from "The Heatmap of Life" to **"Birthday Calendar"**. Also drop `deathDate` from the `Student` type (`pco.ts:98`) and `death_date` from `transformPerson` (`pco.ts:288`) — it is read straight off `attributes.death_date` and no real PCO People response contains it.
* **Placeholder-birthdate gate (children's sharpest finding, and it is correct):** `calculateEventHeatmap` (`heatmap.ts:38-52`) validates only that the date parses. Jan 1 is the standard placeholder a rushed volunteer enters; with ~300 kids it will render as the darkest cell on the grid and outrank every real cluster. Add a detector: any single day/month cell exceeding `~4×` the mean non-zero cell count is rendered in a distinct hatched/grey treatment labelled "likely placeholder — N records" and excluded from `maxCount` (`LifeEventsHeatmap.tsx:21-23`) so it stops flattening the real colour scale. Feed the same detection into Area A's Data Health as a fixable hygiene row.
* **Accessibility:** print the count inside every cell above zero rather than only in `title`/`aria-label` (`LifeEventsHeatmap.tsx:79,88`) — colour is currently the sole encoding of magnitude on the grid, a WCAG 1.4.1 failure. The `role="gridcell"` divs also have no `role="grid"`/`role="row"` ancestors and no `tabIndex`, so the ARIA labels are unreachable; either wrap them properly or drop the roles and expose a text table.
* Then **demote:** delete route `heatmap` (`App.tsx:863-867`) and its nav button (`SidebarIntelligence.tsx:132-138`); render as a card on the Intelligence home. If round 2 concludes PCO Lists already covers birthday batching (church-admin's position), cut it entirely — see Q4.

### D8. Build the Intelligence home (see New Idea #1) — required to land D4/D6/D7's demotions
Not optional scaffolding: three demotions above have nowhere to land without it.

### D9. Global honest-denominator fix (area-wide, hand to Area A)
`transformPerson` (`pco.ts:233-241`) silently discards every PCO person lacking
a parseable birthdate. Every count in this area — and in Areas C and F — is
therefore over an unstated subset. Either count and expose the discards on the
Intelligence home ("Charts describe N of M records; 
M−N have no birthdate — fix in Data Health"), or stop discarding and carry a
`birthdate: null` Student through with per-chart exclusion. This is a
cross-area decision; flagging it here because Area D is where it does the most
damage.

## 5. Unresolved disagreement — questions round 2 must settle

1. **Does the merged Attendance screen earn a nav slot at all?** Church-admin
   says Locus's chart is *strictly less capable* than PCO Check-Ins' native
   Attendance report; I claim the `kind` split (attendee vs volunteer ratio) and
   the arrival-pace tab are things PCO does not offer, and that this closes the
   gap. Round 2 must confirm PCO's native report genuinely lacks a
   Regular-vs-Volunteer breakdown. **If PCO already does that split, D4 collapses
   to CUT and Area D drops to a single surface.**
2. **Is a k-anonymity floor sufficient for Map View, or is any city-labelled
   chart over a roster containing minors out of bounds?** Youth treats the n=1
   exposure as blocking; church-admin treats city-level aggregation as the
   defensible ceiling and wants the feature kept. I have imposed a floor of 5
   households. Round 2 must set the number or reject the approach — is 5 enough
   in a rural congregation where five households in a named town is still
   effectively naming names?
3. **Where does the birthdate-null exclusion get fixed?** Is `transformPerson`
   returning `null` an Area A bug to repair globally, or must each Area D chart
   caption its own denominator? Fixing it globally changes `students` for
   ~25 features across all six areas and needs an owner outside this area.
4. **Does the birthday grid survive its own fix?** Church-admin says PCO Lists
   already filters by birthdate *and* can message the resulting list, which the
   heatmap cannot. If the only unique value is "spot the October cluster," is
   that worth a component and a card at all, or is the placeholder detector the
   entire remaining value — in which case it belongs solely in Data Health and
   `LifeEventsHeatmap.tsx` is deleted outright?
5. **Do event and `kind` filters belong on the screen or on the fetch?**
   `fetchRecentCheckIns` (`pco.ts:507-531`) pulls 10,000 unfiltered records and
   filters client-side. PCO's API supports server-side filtering. Fixing it at
   the fetch is cheaper on rate limits but changes a shared utility used by
   Area C features too.

## 6. New ideas earned this round (3)

### N1. Intelligence Home (`intel-home`) — replaces the Global Pulse and Solar System nav slots
**Unserved job:** UXR and church-admin both instinctively said "demote this to
the Dashboard" and neither noticed there is no Dashboard on the Intelligence
surface — the exec lands on `copilot` (`App.tsx:82`) and faces a 23-item list
where Burnout Risk and a family-astronomy toy are visually identical. There is
no answer to "what should I look at today."

**Build:** `src/components/IntelligenceHome.tsx`, route `intel-home`, made the
default view for the intelligence role at `App.tsx:82`. Composed **entirely of
demoted existing components** — `<GenerationStack mode>` (D6), the birthday
calendar (D7), an attendance summary tile linking into the merged `attendance`
screen (D4), and a plain-text data-coverage line (D9). No new charts, no new
metric, and specifically **no aggregate "health score"** — that is what Global
Pulse was and it is what got it cut. Also section the sidebar
(`SidebarIntelligence.tsx:18`) into *Needs attention* (burnout, attrition,
missing volunteers) vs *Reports*, so urgency is legible from the nav.

**Deletes:** the `global-pulse` and `solar-system` nav slots plus three more
routes collapsed into its cards. Net −4 destinations for +1.

### N2. `useCheckIns` shared cache + `kind` split — replaces the duplicate fetch in AttendancePulse and CheckInVelocity
**Unserved job:** children's asks every Sunday for kids-in-room vs
volunteers-checked-in, "the actual ratio number we need." `PcoCheckIn.attributes.kind`
carries it (`pco.ts:113`), it is in the fixture
(`mock-api/data.js:307,354,375,413`), and **not one line of Area D reads it**
(verified by grep across all 14 Area D files: zero hits).

**Build:** `src/hooks/useCheckIns.ts` — one session-scoped cached fetch, exposing
`{ regular, volunteer, byEvent }`. Both charts in the merged screen consume it.

**Replaces:** two independent 10,000-record uncached fetches
(`AttendancePulse.tsx:27`, `CheckInVelocity.tsx:22`) and the assumption that
"check-ins" is one undifferentiated number. Strictly a subtraction: one fetch
where there were two, one hook where there were two copies of the same
`useEffect`.

### N3. Placeholder-date detector as a Data Health signal — replaces the Deaths and Anniversaries modes of the Heatmap
**Unserved job:** children's found that Jan 1 will be the darkest cell on the
birthday grid in any real 300-child roster, because "1/1" is what a rushed
volunteer types when they don't know the date — and the feature's own test
fixture encodes that pattern (`LifeEventsHeatmap.test.tsx:40`) while still
treating it as valid. Nothing in Locus detects placeholder dates today, despite
data hygiene being the product's entire premise.

**Build:** `detectPlaceholderDates(students)` in `src/utils/hygiene.ts` (Area A,
where hygiene already lives) — flags day/month clusters exceeding a multiple of
the roster mean. Consumed twice: to grey out the cell in the birthday calendar,
and as a fixable row in Data Health / Smart Fix.

**Replaces:** the two heatmap modes being cut (`calculateDeathHeatmap`,
`calculateAnniversaryHeatmap`), turning a chart artifact that actively misleads
into a work item the Core user can actually clear. Converts Area D's most
prominent false signal into Area A's next bounty.
