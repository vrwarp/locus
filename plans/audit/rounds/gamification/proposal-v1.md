# Area B — Gamification — Proposal v1 (Round 1 synthesis)

Inputs: `r1-uxr.md`, `r1-church-admin.md`, `r1-youth.md`, `r1-children.md`.
Every load-bearing claim below was re-read in source before being carried
forward. Three critic claims were wrong and are corrected in §0.

---

## 0. Changes since last round

**Initial proposal** — no prior round to diff against.

Corrections to the critiques themselves, since round 2 will build on these:

1. **church-admin is half wrong on the un-winding claim.** Gamification *is*
   reverted on an explicit user Undo — `handleUndo` restores
   `prevGamificationState` and re-persists it (`src/App.tsx:629-631`, threaded
   through `pendingUpdateRef` at `:602`). What is *not* reverted is the
   `executeCommit` **failure** path: `src/App.tsx:369-378` rolls back only the
   React Query cache, never `gamificationState`. So the divergence is real but
   narrower than stated: score inflates on *PCO write failure*, not on undo.
2. **UXR is wrong that Contribution Graph shows 12 weeks.** `weeks = 12` is the
   prop default (`ContributionGraph.tsx:17`); the only mount passes
   `weeks={26}` (`Dashboard.tsx:162`). The "no long history" defect is moot.
3. **UXR is right that badge unlock is silent** — `grep` confirms neither
   `Confetti.tsx` nor `BadgeToast.tsx` import `utils/audio`. The inventory's
   "combo sounds" label for #17 describes a feature that does not exist. Fix the
   inventory, do not build the sounds.

**Two defects no critic found**, both verified by running `tsc`:

4. **Bounty Board exists outside the type system.** `BountyBoard.tsx:3` imports
   `Bounty` from `../utils/storage`, which exports no such type; `GamificationState`
   (`storage.ts:34-48`) has no `bounties` field; `getDefaultGamificationState()`
   (`storage.ts:139-153`) never initialises one and the migration block
   (`storage.ts:172-181`) never adds it. `npx tsc -p tsconfig.app.json --noEmit`
   reports **205 errors app-wide, of which 19 are Bounty Board**, spanning
   `App.tsx:464,465,473,482`, `BountyBoard.tsx:3,19,20,21`, `gamification.ts:176,177`,
   `BountyBoard.test.tsx:12,49`, `gamification.test.ts:180,208-224`. It only runs
   because Vite strips types without checking. This turns the CUT from a taste
   call into a cleanup.
5. **`GoldenRecordModal` is unreachable dead code.** `setIsGoldenRecordOpen` is
   declared at `App.tsx:91` and called exactly once — from its own `onClose`
   (`App.tsx:1034`). Nothing ever opens it. It also passes a `colors` prop that
   `ConfettiProps` does not declare (`GoldenRecordModal.tsx:15`, TS2322), so the
   gold palette it wants is silently ignored anyway.

---

## 1. Per-feature decisions

| # | Feature | Verdict | Rationale | Converged? |
|---|---------|---------|-----------|-----------|
| 12 | Bounty Board | **CUT** | Team mechanic on single-browser state; 19 TS errors; children's-ministry veto on `birthdate`/`grade` as rewarded quota targets | N (3 CUT / 1 SIMPLIFY) |
| 13 | Campus Cup | **CUT** | `Math.random()` on a 3s timer presented as live inter-campus fixes. Unanimous 4/4 | N (unanimous, round 1) |
| 14 | Achievement Case | **DEMOTE** | Honest, but 11 badges do not earn a nav slot; 4 of 11 are unreachable at church scale | N (1 DEMOTE / 3 SIMPLIFY) |
| 15 | Gamification Widget | **SIMPLIFY** | Streak on a shared browser measures nothing; `dailyGoal=50` is unrelated to the real backlog | N (3 SIMPLIFY / 1 DEMOTE) |
| 16 | Avatar / level | **CUT** | A permanent sidebar progress bar that can never complete for any real church roster | N (2 CUT / 1 SIMPLIFY / 1 KEEP) |
| 17 | Confetti / BadgeToast / sounds | **FIX** | No reduced-motion gate anywhere in `src/`; confetti fires on ghost archival; dead modal | N (3 SIMPLIFY / 1 KEEP) |
| 18 | Contribution Graph | **KEEP + FIX** | The one honest surface in the area; needs a11y and org-relative intensity | N (2 KEEP / 2 SIMPLIFY) |
| — | **Scoring substrate** (`updateGamificationState`) | **FIX** | Counts "field changed", never "field corrected". All four critics, independently | N (4/4 convergent) |

### Where I picked a side and why the loser loses

- **#12 — youth's SIMPLIFY loses.** Their own remedy ("require a second-person
  confirmation for `grade` and `ghost` bounties") presupposes a second person the
  data model cannot represent: one `localStorage` key, one shared PCO
  `appId`/`secret` login (`App.tsx:73,101`), no user identity anywhere. You
  cannot second-source a bounty in a single-player store. Children's-ministry
  flagged `birthdate` and `grade` in the bounty picklist (`BountyBoard.tsx:100-101`)
  as a quota with a real reward attached, driving nursery age-banding via
  `calculatedGrade` → **that is a domain flag on minors' room placement and it
  outranks the usability argument.** It points at CUT, so CUT.
- **#14 — church-admin's DEMOTE beats three SIMPLIFYs.** Subtraction first: UXR
  itself calls the sidebar length a usability defect. A page you open "rarely, a
  curiosity tab" is the textbook definition of a card, not a destination.
- **#16 — children's KEEP loses.** Their argument is "cosmetic and harmless" —
  that is a case for it not being dangerous, not a case for it holding permanent
  sidebar real estate. Youth self-marked this NOT MY LANE. UXR's structural point
  decides it: `AVATAR_LEVELS` tops out at 10,000 fixes (`avatar.ts:15`) against a
  roster of hundreds, so `getNextAvatarLevel` never returns null and
  `Avatar.tsx:26-38` renders a bar that is permanently mid-fill, forever.
- **#17 — youth's ghost-confetti objection is upheld.** `handleArchiveGhosts`
  fires full-screen confetti on badge unlock during bulk archival
  (`App.tsx:315-323`), and the badge is literally `the-exorcist` 👻
  (`gamification.ts:41-46`). A "ghost" is a person with no check-ins; some of
  them are a teenager whose family stopped coming after a crisis. Children's said
  "no safety impact" — correct on data handling, but this is a pastoral-tone flag
  from the specialist whose members the records describe, and suppressing one
  `setShowConfetti(true)` costs nothing. Uphold.
- **#15 — I overrule all four.** Every critic tried to *re-tune* the streak
  (weekly cadence, N-day grace window). I am cutting the streak display instead.
  A streak attributed to a browser shared by rotating volunteers is not a
  mis-tuned metric, it is a metric with no referent — church-admin's own finding
  ("two volunteers on the same office PC share one counter, the same volunteer on
  a laptop and a desktop looks like two people") dissolves the cadence debate
  rather than answering it. Do not tune a number that measures nothing.

---

## 2. The concrete work, ordered by value-per-effort

### B1. Delete Campus Cup *(effort: trivial; value: highest — this is the trust bomb)*

Unanimous 4/4. Verified: `BASE_SCORES` hardcoded (`CampusCup.tsx:11-17`),
`setInterval` adds `Math.floor(Math.random()*5)+1` to a random campus every 3000ms
(`:25-43`), `recentActivity` incremented on `Math.random() > 0.5` and rendered as
"🔥 **N fixes** submitted by your campus in the last 24 hours" (`:96-98`), tooltip
labels the fabrication `'Total Fixes'` (`:80`). Mock data presented as insight —
blocking by standing rule.

- Delete `src/components/CampusCup.tsx`, `CampusCup.css`, `CampusCup.test.tsx`.
- `src/App.tsx`: remove import (`:29`) and the `currentView === 'campus-cup'`
  block (`:973-980`).
- `src/components/SidebarCore.tsx`: remove the nav button (`:37-43`).
- `src/components/SidebarCore.test.tsx:55`: remove the Campus Cup assertion.
- `src/components/ConfigModal.tsx`: remove the Campus `<select>` (`:236-251`),
  the `campus` state/load/save wiring (`:28,44,62`), and `campus?: string` from
  `AppConfig` (`src/utils/storage.ts:22`). The dropdown's only consumer was
  `userCampus`; it maps to no PCO field.
- Also removes one TS error (`CampusCup.tsx:80`, TS2322).

### B2. Delete Bounty Board *(effort: trivial; value: high — removes 19 TS errors)*

- Delete `src/components/BountyBoard.tsx`, `BountyBoard.css`, `BountyBoard.test.tsx`.
- `src/App.tsx`: remove import (`:37`), `handleAddBounty` (`:464-477`),
  `handleDeleteBounty` (`:479-486`), and the `currentView === 'bounties'` block
  (`:964-972`).
- `src/utils/gamification.ts`: delete the entire "Process Bounties" block
  (`:175-188`).
- `src/utils/gamification.test.ts`: delete the `processes bounties correctly` case
  (`:177-~230`).
- `src/components/SidebarCore.tsx`: remove the nav button (`:29-35`);
  `SidebarCore.test.tsx:18,27` and `CoreLayout.test.tsx:30` reference it.
- No type needs to be *added* to `storage.ts` — the phantom `Bounty` import
  disappears with the component.

### B3. Gate scoring on correction, not on diff *(effort: medium; value: highest absolute — all four critics)*

This is the one thing every critic named independently. The validators already
exist; nothing new needs inventing.

In `src/App.tsx:564-578`, `actionType` is derived purely from
`updated.X !== original.X`. Replace each equality test with an
anomaly-cleared test, using functions already exported from
`src/utils/hygiene.ts` (`detectEmailAnomaly:43`, `detectPhoneAnomaly:167`,
`detectAddressAnomaly:120`, `detectNameAnomaly:4`) and the grade delta already
computed in `src/utils/pco.ts:244-245`:

- `email` scores only when `detectEmailAnomaly(original.email) && !detectEmailAnomaly(updated.email)`.
- `phone` / `address` / `name` — same shape against their `detect*Anomaly` pair.
- `grade` scores only when `calculateExpectedGrade(new Date(updated.birthdate)) === updated.pcoGrade`
  (i.e. post-fix `delta === 0`), not merely when `pcoGrade` moved. This is the
  single change that answers children's-ministry on Promotion Sunday placement
  and youth on the August grade sweep.
- `birthdate` has **no validator today** — this is the gap. Until one exists,
  birthdate changes should increment `totalFixes` but **not** `birthdatesFixed`,
  which retires the `the-time-lord` badge's incentive (see B7).
- A save that changes a field without clearing its anomaly returns
  `actionType = null` and skips `updateGamificationState` entirely — no point, no
  badge, no confetti. Same treatment in the bulk path (`App.tsx:496-510`).

Also repair the failure divergence: in `executeCommit`'s `catch`
(`src/App.tsx:369-378`), thread the same `prevGamificationState` that
`handleUndo` already uses and call
`setGamificationState(prev) / saveGamificationState(prev, appId)` alongside the
existing cache rollback. The code comment at `:591` that calls this "minor" is
wrong and should go.

### B4. Fix the celebration layer *(effort: small; value: high — accessibility + tone)*

- **Reduced-motion gate.** `grep` for `matchMedia|prefers-reduced-motion` over
  `src/` returns exactly one hit, a CSS rule at `App.css:30`. No JS check exists.
  Add an early return in `Confetti.tsx`'s effect (`:12`):
  `if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;`.
  This covers both mount points (`App.tsx:1061` badge confetti, `:1063-1065`
  party mode) in one place. Note `App.tsx:1061` passes no `duration`, so the
  150-particle `requestAnimationFrame` loop runs until the 3s `setTimeout` at
  `:588` unmounts it.
- **No confetti on ghost archival.** `src/App.tsx:319-323`: keep `setLatestBadge`,
  drop `setShowConfetti(true)` and its timeout. Youth's flag, upheld.
- **Delete `GoldenRecordModal`.** `src/components/GoldenRecordModal.tsx`, `.css`,
  `.test.tsx`; `App.tsx:1` import, `:91` state, `:1032-1035` mount. Unreachable —
  nothing calls `setIsGoldenRecordOpen(true)`. Removes one TS error.
- **Fix the inventory, not the code**, for "combo sounds": `feature-inventory.md`
  line 41 lists `utils/audio.ts` under #17; audio is only wired into
  `GradeScatter.tsx` and `ReviewMode.tsx` (Area A). Do not implement badge sounds.
- Sequence `BadgeToast` after the confetti rather than concurrently — both mount
  in the same render at `App.tsx:1061` and `:1067`, and the toast carries the
  only text.

### B5. Delete Avatar / level *(effort: trivial; value: medium — reclaims permanent chrome)*

- Delete `src/components/Avatar.tsx`, `Avatar.css`, `Avatar.test.tsx`,
  `src/utils/avatar.ts`, `src/utils/avatar.test.ts`.
- `src/components/SidebarCore.tsx`: remove the `Avatar` import (`:3`), the footer
  render (`:108`), and the now-unused `totalFixes` prop (`:9,12`).
- `src/layouts/CoreLayout.tsx`: remove `totalFixes` from `CoreLayoutProps` (`:8`)
  and the pass-through (`:16,25`).
- `src/App.tsx:698`: drop `totalFixes={gamificationState.totalFixes || 0}`.
- Update `SidebarCore.test.tsx` (`:7,13,25,33,41,52,63-64`) and
  `CoreLayout.test.tsx` (`:8,19`).
- Grep caution: most `avatar` hits in `src/` are the PCO person-photo field
  (`pco.ts`), unrelated. The level system's blast radius is only the files above.

### B6. Simplify the header widget *(effort: small; value: medium)*

`src/components/GamificationWidget.tsx` — halve it.

- Delete the `streak` prop and the whole `.streak-container` block (`:20-23`),
  plus `src/App.tsx:745` (`streak={gamificationState.currentStreak}`). See §1 for
  why re-tuning it is the wrong move.
- Replace `dailyGoal = 50` (`:13`) with a required prop bound to the real
  backlog. `anomalies` is already computed in `App.tsx:272`
  (`students.filter(s => s.delta !== 0 || s.hasNameAnomaly || ...)`), so
  `App.tsx:744-747` passes `dailyGoal={Math.max(5, Math.min(25, anomalies.length))}`
  — zero new computation.
- Relabel `Daily Goal: {dailyFixes}/{dailyGoal}` (`:25`) to
  `Fixed today: {dailyFixes} of {dailyGoal} flagged records`, so the denominator
  is a real quantity rather than a target the queue may be too small to reach.
- Add `aria-live="polite"` to the widget root (`:19`) so the completion moment is
  announced, not just animated.

`currentStreak` stays in `GamificationState` and keeps feeding the
`streak-master` badge; it simply stops being displayed. If round 2 kills that
badge, delete the field.

### B7. Demote Achievement Case to a Dashboard card, retune the badge set *(effort: small)*

- Remove the `achievements` route: `src/App.tsx:957-962`, the sidebar button
  (`SidebarCore.tsx:54-60`).
- Render `<AchievementCase gamificationState={gamificationState} />` inside
  `src/components/Dashboard.tsx`, in the existing `dashboard-impact` block
  (`:160-164`) beside `ContributionGraph`, collapsed by default. `Dashboard.tsx`
  already receives `gamificationState` — no new prop.
- Cut `BADGES` (`src/utils/gamification.ts:11-89`) from 11 to 5. Delete
  `the-golden-record` (10,000 fixes, `:54-60`), `the-exorcist` (1,000 ghosts,
  `:40-46` — also the badge whose name and trigger youth objected to),
  `the-time-lord` (500 birthdates, `:47-53` — no birthdate validator exists per
  B3, so it cannot be correctness-gated) and one of the flat-100 field badges.
  Keep `first-fix`, `streak-master`, `daily-grind`, `archaeologist`, and one
  field badge — youth explicitly endorsed the first three.
- Add an id-migration map in `loadGamificationState` (`storage.ts:172-181` only
  patches new *fields*), so already-earned badges do not silently vanish from a
  user's case when `BADGES` shrinks. UXR's third #14 defect, confirmed:
  `AchievementCase.tsx:26` iterates `BADGES`, so any unlocked id absent from that
  array is simply not rendered.

### B8. Contribution Graph a11y + org-relative intensity *(effort: small)*

- `src/components/ContributionGraph.tsx:79-84`: each square is a bare `<div>` with
  only a `title`. Add `role="img"` and
  `aria-label={`${day.count} fixes on ${day.date}`}` per square, and wrap
  `.graph-grid` (`:75`) in a `role="group" aria-label="Fix activity by day"`.
- `getIntensityClass` (`:9-15`) uses flat cutoffs 5/15/30. `maxCount` is already
  computed at `:60` — derive the four thresholds from it
  (`maxCount * 0.25 / 0.5 / 0.75`) so a small church's good day reaches the dark
  green and a large one does not saturate in an hour. Same asymmetry UXR flagged
  for #14 and #16, and here the fix is four lines.
- Add a `prefers-color-scheme: dark` block to `ContributionGraph.css` (the file's
  own comment at `:87` flags this as unfinished; the hardcoded white background
  is at `:2`). Whether Locus Core has a dark theme at all is an Area A question —
  do not spend effort until that is answered.

---

## 3. Unresolved disagreement — questions round 2 must settle

1. **Does the correctness gate (B3) save the area, or does it prove the area
   should be zero?** I keep 4 of 7 features. church-admin's reasoning —
   no identity, no server, no durable record — arguably implies deleting all of
   Area B and keeping only `totalFixes` as a private counter. If the answer is
   "delete all seven," B6-B8 are wasted effort. Settle this before anything past B5.
2. **Should `birthdate` and `grade` be scored at all?** Children's ministry wants
   them out of rewarded quotas because they drive nursery age-banding and
   Promotion Sunday placement; B3 gates `grade` on post-fix `delta === 0` and
   leaves `birthdate` counting toward `totalFixes` only. Is gating sufficient, or
   must age-band-determining fields be excluded from every counter, badge and
   progress bar unconditionally?
3. **Streak: delete (my call) or re-cadence to weekly (all four critics)?** If a
   rotating-volunteer Core on a shared browser genuinely benefits from a return
   nudge, say what the nudge is measuring, given that the browser is the identity.
4. **Is the ghost-clear celebration a tone problem or a nothing?** Youth says
   suppress it; children's says no safety impact. I upheld youth on cost grounds.
   If round 2 disagrees, `App.tsx:319-323` is a two-line revert.
5. **Does a real per-person identity land in any roadmap?** Every "team" verdict
   in this area is conditional on the answer being no. If Locus is genuinely
   single-admin-per-church, "team" framing should be swept app-wide, not
   feature-by-feature (UXR's open question, and I have no evidence either way).

---

## 4. New ideas earned this round (3, each replacing something)

### N1. `verifiedFixes` replaces `totalFixes` as the number anything is allowed to display

**Replaces:** the correctness-blind `totalFixes` counter that currently feeds
#14, #15, #16 and #18. **Job unserved:** all four critics said the score cannot
distinguish a fix from a corruption. Keep `totalFixes` as a raw edit tally in
`GamificationState`, add `verifiedFixes` incremented only by the B3 gate, and
make every *user-visible* surface read `verifiedFixes`. Costs one field in
`storage.ts:34-48` plus a migration line, and makes the whole layer honest
instead of ornamental. Adds no screen.

### N2. "Backlog remaining" header chip replaces the streak chip **and** the Avatar bar

**Replaces:** `GamificationWidget`'s `.streak-container` (B6) and the entire
Avatar sidebar footer (B5) — two surfaces deleted, one small chip added, net −1.
**Job unserved:** UXR asked directly whether Avatar earns its slot "over, say,
showing the count of open Data Health items requiring action." It does not.
`anomalies.length` (`App.tsx:272`) is a real, falsifiable, shrinking number that
answers "is this worth another 20 minutes" for exactly the volunteer the personas
describe. It is also the only progress bar in Area B that can actually complete.

### N3. "Shift Recap" card gives the demoted Achievement Case somewhere to land

**Replaces:** the `achievements` route (B7) — a destination becomes a card, net
−1 nav slot. **Job unserved:** church-admin — "nobody takes an action from it";
youth — a Wednesday-only volunteer looks identical to one who quit. A recap
bounded to the current session ("this shift: 14 records verified, 3 grades
corrected, 41 flagged records left") is the retrospective both asked for, reads
correctly at any cadence because it is scoped to a sitting rather than a
calendar, and is computable from `fixHistory[today]` plus `anomalies.length` with
no new state. Renders in `Dashboard.tsx`'s existing `dashboard-impact` block
alongside `ContributionGraph` and the collapsed badge strip.

---

## 5. Subtraction ledger for this proposal

| | |
|---|---|
| Routes removed | 3 — `bounties`, `campus-cup`, `achievements` |
| Routes added | 0 |
| Components deleted | 7 — `CampusCup`, `BountyBoard`, `Avatar`, `GoldenRecordModal` (+3 test files, +3 CSS files) |
| Utils deleted | 1 — `src/utils/avatar.ts` (+ its test) |
| Permanent chrome removed | Avatar sidebar footer, streak chip |
| Settings controls removed | 1 — Campus `<select>` |
| TypeScript errors removed | ~21 of 205 |
