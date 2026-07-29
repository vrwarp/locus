# Area B — Gamification: Children's Ministry Critique (Round 1 / Discovery)

Reviewer: children's-ministry-agent (check-in desk / nursery director lens)

Standing fact checked before writing this: I grepped the entire `src/` tree for
`allergy|allergies|guardian|medical|pickup` — zero matches. Locus does not
model allergy flags, guardian/pickup authorization, or medical notes anywhere.
It reads PCO People + Check-Ins only. So no gamification mechanic here can
directly race a volunteer through an allergy or pickup-authorization field —
those fields don't exist in this app. The closest child-safety-adjacent data
gamification does touch is **birthdate** and **grade/pcoGrade**, which drive
nursery age-banding and Promotion Sunday room assignment. I judge every
feature below on that axis.

---

## #12 — Bounty Board (`src/components/BountyBoard.tsx`)

**Verdict:** CUT (for the birthdate/grade action types) / DEMOTE (rest)

**Safety impact:** Real, if indirect. `newActionType` in the bounty form
(`BountyBoard.tsx:16,94-102`) includes `birthdate` and `grade` as first-class
quota targets — e.g. "Fix 50 Birthdates by Friday, reward: gift card." The
counting logic in `updateGamificationState` (`src/utils/gamification.ts:175-188`)
increments bounty progress on **any** save where `actionType` matches, with no
correctness check at all — see #13/#14 below, `handleSaveStudent` in
`App.tsx:564-578` derives `actionType` purely from "did the field change,"
not "is the new value plausible." A volunteer chasing a birthdate bounty is
structurally incentivized to type *a* date fast, not *the right* date. Wrong
birthdate → wrong `calculatedGrade` (`ReviewMode.tsx:190`) → wrong classroom
recommendation → a 2-year-old sitting in the 4s-5s room or vice versa. That's
a ratio and room-safety problem, not a paperwork problem.

**Sunday-morning cost:** None directly — this is admin-side, not desk-side.
But it shapes what the desk data *looks like* by Sunday: if last week's
volunteer batch-guessed birthdates to hit a bounty, Sunday check-in inherits
bad age-band placements.

**Household / guardian correctness:** N/A, doesn't touch household shape.

**Minor-data flag:** Nothing sent to a third party, but turning a child's
date of birth into a quota-line-item with a reward attached ("Free Coffee")
is the wrong register for a record used to physically sort children into
rooms. Would not want this visible to my volunteers.

**What would make this worth a volunteer's attention:** Restrict bounty
`actionType` to genuinely low-stakes fields (email, phone, address, ghost
cleanup, name formatting). Drop `birthdate` and `grade` from the picklist
entirely, or require a second signal (e.g., the age-derived grade actually
matches the stated grade after the fix, not just "field changed") before it
counts toward a bounty/badge.

---

## #13 — Campus Cup (`src/components/CampusCup.tsx`)

**Verdict:** CUT

**Safety impact:** None directly — it's a bar chart of aggregate fix counts
per campus, no per-record risk. Flagging it anyway because of what it teaches
the org: cross-campus competitive pressure on data-entry *volume*.

**Sunday-morning cost:** None at the desk.

**Household / guardian correctness:** N/A.

**Minor-data flag:** None — no individual child data is shown.

**Integrity problem (not safety, but load-bearing for this audit):**
`liveScores` is seeded from a hardcoded `BASE_SCORES` constant
(`CampusCup.tsx:11-17`) and then incremented every 3 seconds by
`Math.random()` (`CampusCup.tsx:25-43`) — entirely fabricated. The "🔥 N
fixes submitted by your campus in the last 24 hours" line
(`CampusCup.tsx:96-98`) is also `Math.random() > 0.5` incrementing a local
counter, not telemetry from any other campus. This is presented to the user
as if it were real inter-campus activity ("Compete globally," `CampusCup.tsx:65`).
For a features area whose entire premise is "make data quality visible and
honest," a leaderboard that lies about its own numbers is a credibility risk
if any volunteer or the children's director ever asks "wait, is North Campus
really doing that many fixes?" and the honest answer is "no, that's
`Math.random()`."

**What would make this worth a volunteer's attention:** Nothing at a single
church with one Locus install — it needs real multi-campus data sharing
Locus doesn't have. Cut until/unless there's a real cross-campus feed.

---

## #14 — Achievement Case (`src/components/AchievementCase.tsx`, badges in `src/utils/gamification.ts:11-89`)

**Verdict:** SIMPLIFY

**Safety impact:** Same mechanism as #12 — two of eleven badges are keyed
directly to child-safety-adjacent fields: "The Time Lord" (500 birthdates
fixed, `gamification.ts:47-53`) and implicitly grade fixes feed toward
"Archaeologist"/"Golden Record" via `totalFixes`. Badge unlock is boolean
threshold-crossing on counters that, as established above, increment on
*any* edit regardless of whether the new birthdate is actually correct. A
volunteer 480 birthdates into chasing "The Time Lord" badge has every
incentive to keep the edit rate up, not to double check a guessed date
against the family folder.

**Sunday-morning cost:** None at the desk (this is the admin data-hygiene
side of the app, not check-in).

**Household / guardian correctness:** N/A.

**Minor-data flag:** None beyond the aggregate counters — no PII surfaced.

**What would make this worth a volunteer's attention:** Badges for
formatting fixes (name casing, phone/email/address normalization, ghost
cleanup) are fine — those are genuinely low-risk and mechanical. Badges tied
to birthdate/grade counts should require a corroborating check (e.g., the fix
matches a re-derived grade from a plausible birthdate range, or was made
during a review flow that shows the family record) before counting, or should
be dropped from the badge set.

---

## #15 — Gamification Widget: streak + daily fixes (`src/components/GamificationWidget.tsx`, `src/utils/gamification.ts:93-205`)

**Verdict:** SIMPLIFY

**Safety impact:** The daily-goal / streak mechanic is the root cause behind
#12–14: `updateGamificationState` treats every field type identically —
1 fix is 1 fix, whether it's re-capitalizing "john smith" or overwriting a
child's date of birth (`gamification.ts:149-173`). There's no severity
weighting and no distinction between "reversible formatting cleanup" and
"changed a field that drives room placement." A streak that resets to zero
if you miss a day (`gamification.ts:111-127`) is a classic pressure mechanic
— on a Friday afternoon before a deadline, or when a bounty needs 3 more
birthdates to complete, that pressure compounds with the guess-fast
incentive described in #12.

**Sunday-morning cost:** None — this widget lives in the header of Locus
Core, the admin-side data tool. It does not appear anywhere in a check-in
flow. (Cross-referencing Area A: it *is* fed by Review Mode's Speed Run,
which is out of my lane per the inventory split, but the counts it produces
land here.)

**Household / guardian correctness:** N/A.

**Minor-data flag:** None.

**What would make this worth a volunteer's attention:** Split the counter:
weight/gate birthdate and grade changes differently from cosmetic fixes, or
exclude them from the daily-goal number entirely so the goal can't be
satisfied by rushing through age-band-determining fields.

---

## #16 — Avatar / Level (`src/components/Avatar.tsx`, `src/utils/avatar.ts`)

**Verdict:** KEEP (low stakes, informational only)

**Safety impact:** None. Pure derived display — level is `f(totalFixes)`,
read-only, no write path, no per-field weighting to critique beyond what's
already covered in #15.

**Sunday-morning cost:** None; not desk-facing.

**Household / guardian correctness:** N/A.

**Minor-data flag:** None.

**What would make this worth a volunteer's attention:** Nothing to change
here structurally — it's cosmetic and harmless. Same caveat as #15 flows
through: if `totalFixes` gets reweighted, level titles inherit that fix for
free.

---

## #17 — Confetti, Badge toast, combo sounds (`src/components/Confetti.tsx`, `src/components/BadgeToast.tsx`, `src/utils/audio.ts`)

**Verdict:** KEEP (mechanism) / NOT MY LANE for the tone/sound design specifics

**Safety impact:** None directly — these are celebratory UI/audio effects
fired on badge unlock or ghost-clear (`App.tsx:316-324`, `585-589`). No data
is written by these components. They amplify whatever incentive already
exists upstream (#12–15) but don't introduce a new one on their own.

**Sunday-morning cost:** None — `playTone`/`playAmbientAudio`
(`src/utils/audio.ts`) and `Confetti` are only wired into Review Mode / the
admin dashboard, not the check-in kiosk views per the route list.

**Household / guardian correctness:** N/A.

**Minor-data flag:** None.

**What would make this worth a volunteer's attention:** Fine as-is once the
underlying counters (#12–15) are fixed to not reward speed on
safety-adjacent fields — celebration is appropriate for the harmless fixes
(names, emails, phones, ghosts), it just shouldn't fire identically for a
guessed birthdate.

---

## #18 — Contribution Graph (`src/components/ContributionGraph.tsx`)

**Verdict:** KEEP

**Safety impact:** None — read-only heatmap of `fixHistory` counts per day
(`ContributionGraph.tsx:9-15,60-61`), no write path, no per-child data
surfaced, no per-field breakdown even (it can't tell you if a day's spike was
birthdates or ghost cleanup). Actually the *safest* of the seven because it's
too coarse to be gameable at the field level.

**Sunday-morning cost:** None; not desk-facing.

**Household / guardian correctness:** N/A.

**Minor-data flag:** None.

**What would make this worth a volunteer's attention:** No change needed.
If anything, this is the one gamification surface I'd point the children's
director at, since it's an honest, low-drama log of activity over time with
no fabricated numbers (contrast with #13).

---

## Cross-cutting summary

None of these seven features touch allergy, guardian/pickup, or medical data
— that data model doesn't exist in Locus. The real issue is narrower but
still concrete: **the entire gamification layer (`updateGamificationState`)
counts a birthdate or grade change identically to a phone-number
reformat — same point, same streak credit, same badge progress, same bounty
progress — with zero check that the new value is correct.** Bounty Board and
Achievement Case then attach explicit rewards (gift cards, badges) to hitting
volume thresholds on exactly those two fields. Combined with Review Mode's
60-second Speed Run timer (Area A, not my lane, but the upstream source of
these counts), the product is structurally set up to reward a volunteer for
typing *a* birthdate fast over typing *the correct* birthdate — and a wrong
birthdate silently mis-drives nursery age-banding and Promotion Sunday
placement. Separately, Campus Cup fabricates its leaderboard numbers with
`Math.random()` and presents them as real cross-campus activity, which is a
trust problem for a "data honesty" tool to have baked into its own UI.
