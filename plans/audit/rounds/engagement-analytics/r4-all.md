# Area D — engagement-analytics — Round 4 (all four personas)

Scope, per instructions: the eight per-feature verdicts and the `isChild`
rejection are CONVERGED 4/4 and are not reopened. This round is exactly two
things, run against `proposal-v3.md`: (1) settle whether `city-distribution`
survives even as a link-only page + CSV export, or goes entirely; (2) verify the
`Guest`-check-in defect at `retention.ts` and the proposed `kind !== 'Volunteer'`
fix, and check whether the same predicate mistake recurs elsewhere.

---

## UXR

**City-distribution: CONVERGED — ships as link-only page + CSV export, zero nav
rows.** Nothing in round 4 disturbs my r3 ruling (`r3-uxr.md §1`). The nav-slot
test is about *standing* presence, not existence; a page reached by an explicit
link is a fundamentally different UI object from a sidebar row, and correctness
(real address data) only ever cleared that first gate, not the frequency gate.
Proposal v3 §3.1 took my ruling and admin's export idea and combined them
correctly — no slider, no suggestions panel, table + CSV, link-only. I have
nothing to add that isn't already there.

**Guest predicate: CONFIRMED, with one citation correction.** Re-read
`retention.ts` top to bottom: the filter is real, but it lives at **line 16**
(`if (checkIn.attributes.kind !== 'Regular') return;`), not lines 23-24 as v3
states. Line 23 is inside the sort step, three statements downstream of the
actual filter. This doesn't change the finding — the predicate is exactly what
v3 describes and the fix is exactly right — but "read the actual implementation,
cite file:line" is my own output contract, and the citation as written would
send someone to the wrong five lines. Fix the citation before this leaves the
document.

**Fix correctness:** `kind !== 'Volunteer'` is the right predicate for both
series. `aggregateCheckInsByWeek` (`attendance.ts:10-33`) currently filters on
`kind` not at all, so today's total already includes `Guest` — only the
first-time series was silently narrower than its own denominator. Applying the
same predicate to both closes that gap without introducing a new one. The
proposed card caption in D7 ("Regular and guest check-ins only — volunteer team
check-ins and small groups excluded") is the correct trust-labelling move and
matches the corrected filter precisely — this is exactly the kind of
"which numbers are real" clarity my persona cares about, and it's earned here,
not just asserted.

**Verdict: CONVERGED — NO RESIDUAL OBJECTIONS**, one non-blocking citation fix
noted above.

---

## Church-Admin

**City-distribution — settling it: CONVERGED, ships as link-only page + CSV
export, all three blocking fixes mandatory, all-or-nothing.**

I came closest in r3 to arguing this out of existence entirely
(`r3-church-admin.md §3`: "at most, someone screenshots this chart once into a
deck somebody else is building"). Taking my own argument one step further to see
if it completes the trip to zero: the thing that made me uneasy about the *route*
was standing exposure — a per-family location artifact anyone with Intelligence
access can open on a whim, for a decision made once a half-decade. That
objection is about **presence**, not existence. Once the route is gone, what's
left is a table of top-N cities and household counts, post-k-anonymity-floor,
post-household-dedupe, post-null-exclusion (D9's three blocking fixes), behind an
explicit link. The CSV export is the same aggregate rows, not a raw address dump
— no name, no address, no per-person row survives the household rollup. That is
not the governance object I was worried about; that object (a per-family roster)
never ships under D9 as written.

Running my own two gates on what's left:
- **Would we actually open this?** Rarely — once every several years, by
  whoever is doing site-selection work, exactly as I said in r3. But the *cost*
  side of my own "budget question" test has also collapsed to near zero: no nav
  upkeep, no route, no interactive control to maintain, reusing
  `calculateCityClusters` that's already being fixed for D9's other reasons.
  Rare-but-real value against near-zero standing cost clears my bar; it would
  not have cleared it as a permanent sidebar chart.
- **PCO overlap:** none, honestly — PCO People can export raw address lists, but
  it does not do household-deduplicated, k-anonymized city rollups. A director
  who wants this today builds it by hand in a spreadsheet from a raw PCO export,
  which is strictly worse for privacy (no suppression, no dedupe) than what D9
  specifies. This is one of the few items left in this document I can't name a
  native equivalent for.

Deleting the computation entirely, versus shipping it link-only-with-fixes,
would mean the once-in-five-years director goes back to hand-rolling this from a
raw people export — more exposure, not less. **I do not extend my r3 argument to
full deletion. CONVERGED on v3 §3.1/§3.2/D9 as written**, including the
all-or-nothing condition: if any of the three blocking fixes slips, pull the
whole thing, export included.

**Guest predicate: CONFIRMED, and it's worse from where I sit than the writeup
states.** I hold the token and I sign off on what Sarah reports to the board.
The first-time-guest number is the one metric in this whole area that a
newcomer-follow-up conversation actually depends on, and a silent zero-Guest
undercount in the fixture means this would have shipped, tested green, and
under-reported first-time visitors from week one against real data — nobody
would have caught it until a board member asked "why does this number never
match what the welcome team counted at the table." `kind !== 'Volunteer'` is the
correct fix for both series, matching what I already certified as real data in
r3 §1.

**New fact, not a reopened verdict:** the identical mistake —
`kind === 'Regular'` used as if it were the only non-volunteer value — also
appears at `drift.ts:31`, `givingTrends.ts:26`, and `sermons.ts:42`. All three
are outside Area D (drift is already an Area C hand-off in v3 §3.7/Q7 for a
different reason; giving/sermon correlation isn't an Area D screen). I'm not
reopening anything here — flagging it because it's the same class of bug
recurring in files this critique never touched, and Area C should know before
round 5 closes the door on it.

**Verdict: CONVERGED — NO RESIDUAL OBJECTIONS.**

---

## Youth Ministry

**City-distribution: not my lane, as in r3.** Nothing about campus siting
touches grade, drift, or minor safety beyond what I already ruled on in
`r3-youth.md §3` (the `isChild` rejection, which stands and isn't reopened). I
defer to UXR and admin on the frequency/export question and have no basis to
object to their CONVERGED ruling above.

**Guest predicate: CONFIRMED, and it touches my one surviving hand-off.**
Verified `retention.ts`'s filter and the fixture's zero-`Guest` count myself —
matches v3 exactly (mock data: 6 `Regular`, 3 `Volunteer`, 0 `Guest` literals).
`kind !== 'Volunteer'` is correct for both `attendance.ts` and `retention.ts`.

While tracing this I checked whether the same mistake reaches the one thing I
depend on: `drift.ts:31` filters `c.attributes.kind === 'Regular'` before
building the per-person check-in history that `calculateDriftRisk` runs against
— the same bug, in the exact file my cliff-cohort filter (proposal §3.7) sits on
top of. Practical effect on my hand-off is limited, not zero: drift candidates
require 6+ months of tenure (`drift.ts` baseline/recent windows), so a student
whose *only* history is recent `Guest` check-ins won't have enough tenure to
enter the candidate pool regardless — but a longer-tenured student who
occasionally checks in as `Guest` at a second-campus or guest-service event
would have those visits silently dropped from both their baseline and recent
rate, which can only ever bias `dropPercentage` upward, i.e. manufacture false
positives. That's exactly the failure mode my persona cares about (leaders
chasing a student who's fine) and it stacks on top of the calendar-blind window
I already flagged in r3. I'm not adding a new blocking item to Area D — `drift.ts`
is Area C's file and already on the hand-off list — but Area C should fix this
alongside the window issue, not as a separate ticket discovered a third time.

**Verdict: CONVERGED — NO RESIDUAL OBJECTIONS** in Area D. One addition to the
existing Area C hand-off note (§3.7/Q7), not a new Area D objection.

---

## Children's Ministry

**City-distribution: CONVERGED, conditional ACCEPT from r3 stands.** My r3
condition (`r3-children.md §3`) was never about nav placement — it was about
whether the k-floor, household dedupe, and null-exclusion all ship together as
blocking. Nothing in the link-only-plus-CSV framing changes that math. The CSV
export is the same post-suppression, post-dedupe, aggregate city+count rows the
page shows — no address, no name, no per-person row, nothing that wasn't already
in the table. That's still a Census-tract-style disclosure, not a roster export,
and still not "a map of where kids live." My condition carries forward
unchanged: if any one of the three blocking fixes ships without the other two,
my verdict reverses to zero, export included. As specified in D9, it doesn't.

**Guest predicate: confirmed correct, and it's not quite my lane but it lands on
something I already flagged as under-served.** The newcomer funnel isn't a
check-in-safety concern — no ratio, no pickup, no allergy flag touches it — so
this isn't a safety-axis objection. But I said in my own brief that "new-baby and
new-family workflows are the highest-value moments in the whole system and the
ones most often missed" (persona point 8), and a silently-undercounted
first-time-guest funnel is exactly that miss, mechanically: the fixture's
children's events (`mock-api/data.js` events `'1'`/`'2'`, both `kind: 'Regular'`
per the traced pushes) hide the bug precisely because no first-time check-in at
the kids' welcome desk is ever recorded as `Guest` in dev data — but that is the
canonical real-world case: a new family's child gets checked in as a guest at
the classroom door before anyone's filled out a full registration. Confirmed the
fix (`kind !== 'Volunteer'`) is correct and doesn't touch anything check-in-desk
facing — it's a downstream aggregation change, zero cost at the table on Sunday
morning.

**Verdict: CONVERGED — NO RESIDUAL OBJECTIONS.**
