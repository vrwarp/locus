# Area B — Gamification — Proposal v2 (Round 2 synthesis)

Inputs: `proposal-v1.md`, `r2-uxr.md`, `r2-church-admin.md`, `r2-youth.md`,
`r2-children.md`. Every amendment below was re-verified in source this round.
Item IDs B1–B8 are stable across rounds so round 3 can diff them.

---

## 0. Changes since v1

**I was wrong about Undo.** v1 §0.1 claimed gamification is reverted on "an
explicit user Undo" — that is true only of `handleUndo` (`App.tsx:615-634`, the
5-second toast); the header Undo/Redo control calls `handleHistoryUndo`
(`App.tsx:637-641`) → `commandManagerRef.current.undo()`, and
`src/commands/UpdateStudentCommand.ts` / `BatchUpdateCommand.ts` contain zero
references to gamification (re-grepped, and both files read in full this round —
they touch only `updatePerson` and `onStateChange`). The children's agent is
right, UXR/admin/youth all confirmed the narrow claim without checking the second
path, and v1 is wrong as written. B3 now covers both paths.

Other movement:

1. **B3 grade gate had a live bug — adopted the youth fix.** Grade is the *first*
   branch at `App.tsx:566`; v1's replacement dropped the change-requirement the
   email/phone/address branches keep, so a phone edit on an already-correct
   student would fall into the grade branch and score as a grade fix. Gate is now
   `updated.pcoGrade !== original.pcoGrade && calculateExpectedGrade(...) === updated.pcoGrade`.
2. **Birthdate is zero-weight everywhere. Domain veto, accepted in full.**
   Children's ministry ruled that `gamification.ts:154` increments `totalFixes`
   unconditionally, so v1's "counts toward `totalFixes` but not `birthdatesFixed`"
   left birthdate driving `dailyFixes`, `currentStreak`, `first-fix`,
   `archaeologist` and `daily-grind`. No validator can catch a validly-formatted
   but wrong birthdate, so gating "until a validator exists" gates on something
   that cannot exist. This outranks every usability argument and is not
   re-litigable.
3. **Stop re-litigating "delete Area B entirely."** church-admin's actual line is
   *kill anything claiming to measure a person across time or against others*, not
   CUT-everything; UXR reached the same line independently. v1 mischaracterised it.
   Treated as converged; open question #1 from v1 is closed.
4. **B7 reversed: Achievement Case DEMOTE → CUT.** Three separate round-2 attacks
   (UXR Attack 2: `streak-master` kept after its only display is deleted; UXR
   Attack 3 + youth: *any* flat threshold is a size-blind false claim, not just
   the three worst; admin: an id-migration map someone maintains forever;
   children's: "you didn't even name the surviving field badge") all dissolve if
   the badge model goes rather than gets retuned. Deleting is cheaper than the
   three fixes and answers all four critics at once.
5. **B4 reversed: celebration layer FIX → CUT**, as a consequence of (4). With
   badges gone, `setShowConfetti(true)` has no trigger left except the
   `partyMode` click easter egg (`App.tsx:667`, config-gated, default false). The
   reduced-motion gate v1 wanted to add becomes moot rather than needed. This is
   *downstream* of the B7 reversal — if round 3 restores badges, confetti comes
   back with them and the `matchMedia` gate from v1 §B4 is the fallback.
6. **N3 "Shift Recap" is killed.** UXR and admin both called it new scope in a
   subtraction audit; youth showed it reads `fixHistory[today]`, a calendar-day
   key, which inherits the exact shared-browser defect I used to kill the streak.
   Fixing it would mean inventing a session boundary that does not exist in the
   data model. I do not defend it.
7. **N2 shrinks to nothing, which is better.** `anomaliesCount` is *already*
   rendered as a badge on the Data Health nav item (`SidebarCore.tsx:51`, fed from
   `App.tsx:698`). The backlog readout church-admin and UXR both want already
   exists in permanent chrome. N2 is now "delete the streak chip and the Avatar;
   add nothing" — net −2 surfaces, 0 built.
8. **One new defect I found this round.** The bulk path's `actionType` chain
   (`App.tsx:496-510`) checks only name/phone/email/address — it has **no grade or
   birthdate branch at all**, so a bulk grade correction scores as `'general'`
   while the same edit through `handleSaveStudent` scores as `'grade'`. Two
   classifiers, one score model. B3 must unify them or the gate is bypassable by
   using Review Mode instead of the modal.

---

## 1. Per-feature decisions

| # | Feature | Verdict | Rationale | Converged? |
|---|---------|---------|-----------|-----------|
| 12 | Bounty Board | **CUT** | Team mechanic on single-browser state; 23 TS errors; youth conceded its own SIMPLIFY in r2 | **Y — CONVERGED** (4/4, two rounds) |
| 13 | Campus Cup | **CUT** | `Math.random()` on a 3s timer rendered as live inter-campus fixes | **Y — CONVERGED** (4/4, two rounds) |
| 14 | Achievement Case | **CUT** (was DEMOTE) | Flat thresholds are size-blind false claims at church scale; retuning costs more than deleting and still leaves a trophy shelf | N — reversed this round |
| 15 | Gamification Widget | **SIMPLIFY** | Streak has no referent when the browser is the identity; goal denominator and numerator both amended | N — verdict stable, spec amended twice |
| 16 | Avatar / level | **CUT** | Permanent chrome whose bar can never complete; `AVATAR_LEVELS` tops out at 10,000 fixes against rosters of hundreds | **Y — CONVERGED** (unattacked in r2) |
| 17 | Confetti / BadgeToast | **CUT** (was FIX) | Only remaining trigger after #14 is a default-off settings easter egg | N — downstream of #14 |
| 18 | Contribution Graph | **KEEP + a11y FIX** | The one surface all four critics call honest; cosmetic work descoped per admin | **Y — CONVERGED on KEEP**; fix scope narrowed |
| — | Scoring substrate (`updateGamificationState`) | **FIX** | Counts "field changed", never "field corrected"; also desyncs on header undo and on commit failure | **Y — CONVERGED on verdict** (4/4, two rounds); spec amended 4× |

### Where I picked a side and why the loser loses

- **#14 — UXR's "hard-pruned Area B including badges" loses to admin's CUT.**
  UXR's own Attacks 2 and 3 are unanswerable *within* a badge model: it wants
  `streak-master` killed because its display is gone, and it wants the surviving
  field badge made roster-relative ("cleared every flagged email the system
  found"). That second fix requires a `totalXAnomaliesEverSeen` counter that does
  not exist and would have to be persisted, migrated and kept accurate across a
  `localStorage` wipe. That is a build, in a subtraction audit, to make a trophy
  shelf marginally less false. Admin's test — "would a volunteer coordinator
  actually open this on a Tuesday" — decides it.
- **#17 — deleting beats gating.** v1's `matchMedia` early-return was the right
  fix for a confetti layer that fires. Once badge unlock and ghost archival stop
  firing it, the remaining trigger is an opt-in click toy. Delete the component
  and two settings controls instead of adding an accessibility gate to code
  nothing reaches.
- **#18 — admin's PARTIAL ACCEPT beats my v1 B8.** The org-relative intensity
  thresholds and dark-mode CSS are polish on a widget nobody takes an action
  from. `role="img"`/`aria-label` is an accessibility floor and ships; the rest is
  descoped, not deferred.
- **N3 — three critics beat me.** See §0.6. Killed.

---

## 2. The concrete work, ordered by value-per-effort

### B1. Delete Campus Cup — **CONVERGED, unchanged from v1**

Delete `src/components/CampusCup.tsx`, `.css`, `.test.tsx`. `src/App.tsx`: remove
import (`:29`) and the `currentView === 'campus-cup'` block (`:973-980`).
`SidebarCore.tsx:37-43` nav button; `SidebarCore.test.tsx:55`.
`ConfigModal.tsx`: Campus `<select>` (`:236-251`) and its state/load/save wiring
(`:28,44,62`); `campus?: string` from `AppConfig` (`storage.ts:22`).

### B2. Delete Bounty Board — **CONVERGED, unchanged from v1**

Delete `src/components/BountyBoard.tsx`, `.css`, `.test.tsx`. `src/App.tsx`:
import (`:37`), `handleAddBounty` (`:464-477`), `handleDeleteBounty` (`:479-486`),
the `bounties` view block (`:964-972`). `src/utils/gamification.ts`: the entire
"Process Bounties" block (`:175-188` — re-read this round, it is guarded by
`if (nextState.bounties)` on a field that no code path ever sets, so it is
permanently dead as well as untyped). `gamification.test.ts:177-~230`.
`SidebarCore.tsx:29-35`, `SidebarCore.test.tsx:18,27`, `CoreLayout.test.tsx:30`.
Error count corrected: admin counted **23** individual errors across 20 source
lines; v1's "19" counted lines, not errors. `tsc` reports 188 distinct errors, not
205 (205 was the raw output line count). Verdict is unaffected.

### B3. Correctness gate + score/record parity — **verdict CONVERGED, spec amended 4×**

This is the item all four critics have named independently in both rounds, and
admin correctly reclassifies it as a data-integrity fix rather than a
gamification item. Four amendments to v1:

**(a) Grade — restore the change-requirement.** In `App.tsx:564-578`:

```
if (updatedStudent.pcoGrade !== originalStudent.pcoGrade &&
    calculateExpectedGrade(new Date(updatedStudent.birthdate)) === updatedStudent.pcoGrade)
```

Without the first conjunct the branch swallows every save on an
already-correct student, because grade is checked first at `:566`. Youth's find,
adopted verbatim.

**(b) Birthdate scores zero, permanently.** When `actionType === 'birthdate'`,
skip `updateGamificationState` for scoring purposes but still write the day's
entry to `fixHistory`, so the Contribution Graph keeps an accurate activity log.
Concretely: `gamification.ts:149-173` currently adds `count` to `totalFixes`
unconditionally at `:154`; add an early branch that, for `birthdate`, updates
`lastActiveDate` and `fixHistory` only — no `totalFixes`, no `dailyFixes`, no
`currentStreak`. Also delete `birthdatesFixed` from `GamificationState`
(`storage.ts:41`), `getDefaultGamificationState` (`storage.ts:~142`), the
migration line (`storage.ts:~175`) and the `else if (actionType === 'birthdate')`
branch (`gamification.ts:159-160`). Domain veto — not a tuning parameter.

**(c) Both undo paths must move the score, or neither may claim to.** Thread a
`prevGamificationState` snapshot through `UpdateStudentCommand` and
`BatchUpdateCommand` (constructor arg + restore in `undo()` via a new
`onGamificationChange` callback, mirroring the existing `onStateChange`), or
apply the decrement in `handleHistoryUndo`/`handleHistoryRedo`
(`App.tsx:637-648`) where `commandManagerRef` is already in scope. The latter is
smaller: `commandManager.undo()` already returns after awaiting the command, so
the snapshot can live in a parallel `gamificationHistoryRef` stack pushed at
`App.tsx:365` where the command is pushed. Without this, a volunteer earns credit
for an edit that is later correctly reverted on PCO and the score never moves.

**(d) Unify the two classifiers, and fix the failure path.** The bulk path
(`App.tsx:496-510`) has no grade or birthdate branch; extract the actionType
derivation from `handleSaveStudent` into one exported helper
(`src/utils/gamification.ts`) taking `(original, updated)` and returning
`ActionType | null`, and call it from both. `null` ⇒ skip
`updateGamificationState` entirely: no point, no counter, nothing. Separately, in
`executeCommit`'s `catch` (`App.tsx:369-378`), restore the gamification snapshot
alongside the existing React Query rollback. Delete the code comment at `:591`
calling this "minor" — it is not.

Remaining gates unchanged from v1: `email`/`phone`/`address`/`name` score only
when `detectXAnomaly(original) && !detectXAnomaly(updated)`, using
`hygiene.ts:43/167/120/4`.

**Known and accepted limitation** (youth, §3): this gate filters *wrong* answers,
not *unverified* ones — a bulk script setting
`pcoGrade = calculateExpectedGrade(birthdate)` on 200 kids passes it perfectly.
See §3.1; this is the sharpest thing round 3 must settle.

### B4. Delete the celebration layer — **reversed from v1's FIX**

- Delete `src/components/Confetti.tsx`, `.css`, `.test.tsx`;
  `src/components/BadgeToast.tsx`, `.css`, `.test.tsx`.
- `src/App.tsx`: imports (`:49,50`), `latestBadge`/`showConfetti` state
  (`:126,127`), `setShowConfetti` + timeout in `handleArchiveGhosts`
  (`:321-322`) and in `handleSaveStudent` (`:587-588`), the `setLatestBadge`
  calls (`:320`, `:586`, and the bulk path), `handleAppClick` (`:671-676`),
  `partyClickOrigin` state, and the three mounts (`:1061`, `:1063-1065`,
  `:1067-1071`).
- `ConfigModal.tsx`: the Party Mode checkbox (`:178`) and the nested confetti
  theme `<select>` (`:186-195`), plus state/load/save (`:24,25,40,41,58,59`);
  `partyMode?`/`confettiTheme?` from `AppConfig` (`storage.ts:18-19`);
  `ConfigModal.test.tsx:164,172,185,197,205`.
- **Delete `GoldenRecordModal`** (unreachable, carried from v1 and confirmed by
  all four critics): `GoldenRecordModal.tsx`, `.css`, `.test.tsx`; `App.tsx:1`
  import, `:91` state, `:1032-1035` mount.
- Youth's ghost-confetti objection from r1 is satisfied by deletion rather than by
  suppression. v1 open question #4 is closed.
- **Inventory fix, not code:** `feature-inventory.md:41` lists `utils/audio.ts`
  under #17. Audio is wired only into `GradeScatter.tsx` and `ReviewMode.tsx`
  (Area A). "Combo sounds" for badges do not exist. Do not build them.

### B5. Delete Avatar / level — **CONVERGED, unchanged from v1**

Delete `src/components/Avatar.tsx`, `.css`, `.test.tsx`, `src/utils/avatar.ts`,
`avatar.test.ts`. `SidebarCore.tsx`: import (`:3`), footer render (`:108`),
`totalFixes` prop (`:9,12`). `CoreLayout.tsx:8,16,25`. `App.tsx:698`.
`IntelligenceLayout.tsx:7`. Tests: `SidebarCore.test.tsx:7,13,25,33,41,52,63-64`,
`CoreLayout.test.tsx:8,19`. Note `anomaliesCount` stays — it is the surviving,
honest half of that prop pair.

### B6. Delete Achievement Case and the badge system — **new, replaces v1's B7**

- Delete `src/components/AchievementCase.tsx`, `.css`, `.test.tsx`; remove the
  `achievements` route (`App.tsx:957-962`) and nav button
  (`SidebarCore.tsx:54-60`).
- `src/utils/gamification.ts`: delete `BADGES` (`:11-89`), the `Badge` interface
  (`:3-9`), the badge-check block (`:189-~205`) and the `newBadges` half of the
  return signature; `updateGamificationState` returns `GamificationState`.
- `src/utils/storage.ts`: delete `unlockedBadges` from `GamificationState`
  (`:45`), from `getDefaultGamificationState`, and from the migration block.
- Every `newBadges` consumer in `App.tsx` (`:316-323`, `:503-512`, `:582-588`)
  collapses to a plain state assignment.
- This is what makes the id-migration map admin objected to unnecessary, answers
  UXR Attacks 2 and 3 without inventing a roster-relative counter, and moots
  children's "name the surviving field badge."
- `currentStreak` loses its last consumer (`streak-master`) and is deleted from
  `GamificationState` too — v1 said "if round 2 kills that badge, delete the
  field." Round 2 killed it.

### B7. Simplify the header widget — **amended**

`src/components/GamificationWidget.tsx`:

- Delete the `streak` prop and `.streak-container` (`:20-23`), and
  `App.tsx:745`. CONVERGED — no critic defended the streak in either round.
- **Do not clamp the printed denominator** (UXR Attack 1, adopted). v1 proposed
  `dailyGoal={Math.max(5, Math.min(25, anomalies.length))}` under the label
  "of {N} flagged records" — which would print "12 of 25" to a church with 500
  real anomalies, the same class of confidently-wrong number Campus Cup is being
  cut for. Replace `:25` with two unclamped real numbers:
  `Fixed today: {dailyFixes} · {anomaliesCount} flagged records left`. Use the
  clamp, if at all, only for the bar's fill math (`:15-16`), never in text.
  `anomalies.length` is already computed at `App.tsx:272` and already threaded to
  the layout at `:698`.
- The numerator is fixed by B3(b) — `dailyFixes` no longer increments on
  birthdate. This was children's r1 ask that v1 missed.
- Add `aria-live="polite"` to the widget root (`:19`).

### B8. Contribution Graph — a11y only — **descoped**

- `ContributionGraph.tsx:79-84`: add `role="img"` and
  `aria-label={`${day.count} fixes on ${day.date}`}` per square; wrap
  `.graph-grid` (`:75`) in `role="group" aria-label="Fix activity by day"`.
- **Descoped per admin:** org-relative intensity thresholds and the
  `prefers-color-scheme` block are cosmetic polish on a widget nobody takes an
  action from. Not scheduled.
- Keep `fixHistory` writes for birthdate edits (B3(b)) — activity, never points.

---

## 3. Unresolved disagreement — questions round 3 must settle

1. **Sharpest: is `grade` scoreable at all, or must it be zero-weight like
   `birthdate`?** Two domain agents who both own minors' records now disagree
   directly. Children's ministry conceded B3's grade gate cleanly ("exactly the
   corroborating check I asked for"). Youth ministry, in the same round, showed
   the gate filters wrong answers rather than unverified ones, and that by making
   the pass condition a *public computable formula* it hands a bulk-promotion
   script a **more** efficient path to full credit than "any diff" did — while
   papering over exactly the cases a human check catches (held back, homeschool,
   IEP delay). If youth is right, the birthdate veto extends to grade and B3
   reduces to email/phone/address/name. Round 3 must rule. My provisional call is
   that youth wins on the merits and grade should also be zero-weight, but I am
   not overriding a concession the other minor-safety specialist made in the same
   round without one more pass.
2. **Does anything in Area B survive B4+B6, or is the residue also chrome?**
   After the cuts, Area B is: a two-number header widget and a 26-week activity
   grid. Admin wants only the backlog readout plus the gate and would spend the
   rest in Area A; UXR wants the graph kept. Neither is a build, so the cost of
   guessing wrong is one small component — but round 3 should state whether the
   Contribution Graph is genuinely glanced at or is the last ornament standing.
3. **Durability / provenance (admin, unanswered in v1 and only half-answered
   here).** Everything lives in one browser's `localStorage`; clearing site data
   silently zeroes the counter with no warning. Nothing in B1–B8 fixes survival.
   Admin's ask is not a backend, it is "the UI should admit what it is." N1 below
   is my answer; round 3 should say whether it is enough.
4. **Does a per-person identity land on any roadmap?** Carried from v1
   unresolved, still no evidence either way. Every verdict in this area is
   conditional on the answer being no. If it is yes, B6 and B7 are wrong. UXR
   notes this stays live and is not re-raising it as new.

Closed this round: v1 Q1 (delete-everything — mischaracterisation, retracted),
v1 Q2 (birthdate — domain veto, settled), v1 Q3 (streak — nobody defended it),
v1 Q4 (ghost confetti — moot, the component is deleted).

---

## 4. New ideas earned this round (1, down from 3)

Two of v1's three are withdrawn: **N3 Shift Recap is killed** (§0.6), and **N2
shrinks to a deletion** (§0.7 — the backlog count already renders at
`SidebarCore.tsx:51`, so the "new chip" is just the streak chip and the Avatar
going away). **N1 survives**, endorsed by both UXR and admin.

### N1 (carried). `verifiedFixes` replaces `totalFixes` as the only number any surface may display

**Replaces:** the correctness-blind `totalFixes`, whose last user-visible mounts
(`AchievementCase.tsx:19` "Total Fixes: N", `Avatar.tsx:21,36`,
`CampusCup.tsx:94`) are all deleted by B1/B5/B6 anyway. Keep `totalFixes` as a
raw internal edit tally; add `verifiedFixes`, incremented only by the B3 gate;
`GamificationWidget` and any future surface read `verifiedFixes`. One field in
`storage.ts:34-48`, one migration line, no new screen.

### N1b. …and it carries a provenance line, which is the whole of admin's durability ask

**Replaces:** the deleted `AchievementCase` "Total Fixes" stat pill — the honest
residue of the trophy shelf. `GamificationState` already stores
`lastActiveDate`; render the widget's tooltip as
`Counted in this browser since {firstActiveDate}` (one new field, set once in
`getDefaultGamificationState`). No sync, no export, no backend — the UI simply
stops implying the number is durable or shared. This is the minimum that keeps a
silently-reset counter from reading as "no real progress."

---

## 5. Subtraction ledger, cumulative

| | |
|---|---|
| Routes removed | 3 — `bounties`, `campus-cup`, `achievements` |
| Routes added | 0 |
| Components deleted | 8 — `CampusCup`, `BountyBoard`, `Avatar`, `GoldenRecordModal`, `AchievementCase`, `Confetti`, `BadgeToast` (+7 test files, +6 CSS files) |
| Utils deleted | 1 — `src/utils/avatar.ts` (+ test); `BADGES` + badge engine removed from `gamification.ts` |
| State fields deleted | `unlockedBadges`, `currentStreak`, `birthdatesFixed`, `bounties` (phantom) |
| Permanent chrome removed | Avatar sidebar footer, streak chip |
| Settings controls removed | 3 — Campus `<select>`, Party Mode checkbox, confetti theme `<select>` |
| Components added | 0 |
| TypeScript errors removed | ~25 of 188 distinct |
