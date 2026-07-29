# Area D — engagement-analytics — Proposal v4 (Round 4 synthesis)

Synthesised from `r4-all.md` (UXR, church-admin, youth, children's — all four returned
**CONVERGED, NO RESIDUAL OBJECTIONS**), attacking `proposal-v3.md`.

**Headline: the area is closed.** Both questions round 4 was given are settled 4/4,
no critic holds a residual objection, and no verdict has moved in two rounds. v4 is
therefore not an argument — it is the **execution manifest**: every file to delete,
every route and nav row to remove, every fix to make, every symbol that must
*survive* because someone else consumes it. Round 5 is a sign-off, and §5 lists the
only three things left that Area D cannot close by itself.

> **Citation basis.** All `file:line` references were re-verified against the working
> tree at commit `9b6d613` + uncommitted changes on 2026-07-29. **The tree is moving
> under this document** — another area has in-flight staged deletions (§1.3) — so
> every citation below is paired with the symbol name. If a line has drifted, trust
> the symbol.

---

## 1. Changes since last round

### 1.1 Both round-4 questions: settled, 4/4

**Q-A — does `city-distribution` survive as a link-only page + CSV export?** Yes.
Unanimous, and the strongest version of the argument came from the critic best
placed to kill it. Admin, who in r3 came closest to arguing it out of existence
("at most, someone screenshots this chart once into a deck"), took his own argument
one step further in r4 and stopped short deliberately: his objection was to
**standing presence**, not existence, and the artifact that survives D9 is not the
governance object he was worried about. A per-family location roster never ships;
what ships is post-floor, post-dedupe, post-null-exclusion city+count rows. His
closing point is the one that decides it and I adopt it verbatim as the rationale
of record: **deleting the computation makes privacy worse, not better** — the
once-in-five-years director then hand-rolls the same analysis in a spreadsheet from
a raw PCO people export, with no suppression and no household dedupe. Children's
condition is unchanged and unchallenged: the CSV is *the same rows the table shows*,
so it is a Census-tract-style disclosure, not a roster export. UXR restates the
distinction that governs: a link-reached page is a different UI object from a
sidebar row. Youth defers.

**Verdict, converged: link-only page + CSV export, zero nav rows, three blocking
fixes mandatory and all-or-nothing.** No route. Not reopenable.

**Q-B — the `Guest` predicate.** Confirmed by all four, independently, including a
fixture re-count by youth (6 `Regular`, 3 `Volunteer`, **0 `Guest`**). Admin sharpened
the severity in the direction that matters: this would have shipped, **tested green**,
and under-reported first-time visitors from week one — invisible until a board member
asks why the number never matches the welcome team's tally. Children's supplied the
canonical real-world case the fixture cannot produce: a new family's child checked in
as a guest at the classroom door before registration exists. `kind !== 'Volunteer'` is
correct for both `retention.ts` and `attendance.ts`.

### 1.2 My citation was wrong. Corrected here, and it was not the only one.

UXR caught it: the filter is at **`retention.ts:16`**, not `:23-24`. Line 23 is inside
the downstream sort. v3's citation would have sent a builder to the wrong five lines.
Corrected everywhere in this document.

Rather than fix one line and carry the rest forward on trust, I re-verified **every**
`file:line` in v3. Five more had drifted or were wrong:

| v3 said | actually | symbol |
|---|---|---|
| `retention.ts:23-24` | **`retention.ts:16`** | the `kind !== 'Regular'` filter |
| `pco.ts:115` | **`pco.ts:139`** | `kind: string` on `PcoCheckIn` |
| `pco.ts:233-241` | **`pco.ts:257-265`** | the birthdate discard in `transformPerson` (D11) |
| `pco.ts:274` | **`pco.ts:298`** | `householdId: household_id \|\| null` |
| `pco.ts:444` / `:193,219-222` | **`pco.ts:468`** / **`:217,245-246`** | `PEOPLE_INCLUDES`, household hydration |
| `MapView.tsx:104-113` | **`MapView.tsx:104-126`** | the whole suggestions card, not just its header |

The last one is a live trap: deleting `104-113` leaves the `<ul>` body and unbalances
the JSX. Everything else in v3 §4 verified clean.

### 1.3 Verification found three things no critic raised. All three are execution blockers.

**(a) Global Pulse is already gone.** `GlobalPulse.tsx`, `.css`, `.test.tsx` are staged
deletions in the working tree, alongside `GivingRiver.*`, `GivingTrends.*`, `giving.ts`
and `givingTrends.ts` — another area's in-flight work. The nav row and route are gone
from `SidebarIntelligence.tsx` and `App.tsx`. **D2 is done.** But it was landed
incompletely: **`SidebarIntelligence.test.tsx:39` still asserts
`getByRole('button', { name: /Global Pulse/i })`** against a button that no longer
exists. That test is red right now. Area D owns the assertion because Area D owns the
verdict. This is the one piece of D2 left.

**(b) `RobertReport.tsx` blocks three of Area D's deletions.** It is dead code —
`App.tsx:11` is a commented-out import reading *"Deprecated in favor of direct views"*
and nothing renders it — but it is dead code that still **compiles**, and it imports
`AttendancePulse` (`:9`), `CheckInVelocity` (`:12`), `LifeEventsHeatmap` (`:13`) and
`calculateDemographics` (`:6`). Delete D5, D6 or D7's components without deleting
`RobertReport` and the typecheck breaks. It is also the *only* remaining consumer of
those three besides `App.tsx`. No prior proposal saw it because no prior proposal
grepped for consumers outside the routing table. **It joins the deletion manifest**,
with its two orphaned test mocks (`App.ghost.integration.test.tsx:60-62`,
`App.undo.integration.test.tsx:64`). This is a free win: one more component, one CSS
file and a 224-line test file deleted, for zero product loss.

**(c) `GENERATIONS` must survive D8.** `sermons.ts:3` imports `GENERATIONS` from
`demographics.ts` and `sermons.ts:54` bands worship attendees by it for the Sermon
Correlator's demographic filter. v3's D8 said "**replace** generation banding with
`MINISTRY_BANDS`" — executed literally, that breaks Area C's screen. D8 is now
*additive to the util and subtractive only in the component*: add `MINISTRY_BANDS`,
delete the generations code path from `GenerationStack.tsx`, **keep the `GENERATIONS`
export** until Area C rules on Sermon Correlator (§5, Q8).

### 1.4 Admin's recurrence list, corrected by the same verification

Admin flagged `kind === 'Regular'` recurring at `drift.ts:31`, `givingTrends.ts:26`
and `sermons.ts:42`. **`givingTrends.ts` no longer exists** — deleted in the same
in-flight batch as (a). So the live recurrence set outside Area D is **two**:
`drift.ts:31` and `sermons.ts:42`, both verified present. Routed to Area C, which is
folding them in. Youth's analysis of the `drift.ts` case is worth carrying into the
hand-off because it names the direction of the error: dropped `Guest` visits deflate
both the baseline and the recent window, which can only bias `dropPercentage`
**upward** — the engine manufactures false positives, i.e. leaders chase students who
are fine. That is the failure mode, not a rounding error.

---

## 2. Per-feature decisions — final

| # | Feature | Verdict | Rationale | Converged? |
|---|---------|---------|-----------|---|
| 29 | Attendance Pulse | **DEMOTE** to one card on Intelligence Home; delete route | `kind` split collinear with the event filter beside it; ceiling is a glanceable weekly number. | **Y (4/4, 3 rounds)** |
| 30 | Check-in Velocity | **CUT** | Sunday-only by construction (`velocity.ts:13-16`), 7am–1pm hardcoded, no station dimension on the wire. | **Y (4/4, 3 rounds)** |
| 31 | Solar System | **CUT** | Decorative family-tree over named minors; drops single-parent households (`SolarSystem.tsx:44-46`). | **Y (4/4, 4 rounds)** |
| 32 | Heatmap of Life | **CUT** | Deaths + anniversaries read fabricated fields; birthdays are a worse PCO Lists. | **Y (4/4, 3 rounds)** |
| 33 | Demographics / Generation Stack | **FIX** + **SIMPLIFY** + **DEMOTE** to card | Only honest chart in the area; survives at zero controls as the first-out card. | **Y (4/4, 2 rounds)** |
| 34 | Map View | **CUT the route** → link-only page + CSV, 3 blocking fixes | Fails the frequency test; passes the correctness test. Cost of deletion is *worse* privacy. | **Y (4/4, 2 rounds)** |
| 35 | Global Pulse | **CUT** | Fabricated benchmark in front of the budget-signer. **Already executed** (§1.3a). | **Y (4/4, 4 rounds)** |
| 36 | Sentiment Pulse | **CUT** | Safeguarding veto + `prayer_topic` never populated. | **Y (4/4, 4 rounds)** |

**Net: 8 analytics nav rows → 0.** One new row (`intel-home`), one link-only page
(`city-distribution`). **Eight components, five CSS files, four utils and eight test
files deleted** — see §3 for the exact manifest, which is larger than v3's count
because of `RobertReport`.

---

## 3. The deletion manifest — exhaustive

Every path is absolute-from-repo-root. Nav line ranges are whole `<button>…</button>`
blocks in `src/components/SidebarIntelligence.tsx`; route ranges are whole
`{currentView === 'x' && ( … )}` blocks in `src/App.tsx`.

### 3.1 Files deleted (24)

| Component / util | Files |
|---|---|
| Attendance Pulse | `src/components/AttendancePulse.tsx`, `AttendancePulse.test.tsx` (no `.css`) |
| Check-in Velocity | `src/components/CheckInVelocity.tsx`, `CheckInVelocity.test.tsx` (no `.css`), `src/utils/velocity.ts`, `velocity.test.ts` |
| Heatmap of Life | `src/components/LifeEventsHeatmap.tsx`, `LifeEventsHeatmap.test.tsx` (no `.css`), `src/utils/heatmap.ts`, `heatmap.test.ts` |
| Solar System | `src/components/SolarSystem.tsx`, `SolarSystem.css`, `SolarSystem.test.tsx` |
| Sentiment Pulse | `src/components/SentimentPulse.tsx`, `SentimentPulse.css`, `SentimentPulse.test.tsx`, `src/utils/sentiment.ts`, `sentiment.test.ts` |
| Global Pulse | `src/components/GlobalPulse.tsx`, `GlobalPulse.css`, `GlobalPulse.test.tsx` — **already staged as deleted**; verify only |
| Robert Report (dead code, §1.3b) | `src/components/RobertReport.tsx`, `RobertReport.css`, `RobertReport.test.tsx` |

**Renamed, not deleted:** `src/components/MapView.tsx` → `CityDistribution.tsx`
(+ `MapView.css` → `CityDistribution.css`, `MapView.test.tsx` → `CityDistribution.test.tsx`);
`src/utils/geospatial.ts` → `cityClusters.ts` (+ its test).

**Survives, do not delete** (each has a named consumer):

| Kept | Because |
|---|---|
| `src/utils/attendance.ts` (+ test) | D7's Weekly Check-ins card. Gets the `kind !== 'Volunteer'` fix. |
| `src/utils/demographics.ts` (+ test) | D8's card. **`GENERATIONS` export stays** — `sermons.ts:3,54` (§1.3c). |
| `src/utils/geospatial.ts` → `cityClusters.ts` | D9's export. Gets all three blocking fixes. |
| `src/utils/export.ts` (`downloadCSV`, `:1`) | Already exists — D9's CSV is a call, not new code. |
| `src/utils/retention.ts` | Area C's Newcomer Funnel; D7's first-time series reuses it. Gets the `:16` fix. |
| `Student.householdId` (`pco.ts:85,298`) | D9's dedupe key. Real PCO data, hydrated from the `households` include (`pco.ts:217,245-246,468`) — **not** the fabricated-`attributes` pattern. |

### 3.2 Nav rows removed (8 → 0) — `src/components/SidebarIntelligence.tsx`

| View key | Label | Block |
|---|---|---|
| `sentiment-pulse` | Sentiment Pulse | `:29-35` |
| `attendance` | Attendance | `:85-91` |
| `velocity` | Check-in Velocity | `:93-99` |
| `solar-system` | Solar System | `:117-123` |
| `heatmap` | Heatmap of Life | `:125-131` |
| `demographics` | Demographics | `:133-139` |
| `map-view` | Map View | `:141-147` |
| `global-pulse` | Global Pulse | **already removed** |

Plus `SidebarIntelligence.test.tsx`: delete assertions at `:39` (Global Pulse — **red
today**), `:40, :51, :52, :54, :55, :56, :57`. Section the surviving nav at
`SidebarIntelligence.tsx:18` into *Needs attention* / *Reports*, with the
`city-distribution` link under *Reports* (D10).

### 3.3 Routes removed — `src/App.tsx`

| View key | Route block | Import |
|---|---|---|
| `attendance` | `:846-851` | `:15` |
| `velocity` | `:853-858` | `:17` |
| `heatmap` | `:860-864` | `:18` |
| `solar-system` | `:873-878` | `:20` |
| `demographics` | `:880-885` | `:24` |
| `map-view` | `:887-891` | `:25` → becomes the `CityDistribution` import |
| `sentiment-pulse` | `:903-907` | `:32` |
| `global-pulse` | **already removed** | — |
| — | — | `:11` — delete the commented-out `RobertReport` import |

**No view-type union to update:** `currentView` is untyped
(`useState('dashboard')`, `App.tsx:83`). Removing a route removes the only reference
to its string — nothing else needs touching, and nothing will fail to compile if one
is missed. **Grep for the eight literals after the edit; the compiler will not help
you here.**

### 3.4 Tests to update, not delete

- `src/App.test.tsx:179-180` (the `CheckInVelocity` mock) and `:714-731` (the "opens and displays Check-in Velocity" case) — delete both.
- `src/App.ghost.integration.test.tsx:60-62` and `src/App.undo.integration.test.tsx:64` — `RobertReport` mocks, now mocking nothing.
- `src/layouts/IntelligenceLayout.test.tsx:29` — asserts navigation to `global-pulse`; already touched by the in-flight change, verify it is consistent.
- `src/utils/demographics.test.ts:2,31` — asserts `result.length === GENERATIONS.length`; rewrite against `MINISTRY_BANDS`.
- `src/utils/copilot.test.ts:100-124` — the two sentiment-intent cases die with D3.

---

## 4. The concrete work, ordered by value-per-effort

### D1. `useCheckIns` shared cache with TTL — highest value, **owner still TBD (Q4)**
- New `src/hooks/useCheckIns.ts`: module-level promise cache keyed on `auth` + `maxPages`; a cached deeper result satisfies a shallower request.
- **Blocking: ~5 min TTL + an "as of HH:MM" line + manual refresh** on every consuming surface. A cache with no expiry swaps a rate-limit bug for silent staleness on the Sunday-morning screens that most need to be current (admin, r3, unretracted).
- **13 call sites, re-verified this round.** 7 at the `maxPages = 100` default ≈10k records: `BurnoutReport.tsx:26`, `Dashboard.tsx:33`, `CoPilot.tsx:43`, `NewcomerFunnel.tsx:18`, `RecruitmentReport.tsx:27`, `AttendancePulse.tsx:27`, `CheckInVelocity.tsx:22` (explicit `100`). 6 at `20` ≈2k: `MissingVolunteersReport.tsx:26`, `DriftReport.tsx:27`, `BusFactorGraph.tsx:25`, `VolunteerWeb.tsx:43`, `SermonCorrelator.tsx:29`, `SermonSentiment.tsx:29`. `fetchRecentCheckIns` is `pco.ts:531`.
- After D5 and D7, **11 sites remain plus 1 new** (the Weekly Check-ins card, built against the hook from day one). Area D goes 2 → 1, not 2 → 0.
- Do not add `kind`/event params to the fetch — nothing is left to push server-side.

### D2. Global Pulse — **executed; finish it**
- Verify the staged deletion of `GlobalPulse.tsx/.css/.test.tsx`, nav row and route.
- **Delete `SidebarIntelligence.test.tsx:39`** — it asserts a button that no longer exists and is red now (§1.3a).
- Do not resurrect the `accuracy - 10` Health Score; it disagreed with `Dashboard.tsx`.

### D3. Delete Sentiment Pulse — safeguarding veto, CONVERGED 4 rounds
- Files per §3.1; nav `:29-35`; route `App.tsx:903-907`; import `App.tsx:32`.
- **Cross-area, mandatory:** `copilot.ts` — delete the sentiment intent block **`:303-329`**, the import **`:10`** (`calculateSentimentPulse`), and `'Spiritual Climate'` from the fallback string **`:336`**. `copilot.ts:326` deep-links `view: "sentiment-pulse"`; leave it and Co-Pilot navigates to a blank screen.
- Delete `copilot.test.ts:100-124`.

### D4. Delete Solar System — CONVERGED 4 rounds
- Files per §3.1; nav `:117-123`; route `App.tsx:873-878`; import `App.tsx:20`.
- Hand "children with no linked adult" (`SolarSystem.tsx:44-46` drops any household lacking a parent *or* a child) to Area A's Family Audit. **Same population D9 must exclude** as null-`householdId`.

### D5. Delete Check-in Velocity — CONVERGED
- Files per §3.1; nav `:93-99`; route `App.tsx:853-858`; import `App.tsx:17`.
- Delete `App.test.tsx:179-180` and `:714-731`.
- Revisit condition on record (children's): `include=locations` on `fetchRecentCheckIns` (`pco.ts:531`) giving `PcoCheckIn` a station relationship. Until that is on the wire, no chart design makes this actionable.

### D6. Delete Heatmap of Life — CONVERGED
- Files per §3.1; nav `:125-131`; route `App.tsx:860-864`; import `App.tsx:18`.
- Drop `anniversary` / `deathDate` from `Student` (`pco.ts:97-98`), from the destructure (`pco.ts:255`) and from the return (`pco.ts:310-311`); drop `anniversary` / `death_date` from `PcoPersonAttributes` (`pco.ts:21-22`). Fabricated — no PCO People source.
- Surviving value moves to Area A as N3.

### D7. Demote Attendance Pulse to one card — with the corrected predicate
- Delete `AttendancePulse.tsx` + test; nav `:85-91`; route `App.tsx:846-851`; import `App.tsx:15`.
- **Keep `src/utils/attendance.ts`.** Add the filter to `aggregateCheckInsByWeek`: at **`attendance.ts:13-14`**, inside the `forEach`, `if (checkIn.attributes.kind === 'Volunteer') return;`. It currently filters on `kind` **not at all** (verified: `:10-20` counts every row), so today's total already includes `Guest` — only the first-time series was narrower than its own denominator. Both series must share one predicate.
- Card: weekly total + first-time series (N2), titled **"Weekly Check-ins,"** captioned *"Regular and guest check-ins only — volunteer team check-ins and small groups excluded,"* with an "open in PCO Check-Ins" link. Drop the `♥` glyph and the word "Pulse."

### D8. Demographics — fix the axis, delete the toggle, demote
- `src/utils/demographics.ts`: **add** exported `MINISTRY_BANDS` (nursery 0-2, preschool 3-4, elementary K-5, middle 6-8, high 9-12, adults 19+), banding on `calculatedGrade` with `age` for pre-K. **Keep the `GENERATIONS` export** — `sermons.ts:3,54` consumes it (§1.3c, Q8).
- `GenerationStack.tsx`: **no `mode` prop, no toggle.** Delete the generations code path from the component (not from the util) and drop the `GENERATIONS` import at `:4`.
- Keep the disagreement caption: `students.filter(s => s.pcoGrade !== null && s.delta !== 0).length` → *"N students' recorded grade disagrees with expected grade → fix in Data Health."* `delta` is already on the record (`pco.ts:269`).
- Rewrite `demographics.test.ts:31`.
- Delete nav `:133-139`, route `App.tsx:880-885`; render as home card 3, first-out under one-in-one-out.

### D9. City distribution — three blocking fixes, then export, no route
**All-or-nothing.** Children's condition, restated unchanged in r4: if any one of the
three ships without the other two, the artifact "looks anonymized without being
anonymized" and the verdict reverses to zero — **delete the computation with the
route, export included.**
1. **k-anonymity floor.** In `calculateCityClusters` (`geospatial.ts:8-30`) apply an internal `minClusterSize = max(10, ceil(0.05 * totalHouseholds))`, computed inside the function, **never a prop, never rendered as a number**; return a `suppressed` count alongside the clusters. Remove `clusters.slice(0, 20)` (`MapView.tsx:28`).
2. **Household dedupe.** `geospatial.ts:22` increments once **per person** — a family of five inflates its city 5×. Dedupe on `Student.householdId` (`pco.ts:85`) before tallying, so the unit of count is the household.
3. **Null households excluded.** Drop `householdId === null` records entirely (`pco.ts:298` sets it) and **display the excluded count**. They cannot be safely represented at household level and they are D4's unlinked-child population.
- Normalise addresses before grouping — `geospatial.ts:14-19` only title-cases; collapse `St./Saint`, `Ft./Fort`, `Mt./Mount`.
- **Delete:** `suggestCampusLocations` (`geospatial.ts:32-41` — a `count >= threshold` filter over an already-sorted table that drops `clusters[0]` by construction, i.e. a second copy of the rows above it minus the biggest), the threshold state and slider (`MapView.tsx:21,51-62`), the suggestions card (**`MapView.tsx:104-126`** — the whole block; v3's `104-113` would unbalance the JSX), the 🗺️ icon (`:36`), the `suggestCampusLocations` import (`:3`), and the recharts `BarChart` (`:65-102`).
- **Replace the chart with a plain table** (city, household count) plus two stated lines: *"N cities suppressed (fewer than K households)"* and *"N records excluded (no household on file)."* CSV via the existing `downloadCSV` (`src/utils/export.ts:1`) — **the same post-suppression rows the table shows**, no address, no name, no per-person row.
- **Delete the nav row** `SidebarIntelligence.tsx:141-147` and the route `App.tsx:887-891`. Rename per §3.1. Reached by an explicit link under *Reports* — never a sidebar row.

### D10. Build Intelligence Home — 3 cards, zero controls, non-default
- `src/components/IntelligenceHome.tsx`, view key `intel-home`. **Do not change `App.tsx:80`** (`setCurrentView(role === 'core' ? 'dashboard' : 'copilot')`) — that is Q3, Area C's call.
- Cards in order: (1) needs-attention counts linking to Area C burnout/attrition/missing, (2) Weekly Check-ins (D7/N2), (3) ministry-band demographics (D8, first-out).
- Fixed height, no internal scroll, **no controls at all**, no aggregate health score, no "Reports" overflow page. Plus the coverage line (D11) and the "as of HH:MM" marker (D1).

### D11. Honest-denominator fix (hand to Area A)
`transformPerson` returns `null` for every person with a missing or unparseable
birthdate — **`pco.ts:257-265`** — before `App.tsx` builds `students`. Every count in
Areas C, D and F is over an unstated subset. Expose the discard count, or carry
`birthdate: null` through with per-chart exclusion.

### D12. `Guest` kind predicate (hand to Area C) — corrected citation
- **`retention.ts:16`** — `if (checkIn.attributes.kind !== 'Regular') return;` inside `calculateNewcomerFunnel`. Change to `!== 'Volunteer'`. This silently drops every guest check-in from the newcomer funnel — the population the funnel exists to measure — and the fixture cannot expose it (0 `Guest` literals).
- Same defect, same fix, outside Area D: **`drift.ts:31`** and **`sermons.ts:42`** (`givingTrends.ts:26` no longer exists, §1.4). Area C is folding these in. Youth's note travels with `drift.ts`: dropped guest visits deflate baseline *and* recent windows, biasing `dropPercentage` upward — the engine manufactures false positives.
- Tighten **`kind: string` (`pco.ts:139`)** to `'Regular' | 'Guest' | 'Volunteer'` so the next such filter fails at compile time. **This is the item that prevents recurrence** and should land before, not after, the three call-site fixes.

### D13. Dead code removed — new, free (§1.3b)
Delete `RobertReport.tsx`, `.css`, `.test.tsx`, the commented import at `App.tsx:11`,
and the mocks at `App.ghost.integration.test.tsx:60-62` and
`App.undo.integration.test.tsx:64`. Unreachable since "direct views" replaced it;
its only effect today is to hold compile-time references to three components D5/D6/D7
delete. **Sequence it before those three** or the typecheck breaks mid-way.

---

## 5. Left for round 5 — three items, none of them Area D's to decide

Round 5 is a sign-off. No verdict in §2 is open, no critic holds an objection, and
nothing below is an Area D disagreement — each is an **ownership assignment** that
Area D found, verified and specified but cannot execute in someone else's files.

1. **Q4 — who owns `useCheckIns`?** Highest-value item in the document. **Three rounds unowned.** Area D deletes both of its own call sites and inherits one new one; unowned, 12 components keep re-pulling ~10k records each against a shared PCO rate ceiling. The failure mode is not a slow dashboard — it is a 429 that degrades the check-in station iPads on Sunday morning.
2. **Q5 — does Area A take N3 (placeholder-date detector)?** **Three rounds unowned**, and now load-bearing: youth's cliff-cohort filter bands on `calculatedGrade`, derived from a birthdate `transformPerson` accepts as long as it parses (`pco.ts:261-265`). Declining N3 makes the one surviving youth signal untrustworthy.
3. **Q3 — who owns the Intelligence landing view?** `App.tsx:80` lands the intelligence role on `copilot`. If Area C moves it to `intel-home`, **Area D's sidebar contribution drops from 1 row to 0** and the area's net nav change is 8 → 0 with nothing added. Area C must rule; Area D will not change that line unilaterally.

**Closed this round, no longer open questions:** Q6 (`Guest` predicate — confirmed,
routed to Area C, §1.4/D12), Q7 (calendar-blind drift window — routed with it), and
the "does city-distribution exist at all" question (§1.1).

**New, low-cost, needs an owner but should not hold up sign-off:**
4. **Q8 — does Sermon Correlator survive?** If Area C cuts it, `GENERATIONS` can be deleted from `demographics.ts` and D8 becomes a true replacement. If it survives, `GENERATIONS` stays exported with exactly one consumer (`sermons.ts:3,54`). Area D's work is correct either way; this only decides whether a dead export lingers.
5. **Q2 (standing) — is the raw-`attributes` read a systemic defect with an owner?** `prayer_topic`, `death_date`, `anniversary`, `first_time_giver`, `first_gift_date` are read straight off `attributes` (`pco.ts:255, 300, 308-311`) with no `field_data` traversal, all synthesised in `mock-api/data.js`, none of them PCO People core attributes. D6 removes two of the five as a side effect. `AutomationsReport.tsx` already ships one to users. Nobody has grepped the other five areas. **The useful contrast, verified:** `household_id` looks like the same pattern and **is not** — it is hydrated from the real `households` include (`pco.ts:217,245-246,468`). So this is a discrimination task, not a blanket suspicion of `attributes`.

---

## 6. New ideas — none, and none should be added

v2's three (N1 Intelligence Home, N2 first-time-guest series, N3 placeholder-date
detector) survived rounds 3 and 4 intact and are specified as D10, D7 and D11/N3.
**No fourth idea is proposed and round 5 should not accept one.** The area stands at
eight cuts, one demoted card set, one link-only export and one new home. A proposal
that adds a screen must delete two, and after §3 there is nothing left in Area D to
delete.
