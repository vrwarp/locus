# Area B — Gamification (features #12–#18) — Final report

## Verdict

Locus's gamification layer counts something it cannot know. Every number it
displays — total fixes, daily fixes, streak, badges, avatar level, campus score
— is incremented when a *string changes shape*, and presented as if it means a
member record got more correct. It does not: the product has no source of truth
about anyone's name, phone, address or grade, and never asks one. That gap is
not theoretical. `ReviewMode.tsx` ships a "Smart Fix All" button that applies
four deterministic repair functions to the entire anomalous roster with zero
human typing, PATCHes the results to live Planning Center, and credits every one
of them — so the score is, literally, a click counter, and two of the four
repairs invent facts about people while they run. The conclusion after five
review rounds and four domain critics (UX research, church operations, youth
ministry, children's ministry), unanimous at the end: **the score is deleted,
not gated.** Three of seven surfaces are cut outright, one is cut with its
supporting engine, one is simplified to two true sentences, one is kept with
copy and accessibility fixes, and `GamificationState` collapses from 13 fields
to 1. What the audit produced that is worth more than the deletion is the set of
live-write data-integrity defects that only became visible under the pressure of
asking "what exactly is this number counting?" — those are listed as work, and
one of them has already been fixed and shipped.

---

## Per-feature decisions

| # | Feature | Verdict | Rationale | Rounds converged |
|---|---------|---------|-----------|------------------|
| 12 | Bounty Board (`bounties` route) | **CUT** | A team mechanic built on single-browser local state — nobody else can ever see your bounty or your progress. The `bounties` field it reads and writes (`App.tsx:465,474`) is not even declared on `GamificationState` (`storage.ts:33-48`); it is a phantom that survives only because the interface is loose. | 4/4, rounds 1–5 |
| 13 | Campus Cup (`campus-cup` route) | **CUT** | Other campuses' scores are `Math.random()` on a 3-second timer (`CampusCup.tsx:26-37`) rendered as a live inter-campus leaderboard. Mock data presented as insight, in a screen a pastor could show a staff meeting. | 4/4, rounds 1–5 |
| 14 | Achievement Case (`achievements` route) | **CUT** | Thresholds are roster-size-blind — "clear 1,000 Ghosts" and "10,000th fix" (`gamification.ts:43,57`) against churches of 300–1,200 people are unreachable by construction. Separately, every stat it displays (`AchievementCase.tsx:19-20`) is a counter this audit deletes. | 4/4, rounds 1–5 |
| 15 | Gamification Widget (header) | **SIMPLIFY** | Survives as two statements that are true without any gate: how many records you edited today, and how many are still flagged. The streak and the 50-a-day goal bar go — one click of Smart Fix All completes the bar (`GamificationWidget.tsx:13,16`), which is the whole problem in miniature. | 4/4 on verdict, rounds 1–5; numerator re-specified in round 4 |
| 16 | Avatar / level (sidebar footer) | **CUT** | `AVATAR_LEVELS` tops out at 10,000 fixes (`avatar.ts:14-15`). The progress bar can never complete for any real church. Permanent chrome that only ever shows a fraction. | 4/4, unattacked rounds 2–5 |
| 17 | Confetti / BadgeToast / combo sounds | **CUT** | The only trigger is the badge engine, which is itself deleted. It also fired on ghost archival (`App.tsx:312-316`) — celebrating the deactivation of a member's record with confetti, which the youth critic vetoed in round 1 on tone and no one defended since. | 4/4, rounds 1–5 |
| 18 | Contribution Graph (dashboard) | **KEEP + copy fix ×2 + a11y fix** | The only surface whose claim survives: "you were active on these days." Needs its "streak" copy removed and its 182 squares made reachable by a screen reader. | 4/4 on KEEP, rounds 1–5 |
| — | Scoring substrate (`gamification.ts`, `GamificationState`) | **CUT, not fixed** | Four rounds were spent designing a correctness gate. There isn't one. No predicate over `(original, saved)` can distinguish "a human confirmed this with the family" from "a human accepted a guess", because the product never contacts the family. | Reversed in round 4, unanimous in round 5 |
| — | "Smart Fix All" (`handleFixAll`) | **CUT** | One click, whole roster, live PCO writes, invented facts, no preview, no confirmation, no result screen. | New round 4, unanimous round 5 |

---

## The work, ordered by value-per-effort

### 1. Cut "Smart Fix All" — highest value, smallest edit

Delete `handleFixAll` (`src/components/ReviewMode.tsx:123-173`) and its button
(`:497-501`). The four repair functions stay exactly where they already do
honest work: pre-filling the single-record modal at `:84` (name), `:90`
(address), `:93` (phone), where the volunteer sees the suggestion beside
`Current: {value}` (`:490`) before committing.

Why this is first:

- The button's own tooltip is wrong on three counts — it says "safe", it says
  "Name, Phone, Address" while also rewriting email (`:138-145`), and "auto-fix"
  understates what it does.
- It calls `onClose()` immediately (`:172`), so the modal unmounts before the
  writes happen. The volunteer never learns how many records changed or to what.
- It loops `anomalies` (`App.tsx:264`), which is the entire fetched roster
  filtered by anomaly — **children included** (`Student` carries `isChild`;
  `BatchUpdateCommand.ts:31`). A bulk unreviewed write to a minor's address and
  phone number failed the children's-ministry policy floor outright.

**This deletion cascades further than it looks.** `handleFixAll` is the only
caller of `onSaveBulk` (`:170`), which is the only caller of
`handleSaveStudentBulk` (`App.tsx:485-541`). Removing it deletes ~57 lines of
`App.tsx`, the second action classifier (`:493-497`), the local `auth` string
(`:486`) and the bulk `BatchUpdateCommand` path — including the partial-write
bug in item 2. If a bulk control is wanted later it must come back as
preview-diff-then-confirm, and it inherits items 3 and 4.

### 2. Fix the bulk partial-write divergence (or delete it with item 1)

`BatchUpdateCommand.execute` (`src/commands/BatchUpdateCommand.ts:27-40`)
PATCHes records sequentially. If record 400 of 900 throws, records 1–399 are
already written to PCO. `App.tsx:533-540` then catches, alerts *"Failed to
execute bulk update. The changes have been reverted"*, and reverts the local
cache for **every** record including the 399 that succeeded. PCO now holds
changes the app has told the operator were undone and no longer displays. Item 1
removes this path entirely; if any bulk write is ever rebuilt, it needs
per-record success/failure reporting, not a blanket revert alert.

### 3. Fix `fixName`'s name handling — two defects, the second worse than the first

`src/utils/hygiene.ts:18-26` lowercases and blind-title-cases each
space-delimited word. `detectNameAnomaly` (`:4-16`) only tests all-upper and
all-lower, so `fixName`'s output clears the detector for every realistic name —
deterministic, credited, and wrong for a large, ordinary population:
`MCDONALD → Mcdonald`, `O'BRIEN → O'brien`, `MACARTHUR → Macarthur`.

**The larger defect, missed until the final round:** `ReviewMode.tsx:133-134`
re-derives `firstName` and `lastName` from a naive space split of the fixed
name, and `prepareUpdateAttributes` (`src/utils/pco.ts:324-328`) emits
`first_name` / `last_name` to PCO whenever they differ. So the **name fields the
check-in desk searches on** get rewritten:

- "Mary Ann Smith" → first `Mary`, last `Ann Smith`
- "GARCIA LOPEZ, ANA" (a shape that arrives constantly from CSV imports and
  kiosk entry) → first `Garcia`, last `Lopez, Ana`
- any hyphenated, particle or two-word surname, i.e. exactly the blended and
  multi-household families both ministry critics deal with daily

The same split runs in the single-record path at `:223-224`, where at least a
human saw the value. Minimum fix: preserve intra-word capitals the source
already had; special-case `Mc`/`Mac`/`O'`/`D'`; split on `-` as well as space;
leave lowercase particles (`van`, `de`, `der`, `von`) alone; and **stop deriving
`firstName`/`lastName` from the display name at all** — if PCO's own first/last
fields are not being edited, do not send them.

### 4. Stop hardcoding `hasXAnomaly = false`

`ReviewMode.tsx:135, 142, 151, 156` (bulk) and `:204, 210, 216, 225` (single)
assert the anomaly is gone regardless of whether the repair worked. `fixPhone`
returns the input unchanged for a 9-digit number (`hygiene.ts:195`) and
`fixAddress` cannot repair a missing city or a malformed zip at all
(`:125-158` vs. `validateAddress` at `:110-118`) — yet both flags are cleared.
Those flags feed `App.tsx:264`, which is both the input list for Review Mode and
the backlog number the surviving widget will display. Replace each assignment
with a detector re-run: `hasNameAnomaly: detectNameAnomaly(updated.name)`, etc.
**This is the one item the gamification area needs on its own account** — it is
what makes the last remaining number self-correcting.

### 5. Collapse `GamificationState` from 13 fields to 1

After items 6 and 7 delete the consuming surfaces, every counter has zero
remaining consumers. In `src/utils/storage.ts` (`:33-48` interface, `:139-153`
defaults, `:172-179` migrations):

| field | last consumers | disposition |
|---|---|---|
| `totalFixes` | `Avatar.tsx`, `AchievementCase.tsx:19`, `CampusCup.tsx:46,53,94`, `SidebarCore.tsx:9,12,108`, `CoreLayout.tsx:8,16,25`, `IntelligenceLayout.tsx:7`, `App.tsx:690`, 3 badges | delete |
| `currentStreak` | `streak-master` badge, widget prop (`App.tsx:742`) | delete |
| `lastActiveDate` | drove the streak and the daily reset | delete |
| `dailyFixes` | `GamificationWidget.tsx:6,12,15,16,25`, 1 badge | delete and derive |
| `ghostsCleared` | `AchievementCase.tsx:20`, 1 badge | delete |
| `namesFixed` / `emailsFixed` / `addressesFixed` / `phonesFixed` | 4 badges only | delete |
| `birthdatesFixed` / `gradesFixed` | 1 badge; both fields were ruled zero-weight by the ministry critics | delete |
| `unlockedBadges` | the badge engine | delete |
| `bounties` | Bounty Board — and it was never declared on the interface | delete |
| `fixHistory` | Contribution Graph, and the widget's first number | **keep — the only survivor** |

`dailyFixes` is provably redundant: with `count` always 1 (no caller passes the
second argument), `gamification.ts:104-127` makes it exactly `fixHistory[today]`
— same increment, same new-day reset. It is a copy that can only desynchronise.

Result: `interface GamificationState { fixHistory: Record<string, number> }`, and
`updateGamificationState(state, actionType, count)` becomes
`recordActivity(state)` — no action type, no returned badges. `gamification.ts`
loses `BADGES` (`:11-89`), the streak/counter block (`:99-127`, `:149-205`) and
the bounty processing (`:176-188`), keeping only the `fixHistory` increment
(`:130-134`) and the 400-key prune (`:136-147`). Both action classifiers go —
the bulk one (`App.tsx:493-497`) with item 1, the single-record one
(`App.tsx:562-575`) with its only consumer.

### 6. Delete the four cut surfaces

Components and their CSS and tests: `CampusCup`, `BountyBoard`, `Avatar`,
`AchievementCase`, `Confetti`, `BadgeToast`, `GoldenRecordModal`. Util:
`src/utils/avatar.ts` (+ test). Routes: `bounties`, `campus-cup`, `achievements`
— nav entries at `SidebarCore.tsx:30-31,38-39,55-56`, render blocks at
`App.tsx:914-935`. Props: `totalFixes` threaded through
`CoreLayout.tsx:8,16,25`, `IntelligenceLayout.tsx:7`, `SidebarCore.tsx:9,12`
and `App.tsx:690`. Handlers: `handleAddBounty` / `handleDeleteBounty`
(`App.tsx:461-483`).

### 7. Simplify the header widget

`src/components/GamificationWidget.tsx`, mounted at `App.tsx:741-744`:

- Delete the `streak` prop and `.streak-container` (`:5,20-23`) and the
  `App.tsx:742` argument.
- Delete the `dailyFixes` / `dailyGoal` props and the goal bar (`:6-7,13,15-16,
  24-32`) — the clamped percentage, the 50 denominator and `isComplete` all go.
- Replace with two statements and no bar:
  `Edited today: {fixHistory[today] ?? 0} · {anomaliesCount} records still flagged`.
  The denominator comes from `App.tsx:264`, threaded the way `anomaliesCount`
  already is at `:690`.
- **"Edited", not "fixed", not "verified."** That word is the entire ruling.
- Rename `aria-label="Gamification Stats"` (`:19`). Do **not** add
  `aria-live="polite"` — the existing `role="status"` already implies it.
- Depends on item 4: until the anomaly flags are recomputed from the detectors,
  the second number can be driven down by edits that fixed nothing.

### 8. Contribution Graph — copy and accessibility

`src/components/ContributionGraph.tsx`:

- `:67` — `Start fixing to build your streak!` → `Nothing recorded yet`. Nothing
  called a streak exists after item 5, and a volunteer who misses a Wednesday
  should not be told they broke something.
- `:82` — `${day.count} fixes on ${day.date}` → `records edited`. With
  `handleFixAll` gone these are edits a person made; "fixes" is the last place in
  the product still claiming a correction was correct.
- `:79-84` — the squares are bare `div`s carrying only a `title` attribute: no
  role, no accessible name, unreachable by keyboard and by touch. Add
  `role="img"` and `aria-label={`${day.count} records edited on ${day.date}`}`
  per square, and wrap `.graph-grid` (`:75`) in
  `role="group" aria-label="Records edited by day"`.
- `:66` — `Your Activity` is correct; keep it.

### 9. One-line rollback fix

`executeCommit`'s catch (`App.tsx:363-372`) rolls back the React Query cache but
not the activity record, so a PCO write that failed still leaves a mark on the
graph. Restore the pre-save `fixHistory` beside the cache rollback. The
single-record undo path already restores state correctly (`App.tsx:623-625`), and
the bulk path that had no snapshot at all is deleted by item 1. Low stakes now:
an over-counted activity square, not a false correctness claim.

### 10. Cross-area blocker: Sandbox Mode is not a sandbox

Not a gamification feature, but it is this area's worst amplifier and it must be
named. `updatePerson` (`src/utils/pco.ts:389-396`) sets an `X-Locus-Sandbox: true`
header and then issues the same live `PATCH`; `mock-api/` has no sandbox handling
at all; `App.tsx:688` renders a persistent **"⚠️ SANDBOX MODE ACTIVE - Changes
are simulated"** banner. A volunteer told they are practising can rewrite real
member records. Make it real, or delete the toggle, the banner and
`storage.ts:15`'s `sandboxMode?`. Until item 1 lands, "practice mode" plus
"Smart Fix All" is one click from rewriting an entire congregation.

---

## Already shipped during this audit

**1. The persistence passphrase bug — fixed and committed.**
`saveGamificationState(state, appId)` encrypts under its second argument
(`storage.ts:191`), and `loadGamificationState` decrypts with `appId`
(`storage.ts:155-158`). Three call sites were passing `auth` —
`btoa(\`${appId}:${secret}\`)`, a different string — so the next load failed the
AES-GCM auth-tag check, fell through to `JSON.parse` on base64 ciphertext, and
silently returned `getDefaultGamificationState()`. **Every counter and the
entire contribution history reset to zero, with nothing logged and nothing shown
to the user.** All six call sites in `src/App.tsx` (`:321`, `:473`, `:482`,
`:507`, `:589`, `:628`) now pass `appId`. Verified in the working tree.

Worth recording *why* a large test suite missed it: `storage.ts` is mocked
wholesale in `App.test.tsx`, `App.ghost.integration.test.tsx` and
`App.undo.integration.test.tsx`, so no test exercises a real encrypt/decrypt
round trip; the single assertion that checks a `saveGamificationState` call's
second argument targets the one call site that was already correct. That is a
coverage-shape problem, not a rare edge case.

**2. The fictional area code — fixed and committed.**
`src/utils/areaCodes.ts` mapped zip prefix `123` (Schenectady, NY) to area code
**`555`** — the range reserved for fiction, which no carrier routes. `fixPhone`
(`hygiene.ts:172-196`) derives an area code from a person's zip for any 7-digit
number, so a Schenectady record became `+1555XXXXXXX`, which passes
`validatePhone`'s `/^\+1\d{10}$/`, clears the anomaly detector, reports success,
and is written to the live PCO record as a guaranteed-unreachable number. `123`
now belongs to `518` alongside its neighbouring prefixes, where it always
should have been. Recommended follow-up: a unit test asserting no value in
`COMPRESSED_MAPPING` falls in the 555 range.

**Test suite status:** green — 83 files, 521 tests, no failures. Note for anyone
reconciling numbers: an earlier verification in this session recorded 88 files /
545 tests. The difference is not a regression here; five test files were removed
by a separate deletion in another audit area (`GivingRiver`, `GivingTrends`,
`GlobalPulse`, `giving`, `givingTrends`) after that count was taken. The suite
was re-run from a cleared cache to confirm.

---

## What we could not settle

**1. Whether two honest numbers are enough to sustain a volunteer.** The
recommendation removes every social and team acknowledgment mechanic and leaves
a personal widget and a look-back graph. That this is sufficient motivation for a
Tuesday-night volunteer team is **asserted, not observed.** The ministry critics
both said yes — the youth director's argument was that the backlog number is the
only genuinely shared signal in the product and the fake ones were crowding it
out — but nobody has watched a real volunteer use the reduced surface. This
should be checked with actual youth and children's volunteers a few weeks after
the deletions ship, and before anything new is built on top.

**2. There is nothing a volunteer can honestly be congratulated *for*, and no
plan to change that.** An honest congratulation needs a fact the product does not
have: an email that did not bounce, a text that got a reply, a parent who
confirmed an address at drop-off. Every one of those is a real signal; none
exists in Locus. Until one does, there is no number to build. This is a genuine
product gap that the audit identified and did not solve, and it is the reason the
recommendation is a deletion rather than a replacement.

**3. Whether a bulk edit control should be rebuilt.** Planning Center has no
native bulk format-normalize, so the job is real and the church's alternative
today is exporting a list, fixing it in a spreadsheet and re-entering it. The
operations director would sign off on a preview-diff-then-confirm flow — pick a
field, show every proposed change with before and after, deselect rows, then
write — but that is a build nobody has scoped, and it inherits items 3 and 4
before it can ship. Cutting the current button is not contingent on it.

**4. Whether Locus will ever have per-person identity.** Every verdict here
assumes it will not — no accounts, no roles, no leader dashboard, one browser per
church. If that assumption is wrong, the widget, the graph and the state collapse
are all wrong, and a genuinely multi-user acknowledgment layer becomes worth
designing. This is a roadmap question for a human, and it was raised in round 1
and never answered.

**5. Whether `fixEmail`'s fuzzy domain rewrite belongs in the product at all.**
`hygiene.ts:74-101` rewrites a domain to the nearest known provider within a
Levenshtein distance of 1 or 2. Whitespace stripping and the missing-dot repair
are honest normalizations; `aol.co → aol.com` is a guess about someone's mailbox
that happens to satisfy the validator. It is guarded (regional TLDs and four
providers are exempted) and the audit ran out of rounds before deciding whether
the guardrails are sufficient. Flagged, not ruled.
