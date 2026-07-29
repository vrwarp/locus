# Area A — core-hygiene — Round 2 (Adversarial) — Youth Ministry Critique

Reviewer: youth pastor persona. Responding to `proposal-v1.md`.

---

## 1. The overturn on Speed Run (§1.1) — verified, and I concede the overstatement

`ReviewMode.tsx:497` (`{!isSpeedRun && onSaveBulk && (...)}`) is real. Smart Fix All
is not reachable under Speed Run. I did not claim that combination in round 1
(that was uxr/church-admin), so nothing of mine is corrected here — but I did
overstate the undo consequence in round 1 (#4/#9: "no practical undo once the
next card loads"). Checked `App.tsx:339-378`: `executeCommit` pushes an
`UpdateStudentCommand` onto `commandManagerRef` even when it fires from the
force-flush branch. **Conceded:** a force-committed edit is not unrecoverable —
it is reversible via the header Undo/Redo, LIFO, until reload. My round-1 "zero
practical undo" was wrong. The proposal's §3.4 rebuttal on this specific point
is correct.

## 2. But the mechanism is not Speed-Run-scoped — cutting Speed Run is only half the fix

Verified `handleFix` (`ReviewMode.tsx:175-238`) — the plain single-record "Fix
Grade"/"Fix Name"/etc. button used in ordinary, untimed Review Mode — calls
`onSave(updatedStudent)`, which is `handleSaveStudent` (`App.tsx:546`). That
function's force-flush (`App.tsx:548-559`, "If there is an existing pending
update, flush it immediately") runs on *every* call, Speed Run or not. A leader
working a normal Wednesday-night queue who clicks Fix on record 1, then Fix on
record 2 four seconds later — completely ordinary pace for a one-field grade
correction, no timer, no score — still force-commits record 1's write with the
5-second `UndoToast` window cut short. The toast promises "you can undo this"
and that promise breaks at any pace, not just a race pace.

**Ruling: cutting Speed Run is REAL but PARTIAL, not cosmetic.** It removes the
one thing that actively rewards speed over accuracy on writes to a minor's
identifying data — that's a genuine win and I'll take it. But the proposal
parks the actual structural fix (a real per-edit queue, or dropping the toast's
false single-edit promise in favor of documenting the command-stack Undo as the
real safety net) in **Q3 as an open question**, not in §3 as committed work.
That's a gap: the defect lives in the feature the proposal is *keeping*
(plain Review Mode), not the one it's cutting. §3 needs a 3.11: either (a) make
`pendingUpdateRef` a per-student map so concurrent 5-second windows don't
collide, or (b) delete the toast's implied per-edit guarantee and point users
at the header Undo/Redo as the one documented mechanism. Leaving it to "which
undo survives" as a future question, after already committing to CUT Speed Run
as if that resolves the safety story, overstates what round 2's proposal
actually ships.

## 3. Grade promotion — the proposal is silent, and there is a live defect it should have found

The proposal's Area A scope (#1-#11) never mentions grade promotion as an
event. But the mechanism already exists in the codebase — just filed under
Area C, and broken in a way that matters directly to `calculatedGrade`:

`getPendingGradePromotions` (`src/utils/automations.ts:63-90`) computes exactly
what I asked for in round 1: after a hardcoded June 1 (`promotionStartMonth =
5`, **not** the configurable `cutoffMonth`/`cutoffDay` from `ConfigModal.tsx`/
`grader.ts` — two different "start of year" concepts that don't share a
setting), it finds children exactly one grade behind `calculatedGrade` and
surfaces them as `PromotionAction`s in `AutomationsReport.tsx:269-291` with a
**"Promote" button**.

**That button does nothing.** `handleApprove` (`AutomationsReport.tsx:83-92`):
`alert('Action "Promote Grade" approved for student ${id}. (Mocked action)')`,
then `handleDismissPromotion(id)` — a local `Set` that just hides the row.
There is no `updatePerson` call, no `BatchUpdateCommand`, no `pcoGrade` write,
nothing on the undo stack. A leader who clicks "Promote" for every student in
the August lane believes the whole roster just rolled over. **Nothing in real
PCO changed.** The very next Data Health pass will show the exact same
"pending promotion" set, now silently contradicting a UI that already told the
leader it was handled. This is worse than doing nothing, because it manufactures
false confidence at the one moment in the year (per-persona #1) that matters
most.

Also verified: the filter `expectedGrade - currentGrade === 1` (`automations.ts:
89`) deliberately excludes anyone 2+ grades behind — the test comment even
flags it: *"Too far behind (Anomaly, not simple promotion)."* Those students
fall out of the promotion lane entirely and are never routed anywhere from
here; they're only findable if a leader separately visits Data Health and
happens to sort by delta.

### What a correct grade-promotion-aware Data Health screen does

1. **One clock.** Promotion season is defined by the same `cutoffMonth`/
   `cutoffDay` from `ConfigModal.tsx` that already drives
   `calculateExpectedGrade` (`grader.ts:12-30`) — not a second hardcoded
   June 1 in `automations.ts`. A church whose state cutoff isn't Sept 1 gets a
   promotion prompt on the wrong date under the current split.
2. **One write path.** "Promote All" for the exactly-one-behind cohort is a
   real `BatchUpdateCommand` (identical shape to `handleSaveStudentBulk`,
   `App.tsx:488-542`) — on the command stack, real PATCH to PCO, typed
   confirmation naming the batch count (same pattern the proposal already
   specifies for Ghost Protocol at §3.1 R4). Delete the `alert()` mock.
3. **Honor the override flag before auto-including anyone.** The proposal's
   own §5.1 "confirmed correct" flag has to gate this list, or "Promote All"
   silently bumps every redshirted/held-back student the exact week their
   correct placement is most likely to get overwritten by a well-meaning
   volunteer clearing the August queue fast. This is the single sharpest
   collision point between #2's known gap and a bulk-write button — it should
   ship together, not in sequence.
4. **Don't drop the 2+-behind cohort.** Route it explicitly into the Data
   Health anomaly queue (already the destination for everything else abnormal)
   with a distinct label — *"more than one grade behind expected — needs
   review, not auto-promotion"* — instead of silently excluding it from both
   the promotion lane and any obvious follow-up.
5. **Distinguish promotion from send-off.** `calculatedGrade` at graduation
   threshold (12→13, i.e. `getCollegeSendOffs`, `automations.ts` targeting
   August) is not attrition and not a promotion — per persona knowledge #3, a
   graduating senior leaving is the goal. It needs its own lane, already
   half-built in `getCollegeSendOffs`, but disconnected from Data Health the
   same way promotion is.
6. **Surface it where the annual event actually happens.** This belongs
   reachable from Data Health / GradeScatter (Area A, "the actual job"), not
   buried one lane among eight in a general Automations screen (Area C) a
   leader has no particular reason to open in the last week of August.

If Locus decides *not* to build the real-write version, it must at minimum
delete the fake "Promote" button and its mock alert — a control that claims to
fix production data and doesn't is a worse trust failure than not having the
feature, exactly the same argument the proposal already accepts for Spotify
(§3.6) and the unbound Ctrl+Z hint (§3.6). This one is higher stakes: those two
are cosmetic; this one is a grade write a leader believes happened.

## 4. What I concede beyond §1

- §3.3's correction on `fixName` (`MCDONALD → Mcdonald`, not `McDonald →
  Mcdonald`) is right and sharper than my round-1 framing; I'll adopt the
  corrected failure mode.
- §3.1's Ghost Protocol repair (tenure floor, real selection, `ArchiveCommand`
  on the undo stack) fully covers my round-1 finding. No further ask there.
- §3.5's DEMOTE-to-one-check on Family Audit matches my round-1 verdict
  exactly; no disagreement.

## 5. What I still contest

- **§3.4 "Cut Speed Run" is presented as closing the safety question. It
  doesn't** — see §2 above. Needs a companion commitment, not a deferred Q3.
- **Grade promotion is absent from the proposal's scope entirely**, despite
  the mechanism existing, being broken, and living one hop away from every file
  the proposal already touches (`grader.ts`, `ConfigModal.tsx`). It should be
  pulled into Area A's work list, not left for a future round to notice.
