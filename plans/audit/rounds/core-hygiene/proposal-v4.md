# Area A — core-hygiene — Proposal v4 (Round 4 synthesis)

Inputs: `proposal-v3.md`, `r4-all.md` (church-admin on Q-E/Q-B, UXR on Q-F,
children's on Q-C, youth on Q-G), plus the working tree as of this session
(88 test files, 545 tests, suite green).

Flag key: **Y** = CONVERGED (unchanged and unchallenged for two or more rounds
— do not re-argue). **S4** = SETTLED this round (question closed with evidence;
attack only with new evidence). **N** = open.

Round 4 was a **closure round**. All five open questions from v3 §4 are now
closed. **No new ideas are earned this round**, and nothing below adds a screen.

---

## 0. DONE — shipped and verified this session (do NOT re-plan)

These are in the working tree, not in the work list. Line numbers re-verified.

| # | Change | Verification |
|---|--------|--------------|
| D1 | `saveGamificationState` takes `appId` at all six call sites (`App.tsx:321,473,482,507,589,628`; signature `storage.ts:191`). The three sites that previously passed `auth` were silently zeroing the counter. | `grep` shows six `, appId)` call sites; `storage.test.ts:207`, `App.test.tsx:1054` cover it |
| D2 | Shared `isMinor` predicate exported from `pco.ts:122` — `isChild \|\| age < 18 \|\| age > 110` — consumed by `newsletter.ts:25`, `sorter.ts:22,118`, `recruitment.ts:96`, `SmallGroupSorter.tsx:23` | source read; doc comment at `pco.ts:110-121` already records the family-audit exception |
| D3 | `ui-avatars.com` egress removed (`avatar.ts:28` retains only the comment recording what was there and why it went) | no `ui-avatars` reference remains outside that comment |
| D4 | Global Pulse, Giving River and Giving Trends deleted | zero references in `src/` |

**Screen accounting update.** D4 removes three surfaces from the app before
Area A's own subtraction begins. Core's target remains six top-level surfaces
(Dashboard, Data Health, Review Mode, Duplicate Detective, Ghost Protocol,
Settings); §3.6 and §3.3 still take Area A two further down. Nothing in v4 adds
one.

**Line-number drift warning.** This session's edits shifted `pco.ts`. The
current, re-verified anchors are: `transformPerson` `:253-265` (the `!birthdate
→ return null` bailout is `:257-259`), `writeContact` `:366-387`, `updatePerson`
`:389`, `archivePerson` `:445`. v3's `:233-235 / :342-363 / :365 / :421-422`
citations are stale; use these. `ConfigModal.tsx:21,37,55,150-153`,
`storage.ts:15`, `App.tsx:304,353,439,525,678`, `automations.ts:73-76,94` and
`AutomationsReport.tsx:85` are all still accurate.

---

## 1. Changes since v3

1. **Q-E answered — the ledger design survives, but v3 under-scoped it by an
   entire sub-resource.** `POST /people/v2/people/{id}/notes` exists and is
   writable, but every `Note` requires a `note_category_id` pointing at a
   separate `NoteCategory` resource that must be found or created first, and
   which carries its own sharing model (`NoteCategoryShare`) — a category Locus
   creates is not automatically visible to other staff. `pco.ts` has zero code
   touching `/notes` or `/note_categories`, and `README.md:41-51` grants
   `write` without ever naming them. **v3 §3.1 A2's "R4 does not ship without
   (i) and (ii)" was written as if this were one line. It is a bootstrap, a
   sharing decision, a write-order decision and a partial-failure rule.** Full
   sub-spec is now **§5.4**; Q-E closes as *feasible, re-scoped*.

2. **Q-B answered — permanently unreadable.** No auto-calculate attribute
   exists on `Organization`, `Grade` or `SchoolOption`; the only `auto`-prefixed
   attributes in the People schema are `List.auto_refresh_enabled` and
   `List.has_active_automations`. It is a People UI setting with no API surface.
   **The §5.3 fallback is the permanent answer, not a conditional branch.** The
   "if readable, read it and delete the control" text is now dead and is deleted
   (§5.3). Row 2's auto-calc half flips **N → S4**.

3. **Q-F closed by specifying the layout UXR said was missing.** I asked round 4
   to judge crowding on the actual layout and never wrote one — that is my
   error, not UXR's. Adopting UXR's fix verbatim: promotion is a **mode of the
   existing header button row**, not concurrent screen real estate. Specified in
   §3.5.

4. **Q-C closed as one line, not a feature.** Children's ruled the household
   roll-up belongs inside §3.2's per-record preview row, not as a new column or
   aggregation. `householdId` is already on every record (`pco.ts:85`), so it is
   a `groupBy` over data already in memory. Added to §3.2 step 2.

5. **Q-G closed as "standing, low-volume, no dedicated section."** Youth
   rejected the report-line reading with a cohort argument I accept: mid-year
   transfers, homeschool switches, birthdate corrections and fresh held-back
   decisions all mint new 2+-behind rows every year, indistinguishable at read
   time from the backlog. §3.3's routing text is rewritten to say so
   explicitly, closing the ambiguity rather than leaving it to round 5.

6. **New finding folded into §3.6 — the `isMinor` boundary rule.** D2
   deliberately did **not** apply `isMinor` to `family.ts`. Applying it turned
   the existing "child older than parent" test red, because that fixture is a
   ten-year-old marked "Dad" — exactly the disagreement the check exists to
   catch. The general rule, now written into §3.6 because §3.6's surviving check
   and its repair card sit precisely on this line: ***treatment* reads use
   `isMinor`; *claim* reads must read `isChild` and `age` separately.**

---

## 2. Per-feature decisions

Unchanged from v3 except flags. Ten rows were closed to re-argument in round 4
by the round brief and none was reopened.

| # | Feature | Verdict | Rationale | Flag |
|---|---------|---------|-----------|------|
| 1 | Dashboard | SIMPLIFY | Drop Area C teasers; gate Health Score below minimum N; distinguish "0" from "no data"; publish excluded-record count | **Y** |
| 2 | Data Health scatter | SIMPLIFY + RE-FRAME | Override/off-cycle exception catcher, not congregation health. Auto-calc is unreadable (Q-B) so the cutoff control stays with a reconciliation caption; promotion hosted as a header **mode**, not a second region (Q-F) | **S4** (was N) |
| 3 | Smart Fix Modal | MERGE → ReviewMode with `singleRecordMode` | Guard closes bulk button, phantom "1/1" and undefined Skip. One Cancel, not two | **Y** |
| 4 | Review Mode + Speed Run + Zen | CUT Speed Run, KEEP+FIX Review Mode, collapse Zen | Timer and score on writes to minors' PII buy no hygiene capability | **Y** (R1–R4) |
| 5 | Duplicate Detective | KEEP + FIX ×3 | Punting merge to PCO is right. Sibling warning; CSV matched-value column; population widened via §3.9 | **Y** |
| 6 | Ghost Protocol | FIX + strip gamification + durable log | Gamification strip is a domain veto. Durability bar now has a real sub-spec (§5.4) | **Y** (R1–R4) |
| 7 | Family Audit | DISSOLVE — cut 3 checks, cut the auto-swap, delete the surface | Age-subtraction inference with no relationship data. Survivor becomes one anomaly type in the Review queue, and is a *claim* read (§3.6) | **Y** |
| 8 | Golden Record | CUT | Unreachable; duplicates a badge that already fires; MDM term for a capability Locus deliberately lacks | **Y** (R1–R4) |
| 9 | Undo / Redo + toast | FIX | Per-record `Map` + relabel + real Ctrl+Z binding | **Y** |
| 10 | Settings / Config | SIMPLIFY + Sandbox toggle DELETED, dry run rebuilt as batch preview | A standing mode a volunteer must remember they're in is a governance cost; the preview belongs at the moment of write | **Y** (S3→Y, unchallenged) |
| 11 | Hygiene utilities | FIX `fixName`, CUT `enrichZipCodeAsync` | Casing wrong for a large surname class; ZIP path egresses minors' household data to an uncontracted third party | **Y** (R1–R4) |
| — | **Grade promotion** (pulled from Area C) | **BUILD** | Fully specified; the one automation whose silent no-op has a same-week, in-person consequence. Blocked on §5.2 | **Y** (S3→Y, unchallenged) |
| — | PCO note as record of record | **BUILD (re-scoped)** | Q-E: writable, but needs category bootstrap, sharing, write order and a failure rule. §5.4 | **S4** |

---

## 3. The concrete work

### 3.1 Ghost Protocol — CONVERGED, unchanged; ledger bar now has a spec

R1 (tenure floor, fail-closed on absent `createdAt`), R2 (`ghostReason`), R3
(full list, default-empty checkboxes, honest copy, delete "Analyze Deeply"), R4
(`ArchiveCommand` on `commandManagerRef`, typed confirm >5), R5 (Dashboard
restatement), A1 (delete the reward loop: `App.tsx:314-324` region, the
`the-exorcist` badge at `gamification.ts:40-46`, the `ghostsCleared` counter),
A3 (`isChild` named explicitly in the confirm string) and A4 (populate
`created_at` in `mock-api/data.js:117-208` or every fixture child fail-closes to
`isGhost === false` and the repair is undemonstrable in dev) all carry
unchanged. **Do not re-argue any of these.**

A2's durable record is unchanged in intent and now buildable: (i) the mandatory
PCO-side note per §5.4, (ii) the §5.1 ledger entry with structured `context`,
(iii) CSV as a convenience index. Archive does not ship if (i) is unavailable —
see §5.4's degradation rule, which is deliberately stricter for archive than for
promotion.

### 3.2 Sandbox — delete the toggle, build the preview (CONVERGED, one line added)

**Delete.** `ConfigModal.tsx:150-153` (checkbox), `:21,37,55` (state, hydration,
save), `storage.ts:15` (`sandboxMode?: boolean`), the standing banner branch at
`App.tsx:678`. `App.tsx:304,353,439,525` stop reading `config.sandboxMode`.

**Keep and rename the parameter.** `updatePerson(id, attributes, auth,
sandboxMode?)` (`pco.ts:389`) keeps its fourth argument, renamed `dryRun`.
Inside, replace the `X-Locus-Sandbox` header no-op with an early return that
synthesises the success shape **without issuing any request** and appends the
intended write to the §5.1 ledger tagged `dryRun: true`. `archivePerson`
(`pco.ts:445`) inherits it. Six-line intercept.

**One shared `<BatchWriteConfirm>`** for the ghost `ArchiveCommand` and the
promotion `BatchUpdateCommand`:

1. Pressing the batch action runs selected records through the `dryRun` path.
   No request leaves the browser.
2. The dialog renders the **full per-record list, never a count**: name, field
   changing, before → after, and for archives `ghostReason`, `lastCheckInAt`,
   `createdAt`. **Plus, new this round (Q-C, children's): one household line per
   row — *"3 of 4 people at this address checked in within the last 24
   months."*** Computed as a `groupBy` on `householdId` (`pco.ts:85`) over the
   already-loaded `students` array; no fetch, no new column, no new screen.
   Where `householdId` is null, print *"no household on file"* rather than
   omitting the line — a silent omission reads as "nobody else here."
3. **Any row with `isChild: true` is listed in its own section above the fold**,
   named individually, before the adult rows. Note this is a **claim** read per
   §3.6's rule — it reports what the record declares — so it reads `isChild`
   directly and must **not** be switched to `isMinor`.
4. Only then does "Confirm and write to PCO (N records)" go live, behind the
   typed-count confirmation §3.1 R4 specifies. §5.4's category/permission state
   is displayed here too.

**Single-record writes stay out of scope for preview.** Covered by §3.4's
never-written window.

**First-launch modal survives, repurposed:** with no `config` in storage, a
one-time unskippable "Locus writes directly to your production Planning Center
data" acknowledgement before any write path is reachable.

### 3.3 Grade promotion — BUILD (CONVERGED; Q-G's wording now settled)

Population, cutoff, selection UI, write path, completion semantics and
graduation handling are unchanged from v3 §3.3 and are not re-argued:

- **Population.** `isChild === true` AND `birthdate !== null` AND `pcoGrade
  !== null` AND `expectedGrade - currentGrade === 1`, with §5.2's
  confirmed-correct set gating **before render**, not as a post-hoc uncheck.
- **§5.2 ships in the same change or grade promotion does not ship**
  (children's veto, standing).
- **One clock.** Delete `promotionStartMonth`/`promotionStartDay` and the
  `isAfter(today, promotionSeasonStart)` early return (`automations.ts:73-83`).
  Season derives solely from `GraderOptions.cutoffMonth`/`cutoffDay`.
- **Selection UI.** Default-empty checkboxes, one "Select all eligible (N)",
  one "Promote selected", then §3.2's mandatory preview and typed confirm. No
  per-row `alert()` (`AutomationsReport.tsx:85`).
- **Write.** One `BatchUpdateCommand` shaped like `handleSaveStudentBulk`,
  pushed to `commandManagerRef`, written to the §5.1 ledger and to the §5.4
  note.
- **Completion is the write.** Delete `dismissedPromotions` /
  `handleDismissPromotion`; "Dismiss" becomes "Mark correct" → §5.2's set.
- **Graduation is its own lane.** No grade-13 PATCH, never equated with attrition.
- Both lanes deleted from `AutomationsReport.tsx:269-291`;
  `getPendingGradePromotions` (`automations.ts:63-96`) rewritten in place.

**Changed this round — the 2+-behind routing sentence (Q-G, S4).** Replace v3's
open framing with the settled one:

> Students more than one grade behind expected are routed to the Data Health
> anomaly queue as *"more than one grade behind expected — needs review, not
> auto-promotion."* This is a **standing, low-volume lane with no dedicated
> screen region**. After §5.2's first pass it will read near-empty most weeks,
> like every other anomaly type — but it never retires, because new rows enter
> it every year from mid-year transfers, homeschool-to-traditional switches,
> birthdate corrections that jump `expectedGrade` two grades in one edit, and
> fresh held-back decisions not yet flagged. It is never bulk-writable.

Round 5 must not re-read this as a report line.

### 3.4 The undo toast — CONVERGED

`pendingUpdateRef` becomes `Map<studentId, pending>`, flushed on
unmount/navigate. Toast button relabelled **"Undo edit"**; header buttons get
tooltips naming what they revert. Ctrl+Z / Ctrl+Y bound next to
`handleHistoryUndo`/`Redo` — `src/` still contains zero
`keydown`/`ctrlKey`/`metaKey` references, so `UndoRedoControls.tsx:17,27`'s
tooltips remain fiction until the binding lands. The binding is inside this
change.

### 3.5 Data Health — re-framed, and the promotion host (Q-B and Q-F closed)

**Auto-calc (Q-B, S4).** The setting is not exposed by the API and will not
become exposed. Delete the "ask the org whether auto-calculate is on" question
from `ConfigModal` as a *conditional*; instead the cutoff control ships
permanently with the reconciliation caption from §5.3, and the screen states
in-place that a nonzero exception count most likely means Locus's cutoff
disagrees with PCO's own. The retitle to *"Grade exceptions"* and the removal of
its Health Score contribution are now unconditional, not gated on an answer.
Keep the responsive container, shape-not-colour encoding, and the exclusion
caption.

**Layout (Q-F, S4) — adopting UXR's fix verbatim.** Today `data-health`
(`App.tsx:768-802`) is one header row of buttons plus one `<GradeScatter>` plus
a "Load More Records" footer — one interaction model, one visual region.
Promotion becomes a **third header button, not a second region**:

- Header row (`App.tsx:772-787`) carries "Review Mode (N)" and, new,
  **"Promote eligible (N)"**. ("Speed Run" is deleted by §3.7, so the row keeps
  exactly two buttons.)
- Activating "Promote eligible" **replaces the `<GradeScatter>` render** with
  the batch-select list inside the same `view-container`. The scatter is not
  shown alongside it; the click-to-drill affordance is not live during
  selection, because it is not on screen.
- Cancel, or a completed write, returns to the scatter render.
- One visible interaction model at a time. No new route, no new nav entry, no
  sub-view that is a peer of the scatter.

This is the whole of §3.5's addition. If round 5 finds the swap loses necessary
context (a leader wanting the scatter *while* selecting), the answer is a
count/summary line above the list — **not** a second region and not a new
destination.

### 3.6 Family Audit — dissolved (CONVERGED) + the `isMinor` boundary rule

Cut `checkSpouseGap` (`family.ts:16-31`), the `<15y` parent/child warning
(`family.ts:149-158`), `checkSplitHouseholds` (`family.ts:33-99`) and
`handleFamilySwap` (`App.tsx:420-462`). Keep the age inversion
(`family.ts:134-148`). Delete `FamilyModal.tsx`, `.css`, `.test.tsx`, the
`'families'` branch of `handleNavigation`, the mount, `isFamilyModalOpen`, and
the Dashboard quick-action.

Two-candidate repair card stands: neither option pre-selected;
birthdate-correction ordered first (typo / guess / 1-1 placeholder is the common
case, a genuinely mis-set `isChild` is rare and usually already known). Option
(b)'s copy states the consequence in the same sentence as the field name —
*"Change child/adult flag. This changes ratio counts, security-tag colour and
background-check requirements for this person."*

**New, from D2's finding — write this rule into the code and keep it:**

> **Treatment reads use `isMinor`. Claim reads read `isChild` and `age`
> separately.**
>
> A *treatment* read asks "may this person be handled as an adult?" — who lands
> in a broadcast, who joins an adult small group, who is exempt from a
> safeguarding rule. Those must use `isMinor` (`pco.ts:122`), which fails
> safe: `isChild || age < 18 || age > 110`.
>
> A *claim* read asks "what does this record assert about itself?" — and its
> entire purpose is to catch the flag and the age disagreeing. `family.ts`'s
> surviving age-inversion check (`:119-120,132-148`) is a claim read.
> Substituting `isMinor` there makes the two inputs agree by construction and
> the anomaly becomes unfindable — verified empirically: doing so turns the
> existing "child older than parent" test red, because its fixture is a
> ten-year-old marked "Dad", which is exactly the bug the check exists to
> report. `pco.ts:110-121`'s doc comment already records this; §3.6 must not
> "tidy" `family.ts` to use the shared helper.
>
> §3.2 step 3's child-section split is likewise a claim read (it reports what
> the record declares before a human confirms a write) and stays on `isChild`.

### 3.7 Cuts and dead weight — CONVERGED, near-zero effort

Speed Run (`App.tsx:95,780-786,1027`; `ReviewMode.tsx:60-76,115-119,167-169,
236-238,497`), then `zenMode` collapses to `zenAudioTheme !== 'none'`. Golden
Record (`GoldenRecordModal.tsx`/`.css`/`.test.tsx`, its `App.tsx` import, state
and mount, plus striking row #8 from `feature-inventory.md` and stating that
**Locus performs no record merging**). Spotify (`ConfigModal.tsx:104-116`,
`storage.ts:23`). `enrichZipCodeAsync` (`zipCodes.ts:50-70`, its import at
`ReviewMode.tsx:4`, the `newZip.length === 5` block at `:448-457`). `fixName`
(`hygiene.ts:18-26` — split on `[\s\-']` preserving delimiters, special-case
`Mc`/`Mac`, leave roman-numeral suffixes uppercase). Gate `fixEmail`'s
Levenshtein domain rewrite (`hygiene.ts:74-101`) out of `handleFixAll`
(`ReviewMode.tsx:138-145`).

### 3.8 Smart Fix merge — CONVERGED

Ship `const singleRecordMode = students.length === 1`, hiding the
`{currentIndex + 1} / {students.length}` counter and **hard-disabling Smart Fix
All regardless of `onSaveBulk`** (`ReviewMode.tsx:497` currently gates only on
`!isSpeedRun && onSaveBulk`, so a `GradeScatter` point click shows it today).
Then delete `SmartFixModal.tsx` / `.css` / tests; the duplicated delta logic is
the prize. In `singleRecordMode` render **one** Cancel — keep the footer one,
drop the header affordance. Ship-checklist note, not a blocker: the
mode-switcher tabs render unconditionally, so a single-record session entered
from GradeScatter exposes name/email/address/phone edits GradeScatter never
touched; reviewed, single-field, per-record — acceptable.

### 3.9 Population, exclusions, and the Emergency Alerts caption

**Widen at the source.** `transformPerson` (`pco.ts:253-265`) returns a
`Student` with `birthdate: null`, `calculatedGrade: null`, `delta: null` instead
of bailing to `null` at `:257-259`; each consumer filters explicitly.
GradeScatter adds `birthdate !== null` alongside its existing `pcoGrade !== null`
(`App.tsx:789`); the grader skips them; `duplicates.ts` (which reads no date
field) gains the adult roster for free. `App.tsx:236-238`'s null filter comes out.

**Two captions, not one.** Data Health: *"N have no birthdate on file and are
excluded from grade checks; M shown here have no grade set."* **Emergency
Alerts** (`App.tsx:946` region, `EmergencyAlerts.tsx:15-17`) gets its own
sentence: *"N people are not shown because they have no birthdate on file,
regardless of whether Locus has a phone number for them."* Until the transform
fix lands, that screen silently omits a large fraction of grandparents, pickup
contacts and kiosk-entered adult profiles from the who-do-we-call list. Highest
consequence line in the area.

**Restored items, all three verified:** GradeScatter roving-tabindex +
skip-to-next-anomaly (`GradeScatter.tsx:110,127`); Dashboard "— no check-in
data" instead of a bare `0` (`Dashboard.tsx:62-63,95`) plus a minimum-N gate on
the Health Score card (`:78-83`; `total === 0` currently renders "Critical" as a
new tenant's first impression); Duplicate CSV `Matched Value` column
(`DuplicatesReport.tsx:21-31`).

### 3.10 Duplicate Detective — sibling warning, unchanged

In `DuplicatesReport.tsx:101-113`, when both records in a group have
`isChild: true` and matched on the address-fuzzy path: *"These may be siblings or
twins. Merging combines check-in history, allergy notes and background-check
status irreversibly. Verify before merging."*

---

## 4. Unresolved disagreement — for round 5

Q-A, Q-B, Q-C, Q-D, Q-E, Q-F, Q-G are all **closed**. One new question and one
review item replace them; both are narrow.

**Q-H (new, and the only remaining risk of consequence). Does the token Locus
actually holds have PCO People permission to create a note category and a
note?** Q-E settled the *API*: the endpoints exist and the shape is knowable
from documentation. It cannot settle the *grant*: note creation depends on a
per-user PCO People permission that is independent of the API scope, and
`README.md:41-51` grants `read:*,passthrough,write` without ever naming
`/notes` or `/note_categories`, so nothing in this repo establishes that
pcomirror's passthrough reaches them. This is answerable only by a live probe
against a real tenant, not by more reading. §5.4 specifies the probe and a
degradation rule; **round 5 should attack the degradation rule, which is my
judgement call and not a fact**: archive blocks when notes are unavailable,
promotion proceeds with a warning. If a critic thinks promotion should block
too — or that archive should be allowed to proceed on ledger+CSV alone — that
is the argument to have.

**Q-I (review item, not a disagreement). Does §3.5's scatter-replacement swap
lose context a leader needs during promotion selection?** UXR's fix is adopted
in full and Q-F is closed on it; this is only a request that round 5 read the
now-specified layout once. The permitted remedy if it fails is a summary line
above the list. Minting a new nav destination, or rendering both regions
concurrently, is out of bounds.

---

## 5. Standing enabling work (preconditions, not new ideas)

**5.1 The durable write ledger — unchanged from v3.** One append-only log of
every PCO write Locus attempts, persisted in `storage.ts`, exportable as CSV,
with a session counter in the header. Entry shape
`{personId, name, field, before, after, at, source, dryRun}` **plus a structured
`context`** carrying `ghostReason`, `lastCheckInAt`, `createdAt`, `configUsed`
for archives and the selection basis + `configUsed` for promotions. Local
storage is the searchable index, **not** the record of record — a reissued
volunteer machine or a browser data clear is a normal-cycle event. The ledger
also backs §3.2's preview, which renders from the `dryRun`-pass entries; one
primitive serves the audit trail, the archive record, the promotion record and
the dry run at once.
**Replaces:** `App.tsx:331-335`'s `alert()`, `AutomationsReport.tsx:85`'s
`alert()`, and the ghost-specific CSV.

**5.2 The "confirmed correct" flag — blocking precondition for §3.3.** A
`Set<string>` of `${studentId}:${anomalyType}` in `storage.ts`, honoured by the
`anomalies` filter (`App.tsx:272`) and by §3.3's population gate *before render*,
surfaced as "Mark correct" beside Skip and as the replacement for promotion's
"Dismiss". PCO models grade overrides per person and Locus reads only the
resulting `grade` field, so without this Locus mistakes PCO's correct answer for
an error — forever, and now with a bulk write attached. **Ships with §3.3 or
§3.3 does not ship** (children's veto).
**Replaces:** the current meaning of "Skip" (`ReviewMode.tsx:496`), which means
"show me this again forever" and is why the queue never empties.

**5.3 Reconcile Locus's cutoff against PCO's — no longer conditional (Q-B).**
Delete the "if the org setting is readable, read it and delete the control"
branch as dead text. The permanent answer: the cutoff control **stays** in
`ConfigModal`, presented as *"Grade cutoff — this must match your PCO
organisation's grade settings. Locus cannot read that setting from the API. If
they disagree, every student will appear one grade off."* The hardcoded June 1
in `automations.ts:73-76` is still deleted (§3.3's one clock).
**Replaces:** the unlabelled standalone Grade Cutoff fields, and the June 1
constant.

**5.4 The PCO note write — new sub-spec, answering Q-E's real scope.**
Everything below is missing from `pco.ts` today (zero references to `/notes` or
`/note_categories`); `writeContact` (`pco.ts:366-387`) is the shape to copy for
the read-or-create pattern, but the category bootstrap has no existing analogue.

1. **Category bootstrap, once.** `GET /people/v2/note_categories`. If a
   category named `Locus Data Hygiene` exists, use its id. If not, `POST` it
   (`name: 'Locus Data Hygiene'`, `locked: false`). Persist the resulting id in
   `storage.ts` as `noteCategoryId` so it is resolved once per install, not per
   write.
2. **Sharing is stated, not assumed.** A note in a category nobody else can see
   is not a record. The Settings screen and §3.2's confirm dialog both state:
   *"Archive and promotion reasons are written to the PCO note category 'Locus
   Data Hygiene'. Only staff this category is shared with can see them — share
   it in Planning Center under People → Settings → Note Categories."* Locus does
   not attempt to manage `NoteCategoryShare` itself.
3. **Write order: note first, then the field write.** If the note POST succeeds
   and the PATCH then fails, the tenant is left with a harmless, self-describing
   orphan note ("Locus intended to archive X for reason Y") and the ledger
   records the failure — recoverable. The reverse order leaves an archived
   person with no reason recorded anywhere durable, which is the exact failure
   the admin's durability ruling exists to prevent. Per-record, not per-batch:
   one record's note failure aborts that record before any mutation and does not
   abort the batch.
4. **Batch reporting is per-record and honest.** The post-write summary reports
   three counts — written, skipped (note failed, record untouched), failed
   (note written, PATCH failed) — and lists the names in the latter two. It
   never reports a batch as successful because most of it succeeded.
5. **Preflight probe + degradation rule (this is Q-H).** On opening a batch
   confirm, run the category resolution above once. If it 403s or the note POST
   is refused:
   - **Archive is blocked.** The confirm button does not go live; the dialog
     says why. Archival is effectively irreversible from the volunteer's seat
     and disproportionately touches minors' records; shipping it with only a
     local ledger is shipping the half the admin ruled insufficient.
   - **Promotion proceeds, with a prominent in-dialog warning** naming that no
     PCO-side record will exist. A grade PATCH is field-level, undoable through
     `commandManagerRef`, and fully reconstructable from the §5.1 ledger and
     CSV. Blocking the one automation with a same-week in-person consequence on
     an unrelated permission gap costs more than it protects.
   Round 5 attacks this split, not the plumbing.

Nickname-aware duplicate matching (v1 §5.2) is carried forward unattacked and
unchanged.

---

## 6. Final ordered work list for Area A

Ordered by value-per-effort. Items 1–4 are independent and can land in any
order; 5 onward have the stated dependencies.

| # | Work | Depends on |
|---|------|-----------|
| 1 | §3.9 `transformPerson` widening + both captions (Emergency Alerts first) | — |
| 2 | §3.7 all cuts + `fixName` repair + `fixEmail` gate | — |
| 3 | §3.8 `singleRecordMode`, then delete `SmartFixModal.*` | 2 (Speed Run gone) |
| 4 | §3.4 undo `Map` + relabels + real Ctrl+Z/Ctrl+Y binding | — |
| 5 | §5.1 the durable ledger with structured `context` | — |
| 6 | §5.4 note-write module: category bootstrap, sharing copy, note-first order, preflight probe (**answers Q-H in the doing**) | 5 |
| 7 | §3.2 delete Sandbox toggle; build `<BatchWriteConfirm>` incl. the household line and the child section | 5, 6 |
| 8 | §3.1 Ghost Protocol — all carried fixes, gamification strip, `mock-api` `created_at` | 5, 6, 7 |
| 9 | §3.6 Family Audit dissolution + repair card + the `isMinor`/claim-read rule | — (do not "tidy" `family.ts` onto `isMinor`) |
| 10 | §5.2 confirmed-correct flag + "Mark correct" | 5 |
| 11 | §5.3 cutoff reconciliation copy; delete June 1 constant | — |
| 12 | §3.3 grade promotion build + §3.5 header-mode layout and retitle | 7, 10, 11 (**10 is a veto, not a preference**) |
| 13 | §3.10 sibling warning; §3.9 restored items (tabindex, Dashboard zero-vs-no-data, CSV column) | — |
