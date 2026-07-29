# Area D — engagement-analytics — Round 1 (youth-ministry)

Reviewer: youth pastor persona (grades 6-12, multi-campus). Discovery round —
critiquing the product as built, feature by feature, in inventory order.

Context established before reading feature code: the prop threaded into every
component below is called `students` but is actually the **entire PCO People
list** (`src/App.tsx` — every call site passes the same `students` array to
adult-facing reports and these charts alike). `Student.isChild` and
`Student.pcoGrade` exist on the type (`src/utils/pco.ts:74,84`) but **none of
the eight Area D files reference `grade` or `isChild` at all** (verified by
grep across all eight — zero hits). Nothing in this area is scoped to youth,
segmented by grade, or even filtered to minors vs. adults. That single fact
governs almost every verdict below.

Also established: check-ins are fetched with no event filter
(`src/utils/pco.ts:507` `fetchRecentCheckIns`, hits
`/api/check-ins/v2/check_ins?per_page=100` unfiltered). Mock data
(`mock-api/data.js:218-239`) has five distinct events — Friday Night Live
(youth), Sunday Kids Church, Sunday Worship Service, Kids Ministry Team
(serving), Greeter Team (serving) — all mixed into one undifferentiated
stream. There is no ministry/event picker anywhere in Area D.

Access model: the only gate is the login-time choice of `core` vs
`intelligence` role (`src/components/LandingPage.tsx`). Every feature in this
area sits behind "Intelligence" with no further permission check — any staff
or volunteer with an Intelligence login sees all of it, including the minors'
data discussed below.

---

## #29 — Attendance Pulse (`src/components/AttendancePulse.tsx`, `src/utils/attendance.ts`)

**Verdict: CUT** (in current form — replace, don't keep)

**Does it survive the school year?** No. `aggregateCheckInsByWeek`
(`src/utils/attendance.ts:10-33`) buckets every check-in from every event into
one weekly count and plots it as a single line (`AttendancePulse.tsx:84-92`).
There is no per-student view, no per-event/ministry filter, no grade axis, no
school-year calendar awareness (semester start, summer gap, camp weeks). It
is a whole-church volume line chart wearing a name that promises individual
insight.

**False positive / false negative cost:** This is not a per-student signal at
all, so the framing in my brief — "can it tell a 3-Sunday soccer absence from
a student who's actually gone" — has no answer here: the feature cannot see
individual students, only an aggregate weekly total across the entire
congregation (kids church + adult worship + youth + serving teams all
summed). A youth leader gets nothing usable from this for a single student.
At the ministry level, a dip in the aggregate line could be Easter travel,
Kids Church closing for VBS, or Friday Night Live losing attendance to a
school event — indistinguishable, because event type isn't broken out.

**Minor-safety flag:** Low direct risk since it's a pure count, but it
silently aggregates minors' check-in timestamps into a metric an executive
reads without any framing about which population moved.

**What a volunteer leader would need:** An event-scoped ("Friday Night Live
only"), per-student attendance ledger with school-year week numbering and a
visible summer-gap band, not a whole-org sparkline. As built, a leader cannot
even filter this to their own ministry, let alone their own small group.

---

## #30 — Check-in Velocity (`src/components/CheckInVelocity.tsx`, `src/utils/velocity.ts`)

**Verdict: NOT MY LANE** (with one Area-D-relevant defect noted)

This measures Sunday-morning check-in throughput in 5-minute buckets
(`velocity.ts:38-42`, 7am-1pm window) — it's an ops/staffing tool for the
check-in station, not a student-engagement signal. It has nothing to say
about attendance patterns, retention, or grade cohorts.

**Does it survive the school year?** N/A to my brief, but worth flagging:
`fetchRecentCheckIns(auth, 100)` again pulls every event type
(`CheckInVelocity.tsx:22`), so "check-ins per minute" mixes Kids Church
drop-off congestion with Sunday Worship congestion. If this were ever
repurposed to say anything about "how fast students check in," it would be
wrong for the same reason as #29.

**Minor-safety flag:** None beyond the general note that check-in timestamps
of minors feed an aggregate with no access control finer than "logged in as
Intelligence."

**What a volunteer leader would need:** Nothing — this isn't a leader-facing
feature and shouldn't be sold as youth-ministry-relevant.

---

## #31 — Solar System (`src/components/SolarSystem.tsx`)

**Verdict: CUT**

**Does it survive the school year?** Irrelevant to grade/school-year — this
is a family-structure visualizer (parents as a "sun," children as "planets"
sized and distanced by age, `SolarSystem.tsx:60-140`). It has zero attendance
or engagement signal in it at all — it's Area A (household hygiene) dressed
as a chart, and it's not the family-structure representation my brief flags
elsewhere (household logic) so much as a decorative rendering of it.

**False positive / false negative cost:** N/A — not a drift/engagement
signal.

**Minor-safety flag:** Yes, moderate. `SolarSystem.tsx:36-40` filters into
`family.children` for every `isChild` record and then plots each child's
first name and exact age as an orbiting "planet," sized by age, on a
per-household drill-down screen (`system-stage` SVG, lines 76-142). A student
who drives themselves, a 17-year-old who's aged out of "child" status
inconsistently in PCO, or a blended-household kid with two "systems" will
render oddly or get silently dropped (line 44-46 filters out any household
missing either parents or children — so single-parent, guardian-only, or
foster households simply vanish from the galaxy with no indication why).
Beyond the household-logic bug, showing a named minor's age and family
position as an interactive graphic to anyone with an Intelligence login is
exactly the kind of "merely awkward for adults, unacceptable for a
13-year-old" pattern the policy flags — it's not operational data, it's a
toy built from minors' PII.

**What a volunteer leader would need:** Nothing here helps a leader change a
student's week. This is a demo-day feature, not a ministry tool.

---

## #32 — Heatmap of Life (`src/components/LifeEventsHeatmap.tsx`, `src/utils/heatmap.ts`)

**Verdict: DEMOTE** (birthdays only; cut anniversaries/deaths from this
population)

**Does it survive the school year?** N/A — this is a calendar-day density
grid (`heatmap.ts:11-55`) for birthdays/anniversaries/deaths, unrelated to
attendance or grade cliffs. No claim to evaluate there.

**False positive / false negative cost:** Low stakes as a birthday-clustering
tool for card/shoutout planning, which is a legitimate small use.

**Minor-safety flag:** Real one. The same `students` array (all ages, all
minors included) feeds a **death-date heatmap**
(`calculateDeathHeatmap`, `heatmap.ts:65-67`, wired into the UI via the
`eventType` selector, `LifeEventsHeatmap.tsx:10-19,47-49`). Running a "which
calendar days have the most deaths" visualization over a population that
includes students is macabre regardless of whether any student record
currently has a `deathDate` set — the field and the code path exist and will
render for the youth roster the day the field is populated. This should not
be built as a generic view over the whole church file; if it exists at all it
belongs scoped away from minors.

**What a volunteer leader would need:** A birthday list scoped to their own
small group with grade shown, not a whole-church heatmap grid a leader has
to visually parse for one row of interest.

---

## #33 — Demographics / Generation Stack (`src/components/GenerationStack.tsx`, `src/utils/demographics.ts`)

**Verdict: CUT** (for youth purposes — doesn't answer a youth-ministry
question, and actively obscures the one that matters)

**Does it survive the school year?** No — and worse, it's built on the wrong
axis entirely. `GENERATIONS` (`demographics.ts:9-17`) buckets by **birth
cohort** (Gen Alpha 2013-present, Gen Z 1997-2012, etc.), a marketing
taxonomy with 15-25 year bins. For a grades 6-12 ministry the entire student
population (11-18 year olds) lands inside a single "Gen Alpha"/"Gen Z"
boundary split with no visibility into grade, let alone the 5th→6th, 8th→9th,
or graduation cliffs my brief specifically asks about. This is the single
clearest "no cliffs represented anywhere" data point in the whole area — a
feature literally named "Demographics" that had every input needed
(`student.pcoGrade`, `student.birthdate`) to show a grade-band bar chart and
instead shows a chart that cannot distinguish a 6th grader from an 18th
grader most of the time (both frequently fall in the same "Gen Alpha"/"Gen Z"
bucket depending on the year).

**False positive / false negative cost:** Not applicable as a drift signal,
but as a planning tool it will actively mislead a youth pastor who opens it
expecting a middle-school/high-school split and gets a generational-marketing
chart instead.

**Minor-safety flag:** Low — aggregate counts only, no names.

**What a volunteer leader would need:** A grade-band bar chart (6th, 7th,
8th... 12th) with the three cliff years annotated. This exact file could be
that with a two-line change to the bucketing function; as shipped it isn't
useful to me at all.

---

## #34 — Map View (`src/components/MapView.tsx`, `src/utils/geospatial.ts`)

**Verdict: CUT**

**Does it survive the school year?** N/A to grade cliffs — this is a
city-clustering tool for campus-planting decisions
(`suggestCampusLocations`, `geospatial.ts:32-41`), not an attendance or
retention feature. It has no relevance to youth ministry as pitched and I'd
flag it as NOT MY LANE except that it fails the child-protection test my
brief specifically asks me to apply, which makes it my lane.

**False positive / false negative cost:** A city with a handful of members
gets recommended or dismissed as a "plant" site based on aggregate counts
with no confidence interval — an operational risk, not mine to score.

**Minor-safety flag:** Yes. `calculateCityClusters`
(`geospatial.ts:8-30`) runs over the same all-ages `students` array with no
`isChild` exclusion, so every minor's home city counts toward a
publicly-charted, city-labeled bar (`MapView.tsx:70-97`) with **no minimum
group size**. `suggestCampusLocations` only filters by the *suggestion*
threshold (default 15, user-adjustable down to 5 via slider,
`MapView.tsx:21,53-61`) — the underlying bar chart itself shows the **top 20
cities regardless of count**, including cities with a count of 1
(`clusters.slice(0, 20)`, no minimum). In a small or rural congregation, a
city with one household in it, labeled by name on a bar chart, combined with
a "Solar System" view that shows that same household's children by name and
age, is a straightforward re-identification path for a single minor's town
of residence — exactly the "location maps... unacceptable for a 13-year-old"
case named in my brief. It is not a literal pin-on-a-map of a home address,
but city-level de-anonymization with n=1 is a real gap, not a hypothetical
one, and it's trivial to fix (minimum cluster size before charting).

**What a volunteer leader would need:** Nothing — this is a facilities/church-planting
tool, not a youth tool, and shouldn't touch minors' address data without a
k-anonymity floor regardless of audience.

---

## #35 — Global Pulse (`src/components/GlobalPulse.tsx`)

**Verdict: CUT**

**Does it survive the school year?** N/A, and this is the clearest case in
the area of "simulated numbers presented as real insight" the audit brief
calls out. `GlobalPulse.tsx:20-51`: "Retention Rate," "Engagement," and
"Growth Velocity" for the **global comparison side are hardcoded literals**
(`Global: 60`, `Global: 55`, `Global: 45`) with an explicit code comment
admitting it — `// Assume some mock values for Local vs Global` (line 19) —
and the "Local" side for those same three rows is also hardcoded
(`Local: 65`, `Local: 50`, `Local: 40`, marked `// Mocked` inline). Only two
of five radar axes ("Data Accuracy," "Health Score") are computed from real
data; the other three are fabricated on both sides and rendered in the same
visual style with no distinction. This has nothing to do with youth
ministry specifically, but it does mean any "how does our student
engagement compare to the network" reading a pastor might draw from this
radar chart is fiction with a chart around it.

**False positive / false negative cost:** A youth pastor who trusts the
"Engagement" or "Retention Rate" axis against a peer church is comparing
real numbers to invented ones without any label saying so.

**Minor-safety flag:** None specific to minors.

**What a volunteer leader would need:** Nothing — not a leader-facing tool
and shouldn't ship with fabricated benchmark data regardless.

---

## #36 — Sentiment Pulse (`src/components/SentimentPulse.tsx`, `src/utils/sentiment.ts`)

**Verdict: CUT**

**Does it survive the school year?** N/A — not an attendance/grade feature.

**False positive / false negative cost:** N/A as a drift signal, but as a
"read the room" tool it's a word cloud of prayer-topic *category* labels
(Financial, Health, Grief, Anxiety, Addiction —
`mock-api/data.js:96`) with no time window, no grade filter, and no
distinction between a 12-year-old's prayer request and a 70-year-old's. A
leader cannot use this for anything actionable about their students.

**Minor-safety flag:** This is the sharpest violation in the area.
`calculateSentimentPulse` (`sentiment.ts:8-31`) runs over the full,
unfiltered `students` array — meaning every minor's `prayerTopic` field
feeds directly into a public "Spiritual Climate" word cloud
(`SentimentPulse.tsx:53` — "A word cloud derived from anonymized prayer
requests and comment themes") viewable by anyone with an Intelligence login.
Two problems stack here: (1) the label "anonymized" is doing work it hasn't
earned — the topics are categorical, not free text, so no name is attached
to a given instance, but in a small youth group a leader who knows which
students exist and which topic is rare (e.g. the single "Addiction" entry
that week) can trivially infer whose it is; (2) this is precisely the
category my brief names as a hard line — "'sentiment' inferred from anything
a student wrote... unacceptable for a 13-year-old" — and there is no
age/grade exclusion anywhere in the pipeline that keeps a minor's prayer
category out of this aggregate. There is also no parent-consent framing at
all; a student's prayer request, entered for pastoral care, is being
repurposed as an executive-dashboard visualization with no notice to the
family that it would be used that way.

**What a volunteer leader would need:** Nothing — and this feature
shouldn't exist in its current form for any population that includes minors.
If church leadership wants aggregate prayer-topic trends for adults, that's
a defensible feature; it needs an explicit exclusion for every record where
`isChild` is true (or, better, grade-based, since PCO's `child` flag doesn't
reliably track with youth-ministry age bands either) before it ships.

---

## Summary table

| # | Feature | Verdict |
|---|---------|---------|
| 29 | Attendance Pulse | CUT |
| 30 | Check-in Velocity | NOT MY LANE |
| 31 | Solar System | CUT |
| 32 | Heatmap of Life | DEMOTE |
| 33 | Demographics / Generation Stack | CUT |
| 34 | Map View | CUT |
| 35 | Global Pulse | CUT |
| 36 | Sentiment Pulse | CUT |

## Bottom line for Area D

Not one of these eight features can answer the question this area is named
for. There is no per-student attendance ledger, no event/ministry filter, no
grade field used anywhere, and therefore no way to see the 5th→6th, 8th→9th,
or graduation cliffs, and no way to tell a student who missed three Sundays
for soccer from one who's gone quiet at small group — the aggregate weekly
line in Attendance Pulse (#29) is the closest thing to an attendance feature
in this area and it can't see individual students at all, only a whole-church
check-in count with every event type (kids, adults, youth, serving teams)
summed together. Meanwhile two features (#34 Map View, #36 Sentiment Pulse)
run directly over minors' city-of-residence and prayer-topic data with no
age exclusion, no k-anonymity floor, and no access control finer than "logged
in as Intelligence" — that is a child-protection gap, not a UX nitpick, and
it should block ship regardless of what Area D becomes next round.
