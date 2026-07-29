# Area A — core-hygiene — Round 1 (Discovery) — Youth Ministry Critique

Reviewer: youth pastor persona (grades 6-12, multi-campus, ~40 volunteer leaders).
Scope: features #1-#11 per `plans/audit/feature-inventory.md`.

---

## #1 Dashboard — `src/components/Dashboard.tsx`

**Verdict: SIMPLIFY**

Not youth-specific at all — `students` here is every PCO person with a birthdate
(`src/utils/pco.ts:229-289`, `fetchAllPeople` pulls the whole People database, not
a grade-scoped roster), so "Health Score" and "Anomalies Detected" blend adult
member data quality with student data quality. As a youth pastor I have no way
to see *my* population's health separately from the whole church's.

**Does it survive the school year?** N/A directly, but it inherits every grade
bug from `grader.ts` (see #2) through `anomaliesCount` (`Dashboard.tsx:50`).

**False positive/negative cost:** "Active Population: N students are currently
active (non-ghosts)" (`Dashboard.tsx:130`) uses a 24-month ghost threshold (see
#6) — this number will read as stable and reassuring for a solid year after a
graduating class has actually left, hiding real attrition from the dashboard's
headline stat.

**Minor-safety flag:** None directly, but it surfaces avatar thumbnails and
names from `burnoutCandidates`/`recruitmentCandidates` computed over check-in
data with no age gating — see #4/#11 for the underlying leak.

**What a leader needs:** Nothing here is leader-facing; it's a staff console.
Fine as a staff view, but don't market it as "Ministry Intelligence Command
Center" for youth decisions — it's congregation-wide data-quality accounting.

---

## #2 Data Health (Diagonal of Truth scatter) — `src/components/GradeScatter.tsx`, `src/utils/grader.ts`

**Verdict: KEEP core idea, SIMPLIFY the trust model**

`calculateExpectedGrade` (`grader.ts:12-33`) is a pure DOB→grade formula
(`ageAtCutoff - 5`, cutoff configurable via `ConfigModal.tsx`, default Sept 1).
That's the right primitive and I'm glad the cutoff date is configurable per
state/district instead of hardcoded — a real improvement over most tools I've
used.

**Does it survive the school year?** Partially. It recomputes grade from DOB
every render, so it self-corrects at rollover — good. But two structural gaps:

1. **No redshirt/held-back/skip override.** There is no field anywhere to mark
   "this student is intentionally a grade behind/ahead of DOB." Every redshirted
   kindergartner, held-back 9th grader, or academically-advanced 7th grader shows
   a permanent, unresolvable delta. In a program my size (~40 leaders, few hundred
   students) that's easily a dozen kids who will be flagged every single review
   cycle forever. That's the single most credibility-costing gap in this area.
2. **Silent data loss for missing DOB.** `transformPerson` returns `null` for any
   person with no birthdate (`pco.ts:233-235`), and `if (grade !== null &&
   grade !== undefined) ... : 0` (`pco.ts:245`) means a student with a grade but
   no DOB gets `delta = 0` — reads as clean. A student with no DOB at all simply
   never appears in the app: not counted, not flagged, not ghosted. New-student
   intake records (which frequently lack a birthdate on day one, especially from
   a paper visitor card) are invisible to the very tool meant to catch bad intake
   data.

**False positive cost:** every redshirted/held-back/skipped student = a
permanent false "grade is wrong" flag a leader or admin has to re-dismiss every
review cycle, forever, with no way to suppress it. That trains staff to ignore
the anomalies list, which defeats the tool.

**False negative cost:** any student missing a DOB is completely absent from
Health Score, anomaly counts, and Ghost Protocol — the population most likely
to have bad data is the population the tool can't see.

**Minor-safety flag:** None in this file itself.

**What a leader needs:** An "exception" or "confirmed correct" flag per student
that survives re-renders, so a held-back student doesn't reappear as an
anomaly every Wednesday. Doesn't exist.

---

## #3 Smart Fix Modal — `src/components/SmartFixModal.tsx`

**Verdict: SIMPLIFY**

**Does it survive the school year?** The default pre-fill (`targetGrade =
student.calculatedGrade`, `SmartFixModal.tsx:23`) is correct and safe. But
nothing stops a user from dragging the slider to a grade that does *not* match
`calculatedGrade` and clicking "Fix Grade to X" anyway (`SmartFixModal.tsx:174-179`)
— the UI shows a warning delta but does not block the write. Combined with #2's
missing override mechanism, this is the *only* way to record "this kid is
legitimately in a different grade than DOB implies," and it's indistinguishable
in the data model from a mistake — the next data-health pass has no way to know
this was a deliberate override vs. an unresolved anomaly, so it will likely
get "corrected" back by whichever leader runs the next Review Mode pass.

**False positive/negative cost:** A well-meaning volunteer who doesn't know a
kid was held back could "fix" their grade to match the DOB formula, silently
overwriting a parent-confirmed placement in real PCO. No confirmation step
distinguishes "formula suggestion" from "staff-verified correction."

**Minor-safety flag:** None directly — but see #9/#4 for how fast this write
actually lands in production PCO.

**What a leader needs:** A locked/verified state per student so a legitimate
override isn't re-flagged and isn't accidentally re-"fixed" by the next person
through Review Mode.

---

## #4 Review Mode + Speed Run + Zen Mode — `src/components/ReviewMode.tsx`, `src/utils/audio.ts`

**Verdict: CUT Speed Run in its current form; KEEP plain Review Mode**

This is my single biggest concrete finding for the area, so I'm putting the
mechanism here in full.

**The chain:** `App.tsx:546-558` (`handleSaveStudent`) — every fix opens a 5-second
undo grace window before it commits to real PCO (`App.tsx:601-613`). But **the
moment a second fix is made, the previous pending update is force-committed
immediately** (`App.tsx:547-558`, "If there is an existing pending update,
flush it immediately"). Speed Run gives the user 60 seconds and a score counter
and explicitly rewards speed (`ReviewMode.tsx:236-238`, results message "Incredible
speed! 🚀" at ≥15 fixes in 60s — 4 seconds per record). At that pace, every fix
except the very last one in the session is written to production Planning
Center **with zero undo window**, because the next click flushes it. The one
safety feature this app has (#9, Undo) is structurally defeated by the one
feature designed to make fixing go fast (#4). A leader chasing a high score on
a Wednesday night is, by the tool's own design, doing rapid-fire, effectively
unreviewable writes to real student birthdates, grades, and addresses.

**Does it survive the school year?** The grade-fix path inherits every gap
from #2/#3 — Speed Run makes the "click without thinking" problem materially
worse for exactly the redshirt/held-back cases that most need a human pause.

**False positive/negative cost:** A mis-drag of the grade slider during a timed
run silently and permanently changes a real student's real PCO grade, with no
practical undo once the next card loads. Cost: a real kid shows up in the wrong
small-group roster or age-graded event list next Sunday.

**Minor-safety flag:** Gamifying speed over accuracy for minors' identifying
data (name, birthdate, address, phone) is itself a policy problem — this
should never be a race.

**What a leader needs:** Fine as-is for plain Review Mode (no timer). Speed Run
needs either a real per-record undo stack (not a single pending-update ref) or
removal of the timer/score framing entirely.

---

## #5 Duplicate Detective — `src/components/DuplicatesReport.tsx`, `src/utils/duplicates.ts`

**Verdict: SIMPLIFY — this is the nickname problem the product team was warned about**

`detectDuplicates` (`duplicates.ts:38-171`) has two paths:

1. Exact match on `normalizedName + email` or `normalizedName + phone`
   (`duplicates.ts:42-69`) — name must match **character-for-character**.
2. Fuzzy match only within a shared street+zip address, using full-name
   Levenshtein distance ≤2, with a first-name-proportion guard specifically to
   avoid flagging siblings like "Ava"/"Mia" (`duplicates.ts:135-150`).

**False negative — the exact scenario the product team was warned about:** a
parent who registers a student as "Nicholas Smith" once and "Nick Smith" the
next season (a new email address for a new sibling's checked-in guardian, a
transposed digit in the phone) produces two live PCO records for one real kid.
"Nicholas" vs. "Nick" has a full-name Levenshtein distance far above 2, so it
clears neither path. This exact duplicate — the single most common one in a
student database — is invisible to this feature. Nickname normalization
(Nick/Nicholas, Alex/Alexander, Kate/Katherine, Mike/Michael) does not exist
anywhere in `duplicates.ts`.

**False positive — the sibling/twin risk:** the address-based fuzzy path is
the opposite failure. Two siblings at the same address with phonetically close
names (e.g., "Jaydon"/"Jayden," "Kaitlyn"/"Caitlyn" — genuinely common
sibling-naming patterns, not hypothetical) can clear the ≤2 edit-distance +
≤40%-of-first-name-length guard and get grouped as a "Similar Name & Same
Address" duplicate. The UI then hands the leader step-by-step **merge
instructions** pointing at PCO's "Merge Duplicate" action
(`DuplicatesReport.tsx:101-113`) with no warning that this is a
sibling-collision risk, not just a data-entry risk. Merging two actual
children's PCO records — collapsing one kid's check-in history, allergy notes,
and background-check status into their sibling's — is a real, hard-to-reverse
safety and safeguarding problem, and the UI gives zero friction against it
beyond a generic instructions panel.

**Minor-safety flag:** Yes — the merge-instructions flow for the address-fuzzy
path should explicitly warn "check this isn't twins/siblings" before linking to
PCO's merge action. It currently doesn't.

**What a leader needs:** Nickname-aware name equivalence (a small canonical
map is enough to catch 90% of real cases) before this tool can be trusted for
students, and a same-address sibling guard stronger than "first name is
reasonably similar."

---

## #6 Ghost Protocol — `src/components/GhostModal.tsx`, `src/utils/ghost.ts`

**Verdict: DEMOTE (rework threshold before it's usable for students)**

`isGhost` (`ghost.ts:12-27`): a student with a `lastCheckInAt` is only a ghost
past **24 months** of no check-in (`DEFAULT_GHOST_CONFIG.checkInThresholdMonths
= 24`). Anyone with no check-in at all is an immediate ghost regardless of how
recently they were added (`ghost.ts:14-17`).

**Does it survive the school year?** No — worse, it's not even calibrated to
one. Two full school years (24 months) is roughly the entire middle-school-to-
high-school span for a single class. A student who ages out of the ministry
after 8th grade (the 8th→9th cliff the product team was told about) and never
gets picked up by the high-school program shows as "active, not a ghost" for
two full years after they effectively vanished. Conversely there's no
school-year-aware signal at all — summer gap, which is normal and expected for
every single student every year, isn't distinguished from an actual drop-off;
the code just doesn't look at anything less than 24 months so summer noise
happens to get absorbed, but only by using a threshold so blunt it also
absorbs a genuine one-year disappearance.

There is also a very good, self-documented admission of a **broken rescue
signal** at `ghost.ts:22-25`: small-group membership was meant to prevent an
active small-group kid from being flagged as a ghost, but it read from PCO
Groups, which — per the standing context for this audit — Locus deliberately
does not use, so "the rescue could never fire." That comment is exactly
persona-knowledge #2 in code form: the one signal that would make this
correct for teenagers (small-group attendance, not overall check-in count) was
planned and is dead code. Attendance count is the only signal, which is the
exact "attendance-count models built for adults misread students" failure
mode the ministry warned about, and this is the file the product team most
needs to see is broken.

**False positive cost:** a student who is fine — playing a fall sport, on a
custody-schedule Sunday, working a new job — reads as normal for up to 2 years
under this logic, so false positives from short gaps are actually suppressed
(accidentally, by blunt threshold) — but see false negative below.

**False negative cost (the real cost):** a student who quietly stopped coming
to small group in September isn't flagged until roughly the following-following
summer, by which point re-engagement is far harder and the "ghost" label reads
as an archival housekeeping task, not a pastoral emergency. This feature does
housekeeping (archive stale PCO records), not care — that's a legitimate,
narrow job, but it should not be confused with drift/attrition detection, and
right now the Dashboard's "Manage Ghosts" quick action (`Dashboard.tsx:115-117`)
frames it exactly that way.

**Minor-safety flag:** "Archive All" (`GhostModal.tsx:68-74`) bulk-archives up
to however many ghosts exist with one click and only a `disabled` guard, no
distinct confirmation step for a list that could include students who simply
graduated last spring and are expected to be gone. Archiving a graduated
senior isn't harmful, but the UI gives no way to tell "graduated, expected"
apart from "actually missing," which is the distinction that matters most for
this ministry (per-persona: graduating seniors are the goal, not attrition).

**What a leader needs:** This isn't a leader-facing feature as built (it's an
admin archive tool), which is correctly scoped — but it should not be the
thing that also silently defines "active" for the Dashboard's headline
population count.

---

## #7 Family Audit — `src/components/FamilyModal.tsx`, `src/utils/family.ts`

**Verdict: CUT the household assumptions, KEEP the true-error checks**

`analyzeFamilies` (`family.ts:101-167`) mixes two very different kinds of
checks and should not present them with equal "Critical/Warning" weight:

**Genuinely good, keep:** child-older-than-parent (`family.ts:134-148`,
correctly `Critical`, offers a role-swap fix) — that is always a data error,
no household structure can make it legitimate.

**Assumes two-parent, one-household families — will misfire constantly:**

1. `checkSpouseGap` (`family.ts:16-31`) only runs `if (parents.length === 2)`
   and unconditionally treats any two non-child adults in a household as
   spouses. A grandmother raising a grandchild alongside an adult uncle in the
   same PCO household, a blended family with a stepparent plus a grandparent
   still on the household record, or any guardian arrangement with two adult
   non-children reads as a married couple and gets flagged "Large age gap
   between Spouses" if the two adults are >40 years apart — which is exactly
   the shape of a grandparent-guardian household. This directly produces the
   kind of wrong, painful output the ministry warned about: surfacing a
   foster/guardian family's structure as a data "error."

2. Parent/child age gap <15 years flagged as `Warning: Small age gap`
   (`family.ts:149-158`). This will flag teen parents, young guardians, and
   older-sibling-as-guardian situations — all real, all legitimate, none of
   them a data error — with a "Warning" label a volunteer could see and
   misread as license to ask an intrusive question of a family that is
   already navigating something sensitive.

3. `checkSplitHouseholds` (`family.ts:33-99`) flags shared address, email, or
   phone across two PCO household IDs as "Potential Split Household." This is
   the **normal, correct** shape of a divorced/separated family who
   intentionally have two PCO households sharing one kid's cell number — the
   single most common non-nuclear family structure in any youth ministry — and
   the tool labels it a data anomaly every time. Every co-parenting family in
   the program will generate a permanent "Warning" that never resolves and
   never should.

**False positive cost:** this is the highest false-positive-rate feature in
the whole area, and every false positive here is aimed at a family structure
(guardian, blended, co-parenting, teen parent) that is already the most
sensitive to being told "your family looks wrong" by a database tool.

**False negative cost:** low — real data errors (age-inverted parent/child)
are still caught.

**Minor-safety flag:** Yes, meaningfully. Surfacing "Small age gap between
Parent and Child" or "Potential Split Household" to anyone beyond the specific
staff member who already knows the family's real situation risks a volunteer
leader asking a family an inappropriate question based on a false inference.
This should never be shown to volunteer leaders, and even for staff it needs
household-structure-aware suppression (mark a household as
"guardian/foster/co-parenting, don't flag") before it's safe to run every
week.

**What a leader needs:** Nothing — this must stay staff-only, and even then
needs a per-household "not an error" suppression that doesn't currently exist.

---

## #8 Golden Record — `src/components/GoldenRecordModal.tsx`

**NOT MY LANE (mislabeled).** This is not a golden-record/data-merge feature —
it's a celebratory badge modal for hitting 10,000 total fixes
(`GoldenRecordModal.tsx:22-28`), wired to the gamification system (Confetti,
badge copy "Data Deity"). It belongs in Area B (gamification), not core-hygiene.
Nothing here touches grade, household, or duplicate logic. I'll flag the
mis-categorization but leave gamification substance to that area's critique.

---

## #9 Undo / Redo + Undo toast — `src/components/UndoRedoControls.tsx`, `src/components/UndoToast.tsx`

**Verdict: SIMPLIFY (the mechanism, not these two files)**

These two components are simple and correct in isolation — a countdown-bar
toast and enable/disable buttons. The defect is structural and lives in
`App.tsx` (see #4 above): only one pending update is tracked at a time
(`pendingUpdateRef` is a single ref, not a queue), so `UndoToast`'s 5-second
grace window only ever protects the single most recent edit. In any workflow
that touches more than one student in under 5 seconds — which is the explicit
design goal of Speed Run — Undo silently stops covering everything but the
last record. The component itself never communicates this limitation to the
user; it always shows the same "Undo" button as if it works for the fix that
was just made, which is only true for the very last one.

**Minor-safety flag:** A false sense of safety net for bulk/fast editing of
minors' PII. The UI implies "you can always undo," and that's false the
instant a second fix happens.

**What a leader needs:** Either a real per-edit undo stack, or the toast
needs to make clear when a previous edit has already been committed and can't
be undone this way (only via the separate command-history Undo/Redo, which is
a different code path — `handleHistoryUndo`, `App.tsx:637+` — not obviously
the same as the toast to an end user).

---

## #10 Settings / Config — `src/components/ConfigModal.tsx`

**Verdict: KEEP the grade-cutoff config; NOT MY LANE for the rest**

The one part of this screen that matters to grade hygiene is good: cutoff
month/day is user-configurable (`ConfigModal.tsx:78-102`) rather than
hardcoded to Sept 1, which lets a church match its actual state's enrollment
cutoff. That directly helps #2. Sandbox Mode ("changes will not be saved to
PCO," `ConfigModal.tsx:150-158`) is also a genuinely good safety valve for
training a new volunteer on Review Mode without touching real records — I'd
want every new leader's first session run in Sandbox Mode before anything
else, and there's no way in the UI to force that (it's an opt-in checkbox, not
a default or a per-user training-mode flag).

Party Mode, Zen Mode audio themes, colorblind/high-contrast, Spotify
integration, Campus Cup campus selector — NOT MY LANE, these are
accessibility/gamification concerns for other areas of this audit.

---

## #11 Address / phone / email hygiene utilities — `src/utils/hygiene.ts`, `src/utils/zipCodes.ts`, `src/utils/areaCodes.ts`

**Verdict: CUT the third-party zip lookup path; SIMPLIFY the rest**

**Minor-safety flag — the real finding here:** `enrichZipCodeAsync`
(`zipCodes.ts:50-70`) makes a live `fetch` to `https://api.zippopotam.us/us/{zip}`
directly from the browser, with a student's home zip code, whenever a 5-digit
zip is typed into the address-fix field in Review Mode (`ReviewMode.tsx:448-457`)
or Smart Fix. Per the standing rule this ministry works under, anything sent
to a third-party service about a minor is a safeguarding line, not a UX
tradeoff — a home zip code narrows a student's location and this is sent to an
external, unaffiliated API with no data-processing agreement, no consent flow,
and no indication to the volunteer that it's happening. The synchronous
`enrichZipCode` (`zipCodes.ts:44-48`, local 3-digit prefix table) does the same
job with zero network egress and should be the only path used. There's no
reason the async network call needs to exist at all for a hygiene fixer.

**detectNameAnomaly (`hygiene.ts:4-16`):** flags all-caps or all-lowercase
names only — reasonable, low false-positive surface, doesn't touch nickname
logic (that lives in #5's gap, not here).

**fixName (`hygiene.ts:18-26`):** naive title-case (`toLowerCase` then
capitalize each word). This will mangle real names on the "Smart Fix All"
bulk-apply path in Review Mode (`ReviewMode.tsx:131-137`, applied with **no
review, no preview, no per-record confirmation** for every anomalous name in
the roster in one click): "McKenzie" → "Mckenzie," "DeShawn" → "Deshawn,"
"O'Brien" → "O'brien," "LeBron" → "Lebron." These are common real student and
family names, not edge cases, and bulk-applying this silently overwrites a
correctly-cased legal name with a wrong one at scale, with the only safety net
being the single-slot 5-second undo from #9 (which is already gone the moment
the next Smart-Fix-All batch or Speed Run click happens).

**validatePhone (`hygiene.ts:160-165`):** hardcoded to US E.164
(`+1` + 10 digits). Any international student, foreign-exchange student, or
missionary-kid family with a non-US number is permanently flagged as a phone
anomaly with no way to mark it as correct — same "no override" pattern as #2's
grade problem.

**False positive/negative cost:** every mixed-case surname (Mc-, Mac-, De-,
O'-, and hyphenated/multi-capital names generally) becomes a bulk, unreviewed,
silently-wrong "fix" the instant a leader clicks "Smart Fix All." That's a
correctness regression the tool itself introduces, not one it catches.

**What a leader needs:** `fixName` needs a name-casing exception list (or at
minimum should never run un-previewed in a bulk apply) before it's safe to
hand to a volunteer with a "fix everything" button.

---

## Summary verdicts

| # | Feature | Verdict |
|---|---------|---------|
| 1 | Dashboard | SIMPLIFY |
| 2 | Data Health scatter / grader | KEEP core, SIMPLIFY (needs override) |
| 3 | Smart Fix Modal | SIMPLIFY |
| 4 | Review Mode + Speed Run | CUT Speed Run; KEEP plain Review |
| 5 | Duplicate Detective | SIMPLIFY (nickname gap + sibling risk) |
| 6 | Ghost Protocol | DEMOTE (rework threshold + framing) |
| 7 | Family Audit | CUT household-structure checks; KEEP true-error checks |
| 8 | Golden Record | NOT MY LANE (mislabeled, belongs in gamification) |
| 9 | Undo/Redo + toast | SIMPLIFY (fix single-pending-slot design) |
| 10 | Settings/Config | KEEP grade-cutoff + Sandbox Mode; rest NOT MY LANE |
| 11 | Hygiene utilities | CUT third-party zip lookup; SIMPLIFY fixName |
