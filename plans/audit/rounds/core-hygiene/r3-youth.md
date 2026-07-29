# Area A — core-hygiene — Round 3 (youth ministry)

Scope per round brief: grade promotion spec/kill, Sandbox ruling, toast closure
check. Not re-opening any **Y** row.

---

## 1. Grade promotion — BUILD. Full spec, no unresolved verdict left.

Verified current state unchanged since round 2: `automations.ts:73-74` still
hardcodes `promotionStartMonth = 5`/`promotionStartDay = 1`; `:94`'s
`expectedGrade - currentGrade === 1` still silently drops the 2+-behind cohort;
`AutomationsReport.tsx:84-93`'s `handleApprove` still fires `alert(...Mocked
action)` then a local dismiss `Set`, for every lane including `'Promote
Grade'`. Nothing on `commandManagerRef`, nothing in PCO. This is the single
highest-value fix in the whole area — the one week a year every roster in the
product goes stale simultaneously — and it is buildable this round with
pieces the proposal is already building for other features. Kill is not the
right call. Build it exactly like this:

**Population.** `isChild === true`, `birthdate` not null, `pcoGrade` not
null, AND `expectedGrade - currentGrade === 1` (single-year rollover only —
this is not a change from today's filter, it's a correct *use* of it once
paired with the next two gates). Exclude anyone where
`${studentId}:grade` is in §5.2's confirmed-correct set — that gate runs
**before** the row is ever shown, not as a post-hoc uncheck. This is what
protects held-back and redshirted kids: a held-back student's PCO grade
correctly lags `expectedGrade` by design, so absent the override flag they
land in this exact population every August, indistinguishable from a normal
rollover kid, and a leader burning the queue fast has no way to tell them
apart from the row alone.

**Cutoff — one clock.** Delete `promotionStartMonth`/`promotionStartDay`
entirely. `expectedGrade` already comes from `calculateExpectedGrade`
(`grader.ts:12-30`) using `GraderOptions.cutoffMonth`/`cutoffDay`
(`ConfigModal`, default Sept 1). The lane populates whenever a row satisfies
the population filter above — no separate "season" gate. Today's June 1 gate
is not a safety feature, it's a second, disagreeing definition of "start of
year" nobody asked for.

**Selection UI — same pattern as Ghost Protocol, not per-row alert().**
Default-empty checkboxes, one "Select all eligible (N)" convenience action,
one "Promote selected" button. A leader clearing the August queue needs to
see the batch before it fires, not click 40 individual "Promote" buttons
each popping its own alert. Typed confirmation naming the count, same
pattern as `ArchiveCommand`'s >5 confirm.

**Write.** One `BatchUpdateCommand` (`App.tsx:488-542`'s existing shape) over
the selected rows: `pcoGrade: expectedGrade` per record, real
`updatePerson` PATCH, pushed to `commandManagerRef` (undoable), logged to
the write ledger (§5.1). A row leaves the lane because the write succeeded —
delete `dismissedPromotions` and `handleDismissPromotion` as the completion
mechanism entirely. Dismiss becomes "Mark correct" → §5.2's set, for the
rare case a leader looks at a row and knows it's wrong before selecting.

**2+ behind.** Never enters this lane. Routed to the Data Health anomaly
queue, labeled *"more than one grade behind expected — needs review, not
auto-promotion."* This is very likely the held-back/redshirted population
under an auto-calc PCO tenant (§Q1), which is exactly why it must not be
bulk-writable at all — it needs a human per record, not a batch.

**Graduation — separate lane, separate write, separate copy.**
`getCollegeSendOffs` (12→13) does not go through this mechanism. There is no
grade 13 to PATCH in the typical PCO grade scale; a senior leaving is not a
promotion and is not attrition — treat it as a status/label action (e.g.
"Mark as college send-off" note on the record, or nothing at all if PCO has
no field for it) with its own confirm copy that does not say "promote."
Conflating it with the grade batch would silently attempt an invalid grade
write on the one population this feature must get right for the goal to
count as success rather than loss.

**Placement.** Reachable from Data Health/GradeScatter, not a lane in
`AutomationsReport.tsx`. Deleting the promotion and send-off lanes from that
screen and folding them into Data Health is correct — it puts the fix where
a leader working the anomaly queue already is, not on a screen that only
gets opened by habit.

This is a complete build spec: population, cutoff, selection, write path,
confirmation, held-back handling, 2+-behind handling, and graduation
handling are all pinned. Nothing here is a design question for round 4.

---

## 2. Sandbox Mode — implement, but as a batch preview, not a session toggle

Yes, I would dry-run before an August bulk promotion — but not by remembering
to check a box at the start of a session and remembering to uncheck it
after. That is exactly the failure mode already named in §3.2: an hour spent
believing you did the work, discovered wrong days later. A session-scoped
checkbox is the wrong shape for the actual need.

**Ruling: implement, folded into the batch confirm step itself, not a
standing mode.**

Verified `updatePerson` (`pco.ts:365`) is the single choke point every write
path already funnels through — `UpdateStudentCommand`, `BatchUpdateCommand`,
and `archivePerson` all call it with a `sandboxMode` boolean already
threaded end to end (`App.tsx:307,356,442,528`; `ConfigModal.tsx:21,37,55`).
The plumbing exists; only the six-line intercept inside `updatePerson` is
missing. Given that, the right product shape is:

- Delete the standing `ConfigModal` checkbox (`:146-158`) and
  `config.sandboxMode` as a session setting a volunteer can forget is on.
- On the confirm step of any batch write — grade promotion, ghost archive —
  add a mandatory preview: "Preview N changes" runs the batch through the
  sandboxed `updatePerson` path (no request leaves the browser), shows the
  before/after per record from the ledger (§5.1), and only after that does
  "Confirm and write to PCO" become the live action. Preview is not
  optional and not a toggle — it is the first half of every batch confirm,
  every time.
- Single-record writes (a Fix in Review Mode) do not need this — the
  existing "you can undo" 5-second window already covers that case at a
  cost a leader clearing a queue can absorb. Preview is for the writes a
  leader cannot casually undo their way out of: a 40-record August batch.

This answers Q-A directly: implement it, but the unit of dry-run is the
batch confirm dialog, not a session-wide mode. That also resolves the "two
new bulk write paths must honour it or must not exist" constraint —
promotion and archive both go through the same batch confirm component, so
both get the preview for free from one build, and neither needs the deleted
checkbox to exist.

---

## 3. Toast defect (§3.4) — confirmed closed

Re-verified `App.tsx:546-559` and `:611`: `pendingUpdateRef` is currently a
single `useRef`, so `handleSaveStudent`'s force-flush on every call is real
and matches what I reported round 2. The proposed fix — `Map<studentId,
pending>` keyed per record, flush only on unmount/navigate — closes it
correctly: two Fixes four seconds apart on different students no longer
truncate each other's window, because each student's pending write lives at
its own key instead of sharing the one ref slot. That was the entire defect;
this is the entire fix.

The relabel ("Undo edit" on the toast vs. named tooltips on the header
undo/redo) also closes UXR's r1 defect about two identically-named
affordances — a volunteer no longer has to guess which "undo" is live. One
dependency to flag, not a reopening: the header tooltip text ("Undo: last
saved change — Ada Chen, grade 4→5") is only true once Ctrl+Z/Y are actually
bound to `handleHistoryUndo`/`Redo`. Verified again this round: zero
`keydown`/`ctrlKey`/`metaKey` references in `src/`. §3.4 already scopes the
binding as part of this same change, not a follow-up — correct, and I'm
not adding a new ask, just confirming the dependency is inside the box
already drawn.

**Verdict: closed.** No further youth ask on the toast.
