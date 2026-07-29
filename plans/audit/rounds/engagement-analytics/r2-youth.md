# Area D — engagement-analytics — Round 2 (youth-ministry) — Adversarial

## 1. Factual verification

The proposal's load-bearing code claims check out. Verified independently:

- `PcoCheckIn.attributes.kind` and `relationships.event.data.id` both exist
  (`src/utils/pco.ts:113-121`); `fetchEvents` exists and hits
  `/api/check-ins/v2/events` (`pco.ts:491-503`). The `kind` split and event
  filter are buildable from data already on the wire — no correction needed.
- `aggregateCheckInsByWeek` (`attendance.ts:10-33`) is confirmed to be a
  pure weekly-bucket reducer with **no per-student output** — it takes
  `PcoCheckIn[]` and returns `{week, date, count}`. Filtering its input by
  `kind`/`event` narrows the population; it does not add a student dimension.
  This matters for §2 below.
- Zero grade/`isChild` references across Area D except `SolarSystem.tsx:36`
  — reconfirmed by grep, matches both my r1 and the proposal's own claim.
- `copilot.ts:10,305,326,334` cross-dependency on `calculateSentimentPulse`
  and the `sentiment-pulse` deep-link — confirmed, real, correctly scoped
  into D2.
- Mock fixture events (`mock-api/data.js:213-239`) confirmed: five events,
  no "small group" event exists anywhere in the fixture or in `PcoEvent`
  usage. This is the fact the proposal's Attendance merge doesn't reckon
  with — see §2.

One thing the proposal did **not** verify and should have: `GENERATIONS`
bucket math is unchanged in its D6 fix, and its proposed `MINISTRY_BANDS`
source-of-truth choice is backwards. See §3.

## 2. Does the merged Attendance screen do anything for me?

Partial credit, then a hard no on the part that matters most.

**What it does fix:** an event filter on `relationships.event.data.id` lets
me select "Friday Night Live" and get a weekly line scoped to just my
ministry, instead of kids-church-plus-worship-plus-serving-teams summed
into one number. That's a real answer to the "whole-church aggregate"
half of my r1 CUT — I'll take it.

**What it does not fix, and cannot fix with the data this app reads:**
small-group vs. big-service is not a `kind` split (`Regular` vs `Volunteer`
is attendee-vs-staffer, not big-room-vs-small-group) and it is not an event
filter either — I checked the fixture (`mock-api/data.js:213-239`) and there
is no small-group event in Check-Ins at all. Small groups live in PCO
Groups, and the standing context at the top of the feature inventory says
Locus deliberately does not read PCO Groups. So the merged screen's ceiling,
even after every fix in D4, is "weekly count for one big-room event,
split attendee/volunteer." It cannot ever show me a kid who's still coming
to Friday Night Live but has stopped showing up to small group — which is
*the* signal in my r1 brief, not a nice-to-have.

Grade-band segmentation and the three cliffs are also untouched.
`aggregateCheckInsByWeek` after D4's fixes is still a scalar-per-week
reducer with no grade axis — nothing in D4 adds a per-student join or a
grade dimension to `attendance.ts`. So if a 6th grader who just crossed the
5th→6th cliff quietly stops appearing in the Friday Night Live line, the
merged screen shows the same aggregate number moving by one, indistinguishable
from any other absence.

**Minimum that would change this:** (a) a per-student check-in ledger —
join `PcoCheckIn.relationships.person.data.id` back to `Student` so a leader
can see *which* kids attended, not just how many; this is the one thing
that would make "3 Sundays" vs "3 Sundays + zero small-group" distinguishable,
and (b) if the answer to small groups really is "out of scope, no PCO
Groups access," the screen needs to say so in its own UI, not imply
completeness by sitting under a route called `attendance`. Silence on that
gap is worse than the honest label church-admin is asking for elsewhere in
this proposal (D5's "Cities Above Threshold" rename). Apply the same
honesty standard here: this is "Friday Night Live weekly volume," not
"student attendance," until it has a per-student view.

## 3. Decisions I attack

**D6 — Demographics ministry-band mode, source-of-truth choice.** The
proposal writes: *"Band assignment: `pcoGrade` when present, `age` as
fallback."* That is exactly backwards, and it contradicts the single
loudest point in my own persona brief: grade is the most volatile field in
the database, stale every August until someone manually promotes it. The
codebase already computes the right thing and ignores it: `calculatedGrade`
(`pco.ts:79,244`, via `calculateExpectedGrade` in `grader.ts:12-30`)
derives grade from birthdate with a September 1 school-year cutoff — it is
never stale, and it's already sitting on every `Student` record. `pcoGrade`
is the raw, manually-entered, frequently-wrong field the rest of this app
(Data Health, the whole Diagonal of Truth) exists to catch and fix. Building
a brand-new "ministry bands" chart whose entire value proposition is
grade-cliff accuracy, and wiring its primary source to the field most
likely to be wrong, will produce a middle/high-school split that
misclassifies exactly the promoted-over-summer kids the chart is supposed
to show cleanly. **Fix: reverse it — `calculatedGrade` primary, `pcoGrade`
only as a secondary "N students' recorded grade disagrees with expected
grade" caption**, which also gives Area A a second bounty for free.

**D5 — k-anonity floor of 5.** I raised this as blocking in r1 and the
proposal accepted the veto, but the number it picked (`minClusterSize`
default 5) is the same number already sitting on the existing "suggestion
threshold" slider's own minimum (`MapView.tsx:56`, `min="5"`) — i.e., the
floor being proposed as a safeguarding fix is identical to the number
church-admin already implicitly rejected as too low when discussing the
*suggestion* threshold, just repurposed for the *display* threshold. Five
named households in a town, cross-referenced against a public church
directory or a Sunday bulletin, is not anonymous in a rural or small-suburb
congregation — it's a shortlist. Raise the display floor to 10 and make it
non-configurable (unlike the suggestion threshold, which can stay
user-adjustable for the business decision it supports). This is a chart
that runs over a roster including minors' addresses; it should not use the
same weak default as a discretionary business slider.

## 4. What it dropped from r1 that I still consider unresolved

Nothing from my r1 was silently dropped — the proposal engaged with all
three of my CUT-worthy safety findings (Solar System, Map View, Sentiment
Pulse) and the k-anonymity floor specifically. But two things are
under-resolved, not absent:

1. **The k-anonymity number itself** — addressed above (§3), and the
   proposal's own open question #2 admits it isn't settled. I'm setting it:
   10, non-adjustable, for the display chart.
2. **The event-mixing fix stops at the event level, not the population
   level.** My r1 flagged that check-ins mix minors and adults with no
   `isChild`/grade split anywhere. D4 adds an event filter (which happens to
   separate youth from adults *if* your church runs a dedicated youth
   event, which mine does) but does not add an explicit age/grade
   dimension to the underlying `attendance.ts` functions. A church without
   a cleanly separate youth event has no way to isolate students at all,
   even after every D4 fix ships. This should be a parameter on
   `aggregateCheckInsByWeek`/`calculateCheckInVelocity`, not an implicit
   side effect of picking the right event from a dropdown.

## 5. Concession

D9's diagnosis that the null-birthdate exclusion is one bug in
`transformPerson` silently undercounting all eight Area D charts, not
eight separate captioning problems, is a better and cheaper fix than
anything in my own r1 — I'd only asked for a school-year-aware calendar,
I hadn't caught that the denominator itself was already wrong upstream of
every chart in this area.
