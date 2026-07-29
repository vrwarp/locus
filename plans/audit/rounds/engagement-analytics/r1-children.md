# Area D — engagement-analytics — Round 1 (Children's Ministry critique)

Reviewer: children's ministry director persona (birth–5th grade, ~300 kids, two
services, folding-table check-in desk).

Standing note on this whole area: every chart in Area D is fed the full `students`
array from `src/utils/pco.ts` (`Student` interface, `pco.ts:71-99`), which is
**every PCO Person the app pulled, adults and children together**, split only by
an `isChild` boolean. None of features #31-#36 filter to children before
rendering. Treat that as a running theme, not a one-off note.

---

## #29 Attendance Pulse (`src/components/AttendancePulse.tsx`, `src/utils/attendance.ts`)

**Verdict:** DEMOTE

**Safety impact:** None directly. It reads check-in timestamps only.

**Sunday-morning cost:** Zero — this is a dashboard view, not a desk workflow.

**Household / guardian correctness:** N/A.

**Minor-data flag:** `aggregateCheckInsByWeek` (`attendance.ts:10-33`) sums every
`PcoCheckIn` with no filter on `kind`. Planning Center check-ins include
`kind: 'Volunteer'` records for staffed volunteers alongside `kind: 'Regular'`
child/attendee check-ins (confirmed in `mock-api/data.js:307,331,354,375,387,399,413,497`
and in `CheckInVelocity`'s use of the same unfiltered feed). So "weekly check-in
volume" is a mix of kids checking into class and adults checking into volunteer
roles, with no way to separate them. For a nursery/elementary director, this
number cannot answer "how many kids were in the building" — it can't even
answer "did volunteer-to-kid ratio hold," because both counts are folded into
one line.

**What would make this worth a volunteer's attention:** Split by `kind`
(Regular vs Volunteer) and, ideally, by classroom/event so a director can see
kids-in-room vs. volunteers-checked-in side by side — the actual ratio number
we need every Sunday.

---

## #30 Check-in Velocity (`src/components/CheckInVelocity.tsx`, `src/utils/velocity.ts`)

**Verdict:** CUT (as built) — this is the feature I most wanted to be right,
and it isn't a station, a service, or a bottleneck. It's a mislabeled area
chart.

**Safety impact:** Indirect but real. If a director actually believed this
chart told them where the line was backing up, they'd staff based on it and be
wrong. A real bottleneck tool (which station is 8 minutes behind at 9:24) is a
ratio/safety tool; this one is decorative and could give false confidence that
"check-in flow is fine" when a specific room is actually jammed.

**Sunday-morning cost:** Zero added at the desk (it's a report), but zero
value returned either — it does not tell a volunteer or director anything
actionable in the 8-minute window it claims to be about.

**Household / guardian correctness:** N/A.

**Minor-data flag:** Same unfiltered-`kind` problem as #29 — `velocity.ts`
never filters on `kind`, so "check-ins per minute" blends kid check-ins and
volunteer check-ins (`velocity.ts:59-74`, no `kind` filter anywhere in the
file).

**Why this fails the "station, service, bottleneck" bar, concretely:**
- **No station.** `PcoCheckIn` (`pco.ts:110-121`) has no location/room field,
  and the app never requests one (`fetchRecentCheckIns`, `pco.ts:507-531`,
  hits `/check-ins/v2/check_ins` with no `include=locations` or similar). PCO's
  real Check-Ins API supports per-station/location data; Locus doesn't fetch
  it. There is no way, from this feature, to know that Preschool Room 2 is the
  bottleneck at 9:24 — which is the only question a director asks on a Sunday
  morning.
- **No service.** With two services, "Average Sunday" and "Last Sunday"
  (`velocity.ts:80-103`) blend both services' check-in bursts into one curve.
  A director running 9:00 and 11:00 services needs two separate bottleneck
  curves, not one smeared average — the 9:00 crowd and 11:00 crowd hit
  completely different rooms with different staffing.
- **Not "real-time."** The subtitle says "Real-time gauge of check-ins per
  minute on Sunday morning" (`CheckInVelocity.tsx:60`), but the component
  fetches up to 100 pages (~10,000) of historical check-ins on mount
  (`CheckInVelocity.tsx:20-22`) and plots a static average-vs-last-Sunday
  chart. There is no live polling, no "right now" marker, nothing a volunteer
  glances at mid-rush to know if they're behind pace this instant.
- **Not fixable.** Even a director who correctly reads "we were slower than
  average between 9:15-9:25" has nothing to act on — no station, no queue
  depth, no wait time, no distinction between slow because volunteers aren't
  scanning fast enough vs. slow because 40 families all arrived in the same 90
  seconds (which is normal and not fixable by staffing).

**What would make this worth a volunteer's attention:** Filter to
`kind: 'Regular'`, split by service (event/time-of-day cluster), and — the
one thing that would actually make this a safety tool — break it out per
room/station if PCO's location data is ever pulled in. Absent station data,
rename it to what it is ("Historical Sunday check-in pace") and stop claiming
real-time or velocity.

---

## #31 Solar System (`src/components/SolarSystem.tsx`)

**Verdict:** CUT

**Safety impact:** None directly — read-only visualization.

**Sunday-morning cost:** Zero (dashboard-only, not desk-facing).

**Household / guardian correctness:** Groups strictly by a single
`householdId` per person (`SolarSystem.tsx:22-41`) and only renders households
with ≥1 adult AND ≥1 child (`SolarSystem.tsx:44-46`). That silently drops:
single-parent households (very common — divorce, deployment, death), foster
placements where the child's household record may point to a caseworker/agency
rather than a "parent," and any child whose PCO household has no adult
attached due to data entry gaps. It also can't represent shared custody across
two households (PCO's `householdId` is one value per person), so a child who
splits time will show up orbiting only one "star," implicitly the household
Locus happened to link — a silent, wrong signal about who that child's family
"is" if anyone reads meaning into it.

**Minor-data flag:** Renders each child's name, first name, and *computed age*
in a public-looking orbit visualization (`SolarSystem.tsx:107-138`). Age here
is `differenceInYears` off of raw birthdate (`pco.ts:243`) with no placeholder
handling — a child with a 1/1 guessed birthdate gets a wrong age displayed
next to their name and picture-less avatar in a "fun" visualization that
serves no operational purpose. This is the identity-mapping-as-toy pattern this
role's policy floor specifically warns about: displaying inferred/derived data
about a child (age, family structure) in a decorative surface that nobody
asked for and that adds no protective or operational value.

**What would make this worth a volunteer's attention:** Nothing — this is a
visualization gimmick with no operational question behind it. It doesn't help
find missing guardians, flag household data problems, or support intake. If
the goal is "find broken household links," that's a data-hygiene report (Area
A territory), not a decorative galaxy.

---

## #32 Heatmap of Life (`src/components/LifeEventsHeatmap.tsx`, `src/utils/heatmap.ts`)

**Verdict:** SIMPLIFY (birthdays tab only, and only after fixing the
placeholder-date bug) / CUT (anniversaries, deaths tabs — not this role's
lane and use the same all-ages roster)

**Safety impact:** None directly.

**Sunday-morning cost:** Zero (dashboard-only).

**Household / guardian correctness:** N/A.

**Minor-data flag — this is the sharpest finding in the whole area.**
`calculateEventHeatmap` (`heatmap.ts:11-55`) takes every student's raw
`birthdate` string, parses it, and buckets by month/day with **zero validation
that the date is a real, intentionally-entered birthdate** rather than a
placeholder. Per this role's operating knowledge, "1/1" is the single most
common placeholder a rushed grandparent or first-time volunteer enters when
they don't know a child's actual birthdate. The feature's own test file
acknowledges this pattern in a comment — `LifeEventsHeatmap.test.tsx:40`:
`mockStudent('2015-01-01'), // 2 on Jan 1` — and still treats it as a valid
data point rather than a suspect one. In production, with ~300 kids and a
realistic placeholder rate, January 1 will render as the single darkest,
"highest density" cell on the entire grid (`getColor`, `LifeEventsHeatmap.tsx:31-36`),
outranking every real birthday cluster. A director skimming this chart for
"who has a birthday this week" or "when should we plan birthday-focused
programming" will be actively misled by the chart's most visually prominent
signal. This is a placeholder-birthdate artifact presented as real insight —
exactly the trap this role exists to catch.

**What would make this worth a volunteer's attention:** Detect and visually
flag (or exclude, with a count called out separately) same-day birthdate
clusters above some threshold as "likely placeholder, needs data cleanup" —
which would make this a *feeder* into the Data Health / hygiene workflow
(Area A) instead of a standalone chart. As shipped, restrict to `birthdays`
and children only, or don't ship it; `anniversaries`/`deaths` operate on the
whole church roster and have nothing to do with children's ministry.

---

## #33 Demographics / Generation Stack (`src/components/GenerationStack.tsx`, `src/utils/demographics.ts`)

**Verdict:** NOT MY LANE (as built) — it's a whole-church age-cohort chart, not
a children's ministry tool, and its one child-relevant bucket is too coarse to
use.

**Safety impact:** None.

**Sunday-morning cost:** Zero.

**Household / guardian correctness:** N/A.

**Minor-data flag:** `calculateDemographics` (`demographics.ts:19-55`) buckets
by raw `new Date(student.birthdate).getFullYear()` with no placeholder
detection — same underlying weakness as the heatmap, but lower practical
impact here because a `1/1/2018` placeholder still lands the child in the
correct "Gen Alpha" generation bucket most of the time (year is more often
right than day/month even when guessed). The bigger problem for this role is
architectural, not the placeholder bug: "Gen Alpha" (2013-present,
`demographics.ts:10`) is one bucket covering ages 0-13, collapsing nursery
(0-2), preschool (3-4), and elementary (5-11) into a single bar. That's not
the age band this ministry runs on — rooms are staffed and ratio'd by
month/year bands far finer than "everyone under 13," so this chart can't
answer any real staffing or room-planning question about children specifically.

**What would make this worth a volunteer's attention:** A children's-specific
version bucketed by actual room bands (nursery/toddler/preschool/elementary,
in months for the youngest) fed only by `isChild` records, with placeholder
birthdates called out rather than silently trusted. As built, this is a
general-audience demographic slide, useful to whoever owns whole-church
generational strategy — not this desk.

---

## #34 Map View (`src/components/MapView.tsx`, `src/utils/geospatial.ts`)

**Verdict:** DEMOTE / rename — it is not a map, and it is not "where 300
children live."

**Safety impact:** None directly, but see minor-data flag below on what a real
version of this would become.

**Sunday-morning cost:** Zero (dashboard-only).

**Household / guardian correctness:** N/A.

**Minor-data flag / accuracy flag, both:**
1. **It's a bar chart, not a map.** Despite the name, the route icon (🗺️),
   and the "geospatial" module name, `MapView.tsx` renders a Recharts
   `BarChart` of city name vs. count (`MapView.tsx:70-97`) — no coordinates,
   no pins, no actual geography. "Judge Map View against a map of where 300
   children live": it isn't one. There is no per-child pin, no cluster on a
   real map, nothing a director could use to see "we have a cluster of
   families three miles northeast of campus we should plant a satellite
   nursery near."
2. **It mixes adults and children with no way to separate them.**
   `calculateCityClusters` (`geospatial.ts:8-30`) runs over the full
   `students` array (all ages) grouping by `address.city`. Even taken as a
   coarse city-level view, it cannot answer "where do our 300 kids live" —
   it answers "where does everyone in PCO People live," which is a different
   (and much larger) population.
3. **City-level aggregation is actually the *safer* choice here**, even if
   accidental — a literal address-pin map of where children live would be a
   serious child-safety exposure (exact home locations of minors, rendered
   visually, screenshottable, presentable) and this role's policy floor would
   reject that outright regardless of operational value. If this feature is
   ever "fixed" to be more map-like, it must stay at city/neighborhood
   granularity or higher — never per-address pins for children — and it must
   never be exported or shared outside a very small admin circle.

**What would make this worth a volunteer's attention:** Filter to `isChild`,
rename away from "Map," and keep it at city-level bar/choropleth granularity.
An actual want here: "which zip codes are we weak in for children's ministry
specifically" to guide where to advertise a new service time or plant a
nursery — but that is a strategic/executive question, not a check-in-desk one.

---

## #35 Global Pulse (`src/components/GlobalPulse.tsx`)

**Verdict:** NOT MY LANE, and separately: CUT for fabricating data.

**Safety impact:** None.

**Sunday-morning cost:** Zero.

**Household / guardian correctness:** N/A.

**Minor-data flag:** None (no child-identifying data rendered), but flagging
for the record since it's in this area: the component's own comment says
"Mock logic... in reality, requires complex cross-church aggregates"
(`GlobalPulse.tsx:11`), and three of five radar axes are literally hardcoded
(`Retention Rate: 65, // Mocked`, `Engagement: 50, // Mocked`,
`Growth Velocity: 40, // Mocked`, `GlobalPulse.tsx:35,41,47`), plotted next to
an equally invented "Global Average" series with no real cross-church data
source anywhere in this codebase. This is exactly the "simulated numbers
presented as real insight" pattern the audit is watching for. Not a
children's-ministry-specific harm, but a director shown this chart with no
disclosure that 60% of it is invented would reasonably make decisions on
fiction.

---

## #36 Sentiment Pulse (`src/components/SentimentPulse.tsx`, `src/utils/sentiment.ts`)

**Verdict:** CUT (as built, with the full roster) — the second-sharpest
minor-data finding in this area.

**Safety impact:** None directly, but see minor-data flag — this is a
confidentiality failure, which is adjacent to safety for this role (a
custody/abuse-adjacent prayer topic surfaced in a public-facing word cloud is
the kind of leak that erodes trust and can itself create risk for a child if a
non-safe adult sees it).

**Sunday-morning cost:** Zero (dashboard-only, but see below on where it's
shown).

**Household / guardian correctness:** N/A.

**Minor-data flag:** `calculateSentimentPulse` (`sentiment.ts:8-32`) pulls the
raw `prayerTopic` string off every `Student` — again the full roster, adults
and children undistinguished — and renders it as a giant, styled word cloud
where **frequency drives font size** (`SentimentPulse.tsx:18-24,56-70`), i.e.
the more sensitive or common a topic, the bigger and more visually prominent
it becomes. Prayer requests routinely contain exactly the material this
role's policy floor calls the most sensitive data the church holds:
custody disputes, a parent's incarceration, a child's medical or mental-health
crisis, a pending foster placement, domestic violence. A word cloud is
designed to surface the *specific text* of the most common entries, not an
aggregate statistic — there is no anonymization, no minimum-count threshold,
no exclusion of `isChild` records, and this is described in the inventory as
living on `Locus Intelligence`, the **read-only Executive Dashboard**
surface — meaning it's built to be looked at by people beyond the person who
took the prayer request, potentially projected or screen-shared. A single
child's prayer topic ("custody hearing Tuesday") could be the single largest
word on the screen if only one or two families share a theme. This fails a
child-protection confidentiality review outright.

**What would make this worth a volunteer's attention:** If prayer-topic
aggregation has any legitimate use (e.g., "what should the children's pastor
preach/program around this month"), it needs: children excluded entirely or
handled through a completely separate, access-controlled pastoral-care
channel (this overlaps Area C's Pastoral Co-Pilot, which is the correct home
for anything touching prayer requests); a minimum-occurrence threshold before
a theme is displayed at all; and no per-individual-inferable granularity in a
dashboard multiple people can see. As built, pull this off the Intelligence
dashboard.

---

## Summary verdict table

| # | Feature | Verdict |
|---|---------|---------|
| 29 | Attendance Pulse | DEMOTE |
| 30 | Check-in Velocity | CUT (as built) |
| 31 | Solar System | CUT |
| 32 | Heatmap of Life | SIMPLIFY (birthdays only) / CUT (anniversaries, deaths) |
| 33 | Demographics / Generation Stack | NOT MY LANE |
| 34 | Map View | DEMOTE / rename |
| 35 | Global Pulse | NOT MY LANE / CUT (fabricated data) |
| 36 | Sentiment Pulse | CUT (confidentiality failure) |
