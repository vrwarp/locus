# Area B — Gamification — Round 1 (church-admin, discovery)

Standing findings that apply across all seven features before the per-feature
notes:

- **No per-person identity.** Login is the church's shared PCO application
  `appId`/`secret` (`src/App.tsx:73,101`), not an individual staff account.
  Gamification state is one `localStorage` key (`locus_gamification`,
  `src/utils/storage.ts:52`) scoped to nothing but the browser it's opened in.
  Two volunteers on the same office PC share one counter and look like one
  super-user; the same volunteer on a laptop and a desktop looks like two
  people who never showed up. Every leaderboard/badge/streak claim in this
  area is built on top of that non-identity.
- **Points are awarded on "field changed," not "field corrected."** In
  `handleSaveStudent` (`src/App.tsx:564-592`) and
  `handleSaveStudentBulk` (`src/App.tsx:496-507`), `actionType` is derived
  purely from `updated.X !== original.X`, and `updateGamificationState`
  (`src/utils/gamification.ts:93`) increments counters and evaluates badge
  unlocks off that diff with **no correctness check of any kind**. Typing
  garbage into a birthdate field scores identically to fixing it correctly.
  This is the speed-over-accuracy problem named in the brief, and it's not a
  hypothetical — it's how the counter is literally computed.
- **Points fire before the PCO write is confirmed, and don't unwind on
  failure.** `handleSaveStudent` calls `updateGamificationState` and
  `saveGamificationState` synchronously (`src/App.tsx:580-592`), then debounces
  the real PCO commit by 5 seconds (`src/App.tsx:604-609`). If `executeCommit`
  later fails (`src/App.tsx:369-378`), the student record is reverted in the
  UI — but the gamification credit, badge, and confetti already fired and
  were already persisted to `localStorage`. The code's own comment admits
  this: *"if undo happens we will revert via UI state, persistence might need
  revert too but it's minor"* (`src/App.tsx:591`). It is not minor: it means
  the score can diverge from reality in the rewarding direction only, forever.
- **State lives in one browser's `localStorage`, full stop.** No sync to PCO,
  no server, no export. Clear cookies/site data, use a different browser,
  reinstall the OS, or lose the laptop and every streak, badge, bounty, and
  "Total Fixes" number silently resets to zero with no warning and no
  recovery path (`src/utils/storage.ts:155-199`). For a volunteer team that
  churns through machines and browsers regularly (per the persona's own
  operating knowledge), this is not an edge case, it's the common case.

---

## #12 Bounty Board (`src/components/BountyBoard.tsx`)

**Verdict:** CUT

**Would we actually open this?** Someone posts a bounty ("Fix 50 emails, reward: coffee") once, maybe twice, then forgets it exists. There's no notification, no digest, no assignment to a person — it's a static board you have to remember to check. In a 1,200-person church running on volunteer hours, nobody is checking a data-quality bounty board unprompted.

**PCO overlap:** None directly, but a manager who wants to assign cleanup work already does it via a Slack message, a standing task list, or a PCO List filtered to bad records — none of which need a bounty/reward metaphor.

**Governance / privacy risk:** The `actionType` counting that fulfills a bounty inherits the "any field change counts" problem above — a bounty for "Fix 50 emails" can be satisfied by changing 50 email fields to something that still doesn't validate, because nothing checks the new value. It rewards volume over correctness on real member records, and whoever posted the bounty (with a real reward attached — "Free Coffee") has no way to know if it was actually earned honestly.

**What would make it worth the licence fee:** Nothing about the reward/board mechanic. If there's demand for "assign this backlog of bad records to a person," that's a work-queue feature, not a game — build it as a filtered task list, drop the bounty skin.

---

## #13 Campus Cup (`src/components/CampusCup.tsx`)

**Verdict:** CUT

**Would we actually open this?** Once, out of curiosity, then never again once the numbers are understood to be fake.

**PCO overlap:** None.

**Governance / privacy risk:** This is the most damaging feature in the area. `BASE_SCORES` for every campus other than the user's own are hardcoded constants (`src/components/CampusCup.tsx:11-17`), and a `setInterval` fabricates "other campus" activity every 3 seconds with `Math.random()` (`src/components/CampusCup.tsx:25-43`) — including a "🔥 N fixes submitted by your campus in the last 24 hours" number that is also random (`src/components/CampusCup.tsx:37-38,96-98`), not a count of anything that happened. There is no cross-campus data channel at all — see the identity finding above, this app has no concept of "other campuses" logging in. The chart labels this fabricated noise "Total Fixes" in the tooltip (`src/components/CampusCup.tsx:80`) as if it were measured. This is not a demo shortcut, it is a live feature generating a false impression of inter-campus competition to the person using it, indefinitely, in production. If a campus pastor ever asks "why are we losing to North Campus" and someone traces it to `Math.random()`, that is a credibility-ending conversation for whoever shipped Locus internally. On the cultural question specifically: multi-campus churches already have enough turf tension over budget and stage time; manufacturing a fake competitive scoreboard between campuses — with a fabricated "your campus is losing" narrative — is the last thing an executive pastor wants a data-hygiene tool injecting into inter-campus relations, and it's worse that it isn't even real.

**What would make it worth the licence fee:** Nothing about the current design is salvageable — it would require real per-user auth, a shared backend aggregating actual verified fixes per campus, and a governance conversation about whether campus-vs-campus scoring is something the church wants at all (my answer: no, not for something as blame-coded as "whose data is worse"). Cut it; do not soften the fabrication, remove the feature.

---

## #14 Achievement Case (`src/components/AchievementCase.tsx`, badges from `src/utils/gamification.ts`)

**Verdict:** DEMOTE

**Would we actually open this?** Rarely — a curiosity tab someone opens after unlocking a badge notification, not a destination.

**PCO overlap:** None.

**Governance / privacy risk:** Inherits the core "diff counted, not correctness checked" problem — badges like "The Archaeologist" (50 fixes) or "The Golden Record" (10,000 fixes, `src/utils/gamification.ts:54-59`) are volume trophies awarded regardless of whether the underlying edits were accurate. A wall of badges earned by fast, sloppy edits is worse than no wall at all, because it visibly certifies "this person is great at data hygiene" to their manager when the underlying data may be worse than when they started.

**What would make it worth the licence fee:** Tie badge conditions to a validated-correct outcome (e.g., re-graded/re-verified record, not just "field changed"), and drop the volume-only badges (10,000 fixes) that reward grinding over care.

---

## #15 Gamification Widget — streak, daily fixes (`src/components/GamificationWidget.tsx`, `src/utils/gamification.ts`)

**Verdict:** SIMPLIFY

**Would we actually open this?** It's always visible in the header, so it's "seen" constantly, but the daily goal of 50 fixes/day (`src/components/GamificationWidget.tsx:13`) is an arbitrary number with no basis in how many records this church's roster actually has that need fixing on a given day — most days the honest number of legitimately-fixable records is much smaller, which either makes the goal never-completed (discouraging) or invites padding edits to hit 50 (the speed-over-accuracy risk again, made explicit as a daily quota).

**PCO overlap:** None — PCO has no equivalent because PCO doesn't gamify list hygiene, deliberately.

**Governance / privacy risk:** The daily-fixes streak is a second lever, alongside badges, pushing toward "make some edit today" regardless of whether real errors exist to fix that day. A volunteer who wants to keep a streak alive and runs out of real bad data has a direct incentive to touch records that don't need touching.

**What would make it worth the licence fee:** Replace the fixed 50/day goal with a goal scaled to the actual outstanding-error count for that org, and — as with the badge system — gate streak credit on a change that stuck (confirmed PCO write, not optimistic local state) and ideally on some lightweight correctness signal (e.g., resulting grade score improved), not on "a field is different than it was."

---

## #16 Avatar / level (`src/components/Avatar.tsx`, `src/utils/avatar.ts`)

**Verdict:** CUT

**Would we actually open this?** It sits in the sidebar footer permanently, so it's visually present, but nobody is going to the sidebar to check their "Data Ninja" title as a workflow step. It's decoration.

**PCO overlap:** None.

**Governance / privacy risk:** Low on its own, but it's built entirely on the same uncorrected `totalFixes` counter as everything else, so a "Data Deity" (10,000 fixes, `src/utils/avatar.ts:15`) badge could belong to the person who has done the most damage to the roster, not the most good. If a staff member's job review ever references who's "Level 6," that's a real problem waiting to happen.

**What would make it worth the licence fee:** This is pure skin on the same fix counter as #14/#15 — collapse it into a single, more honest progress indicator rather than maintaining three separate reward surfaces (avatar level, badges, streak widget) over one under-validated number.

---

## #17 Confetti, Badge toast, combo sounds (`src/components/Confetti.tsx`, `src/components/BadgeToast.tsx`, `src/utils/audio.ts`)

**Verdict:** SIMPLIFY

**Would we actually open this?** These are ambient, not opened — they fire automatically on badge unlock. Fine as a light celebratory touch the first few times; the concern is durability, not usefulness. `Confetti` renders a full-screen fixed canvas at `zIndex: 9999` (`src/components/Confetti.tsx:141-152`) triggered on badge unlocks that, again, aren't correctness-gated — so a volunteer can trigger a full-screen celebration animation off a bad edit.

**PCO overlap:** None.

**Governance / privacy risk:** None directly (audio/visual only), beyond reinforcing the mis-tuned incentive from an even more visceral, dopamine-driven angle — a literal celebration for what might be a data-quality regression.

**What would make it worth the licence fee:** Keep it, but only fire it off validated milestones once the underlying counters are trustworthy (see #14/#15). Also confirm it respects `config.muteSounds`/reduced-motion settings for a shared office computer — worth checking in a follow-up round, not confirmed here.

---

## #18 Contribution Graph (`src/components/ContributionGraph.tsx`)

**Verdict:** SIMPLIFY

**Would we actually open this?** It lives on the dashboard, so it's seen daily as ambient decoration; nobody takes an action from it. It's a GitHub-style heatmap of `fixHistory`, which — once more — counts diffs, not corrections.

**PCO overlap:** None as a graph, but the same information (who's been editing what, when) is closer to what a PCO **Reports/Activity Log** answers with actual audit-trail accuracy, if the church cares about that.

**Governance / privacy risk:** Low by itself. The real cost is that it's yet another rendering of the same unverified `totalFixes`/`fixHistory` state that resets to nothing the moment `localStorage` is cleared (`src/utils/storage.ts:155-189`) — so the "activity history" it displays is not a durable record even of raw edit volume, let alone correctness, and shouldn't be treated as one if a manager ever asks "show me what Dave did this month."

**What would make it worth the licence fee:** If the goal is genuinely an audit trail of who-fixed-what for accountability, that needs to be server-persisted and tied to a real identity — at which point it stops being a gamification widget and becomes a compliance feature, which is a very different (and more valuable) thing to build.

---

## Summary verdicts

| # | Feature | Verdict |
|---|---------|---------|
| 12 | Bounty Board | CUT |
| 13 | Campus Cup | CUT |
| 14 | Achievement Case | DEMOTE |
| 15 | Gamification Widget | SIMPLIFY |
| 16 | Avatar / level | CUT |
| 17 | Confetti / Badge toast / sounds | SIMPLIFY |
| 18 | Contribution Graph | SIMPLIFY |
