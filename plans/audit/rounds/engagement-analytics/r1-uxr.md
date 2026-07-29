# Area D — engagement-analytics — Round 1 UXR Critique

Context for this area: all 8 features live exclusively in `SidebarIntelligence.tsx`
(`src/components/SidebarIntelligence.tsx:17-229`), a single flat, unsectioned
24-item "Intelligence" nav list. Dr. Robert is described (agent brief, README)
as an executive pastor using a *read-only* dashboard — the persona who has the
least time and the least tolerance for decorative screens. Every verdict below
is written against that user, on a Tuesday morning with 15 minutes before a
staff meeting, trying to find a number to justify a decision.

---

## #29 Attendance Pulse (`src/components/AttendancePulse.tsx`, `src/utils/attendance.ts`)

**Verdict:** KEEP (simplify)

**Evidence:**
- Pulls real data via `fetchRecentCheckIns` (`src/utils/pco.ts:507`), a genuine PCO Check-Ins call, no mock fallback in the component.
- `aggregateCheckInsByWeek` (`src/utils/attendance.ts:10-33`) is a straightforward, correct weekly bucketing — no synthesized numbers.
- Clean loading/error/empty states (`AttendancePulse.tsx:43-65`).

**Top defects:**
1. Name mismatch: "Pulse" implies something live/real-time; this is a plain weekly line chart. Minor scent issue, not a defect — but sits oddly next to #30 which makes the same "Pulse" promise and breaks it (see below), teaching the user not to trust the word "Pulse" in this app.
2. No context: raw counts with no attendance goal, no YoY comparison, no annotation for holidays/attendance dips. Robert sees a line go up or down and has no way to know if that's normal seasonal variance. (`AttendancePulse.tsx:76-94`)
3. `♥` heart icon (`AttendancePulse.tsx:70`) as a decorative emoji-adjacent glyph adds nothing and is unlabeled for screen readers.

**Cheapest fix:** Add a thin dashed line for "same week last year" using data already fetched, and drop the icon. This is a decision-support screen already — it just needs one more series to be worth a standalone nav slot instead of a Dashboard card.

**Open question:** Does Robert ever act differently after seeing this chart, or does he already get the same signal from the Dashboard's headline attendance number? If the latter, this should be a Dashboard card, not its own nav item.

---

## #30 Check-in Velocity (`src/components/CheckInVelocity.tsx`, `src/utils/velocity.ts`)

**Verdict:** DEMOTE (fix the label, merge into #29)

**Evidence:**
- Copy claims: *"Real-time gauge of check-ins per minute on Sunday morning"* (`CheckInVelocity.tsx:60`).
- Implementation is a one-shot fetch on mount of up to 10,000 historical check-ins (`CheckInVelocity.tsx:22`, comment confirms: "Fetch last 100 pages ... to get good history"), then a static comparison of "Average Sunday" vs "Last Sunday" arrival-time curves (`velocity.ts:11-106`). There is no polling, no websocket, no re-fetch trigger anywhere in the component. It is exactly as static as #29.

**Top defects:**
1. **Trust defect (severe for this label):** calling a static historical chart "real-time" is a direct violation of the "which numbers are real vs. heuristic" trust principle — it's not fabricated data, but it is mislabeled *behavior*. If Robert opens this at 9:15am on a Sunday expecting to see check-ins arriving live, he'll get last Sunday's frozen curve and lose confidence in every other "live"-sounding label in the app. User moment: Robert, mid-service, checks this on his phone to see if the 9am service is under-attended right now — gets nothing current.
2. Fetching 10,000 check-ins on every mount (`CheckInVelocity.tsx:22`) with no caching is expensive against PCO rate limits and slow to load, for a chart that answers a narrow ops question ("are people arriving later than usual").
3. Duplicates #29's data source and general shape (a check-in-derived time series) — two separate nav items for two views of the same underlying event stream.

**Cheapest fix:** Rename to "Sunday Arrival Curve" (or fold as a second tab inside Attendance Pulse) and delete the word "Real-time" entirely. That single string edit removes the worst trust risk in this feature.

**Open question:** Has any admin actually used the average-vs-latest comparison to change staffing (e.g., add a second check-in station)? If not, this is solving a problem nobody has raised.

---

## #31 Solar System (`src/components/SolarSystem.tsx`)

**Verdict:** CUT

**Evidence:**
- Pure decoration: renders each family as an SVG "star" (parents) orbited by "planets" (children) sized by age (`SolarSystem.tsx:79-140`). No metric, no threshold, no alert, nothing actionable — clicking a family shows names and ages that are already visible in the People list.
- Requires `parents.length > 0 && children.length > 0` (`SolarSystem.tsx:45`) — households with only children (common: single co-parent not in PCO, guardians, older-adult-only households) are silently dropped from "the Galaxy" with no explanation.
- Zero information scent: "Solar System" tells the user nothing about what question it answers. This is exactly the category the brief calls out — a visual metaphor standing in for a question that was never defined.

**Top defects:**
1. No decision surfaces here at all — it's a family-tree visualizer with astronomy skin. Robert, asked by a board member "how many of our families have kids at home," cannot answer that faster here than by filtering the People list; the galaxy view doesn't even show a count on the landing screen without opening each card.
2. Accessibility: `.galaxy-card` is a `<div onClick>` with no `role="button"`, no `tabIndex`, no keyboard handler (`SolarSystem.tsx:159-176`) — unreachable by keyboard, invisible to screen readers as an interactive element.
3. Sits in the same top-level nav as Burnout Risk and Attrition — a pastor scanning nav labels for "what needs my attention today" has to open this to learn it's a toy.

**Cheapest fix:** Delete the route and nav entry. If there's a real desire to browse household structure, that's a filter/sort on the existing People table, not a new screen.

**Open question:** none needed — this is a decoration by its own implementation; no user observation will turn it into decision support without a rewrite from scratch with a real question attached.

---

## #32 Heatmap of Life (`src/components/LifeEventsHeatmap.tsx`, `src/utils/heatmap.ts`)

**Verdict:** SIMPLIFY (cut the "Deaths" mode; keep Birthdays as a scheduling aid)

**Evidence:**
- 12×31 grid of day-of-year cells shaded by count of birthdays / anniversaries / **deaths** on that calendar day (`LifeEventsHeatmap.tsx:9-19`, `heatmap.ts:57-67`).
- Color is the *only* encoding of magnitude on the grid itself — counts appear only in the `title`/`aria-label` tooltip on hover (`LifeEventsHeatmap.tsx:78-90`); low-vision or colorblind users get an undifferentiated grid of light-blue squares.
- The `role="gridcell"` cells (`LifeEventsHeatmap.tsx:88`) are not wrapped in a `role="grid"`/`role="row"` ancestor structure, and are not focusable (no `tabIndex`), so the ARIA labeling is largely inert for keyboard/screen-reader users — they can't tab to a cell at all.

**Top defects:**
1. **Tone/trust defect, not just UX:** a "Deaths" toggle that renders a calendar heatmap of death density (`heatmap.ts:65-67`, `LifeEventsHeatmap.tsx:49`) is a jarring reuse of a "fun facts" visual metaphor (heat = density = good, everywhere else in this app) for grief data. A pastor scanning "Heatmap of Life" for birthday/anniversary outreach can flip the dropdown and land on a grid of member deaths with no transition, no framing, and cheerful blue gradient styling identical to the birthday view. User moment: Robert, prepping a birthday-card mail merge, absent-mindedly clicks the dropdown next option and is shown a density map of who died when.
2. `student.deathDate` / `anniversary` / `prayerTopic`-style fields depend on the church manually maintaining custom PCO fields most orgs never populate (see #36 below for the same problem) — for a typical sparse-data church this screen is mostly empty grey cells, which is never demonstrated or handled beyond a generic "no data" absence (there's no zero-state message when `students` has entries but none have `deathDate`, just a wall of grey cells).
3. Color-only, unlabeled-on-grid magnitude fails WCAG 1.4.1 (use of color).

**Cheapest fix:** Drop "Deaths" as a mode entirely — it's not an operational need ("call families on the anniversary of a loss" would be a Pastoral Co-Pilot alert, not a calendar heatmap) and is reputationally risky for zero payoff. Print the count in each cell (or on cells above a threshold) instead of relying only on hover.

**Open question:** Has any customer actually asked for a death-density calendar? This reads like a feature generated by pattern-completion ("we have birthday/anniversary heatmaps, what else has a date...") rather than a real pastoral request.

---

## #33 Demographics / Generation Stack (`src/components/GenerationStack.tsx`, `src/utils/demographics.ts`)

**Verdict:** KEEP

**Evidence:**
- Simple, correct horizontal bar chart of generation cohorts derived from real `birthdate` (`demographics.ts:19-55`), color-coded per generation with a legend-equivalent via labeled bars (not color-only — the Y-axis text label is present per bar, `GenerationStack.tsx:35`), sensible empty state (`GenerationStack.tsx:16-22`).
- Answers a legible question — "what's our age mix" — that maps directly to ministry planning (kids/youth vs. senior programming).

**Top defects:**
1. Minor: "Unknown" bucket is computed (`demographics.ts:26,30-38`) but never rendered — `displayData` only shows `GENERATIONS`, silently dropping members with missing/invalid birthdates from the total (`GenerationStack.tsx:14`). Robert has no way to know what fraction of the church this chart is even describing. If 40% of records have no birthdate, the bar chart looks confident but is a partial sample.

**Cheapest fix:** Show "N unknown (excluded)" as a caption under the chart title so the denominator is honest.

**Open question:** What's the typical null-birthdate rate in real customer data? If high, this chart is misleadingly authoritative.

---

## #34 Map View (`src/components/MapView.tsx`, `src/utils/geospatial.ts`)

**Verdict:** SIMPLIFY (rename; the current name is the single biggest defect)

**Evidence:**
- There is no map. `MapView.tsx` renders a `recharts` `BarChart` of city-name counts (`MapView.tsx:70-97`) — no coordinates, no geocoding, no `<svg>`/canvas map, nothing spatial. `geospatial.ts` groups students by the literal `address.city` string (`geospatial.ts:8-30`); it is a city-name tally, not geospatial analysis.
- The nav icon is literally 🗺️ (`SidebarIntelligence.tsx:152`) reinforcing the false promise before the user even clicks.

**Top defects:**
1. **Information-scent failure, textbook case:** "Map View" + map emoji sets a concrete expectation (a literal map with pins/clusters) that the screen does not deliver. User moment: Robert, exploring a possible church plant location with the board, clicks "Map View" expecting to see where members physically live relative to city boundaries/highways — gets a sorted bar chart of city name frequency and has to mentally re-derive geography himself.
2. City-name grouping is fragile: no normalization beyond capitalization (`geospatial.ts:14-19`) — "Saint Louis" vs "St. Louis" vs "St Louis" would split into three bars silently undercounting the real cluster, directly undermining the "suggest a new campus" feature built on top of it (`suggestCampusLocations`, `geospatial.ts:32-41`).
3. The "Predictive Planting Suggestions" panel (`MapView.tsx:104-126`) sounds like a model output but is a `count >= threshold` filter (`geospatial.ts:38-39`) — not wrong, but "Predictive" is doing unearned rhetorical work for a simple threshold rule. Minor trust inflation.

**Cheapest fix:** Rename to "City Distribution" (or "Member Clusters by City") and drop the map emoji and "Predictive" language — the underlying bar chart + threshold-suggestion logic is legitimately useful for campus planning, it's just mis-billed. A real map is a much larger investment (geocoding, base-map licensing) that isn't justified unless city normalization is fixed first anyway.

**Open question:** Does the target user actually want lat/long pins, or is city-level aggregation (correctly labeled) sufficient for campus-planning conversations? If pins are truly wanted, this is a scope/cost conversation, not a rename.

---

## #35 Global Pulse (`src/components/GlobalPulse.tsx`)

**Verdict:** CUT

**Evidence:**
- Header copy: *"Compare your church's health metrics against anonymized global averages"* (`GlobalPulse.tsx:57`).
- Every "Global" value on the radar chart is a hardcoded literal with no fetch, no aggregation service, no API call anywhere in the file: `Global: 85`, `78`, `60`, `55`, `45` (`GlobalPulse.tsx:24,30,36,42,48`). There is no cross-church data pipeline in this codebase (confirmed: no network calls in the component; `students` prop is the only input).
- Three of five "Local" series are also hardcoded, explicitly commented as fake: `Local: 65, // Mocked`, `Local: 50, // Mocked`, `Local: 40, // Mocked` (`GlobalPulse.tsx:35,41,47`) — mixed on the same chart, with the same visual treatment, as the two series that *are* derived from real data (`accuracy`, `healthScore`, `GlobalPulse.tsx:14-17`).

**Top defects:**
1. **This is the single worst trust violation in Area D and a strong candidate for the worst in the whole audit.** A radar chart labeled as a benchmark against "anonymized global averages" is entirely fabricated on both axes for 3 of 5 dimensions, and fabricated on one axis (Global) for all 5. There is no visual, textual, or structural cue distinguishing the two real series from the three fake ones — same fill, same legend styling, same axis. Robert, preparing a board presentation, could screenshot this chart and present "our retention rate is 65% vs. industry average of 60%" as fact to a governing board. Both numbers are invented.
2. Even the two "real" series are questionable: "Health Score" is `accuracy - 10` (`GlobalPulse.tsx:17`) — an arbitrary constant offset with no stated rationale, presented with the same authority as a measured metric.
3. Duplicates the Dashboard's own "Health Score" metric (`Dashboard.tsx:79`) under a different, unexplained formula — two health scores that disagree with each other, both visible to the same user in the same app, with no reconciliation.

**Cheapest fix:** There is no cheap fix that preserves the feature's premise — cross-church anonymized benchmarking requires a real aggregation backend Locus does not have (per the inventory's standing context: no such pipeline exists). Delete the screen. If a "how healthy are we" view is wanted, it belongs on the Dashboard using only measured local numbers, with zero fabricated comparison points.

**Open question:** None on the destination — a fabricated benchmark chart is disqualifying regardless of what real users say they'd want, per the agent brief's own trust principle. The only question worth asking a user is whether they'd prefer no benchmark at all vs. a clearly-labeled "not enough churches on Locus yet to benchmark" empty state — but either answer still means cutting the current chart.

---

## #36 Sentiment Pulse (`src/components/SentimentPulse.tsx`, `src/utils/sentiment.ts`)

**Verdict:** DEMOTE (real data, wrong format, thin coverage)

**Evidence:**
- Data is real (not fabricated): tallies `student.prayerTopic` values into a frequency table (`sentiment.ts:8-32`) — genuinely derived from PCO custom-field data, no invented numbers. This is meaningfully better-behaved than #35.
- But: relies on a single free-text-ish custom field, `prayer_topic` (`src/utils/pco.ts:276`, mock fixture: `mock-api/data.js:96-99` shows only 5 canned values `['Financial','Health','Grief','Anxiety','Addiction']`) — in a real PCO org this field is very unlikely to be populated at all (it isn't a standard PCO People field), so the realistic outcome for most churches is the empty state (`SentimentPulse.tsx:37-47`), not the word cloud.
- Presentation is a word cloud with `color: hsl(${Math.random()*360}...)` recomputed **every render** (`SentimentPulse.tsx:64`) — colors shuffle on any parent re-render, and color carries no meaning (word size/opacity already encodes frequency), so the randomness is pure visual noise, not signal.

**Top defects:**
1. Word clouds are a known-poor chart type for precise comparison (area/rotation misleads magnitude perception) — the summary line at the bottom (`SentimentPulse.tsx:73-75`) already contains the one number that matters ("Top theme: Grief (14 occurrences)") more legibly than the cloud above it. The cloud is decorative dressing on a fact that a one-line stat or ranked bar list would communicate faster.
2. "Spiritual Climate" (`SentimentPulse.tsx:30`) is a bigger promise than "which single custom field had which values most often" — a pastor could read this as aggregate congregational sentiment/wellbeing, when it's five hardcoded prayer-request categories being counted.
3. Color has zero semantic meaning and is randomized on each render — for a colorblind user or anyone re-rendering the tab, this is pure churn with no information value, mild motion/flicker concern under the accessibility lens (not animated per se, but re-randomizes on any state change upstream).

**Cheapest fix:** Replace the word-cloud rendering with a ranked horizontal bar list (reusing the Demographics bar-chart pattern) — same real data, no misleading area-encoding, no random color, and it stays legible even with 2 categories or 20. Rename to something scoped to what it measures, e.g. "Prayer Request Themes."

**Open question:** What fraction of real customer orgs actually populate `prayer_topic` in PCO? If near-zero, this screen is an empty state for nearly every real user and its nav slot cost isn't earned regardless of chart-type fix.

---

## Cross-cutting observations for Area D

- **Decoration vs. decision-support split:** #29 Attendance, #33 Demographics, and (with the rename) #34 Map View are genuine decision-support screens on real data. #31 Solar System is pure decoration with zero actionable output. #35 Global Pulse is worse than decoration — it's fabricated data presented as a real external benchmark. #32 and #36 are real-data screens wearing a decorative visualization (heatmap grid, word cloud) that actively works against their own legibility, and both depend on custom PCO fields most churches won't have populated.
- **"Pulse" as a brand word is now unreliable:** three features use "Pulse" (#29 Attendance Pulse, #35 Global Pulse, #36 Sentiment Pulse) plus #30's copy claims "real-time" — none of the four is actually live/streaming, and one is fabricated. Overloading "Pulse" to mean "chart" erodes the one signal (liveness) the word is supposed to carry.
- **Nav structure:** all 8 features sit in one flat, unsectioned 24-item list (`SidebarIntelligence.tsx:17-229`) alongside Burnout Risk, Attrition, and Missing Volunteers — genuinely urgent pastoral-ops items are visually indistinguishable in the nav from a family-astronomy toy and a fabricated benchmark chart. A time-pressured executive cannot tell from the sidebar alone which items are worth opening today.
