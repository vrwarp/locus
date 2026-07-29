# Area C — pastoral-ops — Round 5 (all four critics, final sign-off)

Scope per moderator: all ten verdicts in `proposal-v4.md` §2 are CONVERGED and
not reopened. Q9, Q11 and Q12 are closed and not reopened. This round rules on
the three items `proposal-v4.md` §8 left open:

1. the `keyVolunteerLookbackWeeks` default of 26 (§3.2);
2. the `retention.ts:16` `Guest` fix and its fixture (§4);
3. grep-level confirmation that no Area C surface still renders clearance (§3.3).

Each persona below was read and adopted in full before writing its section.

---

## UXR

**SIGN-OFF. CONVERGED — no residual objections.** All three items ruled on
below. One new defect found on the ship-first screen; it is a *fixture* defect,
not a verdict change, and it attaches to work item 6.

### 1. `keyVolunteerLookbackWeeks = 26` — **stamped, with a rendering condition**

**Verdict: KEEP 26 as the default. Do not reopen 26-vs-13 as a design debate.**
It is a configurable value with a default (§6 item 8), and the two things that
actually govern whether this list is usable are not the number.

The reason to stop arguing about it: widening `personStats` from 8 to 26 weeks
does not change *who is missing* — the missing gate stays `recentCount === 0`
over 2 weeks (`missing.ts:79`). It changes *who is eligible to be called
missing*, i.e. the denominator. The user moment: Sarah opens `attendance-risk`
on a Monday, and where she used to see six names she now sees a longer list
containing someone whose last shift was in February. If the row does not tell
her that, the number 26 is the least of the screen's problems; if the row does
tell her, 26 is strictly more useful than 13 because she can see and dismiss
the stale entry herself.

So 26 ships **conditional on three things v4 already specifies** — I am
promoting them from incidental to load-bearing:

- **Longest-missing-first default sort** (§6 item 10). With a 26-week lookback
  this is what puts the 5-month-old entries at the bottom, where they read as
  "long tail", instead of interleaved.
- **Drop the `Math.max(2, missingWeeks)` floor** (`missing.ts:94`, §6 item 10).
  Under an 8-week window this floor was merely wrong; under 26 it actively
  lies — it prints "2 weeks" over someone last seen in February.
- **A visible last-served date on the row.** Not new work: `stats.lastSeen`
  (`missing.ts:65-67`) is already computed and already carried onto
  `MissingVolunteer.lastSeen` (`missing.ts:100`). Render it. A raw date is a
  better staleness cue than any threshold tuning.

Plus screen copy naming the window in plain words: *"No check-in in 2 weeks;
served at least twice, or served solo at least once, in the last 26."* Locus'
standing trust problem in this area is heuristics presented as facts; a
one-line window statement is the cheapest available fix for it.

### 2. `retention.ts:16` — **fix confirmed, and the fixture is bigger than v4 thinks**

**The one-line inversion is right.** `if (checkIn.attributes.kind ===
'Volunteer') return;` matches the comment on `retention.ts:15` and stops
`Guest` being silently dropped. §4's mis-dating analysis holds: `dates[0]`
(`retention.ts:36-38`) feeds `isAfter(firstCheckIn, oneYearAgo)`
(`retention.ts:39`), so a first-visit-as-`Guest` person is dated from their
*second* visit. Adopt as written.

**New defect, found this round, on the same screen — the demo funnel is a
straight line.** I ran `calculateNewcomerFunnel`'s exact logic over
`mock-api/data.js`:

```
regular-kind people: 154   newcomers: 28   funnel: [28, 28, 28, 28]
```

Every bucket is 28. `NewcomerFunnel.tsx:62-68` divides `data[3].value` by
`data[0].value` and renders **"Retention Rate 100%"**. That is the
mock-data-presented-as-insight failure in its purest form, on the screen this
area ships first, and it is visible today.

Cause, and it is directly relevant to the fixture question §8 asked:

- The 40 people `mock-api/data.js:423-500` generates *specifically to model the
  funnel* — one-and-done 40%, two-time 30%, shopper 20%, sticker 10% — are
  pinned to hardcoded 2024 dates (`data.js:442-443` `new Date(2024, 0, 1)`;
  `data.js:486` `new Date(2024, 11, 31)`). Against a 12-month window they are
  all outside it. **The entire designed newcomer cohort renders as zero.**
- The recurring cast is generated *relative to today* (`data.js:247-248`,
  `subWeeks(today, 52)`). So the 28 "newcomers" the funnel actually shows are
  long-time regular attenders and children who happen to have started just
  inside 12 months — all of whom naturally have 4+ visits. Hence the flat line.

**Consequence for the `Guest` fixture, which is the point:** a `Guest` row
added to the newcomer generator inherits the 2024 anchor and stays invisible,
and the repair is once again unverified — the exact failure §4 was trying to
prevent. Either re-anchor `generateNewcomers` to `today` (same `subWeeks`
treatment the rest of the file already uses) or add the `Guest` row to the
relative-dated Sunday generator (`data.js:319-340`). **The unit fixture in
`retention.test.ts` is mandatory either way** — `retention.test.ts:70-84`
currently has an `excludes volunteers` case and no `Guest` case, and a unit
test is the only thing that stops the predicate being re-inverted.

Add to §6 item 6(c): *re-anchor the newcomer generator to `today`.* ~20 min.

### 3. Clearance grep — **confirmed clean**

`grep -rn "passed_background_check" src/ mock-api/` → **zero matches**. N2 is
net-new fetch work; there is nothing rendering it to leak outside Recruitment.

Background-check state renders in exactly two places today, both fabricated-field
readers, both inside the deletion set:

- `AutomationsReport.tsx:215-260` — "Background Checks (Expiring Soon)" and
  "Expired Background Checks (Safe Sanctuary)" → deleted by §6 item 3.
- `copilot.ts:252-253` — "Expiring Background Checks" / "Expired Background
  Checks" summary rows → deleted by §6 item 4.

One grep false positive worth recording so the next reader does not re-flag it:
**`BusFactorGraph.tsx:51-58` renders "All Clear! / No volunteers found serving
solo in critical teams." That is an empty state, not a clearance badge.** But it
is the *same fabricated-reassurance pattern* §6 item 7 fixes in
`BurnoutReport.tsx:74-78`, and item 7's fix does not reach it. With
`classifyEvent` misclassifying, `candidates.length === 0` and this screen
congratulates the church. **Item 11 should carry the same repair as item 7:
distinguish "zero solo coverage" from "we could not classify your events".**
Under 30 minutes inside work already scheduled on that file.

**Open question I would still want a real user for:** whether a 26-week list
with a visible last-served date reads as "richer" or "noisier" to Sarah on a
Monday. I would watch one session and count dismissals; I would not spend
another round arguing it.

---

## Church-Admin

**SIGN-OFF. CONVERGED — no residual objections** on the ten verdicts, on N1/N2,
on the deploy gate, or on Q9/Q11/Q12 as closed.

### 1. `keyVolunteerLookbackWeeks = 26` — **stamped. 26, not 13. This one is mine to call.**

I run the roster, so I will be blunt about why 13 is wrong for the org rather
than merely different.

A church volunteer roster turns over on a **program-year cycle**, not a
quarter. My kids-ministry teams run 4-to-6-week rotations; a person on a 6-week
rotation serves roughly eight times a year. My tech and worship people serve
monthly. Thirteen weeks is one season — run it in March and it cannot see the
Christmas cycle at all, which means it drops precisely the volunteer youth
named in round 4 (retreats and Christmas Eve, nothing else). Twenty-six weeks
spans two seasons and catches the monthly and rotational people who are the
actual backbone of a 1,200-person church. The failure mode of 26 is a longer
list; the failure mode of 13 is a shorter list that silently omits the people
Q9's `soloCount` OR was adopted to catch. Between "too many names" and "wrong
names", I take too many every time — a name I can dismiss costs me four
seconds, a name I never see costs me a volunteer.

Two conditions, both cheap:

- **`keyVolunteerLookbackWeeks` goes in the same config panel as everything
  else** (§6 item 8) **with its default visible.** A hidden constant at 26 is
  the same defect as the hidden constant at 8 this audit is fixing. Non-
  negotiable; it is already in the work list, I am marking it load-bearing.
- **This list never becomes a mail-merge.** A "missing" flag on someone whose
  last shift was in February is a pastoral conversation, not a task queue item.
  Nothing in §6 proposes a send button and nothing should acquire one.

**PCO overlap:** PCO Lists will do "checked in to team X in the last N days"
natively. What it will not do is OR that with "has ever covered a shift alone",
because PCO has no concept of solo coverage. That OR is the whole reason this
screen earns its slot over a saved List. Keep it, and keep the copy honest
about the limit (§3.2's "Locus does not know who else is qualified for a role").

**Governance:** none new. No new field, no new export, no third party. The
widened window reads check-ins Locus already fetches.

### 2. `retention.ts:16` — **confirmed, and the strongest argument for it is not in v4**

Would we actually open this screen? Yes — the newcomer funnel is the one report
in this area my executive pastor asks for **by name**, quarterly, before an
elders meeting. That is exactly why the flat 28/28/28/28 demo funnel UXR found
is a firing offence rather than a cosmetic bug: I would have walked into that
meeting and said "we retain 100% of newcomers", and the number would have been
composed entirely of people who have been here for years.

The argument for the inversion that v4 does not make, and should:

> **The current code is a whitelist of one label. The fix makes it a blacklist
> of one label. Only the blacklist survives a real church's Check-Ins config.**

`kind` is not a fixed enum in practice — it comes from how the church set up
Check-Ins, and I have seen "Guest", "Visitor", "First Time", and campus-specific
labels. `kind !== 'Regular'` drops **all of them**, silently, forever, at every
church that did not use the literal string `'Regular'` for its main
congregation. `kind === 'Volunteer'` encodes the actual stated intent — *count
attendance, exclude serving* — and is correct for every label a church invents.
This makes the fix a portability repair, not just a `Guest` repair, and it is
the reason it must not be deferred behind the other item-6 work.

**Ship it with both fixtures.** A `Guest` case in `retention.test.ts` and a
`Guest` row in `mock-api/data.js`, plus UXR's re-anchoring so the row is
actually inside the window. And take UXR's finding on the 2024 dates seriously —
if I demo Locus to another church and the funnel is a straight line at 100%, I
do not get a second meeting.

### 3. Clearance grep — **confirmed, with one deletion condition**

Agreed with the grep result. My condition is on the deletion, not the render:
**§6 item 3 must remove the `background_check_expires_at` field itself
(`pco.ts:17`, `:86`, `:299`), not only the two Automations lanes.** If the
field survives on the `Student` type as a nullable that nobody populates, the
next agent optimising for feature count will find it and render it somewhere,
and we will be back here. Delete the field, delete its mapping, delete its test
fixtures (`pco.test.ts:64`, `automations.test.ts:171`,
`AutomationsReport.test.tsx:9`, `copilot.test.ts:90`).

**What would make it worth the licence fee:** the numbers being right. That is
the whole of item 6.

---

## Youth Ministry

**SIGN-OFF. CONVERGED — no residual objections.**

### 1. `keyVolunteerLookbackWeeks = 26` — **concur, and from my seat 26 is the floor, not the ceiling**

I manage ~40 adult leaders. Their serving pattern is not weekly and never has
been: Wednesday programming leaders serve most weeks, but the retreat and camp
crew serve in bursts — and `mock-api/data.js:295`/`:319` even models retreat
weeks (`isRetreatWeek`), which is the one thing the fixture gets right about my
world.

Thirteen weeks run in March cannot see the winter retreat. Thirteen weeks run
in October cannot see summer camp. Both of those are the shifts where I most
often have a leader who covered a cabin or a small group alone — the exact
`soloCount > 0` case. So 13 does not just shorten the list, it deletes my
highest-signal volunteers from it. **26 is right; I would not object to 39.**

**Does it survive the school year?** Mostly, with one honest gap I am recording
rather than blocking on. A 26-week lookback run in September reaches back into
July and August, when nothing happens — the June 1 – Aug 15 suppression (§6
item 10) protects the *missing* side of the calculation but does nothing for
the *eligibility* side. A leader whose only qualifying shifts were in the spring
falls out of the 26-week window sometime in the autumn and quietly stops being
"key". That is a false negative, not a false alarm, so it costs me a leader I
should have called rather than a leader chasing a student who is fine. It is
acceptable at 26 and would be much worse at 13. The screen copy naming the
window (UXR's ask) is what makes it survivable — I can see the window and know
what it is blind to.

**Scope reaffirmed, and this is the part I care most about:** Q9 and the
26-week window live **entirely in the Volunteers population**. The Students tab
keeps its own predicate (`missing.ts:69`, `stats.recentCount`) over 8 weeks and
must never acquire a "key student" concept or a 26-week eligibility lookback. A
student who came twice in February is not "key" — labelling them so is the
adult-attendance-model-applied-to-teenagers error I spent three rounds
objecting to, and a 26-week window would make it worse, not better, because it
would resurrect students who have plainly moved on. Unchanged from v4 §3.2's
scope note; I am stamping it so it cannot drift back in.

### 2. `retention.ts:16` — **confirmed. It matters more for students than for adults.**

Mostly NOT MY LANE — the funnel is congregation-wide and does not split by age
or campus. But one thing in my lane, and it is the case the `Guest` kind exists
for:

**A student brought by a friend on a Wednesday gets checked in as a Guest.**
That is the single highest-value newcomer signal in youth ministry — an invited
friend is far more likely to stick than a walk-in — and under `kind !==
'Regular'` it is invisible. Not under-weighted: absent. Every one of those
students is dropped from `checkInsByPerson` entirely (`retention.ts:16`), so
they never appear in the "1st Visit" denominator and their second and third
visits never register as retention.

**False negative cost, concretely:** a leader asks me "how many of the friends
our students brought this spring came back?" and Locus answers zero, because it
never counted the first visit. I would trust the screen less after that
question than before it, and so would the leader.

**Gap, not a blocker:** the fix makes those students *counted*, not *visible* —
the funnel has no age or ministry split, so I still cannot see my cohort inside
it. I am not asking for a split; the area is subtracting, and a fourth
population toggle on the ship-first screen is not worth it. Recording it as a
known limit.

**Minor-safety flag:** none. The fix widens a count; it renders no student data,
no names, no contact paths.

### 3. Clearance grep — **confirmed, nothing in my surfaces**

Nothing in the Students population of `attendance-risk`, and nothing in any
youth-facing path, renders clearance or background-check state. The two
surfaces that do (`AutomationsReport.tsx:215-260`, `copilot.ts:252-253`) are
both being deleted. Agreed and stamped.

---

## Children's Ministry

**SIGN-OFF. CONVERGED — no residual objections** on the ten verdicts, on N2's
fail-closed clearance, or on the `!isChild` precondition in `analyzeCluster`
(`busFactor.ts:95-125`).

### 3. Clearance grep — **CONFIRMED CLEAN. This is my item, and I have checked it myself.**

Taking it first because it is the one I asked for.

- `grep -rn "passed_background_check" src/ mock-api/` → **zero matches.** N2 is
  net-new. There is no existing render path that Q11 could have missed.
- Background-check state renders in exactly **two** places today:
  `AutomationsReport.tsx:215-260` ("Background Checks (Expiring Soon)",
  "Expired Background Checks (Safe Sanctuary)") and `copilot.ts:252-253`. Both
  read `backgroundCheckExpiresAt`, a field with no PCO source. Both are inside
  the deletion set (§6 items 3 and 4).
- `BusFactorGraph.tsx` renders no clearance. Its "All Clear!" string
  (`:54`) is an empty state about solo coverage — I checked, because the phrase
  is exactly what a safeguarding badge would say, and it is not one. UXR's note
  about it standing in for classification failure is right and is a separate
  fix on item 11.
- `ConfigModal.tsx` contains no minors-facing-team list, declared or otherwise.
  Q11's config step was struck before it was built. Nothing to remove.

**So: after items 3 and 4 land, clearance renders in exactly one place —
Recruitment — as Q11 ruled. Confirmed.**

**Condition, and I will not sign without it:** the deletion must take the
*field*, not just the two lanes. `pco.ts:17` (`background_check_expires_at`),
`pco.ts:86` (`backgroundCheckExpiresAt` on the type) and `pco.ts:299` (the
mapping). Concur with admin exactly. A nullable safeguarding-flavoured field
sitting on the `Student` type with no source is a loaded gun in a codebase that
has already fired one.

**Safety impact — and this is the part that must not be softened.** Deleting a
fake expired-background-check alert is net-positive: the alert was reading a
field PCO never supplied, so "no expired checks" was being printed over an
unknown state, on a *Safe Sanctuary* heading. That is the worst thing in this
area and it is right to delete it.

But name the consequence plainly: **after item 3, Locus tells the church nothing
about clearance expiry at all.** From the desk, that is a visible regression
from what the screen appeared to offer. §7 already records it as a named gap
with an owner required; **it also needs to be in the release note, not only in
this audit document**, because "the tool used to warn us about expired checks"
is the complaint I will get in week one, and the honest answer — "it never did;
it was reading a field that does not exist" — has to be written down before
someone has to say it out loud.

### 2. `retention.ts:16` — **confirmed, and the fixture should be a child**

The under-count in §4 lands hardest on the exact moment my brief calls the
highest-value in the whole system: the new family.

Here is Sunday morning at my desk. A family walks up at 9:22. The **child** is
checked in first — that is the point of the desk, the label printer, the
security tag. The parents are frequently not recorded as anything at all that
week. So the first data Locus ever sees about a new family is a **child's
check-in, kind `Guest`**, and `retention.ts:16` throws it away. The funnel's
"1st Visit" bucket — the entire premise of the screen — systematically misses
new families at the precise point of contact where churches most want to
measure them. Confirmed; fix it.

**Two asks on the fixture, both small:**

1. **Make the `Guest` row a child check-in at event 1 or 2**
   (`mock-api/data.js:295-340`, the Friday and Sunday kids events), not an
   adult worship check-in at event 3. That is the realistic shape of a first
   visit, it exercises the path that actually matters, and it sits in the
   relative-dated generator UXR identified — so unlike a row in the 2024-anchored
   newcomer block, it will actually be inside the 12-month window and visible.
2. **The household caveat in item 6(d) must say the specific thing.** The
   funnel counts *persons*. A family of four visiting once produces four "1st
   Visits" and, if they never return, four one-and-dones. A church reading
   "40 newcomers" is reading roughly ten families. Households in my world are
   also not tidy — two addresses after a divorce, grandparents bringing
   grandchildren, a foster placement — so I do not want Locus *inferring*
   families here. Count persons, and say in one line on the screen that it
   counts persons. That is the correct and cheap answer.

**Sunday-morning cost:** zero. Nothing changes at the desk. This is a reporting
repair.

### 1. `keyVolunteerLookbackWeeks = 26` — **not my call, but my data supports 26**

One fact from running the rota: a kids-ministry volunteer on a standard 4-to-6
week rotation serves roughly **eight times a year**. An 8-week eligibility
window sees them once, maybe twice, so `historyServingCount >= 2` frequently
fails for a person who is on my team all year. A 26-week window sees them three
or four times. Thirteen sees them once or twice and puts me back where I
started.

Every one of those people is background-checked, rostered, and hard to replace.
26 it is.

**Minor-data flag on all three items: none.** No child data is rendered, exported
or inferred by any of the three changes. The `Guest` fixture row is synthetic.
