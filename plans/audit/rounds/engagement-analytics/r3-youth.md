# Area D — Round 3 — Youth Ministry

Scope per instructions: three narrow items only. D4, D6 (grade source-of-truth),
and the k-floor formula are CONVERGED and not reopened.

---

## 1. "Nothing in Area D serves youth ministry" — confirmed, and named a fix

Confirmed as read. `AttendancePulse`/D7's card is `aggregateCheckInsByWeek`
(`attendance.ts:10-33`) — a flat weekly count, no grade axis, no event axis.
`GenerationStack`/D8 bands `calculatedGrade` into `MINISTRY_BANDS` but is
church-wide generation shape, not a drift signal — a chart, not an alert. Map
View has no grade dimension at all. Nothing left in the area distinguishes a
6th grader from a 60-year-old, let alone flags a cliff cohort.

**I accept this as the honest end state for Area D itself** — the card budget
(3, toggle-only, no aggregate score) genuinely has no room for a cliff chart,
and I already agreed in R2 that small-group-specific drift isn't buildable
(no room/group dimension exists anywhere in the fetched data — reconfirmed:
`PcoCheckIn` (`pco.ts:109-121`) carries only `person` and `event` relationships).

But the cheapest real signal doesn't require a new Area D screen — it's a
**zero-cost filter on data Area C already returns.** `calculateDriftRisk`
(`drift.ts:13-97`) returns `DriftCandidate[]` where `person: Student`
(`drift.ts:5,85`) — the *full* Student object, which already carries
`calculatedGrade` (`pco.ts:79`) on every record. Nothing needs to be fetched,
joined, or computed that doesn't exist today. The only work is: band
`person.calculatedGrade` into D8's already-planned `MINISTRY_BANDS` (middle
6-8, high 9-12) and expose it as a filter chip on Predictive Attrition (#21)
and Missing Volunteers (#22), labelled "cliff cohort: rising 6th / rising
9th." This is free safety too — `calculateExpectedGrade` (`grader.ts:29-32`)
returns 13+ for graduated seniors, so the band excludes them by construction;
a senior leaving for college never shows up in a "middle/high" filter, which
directly answers persona item 3 (seniors leaving is the goal, not attrition).

Caveat I will not let slide: `drift.ts`'s baseline/recent windows
(`:21-24`, 7-month rolling vs 6-week recent) are calendar-blind, not
school-year-aware. A grade filter on top of a summer-gap-blind engine still
false-positives every August on totally normal kids. This hand-off makes the
*population* right; it does not fix the *window*. That window defect is
Area C's to own (it predates this critique and isn't new to Round 3), but I
am flagging it here because it directly determines whether the one signal I'm
endorsing is trustworthy enough to hand a volunteer leader.

**Verdict on item 1: ACCEPT the end state for Area D, with the Area C
hand-off in §3.5 of the proposal as the cheapest real fix** — it is already
proposed there ("Hand to Area C with youth's grade-cliff requirement
attached"); I am confirming it is concrete, buildable today, and correctly
scoped, not inventing a new ask.

---

## 2. Heatmap of Life — CUT (was DEMOTE at R2) — ACCEPT, conditionally

At R2 I held DEMOTE because birthdays are the one place life events surface
and a volunteer leader genuinely likes knowing a student's birthday is
Tuesday. Re-examined against the proposal's new argument and I'm persuaded:
`LifeEventsHeatmap.test.tsx:8-24` shows every non-birthday mode
(`anniversary`, `deathDate`) is fabricated — same defect class as
`prayer_topic`. And on birthdays specifically, the honest comparison isn't
"heatmap vs. nothing," it's "heatmap vs. PCO Lists" — PCO already filters by
birthday range *and* lets a leader message the filtered list in one motion. A
static grid in Locus can do neither. Building a worse copy of a feature PCO
ships natively isn't a youth-ministry win, it's wasted budget the card cap
can't afford anyway.

**I ACCEPT the CUT on one condition that must not get lost:** N3 (placeholder-
date detector, §6 of the proposal) actually lands in Area A. This is no
longer just a hygiene nicety — it now backstops item 1 above. A Jan-1
placeholder birthdate silently passes `transformPerson`'s parse gate
(`pco.ts:233-241` requires a parseable birthdate) and enters `calculatedGrade`
as if real. That's the exact field the cliff-cohort filter in item 1 depends
on. If Area A declines N3 (proposal's open question 5), a placeholder-DOB
6th-grader could band into the wrong cohort or the wrong side of a cliff, and
nobody would know. CUT is right for the chart; N3 is not optional cleanup,
it's a dependency of the one youth signal left standing.

---

## 3. `isChild` filter on Map View — REJECT the filter, siding with the proposal

This was my own k-anonymity concern from R1/R2, so I re-derived it from
scratch rather than deferring.

The re-identification risk I originally raised was: a map showing dots dense
enough, or granular enough, that a specific household with minors becomes
inferable. Two things fix that, and they're both already in D9 as blocking
work, not yet shipped: (a) the `max(10, ceil(0.05*totalHouseholds))` floor
applied to whatever the displayed unit is, and (b) deduping the count on
`householdId` before tallying — confirmed still absent today,
`calculateCityClusters` (`geospatial.ts:8-24`) increments one count per
`student`, no household grouping, so a family of five currently inflates its
city 5x and each minor is currently a separate unit in the tally. Once (b)
ships, a minor never appears as an individually-countable unit — they fold
into their household's single count, which is the actual fix to "can a
specific kid be picked out of this chart."

Filtering to `isChild` on top of that does not add safety, it subtracts it.
The floor is computed against `totalHouseholds` — the whole roster's
household count. A city's minors-only subset is by definition a smaller
population than that same city's whole-roster population, so the *same*
floor number represents a much larger share of "households with kids in this
city" than it does of "households in this city." A chart titled effectively
"where our minors live," even household-deduped, is closer to identifying
which few families have kids than the whole-roster version is — this is
exactly persona item 5's "a minors-only artifact is more sensitive," and I
verify it holds under the k-math, not just as an intuition.

The children's specialist's fitness argument (a whole-roster chart gives
children's ministry zero standalone value) is true but doesn't change the
safety ruling — Map View's only surviving job (§D9, campus siting) is a
household-level question by nature; a students-only cut would make the chart
worse at its one job while making it more identifying. I'm not overruling
children's on need, I'm ruling that the specific remedy proposed points the
wrong direction.

**Verdict on item 3: REJECT the `isChild` filter.** This is contingent on
D9's household-dedupe actually landing as blocking, not deferred — if
`geospatial.ts:11` still counts people instead of households when this ships,
my ruling flips back to "unsafe as shipped," floor or no floor.
