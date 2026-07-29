# Area A — core-hygiene — Proposal v3 (Round 3 synthesis)

Inputs: `proposal-v2.md`, `r3-uxr.md`, `r3-church-admin.md`, `r3-youth.md`,
`r3-children.md`. Every decision below was re-verified in source this round;
line numbers cited are current as of this reading.

Flag key: **Y** = CONVERGED (same verdict, unchallenged, two or more rounds —
do not re-argue). **S3** = SETTLED this round (unanimous, no dissent left, but
first decided in R3 — attack only with new evidence). **N** = open.

---

## 1. Changes since v2

**Killing my own darling first.**

1. **v2 §3.2 framed Sandbox as a binary — "implement client-side *or* delete
   the checkbox." Both of my options were wrong, and youth found the third.**
   Children's wants a dry run and named four conditions for it; admin rules a
   standing mode is net-negative in a volunteer office regardless of build cost
   ("every mode is something someone can be in without realizing it"); youth
   observes these are not in conflict because the *unit* of dry run was the
   mistake, not the dry run. **Adopted: implement the intercept, delete the
   toggle.** The dry run becomes a mandatory preview step inside every batch
   confirm dialog; `config.sandboxMode` as a session setting ceases to exist.
   Verified the plumbing makes this cheap: `updatePerson` (`pco.ts:365`) is the
   single choke point and already takes the flag; `archivePerson`
   (`pco.ts:421-422`) is a one-line delegate; every call site
   (`App.tsx:307,356,442,528`) already threads it. Full spec in §3.2.
   **Q-A is closed.**

2. **Grade promotion is no longer "build or delete" — it is committed work with
   a complete spec.** Youth supplied population, cutoff, selection UI, write
   path, confirmation, held-back handling, 2+-behind handling and graduation
   handling; children's ruled BUILD and attached one hard precondition; nobody
   argued for delete. Verified the defect is unchanged: `automations.ts:72-74`
   still hardcodes `promotionStartMonth = 5`/`Day = 1`, `:94` still filters
   `=== 1`, `AutomationsReport.tsx:84` still fires `alert(...Mocked action)`.
   §3.3 is now a build order, not a fork. **S3.**

3. **The `transformPerson` gap is not a hygiene bug — it is an
   emergency-contact bug.** Admin traced what neither of us had: `pco.ts:233-235`
   returns `null` for anyone with no birthdate; `App.tsx:236-238` filters those
   nulls out of the *single* `students` array; and `App.tsx:946` hands that same
   array to `EmergencyAlerts`, which filters again on `phoneNumber`
   (`EmergencyAlerts.tsx:15-17`). An adult with no DOB — grandparents, pickup
   contacts, kiosk-entered profiles — is invisible on the screen a volunteer
   opens when they cannot reach a parent during service, with no on-screen sign
   they were dropped rather than simply lacking a phone. §3.9 now requires a
   screen-specific caption there. This raises the priority of the transform fix
   above its old ranking as a Duplicate Detective feeder.

4. **The §5.1 ledger as scoped was insufficient.** Admin: a generic
   `{field, before, after}` shape answers "what changed" but not "why the
   algorithm thought this person was a ghost." `ghostReason`, `lastCheckInAt`,
   `createdAt` and `configUsed` must persist as structured metadata, not collapse
   into a one-field diff. And local storage is not durability — a reissued
   volunteer machine, a browser data clear or a laptop wipe are normal-cycle
   events. The PCO-side note is promoted from "better, and cheap" to
   **mandatory** for archive writes; the local ledger + CSV become the
   searchable index on top of it, not the record of record. Same bar extends to
   the promotion batch write from day one. §5.1 rewritten.

5. **Three smaller adoptions.** Children's: the flag-change action in the family
   repair card must name the downstream consequence in the same sentence (§3.6).
   UXR: §3.8's wording produced two buttons both labelled "Cancel" — collapse to
   one (§3.8). UXR confirmed all three restored round-1 items present and
   accurately described (§3.9), and confirmed `singleRecordMode` closes all three
   Smart Fix sub-issues.

6. **Screen accounting restated, because UXR says the brief undercounts it.**
   Family Audit is not demoted — it is *dissolved*; its one surviving check
   becomes an anomaly type in the single Review Mode queue. Promotion and college
   send-off are folded into Data Health with no new destination. Net for Core:
   six top-level surfaces (Dashboard, Data Health, Review Mode, Duplicate
   Detective, Ghost Protocol, Settings), down two from v1's inventory. Nothing in
   this proposal adds a screen.

---

## 2. Per-feature decisions

| # | Feature | Verdict | Rationale | Flag |
|---|---------|---------|-----------|------|
| 1 | Dashboard | SIMPLIFY | Drop Area C teasers; gate Health Score below minimum N; distinguish "0" from "no data"; publish excluded-record count. UXR re-verified all three in R3 | **Y** |
| 2 | Data Health scatter | SIMPLIFY + RE-FRAME | Override/off-cycle exception catcher, not congregation health. Now also absorbs promotion — retitle, ask the auto-calc question, keyboard-navigable | N (Q-B; crowding watch) |
| 3 | Smart Fix Modal | MERGE → ReviewMode with `singleRecordMode` | UXR confirmed the guard closes the bulk button, the phantom "1/1" counter and the undefined Skip. One Cancel, not two | **Y** |
| 4 | Review Mode + Speed Run + Zen | CUT Speed Run, KEEP+FIX Review Mode, collapse Zen | Timer and score on writes to minors' PII buy no hygiene capability | **Y** (R1–R3) |
| 5 | Duplicate Detective | KEEP + FIX ×3 | Architecture right (punts merge to PCO). Sibling warning; CSV matched-value column; population widened via §3.9 | **Y** |
| 6 | Ghost Protocol | FIX + strip gamification + durable log | R1–R5 4/4; gamification strip is a domain veto; ledger bar raised in §5.1 | **Y** (R1–R3) |
| 7 | Family Audit | DISSOLVE — cut 3 checks, cut the auto-swap, delete the surface | Age-subtraction inference with no relationship data. Survivor becomes one anomaly type in the Review queue | **Y** (children's confirmed swap deletion in R3) |
| 8 | Golden Record | CUT | Unreachable; duplicates a badge that already fires; MDM term for a capability Locus deliberately lacks | **Y** (R1–R3) |
| 9 | Undo / Redo + toast | FIX | Per-record `Map` + relabel + real Ctrl+Z binding. Youth verified the fix closes the whole defect | **Y** |
| 10 | Settings / Config | SIMPLIFY + **Sandbox toggle DELETED, dry run rebuilt as batch preview** | A standing mode a volunteer must remember they're in is a governance cost; the preview belongs at the moment of write | **S3** |
| 11 | Hygiene utilities | FIX `fixName`, CUT `enrichZipCodeAsync` | Casing wrong for a large surname class; ZIP path egresses minors' household data to an uncontracted third party | **Y** (R1–R3) |
| — | **Grade promotion** (pulled from Area C) | **BUILD** (was FIX-or-CUT) | Fully specified; the one automation whose silent no-op has a same-week, in-person consequence | **S3** |

---

## 3. The concrete work, ordered by value-per-effort

### 3.1 Ghost Protocol — CONVERGED, unchanged except the ledger bar

R1 (tenure floor, fail-closed on absent `createdAt`), R2 (`ghostReason`), R3
(full list, default-empty checkboxes, honest copy, delete "Analyze Deeply"), R4
(`ArchiveCommand` on `commandManagerRef`, typed confirm >5), R5 (Dashboard
restatement), A1 (delete the reward loop: `App.tsx:314-324`, the `the-exorcist`
badge at `gamification.ts:40-46`, the `ghostsCleared` counter), A3 (`isChild`
named explicitly in the confirm string) and A4 (populate `created_at` in the
household generator, `mock-api/data.js:117-208`, or every fixture child
fail-closes to `isGhost === false` and the repair is undemonstrable in dev) all
carry unchanged. **Do not re-argue any of these in round 4.**

**A2 supersedes v2's version.** The durable archive record is now: (i) a
mandatory PCO-side note written on each archived person as part of the same
write, carrying the reason — this is the record of record, because it is the
only copy that survives a reissued machine; (ii) the §5.1 ledger entry with
`ghostReason`, `lastCheckInAt`, `createdAt` and `configUsed` as structured
fields; (iii) CSV export as a convenience index. R4 does not ship without (i)
and (ii). See §4 Q-E for the one feasibility check this creates.

### 3.2 Sandbox — delete the toggle, build the preview (Q-A CLOSED)

**Delete.** `ConfigModal.tsx:150-153` (the checkbox), `ConfigModal.tsx:21,37,55`
(the `sandboxMode` state, hydration and save), `storage.ts:15`
(`sandboxMode?: boolean`), and the standing banner branch at `App.tsx:681`.
`config.sandboxMode` no longer exists as a persisted setting, so
`App.tsx:307,356,442,528` stop reading it.

**Keep and rename the parameter.** `updatePerson(id, attributes, auth,
sandboxMode?)` (`pco.ts:365`) keeps its fourth argument, renamed `dryRun`, so it
cannot be misread as a config value. Inside, replace the
`headers['X-Locus-Sandbox'] = 'true'` no-op (`pco.ts:372-374` — verified again
this round: nothing in `mock-api/` reads it, and real PCO discards unknown
headers) with an early return that synthesises the success shape **without
issuing any request** and appends the intended write to the §5.1 ledger tagged
`dryRun: true`. `archivePerson` (`pco.ts:421-422`) inherits this for free. This
is the six-line intercept.

**Build the preview as one shared component.** Every batch write — the ghost
`ArchiveCommand` and the promotion `BatchUpdateCommand` — routes through a
single `<BatchWriteConfirm>` whose first half is not optional and not a toggle:

1. Pressing the batch action runs the selected records through the `dryRun`
   path. No request leaves the browser.
2. The dialog renders the **full per-record list, never a count**: name, field
   changing, before → after, and for archives the `ghostReason`,
   `lastCheckInAt` and `createdAt` that produced the verdict. This is
   children's condition 1 and 3 — reviewable on screen, not merely logged.
3. **Any row with `isChild: true` is listed in its own section above the fold**,
   named individually, before the adult rows. Children's condition 2, and it
   reuses §3.1 A3's rule rather than inventing a second one.
4. Only then does "Confirm and write to PCO (N records)" become live, behind the
   typed-count confirmation §3.1 R4 already specifies.

Children's condition 4 (an unmistakable on-state indicator) is satisfied by
construction rather than by a banner: there is no state to indicate, because
there is no mode. That is precisely the admin's argument — the failure the
banner existed to prevent ("I forgot Sandbox was on and I'm looking at a real
archive that never happened") cannot occur when the dry run is scoped to one
dialog and always followed by an explicit live step.

**Single-record writes are out of scope for preview** (youth). A Fix in Review
Mode is already covered by the 5-second never-written window §3.4 repairs.
Preview is for writes a leader cannot casually undo their way out of.

**First-launch modal survives, repurposed** (admin + UXR): with no `config` in
storage, a one-time, unskippable "Locus writes directly to your production
Planning Center data" acknowledgement before any write path is reachable.

**Losing arguments, recorded:** children's asked for a standing banner — it
loses because with the toggle deleted there is no standing state to announce,
and its stated purpose is met inside the dialog. Admin asked to delete the dry
run entirely — it loses because "23 records would be archived. Continue?" does
not let a children's director see *which* 23, and that per-record list is the
whole ask; the admin's actual objection was to the mode, and the mode is gone.

### 3.3 Grade promotion — BUILD (committed work, full spec)

**Population.** `isChild === true` AND `birthdate !== null` AND
`pcoGrade !== null` AND `expectedGrade - currentGrade === 1`. Exclude any
student whose `${studentId}:grade` is in §5.2's confirmed-correct set — **this
gate runs before the row is rendered, not as a post-hoc uncheck.**

**Children's hard condition, adopted as a blocking precondition:** a child whose
grade is a confirmed manual override must never be auto-included in a batch
grade write. A held-back or redshirted student's PCO grade correctly lags
`expectedGrade` by design, so absent the override flag they land in this
population every August indistinguishable from a normal rollover child — and
that single write puts an intentionally-held-back 9-year-old into a room with
11-year-olds, past a ratio and security-tag boundary that exists for a reason.
**§5.2 ships in the same change or grade promotion does not ship.** Shipping the
write without the flag is shipping the dangerous half.

**Cutoff — one clock.** Delete `promotionStartMonth`/`promotionStartDay` and the
`isAfter(today, promotionSeasonStart)` early return (`automations.ts:72-83`)
entirely. Season derives solely from `GraderOptions.cutoffMonth`/`cutoffDay`,
which `calculateExpectedGrade` (`grader.ts:12-30`) already consumes and
`ConfigModal` already configures. The lane populates whenever a row satisfies
the population filter. June 1 was a second, disagreeing definition of "start of
year" that nobody asked for.

**Selection UI — the Ghost Protocol pattern, not per-row `alert()`.**
Default-empty checkboxes, one "Select all eligible (N)" convenience action, one
"Promote selected" button, then §3.2's mandatory preview and a typed
confirmation naming the count. No leader clicks 40 individual Promote buttons.

**Write.** One `BatchUpdateCommand` in the shape of `handleSaveStudentBulk`
(`App.tsx:488-542`): real `updatePerson` PATCH of `pcoGrade: expectedGrade` per
record, pushed to `commandManagerRef` so it is undoable, and written to the
§5.1 ledger at the *same durability bar as archival* (admin) — including the
mandatory PCO-side note, because "why did my child's grade change" and "why does
my roster look wrong on the first Sunday" are the same six-weeks-later inquiry
as "why did this family disappear."

**Completion is the write, not the dismiss.** Delete `dismissedPromotions` and
`handleDismissPromotion` as the completion mechanism. A row leaves the lane
because the PATCH succeeded. "Dismiss" is replaced by "Mark correct" → §5.2's
set.

**2+ behind never enters this lane.** Routed to the Data Health anomaly queue,
labelled *"more than one grade behind expected — needs review, not
auto-promotion."* This cohort is very likely the held-back/redshirted population
under an auto-calc tenant, which is exactly why it must not be bulk-writable.

**Graduation is its own lane.** `getCollegeSendOffs` (12→13) gets separate copy
and separate handling: no grade-13 PATCH (the typical PCO grade scale has no
such value), and it is never equated with attrition. A senior leaving is a
status/label action or nothing at all — not a promotion, not a loss.

**Placement and screen accounting.** Reachable from Data Health / GradeScatter.
Both lanes are **deleted** from `AutomationsReport.tsx:269-291` and
`getPendingGradePromotions` (`automations.ts:63-96`) is rewritten in place, not
duplicated. No new destination; combined with §3.6 and §3.7 the area ends two
surfaces down.

### 3.4 The undo toast — CONVERGED, youth confirmed closed

`pendingUpdateRef` becomes `Map<studentId, pending>`, flushed only on
unmount/navigate, so two Fixes four seconds apart no longer truncate each
other's window (`App.tsx:546-559`). Toast button relabelled **"Undo edit"**;
header buttons get tooltips naming what they revert. Ctrl+Z / Ctrl+Y bound next
to `handleHistoryUndo`/`Redo` (`App.tsx:637-647`) — re-verified this round that
`src/` contains zero `keydown`/`ctrlKey`/`metaKey` references, so
`UndoRedoControls.tsx:17,27`'s tooltips are currently fiction and the header
tooltip copy is only true once the binding lands. The binding is inside this
change, not a follow-up.

### 3.5 Data Health — re-framed, and now the promotion host

Unchanged from v2: add the auto-calc question to `ConfigModal`; if yes, retitle
to *"Grade exceptions"*, drop its Health Score contribution, and state in-screen
that a nonzero count most likely means Locus's cutoff disagrees with PCO's. Keep
the responsive container, shape-not-colour encoding, and the exclusion caption.

New this round: the screen now also hosts the promotion batch. UXR's watch-item
(§4 Q-F) is attached here.

### 3.6 Family Audit — dissolved (CONVERGED, one copy addition)

Cut `checkSpouseGap` (`family.ts:16-31`), the `<15y` parent/child warning
(`family.ts:149-158`), `checkSplitHouseholds` (`family.ts:33-99`) and
`handleFamilySwap` (`App.tsx:420-462`). Keep the age inversion
(`family.ts:134-148`). Delete `FamilyModal.tsx`, `.css`, the `'families'` branch
of `handleNavigation` (`App.tsx:657-658`), the mount (`:1054-1059`),
`isFamilyModalOpen`, and the Dashboard quick-action (`Dashboard.tsx:118-120`).

The two-candidate repair card stands as specified, with children's confirmation
that neither option is pre-selected and that birthdate-correction is ordered
first because a wrong birthdate (typo, guess, 1/1 placeholder) is the common
case while a genuinely mis-set `isChild` is rare and usually already known to
staff.

**Addition (children's, adopted):** option (b)'s copy must state the downstream
consequence in the same sentence as the field name — *"Change child/adult flag.
This changes ratio counts, security-tag colour and background-check requirements
for this person."* `isChild` is not cosmetic; a volunteer who does not already
know that will click it as casually as a birthdate fix. One line, ships in this
change.

### 3.7 Cuts and dead weight — CONVERGED, near-zero effort

Speed Run (`App.tsx:95,782-787,1027`; `ReviewMode.tsx:60-76,115-119,167-169,
236-238,497`), then `zenMode` collapses to `zenAudioTheme !== 'none'`. Golden
Record (`GoldenRecordModal.tsx`/`.css`/`.test.tsx`, `App.tsx:1,91,1032-1035`,
plus striking row #8 from `feature-inventory.md` and stating that **Locus
performs no record merging**). Spotify (`ConfigModal.tsx:104-116`,
`storage.ts:23`). `enrichZipCodeAsync` (`zipCodes.ts:50-70`, its import at
`ReviewMode.tsx:4`, the `newZip.length === 5` block at `:448-457`). `fixName`
(`hygiene.ts:18-26` — split on `[\s\-']` preserving delimiters, special-case
`Mc`/`Mac`, leave roman-numeral suffixes uppercase), and gate `fixEmail`'s
Levenshtein domain rewrite (`hygiene.ts:74-101`) out of `handleFixAll`
(`ReviewMode.tsx:138-145`).

### 3.8 Smart Fix merge — CONVERGED, one wording correction

Ship `const singleRecordMode = students.length === 1`, which hides the
`{currentIndex + 1} / {students.length}` counter (`:300-302`) and
**hard-disables Smart Fix All regardless of `onSaveBulk`** (`:497` currently
gates only on `!isSpeedRun && onSaveBulk`, so a `GradeScatter` point click would
show it today). Then delete `SmartFixModal.tsx` / `.css` / tests; the duplicated
delta logic (`SmartFixModal.tsx:36-59` vs `ReviewMode.tsx:351-367`) is the prize.

**Correction (UXR):** v2's "relabels Exit → Cancel, replaces Skip with Cancel"
would render two identically-labelled buttons on one card — header Exit (`:303`)
and footer Skip (`:496`) both surviving as "Cancel". In `singleRecordMode`,
**render one Cancel button and remove the other**; keep the footer one, drop the
header affordance. Skip's relabel is otherwise a pure truth-in-labelling fix,
since `handleNext` (`:111-121`) already degrades to "close, unsaved" when
`students.length === 1`.

**Ship-checklist line, not a blocker (UXR):** the mode-switcher tabs
(`:311-348`) render unconditionally, so a single-record session entered from
GradeScatter exposes name/email/address/phone edits GradeScatter never touched.
Reviewed, single-field, per-record editing through `handleFix` — acceptable, but
note it.

### 3.9 Population, exclusions, and the Emergency Alerts caption

**Widen at the source.** `transformPerson` (`pco.ts:233-241`) returns a
`Student` with `birthdate: null`, `calculatedGrade: null`, `delta: null` instead
of `null`, and each consumer filters explicitly: GradeScatter adds
`birthdate !== null` alongside its existing `pcoGrade !== null`; the grader skips
them; `duplicates.ts` (which reads no date field) gains the adult roster for
free. `App.tsx:236-238`'s null filter comes out.

**Two captions, not one** (admin). Data Health: *"N have no birthdate on file
and are excluded from grade checks; M shown here have no grade set."*
**Emergency Alerts** (`App.tsx:946`, `EmergencyAlerts.tsx:15-17`) gets its own
sentence, because "excluded from grade checks" is meaningless there and a
missing-DOB adult with no phone is a different fact from a missing-DOB adult
whose phone Locus never looked at: *"N people are not shown because they have no
birthdate on file, regardless of whether Locus has a phone number for them."*
Until the transform fix lands, that screen silently omits a large fraction of
grandparents, pickup contacts and kiosk-entered adult profiles from the
who-do-we-call list. This is the highest-consequence line in §3.9.

**Restored items, all three re-verified by UXR this round:** GradeScatter
roving-tabindex + skip-to-next-anomaly (`GradeScatter.tsx:110,127`); Dashboard
"— no check-in data" instead of a bare `0` (`Dashboard.tsx:62-63,95`) plus a
minimum-N gate on the Health Score card (`:78-83`; `total === 0` currently
renders "Critical" as a new tenant's first impression); Duplicate CSV
`Matched Value` column (`DuplicatesReport.tsx:21-31`).

### 3.10 Duplicate Detective — sibling warning, unchanged

In `DuplicatesReport.tsx:101-113`, when both records in a group have
`isChild: true` and matched on the address-fuzzy path: *"These may be siblings or
twins. Merging combines check-in history, allergy notes and background-check
status irreversibly. Verify before merging."*

---

## 4. Unresolved disagreement — for rounds 4–5

Q-A is closed (§3.2). Q-D is closed by §3.3's routing, with one narrowed
remainder folded into Q-G below.

**Q-B (carried, unanswered two rounds — settle it with the API, not with
opinion). Can Locus read PCO's org-level grade auto-calculate setting?** §3.5
re-frames a whole screen on a hand-typed answer that will drift out of date, and
§5.3 wants to delete the standalone cutoff control if the setting is readable.
This is checkable against the PCO People API and should not survive round 4.

**Q-C (carried). Do ghost sweeps need household context?** Children's case — one
child in an otherwise-active family of four, irregular attender, or checked in
under the other parent's profile — is untouched by the tenure floor. Is a
household roll-up column ("3 of 4 at this address active in the last 24 months")
worth the aggregation, or do default-empty selection plus `ghostReason` plus
§3.2's per-record preview now put enough in front of the volunteer? Note the
preview materially weakened the case for this; round 4 should either kill it or
fund it.

**Q-E (new, feasibility, blocks §3.1 A2 and §3.3). Can Locus actually write the
mandatory PCO-side note?** The admin's durability ruling makes the PCO note the
record of record for both bulk write paths. That is now load-bearing, and
nobody has verified that the People API note endpoint is writable with the
credentials Locus holds, whether it requires a note category to exist first, or
what happens to the batch when the note write succeeds and the field PATCH
fails (or vice versa). If the note is not writable, the admin's durability bar
is unmet and §3.1 R4 and §3.3's write both need a different answer — this is the
single highest-risk unknown left in the area.

**Q-F (new, UXR's watch-item). Does Data Health survive hosting two interaction
models?** It now carries passive browse-and-drill-into-Review-Mode *and*
batch-select-and-write-in-place, under one re-scoped name, at the busiest week
of the year. The alternative is a promotion sub-view that is a mode of Data
Health rather than a peer of the scatter. Round 4 should judge the crowding on
the actual layout, not in the abstract — and must not resolve it by minting a
new nav destination.

**Q-G (narrowed remainder of Q-D). After §5.2's flag ships, what is left in the
2+-behind bucket?** §3.3 routes them to the anomaly queue as "needs review," but
under the settled Q1 that cohort is overwhelmingly the manual-override
population §5.2 exists to silence. If the first pass marks nearly all of them
correct, the queue item is a one-time cleanup, not a standing lane — in which
case it is a report line. Round 4 should say which, since it determines whether
Data Health carries a permanent third section.

---

## 5. Standing enabling work (not new ideas — both are now preconditions)

**5.1 The durable write ledger — scope raised.** One append-only log of every
PCO write Locus attempts, persisted in `storage.ts` and exportable as CSV, with
a session counter in the header. Entry shape is
`{personId, name, field, before, after, at, source, dryRun}` **plus a structured
`context` object** carrying the justification fields the generic diff drops —
`ghostReason`, `lastCheckInAt`, `createdAt`, `configUsed` for archives; the
selection basis and `configUsed` for promotions. Local storage is the searchable
index, **not** the record of record: for both bulk paths the mandatory PCO-side
note (Q-E) is the durable copy, because a reissued volunteer machine or a
browser data clear is a normal-cycle event, not an edge case. The ledger also
backs §3.2's preview — the preview renders from ledger entries written on the
`dryRun` pass, which is why one primitive serves the audit trail, the archive
record, the promotion record and the dry run at once.
**Replaces:** `App.tsx:331-335`'s `alert()`, `AutomationsReport.tsx:84`'s
`alert()`, and the ghost-specific CSV.

**5.2 The "confirmed correct" flag — now a blocking precondition, not a
nicety.** A `Set<string>` of `${studentId}:${anomalyType}` in `storage.ts`,
honoured by the `anomalies` filter (`App.tsx:272`) and by §3.3's population gate
*before render*, surfaced as "Mark correct" beside Skip and as the replacement
for promotion's "Dismiss". PCO models grade overrides per person and Locus reads
only the resulting `grade` field, so without this Locus mistakes PCO's correct
answer for an error — forever, and now with a bulk write attached.
**Ships in the same change as §3.3 or §3.3 does not ship** (children's veto).
**Replaces:** the current meaning of "Skip" (`ReviewMode.tsx:496`), which means
"show me this again forever" and is why the queue never empties.

**5.3 Reconcile Locus's cutoff against PCO's** (carried, gated on Q-B). If the
org setting is readable, read it and delete the control; if not, present the
cutoff as *"must match your PCO org setting"* with the consequence stated.
**Replaces:** the standalone Grade Cutoff fields in `ConfigModal.tsx` and the
hardcoded June 1 in `automations.ts:72-74`.

Nickname-aware duplicate matching (v1 §5.2) is carried forward unattacked and
unchanged.
