# Round 3 — Youth Ministry — Area C pastoral-ops

Scope: the three items the moderator sent back. All other v2 verdicts stand;
not re-opened.

---

## 1. Does the population toggle deliver the honest student signal, or bury it?

**Verdict: mechanism ACCEPT, delivery OBJECT. Ship the computation, fix two
things before it counts as delivered.**

Verified `missing.ts:39-96` myself: `recentCount` (the "missing" test) counts
**any** check-in in the last 2 weeks, unfiltered by `classifyEvent` — only
`historyServingCount` (the volunteer eligibility gate) touches
`classifyEvent`. That means the student predicate (grade 6-12, zero check-ins
of any kind) **does not depend on the classifyEvent fix at all.** Yet §3.6/§4.8
gate the whole merged screen, both tabs, behind "§4.3 landed and the
`!isChild` filter exists." The Students tab is *for* `isChild` students by
design — that prerequisite blocks a correct, independent signal on an
unrelated volunteer-team bug fix. Split the gate: Students tab ships the day
`missing.ts`'s predicate is swapped; it does not wait on §4.3.

Second problem is real and unaddressed: §4.8 cites "reuse the date gate
already in `automations.ts:67-96`" for the June 1–Aug 15 suppression. I read
that range — it is `getPendingGradePromotions`, which only checks
`isAfter(today, June1)` with no end date. `getCollegeSendOffs` (`:102-117`) is
August-only, also not a June1–Aug15 window. **No such gate exists to reuse; it
has to be written.** Trivial (two date comparisons) but the proposal should
not claim code-reuse it doesn't have — that's the same rigor it demands of
itself elsewhere.

Third, naming: the host screen is titled and routed `volunteer-risk` /
"Volunteer Attendance Risk" (`App.tsx`, `SidebarIntelligence.tsx`). A youth
pastor scanning a staff sidebar for "which students vanished" has no reason
to click something named for volunteers. This is not a nav-slot argument —
I'm not asking for a screen back — but a second tab inside a volunteer-named
report **is** a burial if the label never says "students." Minimum fix: the
sidebar entry or screen header must surface "Students" as a first-class
label, not only a tab you find after landing.

With the gate split and the label fixed, the toggle is honest and sufficient.
Without either, it ships correct math that nobody looking for it will find in
time to matter.

---

## 2. Does "Solo with minors" survive the standard that cut #21, #27, and three Automations lanes?

**Verdict: no — ship it, but strip "minors" from the name and the frame.**

The three admissions in Q6 are the floor, not the whole problem. I checked
`PcoEvent` (`pco.ts:101-108`): it has exactly `name` and `frequency`. There is
no age-group, audience, or ministry-type field anywhere in the event shape.
`servesMinors: boolean` (§4.9) can only be derived the same way
`classifyEvent` derives Worship/Serving — keyword match on event name. That
means the new "serves minors" classifier inherits the exact failure class
that `classifyEvent`'s `'ministry'` bug just demonstrated: `mock-api/data.js`
already has "Kids Ministry Team" (correctly minors) sitting next to generic
"Ministry"-named teams that classifyEvent currently mis-sorts on keyword
precedence. A brand-new, unspecified, unverified keyword classifier deciding
which teams "serve minors" — on a badge that reads as a safeguarding
signal — is precisely the confident-wrong-answer pattern #21/#27/Automations
were cut for. It has not shipped a single test case yet.

I also checked N2's data source directly: `grep -n "passed_background_check"
mock-api/data.js` — zero matches, same as the codebase-wide zero the
proposal already found. This isn't "null for most real records" (§3.2's
phrasing) — in the only dataset this app runs against, it is **null for
100% of records, always**. The fourth-state banner in N2's table would fire
unconditionally, every load, for every org, forever. A badge that never varies
isn't a caveat, it's static UI text pretending to be a live signal.

Combined with the standing admission that `soloCount` is provably 0 until
§4.3 ships (busFactor.ts:120, teamSize===1 never fires today), "Solo with
minors" as specified has: an unbuilt and unverified minors-classifier, a
clearance signal that is constant-null in the only data this app has ever
run against, and a headline number that is currently always zero. That is a
worse starting position than #25's own existing "single points of failure"
mislabel, which at least computed a real number.

**Ship the underlying list — one adult alone on a team, once §4.3 fixes the
count — as the team-coverage ops item the proposal already reframes it as
("teams that need a second trained volunteer"). Drop "minors," drop the
clearance badge, drop the safeguarding framing entirely** until (a)
`servesMinors` has a real PCO-sourced field instead of a name guess, and (b)
clearance data is populated for more than nobody. Reintroduce the safeguarding
framing only when both are true — not before.

---

## 3. Staff-only, and the value-ranking downgrade for #20/#25

**Accepted. No further case.**

I re-verified §1.4 myself rather than take it on faith: `App.tsx:79` types
role as `'core' | 'intelligence'` — no third value in the repo — and
`IntelligenceLayout.tsx:17-30` is a hardcoded `marginLeft: '250px'` flex
shell with no responsive breakpoint, no touch target sizing, no push
mechanism. That is a desktop-only, staff-only surface, full stop. The
proposal didn't dodge my question — it answered it against me, named the
concrete cost (weekly-cadence, staff-read, no-notification, rankings
downgraded), and correctly scoped a leader role/mobile shell/permission model
as platform work outside a ten-screen feature audit. I don't have a rebuttal
that survives contact with the code, and manufacturing one in round 3 to
avoid conceding would be exactly the theater this audit has been cutting
elsewhere. My only residual ask, not a reopening: when the Students tab in
§1 ships, default-sort it by longest-missing-first, so the one staff person
who opens this on a Tuesday sees the worst case in row one — that's the
whole value this surface can still deliver given it will never reach a phone.
