# Area B — Gamification: Children's Ministry Round 2 (Adversarial)

Reviewer: children's-ministry-agent. Responding to `proposal-v1.md`.

---

## 1. Verifying the undo claim (§0.1) — partially true, materially incomplete

Read `src/App.tsx:369-378` (executeCommit catch), `:615-634` (handleUndo),
`:637-648` (handleHistoryUndo/Redo), `src/commands/UpdateStudentCommand.ts`,
`src/commands/BatchUpdateCommand.ts`, `src/utils/commands.ts`.

The proposal is right that `handleUndo` (`App.tsx:615-634`) reverts
`gamificationState` via `prevGamificationState` — but that function backs only
the 5-second pre-commit toast (`UndoToast`, `App.tsx:1075-1077`). There is a
**second, separate, and more prominent** undo path: the persistent header
`UndoRedoControls` (Area A feature #9) call `handleHistoryUndo`
(`App.tsx:637-641`) → `commandManagerRef.current.undo()` → `UpdateStudentCommand.undo()`
/ `BatchUpdateCommand.undo()`. I grepped all three command files for
`gamification` — zero hits. This undo writes the record on PCO back to its
original value and updates the query cache, but **never touches
`gamificationState`**. Any committed edit — the overwhelming majority, since
the toast window is 5 seconds and most volunteers will use the header Undo
button well after that — can be reversed on the record while every point,
streak tick, badge progress and bounty count it earned stays permanently
credited. The proposal's blanket framing ("gamification IS reverted on an
explicit user Undo") is misleading as stated; it is true for one narrow path
and false for the primary one. This is not addressed anywhere in B1-B8 and
must be, because it is exactly the mechanism that lets a volunteer "fix" a
birthdate for bounty/badge credit, get the confetti, and have someone
correctly revert it later with the score never adjusting.

**Ruling:** REJECT the framing in §0.1 as sufficient. Extend B3: thread the
same before/after gamification snapshot through `UpdateStudentCommand`/
`BatchUpdateCommand` (or decrement in `handleHistoryUndo`/`handleHistoryRedo`)
the way `handleUndo` already does for the toast path. Two undo buttons, one
score model — both must move it or neither should claim to.

---

## 2. Ruling on birthdate/grade — gate is insufficient for birthdate, sufficient for grade

Checked `src/utils/hygiene.ts` — zero `birthdate`/date-anomaly detectors exist,
confirming B3's own admission of "no validator today." Checked
`gamification.ts:149-173`: `totalFixes` (line 154) increments unconditionally
for **every** `actionType`, with no branch that skips it. B3's own text says
"birthdate changes should increment `totalFixes` but not `birthdatesFixed`" —
i.e. it explicitly keeps birthdate editing inside the primary score number
while only removing it from the one named badge (`the-time-lord`, correctly
cut in B7). That primary number still drives `dailyFixes`
(`GamificationWidget`'s numerator, unaddressed by B6, which only fixed the
denominator), `currentStreak`, `first-fix`, `archaeologist`, and `daily-grind`
— none of which B7 removes. So a volunteer chasing the daily goal or a streak
still gets full credit for typing *a* birthdate fast, just not a titled badge
for it.

Grade is different and B3 gets it right: `calculateExpectedGrade(birthdate)
=== updated.pcoGrade` is a real, checkable correctness condition, because
grade is *derived from* birthdate and the derivation can be re-run. Concede
that point cleanly (see §5).

Birthdate has no equivalent, and never will. A birthdate anomaly detector can
catch a malformed or implausible date (`13/45/2020`, `1/1/1900`). It cannot
catch a birthdate that is validly formatted and simply *wrong* — a
transposed month/day, a year off by one, a guess typed to clear a bounty
fast. That error is invisible to any validator because it produces a
plausible date, and it still silently mis-drives nursery age-banding and
Promotion Sunday room placement exactly as described in round 1. Gating on a
future validator is gating on something that structurally cannot exist for
this field.

**Ruling:** the correctness-gate model is the right shape for `grade` and
wrong for `birthdate`. Birthdate must be a zero-weight event for every
counter, badge, streak, and goal, unconditionally and permanently — not
"until a validator exists." Concrete change: in `App.tsx`'s `handleSaveStudent`
(and the bulk path), call `updateGamificationState` with `count = 0` (or skip
the call) when `actionType === 'birthdate'`, while still writing the edit to
`fixHistory` so the Contribution Graph — the one surface I already rated
honest — keeps an accurate coarse log. Birthdate edits should be visible as
activity, never as points.

---

## 3. Attack: the "one field badge" survivor in B7 needs a name check

B7 says "keep ... one field badge" from `detail-sweeper` / `telecommunicator`
/ `postmaster` / `grammarian` without naming which. None of those four are
birthdate-adjacent (confirmed against `gamification.ts:11-89` — grade has no
badge today at all), so this is low-stakes, but the proposal should just pick
one rather than leave it open; leaving it open past round 2 risks someone
defaulting to whichever is easiest to keep in code, not whichever is lowest
risk. Non-blocking, name it in the next draft.

---

## 4. What round 1 raised that is still unresolved

My round-1 ask for #15 was explicit: "exclude \[birthdate/grade] from the
daily-goal number entirely so the goal can't be satisfied by rushing through
age-band-determining fields." B6 fixed the *denominator* (`dailyGoal` now
tracks `anomalies.length`) but never touched the *numerator* — `dailyFixes`
still increments on every birthdate save per `gamification.ts:154`. Grade is
fixed by B3's correctness gate flowing through the same counter; birthdate is
not. This is the same gap as §2, restated because B6 is where it should have
been caught and wasn't.

---

## 5. Concessions

B3's grade gate (`calculateExpectedGrade(...) === updated.pcoGrade`) is
exactly the corroborating check I asked for in round 1 and correctly answers
the Promotion Sunday concern for `grade` — no further argument from me there.
