# Area A — core-hygiene: Children's Ministry critique (Round 1)

Reviewer: children's ministry director (birth–5th grade), Planning Center Check-Ins
user. Judged on the safety axis first, insight second, per my standing brief.

General finding that touches almost every feature below: `transformPerson` in
`src/utils/pco.ts:233-235` silently returns `null` — and the record disappears
from the entire app — for any person with no birthdate or an unparseable one.
Nothing counts or surfaces how many people were dropped. Missing/placeholder
birthdates are exactly the messiest, highest-risk records in a real PCO
database (per-persona: guessed DOBs, 1/1 placeholders, new registrations
entered by an untrained volunteer). Locus's own Health Score
(`src/utils/analytics.ts:10-42`) is computed only over the survivors, so the
score is inflated by silently excluding the worst records from its own
numerator and denominator. This is a data-integrity blind spot baked into the
ingestion layer that undermines features #1, #2, #4, #6, #7 simultaneously.

---

## 1. Dashboard (`src/components/Dashboard.tsx`)

**Verdict:** KEEP (with the caveat below)

**Safety impact:** None directly — read-only aggregation view. Indirectly
promotes the two most dangerous actions in the app ("Manage Ghosts",
"Family Audit" quick-action buttons, `Dashboard.tsx:115-120`) as one-tap
entry points from the landing screen.

**Sunday-morning cost:** None; this is a desk-office tool, not check-in-desk.

**Household / guardian correctness:** N/A directly, but "Active Population:
{activeStudents} students" (`Dashboard.tsx:130`) is computed from
`students.filter(s => !isGhost(s)).length` where `students` already excludes
everyone with a missing birthdate (see general finding). The number presented
as ground truth is silently short.

**Minor-data flag:** None new.

**What would make this worth attention:** Surface the dropped-record count
("N people excluded — missing/invalid birthdate") next to the Health Score so
the director knows the score is partial, not comprehensive.

---

## 2. Data Health — Diagonal of Truth scatter, Load More (`src/components/GradeScatter.tsx`, `src/utils/grader.ts`)

**Verdict:** SIMPLIFY

**Safety impact:** None directly.

**Sunday-morning cost:** None (admin tool).

**Household / guardian correctness:** N/A.

**Age/birthdate handling (this is the point of the feature):**
`calculateExpectedGrade` (`src/utils/grader.ts:12-33`) takes a `Date` and does
pure arithmetic — there is no detection anywhere in the grading path for a
placeholder DOB (1/1/1900, 1/1 of the current year, a DOB that makes someone
150 or -5 years old). Per my domain note, "1/1" placeholder birthdates are one
of the most common real-world data errors in ChMS records, entered by a
grandparent filling in for a parent under time pressure. Today, such a record
either (a) gets dropped entirely upstream by `transformPerson`'s
`!birthdate` / `isNaN` check (`pco.ts:233-241`) if truly malformed, or (b) if
merely implausible (a valid, parseable date that's simply wrong — 1/1/1900),
sails through as a normal-looking data point on the scatter with an enormous
age, silently distorting the chart's auto-domain X axis (`domain={[0,
'auto']}`, `GradeScatter.tsx:148`) for every other point on the screen. There
is no "implausible birthdate" flag distinct from "grade delta" anomaly.

Also: the scatter's data source at the call site
(`src/App.tsx:793`, `data={students.filter(s => s.pcoGrade !== null)}`)
further drops anyone with no PCO grade set at all — a second silent exclusion
layered on top of the birthdate exclusion in `transformPerson`. Between the
two filters, the population actually visualized as "the data health of your
kids" can be meaningfully smaller than the real roster, with no on-screen
accounting of the gap.

**Minor-data flag:** None new beyond the general finding.

**What would make this worth a volunteer's attention:** A "sanity range"
check (e.g. DOB implies age 0–19 for a children's ministry context, else flag
as "implausible, not just off-grade") and an explicit count of excluded
records on the page itself, not just in a dev console.

---

## 3. Smart Fix Modal (`src/components/SmartFixModal.tsx`)

**Verdict:** KEEP

**Safety impact:** Low. Single-record, requires a human to open the modal and
click Fix — this is the right cadence for a safety-adjacent field. One gap:
the birthdate `<input type="date">` (`SmartFixModal.tsx:153-159`) accepts any
date with no plausibility bound — a fat-fingered future date or an accidental
1899 is accepted and written with the same one click as a correct fix.

**Sunday-morning cost:** None (admin tool, not desk-facing).

**Household / guardian correctness:** N/A — single-student, no household
context is shown or affected.

**Minor-data flag:** None.

**What would make this worth a volunteer's attention:** Clamp/warn on
implausible birthdates before enabling the "Fix Birthdate to..." button.

---

## 4. Review Mode + Speed Run + Zen Mode (`src/components/ReviewMode.tsx`, `src/utils/audio.ts`)

**Verdict:** CUT Speed Run for child records / SIMPLIFY the rest

**Safety impact:** This is my biggest concern in the whole area. Two designs
compound each other:

1. **Speed Run** puts a 60-second countdown timer and a score counter on top
   of exactly the workflow that edits birthdate, grade, name, email, address
   and phone for real children (`ReviewMode.tsx:60-76`, `:296-299`). My
   standing note #3 is that bad data enters the system because the
   least-trained people enter it fast, under pressure, with no time to verify.
   Speed Run recreates that exact failure mode deliberately, as a *feature*,
   for the people who are supposed to be *fixing* the data.
2. **"Smart Fix All"** (`ReviewMode.tsx:123-173`, wired to the button at
   `:497-501`) auto-applies `fixName`, `fixEmail`, `fixAddress`, `fixPhone` to
   every flagged record in the current batch with a single click and zero
   per-record review. Combined with the `fixName` bug below (item #11), this
   is a mechanism for silently bulk-writing incorrect data to real children's
   PCO profiles in one tap.

Zen Mode (ambient audio, no timer, hidden score) is the opposite of this
problem and is fine — it's the calm version of the same review flow. The
existence of both, gated by a config toggle, tells me the product team knows
speed pressure is bad for this task (that's *why* Zen Mode exists) but ships
the harmful version anyway, unweighted, right next to it.

**Sunday-morning cost:** None directly (this is not desk software; it's a
back-office review tool), but the *quality* of the records it produces is
what shows up on a tablet on Sunday — a mis-fixed birthdate here is what
misassigns a kid to the wrong classroom or ratio band next week.

**Household / guardian correctness:** N/A directly, but note the review
sequence (`students[currentIndex]`) has no household grouping — siblings are
reviewed as unrelated individual cards, so a volunteer fixing one child's
address has no visibility that three siblings at the same household should
probably move together.

**Minor-data flag:** None new.

**What would make this worth a volunteer's attention:** Remove or heavily gate
Speed Run for records where `isChild` is true; require Smart Fix All to show
a diff/confirm step per record (or at minimum a batch preview) before writing.

---

## 5. Duplicate Detective (`src/components/DuplicatesReport.tsx`, `src/utils/duplicates.ts`)

**Verdict:** SIMPLIFY

**Safety impact:** Medium, indirect. The address+fuzzy-name matcher
(`duplicates.ts:97-168`) groups people at the same address and flags them as
a duplicate group when name edit-distance is small — including a proportional
first-name check meant to avoid flagging siblings with short, dissimilar
names ("Ava" vs "Mia", per the code comment at `:136`). That guard does not
cover the common case of two children with genuinely similar names at the
same address (twins or close siblings named e.g. "Kayla"/"Kayleigh",
"Jayden"/"Jaylen"): same address, edit distance within the ≤2 threshold, and
the tool has **no `isChild` awareness anywhere** in this file — it never
distinguishes "this looks like one child entered twice" from "these are two
different children." It also never flags a parent+child pair at the same
address with a shared or similar last name as *not* being the kind of
duplicate that should be merged.

Mitigating factor: the feature itself does not write anything — it only opens
a "Merge Instructions" panel (`DuplicatesReport.tsx:101-113`) that sends a
volunteer into PCO's own merge UI to do it by hand. That is the right call
architecturally. But the instructions contain **no warning** ("if these look
like siblings, do not merge them") even though the algorithm that produced the
suggestion is specifically vulnerable to sibling false positives. Merging two
different children's PCO profiles would combine their check-in history,
allergy notes and guardian records into one — an unrecoverable, real error
that this feature can point a volunteer straight at.

**Sunday-morning cost:** None (admin tool).

**Household / guardian correctness:** No concept of household/guardian
relationship is used to *rule out* a false match; household co-membership is
actually one of the *inputs* that produces false positives here (siblings by
definition share an address).

**Minor-data flag:** None new.

**What would make this worth a volunteer's attention:** Add an explicit
sibling-safety warning to the merge instructions whenever both records have
`isChild: true`, and consider suppressing or downranking same-address fuzzy
matches between two child records specifically.

---

## 6. Ghost Protocol (`src/components/GhostModal.tsx`, `src/utils/ghost.ts`)

**Verdict:** CUT the one-click batch archive; rework the criteria

**Safety impact:** This is the highest-risk feature in the area, for four
independent reasons:

1. **New records are ghosts on day one.** `isGhost` (`ghost.ts:12-27`) returns
   `true` immediately if `lastCheckInAt` is empty — *before* the 24-month
   threshold is even evaluated. A newborn dedicated last week, or a new
   family's kids entered into PCO People ahead of their first Sunday, have no
   check-in history and are flagged for archival on the very first data-health
   pass. My standing note #8 is that new-baby/new-family moments are the
   highest-value ones in the whole system; this feature actively targets them
   for removal.
2. **The modal's own description is wrong.** It tells the volunteer the
   criteria are "Inactive > 24m AND No Groups" (`GhostModal.tsx:31-33`). The
   "No Groups" clause is dead: `ghost.ts:22-25` documents that it read from
   PCO Groups, which this church doesn't use, so the group count is always
   zero and the clause can never disqualify anyone. The UI presents a second
   safeguard to the volunteer that structurally does nothing, and never
   mentions the "never checked in = instant ghost" override at all.
3. **"Archive All" acts on more than the volunteer can see.** The modal
   previews only the first 10 names (`GhostModal.tsx:40`, `students.slice(0,
   10)`), but the Archive All button (`:69`) is wired to `onArchive(students)`
   — the *full* unsliced list. A volunteer reviewing "10 of 47 ghosts" and
   clicking Archive All sets all 47 real PCO records to `status: 'inactive'`
   (`src/utils/pco.ts:421-423`, called from `src/App.tsx:300-336`), the
   overwhelming majority of which they never actually looked at.
4. **No undo.** `handleArchiveGhosts` (`App.tsx:300-336`) calls
   `archivePerson` in a plain `for` loop and never touches
   `commandManagerRef` — unlike single edits and the Family Audit "Swap
   Roles" action, which are wrapped in `BatchUpdateCommand` and are undoable
   (`App.tsx:439-462`, `src/utils/commands.ts`). A mistakenly archived child
   has no in-app recovery path; someone has to go into PCO directly and
   manually reactivate them, with no record of which ones Locus touched.

All of this is a real, non-sandboxed write by default: `sandboxMode` is
undefined in the initial config (`App.tsx:75`, `{ graderOptions: {} }`), which
is falsy, so `archivePerson(ghost.id, auth, config.sandboxMode)` writes to
production PCO unless a volunteer has separately found and checked "Sandbox
Mode" in Settings (item #10).

**Sunday-morning cost:** Not desk software, but the consequence lands on
Sunday: an archived child may not surface correctly in check-in search next
week, and staff has no idea why without checking PCO's own audit trail.

**Household / guardian correctness:** None used at all — a ghost sweep can
archive one child out of a family of four with no household-level context
("this family is still active, this one kid just hasn't had a first
check-in yet").

**Minor-data flag:** Archiving a child record changes their status in the
church's ChMS with no additional confirmation step commensurate with the
consequence, and no child/adult distinction anywhere in the pipeline.

**What would make this worth a volunteer's attention:** Exclude `isChild:
true` records under some minimum tenure (e.g. record created < 90 days ago)
from ever auto-qualifying as a ghost; make Archive All operate strictly on
what's been reviewed, not the full backing array; wrap the archive action in
the same Command/undo system as every other write in the app; fix or remove
the "No Groups" claim in the UI copy.

---

## 7. Family Audit (`src/components/FamilyModal.tsx`, `src/utils/family.ts`)

**Verdict:** CUT the "Swap Roles" auto-write; SIMPLIFY the detection to
warnings-only, non-actionable

**Safety impact:** High, and this is exactly the failure mode I flagged in my
standing notes ("naive family-audit logic that pairs adults or merges
households on surname will produce output that ranges from useless to
harmful").

- `checkSpouseGap` (`family.ts:16-31`) treats **any** two non-child household
  members as spouses and flags an age gap over 40 years as "Critical." There
  is no relationship-type data behind this — it is purely "two adults, one
  household." A grandparent raising a grandchild alongside an adult aunt, a
  blended family after remarriage, an elderly parent living with an adult
  child who also has custody of grandkids — all of these are legitimate,
  common household shapes that this check calls a critical data error.
- The parent/child loop (`family.ts:130-160`) cross-products **every** child
  against **every** non-child adult in the household and flags "Small age
  gap" for anything under 15 years. A 22-year-old aunt or older sibling who
  is the legal guardian of a niece or younger sibling — again, a real and not
  uncommon structure — gets flagged as a probable data-entry error requiring
  the volunteer's attention, with no way for the tool to tell the difference
  between "typo" and "kinship care."
- **"Swap Roles"** (`FamilyModal.tsx:33-44`, executed by `handleFamilySwap`,
  `App.tsx:420-462`) is a one-click action, no confirmation dialog, that
  flips the real PCO `child` boolean on two live people
  (`isChild: false`/`isChild: true`, `App.tsx:435-436`) whenever the "child"
  record's age exceeds the "parent" record's age. It never verifies the pair
  is actually a parent-child relationship in the first place — the "parent"
  here is just "some non-child adult in the same household," which could be
  an aunt, uncle, older sibling, or family friend. `child` status is not a
  cosmetic label in a children's ministry ChMS; it's the flag that downstream
  check-in/security workflows are likely to key off. A bad auto-swap can
  strip a genuine child of their child-safety classification or, conversely,
  reclassify an adult as a child. This one is at least routed through
  `BatchUpdateCommand` and is undoable — that's the right pattern — but the
  write itself still happens on one click with no confirmation and no
  household-context display beyond the two names being swapped.
- `checkSplitHouseholds` (`family.ts:33-99`) flags any two-or-more households
  sharing an address, email, or phone as a "Potential Split Household"
  warning that "indicate[s] potential data entry errors" (per the modal copy,
  `FamilyModal.tsx:20-22`). This is precisely backwards for the most common
  real reason two household records share contact info: **intentional
  joint-custody records**, which PCO explicitly supports as two separate
  households. Divorced co-parents who share a home phone for the kids, or a
  custodial and non-custodial household that legitimately share a mailing
  address, get told by this tool that their correctly-modeled family
  structure is a mistake to fix. There is no language anywhere in the UI
  acknowledging that a "split household" match might be intentional and
  should not be touched.

**Sunday-morning cost:** None directly (admin tool), but a bad Swap Roles
write could affect classroom/ratio assignment logic that depends on `child`
status the next time that family checks in.

**Household / guardian correctness:** This is the core defect of the
feature. Every rule in `family.ts` assumes a two-parent, one-generation,
biologically-related nuclear household and infers relationship type purely
from an age subtraction. None of the family shapes I listed in my standing
notes (foster placement, grandparent guardianship, blended/remarried,
custody-split households) are modeled or excluded.

**Minor-data flag:** The `child`/adult classification is a
child-protection-relevant field being auto-written based on an age heuristic
with no human confirmation step.

**What would make this worth a volunteer's attention:** Turn this into a
review queue with mandatory per-issue confirmation (no bulk or
single-click write), rephrase "Potential Split Household" as "shared contact
info across households — verify before changing," and drop the >40y /
<15y numeric thresholds as automatic severity labels; present the age gap as
context, not a verdict.

---

## 8. Golden Record (`src/components/GoldenRecordModal.tsx`)

**Verdict:** MERGE (relabel — this belongs in Area B / gamification, not
core-hygiene)

**Safety impact:** None.

**Sunday-morning cost:** None.

**Household / guardian correctness:** N/A.

**Minor-data flag:** None.

Despite the name and despite the audit brief specifically asking me to look
at "Golden Record merging," there is **no merge logic here at all**. The
entire component is a confetti celebration screen for hitting 10,000 total
fixes (`GoldenRecordModal.tsx:17-27`) — pure Area B gamification content,
mislabeled into the core-hygiene inventory by name alone. The only place
actual duplicate-record merging is even discussed in this app is Duplicate
Detective's manual "Merge Instructions" panel (item #5), which explicitly
does not perform the merge itself. If the product's mental model is that
Locus has golden-record/master-data-merge capability, it does not — that
expectation should be corrected in the inventory/vision docs, not just here.

**What would make this worth a volunteer's attention:** Nothing to fix on
the safety axis; recommend re-filing this feature under gamification (#12-18)
so it stops occupying a "core hygiene" slot that implies data functionality
it doesn't have.

---

## 9. Undo / Redo + Undo toast (`src/components/UndoRedoControls.tsx`, `src/components/UndoToast.tsx`, `src/utils/commands.ts`)

**Verdict:** KEEP

**Safety impact:** Positive where it's actually wired in — `CommandManager`
(`commands.ts`) correctly re-invokes `command.undo()` against the live PCO
API, so a reverted edit is a real revert, not just a local UI rollback. The
problem is coverage, not design: the single riskiest write in the area
(Ghost Protocol's batch archive, item #6) is not wrapped in this system at
all, so the safety net exists everywhere except where the largest blast
radius is.

**Sunday-morning cost:** None (admin tool, not desk-facing).

**Household / guardian correctness:** N/A.

**Minor-data flag:** None.

**What would make this worth a volunteer's attention:** Route the Ghost
Protocol archive action through `BatchUpdateCommand` (or an equivalent) so
"Undo" actually covers it.

---

## 10. Settings / Config (`src/components/ConfigModal.tsx`)

**Verdict:** SIMPLIFY

**Safety impact:** Indirect but real. **Sandbox Mode** — "Enable simulation
mode. Changes will not be saved to PCO" (`ConfigModal.tsx:146-158`) — is the
only control in the entire app that prevents every write feature above
(archive, swap, smart-fix) from touching real children's records, and it
defaults to off (`App.tsx:75`, config starts as `{ graderOptions: {} }`, so
`sandboxMode` is `undefined`/falsy). In the UI, this checkbox has exactly the
same visual weight and is interleaved with Party Mode, confetti themes, Zen
Mode ambient audio, and a Spotify integration toggle
(`ConfigModal.tsx:104-233`) — a life-safety-adjacent switch sitting in a list
of entertainment preferences with no visual distinction.

The Grade Cutoff Date control (`:78-102`) is legitimate and useful — school
districts vary their cutoff, and this correctly parameterizes
`calculateExpectedGrade`.

**Sunday-morning cost:** None (this is a back-office settings screen).

**Household / guardian correctness:** N/A.

**Minor-data flag:** None new.

**What would make this worth a volunteer's attention:** Pull Sandbox Mode out
of the general settings list into its own visually distinct "Data Safety"
section, and consider defaulting it **on** for first-time use so a director
opts into live writes deliberately rather than opting out of a test mode they
may not know exists.

---

## 11. Address / phone / email hygiene utilities (`src/utils/hygiene.ts`, `src/utils/zipCodes.ts`, `src/utils/areaCodes.ts`)

**Verdict:** SIMPLIFY

**Safety impact:** Low-to-medium via the bulk path. `fixName`
(`hygiene.ts:18-26`) is a naive `toLowerCase()` + capitalize-first-letter-of-
each-word transform with no handling for apostrophes, "Mc"/"Mac" prefixes, or
multi-part surnames: it turns a correctly-flagged all-caps or all-lowercase
"O'BRIEN" into `"O'brien"` and "MCDONALD" into `"Mcdonald"` — both wrong.
Standing alone this is a formatting bug; combined with Review Mode's "Smart
Fix All" (item #4), which applies `fixName` to every flagged record in a
batch with a single click and zero per-record review, this is a mechanism
for systematically mis-capitalizing real family surnames across a
congregation's children's records in production PCO, with no confirmation
step and disproportionate impact on Irish/Scottish/Gaelic-prefixed and
hyphenated/apostrophe names.

`fixPhone` and `fixAddress` are reasonable, low-risk format normalizers.
`validatePhone` hard-codes US E.164 (`+1` + 10 digits) — fine for a US church,
but will misflag as an "anomaly" any deliberately-entered international
number (a missionary family, a recent immigrant family) as broken formatting
rather than a legitimately different format.

**Minor-data flag:** `enrichZipCodeAsync` (`zipCodes.ts:50-70`) sends the
household's ZIP code to a third-party public API
(`https://api.zippopotam.us/us/{zip}`) live, while a volunteer is editing a
family's address in Review Mode, with no disclosure in the UI that this data
leaves the church's systems. Per my policy floor, "anything sent to a third
party" involving a child's household data needs to be an explicit, disclosed
decision, not a silent side effect of typing a 5-digit ZIP into a text field.
On its own a bare ZIP is low-resolution, but the pattern — an undisclosed
outbound call triggered by editing a minor's record — is the kind of thing
that should not need to be found by an auditor reading source code.

**Sunday-morning cost:** None (admin tool).

**Household / guardian correctness:** N/A.

**What would make this worth a volunteer's attention:** Fix `fixName` to
handle apostrophes/Mc-Mac/multi-word surnames (or stop auto-applying it in
bulk and require per-record confirmation for name changes specifically);
disclose or gate the zippopotam.us call behind an explicit "enrich from
external ZIP database" opt-in.
