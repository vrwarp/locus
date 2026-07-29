# Area B — Gamification — Proposal v3 (Round 3 synthesis)

Inputs: `proposal-v2.md`, `r3-uxr.md`, `r3-church-admin.md`, `r3-youth.md`,
`r3-children.md`. Item IDs B1–B8 stable since v1. Every claim below was
re-verified in source this round.

**Status: the area is CONVERGED.** All seven features (#12–#18) and the scoring
substrate now carry verdicts no critic contests, and the last live conflict
(grade weight) was settled unanimously this round. §3 states plainly that
nothing substantive remains open for rounds 4–5, and why.

---

## 0. Changes since v2

**My v2 §3.1 provisional call was right and is now unanimous.** Youth ruled
grade zero-weight; children's ministry *withdrew its round-2 concession* and
ruled the same way, on stronger reasoning than mine: the gate proves a formula
was re-run, not that a human verified the record. Two minor-safety specialists,
independently, same ruling. This is a domain veto ×2 and is not re-litigable.

1. **B3(a) is deleted, not amended.** The grade gate is the item I amended twice
   (v1 wrote it, v2 restored youth's change-requirement conjunct). Both critics
   killed the branch it guarded. The
   `calculateExpectedGrade(...) === updated.pcoGrade` conjunct never ships. Kill
   your own darlings: v2's most-worked-on paragraph is now a deletion.
2. **B3 reduces to four fields.** See §2/B3 headline. Nothing else scores.
3. **Unified classifier promoted into B3's definition of done** (admin: "not
   optional polish"; youth: "unify or the zero-weight ruling is cosmetic";
   children's: "the only way §1's ruling is enforceable outside the modal";
   UXR: ACCEPT). It is no longer a sub-item — B3 does not ship without it.
4. **B3 is reclassified as an Area A data-integrity fix, unconditionally.**
   Admin's §4 ruling: build it whether or not a single Area B surface survives.
   This is the durable outcome of auditing this area — see §1.1.
5. **B8 gains one line.** UXR found the last surviving "streak" reference:
   `ContributionGraph.tsx:67` empty-state copy. B6/B7 delete the mechanic and
   orphan the promise.
6. **Sandbox Mode's inertness now constrains what Area B may claim** (admin §3,
   children's §3). Scoring fires optimistically on save; see §2/B9.
7. **One new defect I found this round, and it is the worst one in the area:**
   `App.tsx:510` persists gamification state under the wrong encryption
   passphrase, silently zeroing the entire counter on next page load. §2/B3(e).

---

## 1. Per-feature decisions

| # | Feature | Verdict | Rationale | Converged? |
|---|---------|---------|-----------|-----------|
| 12 | Bounty Board | **CUT** | Team mechanic on single-browser state; 23 TS errors; dead `bounties` guard | **Y — CONVERGED** (4/4, three rounds) |
| 13 | Campus Cup | **CUT** | `Math.random()` on a 3s timer rendered as live inter-campus fixes | **Y — CONVERGED** (4/4, three rounds) |
| 14 | Achievement Case | **CUT** | Flat thresholds are size-blind false claims at church scale; deleting is cheaper than three retunes | **Y — CONVERGED** (r3: admin confirm, youth ACCEPT, UXR "resolves it more completely than my own fix") |
| 15 | Gamification Widget | **SIMPLIFY** | Two unclamped real numbers + provenance tooltip; UXR names it the load-bearing survivor of the whole area | **Y — CONVERGED** (verdict three rounds; spec unchanged since v2) |
| 16 | Avatar / level | **CUT** | Permanent chrome whose bar can never complete; `AVATAR_LEVELS` tops at 10,000 against rosters of hundreds | **Y — CONVERGED** (unattacked r2, r3) |
| 17 | Confetti / BadgeToast | **CUT** | Only trigger after #14 is a default-off settings easter egg | **Y — CONVERGED** (r3: admin + youth both ACCEPT downstream logic) |
| 18 | Contribution Graph | **KEEP + a11y FIX + copy FIX** | The one honest surface; weaker survivor than the widget but costs nothing to keep | **Y — CONVERGED on KEEP**; scope +1 line this round |
| — | Scoring substrate (`updateGamificationState`) | **FIX** → hand to Area A | Counts "field changed", never "field corrected"; two classifiers; desyncs on header undo, commit failure, and its own persistence key | **Y — CONVERGED on verdict** (4/4, three rounds); spec final |

### 1.1 The durable outcome of this area

Strip every gamification framing away and Area B's audit produced exactly one
thing worth engineering budget: **the app records that a field was "fixed"
whenever it changes, right or wrong, and never un-records it.** That record is
read by `fixHistory`, by the anomaly backlog accounting, and by any future
"what got cleaned up this quarter" question — with or without a widget on
screen. B3 is the repair. **It ships as an Area A data-integrity ticket
regardless of Area B's fate**, and it is not cut alongside the UI it is
currently filed next to. Everything else in this area is deletions.

### 1.2 What B3 reduces to, stated plainly

Scoreable fields: **`email`, `phone`, `address`, `name` — those four, and
nothing else.** Each scores only when `detectXAnomaly(original) &&
!detectXAnomaly(updated)` (`hygiene.ts:4/43/120/167`).

- `grade` — **zero weight, permanently.** Domain veto ×2.
- `birthdate` — **zero weight, permanently.** Domain veto, settled r2.
- `general` — **scores nothing.** It is the fall-through label, and today it is
  the *most* permissive branch in the codebase (no gate exists for it at all).
  A classifier that cannot name the field did not observe a correction.
- `ghost` — out of Area B's scope (Area A archival), but its scoring call sits
  on the same substrate and inherits B3(c)/(e).

The four survivors are defensible only because they have format-based detectors
with **no derivable correct value a script could compute** — someone has to type
a plausible replacement that clears the flag. Grade's formula is public and
deterministic; that is the whole difference. Youth's own summary is the right
one: *"I would not have proposed building this substrate from scratch for four
fields alone, but subtracting it now costs more than keeping it."*

### 1.3 Where I picked a side and why the loser loses

- **Grade — my own v2 spec loses to both ministry agents.** v2 argued the gate
  filters wrong answers. Both critics showed it *certifies* wrong answers for
  precisely the exception population: held-back students, homeschool families
  whose PCO grade doesn't track age, IEP-driven delays. A gate satisfiable by
  re-running the church's own derivation function is a determinism check, not a
  correctness check — and by making the pass condition public and computable, v2
  handed a bulk-promotion script a *cleaner* path to full credit than "any diff"
  did. The tool would tell a volunteer they did something right while erasing a
  correct exception record. Nothing on the usability or completeness side
  outranks that.
- **UXR's "widget, not graph" ranking is adopted as guidance, not as a verdict
  change.** The graph stays KEEP (4/4, zero build cost), but the widget is the
  surface that must be got right; the graph is the one to drop first if any
  future round needs to spend the budget elsewhere.

---

## 2. The concrete work, ordered by value-per-effort

### B3. Correctness gate + score/record parity — **THE item; hand to Area A**

**(a) — WITHDRAWN.** The grade gate is deleted, not fixed. No
`calculateExpectedGrade` call enters the scoring path.

**(b) Grade *and* birthdate score zero, permanently.** In
`gamification.ts:149-173`, add an early branch: for
`actionType === 'grade' | 'birthdate'`, update `lastActiveDate` and `fixHistory`
only — no `totalFixes`, no `dailyFixes`, no `verifiedFixes`, no streak. The
Contribution Graph keeps an accurate *activity* log; activity is never points.
Delete both dead counters and their twins together (youth: "no reason to keep
one dead field and delete its twin"):

- `storage.ts:40-41` (`birthdatesFixed?`, `gradesFixed?`)
- `storage.ts:145-146` (defaults)
- `storage.ts:174-175` (migration lines)
- `gamification.ts:161-164` (both `else if` branches)
- `gamification.ts:52` (`birthdatesFixed >= 500` badge condition — also removed
  wholesale by B6)
- `AchievementCase.tsx:21-22` stat pills — deleted with the component by B6

**(c) Both undo paths must move the score, or neither may claim to.** Unchanged
from v2 and uncontested. Preferred (smaller) form: a parallel
`gamificationHistoryRef` snapshot stack pushed at `App.tsx:365` alongside the
command, restored in `handleHistoryUndo`/`handleHistoryRedo`
(`App.tsx:637-648`). `UpdateStudentCommand.ts` / `BatchUpdateCommand.ts` contain
zero gamification references — confirmed again. Also restore the snapshot in
`executeCommit`'s `catch` (`App.tsx:369-378`) beside the React Query rollback.
Delete the `App.tsx:591` comment calling this "minor."

**(d) One classifier. Definition of done, not follow-on.** Extract the
actionType derivation into a single exported helper in `src/utils/gamification.ts`:

```
export function deriveActionType(original: Student, updated: Student):
  ActionType | null
```

covering grade / birthdate / name / phone / email / address, returning `null`
when no scoreable correction occurred. Call it from **both**
`handleSaveStudent` (`App.tsx:565-577`) and `handleSaveStudentBulk`
(`App.tsx:496-500`), deleting both inline chains. `null` ⇒ skip
`updateGamificationState` entirely: no point, no counter, nothing.

Verified this round by all four critics and by me: the bulk chain branches only
on name/phone/email/address, so a grade- or birthdate-only bulk edit falls to
`'general'` and scores *unconditional* credit — more permissive than the single
-record modal, which at least names the field. `ReviewMode.tsx:166-170` calls
`onSaveBulk`, so this is Review Mode's own bulk-fix control, not a hypothetical
script; admin notes it is the *realistic primary path* for August grade
promotion at volume. Two consequences make this blocking:

- Without it, §1.2's zero-weight ruling is cosmetic — an edit must be
  *classified* grade before it can be excluded from scoring.
- Admin will not sign off on `verifiedFixes` while a second ungated classifier
  exists: *"Do not ship N1's `verifiedFixes` chip against a scoring path that
  still has two classifiers."*

**(e) NEW — fix the persistence key, or none of the above survives a reload.**
`saveGamificationState(state, appId)` (`storage.ts:191`) uses its second
argument as the **encryption passphrase** (`encryptData(state, appId)`) against
a single fixed `GAMIFICATION_KEY` slot. `loadGamificationState`
(`storage.ts:155-158`) decrypts with `appId`. But `handleSaveStudentBulk` calls
`saveGamificationState(currentState, auth)` at **`App.tsx:510`**, where
`auth = btoa(\`${appId}:${secret}\`)` (`App.tsx:489`) — a different passphrase.
The single-record path (`App.tsx:592`), the ghost path (`:324`) and the undo
path (`:631`) all correctly pass `appId`.

Effect: **every Review Mode bulk save re-encrypts the entire gamification state
with the wrong key.** On next load, `decryptData` throws, the `JSON.parse`
fallback also fails (the stored value is ciphertext), and
`getDefaultGamificationState()` is returned — the counter, `fixHistory` and the
Contribution Graph's entire 26-week history silently reset to zero. No error
surfaces; the `catch` only `console.error`s.

Fix: pass `appId` at `App.tsx:510`. (`:476` and `:485` have the same bug in the
bounty handlers; B2 deletes those.) This subsumes half of admin's durability
concern — the counter does not merely fail to *sync*, it currently fails to
*persist* past any bulk operation. N1b's "counted in this browser since
{firstActiveDate}" would itself be reset by the same bug, so this fix is a
prerequisite for N1b being true.

### B9. NEW — what the inert Sandbox Mode forces on Area B

Both admin and children's verified independently: `pco.ts:365-373` sets an
`X-Locus-Sandbox: true` header and then issues the same `PATCH`/`POST` against
live PCO endpoints regardless; `grep -rin sandbox mock-api/` is empty. Nothing
diverts the write. `App.tsx:681` renders a persistent orange "SANDBOX MODE"
banner asserting the opposite.

Gamification credit is applied **optimistically on the local save action**,
ahead of and independent of PCO write success. So a volunteer "practising" in
Sandbox racks up real PCO writes *and* real fix credit, silently, on both
counts. Area B does not fix this. It forces three things on Area B:

1. **A blocking cross-area dependency.** Area A must make Sandbox Mode real or
   delete the toggle and banner. Until then, no Area B surface may present
   `verifiedFixes` as an audit number, because there is no such thing as an
   unreal write and the UI claims there is. Admin: *"Area A must fix or remove
   the Sandbox Mode toggle before I would tell a volunteer coordinator it's safe
   to 'try things' in this tool."* Cheapest honest repair is deletion of the
   toggle, the banner and the `sandboxMode?` field (`storage.ts:15`).
2. **A scope disclaimer that must be written into the ticket.** N1b's provenance
   string discloses *where the count lives*, not *whether the write was real*.
   B3's gate is a scoring fix, not write-path safety. Neither may be cited as
   mitigating Sandbox Mode. Children's: *"any reviewer who reads B3's gate as
   'safe because it's gated' should not also assume Sandbox Mode makes the write
   itself reversible-in-testing. It doesn't."*
3. **A reason B3(c) matters more than it looked.** Optimistic scoring on a write
   path that can fail is the same defect class; the commit-failure rollback is
   the only thing standing between "the write did not land" and "the counter
   says it did."

### B1. Delete Campus Cup — **CONVERGED, unchanged since v1**

Delete `src/components/CampusCup.tsx`, `.css`, `.test.tsx`. `App.tsx`: import
(`:29`), `currentView === 'campus-cup'` block (`:973-980`).
`SidebarCore.tsx:37-43`; `SidebarCore.test.tsx:55`. `ConfigModal.tsx`: Campus
`<select>` (`:236-251`) + state/load/save (`:28,44,62`); `campus?: string` from
`AppConfig` (`storage.ts:22`).

### B2. Delete Bounty Board — **CONVERGED, unchanged since v1**

Delete `src/components/BountyBoard.tsx`, `.css`, `.test.tsx`. `App.tsx`: import
(`:37`), `handleAddBounty` (`:464-477`), `handleDeleteBounty` (`:479-486`),
`bounties` view block (`:964-972`). `gamification.ts:175-188` (the whole
"Process Bounties" block — guarded by `if (nextState.bounties)` on a field no
code path sets; permanently dead as well as untyped).
`gamification.test.ts:177-~230`. `SidebarCore.tsx:29-35`,
`SidebarCore.test.tsx:18,27`, `CoreLayout.test.tsx:30`.

### B4. Delete the celebration layer — **CONVERGED this round**

- Delete `Confetti.tsx`/`.css`/`.test.tsx`, `BadgeToast.tsx`/`.css`/`.test.tsx`.
- `App.tsx`: imports (`:49,50`), `latestBadge`/`showConfetti` state (`:126,127`),
  `setShowConfetti` + timeouts in `handleArchiveGhosts` (`:321-322`) and
  `handleSaveStudent` (`:587-588`), `setLatestBadge` calls (`:320`, `:586`,
  `:512`), `handleAppClick` (`:671-676`), `partyClickOrigin` state, the three
  mounts (`:1061`, `:1063-1065`, `:1067-1071`).
- `ConfigModal.tsx`: Party Mode checkbox (`:178`), confetti theme `<select>`
  (`:186-195`), state/load/save (`:24,25,40,41,58,59`); `partyMode?` /
  `confettiTheme?` from `AppConfig` (`storage.ts:18-19`);
  `ConfigModal.test.tsx:164,172,185,197,205`.
- **Delete `GoldenRecordModal`** (unreachable; 4/4 confirmed): component, `.css`,
  `.test.tsx`; `App.tsx:1` import, `:91` state, `:1032-1035` mount.
- **Inventory fix, not code:** `feature-inventory.md:41` lists `utils/audio.ts`
  under #17. Audio is wired only into `GradeScatter.tsx` and `ReviewMode.tsx`
  (Area A). Badge "combo sounds" do not exist. Do not build them.

### B5. Delete Avatar / level — **CONVERGED, unchanged since v1**

Delete `Avatar.tsx`/`.css`/`.test.tsx`, `src/utils/avatar.ts`, `avatar.test.ts`.
`SidebarCore.tsx`: import (`:3`), footer render (`:108`), `totalFixes` prop
(`:9,12`). `CoreLayout.tsx:8,16,25`. `App.tsx:698`. `IntelligenceLayout.tsx:7`.
Tests: `SidebarCore.test.tsx:7,13,25,33,41,52,63-64`, `CoreLayout.test.tsx:8,19`.
`anomaliesCount` stays — the surviving honest half of that prop pair.

### B6. Delete Achievement Case and the badge system — **CONVERGED this round**

- Delete `AchievementCase.tsx`/`.css`/`.test.tsx`; the `achievements` route
  (`App.tsx:957-962`) and nav button (`SidebarCore.tsx:54-60`).
- `gamification.ts`: delete `BADGES` (`:11-89`), the `Badge` interface (`:3-9`),
  the badge-check block (`:189-~205`), and the `newBadges` half of the return
  signature — `updateGamificationState` returns `GamificationState`.
- `storage.ts`: delete `unlockedBadges` (`:46`), its default (`:151`), its
  migration line (`:180`), and `currentStreak` (`:35`, `:139`) — `streak-master`
  was its last consumer.
- Every `newBadges` consumer in `App.tsx` (`:316-323`, `:503-512`, `:582-588`)
  collapses to a plain state assignment.

### B7. Simplify the header widget — **CONVERGED, spec unchanged from v2**

`src/components/GamificationWidget.tsx`:

- Delete the `streak` prop and `.streak-container` (`:20-23`), and `App.tsx:745`.
- Replace `:25` with two unclamped real numbers:
  `Fixed today: {dailyFixes} · {anomaliesCount} flagged records left`. No
  clamped denominator, no bounded percentage in text; clamp only the bar's fill
  math (`:15-16`) if at all. `anomalies.length` is computed at `App.tsx:272` and
  threaded at `:698`.
- Numerator is corrected by B3(b) + B3(d): `dailyFixes` no longer increments on
  grade or birthdate, through either path.
- `aria-live="polite"` on the widget root (`:19`).
- Ship N1b's provenance tooltip here (UXR: "ship it"; admin: closes my item).

### B8. Contribution Graph — a11y + one copy line — **+1 this round**

- **NEW (UXR):** `ContributionGraph.tsx:67` reads
  `{isAllZero && <span className="subtitle">Start fixing to build your streak!</span>}`.
  B6 deletes `currentStreak` from `GamificationState` and B7 deletes the streak
  chip; after this round nothing called "streak" exists in the product. This is
  the empty-state copy of the one surface the proposal calls honest, promising a
  mechanic that no longer exists. Change to `Start fixing to see it here`, or
  delete the subtitle. One line, same pass.
- `:79-84`: add `role="img"` and
  `aria-label={`${day.count} fixes on ${day.date}`}` per square; wrap
  `.graph-grid` (`:75`) in `role="group" aria-label="Fix activity by day"`.
- **Descoped, still descoped:** org-relative intensity thresholds and the
  `prefers-color-scheme` block. Cosmetic polish on a look-back surface.
- Keep `fixHistory` writes for grade/birthdate edits (B3(b)) — activity, never
  points. B3(e) is what makes that history survive a reload.

---

## 3. Unresolved disagreement

**Nothing substantive remains open.** Rounds 4 and 5 should not be spent
manufacturing conflict here. Stated honestly:

- **Q1 (v2 §3.1) — grade weight: CLOSED.** Youth ruled; children's withdrew its
  concession and ruled the same way; UXR and admin do not contest. Unanimous.
- **Q2 (v2 §3.2) — does anything survive B4+B6: CLOSED.** Yes: the widget and
  the graph. UXR judges the end state coherent and names the widget as
  load-bearing; admin explicitly declines to spend more budget arguing the two
  cheap survivors; youth requires *something* to notice with and names exactly
  these two plus N1/N1b. No one wants an empty area.
- **Q3 (v2 §3.3) — durability / provenance: CLOSED by admin**, conditionally:
  N1b is "the right shape of fix," reopened only if a future round promotes
  `verifiedFixes` into a performance record without the provenance string
  attached. B3(e) is a newly discovered *prerequisite* for N1b being literally
  true, not a reopening.
- **Q4 — does a per-person identity land on any roadmap?** Still no evidence
  either way, carried since v1. This is not critic disagreement; it is a missing
  fact outside the audit's reach. Every verdict here is conditional on the answer
  being no; if it is yes, B6 and B7 are wrong. Log it as a roadmap question for a
  human, not a round-4 debate topic.

Two **conditional reopen triggers** are on the record and should be honoured
rather than pre-argued:

1. **Youth (#14/#17):** if N1/N1b or the Contribution Graph is cut in a later
   round, reopen #14/#17 — a volunteer team with zero in-app acknowledgment and
   no leader dashboard is a real retention risk.
2. **Admin (N1):** reopen durability if `verifiedFixes` is ever shown without
   its provenance line.

**What rounds 4–5 could usefully do instead of re-litigating Area B:** carry
B3 and B9 into Area A's review, where they now belong, and confirm there that
the Sandbox Mode toggle is fixed or deleted.

---

## 4. New ideas — 1 carried, 0 added

No new surface is earned this round; the critics converged on subtraction and
one substrate fix. N1/N1b carry forward unchanged and both are endorsed by UXR,
admin and youth.

### N1 (carried, CONVERGED). `verifiedFixes` replaces `totalFixes` as the only number any surface may display

**Replaces:** correctness-blind `totalFixes`, whose user-visible mounts
(`AchievementCase.tsx:19`, `Avatar.tsx:21,36`, `CampusCup.tsx:94`) are deleted by
B1/B5/B6. Keep `totalFixes` as a raw internal edit tally; add `verifiedFixes`,
incremented only by the B3 gate — i.e. only by email/phone/address/name
corrections that flip a detector, through the single classifier. One field in
`storage.ts:34-48`, one default, one migration line, no new screen.

**Gated on B3(d) and B9.1:** do not ship the `verifiedFixes` chip while two
classifiers exist (admin), and do not present it as an audit number while
Sandbox Mode claims writes are unreal.

### N1b (carried, CONVERGED). …and it carries a provenance line

**Replaces:** the deleted `AchievementCase` "Total Fixes" stat pill.
`GamificationState` already stores `lastActiveDate` (`storage.ts:35`), so
`firstActiveDate` is one more field of the same kind, set once in
`getDefaultGamificationState`. Widget tooltip:
`Counted in this browser since {firstActiveDate}`. No sync, no export, no
backend — the UI simply stops implying the number is durable or shared.
**Prerequisite: B3(e)**, or the "since" date is itself wiped by the next bulk
save.

---

## 5. Subtraction ledger, cumulative

| | |
|---|---|
| Routes removed | 3 — `bounties`, `campus-cup`, `achievements` |
| Routes added | 0 |
| Components deleted | 8 — `CampusCup`, `BountyBoard`, `Avatar`, `GoldenRecordModal`, `AchievementCase`, `Confetti`, `BadgeToast` (+7 test files, +6 CSS files) |
| Utils deleted | 1 — `src/utils/avatar.ts` (+ test); `BADGES` + badge engine removed from `gamification.ts` |
| State fields deleted | `unlockedBadges`, `currentStreak`, `birthdatesFixed`, `gradesFixed`, `bounties` (phantom) |
| State fields added | 2 — `verifiedFixes`, `firstActiveDate` |
| Scoreable actionTypes | 6 → 4 (`email`, `phone`, `address`, `name`) |
| Classifiers | 2 → 1 (`deriveActionType`) |
| Permanent chrome removed | Avatar sidebar footer, streak chip |
| Settings controls removed | 3 (+1 pending Area A: Sandbox Mode toggle) |
| Components added | 0 |
| Silent data-loss bugs fixed | 1 — `App.tsx:510` wrong persistence passphrase |
| TypeScript errors removed | ~25 of 188 distinct |
