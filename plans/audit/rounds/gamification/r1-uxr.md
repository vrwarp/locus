# Area B — Gamification — Round 1 UXR Critique

Standing fact that governs every verdict in this area: gamification state lives
entirely in `localStorage` under a single fixed key (`GAMIFICATION_KEY =
'locus_gamification'`, `src/utils/storage.ts:52`), scoped to one browser, with
**no server/backend persistence** (confirmed: no `gamification`/`bounty`/`campus`
references anywhere in `mock-api/` or `src/utils/api.ts`). There is no
multi-user concept anywhere in the state model. Every feature in this area that
implies a team, a leaderboard, or a shared campus is therefore built on top of
a single-player data store. That single fact undermines #12, #13, and colors
#14 as well.

---

## #12 Bounty Board (`src/components/BountyBoard.tsx`)

**Verdict: CUT**

Bounty Board lets a user post a "team" bounty ("Post one to motivate your
team!", `BountyBoard.tsx:121`) with a reward field (free text, e.g. "Free
Coffee ☕", `BountyBoard.tsx:111`). But bounty progress is driven purely by
*this browser's* `gamificationState.totalFixes`-adjacent counters
(`src/utils/gamification.ts:176-188`), which live in one person's
`localStorage`. If Sarah posts "Fix 50 emails, reward: pizza party" for her
volunteer team, only Sarah's own fixes made from her own browser count toward
it — Emily's contributions are invisible to the bounty and vice versa. The
feature's entire premise (motivating a team) cannot function as built.

**Top defects:**
1. Team framing on solo data. User moment: Sarah creates a bounty at the
   Tuesday team meeting, tells five volunteers about it, then discovers next
   week the progress bar only reflects her own clicks, not the volunteers'.
   She has no way to know this from the UI — nothing states "this only tracks
   fixes made in your browser." Trust defect, not just a missing feature.
2. Reward is an honor-system free-text field with no fulfillment mechanism —
   the app has no notification, no manager view, nothing to actually resolve
   "who gets the coffee." It's a to-do list wearing a game skin.
3. `newTargetCount <= 0` and empty-title/reward checks exist
   (`BountyBoard.tsx:25`) but there's no cap — a user can create a bounty
   with `targetCount: 999999999`, and nothing communicates that's a mistake
   before they've written a fake "reward" promise to their team.

**Cheapest fix:** Delete the "team"/"motivate your team" language and the
Post/Delete authoring UI entirely; keep at most a private personal checklist
("Fix 50 emails today") if there's evidence anyone uses it. Real team
motivation needs a shared backend this app doesn't have — don't fake it.

**Open question:** Does any pilot church actually have more than one person
using Locus Core concurrently? If it's genuinely single-admin per church, the
"team" framing throughout (here and in Campus Cup) should be removed app-wide,
not just critiqued per-feature.

---

## #13 Campus Cup (`src/components/CampusCup.tsx`)

**Verdict: CUT**

This is the clearest trust violation in the entire gamification area, and
arguably in the app. `BASE_SCORES` for five campuses (Main/North/South/East/
Online) are hardcoded constants (`CampusCup.tsx:11-17`). A `setInterval` fires
every 3 seconds, picks a random campus, and adds `Math.floor(Math.random()*5)+1`
points to it forever (`CampusCup.tsx:25-43`) — this runs the entire time the
tab is open, purely client-side, with no data source. A second random roll
increments a "recent activity" counter with copy that reads "🔥 **N fixes**
submitted by your campus in the last 24 hours" (`CampusCup.tsx:96-98`) — a
specific, confident, time-boxed claim about real people's behavior that is
100% `Math.random()`. The "campus" a user competes for is self-selected from a
5-item dropdown in Settings (`ConfigModal.tsx:242-247`) with copy "Select your
campus to contribute to the Campus Cup leaderboard" — there is no PCO campus
field behind it, no verification, nothing.

This directly violates the persona's Trust principle: "Presenting a
simulation as an insight destroys credibility permanently." Dr. Robert or
Sarah has no way to distinguish this bar chart from a real cross-campus
leaderboard — it is styled identically (Recharts bar chart, tooltips,
formatted numbers) to legitimate analytics elsewhere in the app (e.g., Area D
attendance charts).

**Top defects (ranked):**
1. **Fabricated live data presented as real**, no disclosure anywhere in the
   UI that these numbers are simulated. User moment: Sarah, proud of her
   Tuesday cleanup shift, opens Campus Cup to show a volunteer "look how much
   we've contributed" — and unknowingly shows them a number that is partly
   invented by `Math.random()`. If a volunteer later learns this (e.g. by
   reading the source, or by two churches comparing numbers and finding they
   match no reality), Locus's credibility for *all* its data — including the
   real hygiene metrics — is damaged. This is the exact failure mode the
   persona flags as unrecoverable.
2. No opponent data exists at all — every "competing" campus is a single
   installation's own fabrication, meaning two real physically-different
   campuses running Locus would each see their own fake numbers for the same
   named campuses, with no way to reconcile.
3. `userCampus` self-declared with no validation against org structure —
   nothing stops every user at every campus from picking "Main Campus" to see
   themselves winning.

**Cheapest fix:** Delete the feature outright. There is no cheap fix that
preserves intent — a real leaderboard needs a shared backend Locus doesn't
have (see standing fact above), and multi-campus data isn't available from
the PCO People/Check-Ins scope this app is limited to (per inventory standing
context, no PCO Groups, no cross-campus roll-up mentioned anywhere).

**Open question:** Was Campus Cup ever tested with a church that actually has
multiple physical campuses? If Locus is typically deployed at single-campus
churches, this feature has zero addressable users even setting the
simulation problem aside.

---

## #14 Achievement Case (`src/components/AchievementCase.tsx`, `src/utils/gamification.ts`)

**Verdict: SIMPLIFY**

This is the most defensible feature in the area — it's an honest reflection
of the user's own local counters, no fabricated multi-user claims. 11 badges
gated on real (locally-tracked) thresholds (`gamification.ts:11-89`). Locked
badges render a 🔒 with name/description still visible (`AchievementCase.tsx:36-39`)
which is reasonable "line of sight to the next goal" design.

**Top defects:**
1. Badge economy is wildly uneven and some are effectively unreachable in a
   normal usage pattern, which quietly signals "this app was never used
   long enough to be worth it" back at the user. `the-golden-record` requires
   `totalFixes >= 10000` (`gamification.ts:59`) and `the-exorcist` requires
   `ghostsCleared >= 1000` (`gamification.ts:45`). For a mid-size church
   (hundreds to a couple thousand records, per the inventory's stated "12
   records to zero" sparse-data concern), a volunteer will likely never see
   8 of the 11 badges unlock in the record's entire lifetime, since fixing
   the same person's data twice doesn't create more "ghosts." Locked-forever
   badges read as failure, not aspiration, once a user works out the math.
2. Badge descriptions state literal false claims once the max fixable
   population is smaller than the target — "You cleared 1,000 Ghosts!" isn't
   achievable if the org only has 400 duplicate/ghost records total. There's
   no scaling of badge thresholds to org size (`BADGES` is a flat global
   array, `gamification.ts:11`), and Achievement Case surfaces zero context
   about how close "close" actually is relative to the org's total possible
   fixes (only relative to the badge's flat number).
3. `unlockedMap` keys off `badge.id` and silently drops the badge if the id
   is ever renamed/removed from `BADGES` in a future release — historical
   badges a user already earned would vanish from their case with no
   migration path visible in `loadGamificationState` (`storage.ts:172-181`
   only patches new fields, not badge ID renames).

**Cheapest fix:** Scale thresholds to org size (e.g., percentile-based:
"cleared every duplicate the org has" instead of a fixed 1,000), or cut the
badges that are structurally unreachable for small/mid churches
(`the-exorcist`, `the-golden-record`) rather than let them sit as permanent
dead weight in every user's case.

**Open question:** Telemetry (if it exists) on badge unlock rates across
pilot orgs would immediately show which of the 11 are functionally
decorative vs. actually reached.

---

## #15 Gamification Widget — streak, daily fixes (`src/components/GamificationWidget.tsx`, `src/utils/gamification.ts`)

**Verdict: SIMPLIFY**

Always-visible header widget: fire streak count + daily goal progress bar
against a hardcoded `dailyGoal = 50` default (`GamificationWidget.tsx:13`).

**Top defects:**
1. Streak logic punishes normal admin/volunteer cadence. `updateGamificationState`
   resets `currentStreak` to 1 the moment `lastActive` isn't exactly
   yesterday (`gamification.ts:120-125`) — meaning a volunteer who does a
   cleanup shift every *other* Tuesday (a completely reasonable volunteer
   cadence for a part-time role) can never build a streak above 1. The
   feature actively penalizes the exact usage pattern the persona (Emily,
   "20 minutes into a Tuesday night cleanup shift") represents, since it's
   framed around Emily doing occasional shifts, not daily logins.
2. `dailyGoal = 50` fixes is a steep, arbitrary bar with no visible way to
   change it (not present in `ConfigModal.tsx` per grep — only `partyMode`,
   `muteSounds`, `zenMode`, `campus`, `confettiTheme`, `zenAudioTheme`,
   `enableSpotify` are configurable). For Emily doing 15-20 careful manual
   fixes during a 20-minute shift, the goal bar never fills and always reads
   as a shortfall — a small church's entire "Diagonal of Truth" backlog for
   the week might be under 50 records total, making the goal structurally
   unreachable for the actual queue size, not just the user's stamina.
3. Widget has `role="status" aria-label="Gamification Stats"` (line 19) but
   the *content* is two decorative-looking chunks (fire emoji + number,
   progress bar) with no discrete `aria-live` announcement when streak
   increments or the bar fills — a screen-reader user gets "Gamification
   Stats" as a static label and has to actively navigate in to find numbers,
   never gets the moment-of-completion feedback sighted users get from the
   fill animation.

**Cheapest fix:** Make `dailyGoal` derive from the org's actual open-fix
backlog (e.g., min(50, current Data Health queue size)) instead of a flat
constant, and change streak logic to a "days active this week" or "N-day
grace window" model instead of consecutive-calendar-day.

**Open question:** What daily goal number, if any, correlates with volunteers
returning vs. churning? Without usage data this 50 is a guess dressed as
a target.

---

## #16 Avatar / level (`src/components/Avatar.tsx`, `src/utils/avatar.ts`)

**Verdict: CUT**

Six-tier level system (🥚 Data Novice → 🌟 Data Deity) purely on
`totalFixes` thresholds (`avatar.ts:9-16`), shown in the sidebar footer.

**Top defects:**
1. Same structural problem as Achievement Case but worse because it's
   *always visible*, not opt-in-to-view: Level 6 "Data Deity" requires
   10,000 fixes (`avatar.ts:15`). For any church whose total member/household
   record count is under 10,000 (i.e., nearly all of them, per PCO People
   scope), this is mathematically capped below max level forever once every
   record has been touched once — the avatar permanently reads "in
   progress" with a progress bar that can never complete
   (`Avatar.tsx:13-18` — `nextAvatar` stays non-null, bar stuck at whatever
   % the finite record count allows). A sidebar element that is permanently,
   structurally "unfinished" for its entire userbase is worse than no
   progress indicator at all — it invites the exact "why bother" reaction
   the gamification is trying to prevent.
2. Titles skew toward joke/meme register ("Data Ninja" 🥷, "Data Deity" 🌟)
   inside a tool this same audit treats as needing executive-facing
   credibility (Robert Report, Area E). Emily might enjoy it; if Dr. Robert
   or a board member glances at a shared screen during a demo and sees "Data
   Deity" next to real congregant PII being edited, it reads as unserious
   for a data-governance tool.
3. No empty/zero state distinct from level 1 — a brand-new install with zero
   fixes shows the exact same 🥚 "Data Novice, 0/50 fixes" as a user who did
   49 fixes and stalled. No visible differentiation of "never started" vs.
   "almost there."

**Cheapest fix:** If kept, cap the visible ladder at a level reachable by a
small church's actual record count (or make thresholds relative, e.g.
percentile of the org's total fixable records) so the top tier is attainable
before the volunteer disengages. Otherwise fold this into Achievement Case as
one more badge and remove the permanent sidebar chrome.

**Open question:** Sidebar real estate is explicitly named a scarce resource
by this persona (~45 surfaces, "sidebar that long is itself a usability
defect"). Is Avatar earning its permanent footer slot over, say, showing the
count of open Data Health items requiring action?

---

## #17 Confetti, Badge toast, combo sounds (`src/components/Confetti.tsx`, `src/components/BadgeToast.tsx`, `src/utils/audio.ts`)

**Verdict: SIMPLIFY**

**Evidence on what's actually wired:** Badge-unlock confetti triggers
unconditionally on any new badge (`App.tsx:585-588`) with **no gating** by
`config.muteSounds`, `config.partyMode`, or any reduced-motion check — it's a
full-screen, 150-particle, `requestAnimationFrame` canvas animation
(`Confetti.tsx:101-117`) that fires the instant a brand-new user makes their
*first single fix* (the `first-fix` badge unlocks at `totalFixes >= 1`,
`gamification.ts:17`). Separately, `partyMode` in Settings adds *per-click*
30-particle confetti bursts at cursor position (`App.tsx:1063-1065`,
`ConfigModal.tsx:174-185`) — that one is opt-in and correctly gated.
`src/App.css:30` shows a `prefers-reduced-motion: no-preference` media query
exists in the codebase generally, but neither `Confetti.tsx` nor its
mount points check `window.matchMedia('(prefers-reduced-motion: reduce)')`
before firing.

Despite the inventory label "combo sounds," neither `Confetti.tsx` nor
`BadgeToast.tsx` call into `src/utils/audio.ts` at all — grep confirms
`playTone`/`playAmbientAudio` are only called from `GradeScatter.tsx` (grade
pitch on click) and `ReviewMode.tsx` (Speed Run correct/timeout tones, Zen
ambient loops), which are Area A features. Badge unlock is visually loud but
**silent**; there is no sound reinforcing the moment gamification is supposed
to reward.

**Top defects:**
1. Uncontrollable full-screen motion trigger with no reduced-motion
   respect. User moment: Emily has vestibular sensitivity or has
   `prefers-reduced-motion` set system-wide (a stated OS-level accessibility
   preference); her very first data fix — meant to be a welcoming moment —
   throws 150 animated squares across her entire screen for 3 seconds
   (`App.tsx:588`) with zero way to have opted out in advance, since
   `muteSounds` only controls audio and there's no "disable badge confetti"
   toggle distinct from "Party Mode" (which controls the *other*,
   click-triggered confetti).
2. Confetti and BadgeToast fire simultaneously and are visually competitive
   — a full-screen animated occlusion layer (`zIndex: 9999`,
   `Confetti.tsx:151`) plus a toast (`BadgeToast.tsx`) at the same instant;
   the toast text is genuinely useful (badge name + description) but is easy
   to miss/read *through* the confetti given they render together with no
   sequencing.
3. Mismatch between inventory expectation ("combo sounds") and reality (no
   sound on badges at all) suggests either a feature was silently dropped
   post-spec or the docs are stale — worth resolving so it isn't
   re-implemented as if missing.

**Cheapest fix:** Gate the badge-unlock `Confetti` mount behind
`window.matchMedia('(prefers-reduced-motion: reduce)').matches === false`,
and add a single "Celebration effects" toggle in Settings that covers both
badge confetti and party-mode confetti (currently two independent, oddly-scoped
controls). If "combo sounds" was intended, wire one `playTone` call into
`BadgeToast` mount, gated by the existing `muteSounds` flag.

**Open question:** Has anyone using assistive tech or with photosensitivity
actually hit the badge-unlock confetti unprompted? This is a common seizure/
vestibular-trigger pattern (full-screen rapid motion) that warrants a direct
accessibility check, not just a code read.

---

## #18 Contribution Graph (`src/components/ContributionGraph.tsx`)

**Verdict: KEEP**

GitHub-style activity heatmap of `fixHistory` by day, 12-week default window.
This is the most honest, most useful widget in the area: it's a direct,
undecorated visualization of the user's own real local counters
(`ContributionGraph.tsx:60-61` — `isAllZero` shows an explicit "Start fixing
to build your streak!" empty state rather than a fabricated pattern). No
simulated data, no cross-user claims, clear empty state, and a genuinely
useful "did I actually work this week" retrospective for a volunteer manager
like Sarah reviewing shift coverage.

**Top defects:**
1. Color-only intensity encoding, 5 levels of green with no non-color
   redundancy (`ContributionGraph.css:81-85`) — `title` tooltip attribute
   gives the exact count on hover/focus (`ContributionGraph.tsx:82`,
   good), but there's no `aria-label` per square and the squares are plain
   `div`s, not focusable/keyboard-navigable, so a screen-reader or
   keyboard-only user gets nothing per-cell; they'd have to inspect 84+ `div`
   nodes with no semantic markup (no `role="img"`, no table semantics) to
   get any information the sighted GitHub-style grid conveys instantly.
2. No dark-mode variant despite a code comment flagging it as future work
   (`ContributionGraph.css:87`: "Dark mode support could be added here
   later") — if Locus has an app-wide dark theme (worth checking cross-area),
   this widget's hardcoded white background (`ContributionGraph.css:2`) and
   light-only palette would visually break.
3. `weeks = 12` is a fixed prop with no way for the user to see a longer
   history (e.g., a full year like GitHub's own inspiration) — minor, but
   the legend/level thresholds (`level-3` at 30+/day, `getIntensityClass`,
   lines 9-15) are also fixed constants that don't scale to org size, so a
   tiny church where a great day is 8 fixes will visually always look
   "quiet" (never reaching the darkest green), while a big church blows
   through all 5 levels in an hour — same asymmetric-threshold problem as
   #14 and #16.

**Cheapest fix:** Add `aria-label="{count} fixes on {date}"` to each square
and make the grid a labelled `role="img"` group (or a native `<table>`) for
screen readers; add a dark-mode media query to match the rest of the app.

**Open question:** Does Locus Core have an app-wide dark mode? If yes, this
is a defect today, not a doubt — worth a quick visual check outside this
text-only review.

---

## Cross-cutting observation for the area

Three of seven features (#12 Bounty Board, #13 Campus Cup, and to a lesser
extent #15's "team streak" framing) present or imply *shared/team* data on
top of a storage layer that is single-browser, single-user, unsynced
localStorage. Campus Cup goes further and actively fabricates the "team"
data with `Math.random()` on a timer. This isn't three independent feature
bugs — it's one architectural gap (no backend for gamification state) that
three different UI surfaces paper over with increasingly confident-looking
fake data. Any fix at the individual-feature level (better empty states,
accessibility labels) will not address the core issue: **the moment two real
staff members compare what they see in Bounty Board or Campus Cup, the
illusion breaks, and it breaks in the trust-destroying direction the whole
product depends on avoiding** — because this is fundamentally a
data-integrity tool being sold on the credibility of its numbers.
