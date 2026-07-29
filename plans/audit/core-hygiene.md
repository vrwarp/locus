# Area A — `core-hygiene` — Final Report

Features #1–#11: Locus Core, the Data Custodian Workspace. This is the half of
the product that does the job the product is sold on — finding bad records in
Planning Center People and writing corrections back. Reviewed over five rounds
by a UX researcher, a church operations director, a youth pastor and a
children's ministry director. All verdicts below are final.

---

## Verdict

**Area A is the only part of Locus worth the licence fee, and almost none of it
works the way it claims to.** The core loop — see the anomaly, fix the record,
write it to PCO — is the right product, and no critic in five rounds proposed
cutting it. What the audit found instead is that the surrounding scaffolding is
built for a demo: a "Sandbox" toggle that sends a header no server reads, so a
volunteer who believes they are practising is writing to production; a Golden
Record screen for a merge capability Locus deliberately does not have; a Speed
Run mode that puts a sixty-second timer and a score on edits to minors' personal
data; a Family Audit that infers household roles by subtracting birthdates and
offers a one-click "swap" of parent and child; and a `transformPerson` that
silently discards every person with no birthdate on file, which in a real church
database is most of the adults. Three of the eleven features are cut outright,
two are merged away, one is dissolved into a single check on an existing queue,
and the survivors ship materially smaller. Against that subtraction the audit
recommends exactly one new build — **grade promotion** — which the youth
director called the highest-value thing the product could get right, because
grade is the most volatile field in any church database and today Locus's
promotion path is a report line whose "Approve" button calls
`alert('(Mocked action)')`. Two enabling primitives make the rest safe: an
append-only write ledger, and a mandatory Planning Center-side note recording
why Locus changed anybody's record. **Net navigation effect: zero screens added,
four surfaces removed.**

---

## Per-feature decisions

| # | Feature | Verdict | Rationale | Rounds converged |
|---|---------|---------|-----------|------------------|
| 1 | Dashboard | **SIMPLIFY** | Keep as the landing surface; drop the Intelligence teasers, gate the Health Score below a minimum record count (`total === 0` currently renders **"Critical"** as a new tenant's first impression), distinguish a real `0` from "no check-in data", publish the excluded-record count. | 3 |
| 2 | Data Health (grade scatter) | **SIMPLIFY + RE-FRAME** | It is not a picture of congregational health; it is an exception catcher for grade overrides and off-cycle students. Retitle to *Grade exceptions*, remove its Health Score contribution, keep shape-not-colour encoding, add a responsive container (the chart is hardcoded 800×600 today), fix keyboard traversal. Becomes the host for grade promotion as a header **mode**. | 4 |
| 3 | Smart Fix Modal | **MERGE** into Review Mode | Same delta logic, duplicated. Folds in behind a `singleRecordMode` flag that hides the phantom "1 / 1" counter, hard-disables the bulk button and renders one Cancel instead of two. | 2 |
| 4 | Review Mode + Speed Run + Zen Mode | **CUT Speed Run · KEEP+FIX Review Mode · collapse Zen** | Review Mode is the product's core loop and stays. A timer and a score attached to writes on minors' PII buy no hygiene capability and were vetoed on domain grounds in round 1 and never defended since. Zen Mode collapses to an audio-theme setting. | 5 |
| 5 | Duplicate Detective | **KEEP + FIX ×3** | Punting the actual merge to Planning Center is correct — PCO's merge is better than anything Locus would build. Three fixes: a sibling/twin warning on child-child address matches, a `Matched Value` column in the CSV so the export is auditable, and the population widened so adults without birthdates are finally visible to it. | 4 |
| 6 | Ghost Protocol | **FIX + strip gamification + durable log** | Archiving a member is the most consequential write Locus makes. It currently has no tenure floor (a family who joined last month and has not checked in is a "ghost"), no recorded reason, and it feeds an achievement badge called **The Exorcist**. The reward loop comes out; the durable record goes in. | 5 |
| 7 | Family Audit | **DISSOLVE — surface deleted** | Household roles inferred by subtracting birthdates. The spouse-age-gap check, the split-household check and the one-click parent/child "swap" are all cut. The one defensible check — a declared child older than a declared parent — survives as a single anomaly type in the Review queue. | 3 |
| 8 | Golden Record | **CUT** | Unreachable in the current build, duplicates a badge that already fires, and borrows an MDM term for a record-merging capability Locus deliberately does not have. The inventory entry is struck and the docs must state plainly that **Locus performs no record merging.** | 5 |
| 9 | Undo / Redo + undo toast | **FIX** | A single `pendingUpdateRef` means a second edit before the toast expires discards the first record's undo. Becomes a per-record `Map`, the toast button is relabelled to say what it undoes, and Ctrl+Z / Ctrl+Y are actually bound — the tooltips advertising them are currently fiction, as `src/` contains zero keyboard-event handlers. | 3 |
| 10 | Settings / Config | **SIMPLIFY · Sandbox DELETED** | The Sandbox toggle sets an `X-Locus-Sandbox` header nothing consumes: it is a standing mode a volunteer must remember they are in, that does nothing. Deleted outright and replaced by a per-write batch preview at the moment of writing. Spotify integration cut. | 3 |
| 11 | Hygiene utilities | **FIX `fixName` · CUT `enrichZipCodeAsync`** | `fixName` capitalises only the first letter of each space-delimited token, so it mangles a large class of real surnames (O'Brien, McDonald, Vega-Ruiz) — a name-correction tool that corrupts names. The ZIP enrichment path sends household addresses, including minors', to an uncontracted third party. `fixEmail`'s Levenshtein domain rewrite is gated out of bulk. | 5 |
| — | **Grade promotion** | **BUILD** | The one automation whose silent failure has a same-week, in-person consequence: a kid in the wrong room on Promotion Sunday. Currently a report line whose Approve button is `alert('(Mocked action)')`. Full specification below. | 3 |
| — | **PCO note as record of record** | **BUILD** | Every Locus write that changes a person's status or grade writes a Planning Center note saying why. This is what makes an archive recoverable by a staff member who was not in the room. | 2 |

---

## Ordered work list

Value per unit of effort. Items 1–4 are independent. Everything after has the
stated dependency, and **two of them are hard gates, not preferences**.

| # | Work | Files | Depends on |
|---|------|-------|-----------|
| 1 | **Cuts.** Speed Run (`App.tsx:95, 774-779, ~1027`; `ReviewMode.tsx:60-76,115-119,167-169,236-238,497`), then collapse `zenMode` to `zenAudioTheme !== 'none'`. Golden Record (`GoldenRecordModal.tsx`/`.css`/`.test.tsx` + its import, state and mount in `App.tsx`). Spotify (`ConfigModal.tsx:104-116`, `storage.ts:23`). `enrichZipCodeAsync` (`zipCodes.ts:50-70`, its import at `ReviewMode.tsx:4`, the `newZip.length === 5` block at `:448-457`). | as listed | — |
| 2 | **`fixName` repair** — split on `[\s\-']` preserving delimiters, special-case `Mc`/`Mac`, leave roman-numeral suffixes uppercase. Gate `fixEmail`'s domain rewrite out of `handleFixAll`. | `src/utils/hygiene.ts:18-26, 74-101`; `src/components/ReviewMode.tsx:138-145` | — |
| 3 | **`singleRecordMode`**, then delete the Smart Fix modal. `const singleRecordMode = students.length === 1` hides the `{currentIndex + 1} / {students.length}` counter and **hard-disables Smart Fix All regardless of `onSaveBulk`** — `ReviewMode.tsx:497` gates only on `!isSpeedRun && onSaveBulk` today, so a scatter-point click shows a bulk button for one record. Render one Cancel (keep the footer, drop the header affordance). | `src/components/ReviewMode.tsx`; delete `SmartFixModal.tsx`/`.css`/`.test.tsx` | 1 |
| 4 | **Undo repair.** `pendingUpdateRef` → `Map<studentId, pending>`, flushed on unmount and navigation. Relabel the toast button *"Undo edit"*; give the header buttons tooltips naming what they revert. Bind Ctrl+Z / Ctrl+Y next to `handleHistoryUndo`/`Redo`. | `src/App.tsx`; `src/components/UndoToast.tsx`; `src/components/UndoRedoControls.tsx:17,27` | — |
| 5 | **The write ledger.** One append-only log of every PCO write Locus attempts. Entry: `{personId, name, field, before, after, at, source, dryRun, context}`, where `context` carries `ghostReason`, `lastCheckInAt`, `createdAt` and `configUsed` for archives, and the selection basis plus `configUsed` for promotions. Persisted in storage, exportable as CSV, session counter in the header. **Replaces** `App.tsx:324-326`'s `alert()`, `AutomationsReport.tsx:85`'s `alert()`, and the ghost-specific CSV. | `src/utils/storage.ts`; new `src/utils/ledger.ts` | — |
| 6 | **The PCO note module.** Category bootstrap, sharing copy, note-first write order, preflight probe, degradation rule. Full sub-spec below under *Grade promotion → §D*. `writeContact` (`pco.ts:366-387`) is the read-or-create shape to copy; the category bootstrap has no existing analogue. | `src/utils/pco.ts` (currently zero references to `/notes` or `/note_categories`) | 5 |
| 7 | **Delete Sandbox; build the batch preview.** Remove the checkbox (`ConfigModal.tsx:150-153`), its state/hydration/save (`:21,37,55`), `sandboxMode?: boolean` (`storage.ts:15`), the standing banner (`App.tsx:673`) and the four read sites (`App.tsx:299,348,434,520`). **Keep the fourth parameter**, renamed `dryRun`: inside `updatePerson` (`pco.ts:389`), replace the header no-op with an early return that synthesises the success shape **without issuing a request** and appends the intended write to the ledger tagged `dryRun: true`. `archivePerson` (`pco.ts:445`) inherits it. Then one shared `<BatchWriteConfirm>` — see below. | `src/components/ConfigModal.tsx`, `src/utils/storage.ts`, `src/utils/pco.ts`, `src/App.tsx`; new `src/components/BatchWriteConfirm.tsx` | 5, 6 |
| 8 | **Ghost Protocol.** Tenure floor, fail-closed on absent `createdAt`, `ghostReason` on every row, full list with default-empty checkboxes, honest copy, delete "Analyze Deeply", an `ArchiveCommand` on `commandManagerRef`, typed confirmation above five records, Dashboard restatement, `isChild` named explicitly in the confirm string. Strip the reward loop: the `App.tsx:306-324` region, the `the-exorcist` badge (`gamification.ts:40-46`), the `ghostsCleared` counter (`gamification.ts:160`). Populate `created_at` on the hand-written person fixtures in `mock-api/data.js` — only the 40 generated newcomers carry it today (`data.js:467`), so every fixture child fail-closes to `isGhost === false` and the repair is undemonstrable in dev. | `src/utils/ghost.ts`, `src/components/GhostModal.tsx`, `src/App.tsx:263,292-326`, `src/utils/gamification.ts`, `mock-api/data.js` | 5, 6, 7 |
| 9 | **Widen the population.** `transformPerson` (`pco.ts:253-265`) returns a `Student` with `birthdate: null`, `calculatedGrade: null`, `delta: null` instead of bailing to `null` at `:257-259`; each consumer filters explicitly. The scatter adds `birthdate !== null` beside its existing `pcoGrade !== null` (`App.tsx:785`); the grader skips them; `duplicates.ts`, which reads no date field, gains the adult roster for free. Remove the null filter at `App.tsx:230-232`. Caption on Data Health: *"N have no birthdate on file and are excluded from grade checks; M shown here have no grade set."* | `src/utils/pco.ts`, `src/App.tsx` | **8 — see the gate below** |
| 10 | **Family Audit dissolution.** Cut `checkSpouseGap` (`family.ts:16-31`), the `<15y` parent/child warning (`family.ts:149-158`), `checkSplitHouseholds` (`family.ts:33-99`) and `handleFamilySwap` (`App.tsx:412`). **Keep** the age inversion (`family.ts:134-148`) as one Review-queue anomaly type with a two-candidate repair card — neither option pre-selected, birthdate correction offered first, and the flag-change option stating its consequence in the same sentence as the field name: *"Change child/adult flag. This changes ratio counts, security-tag colour and background-check requirements for this person."* Delete `FamilyModal.tsx`/`.css`/`.test.tsx`, the `'families'` branch of `handleNavigation`, the mount, `isFamilyModalOpen`, and the Dashboard quick-action. | `src/utils/family.ts`, `src/App.tsx`, delete `src/components/FamilyModal.*` | — |
| 11 | **The confirmed-correct flag.** A `Set<string>` of `${studentId}:${anomalyType}` in storage, honoured by the anomalies filter (`App.tsx:272`) and by the promotion population gate *before render*. Surfaced as **"Mark correct"** beside Skip. **Replaces** the current meaning of "Skip" (`ReviewMode.tsx:496`), which means "show me this again forever" and is why the queue never empties. | `src/utils/storage.ts`, `src/components/ReviewMode.tsx`, `src/App.tsx` | 5 |
| 12 | **Cutoff reconciliation.** The grade cutoff control stays in Settings, relabelled: *"Grade cutoff — this must match your PCO organisation's grade settings. Locus cannot read that setting from the API. If they disagree, every student will appear one grade off."* Delete the hardcoded June 1 season start (`automations.ts:69-81`). | `src/components/ConfigModal.tsx`, `src/utils/automations.ts` | — |
| 13 | **Grade promotion** — full specification below. | `src/utils/automations.ts`, `src/App.tsx:762-798`, `src/components/AutomationsReport.tsx` | 7, 11, 12 (**11 is a gate**) |
| 14 | **Restored small items.** Sibling/twin warning (`DuplicatesReport.tsx:101-113`). Roving tabindex + skip-to-next-anomaly on the scatter — `CustomShape` puts `tabIndex={0}` on *every* point, so 300 loaded records is 300 tab stops. Dashboard *"— no check-in data"* instead of a bare `0` (`Dashboard.tsx:62-63,95`) and a minimum-N gate on the Health Score card (`:78-83`). `Matched Value` column in the duplicates CSV (`DuplicatesReport.tsx:21-31`). Responsive container on the scatter (`GradeScatter.tsx:137-138`). | as listed | — |

### The two hard gates

1. **Item 9 must not land before item 8.** `App.tsx:263` is `students.filter(s
   => isGhost(s))`, and `isGhost` (`ghost.ts:12-27`) reads **only**
   `lastCheckInAt` — never checked in means ghost, immediately, with no tenure
   floor today. Records with no birthdate are invisible right now solely because
   `transformPerson` drops them. Widening the population therefore admits every
   birthdate-less nursery and preschool record — the largest such population in
   any church database, because the desk skips the field constantly — straight
   into an ungated archive path. Ship item 8 first, or ship item 9 with a
   temporary `birthdate !== null` guard on the ghost filter, removed when 8
   lands.
2. **Item 13 does not ship without item 11.** Planning Center models grade
   overrides per person and Locus reads only the resulting `grade` field, so
   without a confirmed-correct set Locus mistakes PCO's correct answer for an
   error — forever, every year, and now with a bulk write attached. Every
   legitimately held-back or accelerated child is re-proposed for promotion
   annually. This is a domain veto, recorded in three consecutive rounds.

### `<BatchWriteConfirm>` (item 7), used by both the archive and promotion paths

1. Pressing the batch action runs the selected records through the `dryRun`
   path. No request leaves the browser.
2. The dialog renders the **full per-record list, never a count**: name, field
   changing, before → after, and for archives `ghostReason`, `lastCheckInAt`,
   `createdAt`.
3. **One household line per row**, computed as a `groupBy` on `householdId`
   (`pco.ts:85`) over the already-loaded records — no fetch, no new column:
   *"3 of 4 people at this address checked in within the last 24 months."*
   Where `householdId` is null, print *"no household on file"* rather than
   omitting the line; a silent omission reads as "nobody else here."
4. **Rows with `isChild: true` are listed in their own section above the fold**,
   named individually, before the adult rows.
5. **Placeholder birthdates are annotated inline**: *"Birthdate on file is 1
   January — this is often a placeholder. Grade may be wrong."* Nothing in the
   codebase detects this today; `grader.ts:12-32` computes an expected grade
   from any date handed to it with full confidence, and 1 January is the single
   most over-represented birthdate in children's ministry data.
6. Only then does *"Confirm and write to PCO (N records)"* go live, behind a
   typed-count confirmation for batches above five. The note-category and
   permission state (§D below) is displayed here too.

Single-record writes stay out of scope for the preview; they are covered by the
undo window in item 4.

**First-launch modal, repurposed:** with no config in storage, a one-time
unskippable *"Locus writes directly to your production Planning Center data"*
acknowledgement, before any write path is reachable.

### The `isMinor` boundary rule — write this into the code and keep it

> **Treatment reads use `isMinor`. Claim reads read `isChild` and `age`
> separately.**
>
> A *treatment* read asks "may this person be handled as an adult?" — who lands
> in a broadcast, who joins an adult small group, who is exempt from a
> safeguarding rule. Those use the shared `isMinor` predicate (`pco.ts:122`),
> which fails safe: `isChild || age < 18 || age > 110`.
>
> A *claim* read asks "what does this record assert about itself?", and its
> whole purpose is to catch the flag and the age disagreeing. The surviving
> age-inversion check in `family.ts` is a claim read. Substituting `isMinor`
> there makes the two inputs agree by construction and the anomaly becomes
> unfindable — verified empirically: doing so turns the existing "child older
> than parent" test red, because its fixture is a ten-year-old marked "Dad",
> which is exactly the bug the check exists to report. The child-section split
> in the batch preview is likewise a claim read and stays on `isChild`.
>
> Do not "tidy" `family.ts` onto the shared helper. This is precisely the change
> a future contributor will try to make.

---

## Grade promotion — full specification

The largest single build the audit recommends, and the one the youth director
called the highest-value thing the product could get right. Grade changes every
August for every student; stale and wrong grades are roughly half the errors in
any church database. What exists today is `getPendingGradePromotions`
(`automations.ts:63-96`) feeding a report list whose Approve button calls
`alert('Action "Promote Grade" approved for student N. (Mocked action)')`
(`AutomationsReport.tsx:85`) and then locally hides the row.

### A. Population

Include a student when **all** of:

- `pcoGrade !== null`
- `birthdate !== null`
- `expectedGrade - pcoGrade === 1`
- the pair `${studentId}:grade-promotion` is **not** in the confirmed-correct set

`expectedGrade` comes from `calculateExpectedGrade` (`grader.ts:12-32`) using
the configured cutoff.

**`isChild` is deliberately not in this gate.** The current implementation
filters `s.isChild && s.birthdate` (`automations.ts:84`), and PCO's `child` flag
is unreliable above roughly 8th grade and degrades with age — volunteers flip it
to `false` when a student gets their own phone number, email address or serving
role, and nobody flips it back. Under an `isChild` gate a 10th grader recorded
as `grade: 9` with `child: false` is never promoted, never appears in the
eligible list, and never reaches the review lane either, because that lane is
defined off the same population. They sit one grade off permanently and
invisibly, at exactly the 8th→9th cliff where attention matters most.

Dropping it is safe because arithmetic does the protecting: having a school
grade recorded *is* the claim that this person is on a school-grade roster;
adults do not have one, and an adult volunteer carrying a stale grade from their
own youth-group days has an expected grade twenty higher than their recorded
one, so the `=== 1` filter excludes them. The 19-year-old-with-grade-12 case is
excluded separately by §E.

Per the boundary rule above, this is a **claim** read and must not be switched
to `isMinor`.

### B. Cutoff and season — one clock

Delete `promotionStartMonth` / `promotionStartDay` and the `isAfter(today,
promotionSeasonStart)` early return (`automations.ts:69-81`). There are two
unrelated constants in the codebase today that both look authoritative:
`grader.ts:4-5` defaults to a **September 1** cutoff, `automations.ts:69-70`
hardcodes a **June 1** season start. Season derives solely from
`GraderOptions.cutoffMonth` / `cutoffDay`, which is the same setting the scatter
already uses, and which is now permanently user-configured (see §F).

### C. Selection UI — a mode of Data Health, not a new screen

`data-health` (`App.tsx:762-798`) is today one header button row, one
`<GradeScatter>`, and a "Load More Records" footer. Promotion becomes a **third
header button, not a second region**:

- The header row carries *"Review Mode (N)"* and, new, **"Promote eligible
  (N)"**. Speed Run is deleted, so the row keeps exactly two buttons.
- **The promote button's visibility condition is its own.** The header row is
  currently wrapped in `{anomalies.length > 0 && ...}` (`App.tsx:766`).
  Promotion eligibility has nothing to do with the anomaly count, and a church
  that has cleaned its data — which is the whole point of Locus — would arrive
  at Promotion Sunday with zero anomalies and no promote button rendered at all.
  Gate it on `eligible.length > 0`; render the row when either count is nonzero.
- Activating it **replaces the `<GradeScatter>` render** with the batch-select
  list, inside the same container. The scatter is not shown alongside; its
  click-to-drill affordance is not live during selection because it is not on
  screen. Cancel, or a completed write, returns to the scatter. One visible
  interaction model at a time. **No new route and no new nav entry.**
- A **summary line above the list**, stating the pagination fact:
  *"112 eligible students found in the 300 records loaded so far. Load all
  records before promoting — this list is not the whole congregation."*
  The confirm button stays **disabled while `nextUrl` is set**. This is not
  polish. A partially loaded promotion is worse than no promotion: it produces a
  half-promoted cohort sharing a small group and landing in different Check-Ins
  rooms, with no field anywhere distinguishing "promoted" from "not yet", and
  untangling it costs more than doing the whole rollover by hand.
- Default-**empty** checkboxes. One *"Select all eligible (N)"*. One *"Promote
  selected"*. Then the mandatory `<BatchWriteConfirm>` and typed confirmation.
  No per-row `alert()`.

### D. The write — note first, then the field

Every promotion and every archive writes a Planning Center note recording why.
`pco.ts` has zero code touching `/notes` or `/note_categories` today.

1. **Category bootstrap, once per install.** `GET
   /people/v2/note_categories`. If a category named `Locus Data Hygiene` exists,
   use its id; otherwise `POST` it (`name: 'Locus Data Hygiene'`, `locked:
   false`). Persist the id in storage as `noteCategoryId` so it resolves once,
   not per write.
2. **Sharing is stated, never assumed.** A note in a category nobody else can
   see is not a record, it is a private diary. PCO categories carry their own
   sharing model and a category Locus creates is not automatically visible to
   other staff. Both Settings and the confirm dialog state: *"Archive and
   promotion reasons are written to the PCO note category 'Locus Data Hygiene'.
   Only staff this category is shared with can see them — share it in Planning
   Center under People → Settings → Note Categories."* Locus does not attempt to
   manage the shares itself.
3. **Write order: note first, then the field PATCH.** If the note succeeds and
   the PATCH fails, the tenant is left with a harmless self-describing orphan
   note and a ledger entry recording the failure — recoverable. The reverse
   order leaves a changed record with no reason recorded anywhere durable, which
   is the exact failure the durable record exists to prevent. Per-record, not
   per-batch: one record's note failure aborts **that record** before any
   mutation and does not abort the batch.
4. **Batch reporting is per-record and honest.** Three counts — written, skipped
   (note failed, record untouched), failed (note written, PATCH failed) — with
   names listed for the latter two. Never report a batch as successful because
   most of it succeeded.
5. **Preflight probe and degradation rule.** On opening a batch confirm, resolve
   the category once. If it is refused:
   - **Archive is blocked.** The confirm button does not go live. The dialog
     names the exact remedy — *"A People administrator must grant this account
     permission to create notes, and share the note category under People →
     Settings → Note Categories"* — and keeps **"Export this list as CSV"**
     live, so a blocked feature becomes a work order the administrator can
     action in Planning Center by hand.
   - **Promotion proceeds**, with a prominent in-dialog warning that no PCO-side
     record will exist, and the ledger CSV download is **triggered
     automatically** at the end of the write rather than offered. In the
     degraded case the volunteer's browser is the only place the record of a
     hundred grade changes exists, and a reissued machine or a cleared browser
     is a normal-cycle event.
   - When the probe establishes notes are unavailable, the promotion path
     **skips the note POST entirely** and records `context.noteWritten: false`.
     Stated explicitly because rule 3 would otherwise abort every record before
     mutation and silently turn "proceeds with a warning" into "nothing
     happened, reported as degraded success."

   The asymmetry rests on **detectability, not reversibility**. Both writes are
   one-field PATCHes — `archivePerson` (`pco.ts:445`) is
   `updatePerson(id, { status: 'inactive' })`, mechanically as reversible as the
   grade write. But a wrong promotion is self-announcing within a week: the kid
   turns up, the label prints the wrong room, a leader says so, it is fixed. A
   wrong archive is silent by construction — `status: 'inactive'` removes the
   person from exactly the lists, exports, rosters and mailings that would have
   revealed the error. Nobody notices until the family notices, and what they
   notice is that the church stopped contacting them. Worse, the failure
   compounds at the check-in desk: an inactive child does not appear in
   Check-Ins, so on a Sunday inside an eight-minute window the volunteer creates
   a **new** record — with no allergy note, no medical flag and an empty
   authorised-pickup list — and the security tag prints anyway. The PCO note is
   the only artifact that reaches that desk. This is a children's-ministry
   domain veto, not a preference.

The write itself is one `BatchUpdateCommand` shaped like the existing
`handleSaveStudentBulk`, pushed to `commandManagerRef` so it is undoable, and
written to the ledger with the selection basis and the config used.

### E. Completion, graduation, and the review lane

- **Completion is the write.** Delete `dismissedPromotions` and
  `handleDismissPromotion` (`AutomationsReport.tsx:32,49,75,87,288`). A local
  `Set` that forgets on reload is not a decision record. *"Dismiss"* becomes
  **"Mark correct"** and writes to the confirmed-correct set.
- **Graduation is its own lane.** No grade-13 PATCH. Seniors leaving for college
  are the goal, not attrition, and must never be equated with it.
- **Students more than one grade behind expected** are routed to the Data Health
  anomaly queue as *"more than one grade behind expected — needs review, not
  auto-promotion."* This is a **standing, low-volume lane with no dedicated
  screen region**, and it is **never bulk-writable**. After the first pass it
  reads near-empty most weeks, like every other anomaly type — but it never
  retires, because new rows enter it every year from mid-year transfers,
  homeschool-to-traditional switches, birthdate corrections that jump the
  expected grade two grades in one edit, and fresh held-back decisions not yet
  flagged. A team trained to expect zero will ignore it in year three, which is
  the false negative the youth director cares about most.
- Both automation lanes come out of `AutomationsReport.tsx:269-291`;
  `getPendingGradePromotions` (`automations.ts:63-96`) is rewritten in place.

### F. The cutoff Locus cannot read

Planning Center's People UI has an org-level grade auto-calculate setting. It is
**not exposed by the API** — it appears on no published attribute of
`Organization`, `Grade` or `SchoolOption`, and the only `auto`-prefixed
attributes anywhere in the People schema are `List.auto_refresh_enabled` and
`List.has_active_automations`. This is permanent, not a gap awaiting a version
bump. So the cutoff control stays, user-configured, with the reconciliation copy
in item 12, and Data Health states in place that a nonzero exception count most
likely means Locus's cutoff disagrees with Planning Center's own rather than
that the congregation's records are wrong.

---

## Already shipped

Committed during the audit, full suite green (80 files, 510 tests). Not pending
work.

- **`saveGamificationState` passphrase fix** at all six call sites in `App.tsx`.
  Three sites were passing the wrong argument and silently zeroing the user's
  counter on every save.
- **Shared `isMinor` predicate** exported from `pco.ts:122` —
  `isChild || age < 18 || age > 110`, failing safe on missing and implausible
  ages — now consumed by `newsletter.ts`, `sorter.ts` and `recruitment.ts`, with
  its own unit tests and a doc comment recording the family-audit exception.
- **Small group sorter refuses at input time** when handed a minor, rather than
  silently filtering.
- **`ui-avatars.com` egress removed** from `avatar.ts`; a comment records what
  was there and why it went.
- **The ZIP-to-area-code table no longer maps Schenectady to 555**, a reserved
  fictional area code.
- **Nine screens deleted** with their utilities and tests: Global Pulse, Giving
  River, Giving Trends, Emergency Alerts, Volunteer Web, Robert Report,
  Genealogy, Sermon Sentiment, Sermon Correlator.

One consequence for this area: an earlier draft of the population-widening work
carried a caption for Emergency Alerts, on the grounds that the who-do-we-call
list silently omitted grandparents and pickup contacts with no birthdate on
file. **That screen no longer exists**, so the caption is dead and the widening
drops to item 9 on the strength of what remains — honest record counts and the
adult roster finally reaching duplicate detection.

---

## What we could not settle

**Whether the token Locus actually holds can write PCO notes.** The endpoints
exist, the shapes are known, and the category bootstrap is specified — but note
creation depends on a per-user Planning Center People permission that is
independent of the API scope, and the documented key grant
(`read:*,passthrough,write`) never names `/notes` or `/note_categories`. Nothing
in the repository establishes that the passthrough reaches them. This is
answerable only by a live probe against a real tenant. The specification handles
both outcomes — that is what the preflight probe and the degradation rule in §D
are for — so the work is not blocked, but **the first thing to run against a
real tenant is that probe**, because a refusal makes Ghost Protocol
unshippable until an administrator grants the permission.

**Whether a volunteer understands that Cancel returns to the scatter** rather
than discarding a saved selection. One session with a real administrator settles
it. Not a reason to hold the build.

**Whether the household roll-up line is enough context to stop a bad archive.**
The line — *"3 of 4 people at this address checked in within the last 24
months"* — is the right shape and costs nothing, but no critic could say whether
a volunteer reading it at row 40 of 200 actually stops. It is cheap insurance,
not a proven control, and it should not be treated as one.

**How many records a volunteer will read before confirming.** The whole
preview design rests on rendering every row rather than a count, and on
annotating the risky ones so they are findable by scanning. At two hundred rows
that assumption is untested. If it fails, the answer is a smaller maximum batch
size, not a summary count — but nobody in five rounds could say what that
maximum is.
