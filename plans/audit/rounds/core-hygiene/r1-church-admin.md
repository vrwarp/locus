# Area A — core-hygiene — Round 1 — church-admin

Scope note before anything else: everything in this area operates on
`students.filter(s => s.pcoGrade !== null)` (`src/App.tsx:793`) and the whole
grader/anomaly stack is built on the PCO People `grade` field (`src/utils/pco.ts:231-263`).
This is not a general congregation data-hygiene tool. It is a **kids/students
grade-and-DOB reconciliation tool** wearing a "Data Health" label that implies
much more. Scope that down in the product description or explain why it's
fine to imply it covers the whole database when it covers one field on one
subpopulation.

---

## 1. Dashboard (`src/components/Dashboard.tsx`)

**Verdict:** SIMPLIFY

**Would we actually open this?** Yes — a landing screen is fine and Sarah
would glance at it Monday morning. But it fires four independent PCO fetches
and three derived-risk calculations (`calculateHealthStats`,
`calculateBurnoutRisk`, `calculateRecruitmentCandidates`,
`calculateMissingVolunteers`) just to render four tiles, none of which are
actionable from the dashboard itself beyond "click through to the real
report." It's a router with extra latency.

**PCO overlap:** PCO's own People/Check-Ins dashboards already show
attendance and record counts. The novel part here is the anomaly count and
the burnout/recruitment teasers, which are Area C/A features restated.

**Governance / privacy risk:** None directly — read-only. But it surfaces
"Burnout Risk" and "Growth Opportunity" head counts as bare numbers with no
caveat about methodology, on the very first screen every user sees. Staff
who never open the Burnout report will still repeat "we have 6 volunteers at
burnout risk" in a staff meeting based on a number they can't explain. That's
a credibility problem borrowed from Area C and paid for on this screen.

**What would make it worth the licence fee:** Cut the derived-risk tiles down
to the two that are core-hygiene's own job (Health Score, Anomalies), and
make each tile's number visibly a link to "how this was calculated," not just
a click-through to another dashboard. Kill the tiles that duplicate Area C
reports here — one home for each number.

---

## 2. Data Health / "Diagonal of Truth" scatter + Load More (`src/components/GradeScatter.tsx`, `src/utils/grader.ts`)

**Verdict:** MERGE (into a plain flagged-record list; the chart is a demo, not a workflow)

**Would we actually open this?** Once, out of curiosity. After that, no
volunteer coordinator is going to squint at a fixed 800×600px (non-responsive,
`GradeScatter.tsx:139-140`) scatter plot with a "Diagonal of Truth" reference
line to find which kids have the wrong grade. They will want a sortable list:
name, current grade, expected grade, delta, fix button. The chart is the fun
version of a `WHERE grade != expected` query — visually impressive,
operationally slower than a table for the actual task ("find and fix 40
records").

**PCO overlap:** This is the important one. **Planning Center People already
has native annual Grade Promotion**: an org-level setting with a
month/day cutoff (People → Household Settings) that auto-calculates each
child's grade from date of birth and bulk-promotes every record once a year,
for free, with no third-party write access required. `ConfigModal.tsx`'s
"Grade Cutoff Date" (month + day, defaulting to Sept 1) is the same
configuration surface PCO already ships. Locus has rebuilt PCO's own grade
engine (`src/utils/grader.ts`) as a third-party layer that then writes back
into the same field PCO would have kept correct automatically. If the church
already uses PCO's grade promotion, this entire subsystem's anomaly count
should be near zero except for kids added/edited off-cycle — a much smaller
and less exciting feature than the UI implies.

**Governance / privacy risk:** None from the chart itself (read-only,
client-side). Real risk is one click away — see #3/#4.

**What would make it worth the licence fee:** Prove, with real counts from a
church that already has PCO grade promotion turned on, that this catches
something PCO's own tool doesn't (mid-year new members, data entered before
promotion ran, manual overrides that drifted). If it can't clear that bar,
this is a rebuild of a free PCO setting with a game skin on it.

---

## 3. Smart Fix Modal (`src/components/SmartFixModal.tsx`)

**Verdict:** KEEP (as the single-record fix path), but tighten the write path

**Would we actually open this?** Yes — Sarah clicking one anomalous kid and
fixing a birthdate typo is a real, common task. Good scope, good UI (slider
+ live delta preview).

**PCO overlap:** None beyond what #2 already covers — this is the correction
UI PCO's grade promotion doesn't give you (it promotes; it doesn't diagnose
*why* a record is wrong).

**Governance / privacy risk:** Real, and understated. `onSave` flows into
`handleSaveStudent` (`src/App.tsx:546`), which optimistically writes to the
local cache immediately and **starts a 5-second timer that PATCHes the real
PCO record automatically** (`src/App.tsx:604-611`) unless the person notices
the toast and clicks Undo in time. There is no explicit "Save to PCO" click —
the confirmation *is* the fix button, and the actual write happens silently
five seconds later. A volunteer who fixes a record, then gets pulled into a
hallway conversation, has just live-edited a child's birthdate in the church's
system of record with nobody watching. Sandbox Mode exists but **defaults to
off** (`ConfigModal.tsx:21`, `storage.ts`) — a fresh install writes to
production PCO from the first click.

**What would make it worth the licence fee:** Make the undo window a real
confirm step for anything touching birthdate (a field with real-world
consequences — background checks, grade placement, permission to be alone
with certain staff), not a silent auto-commit-after-5-seconds. Ship with
Sandbox Mode on by default for first-run.

---

## 4. Review Mode + Speed Run + Zen Mode (`src/components/ReviewMode.tsx`, `src/utils/audio.ts`)

**Verdict:** DEMOTE (Review Mode) / CUT (Speed Run as designed)

**Would we actually open this?** Review Mode, occasionally, for working
through a backlog. Speed Run — a 60-second countdown timer that scores you on
how many records you fix — is the actual risk here, not a workflow.

**PCO overlap:** None new beyond #2/#3.

**Governance / privacy risk:** This is the sharpest finding in the whole
area. **"Smart Fix All"** (`ReviewMode.tsx:497-501`, wired to
`handleFixAll` at `ReviewMode.tsx:123-173`) auto-applies `fixName`,
`fixEmail`, `fixAddress`, `fixPhone` to *every* flagged record in the current
queue **with no per-record preview**, and under Speed Run it is one button
press during a countdown, explicitly designed to be pressed fast. `fixName`
naively title-cases (`hygiene.ts:18-26`: lowercase everything, then
capitalize each space-separated word) — it will silently corrupt real PCO
records for `McDonald` → `Mcdonald`, `O'Brien` → `O'brien`,
`DeShawn` → `Deshawn`, `Smith-Jones` → `Smith-jones` (no hyphen split), and
any name with a diacritic or a legitimate lowercase-first family name. Under
a 60-second timer, with sandbox mode off by default, a volunteer can mass
write incorrect legal names into the church's PCO in under a minute, with the
only recovery path being in-app undo/redo (session-scoped, gone after
reload). Turning data-hygiene into a speed-scored minigame is exactly the
kind of "generates work instead of removing it" pattern this role is
skeptical of — worse, it generates *bad writes*, not just busywork.

**What would make it worth the licence fee:** Remove Speed Run's incentive to
rush bulk writes, or at minimum force Smart Fix All to show a diff list the
user must accept before any PATCH fires, every time — no bulk auto-apply
under time pressure, ever, on records that feed background-check and family
systems.

---

## 5. Duplicate Detective (`src/components/DuplicatesReport.tsx`, `src/utils/duplicates.ts`)

**Verdict:** KEEP

**Would we actually open this?** Yes, monthly-ish. It's read-only — it
detects (name+email, name+phone, same-address+fuzzy-name) and gives
"View in PCO" links plus static merge instructions. It does not attempt to
merge anything itself.

**PCO overlap:** PCO People has a native "Possible Duplicates" report under
People → Lists/Admin that runs similar name/email matching server-side across
the *entire* database (not just the loaded/paginated `students` subset this
tool sees, which is bounded by `data-health`'s grade filter — meaning this
duplicate detector **only ever sees people with a grade set**, i.e. kids. It
will never surface a duplicate adult/parent record). If PCO's native
duplicate finder already covers the full org, this is a strictly narrower
reimplementation. Worth checking directly with PCO before building further on
it.

**Governance / privacy risk:** None — no writes, and it correctly punts the
actual merge to PCO's own tool (the safe design choice, since Locus has no
merge-integrity guarantees for giving/check-in history).

**What would make it worth the licence fee:** Confirm and document exactly
what it finds that PCO's native duplicate report misses. If the answer is
"nothing, because it's grade-scoped," fold this into the PCO workflow
recommendation and stop maintaining a parallel matcher.

---

## 6. Ghost Protocol (`src/components/GhostModal.tsx`, `src/utils/ghost.ts`)

**Verdict:** CUT the "Archive All" button as built; SIMPLIFY the rest

**Would we actually open this?** Sarah would look at the list. She would
never click "Archive All" the way it's built today.

**PCO overlap:** PCO Lists can already build "hasn't checked in in N months"
segments, and PCO's own inactive/archive workflow exists natively. The
detection logic here (`ghost.ts:12-27`) is also visibly half-broken: the
comment admits the Groups-membership "rescue" signal can never fire because
this church doesn't sync PCO Groups — so **anyone who has never checked in,
for any reason (new baby dedicated but not yet in Check-Ins, a teenager who
ages out of the kids check-in system, a data-entry gap), is flagged a ghost
with zero exceptions.**

**Governance / privacy risk:** This is the worst write-safety finding in the
area. `onArchive` → `handleArchiveGhosts` (`App.tsx:300-336`) loops over
**every student the modal was given** and calls
`archivePerson → updatePerson(id, {status:'inactive'})` — a real PCO People
status change — **with no `window.confirm`, no per-record selection
checkbox, no cap on batch size, and no wiring into the app's own
undo/redo command stack** (it bypasses `commandManagerRef` entirely, unlike
every other write path in this area). One click on "Archive All" after
opening the modal silently marks an unbounded number of real children's
records inactive in production PCO, and the only way back is manually
re-activating each one in PCO itself, one at a time, because Locus's own undo
doesn't cover this action. This is precisely the "volunteer archives a real
family by mistake" scenario the role exists to catch, and there is currently
nothing between "modal open" and "records archived" except a second button
labeled `btn-danger`.

**What would make it worth the licence fee:** Per-record checkboxes,
defaulted unchecked. A typed confirmation ("archive 14 people") for anything
over, say, 5 records. Wire it into the same undo/redo command stack as every
other write. Fix the dead Groups-rescue branch or remove the comment's false
promise. Until then this ships as a footgun, not a feature.

---

## 7. Family Audit (`src/components/FamilyModal.tsx`, `src/utils/family.ts`)

**Verdict:** SIMPLIFY

**Would we actually open this?** Occasionally, to catch households where a
kid's DOB implies they're older than their parent — genuinely useful, rare
data-entry catch.

**PCO overlap:** Partial. PCO doesn't have a built-in "parent younger than
child" check, so this has real, narrow value. Split-household detection
(same address/email/phone across two household IDs) is closer to something a
Duplicate/People List in PCO could approximate, but not natively flagged the
same way.

**Governance / privacy risk:** Real but narrower than Ghost Protocol. The
"Swap Roles" button (`FamilyModal.tsx:33-44` → `handleFamilySwap`,
`App.tsx:420-462`) flips a real PCO `isChild` (child status) flag on two
people in one click, no confirmation dialog — it does go through
`BatchUpdateCommand` so it is at least undo/redo-covered, unlike Ghost
Protocol. Still: child/adult status affects check-in eligibility, background
check requirements, and possibly what areas of the building someone can be
in unsupervised. One click, no "are you sure," on a safety-adjacent field.

**What would make it worth the licence fee:** Keep the detection, add a
one-line confirm on Swap Roles given what the flag controls
downstream in Check-Ins/safety.

---

## 8. Golden Record (`src/components/GoldenRecordModal.tsx`)

**Verdict:** CUT (from this area)

**Would we actually open this?** It opens itself, uninvited, at 10,000 fixes.

**PCO overlap:** None — it's not a PCO feature at all.

**Governance / privacy risk:** None — it's a confetti modal
(`GoldenRecordModal.tsx:15`) congratulating a "Data Deity" on 10,000 fixes.
Naming it **"Golden Record"** is actively misleading in this domain: in
every data-quality/MDM tool an admin would have encountered, "golden record"
means the merged master record produced by de-duplication. This is a gamified
badge, not a merged record — it does not appear in the inventory as
implementing that function anywhere else in Area A either. It is Area B
(gamification) achievement content that was placed in the core-hygiene
inventory. Move it there; keep the name away from an actual data-governance
term or rename it.

**What would make it worth the licence fee:** N/A for this area — it's not a
hygiene feature. If kept at all, it belongs entirely to Area B's critique.

---

## 9. Undo / Redo + Undo toast (`src/components/UndoRedoControls.tsx`, `src/components/UndoToast.tsx`)

**Verdict:** KEEP the command-stack undo/redo; FIX the toast's threat model

**Would we actually open this?** Used constantly, passively — it's a safety
net, which is exactly right for a tool that writes to production member
records. Good instinct to build it.

**PCO overlap:** None — PCO has no equivalent "undo my last edit across
tools" feature; this is Locus's own responsibility to own well.

**Governance / privacy risk:** Two gaps. First, coverage is inconsistent:
single-record saves get the 5-second pending-then-commit pattern (#3), batch
saves and family swaps go through `BatchUpdateCommand` on the same
undo/redo stack, but **Ghost Protocol's archive path uses neither** (#6) —
so the one feature most in need of an undo path has none. Second, the
command-stack undo/redo is in-memory/session state
(`commandManagerRef`) — refresh the tab after a bad batch fix and the undo
history is gone, even though the PCO write already landed.

**What would make it worth the licence fee:** Make every write path in this
area go through the same command stack, no exceptions (Ghost Protocol
especially), and consider a server-side or localStorage-backed undo log so a
refresh doesn't strand a mistake in production.

---

## 10. Settings / Config (`src/components/ConfigModal.tsx`)

**Verdict:** SIMPLIFY

**Would we actually open this?** Once, at setup, and never again except to
flip Sandbox Mode when testing. It's one flat settings modal doing double
duty as ministry configuration (grade cutoff, campus) and toy configuration
(Party Mode confetti theme, Spotify integration, Zen Mode ambient audio
theme, colorblind mode). Six of the eleven toggles here are gamification/UX
flavor, not hygiene config — they dilute the one setting that actually
matters for governance.

**PCO overlap:** Grade cutoff date duplicates PCO's own grade-promotion
cutoff setting (see #2) — two places to keep this in sync, and no
indication Locus reads PCO's actual configured cutoff rather than
maintaining its own independent copy that can drift from it.

**Governance / privacy risk:** The one setting that matters —
**Sandbox Mode, "changes will not be saved to PCO"** — is buried as the 5th
checkbox among confetti and Spotify options, and **defaults to off**
(`ConfigModal.tsx:21`). This is the single highest-leverage governance
control in the entire product and it reads like every other cosmetic toggle
on the page.

**What would make it worth the licence fee:** Split ministry config from fun
config into two visibly different sections. Default Sandbox Mode **on**, or
at minimum give it its own prominent placement with a warning, not checkbox
#5 next to "Enable confetti on every click."

---

## 11. Address / phone / email hygiene utilities (`src/utils/hygiene.ts`, `src/utils/zipCodes.ts`, `src/utils/areaCodes.ts`)

**Verdict:** SIMPLIFY

**Would we actually open this?** Never directly — it's library code invoked
by #3/#4/#45 (Small Group Sorter). Judged on what it produces.

**PCO overlap:** None specific — PCO doesn't auto-normalize address/phone
formatting.

**Governance / privacy risk:** Two concrete issues. (a) `fixEmail`
(`hygiene.ts:49-107`) auto-"corrects" email domains via Levenshtein distance
against a hardcoded list of consumer providers (gmail.com, yahoo.com, etc.)
— a real church-domain email like a small nonprofit's custom domain sitting
distance-1 from a common provider could get silently rewritten to the wrong
domain, and this fix is one of the things Smart Fix All (#4) applies in bulk
with no preview. (b) `enrichZipCodeAsync` (`zipCodes.ts:50-70`) calls a
third-party public API (`api.zippopotam.us`) directly from the browser,
sending a household's ZIP code to an external, uncontracted service during
ordinary address-fix workflows, with no mention of this in any privacy
notice reviewed. Individually low-sensitivity (a ZIP code), but it is real
congregation data leaving the church's systems to a third party the church
never agreed to share with, as a side effect of typing a ZIP into a form.

**What would make it worth the licence fee:** Gate the email fuzzy-domain
correction so it never auto-applies in a bulk path (require a human look at
the specific diff, always). Either drop the external ZIP lookup or disclose
it explicitly in Settings/a data-processing note, and prefer the offline
`ZIP_PREFIX_MAP` (already present, `zipCodes.ts:9-42`) as the only source
rather than defaulting to a live third-party call.

---

## Summary table

| # | Feature | Verdict |
|---|---|---|
| 1 | Dashboard | SIMPLIFY |
| 2 | Data Health scatter / grader | MERGE |
| 3 | Smart Fix Modal | KEEP (tighten write path) |
| 4 | Review Mode + Speed Run + Zen | DEMOTE / CUT (Speed Run) |
| 5 | Duplicate Detective | KEEP |
| 6 | Ghost Protocol | CUT (Archive All as built) |
| 7 | Family Audit | SIMPLIFY |
| 8 | Golden Record | CUT (mislabeled Area B content) |
| 9 | Undo / Redo + toast | KEEP (fix coverage gaps) |
| 10 | Settings / Config | SIMPLIFY |
| 11 | Hygiene utilities | SIMPLIFY |
