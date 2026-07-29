# Area A — core-hygiene — Round 3 (UXR)

Scope per brief: (1) confirm `singleRecordMode` closes the Smart Fix hole,
(2) confirm the three restored round-1 items, (3) judge the end state of the
area. #4, #6, #7, #8, #11 not re-opened.

---

## 1. `singleRecordMode` guard — closes the hole, one loose end

Re-read `ReviewMode.tsx` as it stands today (proposal not yet implemented)
against the §3.8 spec.

* **Bulk button.** `:497` currently gates Smart Fix All on
  `!isSpeedRun && onSaveBulk` only — record count plays no part, so a
  `GradeScatter` point click routed into `<ReviewMode students={[student]}>`
  would show the button today. The spec's `hard-disables Smart Fix All
  regardless of onSaveBulk` when `students.length === 1` closes exactly this.
  **Confirmed closed.**
* **"1/1" counter.** `:300-302` renders `{currentIndex + 1} / {students.length}`
  unconditionally. For a single-record entry this is a progress readout with
  nothing to progress through — it implies a queue that isn't there. Hiding it
  under `singleRecordMode` is the correct, minimal fix. **Confirmed closed.**
* **Undefined Skip.** `handleNext` (`:111-121`): with `students.length === 1`,
  `currentIndex < students.length - 1` is always false, so Skip today already
  silently degrades to "close, unsaved" — identical to Exit — but is still
  labelled "Skip," which promises movement to a next record that doesn't
  exist. Relabelling Skip → Cancel matches what the button actually does.
  **Confirmed closed**, functionally a no-op change, purely a truth-in-labelling fix.
* **One loose end, not a re-open.** §3.8's own wording — "relabels Exit →
  Cancel, replaces Skip with Cancel" — reads as two buttons both ending up
  labelled "Cancel" (`:303` header Exit and `:496` footer Skip both survive,
  both now say Cancel). Since both do the same thing in single-record mode,
  round 4 should just say explicitly: keep one Cancel button, remove the
  other, not render two identically-labelled buttons on one card. Cheap,
  doesn't change the verdict.

Residual, unflagged by the guard but not new: the mode-switcher tabs
(`:311-348`, Fix Name/Email/Address/Phone) render unconditionally regardless
of which anomaly routed the student in, so a `GradeScatter` single-record
session now exposes edits to fields GradeScatter never used to touch. This is
reviewed, single-field, per-record editing through `handleFix` — not the
unreviewed-bulk pattern the hole was about — so it does not reopen the
finding. Worth one line in the ship checklist, not a blocker.

## 2. Three restored items — confirmed present and accurately described

* **GradeScatter keyboard trap.** `GradeScatter.tsx:110,127` — `tabIndex={0}`
  on both the anomaly triangle and the default circle, `role="button"`,
  `onKeyDown`, no skip-to-next-anomaly and no roving tabindex anywhere in the
  file. A keyboard/screen-reader user tabs through every rendered point.
  Confirmed as described.
* **Dashboard "0 vs no data."** `Dashboard.tsx:62-63` — `burnoutCandidates`
  returns `[]` when `checkIns.length === 0`, rendered at `:95` as the same
  raw `0` a genuinely-healthy congregation would show. `:78-83` Health Score
  card has no minimum-N gate; `total === 0` still renders a value and labels
  it via the same `score > 50` ladder, i.e. "Critical" is reachable with zero
  data. Confirmed as described, no correction needed.
* **Duplicate CSV matched-value column.** `DuplicatesReport.tsx:21-31` —
  `handleExport` emits Group ID, Match Criteria, Person ID, Name, Email,
  Phone. No column carries the value that actually matched (which phone,
  which fuzzy address). Confirmed as described.

## 3. End state of the area

**Verdict: yes, and it's the strongest this area has looked across three
rounds — with one framing correction to the round brief itself.**

The brief describes the end state as "a new grade-promotion surface." That
overstates it: §3.3 point 6 and the "screen accounting" note explicitly fold
promotion and college send-off into Data Health with **no new destination**
— `AutomationsReport.tsx`'s two lanes are deleted, not relocated to a new
nav item. Net nav change for Core is a genuine reduction: Dashboard, Data
Health (renamed, absorbs promotion), Review Mode (unified, absorbs Smart
Fix and the Family two-candidate card), Duplicate Detective, Ghost Protocol,
Settings — six top-level surfaces. "Family Audit" is not merely demoted in
the sense of staying as a lesser nav item; per the deletions list
(`App.tsx:657-658`, `:1054-1059`, `isFamilyModalOpen`,
`Dashboard.tsx:118-120`) it is dissolved entirely — the surviving
age-inversion check becomes just another anomaly type feeding the one
Review Mode queue, same as a bad email or a bad phone. That's a bigger,
better cut than "demoted" suggests, and the brief should say so plainly in
round 4/5 write-ups so the win isn't undercounted.

For Emily at 8pm on a Tuesday: Dashboard triages and links out; Data Health
is now an honest exception queue (re-titled, scoped by the auto-calc
question, promotion folded in) instead of a fake congregation-wide score;
Review Mode is one queue with one safety model (real undo window, real
command stack, real ledger) instead of three cosmetically different modes
sharing a lie about what Ctrl+Z does; Duplicate Detective still correctly
refuses to auto-merge; Ghost Protocol no longer scores an archive as a game.
Every remaining write path in this document, once §5.1's ledger and §5.2's
override flag ship, either writes something real and undoable or has been
deleted. That is the fix for the credibility problem this whole audit
started from — Sandbox Mode lying, Golden Record being unreachable,
Promote firing an `alert()`. A volunteer who uses Core this round for the
first time is not lied to by a single remaining screen, which was not true
at v1.

One residual defect, not a blocker: folding grade-promotion's bulk
`BatchUpdateCommand` action into the same screen as the passive anomaly
scatter means Data Health now carries two different interaction models
(browse-and-drill-into-Review-Mode vs. batch-approve-in-place) under one
re-scoped name, at exactly the one week in August when it's used hardest.
Watch this in round 4/5 for crowding, but it does not change the verdict —
this is still a coherent, honest workspace, and for the first time in this
audit, Core reads like the reason the product should exist rather than a
liability sitting next to Intelligence's mock charts.
