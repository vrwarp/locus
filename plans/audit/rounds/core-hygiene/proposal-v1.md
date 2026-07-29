# Area A — core-hygiene — Proposal v1 (Round 1 synthesis)

Inputs: `r1-uxr.md`, `r1-church-admin.md`, `r1-youth.md`, `r1-children.md`.
Every claim below that carries a decision was re-read in source. Where a critic
was wrong, the correction is stated and the decision is built on the verified
fact, not the critique.

---

## 1. Changes since last round

No previous proposal — this is round 1. In place of "what moved", here is what
I **overturned**, because three of these are load-bearing errors that would have
mis-aimed the next round:

1. **CORRECTED (uxr #4, church-admin #4): "Smart Fix All under Speed Run" does
   not exist.** `ReviewMode.tsx:497` gates the button on `!isSpeedRun`. The
   compound scenario both critics built their sharpest finding on — time
   pressure plus unreviewed bulk write — is not reachable. Speed Run still gets
   CUT, on other grounds (§3.4).
2. **CORRECTED (uxr #4/#9): bulk fixes are not outside undo.** `handleFixAll`
   → `onSaveBulk` → `handleSaveStudentBulk` → `BatchUpdateCommand` →
   `commandManagerRef.current.execute()` (`App.tsx:525-535`). Bulk writes are on
   the command stack. **Ghost Protocol's archive is the only write path in Area A
   that is on neither undo system** (`commandManagerRef` appears at `App.tsx:365`,
   `454`, `533` — never in `handleArchiveGhosts`, `300-336`). That narrows the
   converged finding and makes it sharper, not weaker.
3. **CORRECTED (uxr #11, youth #11): `fixName` never touches a correctly-cased
   name.** It runs only where `detectNameAnomaly` is true, i.e. the name is
   all-caps or all-lowercase (`ReviewMode.tsx:131`, and `:84` only reaches commit
   when `mode === 'name'`, set only for `hasNameAnomaly`). `McKenzie` and
   `McDonald` as written are *not* flagged and *not* rewritten. The defect is
   real but is `MCDONALD → Mcdonald`, not `McDonald → Mcdonald`. The children's
   critic stated this correctly; the other two overstated it.
4. **CORRECTED (church-admin #8): Golden Record does not "open itself at 10,000
   fixes."** `setIsGoldenRecordOpen(true)` appears nowhere in the repo. It never
   opens at all.
5. **CONFIRMED unchanged from all four critics:** Ghost Protocol is the highest-
   risk workflow in the area. 4/4 independent convergence in round 1. Treated as
   settled; §3.1 specifies the repair rather than re-arguing it.

---

## 2. Per-feature decisions

| # | Feature | Verdict | Rationale | Converged? |
|---|---------|---------|-----------|---|
| 1 | Dashboard | SIMPLIFY | Router with extra latency; drop the Area C teaser tiles (one home per number), gate Health Score below a minimum N, show the excluded-record count | N |
| 2 | Data Health scatter | SIMPLIFY | Responsive container, shape-not-colour as default encoding, exclusion caption. The "does PCO already do this" question is unsettled → Q1 | N |
| 3 | Smart Fix Modal | MERGE → ReviewMode | Strict subset of ReviewMode with duplicated delta logic (`SmartFixModal.tsx:36-37` vs `ReviewMode.tsx:179-180`) and dead commented code at `:66-68` | N |
| 4 | Review Mode + Speed Run + Zen | CUT Speed Run, KEEP Review Mode, collapse Zen | Speed Run adds no hygiene capability — only a timer and a score on writes to minors' PII. Domain veto (youth + children's) | N (R1 3/4) |
| 5 | Duplicate Detective | KEEP + FIX | Right architecture (punts merge to PCO). One safeguarding fix: sibling warning when both records are `isChild` | N |
| 6 | Ghost Protocol | FIX (safety-critical) | Bulk PATCH to `status:'inactive'` off the command stack, no confirm, no selection, list truncated to 10 while archiving all, false criteria copy | N (R1 4/4) |
| 7 | Family Audit | DEMOTE (cut 3 of 4 checks) | Three of four checks infer relationship type from age subtraction with no relationship data. Survivor folds into the anomaly queue; modal and route deleted | N (R1 3/4 on the household checks) |
| 8 | Golden Record | CUT | Unreachable dead code duplicating a badge that already fires | N (R1 4/4) |
| 9 | Undo / Redo + toast | SIMPLIFY | Two systems sharing one word; ghost archive on neither; shortcut hints for unbound keys | N |
| 10 | Settings / Config | SIMPLIFY | A labelled control that does nothing (`enableSpotify`), and the safety switch is checkbox #5 among jokes | N |
| 11 | Hygiene utilities | FIX `fixName`, CUT `enrichZipCodeAsync` | Casing fix is wrong for a large ethnically-clustered class of surnames; the ZIP path ships minors' household data to an uncontracted third party | N (R1 3/4 on the ZIP call) |

Nothing is CONVERGED yet — convergence requires surviving two rounds unchanged.
Items marked `(R1 n/4)` had that many critics independently reach the same
verdict in round 1 and should not be re-litigated from scratch in round 2.

---

## 3. The concrete work, ordered by value-per-effort

### 3.1 Ghost Protocol — the repair (highest value, ~half a day)

Verified defect set:

* `ghost.ts:14-17` — `!lastCheckInAt` returns `true` before the 24-month test is
  ever reached. No tenure floor. A record entered last week is a ghost.
* `ghost.ts:22-26` — the Groups rescue is dead code that documents itself as
  dead. There is nothing to restore: PCO Groups is deliberately not used.
* `GhostModal.tsx:32` — "Inactive > 24m AND No Groups". Both clauses are false.
* `GhostModal.tsx:40` renders `students.slice(0, 10)`; `:69` calls
  `onArchive(students)` — the full unsliced array.
* `App.tsx:300-336` — bare `for` loop over `archivePerson`, no confirm, no
  selection, and the only Area A write path that never touches
  `commandManagerRef`.
* `GhostModal.tsx:44,60-66` — "Analyze Deeply" fetches `checkInCount`, which
  `isGhost` never reads. Analysis cannot change the archive set.
* `App.tsx:271` — `ghosts` feeds both this modal and `Dashboard.tsx:130`
  "Active Population".

**R1 — `src/utils/ghost.ts`.** Extend `GhostConfig` to
`{ checkInThresholdMonths: 24, minTenureMonths: 6 }`. Rewrite `isGhost`:

1. If tenure (`now - createdAt`) `< minTenureMonths` → `false`. Too new to judge.
2. If `!lastCheckInAt` → `true`. On file past the floor and never attended.
3. Otherwise the existing months-since-check-in test.

Delete lines 22-26 entirely. **Fail closed:** if `createdAt` is absent, return
`false` — never archive a record whose age on file is unknown.

Requires `Student.createdAt`: add to the `Student` interface and populate in
`transformPerson` (`pco.ts:229-289`) from `attributes.created_at`, already
reachable through the index signature at `pco.ts:26`; real PCO People returns it
by default. Add `created_at` to the person fixtures in `mock-api/data.js` —
today only check-in fixtures carry it (`data.js:306,330,354`).

**R2 — `src/utils/ghost.ts`.** Export
`ghostReason(student, config): 'never-checked-in' | 'stale'` so the modal can
state a true per-record reason instead of one global sentence.

**R3 — `src/components/GhostModal.tsx`.** Rewrite as a selection list:

* Delete the `.slice(0, 10)` at `:40` and the "...and N more" line at `:53`.
  Render every row inside a scroll container.
* Add `const [selected, setSelected] = useState<Set<string>>(new Set())`,
  **defaulted empty**, a checkbox per row, and a "Select all N" header control.
* `onArchive(students.filter(s => selected.has(s.id)))` — never the backing
  array. Button becomes `Archive ${selected.size} selected`,
  `disabled={selected.size === 0}`.
* Replace `:31-33` with copy generated from the live config: *"Never checked in,
  or no check-in in {checkInThresholdMonths} months. Records added in the last
  {minTenureMonths} months are excluded."* The string "AND No Groups" is deleted.
* Per row show `ghostReason(s)` and `createdAt` ("on file since"), so "added
  recently, never attended" is visually distinct from "gone two years".
* Delete the "Analyze Deeply" button and the `onAnalyze` prop, and delete
  `handleAnalyzeGhosts` (`App.tsx:276-298`). It is an N-request fan-out whose
  result provably cannot change the archive set, presented as a deeper
  qualification step. If it is kept, it must be relabelled "Load check-in
  counts" — but the honest move is deletion.

**R4 — `src/App.tsx:300-336` + new `src/commands/ArchiveCommand.ts`.**

* New `ArchiveCommand implements Command`, modelled on `BatchUpdateCommand`:
  `execute()` calls `archivePerson(id, auth, sandbox)` per record and records
  which succeeded; `undo()` calls `updatePerson(id, {status:'active'}, auth,
  sandbox)` for exactly those. The inverse write is a two-line reuse —
  `archivePerson` is already just `updatePerson(id, {status:'inactive'})`
  (`pco.ts:421-423`).
* `handleArchiveGhosts` pushes it onto `commandManagerRef.current` on success and
  updates `setCanUndo`/`setCanRedo`, matching `App.tsx:365`, `454`, `533`.
* Typed confirmation before execute for batches over ~5 records: a text input
  requiring the batch count, not `window.confirm`. Below the threshold, one
  explicit confirm step.
* Replace the `alert()` at `:332`/`:334` with the existing toast surface, and
  name the records that failed rather than reporting a bare count.

**R5 — `src/components/Dashboard.tsx:130`.** "Active Population … (non-ghosts)"
inherits `isGhost` and improves for free once the tenure floor lands, but it
still calls a 24-month-stale roster "active". Restate as *"N with a check-in in
the last 24 months"* — describe the measurement, not the judgment.

### 3.2 Cut the third-party ZIP call (~15 lines, safeguarding)

Delete `enrichZipCodeAsync` (`zipCodes.ts:50-70`), its import at
`ReviewMode.tsx:4`, and the `newZip.length === 5` block at
`ReviewMode.tsx:448-457`. Verified: an unconditional browser `fetch` to
`https://api.zippopotam.us/us/{zip}` on every 5-digit ZIP typed while editing a
minor's address, with no gate and no disclosure — and it **unconditionally
overwrites** city/state the user just typed, where the local path correctly fills
blanks only (`:442-443`).

The local `enrichZipCode` (`:44-48`) already does the job with zero egress and
the right semantics. Losing autofill outside 31 metros is the cost; it is a
field the user is typing into anyway. The alternative — disclosure plus an
opt-in — buys autofill by adding a setting to a Settings modal §3.7 is trying to
shrink. Domain veto (youth + children's): minors' household data to an
uncontracted third party is a policy line, not a UX tradeoff.

### 3.3 Fix `fixName` (~20 lines, pure function, trivially testable)

`hygiene.ts:18-26` lowercases then capitalises per space-delimited word.
Verified failures on genuinely-flagged input: `MCDONALD → Mcdonald`,
`O'BRIEN → O'brien`, `SMITH-JONES → Smith-jones`, `III → Iii`.

Split on `[\s\-']` boundaries preserving delimiters; capitalise each segment;
special-case `Mc`/`Mac` prefixes, and leave all-consonant roman-numeral suffixes
(`II`, `III`, `IV`) uppercase. Keep the function — the job (normalise SHOUTING
CAPS) is the product's actual job, and the bar for CUT in this area is high.

Separately, gate the `fixEmail` Levenshtein domain rewrite (`hygiene.ts:74-101`)
out of the bulk path in `handleFixAll` (`ReviewMode.tsx:138-145`): a silent
domain substitution is the one fix in the set that can produce a *valid-looking
wrong address*, and it is the one that most needs a human to see the diff.

### 3.4 Cut Speed Run

Delete: `isReviewModeSpeedRun` (`App.tsx:95`), the Speed Run button
(`App.tsx:782-787`), the `isSpeedRun` prop (`App.tsx:1027`), the countdown effect
(`ReviewMode.tsx:60-76`), `timeLeft`/`score`/`showResults` state, the results
screen, and the `isSpeedRun` branches at `:115-119`, `:167-169`, `:236-238`,
`:497`.

**Why CUT beats SIMPLIFY.** The youth agent's mechanism is verified but
overstated: `App.tsx:547-558` does force-commit the pending update when the next
fix lands, so the 5-second toast only ever protects the most recent edit — but
`executeCommit` still pushes an `UpdateStudentCommand` onto the command stack
(`:365`), so the force-committed write remains undoable from the header, LIFO,
until reload. Speed Run therefore does not make writes *unrecoverable*; it makes
them recoverable only through an affordance the user was not looking at.

That is enough. Speed Run is Review Mode plus a timer, a score and a results
screen; it adds no hygiene capability. Its explicit design goal is to reduce
deliberation time on writes to children's birthdate, name and address. Two
domain specialists flag it on safeguarding grounds and no critic offered a
usability argument for it. SIMPLIFY ("fold into a session-style toggle") loses
because the things to remove *are* the timer and the score — once they are gone
there is no Speed Run left, and a toggle that disables the only two
distinguishing features is a deletion carrying extra config.

With Speed Run gone, `zenMode` reduces to "no timer, play ambient audio", and
the no-timer half is now the only behaviour. Collapse the `zenMode` prop into
`zenAudioTheme !== 'none'` and delete `config.zenMode` from `storage.ts` and
`ConfigModal.tsx`. Three review modes become one.

### 3.5 Family Audit — cut three checks, demote the fourth

Verified: `analyzeFamilies` (`family.ts:101-167`) produces four issue kinds.

**CUT `checkSpouseGap` (`family.ts:16-31`).** Treats any two non-child household
members as spouses and calls a >40y gap `Critical`. There is no relationship
data behind it — `parents` is just `members.filter(m => !m.isChild)`. This is
the exact shape of a grandparent-guardian household.

**CUT the `<15y` parent/child warning (`family.ts:149-158`).** Cross-products
every child against every non-child adult in the household. Teen parents, young
aunts, older-sibling guardians. All legitimate; none are data errors.

**CUT `checkSplitHouseholds` (`family.ts:33-99`).** Flags two household IDs
sharing an address, email or phone as a "Potential Split Household" that
"indicate[s] potential data entry errors" (`FamilyModal.tsx:20-22`). PCO models
joint custody as two households deliberately. This labels the correct shape an
error, permanently, for every co-parenting family in the program. → Q4.

**KEEP the age inversion (`family.ts:134-148`).** `ageDiff < 0` — a child older
than the listed parent — is always a data error regardless of household shape,
and it is the one check that offers a real fix.

**Why CUT beats the UXR's SIMPLIFY.** The UXR proposed raising or configuring
the `<15y` threshold. There is no threshold at which "two adults in a household
are spouses" becomes true; the defect is the missing relationship data, not the
number. Both ministry specialists independently identified this output as not
merely noisy but *socially harmful* — findings a volunteer could act on by
asking a guardian, foster or co-parenting family an intrusive question. Domain
veto outranks the cheaper fix.

**Consequence — DEMOTE.** One check does not earn a nav slot. Fold the age
inversion into the anomaly queue as an additional card type in Review Mode, and
delete `src/components/FamilyModal.tsx`, `FamilyModal.css`, the `'families'`
branch of `handleNavigation` (`App.tsx:657-658`), the `<FamilyModal>` mount
(`App.tsx:1054-1059`), `isFamilyModalOpen`, and the Dashboard quick-action
(`Dashboard.tsx:118-120`). One screen deleted.

Keep `handleFamilySwap` (`App.tsx:420-462`) — it is correctly on
`BatchUpdateCommand` — but add an explicit confirm naming both people. `isChild`
gates check-in eligibility and background-check expectations downstream; a
one-click flip on a pair the tool never verified is actually parent-and-child is
not proportionate to the consequence.

### 3.6 Delete dead weight (near-zero effort)

* **Golden Record.** Delete `GoldenRecordModal.tsx`, `.css`, `.test.tsx`, and the
  three `App.tsx` references (`:1`, `:91`, `:1032-1035`). Verified unreachable:
  `setIsGoldenRecordOpen(true)` exists nowhere. The 10,000-fix moment already
  fires through the `the-golden-record` badge (`gamification.ts:55-59`) on the
  normal `BadgeToast` path. **CUT beats MERGE** (children's) because there is
  nothing to merge — the content already exists and already works; "move it to
  Area B" hands the next area a dead component to re-litigate. Separately,
  strike row #8 from `feature-inventory.md` and replace it with an explicit note
  that **Locus performs no record merging** — "Golden Record" is an MDM term of
  art and its presence in a core-hygiene inventory implies a capability the
  product does not have (Duplicate Detective deliberately hands off to PCO).
* **Spotify.** Delete `ConfigModal.tsx:104-116` and `storage.ts:23`. Verified:
  `enableSpotify` is written to config and read nowhere. A labelled control that
  promises audio and delivers silence is the cheapest possible trust loss.
* **Shortcut hints.** `UndoRedoControls.tsx:17,27` advertise Ctrl+Z / Ctrl+Y.
  Verified: no `keydown` listener and no `ctrlKey`/`metaKey` reference exists
  anywhere in `src/`. Either bind them next to `handleHistoryUndo`/`Redo`
  (`App.tsx:637-647`) or delete the claim. Binding is ~10 lines and is the
  better trade.

### 3.7 Settings — section it, and raise Sandbox Mode

`ConfigModal.tsx` is one flat list. After deleting Spotify and `zenMode`, group
what remains into **Data & Grading** (grade cutoff), **Accessibility**
(colorblind, high contrast, mute), **Fun** (party mode, confetti theme, ambient
audio), and lift **Sandbox Mode** (`:146-158`) out of the list into a visually
distinct banner at the top of the modal, reusing the existing banner treatment
at `App.tsx:681-696`. Verified: config initialises as `{ graderOptions: {} }`
(`App.tsx:75`), so `sandboxMode` is `undefined` — a fresh install writes to
production PCO from the first click. Three critics want it defaulted on for
first run → Q5.

### 3.8 Merge Smart Fix Modal into Review Mode

Delete `SmartFixModal.tsx` / `.css` / tests and route
`GradeScatter`'s `onPointClick` (`App.tsx:794`) into a single-student instance of
`ReviewMode` (`students={[student]}`). ReviewMode already handles all six fix
types against the identical delta logic; SmartFixModal handles two and carries
dead commented code at `:66-68`. The church-admin and children's KEEP votes are
for the *job* (single-record, human-paced fix), which survives the merge intact —
they are not votes for maintaining two implementations of it.

### 3.9 Exclusion accounting (Dashboard + GradeScatter)

Two silent drops compound: `transformPerson` returns `null` for any person with
a missing or unparseable birthdate (`pco.ts:233-241`) and vanishes them from the
whole app, and `App.tsx:793` further filters to `pcoGrade !== null` for the
scatter. `calculateHealthStats` runs only over survivors, so the Health Score is
computed on a population that excludes the worst records from both its numerator
and its denominator. Count both drops at transform time and render one caption:
*"N excluded — no birthdate on file; M shown here have no grade set."*

Also gate the Health Score card (`Dashboard.tsx:82`) below a minimum roster size
— today `total === 0` yields `score: 0` (`analytics.ts:12-18`) and the first
screen a new tenant ever sees reads "Critical".

### 3.10 Duplicate Detective — one safeguarding fix

Keep the feature; both its architecture (no automated merge) and its
anti-false-positive guard (`duplicates.ts:135-149`) are right. Add one thing: in
the merge-instructions panel (`DuplicatesReport.tsx:101-113`), when both records
in a group have `isChild: true` and matched on the address-fuzzy path, render an
explicit warning — *"These may be siblings or twins. Merging combines check-in
history, allergy notes and background-check status irreversibly. Verify before
merging."* Two specialists independently flagged sibling-collision; the
algorithm that produces the suggestion is specifically vulnerable to it, and the
UI currently points the volunteer straight at PCO's merge action with no
friction.

---

## 4. Unresolved disagreement — questions round 2 must settle

**Q1. Does Data Health rebuild a free PCO setting?** The church-admin asserts
Planning Center People already ships annual Grade Promotion with a configurable
month/day cutoff, auto-calculating grade from date of birth — i.e. exactly what
`grader.ts` computes and `ConfigModal`'s Grade Cutoff Date configures. No other
critic addressed it and it cannot be settled from this repo. If true, Area A's
flagship screen measures PCO misconfiguration rather than data health, and the
anomaly count on a correctly-configured tenant should be near zero. This is the
single largest open question in the area and it determines whether §3.9 and the
scatter work are worth doing at all.

**Q2. What population is this tool for?** `App.tsx:793` scopes the scatter to
`pcoGrade !== null` (children and students), while `Dashboard` computes Health
Score over all `students`, and `fetchAllPeople` pulls the entire People database.
Duplicate Detective inherits the grade scope and therefore can never surface a
duplicate adult record. Is Locus a congregation-wide hygiene tool or a kids/
students grade-and-DOB reconciliation tool wearing a broader label? The product
description and the nav both currently imply the former.

**Q3. Which undo survives?** The UXR wants one system; the youth agent wants a
real per-edit stack. The command stack already *is* a per-edit stack — the
5-second toast is the redundant one. But the toast is the only mechanism that
prevents a write from happening at all, where the command stack only reverses
one after the fact against a live API. Which safety property matters more:
never-written, or always-reversible? Answering this decides whether
`pendingUpdateRef` and `UndoToast` are deleted or promoted.

**Q4. Is there a non-judgmental framing for split households?** I cut
`checkSplitHouseholds` outright. The church-admin considered it the part with
genuine value ("not natively flagged the same way" in PCO). Is *"these two
households share a phone number — linked, not wrong"* a finding worth surfacing
as neutral context, or does Duplicate Detective's shared-contact matching
already cover it?

**Q5. Should Sandbox Mode default on?** Three critics say yes. The plausible
worse failure: a volunteer's entire first session produces no real fixes, they
never notice, and they lose an hour — a silent no-op is its own trust problem.
Does default-on need a persistent banner loud enough that it cannot be missed,
and if so is that the same visual budget as just making the safety switch
prominent while leaving it off?

---

## 5. New ideas earned this round (3 max)

**5.1 A per-record "confirmed correct" flag.** Three critics independently hit
the same missing primitive from different angles: the youth agent's redshirted /
held-back / grade-skipped student who is flagged forever with no way to record
"this placement is right" (#2, #3), the same agent's international phone number
permanently failing the US-only `validatePhone` (`hygiene.ts:160-165`), and the
UXR's over-flagging that "trains users to stop reading the list". A `Set<string>`
of `${studentId}:${anomalyType}` in `storage.ts`, honoured by the `anomalies`
filter at `App.tsx:272`, surfaced as a "Mark correct" button beside "Skip" in
Review Mode. No new screen.
**Replaces:** the current meaning of "Skip" (`ReviewMode.tsx:496`), which today
means "see this again forever" and is the reason the queue never empties.

**5.2 Nickname-aware name equivalence in `duplicates.ts`.** The youth agent's
strongest finding: "Nicholas Smith" and "Nick Smith" are the most common real
duplicate in a student database, and full-name Levenshtein ≤2 misses it by a
wide margin, so the single highest-frequency true positive is invisible. A small
canonical map (Nick/Nicholas, Alex/Alexander, Kate/Katherine, Mike/Michael) in
the exact-match path catches most of it.
**Replaces:** the same-address fuzzy path (`duplicates.ts:97-168`) as the primary
matcher for child records. That path is the sibling/twin false-positive
generator two critics flagged; once nickname equivalence carries the true
positives, the fuzzy path can be downranked or suppressed between two `isChild`
records — trading a false-positive generator for a true-positive one rather than
stacking both.

**5.3 A written data-egress line in the README.** `enrichZipCodeAsync` was found
by an auditor reading source, not by anyone reading a doc, and it is the second
undisclosed outbound path in a product that PATCHes production records from a
browser over HTTP Basic auth. One short section listing every host Locus talks
to and what leaves the church's systems.
**Replaces:** §3.2's deletion as the *durable* control — deleting one call fixes
today; a written list is what stops the next one being added by an agent
optimising for feature count.
