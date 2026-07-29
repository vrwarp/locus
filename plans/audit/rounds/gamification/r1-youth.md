# Round 1 — Youth Ministry critique — Area B: gamification

Reviewer: youth pastor persona (grades 6-12, ~40 volunteer leaders, PCO
People/Check-Ins user). Scope: features #12-#18.

Standing objection that applies to the whole area before the per-feature
notes: none of these mechanics distinguish a **correct** fix from an
**incorrect** one. `updateGamificationState` (`src/utils/gamification.ts:93`)
and both call sites (`src/App.tsx:502`, `:582`) fire on any diff between
`original` and `updated` — there is no verification step, no "was this right"
signal, nothing that reverses points on an Undo. Grade is the single most
volatile, most error-prone field in the database (see Area A critique) and it
is also a scored `actionType` (`bounty-type` option "Fix Grades",
`gradesFixed` counter, "Fix Grades" bounty). A volunteer under a bounty
deadline who bulk-promotes 200 kids one grade too far during the August
scramble gets the same confetti, the same badge credit, and the same bounty
completion as a volunteer who carefully verified each one against a paper
roster. That is a genuine incentive problem sitting on top of the most
sensitive field in the tool.

---

## #12 — Bounty Board (`src/components/BountyBoard.tsx`)

**Verdict: SIMPLIFY**

**Does it survive the school year?** No school-year awareness at all — a
bounty is a flat count target with no expiry logic tied to anything (no
"before the August roster refresh" template). Worse: a leader could post "Fix
Grades — target 200" during the exact week grade is most likely to be wrong
for reasons that have nothing to do with hygiene (kids not yet promoted in
PCO), turning a known seasonal data problem into a scored race.

**False positive / false negative cost:** A completed "Fix Grades" bounty
(`bounty.currentCount >= bounty.targetCount`, `gamification.ts:176-188`)
tells a pastor "200 grades got fixed," but a diff is counted whether the new
grade is right or wrong. If the target grade calc is off by one (a known risk
per the core-hygiene critique of `grader.ts`), the bounty rewards
institutionalizing the error 200 times, and nothing in this component
surfaces that risk. Cost of false "completed": a data corruption event dressed
up as a win, paid out with a real reward (line 111: "e.g., Free Coffee").

**Minor-safety flag:** None directly — no student PII rendered in this
component beyond aggregate counts. But the "ghost" action type target
(clearing ghost records) turns archival of a student's PCO record into a
target-driven task; see #17 for why that matters more than it looks.

**What a volunteer leader would need:** A bounty type that can't be gamed by
volume — e.g. requiring a second-person confirmation for `grade` and `ghost`
bounties specifically, since those are the two categories where "fast" and
"right" are not the same thing (grade because it's a promotion sweep, ghost
because it can mean archiving a kid who quietly dropped out — see #17).

---

## #13 — Campus Cup (`src/components/CampusCup.tsx`)

**Verdict: CUT**

**Does it survive the school year?** N/A — this feature has no data-quality
content at all.

**False positive / false negative cost:** This is not a leaderboard, it's a
random number generator. `BASE_SCORES` (lines 11-17) are hardcoded fiction,
and a `setInterval` (lines 25-43) invents fresh "fixes" for random campuses
every 3 seconds regardless of anything happening in the real database — the
code comment says so outright: *"We add simulated score updates to make the
leaderboard feel alive."* The "🔥 N fixes submitted by your campus in the
last 24 hours" line (line 96-98) is entirely synthetic. For a tool whose
entire pitch to me is "trust this to tell you what's true about your student
data," shipping a screen that fabricates activity numbers is disqualifying —
the first volunteer who notices the numbers move with nobody touching a
keyboard stops trusting every other number in the app, including the ones
that matter (drift, burnout, grade accuracy). This is exactly the "simulated
data presented as real insight" pattern the audit was told to flag.

**Minor-safety flag:** None — no student data shown. The integrity problem is
about the volunteer-facing numbers, not student data.

**What a volunteer leader would need:** Nothing here helps a leader change a
student's week. If a cross-campus leaderboard is wanted, it needs to be built
on real aggregated fix counts from every campus's actual `gamificationState`,
with a visible "as of [sync time]" timestamp — not a random walk.

---

## #14 — Achievement Case (`src/components/AchievementCase.tsx`)

**Verdict: SIMPLIFY**

**Does it survive the school year?** No — badge thresholds are scaled for a
database that doesn't exist at typical church size. "The Golden Record" at
10,000 total fixes and "The Exorcist" at 1,000 ghosts cleared
(`src/utils/gamification.ts:41-60`) assume a student roster in the thousands
with a huge backlog of dead records; a mid-size youth ministry has a few
hundred students. Those badges are functionally unreachable, which a
volunteer figures out fast — and a game with unreachable top tiers reads as
a game that wasn't built for you.

**False positive / false negative cost:** Same root problem as the area-wide
note: `gradesFixed`, `birthdatesFixed` etc. climb on any diff, correct or
not. A one-day bulk grade-promotion pass (a legitimate, necessary annual
event, not "hygiene work") can single-handedly push "Grades Fixed" toward the
badge thresholds, cheapening the badge for the volunteer who actually spent
months finding real errors the other 11 months of the year.

**Minor-safety flag:** None in this component — only aggregate counts and
badge metadata are rendered, no PII.

**What a volunteer leader would need:** Badge conditions worth keeping
(`first-fix`, `streak-master`, `daily-grind`) are fine as-is. Everything past
that needs re-tuned thresholds keyed to actual roster size, not a number that
implies a mega-church database.

---

## #15 — Gamification Widget: streak, daily fixes (`src/components/GamificationWidget.tsx`, `src/utils/gamification.ts`)

**Verdict: DEMOTE**

**Does it survive the school year?** The mechanic is calendar-day based
(`gamification.ts:98-127`) with no seasonal or weekly awareness at all — same
blind spot the drift models in Area C have for students, just applied to
volunteers this time. My data-cleanup volunteers are not staff; the people
actually touching Locus show up in a burst around Wednesday-night prep or a
Sunday-morning gap, not daily. A "streak" that resets to 1 the moment a
volunteer skips a day (`newStreak = 1` at line 124) will break for nearly
every volunteer in week two, by design, because their real-world cadence is
weekly, not daily. That's a guaranteed false "you fell off" signal against
people who never actually stopped.

**False positive / false negative cost:** False negative on volunteer
engagement — a leader who does a focused hour of cleanup every Wednesday
looks, in this UI, indistinguishable from someone who quit after one day.
Cost: a well-meaning tool visibly telling your most consistent weekly
volunteer "you have a streak of 1" for months, which is a morale hit for
exactly the behavior you want to reinforce.

**Minor-safety flag:** None — this widget touches only volunteer activity
counters, no student data.

**What a volunteer leader would need:** A cadence model that matches how
church volunteers actually work — a weekly streak (did you show up this
program week?) instead of a calendar-day streak, and a daily goal
(hardcoded to 50 at `GamificationWidget.tsx:13`, not configurable anywhere I
can find in `App.tsx:744-747`) set relative to the actual size of the open
backlog, not a flat number that assumes a big-database team.

---

## #16 — Avatar / level (`src/components/Avatar.tsx`, `src/utils/avatar.ts`)

**Verdict: SIMPLIFY — NOT MY LANE beyond the grade-volume point already made in the area-wide note**

**Does it survive the school year?** N/A structurally — leveling is a
monotonic lifetime counter, so it can't regress, which is fine. The concern
is the same volume-without-correctness gap already flagged for #12/#14: level
climbs identically whether the underlying edits were verified against a
source of truth or not.

**False positive / false negative cost:** Low direct risk — this is cosmetic
status, not a decision surface. Worth noting `AVATAR_LEVELS`
(`src/utils/avatar.ts:9-16`) tops out at 10,000 fixes ("Data Deity"), the
same unreachable-for-our-database-size problem as #14.

**Minor-safety flag:** None.

**What a volunteer leader would need:** Nothing beyond what's already asked
for in #14/#15 — this is a display of the same underlying counters.

---

## #17 — Confetti, Badge toast, combo sounds (`src/components/Confetti.tsx`, `src/components/BadgeToast.tsx`, `src/utils/audio.ts`)

**Verdict: SIMPLIFY**

**Does it survive the school year?** N/A — purely reactive FX, no calendar
logic to break.

**False positive / false negative cost:** The concrete cost here isn't a
data error, it's tone. Confetti fires (`src/App.tsx:314-323`) when a batch of
"ghosts" is archived — records for people who never checked in. Read
`isGhost` (`src/utils/ghost.ts`) with a youth-ministry eye: a "ghost" isn't
always a bad duplicate row, it can be a real teenager whose family quietly
stopped coming after a divorce, a move, or a crisis, and who never got a
follow-up before someone ran Ghost Protocol. Confetti, a screen-wide canvas
burst, and a badge literally named "The Exorcist" (👻, `gamification.ts:41`)
firing on that action treats "we have no more record of this kid" as a pure
win with zero prompt to ask whether anyone checked on them first. That's the
same blind spot the persona flags for attrition/drift in Area C, showing up
here as celebratory UI instead of an analytics miss.

**Minor-safety flag:** No PII rendered in the toast/confetti itself. The flag
is behavioral, not data-handling: gamifying bulk archival of inactive-student
records with celebration effects, with no gate requiring "was this reviewed
by a leader" before the party animation plays.

**What a volunteer leader would need:** Ghost-clearing FX should be quieter
than a grade-fix or duplicate-merge win, and ideally gated: don't play
confetti on a ghost batch until a leader has confirmed none of the archived
students were "gone because something happened," not "gone because they were
a bad row."

---

## #18 — Contribution Graph (`src/components/ContributionGraph.tsx`)

**Verdict: SIMPLIFY**

**Does it survive the school year?** The grid logic itself is fine (correct
local-date handling, no timezone bug, `ContributionGraph.tsx:38-39`
deliberately avoids the UTC-shift bug that plagues so much of this kind of
code). The problem is the same weekly-vs-daily cadence mismatch as #15: a
GitHub-style contribution heatmap rewards visually for daily activity, and
almost none of my volunteers touch this tool daily. A perfectly engaged
Wednesday-only volunteer will show one green square a week and a wall of
grey — which reads as "not doing much" to anyone who glances at it, including
a pastor deciding who to re-recruit.

**False positive / false negative cost:** If this graph is ever visible to
paid staff assessing volunteer engagement rather than just to the volunteer
themselves, it becomes a passive performance-monitoring surface that misreads
weekly-cadence people as low-effort — the exact false-negative pattern the
persona already distrusts in attendance-count models, now pointed at
volunteers instead of students.

**Minor-safety flag:** None — aggregate counts only, no student data.

**What a volunteer leader would need:** If kept, frame it as "sessions" not
"days" (was this touched during your last on-campus shift, yes/no), and never
surface it to staff as a proxy for volunteer commitment without the weekly
cadence caveat attached.

---

## Cross-cutting summary for the round

| # | Feature | Verdict |
|---|---------|---------|
| 12 | Bounty Board | SIMPLIFY |
| 13 | Campus Cup | CUT |
| 14 | Achievement Case | SIMPLIFY |
| 15 | Gamification Widget | DEMOTE |
| 16 | Avatar / level | SIMPLIFY |
| 17 | Confetti / Badge toast / audio | SIMPLIFY |
| 18 | Contribution Graph | SIMPLIFY |

No feature in this area is NOT MY LANE — all seven score actions taken
directly on student records, which makes this the volunteer-facing incentive
layer for exactly the data I'm being asked to trust.
