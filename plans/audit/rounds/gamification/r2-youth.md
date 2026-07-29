# Round 2 — Youth Ministry critique — Area B: gamification

Reviewer: youth pastor persona. Attacking `plans/audit/rounds/gamification/proposal-v1.md`.

---

## 1. Fact-check of load-bearing claims

Re-read against source, not taking the synthesis's word for it:

- **Bounty type-system claim (§0.4) — confirmed.** `grep bounties src/utils/storage.ts`
  returns nothing. `GamificationState` has no `bounties` field, no migration adds one.
  `BountyBoard.tsx` and `gamification.ts:176-188` run only because Vite skips type
  checking. Accurate, and it strengthens CUT past a taste call, as claimed.
- **No birthdate anomaly detector — confirmed.** Grepped `hygiene.ts` and the whole
  `src/` tree for a birthdate validator; none exists. `the-time-lord` genuinely
  cannot be correctness-gated today. Accurate.
- **GoldenRecordModal dead code — confirmed.** `App.tsx:91` declares
  `isGoldenRecordOpen`; the only other reference is its own `onClose` at `:1034`.
  Nothing sets it `true`. Accurate, CUT is correct.
- **Gamification reverts on Undo but not on `executeCommit` failure — confirmed**
  by reading `App.tsx:369-378` against `handleUndo`. Correctly scoped correction
  of church-admin's round-1 claim.

No factual errors found in §0. The proposal did its homework.

---

## 2. What retains a volunteer team past week three — pushing back on the drift toward zero

I'll say the hard part plainly: **no peer-comparison or team mechanic can be built
honestly on this data model**, and I'm not going to pretend otherwise to defend
turf. One `localStorage` key per browser, one shared PCO `appId`/`secret`
(`App.tsx:73,101`), no login, no per-user row anywhere. Campus Cup, Bounty Board
leaderboard framing, and any"team" language — I concede all of that is
structurally impossible, not just badly executed. Cutting them is right, and my
round-1 remedy for Bounty Board (second-person confirmation) presupposed an
identity the app doesn't have — see §5.

What *does* retain a volunteer past week three, in real life, is a leader who
notices and says thank you — not a scoreboard. That means the honest job for
this whole area is not "motivate the volunteer" but "give the leader something
to notice with." N2 (backlog chip) and N3 (Shift Recap) are aimed at the right
target for that reason. But N3 as specified has the same shared-browser
contamination problem the proposal used to kill the streak and Avatar:
`fixHistory[today]` is keyed by **calendar day**, not by session. On a shared
office laptop with a daytime data-entry volunteer and a separate Wednesday-night
small-group leader touching records the same day, "this shift: 14 records
verified" will silently include the other volunteer's work. The proposal's own
argument against the streak ("a metric with no referent" when the browser is the
identity) applies word-for-word to N3 unless it adds an actual session boundary
(e.g., reset on `ReviewMode`/`Zen Mode` entry-exit, not on the clock). Fix the
scope before shipping it, or the area's replacement metric inherits the exact
defect it was built to avoid.

---

## 3. The correctness gate (B3) against grade — verified, and it has a bug

Read `src/utils/grader.ts`, `src/utils/pco.ts:243-245`, and `App.tsx:564-578`
directly.

`calculateExpectedGrade` is a pure function of birthdate and today's date
against a Sept-1 cutoff. `delta = calculatedGrade - grade` in `pco.ts:245` is
computed the same way system-wide — it is the app's *only* definition of
"correct grade." There is no independent verification signal (no "checked
against paper roster" flag, nothing).

**Direct answer to the question asked: yes, an August bulk grade promotion
scores identically to a verified single-record correction under B3's gate —
and it can be scored with zero human judgment.** If a volunteer (or a five-line
script) sets `pcoGrade = calculateExpectedGrade(birthdate)` for all 200 kids in
one pass, every one of those records has post-fix `delta === 0` and B3 awards
full credit — `gradesFixed++`, badge progress, confetti — identically to a
volunteer who spent an hour cross-checking each kid against a printed roster.
The gate filters *wrong answers*, not *unverified answers*. Those are different
things, and grade is exactly the field where that difference matters, because a
formula-only "fix" will happily paper over the cases a human check would catch:
a held-back kid, a homeschool family whose PCO grade doesn't track age, a
kid on an IEP-driven delay. B3 doesn't just fail to solve the August-sweep
problem raised in round 1 — it hands a bulk-promotion script a **more
efficient path to full credit** than before, since the pass condition is now a
public, computable formula instead of "any diff."

There's also a live bug in how B3 is worded, not just a limitation. §B3 says
grade should score "when `calculateExpectedGrade(...) === updated.pcoGrade`
… not merely when `pcoGrade` moved." Grade is the **first** branch checked in
the `App.tsx:566` if/else chain. Dropping the change-requirement means any save
on a student whose grade already matches the formula — the common case, not the
exception — will hit the grade branch first regardless of what the volunteer
actually edited (phone, email, name), because the chain never reaches the later
branches. Every routine phone/email fix on an already-correct student gets
misclassified and scored as a grade fix. The email/phone/address/name gates in
the same section correctly require the anomaly to flip (`detectX(original) &&
!detectX(updated)`, which forces a change); the grade gate as literally written
does not have that conjunction. This needs `updated.pcoGrade !==
original.pcoGrade &&` added back in front of the formula check before B3 ships.

---

## 4. Dropped from round 1, still unresolved

- **Achievement Case threshold-to-roster-size scaling.** I asked in round 1 for
  remaining badge thresholds to be "keyed to actual roster size, not a number
  that implies a mega-church database." B7 cuts the unreachable ones (10,000 /
  1,000 / 500) but doesn't make the survivors (`archaeologist` at 50,
  100-count field badges) dynamic against the real roster — it just removed the
  worst offenders. That's progress, not the ask. Not blocking, but not closed
  either.
- **Ghost-clear confetti** — upheld in B4, not dropped. No objection there.

Everything else from my round 1 was either converged (Campus Cup, Bounty Board)
or subsumed into B3/B6/B7. No other live gap.

---

## 5. Concession

Church-admin's structural point — no identity, no server, dissolves rather than
answers the cadence debate — beats my round-1 remedy of "add second-person
confirmation to grade/ghost bounties"; that remedy assumed an identity layer
this app does not and, per the proposal, cannot cheaply have, so CUT over
SIMPLIFY on Bounty Board was the right call and I was wrong to reach for a
tuning fix instead of a subtraction.
