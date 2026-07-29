# Area D — engagement-analytics — Round 2 (Children's Ministry critique)

Reviewer: children's ministry director persona. Attacking `proposal-v1.md`.

## 1. Factual claims — verified, with one load-bearing error the proposal built its whole #29/#30 case on

Confirmed accurate: `PcoCheckIn.attributes.kind` is real (`pco.ts:115`) and the
mock fixture genuinely sets both `'Regular'` and `'Volunteer'` values
(`mock-api/data.js:307,354,375,413`); `fetchRecentCheckIns` defaults `maxPages`
to 100 (`pco.ts:507`) and both `AttendancePulse.tsx:27` and
`CheckInVelocity.tsx:22` call it, so the "one feature charted twice" claim
holds; `transformPerson` really does return `null` for any unparseable
birthdate (`pco.ts:233-235`), confirming the area-wide denominator problem;
the Co-Pilot `sentiment-pulse` deep-link dependency at `copilot.ts:304-328` is
real and would dead-end without D2's cross-area edit.

**The error: the "kind filter yields the ratio" claim is false as specified.**
I traced the fixture the proposal cites as evidence
(`mock-api/data.js:280-419`). `kind: 'Regular'` is not "kids checking into
class" — it's used for **both** children checking into Kids Church
(`event: '2'`, line 331) **and** adults checking into Sunday Worship Service
(`event: '3'`, lines 375, 387, 399). Filtering to `kind: 'Regular'` alone still
sums kids and worshipping adults into one number — exactly the defect I raised
in Round 1, unfixed by this filter.

Worse: even with the event filter D4 proposes as the second half of the fix,
there is **no event ID that has both attendee and volunteer check-ins for the
same room**. Kids Church attendees check into event `'2'`
(`data.js:335`, "Sunday Kids Church"). The volunteers who staff that room check
into event `'4'` (`data.js:355`, "Kids Ministry Team") — a *different* event ID
entirely (`data.js:232-235`), with no relationship in `PcoEvent` or
`PcoCheckIn` connecting the two. Select event `'2'` in the proposed dropdown
and the volunteer series is always zero. Select event `'4'` and the attendee
series is always zero. **The two-series "attendee vs. volunteer" chart D4
promises cannot be built from this data model** — not a UI gap, a missing
relationship (room/team pairing) that doesn't exist on the wire.

Also false: D4 claims the event filter "answers... children's '9am vs 11am'
objections." I grepped the entire fixture and `pco.ts` for a service-time
split — there is exactly **one** `'Sunday Kids Church'` event ID and **one**
`'Sunday Worship Service'` event ID, total, for the whole year
(`data.js:216-241`). There is no data anywhere distinguishing a 9:00 service
from an 11:00 service. This objection is not answered by the proposed fix; it
is not answerable with data Locus currently fetches.

## 2. Does Velocity-as-a-tab fix "no station, service, bottleneck," or hide it?

**Hides it, and the copy fix makes the hiding more dangerous, not less.**

The tab framing does nothing about the structural problem: `PcoCheckIn`
(`pco.ts:110-121`) still has no location/room relationship, so there is still
no way to know Preschool Room 2 is 8 minutes behind at 9:24 — my Round 1
finding stands unchanged by D4. Renaming away from "Real-time" and to "Sunday
Arrival Pace" is a genuine, welcome fix to the honesty problem (one of my four
sub-complaints), but it leaves the "not fixable" complaint completely
untouched — arrival-pace-per-5-minutes still gives a director nothing to act
on mid-rush.

And per §1, the specific thing D4 promises this merge earns — the kid-to-
volunteer ratio — is not deliverable from the current event model. So the
proposal is folding an undeliverable "ratio" claim and an unfixable "no
station" chart into one screen and presenting both as resolved. A tab
under a trusted-looking "Attendance" screen, captioned as delivering "the
ratio number a director needs every Sunday," is **more** likely to be acted on
than a standalone toy chart, not less. If a director staffs Preschool Room 2
based on a chart that silently returns zero-volunteers-detected for every
event they select (because volunteer and attendee check-ins never share an
event ID), that's a false-confidence failure exactly on the safety axis my
brief names as primary.

**What it would actually take to build this, or the concession that it can't
be:** a room/location field on `PcoCheckIn` (PCO's real Check-Ins v2 API
supports `include=locations`; Locus's fetch never requests it, confirmed —
`pco.ts:507-531`), or at minimum an explicit pairing table mapping each
attendee event to its staffing event(s) (`'2'→'4'`, `'1'→?`, unclear even in
the fixture). Absent either, concede it: the kid-to-volunteer ratio is **not
buildable today**, and D4 should stop promising it. Ship the arrival-pace tab
honestly labeled as historical pace only, with an explicit note that it cannot
show room-level ratios, or cut it.

## 3. Attacking the decisions I disagree with

**#29/#30 MERGE — REJECT as justified; the merge itself (one fetch, one nav
slot) is fine, but it should not be sold as resolving youth's CUT.** Given §1,
the proposal's own tiebreaker argument against youth ("CUT would be correct if
the numbers were fabricated; they are not... the fix is a groupBy plus a kind
filter") is wrong on its own terms — the fix as specified produces a chart
that cannot answer the question it's being kept to answer. My verdict:
DEMOTE stands, ship the merge as a data-hygiene-adjacent utility, and drop the
promise of a ratio number from the description until a room/team relationship
exists in the data model.

**#34 Map View k-anonymity floor — REJECT as insufficient, on two independent
grounds.**

1. **The number 5 is undefended.** D5 sets `minClusterSize` to a hardcoded
   default of 5 in the same bullet that also switches the count from
   per-person to per-household (`geospatial.ts:11`) — meaning "5" was set
   before the denominator changed and never re-derived after. Section 5, Q2 of
   the proposal's own unresolved-questions list asks round 2 to pick the
   number, which is an admission it isn't resolved. My answer: a fixed global
   constant is the wrong shape regardless of value. A floor of 5 households in
   a 3,000-member urban congregation protects almost nothing extra; a floor of
   5 households in a 150-person rural church can still be a named town where
   "5 households" is a third of the church's footprint in that town and
   trivially narrowable by anyone who knows the congregation. The floor must
   scale to total mapped households (e.g., `max(10, ceil(0.05 * totalHouseholds))`),
   not sit at a single constant across every deployment size.
2. **D5 drops my Round 1 recommendation to filter to `isChild` before this
   ships**, and I re-checked: `MapView.tsx:20-31` still receives the full,
   unfiltered `students` prop with no `isChild` filter added anywhere in D5.
   This means the shipped feature answers neither question cleanly — it isn't
   safely anonymized (per point 1) and it isn't actually "where do our kids
   live" (my proposed legitimate use), it's still "where does the whole
   roster live," carrying re-identification risk for a population that
   includes minors while delivering zero children's-ministry value. **A floor
   is not sufficient on a whole-roster chart; it needs both the floor scaled
   to congregation size and the population scoped to the actual question
   being asked**, or it should stay cut rather than renamed and reshipped as
   "fixed."

## 4. What it dropped from Round 1 that I still consider unresolved

* **The `isChild` filter on Map View** (§3 above) — dropped outright, not
  addressed or argued against, just absent from D5's bullet list.
* **The event/room-pairing gap underneath #29/#30** — my Round 1 said "no
  station" and named it as the fatal defect; the proposal's fix (D4) treats
  this as solvable with a `kind` + event dropdown, which §1 shows it is not.
  This is worse than a drop — it's a claimed resolution of an unresolved
  problem, which is more likely to mislead the next round than an honest
  "still open."

## 5. Concession

The area-wide `transformPerson` null-birthdate denominator problem (D9) is a
sharper, more useful generalization of my Heatmap placeholder-date finding
than I made in Round 1 — I scoped it to one chart; the proposal correctly
scoped it to the whole area (and beyond, into Areas C and F) and gave it a
single fix point instead of eight captions.
