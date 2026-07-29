# Area A — core-hygiene — Proposal v2 (Round 2 synthesis)

Inputs: `proposal-v1.md`, `r2-uxr.md`, `r2-church-admin.md`, `r2-youth.md`,
`r2-children.md`, plus the cross-area Sandbox finding supplied to this round.
Every claim carrying a decision below was re-read in source this round.

---

## 1. Changes since v1

**Killing my own darlings first.**

1. **v1 §3.7 was wrong: Sandbox Mode is not a mitigation, it is a lie.**
   Verified independently: `pco.ts:365-373` sets `X-Locus-Sandbox: true` and
   then issues the identical live PATCH; `grep -ri sandbox mock-api/` returns
   zero. Real PCO ignores unknown headers by definition. My v1 proposed lifting
   this control into a prominent banner — that would have made a no-op *more*
   trusted. Retracted in full. New verdict in §3.2: implement it client-side or
   delete the checkbox this round. Q5 ("should it default on?") is void — a
   default for an inert control is not a question. **No write path in this area
   is justified by Sandbox Mode anywhere in this document.**

2. **v1 kept "Swap Roles" with a name-confirm. The children's critic is right
   and I was wrong.** A confirm dialog that asks "are you sure?" about a
   possibly-wrong repair is not a safeguard, and the tool genuinely cannot
   distinguish "flag is wrong" from "birthdate is wrong". Replaced in §3.6 with
   a two-candidate repair card — which also dissolves the ReviewMode
   single-record architecture mismatch the same critic named, since each
   candidate now writes one field on one person.

3. **v1 omitted grade promotion entirely. It exists, it is fake, and it is in
   scope.** Verified: `automations.ts:63-90` + `AutomationsReport.tsx:83-92,
   269-291`. "Promote" fires `alert('...(Mocked action)')` then
   `handleDismissPromotion(id)` — a local `Set`. No `updatePerson`, no
   `pcoGrade` write, nothing on the command stack. Hardcoded
   `promotionStartMonth = 5` (June 1) ignores `grader.ts:17`'s configurable
   `cutoffMonth`/`cutoffDay` (default Sept 1). `automations.ts:89`'s
   `expectedGrade - currentGrade === 1` silently drops everyone 2+ behind.
   Now §3.3, ranked second by value-per-effort.

4. **Q1 settled (admin ruling, adopted).** PCO's grade auto-calculate is a
   continuously-computed derived field with per-person manual override — not an
   annual batch. Therefore the Diagonal of Truth is a real job **only** for
   tenants without auto-calc on, and as an override/off-cycle-drift catcher
   elsewhere. It is not the congregation-wide flagship the nav implies. #2 is
   re-framed accordingly in §3.5, and the Health Score's claim shrinks with it.

5. **Q3 closed, not carried.** Youth is right that cutting Speed Run does not
   fix the toast: `handleFix` → `handleSaveStudent` (`App.tsx:546-559`)
   force-flushes the pending update on *every* call, at any pace. Committed work
   in §3.4. Youth also concedes its r1 "zero practical undo" was wrong —
   `executeCommit` does push `UpdateStudentCommand`; recorded and not re-argued.

6. **Q2 resolved, but the admin's mechanism is wrong.** Duplicate Detective is
   *not* grade-scoped: `App.tsx:953` passes unfiltered `students`; the
   `pcoGrade !== null` filter at `:793` is scoped to GradeScatter only. The
   admin's *conclusion* is right for a different and worse reason —
   `transformPerson` returns `null` for anyone with no birthdate
   (`pco.ts:233-235`), so the entire app, Duplicate Detective included, is blind
   to every adult without a DOB on file. §3.8 fixes the real cause.

7. **Three items I dropped without mention in v1** (UXR): GradeScatter keyboard
   trap, Dashboard "0 vs no data", Duplicate CSV matched-value column. All three
   accepted, all three cheap, all in §3.9.

**Newly unanimous, folded in:** strip `updateGamificationState(..., 'ghost', ...)`
from `handleArchiveGhosts` (both ministry critics, independently). Verified at
`App.tsx:314-324`; "The Exorcist" badge is `gamification.ts:41-45`. A score on
the riskiest write path in the product. Domain veto — not negotiable in round 3.

---

## 2. Per-feature decisions

| # | Feature | Verdict | Rationale | Converged? |
|---|---------|---------|-----------|---|
| 1 | Dashboard | SIMPLIFY | Drop Area C teaser tiles; gate Health Score below a minimum N; distinguish "0" from "no data"; publish the excluded-record count | N |
| 2 | Data Health scatter | SIMPLIFY + RE-FRAME | Q1 settled: it is an override/off-cycle exception catcher, not congregation-wide health. Ask the auto-calc question; retitle; keyboard-navigable | N (Q1 resolved) |
| 3 | Smart Fix Modal | MERGE → ReviewMode, **with `singleRecordMode`** | Duplicated delta logic is real; UXR is right that an ungated merge attaches Smart Fix All to a point-click. Guard ships in the same change | N |
| 4 | Review Mode + Speed Run + Zen | CUT Speed Run, KEEP+FIX Review Mode, collapse Zen | Speed Run adds no hygiene capability, only a timer and score on writes to minors' PII | **Y** (R1 3/4, R2 uncontested) |
| 5 | Duplicate Detective | KEEP + FIX ×3 | Architecture right (punts merge to PCO). Sibling warning; CSV matched-value column; population widened via #48 | N |
| 6 | Ghost Protocol | FIX (safety-critical) + **strip gamification** + durable log | v1's R1–R5 accepted 4/4. Two additions now unanimous | **Y** (verdict + R1–R3) |
| 7 | Family Audit | DEMOTE — cut 3 of 4 checks, **cut the auto-swap too** | Three checks infer relationship from age subtraction. The survivor keeps its detection but loses its one-assumption repair | **Y** on the 3 cuts; N on the fix action |
| 8 | Golden Record | CUT | Unreachable (`setIsGoldenRecordOpen(true)` exists nowhere); duplicates a badge that already fires | **Y** (R1 4/4, R2 uncontested) |
| 9 | Undo / Redo + toast | FIX (was SIMPLIFY) | Force-flush breaks the toast's promise at any pace; two systems share one word. Interim differentiation ships now | N |
| 10 | Settings / Config | SIMPLIFY + **Sandbox: implement or delete** | Sandbox Mode is inert. A labelled safety control that does nothing is the worst defect in this feature by an order of magnitude | N |
| 11 | Hygiene utilities | FIX `fixName`, CUT `enrichZipCodeAsync` | Casing fix wrong for a large ethnically-clustered surname class; ZIP path ships minors' household data to an uncontracted third party | **Y** (R1 3/4, R2 accepted) |
| — | **Grade promotion** (pulled in from Area C) | FIX (build real) **or** CUT the button — no third option | A control that claims to write grades to PCO and doesn't, at the one week a year it matters most | N (new) |

CONVERGED = same verdict, unchallenged, two rounds running. Round 3 should
spend no words re-arguing a **Y** row; attack the **N** rows and §4.

---

## 3. The concrete work, ordered by value-per-effort

### 3.1 Ghost Protocol — v1 §3.1 R1–R5 stand, plus three additions (CONVERGED core)

R1 (tenure floor, fail-closed on absent `createdAt`), R2 (`ghostReason`), R3
(full list, default-empty checkbox selection, honest copy, delete "Analyze
Deeply"), R4 (`ArchiveCommand` on `commandManagerRef`, typed confirm >5), R5
(Dashboard restatement) are accepted by all four critics and carry unchanged.
Re-read this round and still correct: `ghost.ts:14-17` returns `true` on
`!lastCheckInAt` before any threshold test; `archivePerson` (`pco.ts:421-423`)
is a one-line `updatePerson(id, {status:'inactive'})`, so `undo()` is genuinely
a two-line inverse.

**A1 — delete the reward loop.** Remove `App.tsx:314-324` entirely: the
`updateGamificationState(gamificationState, 'ghost', successCount)` call,
`setLatestBadge`, `setShowConfetti`, `saveGamificationState`. Remove the
`the-exorcist` badge (`gamification.ts:40-46`) and the `ghostsCleared` counter
it reads. Both ministry critics reached this independently; the admin will not
accept it in production and the children's director calls it a drop, not a
disagreement. **Domain veto — this outranks any Area B argument about badge-set
completeness, and Area B does not get to re-open it.** Replace the `alert()` at
`:331-335` with the toast surface, naming failures rather than a bare count.

**A2 — durable archive log (admin's non-negotiable).** `ArchiveCommand`'s
`undo()` lives in `commandManagerRef`, i.e. session memory: a reload strands the
mistake. The realistic failure is noticed weeks later ("this family stopped
appearing on the roster"), long past any tab lifetime. Minimum bar: at execute
time, append `{personId, name, archivedAt, ghostReason, lastCheckInAt,
createdAt, configUsed}` to the write ledger (§5.1) and offer immediate CSV
download. Better, and cheap because it reuses the same PATCH: write a one-line
note onto each PCO record so the reason travels into PCO itself. Do not ship R4
without A2.

**A3 — `isChild` in the confirm string (children's).** The >5 typed
confirmation is sized by count, not consequence. If any selected record has
`isChild: true`, name those children explicitly in the confirm dialog. Three
children is not a smaller act than thirty adults.

**A4 — fixture scope, corrected.** v1 said "only check-in fixtures carry
`created_at`". Verified wrong: `mock-api/data.js:467` sets it on newcomer
adults. But `data.js:117-208`, the household generator producing **every child
fixture**, sets it on none. Under the fail-closed rule that makes `isGhost`
return `false` for every fixture child — the repair becomes undemonstrable in
dev. Populating the household generator is part of this change, not a follow-up.

**Not accepted:** household context in the ghost list ("3 of 4 at this address
are active"). Real job, wrong round — it needs a household roll-up the modal
does not have, and it competes with A1–A4 which are all cheaper and all
unanimous. Carried to §4 Q-C.

### 3.2 Sandbox Mode — implement it in six lines, or delete the control today

Verified: `pco.ts:365-373` sets the header and PATCHes live anyway; nothing in
`mock-api/` reads it; real PCO discards unknown headers. `App.tsx:75`
initialises config as `{ graderOptions: {} }`, so `sandboxMode` is `undefined`
and a fresh install writes to production from the first click.

Two honest options, and only two:

* **Implement client-side.** In `updatePerson` and `archivePerson`, when
  `sandboxMode` is true, return a synthesised success **without issuing the
  request**, and record the intended write to the ledger (§5.1). ~6 lines,
  works against real PCO because it never leaves the browser. Then the UI must
  show the standing banner (`App.tsx:681-696` treatment) *and* a session write
  count, so a volunteer cannot burn an hour producing nothing without noticing —
  the failure mode I raised in v1 Q5 and now consider the reason the ledger is
  the enabling piece.
* **Delete it.** Remove the checkbox (`ConfigModal.tsx:146-158`),
  `config.sandboxMode`, and the `sandboxMode` parameter threaded through
  `pco.ts`. Rely on the confirm + `ArchiveCommand`/`BatchUpdateCommand` undo
  paths this proposal is building.

Shipping neither is the current state and is the worst of the three. A control
labelled as a safety switch that does nothing is strictly more dangerous than no
control, by exactly the argument this proposal already accepts for Spotify, the
unbound Ctrl+Z hint, and the fake Promote button.

**Interim, independent of which option wins (UXR):** on first launch with no
`config` in storage, force an explicit one-time Live/Sandbox choice before any
write path is reachable. If Sandbox is deleted, the same modal becomes a
one-time "this app writes to your production PCO" acknowledgement.

### 3.3 Grade promotion — build it correctly in Area A, or delete the button now

The rule, per the round brief: **no third option.** A leader who clears the
August lane believes the roster rolled over and nothing in PCO changed. That is
worse than absence.

**Build (preferred).** Six points, adopted from the youth spec:

1. **One clock.** Delete `promotionStartMonth = 5` / `promotionStartDay = 1`
   (`automations.ts:73-74`). Derive promotion season from the same
   `cutoffMonth`/`cutoffDay` in `GraderOptions` that `calculateExpectedGrade`
   already consumes (`grader.ts:12-30`) and `ConfigModal` already configures.
   Two "start of year" concepts, one setting.
2. **One write path.** Replace `handleApprove`'s `alert()`
   (`AutomationsReport.tsx:84`) with a real `BatchUpdateCommand`, same shape as
   `handleSaveStudentBulk` (`App.tsx:488-542`): real PATCH of `pcoGrade`, on
   `commandManagerRef`, typed confirmation naming the batch count — the identical
   pattern §3.1 R4 specifies for archiving. Delete `dismissedPromotions` as the
   completion mechanism; a row leaves the lane because the write succeeded.
3. **Honour the override flag first.** The list must be gated by §5.2's
   "confirmed correct" set before anyone is auto-included. This is the sharpest
   collision in the area: a bulk grade write, fired in the one week a volunteer
   is clearing queues fastest, over exactly the redshirted and held-back
   students whose correct placement is most fragile. It ships *with* the flag or
   not at all.
4. **Stop dropping the 2+-behind cohort.** `automations.ts:89`'s
   `=== 1` filter routes them nowhere. Send them to the Data Health anomaly
   queue with the label *"more than one grade behind expected — needs review,
   not auto-promotion."*
5. **Separate send-off from promotion.** `getCollegeSendOffs` (12→13) is not
   attrition and not a promotion; give it its own lane and its own copy.
6. **Put it where the event happens.** Reachable from Data Health /
   GradeScatter, not lane six of eight in an Area C screen nobody opens in late
   August.

**Screen accounting.** This adds no destination: the Grade Promotions and
College Send-Off lanes are *deleted* from `AutomationsReport.tsx` and folded
into Data Health. Combined with §3.6's FamilyModal deletion and §3.7's
GoldenRecordModal deletion, Area A ends this round two surfaces down.

**Delete (fallback).** Remove the Promote button (`AutomationsReport.tsx:287`),
the `'Promote Grade'` branch of `handleApprove`, `handleDismissPromotion`, the
lane (`:269-291`) and `getPendingGradePromotions` (`automations.ts:63-90`).

### 3.4 The undo toast — committed work, not a question (was Q3)

Verified: `handleSaveStudent` (`App.tsx:546-559`) force-flushes any pending
update on *every* invocation. `handleFix` (`ReviewMode.tsx:175-238`) calls it on
each single-record Fix. Two fixes four seconds apart on an untimed Wednesday
queue truncate the first record's 5-second window. The toast says "you can undo
this" and stops being true the moment the next Fix lands, at any pace.

Decision — **the toast's per-edit promise is the redundant one; the command
stack is the real mechanism.**

* Make `pendingUpdateRef` a `Map<studentId, pending>` so concurrent windows do
  not collide, and flush only on unmount/navigate. This preserves the
  never-written property for the record actually being edited, which is the one
  safety property the command stack cannot offer (it reverses a live PATCH after
  the fact; the toast prevents the PATCH).
* Relabel the toast button **"Undo edit"** and give the header buttons a tooltip
  naming what they revert ("Undo: last saved change — Ada Chen, grade 4→5").
  ~10 lines, ships regardless of anything else, and stops the user guessing
  which of two identically-named affordances is live (UXR's r1 #1 defect,
  which v1 deferred with no interim mitigation — that was a mistake).
* Bind Ctrl+Z / Ctrl+Y next to `handleHistoryUndo`/`Redo` (`App.tsx:637-647`).
  Verified again this round: zero `keydown`/`ctrlKey`/`metaKey` references in
  `src/`. The tooltips at `UndoRedoControls.tsx:17,27` are currently fiction.

### 3.5 Data Health — re-framed under the settled Q1

The screen survives, with a smaller and true claim.

* Add one question to `ConfigModal` beside the grade cutoff: **"Does your PCO
  org have automatic grade calculation on?"** If yes, retitle the surface from
  Data Health to *"Grade exceptions"*, drop its contribution to the Health
  Score, and state in-screen that anomalies here are most likely **Locus's
  cutoff disagreeing with PCO's**, not bad data — because for an auto-calc
  tenant with no overrides, that is exactly what a nonzero count means.
* If no, the current framing is honest and the scatter is doing real work.
* Either way: keep the responsive container, shape-not-colour as the default
  encoding, and the exclusion caption from v1 §3.9.

### 3.6 Family Audit — cut three checks (CONVERGED), and cut the auto-swap (new)

The three cuts are unanimous across both rounds and are settled:
`checkSpouseGap` (`family.ts:16-31`), the `<15y` parent/child warning
(`family.ts:149-158`), and `checkSplitHouseholds` (`family.ts:33-99`). All three
infer relationship type from age subtraction over `members.filter(m => !m.isChild)`,
with no relationship data behind them. Q4 is closed with them: a
"these two households share a phone — linked, not wrong" framing is Duplicate
Detective's shared-contact matching wearing a second name, and nobody argued for
it this round.

Keep the age inversion (`family.ts:134-148`): `ageDiff < 0` is a real
inconsistency independent of relationship type.

**New: `handleFamilySwap` (`App.tsx:420-462`) is deleted, not confirmed.** Its
single button encodes one unverified assumption — that the repair is inverting
`isChild` on exactly these two people. The children's critic's counter-case is
decisive: a working 17-year-old marked `isChild: false` beside a sibling whose
birthdate typo reads as 20 fires this check, and one click makes the teenager a
child and the 8-year-old an adult. `isChild` gates check-in ratio, security-tag
and background-check expectations downstream. A name-confirm gives the volunteer
no signal that the *birthdate* is the likelier error. Domain veto.

**Replacement — a two-candidate repair card**, which also dissolves the
architecture mismatch (`currentStudent = students[currentIndex]`,
`ReviewMode.tsx:78` — one Student per card):

* Card states the inconsistency and shows both people with birthdates and flags.
* Two actions, **neither pre-selected**, ordered by real-world frequency:
  **(a) Correct a birthdate** — opens the existing birthdate editor on the
  person the volunteer picks; **(b) Change a child/adult flag** — one flag, one
  person.
* Each action writes one field on one person through the existing
  `UpdateStudentCommand` path. No atomic two-person write exists any more, so
  each is a normal single-record card and the queue's shape is unchanged.
* Third action: **"Both look right"** → §5.2's confirmed-correct set.

Deletions unchanged from v1: `FamilyModal.tsx`, `FamilyModal.css`, the
`'families'` branch of `handleNavigation` (`App.tsx:657-658`), the
`<FamilyModal>` mount (`:1054-1059`), `isFamilyModalOpen`, the Dashboard
quick-action (`Dashboard.tsx:118-120`).

### 3.7 Cuts and dead weight (CONVERGED, near-zero effort)

* **Speed Run.** `isReviewModeSpeedRun` (`App.tsx:95`), the button (`:782-787`),
  the `isSpeedRun` prop (`:1027`), the countdown effect
  (`ReviewMode.tsx:60-76`), `timeLeft`/`score`/`showResults`, the results
  screen, and the branches at `:115-119`, `:167-169`, `:236-238`, `:497`. Then
  `zenMode` collapses to `zenAudioTheme !== 'none'`; delete `config.zenMode`
  from `storage.ts` and `ConfigModal.tsx`. Three review modes become one.
* **Golden Record.** `GoldenRecordModal.tsx`, `.css`, `.test.tsx`, and
  `App.tsx:1`, `:91`, `:1032-1035`. The 10,000-fix moment already fires via the
  `the-golden-record` badge (`gamification.ts:55-59`). Also strike row #8 from
  `feature-inventory.md` and note explicitly that **Locus performs no record
  merging** — "Golden Record" is an MDM term of art implying a capability the
  product deliberately does not have.
* **Spotify.** `ConfigModal.tsx:104-116` and `storage.ts:23`. `enableSpotify` is
  written and read nowhere.
* **The ZIP egress.** `enrichZipCodeAsync` (`zipCodes.ts:50-70`), its import
  (`ReviewMode.tsx:4`), and the `newZip.length === 5` block (`:448-457`). An
  unconditional browser `fetch` to `api.zippopotam.us` on every 5-digit ZIP
  typed while editing a minor's address, which then *overwrites* city/state the
  user just typed — where the local path correctly fills blanks only
  (`:442-443`). Local `enrichZipCode` keeps the job with zero egress.
* **`fixName`.** `hygiene.ts:18-26` lowercases then capitalises per space-
  delimited word: `MCDONALD → Mcdonald`, `O'BRIEN → O'brien`,
  `SMITH-JONES → Smith-jones`, `III → Iii`. Split on `[\s\-']` preserving
  delimiters; special-case `Mc`/`Mac`; leave roman-numeral suffixes uppercase.
  Separately, gate `fixEmail`'s Levenshtein domain rewrite
  (`hygiene.ts:74-101`) out of `handleFixAll` (`ReviewMode.tsx:138-145`) — it is
  the one fix that can produce a *valid-looking wrong address*.

### 3.8 Smart Fix merge — accepted with the UXR's guard as a precondition

Verified: `ReviewMode.tsx:497` gates Smart Fix All on `!isSpeedRun && onSaveBulk`,
not on record count. Routing `GradeScatter`'s `onPointClick` (`App.tsx:794`)
into `<ReviewMode students={[student]}>` as v1 specified would attach an
unreviewed bulk name/email/address/phone rewrite to every scatter dot, on a
surface that today can only touch grade and birthdate. That is a new attack
surface introduced while patching an old one. The UXR is right.

**Ship the merge with `const singleRecordMode = students.length === 1`**, which
hides the `{currentIndex + 1} / {students.length}` counter (`:300-302`),
relabels Exit → Cancel, replaces Skip with Cancel, and **hard-disables Smart Fix
All regardless of `onSaveBulk`**. Then delete `SmartFixModal.tsx` / `.css` /
tests. The alternative — extracting `<GradeBirthdateFixCard>` and keeping
SmartFixModal as a thin wrapper — is also acceptable and is strictly safer; what
is not acceptable is the merge without one of the two. The duplicated delta
logic (`SmartFixModal.tsx:36-59` vs `ReviewMode.tsx:351-367`) is the real prize
either way.

### 3.9 Population, exclusions, and the three restored items

**Widen the population at the source.** `transformPerson` returns `null` when
`birthdate` is absent or unparseable (`pco.ts:233-241`), removing that person
from the entire app. That, not any grade filter, is why Duplicate Detective
"structurally cannot find a duplicated grandmother" — `App.tsx:953` already
passes unfiltered `students`. Change `transformPerson` to return a `Student`
with `birthdate: null`, `calculatedGrade: null`, `delta: null`, and let each
consumer filter: GradeScatter keeps `pcoGrade !== null` *and* adds
`birthdate !== null`; the grader skips them; `duplicates.ts` (which reads no
date field at all — verified) gains the whole adult roster for free. This is one
change serving the admin's Duplicate ruling, Q2, and the exclusion accounting.

**Exclusion caption.** Count both drops at transform time and render:
*"N have no birthdate on file and are excluded from grade checks; M shown here
have no grade set."* `calculateHealthStats` currently runs only over survivors,
so the Health Score omits the worst records from both numerator and denominator.

**Restored from v1's silent drops:**

* **GradeScatter keyboard trap.** `tabIndex={0}` on every point
  (`GradeScatter.tsx:110,127`, with `role="button"` and `onKeyDown`) means a
  keyboard or screen-reader user tabs through several hundred stops with no
  escape. Add a skip-to-next-anomaly control and a container-level roving
  tabindex so only the focused point is in the tab order.
* **Dashboard "0 vs no data."** `burnoutCandidates` / `recruitmentCandidates`
  render `0` identically whether the org is healthy or has no Check-Ins data.
  Render "—  no check-in data" when the underlying source is empty. Separately,
  gate the Health Score card (`Dashboard.tsx:82`) below a minimum roster size:
  `total === 0` yields `score: 0` (`analytics.ts:12-18`), so the first screen a
  new tenant ever sees reads "Critical".
* **Duplicate CSV.** `handleExport` (`DuplicatesReport.tsx:21-32`) emits Group
  ID, Match Criteria, Person ID, Name, Email, Phone — but not the **matched
  value**. An admin working the list offline cannot see *what* matched without
  reopening the app. Add a `Matched Value` column.

### 3.10 Duplicate Detective — the sibling warning (unchanged from v1)

In the merge-instructions panel (`DuplicatesReport.tsx:101-113`), when both
records in a group have `isChild: true` and matched on the address-fuzzy path,
render: *"These may be siblings or twins. Merging combines check-in history,
allergy notes and background-check status irreversibly. Verify before merging."*
Two specialists flagged sibling collision independently and the algorithm is
specifically vulnerable to it.

---

## 4. Unresolved disagreement — for round 3

**Q-A (sharpest). Implement Sandbox Mode or delete it?** §3.2 forces the
choice but does not make it, because it turns on a fact no critic has supplied:
does anyone actually use a dry run, or is a session that silently writes nothing
the bigger trust failure? The stakes rose this round — `ArchiveCommand` and the
promotion `BatchUpdateCommand` both land in Area A, so whichever way this goes,
two new bulk write paths must honour it or must not exist. Round 3 must pick
one, and the ministry critics are the right people to answer "would you dry-run
first?"

**Q-B. Can Locus read PCO's auto-calculate setting, or must it ask?** §3.5
re-frames the whole screen on a config question the admin must answer manually.
If the PCO People API exposes the org-level grade setting, Locus should read it
and reconcile its own cutoff against it automatically (§5.2) — and a hand-typed
answer that drifts out of date is worse than none. This is checkable against the
API and should not survive another round unanswered.

**Q-C. Ghost sweeps remain per-individual.** The children's director's case —
one child in an otherwise-active family of four, irregular attender or checked
in under the other parent's profile — is unaddressed by the tenure floor. Is a
household roll-up column ("3 of 4 at this address active in the last 24 months")
worth the aggregation, or does the default-empty selection list plus
`ghostReason` already put enough in front of the volunteer?

**Q-D. Does the 2+-grades-behind cohort belong in the anomaly queue at all?**
§3.3 routes them there, but under the settled Q1 an auto-calc tenant's
2+-behind records are overwhelmingly *manual overrides* — held-back and
redshirted kids — i.e. exactly the population §5.2 exists to silence. Round 3
should say whether that cohort is a queue item or a report line.

---

## 5. New ideas earned this round (3 max)

**5.1 A durable write ledger.** One append-only local log of every PCO write
Locus attempts — `{personId, name, field, before, after, at, source, sandbox}` —
persisted in `storage.ts`, exportable as CSV, with a session counter in the
header. One primitive answers three separate asks that arrived independently
this round: the admin's durable archive record that outlives the tab (§3.1 A2),
the session-scoped-undo durability gap that `ArchiveCommand` inherits, and the
only way a volunteer can tell that a Sandbox session did nothing (§3.2).
**Replaces:** the per-feature `alert()` confirmations
(`App.tsx:331-335`, `AutomationsReport.tsx:84`) and the ghost-specific CSV the
admin asked for — a general ledger costs the same and covers every write path.

**5.2 The "confirmed correct" flag, re-earned and now load-bearing.** Carried
from v1 §5.1, but its justification changed: the admin's Q1 ruling shows PCO
already models this as a per-person grade override — which Locus **cannot see**,
because it reads only the resulting `grade` field. So Locus flagging an override
forever is not a missing nicety, it is Locus mistaking PCO's correct answer for
an error. A `Set<string>` of `${studentId}:${anomalyType}` in `storage.ts`,
honoured by the `anomalies` filter (`App.tsx:272`), surfaced as "Mark correct"
beside Skip. It is now a hard precondition for §3.3's bulk promotion write, not
a quality-of-life item.
**Replaces:** the current meaning of "Skip" (`ReviewMode.tsx:496`), which means
"show me this again forever" and is why the queue never empties.

**5.3 Reconcile Locus's cutoff against PCO's, instead of configuring it
separately.** Locus's grade cutoff (`ConfigModal`, `grader.ts:3-4`, default
Sept 1) is set in ignorance of PCO's, and `automations.ts` invents a third date
(June 1) on top. Every anomaly this area surfaces for an auto-calc tenant is
downstream of that divergence. If Q-B says the setting is readable, read it and
delete the control; if not, the setting must at minimum be presented as *"must
match your PCO org setting"* with the consequence stated.
**Replaces:** the standalone Grade Cutoff Date fields in `ConfigModal.tsx` and
the hardcoded June 1 in `automations.ts:73-74`.

Nickname-aware duplicate matching (v1 §5.2) is carried forward unattacked and
unchanged; it is not counted as new this round.
