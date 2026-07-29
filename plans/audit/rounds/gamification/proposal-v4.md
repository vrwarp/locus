# Area B — Gamification — Proposal v4 (Round 4 synthesis)

Inputs: `proposal-v3.md`, `r4-uxr.md`, `r4-church-admin.md`, `r4-youth.md`,
`r4-children.md`. Item IDs B1–B9 stable since v1/v3. Every line number below
re-verified against the working tree at HEAD `63fe9f4` this round (App.tsx
shifted ~3 lines since v3; v3's citations are stale, v4's are current).

**Status: the deletions are CONVERGED. The scoring proposal is not, and it
loses.** Three critics returned CONVERGED — NO RESIDUAL OBJECTIONS. Youth did
not, and youth is right. v3's central positive claim is withdrawn.

---

## 0. Changes since v3

1. **DONE, not pending: the persistence passphrase bug is fixed.** Verified in
   the working tree: `grep -n "saveGamificationState(" src/App.tsx` now returns
   six sites — `:321`, `:473`, `:482`, `:507`, `:589`, `:628` — and **all six
   pass `appId`.** The `auth` argument at the old `:510` (bulk) and `:476/:485`
   (bounty) is gone. App.tsx is clean in `git status`, so the fix is committed,
   not a local edit. B3(e) is closed. It was real (UXR, admin and I each traced
   the AES-GCM auth-tag failure → `JSON.parse` on ciphertext → silent
   `getDefaultGamificationState()`), and it is now shipped.
2. **Youth's objection is SUSTAINED. v3 §1.2 is withdrawn — it was my sentence
   and it was false.** "The four survivors have no derivable correct value a
   script could compute" is wrong on the record. §1.1 below is the ruling.
3. **Youth's proposed *remedy* is REJECTED**, on evidence youth did not have.
   §1.2.
4. **N1 (`verifiedFixes`) is CUT.** This reverses three critics who marked it
   CONVERGED. §1.3 says why that reversal is legitimate and §3/Q1 hands it to
   round 5 as the one live question.
5. **N1b (provenance tooltip) is CUT as moot** — it disclosed the durability of
   a number that no longer exists. Admin's reopen condition becomes unreachable
   rather than satisfied.
6. **B3 collapses.** With no score, the correctness gate, `deriveActionType`,
   and the grade/birthdate zero-weight branch all become unnecessary — the
   things they were protecting are deleted. What survives of B3 is one line of
   commit-failure rollback. §2/B3.
7. **Three new defects found this round, one of them blocking under my own
   mock-data rule:** `areaCodes.ts:29` ships the reserved fictional area code
   `555`; `fixName` mangles a known surname population; `handleFixAll`
   falsifies the anomaly flags that feed the one number I am keeping. §2/B10.
8. **New maximal-subtraction result: `GamificationState` reduces to one field.**
   `dailyFixes` is provably identical to `fixHistory[today]`; every other
   counter loses its last consumer once B1/B5/B6 land. §2/B11.

---

## 1. The ruling on Smart Fix All

### 1.1 Youth is right, and the code is worse than youth reported

Verified line by line:

- `ReviewMode.tsx:497-501` renders **"Smart Fix All"** whenever `!isSpeedRun &&
  onSaveBulk`. `handleFixAll` (`:123-173`) loops **every** anomalous student and
  applies `fixName` / `fixEmail` / `fixAddress` / `fixPhone` with zero human
  typing, then calls `onSaveBulk` → `handleSaveStudentBulk` (`App.tsx:485`) →
  `updateGamificationState` once per record (`:493-505`) → live PCO `PATCH` via
  `BatchUpdateCommand` (`:521`). One click, whole roster, real writes, full
  credit.
- `fixName` (`hygiene.ts:18-26`) lowercases and blind-title-cases each
  space-delimited word. `detectNameAnomaly` (`:4-16`) only tests all-upper /
  all-lower. So `fixName`'s output clears the detector for every realistic name.
  (Strictly: a name whose words are all single letters, "A B", still reads
  all-upper — a curiosity, not a defence.) `MCDONALD → Mcdonald`,
  `O'BRIEN → O'brien`, `MACARTHUR → Macarthur`. Deterministic, credited, wrong.
- `fixPhone` (`hygiene.ts:172-196`) — for a 7-digit number it derives the area
  code from the student's **current** zip (`getAreaCodeFromZip`). Youth's
  parallel to `calculateExpectedGrade` is exact: a public deterministic formula
  standing in for a fact nobody checked, wrong for the ordinary exception
  (family moved, teen kept an out-of-area cell).
- **Worse than youth found:** `areaCodes.ts:29` contains `'555': '123'`. Zip
  prefix 123xx (Schenectady, NY — really 518, and 518's own entry at `:26`
  conspicuously skips 123) maps to **area code 555, the reserved fictional
  range.** A 7-digit Schenectady number becomes `+1555XXXXXXX`, which satisfies
  `validatePhone`'s `/^\+1\d{10}$/`, clears `detectPhoneAnomaly`, earns credit,
  and is written to the church's live PCO record as a guaranteed-unreachable
  number. **Mock data presented as insight is a defect, not a demo** — this is
  the same rule that killed Campus Cup, applied to a value that gets persisted
  to a real system of record. Blocking.
- Youth's read of `address` is correct and is the one useful asymmetry:
  `fixAddress` only expands street abbreviations, while `detectAddressAnomaly`
  tests presence of street/city/state/zip plus a zip regex. **No fixer can flip
  the address detector** — the missing data has to be typed by a person.
  `email` sits in between: whitespace-stripping and the missing-dot repair are
  honest normalizations, but the Levenshtein domain rewrite (`hygiene.ts:84-99`)
  invents a domain (`aol.co → aol.com` at distance 1) exactly the way `fixPhone`
  invents an area code.

So the field set sorts on a new axis v3 never drew — **does a shipped fixer
invent a fact, or only re-render one?**

| field | fixer flips the detector? | fixer invents a fact? |
|---|---|---|
| name | always | yes — capitalization *is* a claim about the person |
| phone | yes (7-digit branch) | yes — area code from zip, and from `555` |
| email | yes | partly — fuzzy domain rewrite |
| address | **no** | no |

One field of four is script-proof, and only by accident of what its detector
happens to demand.

### 1.2 …and youth's remedy still loses

Youth proposes: credit only when the saved value diverges from
`fixName(original)` / `fixPhone(original, zip)`. Reject, on three grounds, the
first of which is decisive and is evidence youth did not check:

1. **The single-record modal pre-fills from the same fixers.**
   `ReviewMode.tsx:84` sets `targetName = fixName(currentStudent.name)`; `:93`
   sets `targetPhone = fixPhone(...)`. So the careful volunteer who opens one
   record, reads it, agrees with the suggestion and clicks "Fix Name" saves a
   value byte-identical to the fixer's output — and would earn **zero** credit
   under youth's rule. The rule pays people for *disagreeing with the tool* and
   punishes them for agreeing with it when it is right.
2. **It is the same species of error it is trying to cure.** "Saved ≠
   `fixName(original)`" is a public, computable predicate. A script appends a
   trailing space, or title-cases one letter differently, and passes. v3's grade
   gate died for making the pass condition publicly computable; this remedy
   re-commits that exact sin one level up.
3. **It measures divergence from a tool, not correspondence to a person.**
   Nothing in the app consults an external source of truth about a name, a
   phone or an address. No predicate over `(original, saved)` can distinguish
   "a human confirmed this with the family" from "a human accepted a guess."

### 1.3 The ruling: the gate does not get fixed, the score gets deleted

Youth asked for a better gate. There isn't one, and the search for one is what
this area has been doing for four rounds. The honest conclusion is the one the
evidence has been pointing at since the grade gate died:

> **Nothing in Locus can honestly count verified corrections, because Locus
> never verifies anything. It detects format anomalies and offers format
> repairs. A detector flipping is evidence that a *string* changed shape, and
> nothing more — regardless of which field it is, and regardless of who clicked.**

Therefore **N1 `verifiedFixes` is CUT**, and with it the correctness gate
(B3(a) already withdrawn in v3; B3(b) and B3(d) now moot), the provenance
tooltip N1b, and every per-field counter. I considered the fully nuclear form
the audit brief names — delete the counter, keep only the backlog number — and
stop one line short of it: `fixHistory` survives, because a date→count map of
*records touched* is a true statement that requires no gate to defend, and it
is already the sole input to the one surface all four critics call honest
(#18). **Activity is recordable. Correctness is not. The product may display
the first and must never display the second.**

Why this reversal is allowed to override three CONVERGED critics: (a) all three
converged on N1 *conditioned on B3's gate holding*, and the gate's stated
justification — v3 §1.2 — is now demonstrated false, so their agreement was to a
premise that no longer exists; (b) the disqualifying evidence (`handleFixAll`,
`fixName`, `areaCodes:29`) reached the loop only in r4 and only from youth;
(c) a domain specialist demonstrating a live exploit outranks a converged spec,
by the same rule that made the grade veto non-re-litigable; (d) admin's own
gate on N1 — "do not ship `verifiedFixes` against a scoring path that still has
two classifiers" — is honoured maximally by deleting the number rather than the
second classifier.

What the critics who wanted a number actually get: the widget's two honest
lines (§2/B7), and the Contribution Graph, relabelled from *fixes* to *records
edited* (§2/B8). Youth's reopen trigger #1 formally fires — see §3/Q1.

---

## 2. Per-feature decisions

| # | Feature | Verdict | Rationale | Converged? |
|---|---------|---------|-----------|-----------|
| 12 | Bounty Board | **CUT** | Team mechanic on single-browser state; dead `bounties` guard | **Y — CONVERGED** (4/4, four rounds) |
| 13 | Campus Cup | **CUT** | `Math.random()` on a 3s timer rendered as live inter-campus fixes | **Y — CONVERGED** (4/4, four rounds) |
| 14 | Achievement Case | **CUT** | Size-blind thresholds; and every stat it displays is a counter this round deletes | **Y — CONVERGED** (4/4); reopen trigger fired, ruled in §3/Q1 |
| 15 | Gamification Widget | **SIMPLIFY** | Survives as two honest numbers: records edited today, records still flagged | **Y — CONVERGED on verdict** (four rounds); numerator re-specified this round |
| 16 | Avatar / level | **CUT** | Bar can never complete; `AVATAR_LEVELS` tops at 10,000 against rosters of hundreds | **Y — CONVERGED** (unattacked r2–r4) |
| 17 | Confetti / BadgeToast | **CUT** | Only trigger is the badge engine, itself deleted | **Y — CONVERGED** (4/4) |
| 18 | Contribution Graph | **KEEP + a11y FIX + copy FIX ×2** | The only surface whose claim ("you were active") survives §1.3 | **Y — CONVERGED on KEEP**; scope +1 line this round |
| — | Scoring substrate | **CUT, not FIX** | v3 said fix the gate; §1.1 shows no gate is defensible. State reduces to `fixHistory` | **N — reversed this round; the round-5 question** |
| — | N1 `verifiedFixes` | **CUT** | Cannot be true while any deterministic fixer ships; §1.1/§1.3 | **N — reverses 3 CONVERGED critics** |
| — | N1b provenance line | **CUT (moot)** | Disclosed the durability of a deleted number | **N — moot, not contested** |
| — | Smart Fix All (`handleFixAll`) | **CUT → Area A** | One click, whole roster, live PCO writes, invented facts, no review | **N — new this round** |
| — | `areaCodes.ts:29` `'555'` | **FIX → Area A, blocking** | Fictional area code written to a live system of record | **N — new this round** |

### 2.1 What the durable outcome of this area now is

v3 §1.1 said the durable outcome was B3, a correctness gate handed to Area A.
**That was wrong and I am not defending it.** The durable outcome of auditing
Area B is smaller and more useful: **auditing the score is what surfaced the
data-integrity defects in the fixers.** The scoring layer was the pressure test
that made `fixName`, `fixPhone` and `areaCodes:29` visible. The score itself
ships as a deletion; the three defects ship as Area A tickets. That is the
trade, stated plainly.

---

## 3. The concrete work, ordered by value-per-effort

### B10. NEW — the fixer defects. **Hand to Area A. `555` is blocking.**

Area B's standing is only to say that no credit may flow from these; the edits
belong to Area A because they corrupt PCO records whether or not a widget
exists. Ordered by severity:

1. **`src/utils/areaCodes.ts:29` — delete or correct `'555': '123'`.** Zip
   prefix 123 belongs with 518 (`:26`). Until then `fixPhone` can write
   `+1555XXXXXXX` to a live PCO record. Add a unit test asserting no value in
   `COMPRESSED_MAPPING` is in the 555 range. Blocking: mock data reaching a
   system of record.
2. **Cut `handleFixAll` (`ReviewMode.tsx:123-173`) and its button
   (`:497-501`).** One click currently mutates the entire anomalous roster in
   live PCO using four deterministic guesses, with no preview and no per-record
   confirmation. Keep the fixers where they already belong — pre-filling the
   single-record modal at `:84`/`:93`, where a person sees the record and the
   suggested value side by side before committing.
   **This deletion cascades further than it looks:** `handleFixAll` is the
   *only* caller of `onSaveBulk` (`ReviewMode.tsx:170`), which is the only
   caller of `handleSaveStudentBulk` (`App.tsx:1004` → `:485`). Cutting it
   removes the entire bulk path — `App.tsx:485-560`, including the second
   classifier (`:493-497`) that was children's whole r4 concern and admin's
   condition on N1, plus the local `auth` (`:486`) and the bulk
   `BatchUpdateCommand` (`:521`). **B3(d)'s "unify the two classifiers" is
   achieved by deleting one of them.** If Area A wants to keep a bulk control,
   it must come back with a preview-diff-then-confirm flow, and it inherits
   items 1 and 3.
3. **`fixName` (`hygiene.ts:18-26`) — Mc/Mac/O'/hyphen/particle handling, or
   stop suggesting names.** Blind title-casing is wrong for a large, ordinary
   and non-random population, and it is the *default prefill* the volunteer
   sees. Minimum: preserve intra-word capitals the source already had, special
   -case `Mc`/`Mac`/`O'`/`D'`, split on `-` as well as space, and leave
   lowercase particles (`van`, `de`, `der`, `von`) alone.
4. **Stop hardcoding `hasXAnomaly = false`.** `ReviewMode.tsx:135, 142, 151,
   156` and `:216` assert the anomaly is gone regardless of whether the fix
   worked — `fixPhone` falls through to `return phone` unchanged for a 9-digit
   number, and `fixAddress` cannot repair a missing city or a malformed zip at
   all, yet both flags are cleared. Those flags feed `App.tsx:269`, which is the
   backlog number the surviving widget displays (§2/B7) and the input list for
   Review Mode itself. Replace each with the detector re-run:
   `hasNameAnomaly: detectNameAnomaly(updatedStudent.name)`, etc. This is the
   one item here that Area B needs on its own account: it is the only thing
   making the last remaining number self-correcting.

### B11. NEW — collapse `GamificationState` to one field

Consequence of §1.3, and the largest single subtraction in the area. Consumer
traces run this round; after B1/B5/B6 delete Avatar, AchievementCase, CampusCup
and the badge engine, **every counter has zero remaining consumers:**

- `totalFixes` → `Avatar.tsx`, `AchievementCase.tsx:19`, `CampusCup.tsx:46,53,94`,
  `SidebarCore.tsx:9,12,108`, `CoreLayout.tsx:8,16,25`,
  `IntelligenceLayout.tsx:7`, `App.tsx:695`, three `BADGES` conditions. All
  deleted by B1/B5/B6. **Delete the field** (`storage.ts:38,143`).
- `ghostsCleared` → `AchievementCase.tsx:20` and one badge. Both deleted.
  **Delete** (`storage.ts:39,144,173`).
- `namesFixed` / `emailsFixed` / `addressesFixed` / `phonesFixed` → four badges
  only. **Delete** (`storage.ts:42-45,147-150,176-179`).
- `birthdatesFixed` / `gradesFixed` → carried from v3's B3(b). **Delete**
  (`storage.ts:40-41,145-146,174-175`).
- `currentStreak` → `streak-master` badge + widget prop (`App.tsx:742`). Both
  deleted. **Delete** (`storage.ts:36,141`).
- `dailyFixes` → `GamificationWidget.tsx:6,12,15,16,25` + one badge.
  **Delete the field and derive it.** With `count` always 1 (no caller passes
  the second argument), `gamification.ts:104-127` makes `dailyFixes` *exactly*
  `fixHistory[today]` — same increment, same new-day reset. It is a redundant
  copy that can only desynchronise.
- `lastActiveDate` → existed to drive the streak and the daily reset. Both gone.
  **Delete** (`storage.ts:35,140`).

Result: `interface GamificationState { fixHistory: Record<string, number> }`,
and `updateGamificationState(state, actionType, count)` →
`recordActivity(state): GamificationState` — no `actionType` parameter, no
`newBadges` in the return, `gamification.ts:100-127` and `:149-205` deleted
outright, leaving only the `fixHistory` increment (`:130-134`) and the 400-key
prune (`:136-147`). Three call sites simplify: `App.tsx:321` (ghost), `:577`
(single save), `:628` (undo). The classifier at `App.tsx:562-575` is deleted
with its only consumer — as is the bulk classifier, via B10.2.

**This makes v3's B3(b) and B3(d) moot rather than done.** The grade and
birthdate zero-weight rulings are honoured in the strongest available form: no
field weighs anything, because there is nothing to weigh. Children's r4
condition ("unification plus zero-weighting together close the hole") is
satisfied by removing the far side of the hole.

### B3. What survives — one line

**(a) WITHDRAWN** (v3). **(b), (d) MOOT** (B11). **(e) DONE** (§0.1).

**(c) — the only survivor.** `executeCommit`'s `catch` (`App.tsx:366`) rolls
back the React Query cache but not the activity record, so a PCO write that
fails still leaves a mark on the Contribution Graph. Restore the pre-save
`fixHistory` there beside the cache rollback. The single-record undo path
already restores the whole state correctly (`App.tsx:628`), and the bulk path
that had no snapshot at all is deleted by B10.2 — so this is now one edit, and
its stakes are honestly low: an over-counted activity square, not a false
correctness claim. Delete the `App.tsx:588` comment calling it "minor" — or
don't; with the score gone, it *is* minor, and v3's insistence otherwise was
downstream of a scoring claim that no longer exists.

### B7. Simplify the header widget — **re-specified this round**

`src/components/GamificationWidget.tsx`, mounted at `App.tsx:741-744`:

- Delete the `streak` prop and `.streak-container` (`:20-23`), and `App.tsx:742`.
- Delete the `dailyFixes` prop and the daily-goal bar (`:15-16, 25`) — the
  clamped percentage, the `dailyGoal` denominator and `isComplete` all go.
- Replace `:25` with two true statements and no bar:
  `Edited today: {fixHistory[today] ?? 0} · {anomaliesCount} records still flagged`.
  Numerator comes from B11's single field; denominator from `App.tsx:269`,
  threaded like `anomaliesCount` already is at `:695`.
  **Neither number claims a correction was correct.** "Edited", not "fixed", not
  "verified" — the word is the entire load-bearing part of this item.
- `aria-live="polite"` on the widget root (`:19`).
- **Depends on B10.4:** until the anomaly flags are recomputed from the
  detectors, the second number can be driven down by edits that fixed nothing.

### B8. Contribution Graph — a11y + two copy lines — **+1 this round**

- `ContributionGraph.tsx:67`: `Start fixing to build your streak!` — nothing
  called "streak" exists after B6/B7/B11. Change to `Nothing recorded yet`.
- **NEW this round — `ContributionGraph.tsx:66`: `Your Activity` is correct and
  should stay, but the per-square label must not say "fixes."** With `handleFixAll`
  gone the counts are per-record edits; call them that.
- `:79-84`: `role="img"` and
  ``aria-label={`${day.count} records edited on ${day.date}`}`` per square; wrap
  `.graph-grid` (`:75`) in `role="group" aria-label="Records edited by day"`.
- **Descoped, still descoped:** org-relative intensity thresholds and the
  `prefers-color-scheme` block.

### B9. Sandbox Mode — **unchanged, still a blocking cross-area dependency**

`pco.ts:365-373` sets `X-Locus-Sandbox: true` and issues the same `PATCH`/`POST`
against live endpoints; `mock-api/` has no sandbox handling; `App.tsx` renders a
persistent "SANDBOX MODE" banner asserting otherwise. Area A must make it real
or delete the toggle, the banner and `storage.ts:15`'s `sandboxMode?`. §1.3
strengthens rather than weakens this: with `verifiedFixes` deleted, no Area B
surface claims anything about writes, so **B9 is the only remaining place where
the product lies about what it did to PCO** — and B10.2 is its worst-case
amplifier (a "practice" click that rewrites the whole roster for real).

### B1, B2, B4, B5, B6 — deletions, **CONVERGED, unchanged**

Unchanged from v3 §2 in substance; the only adjustment is that B6's deletion of
the badge engine and B5's deletion of Avatar are what strand the counters B11
then removes, and B11 additionally deletes `newBadges` from the
`updateGamificationState` signature rather than merely from `App.tsx`'s
consumers. Line citations in v3 are ~3 lines stale against HEAD `63fe9f4`;
re-derive at implementation time rather than trusting either document.

---

## 4. Unresolved disagreement — what round 5 must settle

**Q1 (LIVE, and the only one that matters). Does anything at all survive as
acknowledgment, and is that acceptable to the two ministry critics?**
Youth's r3 reopen trigger #1 — "if N1/N1b or the Contribution Graph is cut,
reopen #14/#17" — **has now fired, and youth is the agent that fired it.** My
ruling: #14 and #17 stay CUT, because every stat `AchievementCase` displays and
every threshold `BADGES` tests is a counter that §1.1 just showed cannot be
honest, so reinstating them reinstates the falsifiable claim youth objected to.
What is left for a Tuesday-night volunteer is: a number that says how many
records they edited today, a number that says how many are still flagged, and a
26-week activity graph. Round 5 must answer, from youth and children's directly:
**is an activity record, with no correctness claim anywhere in the product,
enough — and if not, what could a volunteer honestly be congratulated for?**
I do not think there is a third option between these two, and round 5 should
test that rather than search for a better gate; four rounds of that search is
what produced this deletion.

**Q2 (LIVE, cross-area). Is cutting Smart Fix All acceptable to admin?**
Admin named bulk save "the realistic primary path for August grade promotion at
volume" — but `handleFixAll` does not touch grade at all (`ReviewMode.tsx:131-158`
covers name/email/address/phone only), so the August sweep admin has in mind is
served by the single-record modal today, not by this button. Round 5 should
confirm that reading with admin, and rule whether a preview-diff bulk control is
worth building back. UXR and children's have not yet seen `handleFixAll` at all;
it reached the loop from youth in r4.

**Q3 (CLOSED).** Grade and birthdate weight — closed unanimously in r3, and made
unconditional by B11: nothing weighs anything.

**Q4 (CLOSED by deletion).** Admin's durability/provenance thread. `verifiedFixes`
is cut, so the condition "shipped without its provenance line" is unreachable.

**Q5 (carried since v1, still outside the audit's reach).** Does a per-person
identity — accounts, roles, a leader dashboard — land on any roadmap? Every
verdict here assumes no. If yes, B6/B7/B11 are wrong. A question for a human,
not a round.

**UXR's r4 §3 note stands and is not a disagreement:** that widget + graph is
"enough" for volunteer motivation is asserted, not observed. It should be
checked with real volunteers a few weeks after B1/B2/B4/B6 ship — and after
this round it is the *only* untested assumption left in the area.

---

## 5. New ideas — 0 carried, 0 added

**N1 and N1b are cut, not carried.** No new surface is earned. Round 4's
contribution to this area is a deletion and three Area A tickets. If a future
round wants a number that means something, it needs a source of truth the
product does not currently have — a bounce-back from an email send, a returned
SMS, a parent-confirmed record. Until one exists, there is nothing to count.

---

## 6. Subtraction ledger, cumulative

| | |
|---|---|
| Routes removed | 3 — `bounties`, `campus-cup`, `achievements` |
| Routes added | 0 |
| Components deleted | 8 — `CampusCup`, `BountyBoard`, `Avatar`, `GoldenRecordModal`, `AchievementCase`, `Confetti`, `BadgeToast` (+7 test files, +6 CSS files) |
| Utils deleted | 1 — `src/utils/avatar.ts` (+ test); `BADGES`, the badge engine, the streak engine and the classifier removed from `gamification.ts` |
| Controls deleted | 1 — "Smart Fix All" + `handleFixAll` + the entire `onSaveBulk`/`handleSaveStudentBulk` path (~75 lines of App.tsx) |
| State fields deleted | 11 — `unlockedBadges`, `currentStreak`, `lastActiveDate`, `totalFixes`, `dailyFixes`, `ghostsCleared`, `namesFixed`, `emailsFixed`, `addressesFixed`, `phonesFixed`, `birthdatesFixed`, `gradesFixed`, `bounties` (phantom) |
| State fields added | **0** (was 2 in v3 — `verifiedFixes` and `firstActiveDate` are both cut) |
| `GamificationState` size | 13 fields → **1** (`fixHistory`) |
| Scoreable actionTypes | 6 → **0** |
| Classifiers | 2 → **0** (one unified in v3's plan; both deleted in v4) |
| Numbers displayed that claim correctness | 3 → **0** |
| Permanent chrome removed | Avatar sidebar footer, streak chip, daily-goal bar |
| Settings controls removed | 3 (+1 pending Area A: Sandbox Mode toggle) |
| Components added | 0 |
| Silent data-loss bugs fixed | 1 — wrong persistence passphrase, **DONE this session** |
| Live-write integrity defects handed to Area A | 4 — `555` area code, roster-wide auto-write, `fixName` surname mangling, hardcoded `hasXAnomaly = false` |
