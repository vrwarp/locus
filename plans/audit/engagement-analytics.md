# Area D — engagement-analytics — final report

Features #29–#36 of `plans/audit/feature-inventory.md`: Attendance Pulse, Check-in
Velocity, Solar System, Heatmap of Life, Demographics / Generation Stack, Map View,
Global Pulse, Sentiment Pulse.

All line references were verified against commit `96daaa0` plus the staged
deletions in the working tree on 2026-07-29. Other areas are executing in the same
files, so **every citation is paired with a symbol name — if a line has moved,
trust the symbol.**

---

## Verdict

Area D is eight navigable screens that between them do one honest job: count how
many people came, and show the age shape of the congregation. Everything else in
the area is either decoration over real data (Solar System's orbital family graph,
the Generation Stack's birth-year axis), a chart of a dimension the API never
sends (Check-in Velocity has no station field and is Sunday-only by construction),
or arithmetic on fields that exist only in the mock server (Heatmap of Life's
deaths and anniversaries, Sentiment Pulse's `prayer_topic`, Global Pulse's national
benchmark). Six of the eight are deleted outright, one is demoted to a single card,
and one — the city distribution chart — survives only as an unlinked report page
with a k-anonymity floor, because it is the one screen in the area computing
something real that Planning Center cannot produce natively, and deleting the
computation would push the same analysis into a hand-rolled spreadsheet built from
a raw address export, which is strictly worse for privacy. **Eight nav rows go to
zero; eight routes go to one.** The lasting value in this area is not a screen at
all: it is three correctness fixes that were about to ship green — a check-in
`kind` predicate that silently drops every guest visit from the newcomer funnel, a
city rollup that counts people while labelling them households, and a person
transform that discards everyone with an unreadable birthdate without telling
anyone the denominator changed.

---

## Per-feature decisions

| # | Feature | Verdict | Rationale | Rounds converged |
|---|---------|---------|-----------|------------------|
| 29 | Attendance Pulse | **DEMOTE** to one card; delete route + nav row | The `kind` split is collinear with the event filter next to it. The ceiling of this screen is a glanceable weekly number, which is a card. | 3 (4/4) |
| 30 | Check-in Velocity | **CUT** | Sunday-only by construction (`velocity.ts:13-16`), 7am–1pm hardcoded, and no station dimension exists on the wire — `PcoCheckIn` has no location relationship, so the bottleneck it claims to show cannot be computed. | 3 (4/4) |
| 31 | Solar System | **CUT** | Decorative orbital family graph over named minors; `SolarSystem.tsx:44-46` silently drops any household lacking both a parent and a child, i.e. exactly the messy households that matter. | 4 (4/4) |
| 32 | Heatmap of Life | **CUT** | Deaths and anniversaries read `attributes.death_date` / `attributes.anniversary`, which are synthesised in `mock-api/data.js` and are not PCO People fields. The birthday residue is a worse PCO Lists. | 3 (4/4) |
| 33 | Demographics / Generation Stack | **FIX** + **SIMPLIFY** + **DEMOTE** to card | The only honest chart in the area, on the wrong axis: birth-year generations put a 6th grader and a 12th grader in one bucket. Ministry bands move with Promotion Sunday. | 2 (4/4) |
| 34 | Map View | **CUT the route** → unlinked report page + CSV, three blocking fixes | Fails the frequency test (site selection happens once every several years); passes the correctness test (real address data). Deleting the computation makes privacy worse, not better. | 2 (4/4) |
| 35 | Global Pulse | **CUT** | A fabricated national benchmark presented to the person who signs the budget, with a health score that disagreed with the Dashboard's. **Already shipped.** | 4 (4/4) |
| 36 | Sentiment Pulse | **CUT** | Infers emotional state from a `prayer_topic` field that is never populated from PCO — a safeguarding veto on inferring sentiment about minors, on top of a data source that does not exist. | 4 (4/4) |

Net: **8 nav rows → 0**, **8 routes → 1** (an unlinked `city-distribution` report),
**18 files deleted**, 5 renamed, 6 more deleted conditionally (see *What we could
not settle*).

---

## Deletion list

Paths are from the repository root. Nav ranges are whole `<button>…</button>` blocks
in `src/components/SidebarIntelligence.tsx`; route ranges are whole
`{currentView === 'x' && ( … )}` blocks in `src/App.tsx`.

### Files deleted (18)

| Feature | Files |
|---|---|
| Attendance Pulse (#29) | `src/components/AttendancePulse.tsx`, `src/components/AttendancePulse.test.tsx` *(no `.css` exists)* |
| Check-in Velocity (#30) | `src/components/CheckInVelocity.tsx`, `src/components/CheckInVelocity.test.tsx`, `src/utils/velocity.ts`, `src/utils/velocity.test.ts` |
| Heatmap of Life (#32) | `src/components/LifeEventsHeatmap.tsx`, `src/components/LifeEventsHeatmap.test.tsx`, `src/utils/heatmap.ts`, `src/utils/heatmap.test.ts` |
| Solar System (#31) | `src/components/SolarSystem.tsx`, `src/components/SolarSystem.css`, `src/components/SolarSystem.test.tsx` |
| Sentiment Pulse (#36) | `src/components/SentimentPulse.tsx`, `src/components/SentimentPulse.css`, `src/components/SentimentPulse.test.tsx`, `src/utils/sentiment.ts`, `src/utils/sentiment.test.ts` |

### Files renamed, not deleted (5)

| From | To |
|---|---|
| `src/components/MapView.tsx` | `src/components/CityDistribution.tsx` |
| `src/components/MapView.css` | `src/components/CityDistribution.css` |
| `src/components/MapView.test.tsx` | `src/components/CityDistribution.test.tsx` |
| `src/utils/geospatial.ts` | `src/utils/cityClusters.ts` |
| `src/utils/geospatial.test.ts` | `src/utils/cityClusters.test.ts` |

### Nav rows deleted — `src/components/SidebarIntelligence.tsx`

| View key | Label | Block |
|---|---|---|
| `sentiment-pulse` | Sentiment Pulse | `29-35` |
| `attendance` | Attendance | `85-91` |
| `velocity` | Check-in Velocity | `93-99` |
| `solar-system` | Solar System | `110-116` |
| `heatmap` | Heatmap of Life | `118-124` |
| `demographics` | Demographics | `126-132` |
| `map-view` | Map View | `134-140` |
| `global-pulse` | Global Pulse | already removed |

The `city-distribution` page's only entry point is **one plain text link** at the
foot of the Intelligence sidebar — not a `nav-item` with an icon, never in the scan
path.

### Routes deleted — `src/App.tsx`

| View key | Route block | Import line |
|---|---|---|
| `attendance` | `843-848` | `14` |
| `velocity` | `850-855` | `16` |
| `heatmap` | `857-861` | `17` |
| `solar-system` | `863-868` | `18` |
| `demographics` | `870-875` | `22` |
| `map-view` | `877-881` — **rewritten** as `currentView === 'city-distribution'` | `23` → becomes the `CityDistribution` import |
| `sentiment-pulse` | `893-897` | `30` |
| `global-pulse` | already removed | — |

`currentView` is untyped (`useState('dashboard')`, `App.tsx:80`). Removing a route
removes the only reference to its string literal; **the compiler will not catch a
missed one.** Grep for the seven literals after the edit.

### Test edits

| File | Edit |
|---|---|
| `src/components/SidebarIntelligence.test.tsx` | Delete assertions at `39` (Sentiment Pulse), `50` (Attendance), `51` (Check-in Velocity), `53` (Solar System), `54` (Heatmap of Life), `55` (Demographics), `56` (Map View). *(`52` Volunteer Web and `62` Emergency Alerts are stale from another area's in-flight work — not Area D's.)* |
| `src/App.test.tsx` | Delete the `CheckInVelocity` mock (`179-180`) and the "opens and displays Check-in Velocity" case (`714-731`). |
| `src/utils/copilot.test.ts` | Delete `100-113` ("identifies sentiment intent") and `115-125` ("handles sentiment intent empty state"). |
| `src/utils/demographics.test.ts` | Rewrite `2` and `31` — asserts `result.length === GENERATIONS.length` against the deleted axis. |

### Sequencing constraint

`src/components/RobertReport.tsx` is dead code (nothing renders it) that still
**compiles**, and it imports `AttendancePulse` (`:9`), `CheckInVelocity` (`:12`) and
`LifeEventsHeatmap` (`:13`). Its deletion is owned by Area E (content-giving-comms,
#42a) and is already staged in the working tree. **Area D's deletions must land
after it**, or the typecheck breaks mid-way.

---

## Fix list

### F1 — the `Guest` check-in predicate (cross-area, highest severity)

`src/utils/retention.ts:16`, inside `calculateNewcomerFunnel`:

```
if (checkIn.attributes.kind !== 'Regular') return;
```

`kind` takes three values — `Regular`, `Guest`, `Volunteer`. This drops every guest
check-in from the newcomer funnel, which is the population the funnel exists to
measure. **Change to `!== 'Volunteer'`.** The test fixture contains 6 `Regular`,
3 `Volunteer` and **0 `Guest`** literals, so the defect cannot fail a test: it
would have shipped green and under-reported first-time visitors from week one. The
canonical real case it misses is a new family's child checked in as a guest at the
classroom door before a registration record exists.

The same mistake recurs outside Area D, in files that consume the same field:

| File | Line | Effect |
|---|---|---|
| `src/utils/drift.ts` | `31` | Dropped guest visits deflate both the baseline and the recent window, which can only bias `dropPercentage` **upward** — the attrition engine manufactures false positives. |
| `src/utils/sermons.ts` | `42` | Moot if Area E's cut of the sermon screens lands (it deletes the file). |

**The fix that prevents recurrence, and it should land first:** tighten
`kind: string` on `PcoCheckIn` (`src/utils/pco.ts:139`) to
`'Regular' | 'Guest' | 'Volunteer'`, so the next such filter fails at compile time.

### F2 — Weekly Check-ins card (#29)

- `src/utils/attendance.ts` — `aggregateCheckInsByWeek` currently filters on `kind`
  **not at all** (`:13-20` counts every row, volunteers included). Add inside the
  `forEach`, at `:13-14`: `if (checkIn.attributes.kind === 'Volunteer') return;`
  Both the total and the first-time series must share one predicate.
- Card content: weekly total + first-time series, titled **"Weekly Check-ins"**,
  captioned *"Regular and guest check-ins only — volunteer team check-ins and small
  groups excluded. Includes children's check-ins."* with an "open in PCO Check-Ins"
  link. No `♥` glyph, no "Pulse".

### F3 — Demographics on ministry bands (#33)

- `src/utils/demographics.ts` — add an exported `MINISTRY_BANDS` (nursery 0-2,
  preschool 3-4, elementary K-5, middle 6-8, high 9-12, adults 19+), banding on
  `calculatedGrade` with `age` as the fallback for pre-K.
- `src/components/GenerationStack.tsx` — render bands. **No mode prop, no toggle**
  (none exists today; do not add one). Drop the `GENERATIONS` import at `:4` — it is
  already unused.
- Keep a disagreement caption:
  `students.filter(s => s.pcoGrade !== null && s.delta !== 0).length` →
  *"N students' recorded grade disagrees with expected grade → fix in Data Health."*
  `delta` is already on the record (`src/utils/pco.ts:269`).
- Delete the `GENERATIONS` export from `src/utils/demographics.ts` **after** Area E's
  deletion of `src/utils/sermons.ts` lands, gated on `grep -rn GENERATIONS src/`
  returning only `demographics.ts`.

### F4 — City distribution (#34) — three blocking fixes, all-or-nothing

If any one of the three ships without the other two, **delete the page and the
export instead**: an artifact that looks anonymised without being anonymised is
worse than no artifact, because staff will forward it.

1. **k-anonymity floor.** In `calculateCityClusters` (`src/utils/geospatial.ts:8-30`)
   apply an internal `minClusterSize = max(10, ceil(0.05 * totalHouseholds))`,
   computed inside the function — **never a prop, never rendered as a number** — and
   return a `suppressed` count alongside the clusters. Remove
   `clusters.slice(0, 20)` (`src/components/MapView.tsx:28`).
2. **Household dedupe.** `src/utils/geospatial.ts:22` increments **once per person**,
   so a family of five inflates its city fivefold while the label says households.
   Dedupe on `Student.householdId` (`src/utils/pco.ts:85`) before tallying.
3. **Null households excluded.** Drop records where `householdId === null`
   (`src/utils/pco.ts:298`) and **display the excluded count**. They cannot be
   represented at household level, and they are the same unlinked-child population
   that Solar System was silently dropping.

Also:
- Normalise addresses before grouping — `src/utils/geospatial.ts:14-19` only
  title-cases; collapse `St./Saint`, `Ft./Fort`, `Mt./Mount`.
- **Delete** `suggestCampusLocations` (`src/utils/geospatial.ts:32-41`) — it filters
  an already-sorted table on `count >= threshold` and excludes `clusters[0]` by
  construction, i.e. it renders a second copy of the rows above it minus the biggest
  one. With it: the threshold state and slider (`src/components/MapView.tsx:21,51-62`),
  the suggestions card (`MapView.tsx:104-126` — **the whole block**; stopping at
  `:113` leaves the `<ul>` body and unbalances the JSX), the 🗺️ icon (`:36`), the
  import (`:3`), and the recharts `BarChart` (`:65-102`).
- **Replace the chart with a plain table** (city, household count) plus two stated
  lines: *"N cities suppressed (fewer than K households)"* and *"N records excluded
  (no household on file)."*
- CSV via the existing `downloadCSV` (`src/utils/export.ts:1`) — **the same
  post-suppression rows the table shows**. No address, no name, no per-person row.

### F5 — Co-Pilot references to the deleted Sentiment Pulse (cross-area, mandatory)

`src/utils/copilot.ts` — delete the sentiment intent block `303-329`, the
`calculateSentimentPulse` import `:10`, and `'Spiritual Climate'` from the fallback
message `:334`. `copilot.ts:326` deep-links `view: "sentiment-pulse"`; leave it and
Co-Pilot navigates the pastor to a blank screen.

### F6 — Fabricated `Student` fields removed with Heatmap of Life

`src/utils/pco.ts` — drop `anniversary` / `deathDate` from `Student` (`:97-98`), from
the `transformPerson` destructure (`:255`) and from its return (`:310-311`); drop
`anniversary` / `death_date` from `PcoPersonAttributes` (`:21-22`). These are read
straight off `attributes` with no `field_data` traversal and have no PCO People
source — they exist only in `mock-api/data.js`.

### F7 — The undisclosed denominator (hand-off, Area A)

`transformPerson` returns `null` for every person with a missing or unparseable
birthdate (`src/utils/pco.ts:257-265`) before `App.tsx` builds `students`. Every
count in Areas C, D and F is therefore over an unstated subset. Either expose the
discard count on screen, or carry `birthdate: null` through with per-chart
exclusion. Area A already owns this file's repair path.

### Hand-offs, with owners assigned

| Item | Owner | Where it lands |
|---|---|---|
| `useCheckIns` shared cache with TTL | **Area C — pastoral-ops** | New `src/hooks/useCheckIns.ts`. Module-level promise cache keyed on `auth` + `maxPages`; a cached deeper result satisfies a shallower request. **Blocking conditions: ~5-minute TTL, an "as of HH:MM" line on every consuming surface, and a manual refresh.** Do not add `kind`/event params — nothing is left to push server-side. |
| Placeholder-birthdate detector | **Area A — core-hygiene** | A detection rule in `src/utils/grader.ts`, surfaced as a row on Data Health (`src/components/GradeScatter.tsx`) feeding the existing two-candidate repair card. **Not a new screen.** If Area A declines it, it should not be built at all. |
| The Intelligence landing view | **Area C — pastoral-ops** | `src/App.tsx:77` (`setCurrentView(role === 'core' ? 'dashboard' : 'copilot')`) is Area C's line. If Area C makes a home screen the landing, Area C owns the component and Area D supplies two cards. **If it keeps `copilot` as the landing, the home screen is not built** — see below. |
| Guest-predicate fixes in `drift.ts` and `sermons.ts` | **Area C / Area E** | `src/utils/drift.ts:31`, `src/utils/sermons.ts:42`, per F1. |
| Children with no linked adult | **Area A — core-hygiene** | The population `SolarSystem.tsx:44-46` dropped and F4 excludes; belongs in Family Audit. |

**Why `useCheckIns` matters more than it reads.** Twelve components currently call
`fetchRecentCheckIns` (`src/utils/pco.ts:531`), seven of them at the default
`maxPages = 100` — roughly 10,000 records each — against a shared PCO rate ceiling.
The failure mode is not a slow dashboard; it is a 429 on a Sunday morning while
check-in stations are tagging children. After Area D's and Area E's deletions,
**eight callers remain, seven of them Area C screens**: `BurnoutReport.tsx:26`,
`CoPilot.tsx:43`, `NewcomerFunnel.tsx:18`, `RecruitmentReport.tsx:27`,
`MissingVolunteersReport.tsx:26`, `DriftReport.tsx:27`, `BusFactorGraph.tsx:25`,
plus `Dashboard.tsx:33` (Area A).

---

## What must survive — each has a named consumer outside Area D

| Kept | Consumer |
|---|---|
| `src/utils/retention.ts` (+ test) | Area C's Newcomer Funnel (#24). Gets the F1 fix at `:16`. |
| `src/utils/demographics.ts` → `GENERATIONS` export | `src/utils/sermons.ts:3,54` bands worship attendees by it. Delete the export only after Area E deletes `sermons.ts`. Removing it early breaks Area E's screen. |
| `src/utils/attendance.ts` (+ test) | The Weekly Check-ins card. `WeeklyAttendance.date` (`:26`) is the same `weekKey` as `:17` and is a working join key for any future week-level annotation — no type change needed. |
| `src/utils/geospatial.ts` → `cityClusters.ts` | The surviving city-distribution report. |
| `src/utils/export.ts` (`downloadCSV`, `:1`) | Already exists; the CSV export is a call, not new code. |
| `Student.householdId` (`src/utils/pco.ts:85,298`) | The dedupe key in F4. This is **real PCO data**, hydrated from the `households` include (`pco.ts:217,245-246,468`) — not the fabricated-`attributes` pattern that F6 removes. |
| `PcoEvent` / `fetchEvents` in `src/utils/pco.ts` | Consumed by live screens outside this area; nothing in Area D touches them. |

---

## Already shipped

- **Global Pulse (#35) is fully deleted** — component, CSS, test, route and nav row
  — committed in `63fe9f4` alongside Giving River, Giving Trends and their utils
  (`src/utils/giving.ts`, `src/utils/givingTrends.ts`). 88 files, 545 tests, suite
  green. `src/components/SidebarIntelligence.test.tsx` no longer asserts any of the
  removed buttons.
- Nothing else in Area D has shipped. Every other item in this report is
  outstanding.
- Two deletions that touch Area D's sequencing are **staged in the working tree** by
  other areas: `RobertReport.{tsx,css,test.tsx}` (Area E) and `VolunteerWeb.*`
  (Area C), along with `GenealogyGraph.*` and `EmergencyAlerts.*`.

---

## What we could not settle

**1. Whether the two demoted cards have anywhere to live.** Attendance Pulse and
Demographics were demoted to cards on the assumption that an Intelligence home
screen exists to hold them. That screen's value depends entirely on being the
landing view, which means changing `src/App.tsx:77` — a line this area does not
own. The assignment is made (Area C), but the answer is not:

- If Area C makes a home screen the landing, Area D contributes two cards and zero
  nav rows.
- **If Area C keeps Co-Pilot as the landing, the home screen should not be built** —
  a home nobody lands on is a nav row that fails the same frequency test that killed
  six screens here. In that branch the two cards are not built either, and
  `src/components/GenerationStack.{tsx,test.tsx}`, `src/utils/demographics.{ts,test.ts}`
  and `src/utils/attendance.{ts,test.ts}` lose their last consumers and should be
  deleted too — **18 files deleted becomes 24.** F1, F4, F5, F6 and F7 are unaffected;
  they are the fixes, not the screens.

**2. Whether the city-distribution report will ever be opened.** The honest estimate
is once every several years, by whoever is doing site-selection work. It survives on
a cost argument (a text link, no route in the scan path, no interactive control, a
util being fixed anyway) rather than a demand argument, and nobody has watched a real
user look for it. If the three blocking fixes in F4 turn out to be more than a day's
work, the correct response is to delete it, not to ship two of the three.

**3. The raw-`attributes` read is a pattern nobody has audited.** `prayer_topic`,
`death_date`, `anniversary`, `first_time_giver` and `first_gift_date` are read
straight off `attributes` (`src/utils/pco.ts:255, 300, 308-311`) with no `field_data`
traversal. All five are synthesised in `mock-api/data.js`; none is a PCO People core
attribute. F6 removes two of the five as a side effect. `AutomationsReport.tsx`
already surfaces one of the remaining three to users. **Nobody has grepped the other
five areas for the same pattern.** The discrimination matters: `household_id` looks
identical and is genuinely real, hydrated from the `households` include
(`pco.ts:217,245-246,468`) — so this is a per-field audit, not a blanket suspicion.

**4. Check-in Velocity's revisit condition.** The screen is cut, but the operational
question it gestured at — where the Sunday bottleneck is — is real and unanswerable
today. It becomes answerable only if `fetchRecentCheckIns` (`src/utils/pco.ts:531`)
requests `include=locations` and `PcoCheckIn` gains a station relationship. Until
that is on the wire, no chart design makes it actionable.

**5. If the placeholder-birthdate detector is declined**, the ministry-band card in
F3 ships on an axis nobody validates. `transformPerson` rejects a *missing* or
*unparseable* birthdate but accepts a guessed `1/1` placeholder, which parses
cleanly and produces a confident wrong `calculatedGrade`. A confidently wrong grade
is worse than a missing one: a missing grade gets fixed, a wrong one gets trusted.
