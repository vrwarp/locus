# Round 2 — Youth Ministry Critique — Area C: pastoral-ops (#19-#28)

Attacking `proposal-v1.md`. Not restating round 1 except where the proposal
moved and needs a direct answer.

---

## 1. The `subMonths(now, 1.5)` claim — VERIFIED, and it's worse than "wrong
math," it's a random-length window

Traced `subMonths` → `addMonths` (`node_modules/date-fns/addMonths.js:34-73`,
v4.1.0, confirmed in `package.json:18`). The function does
`_date.getMonth() + amount + 1` then `endOfDesiredMonth.setMonth(<that>, 0)`
— a non-integer month index gets truncated by JS `Date.setMonth`, and the
"day 0" trick rolls back to the end of the *previous* month, not a clean
1.5-month subtraction. I ran it directly:

```
subMonths(2026-07-29, 1.5) → 2026-05-29   (61 days)
subMonths(2026-01-15, 1.5) → 2025-12-15   (31 days)
```

I then swept every month of 2026 at day 15 (`drift.ts:21` is called with
`now = new Date()`, so this is every real invocation, not an edge case):

```
Jan 31d (4.4wk)  Feb 62d (8.9wk)  Mar 59d (8.4wk)  Apr 59d (8.4wk)
May 61d (8.7wk)  Jun 61d (8.7wk)  Jul 61d (8.7wk)  Aug 61d (8.7wk)
Sep 62d (8.9wk)  Oct 61d (8.7wk)  Nov 61d (8.7wk)  Dec 61d (8.7wk)
```

So it's not "swings between 31 and 61" as a coin flip — it's ~61 days
(8.7 weeks) eleven months of the year and a ~31-day cliff specifically
around January, because subtracting 1.5 from month-index-0 crosses the
year boundary differently. Every other month the code silently measures
**8.4-8.9 weeks of check-ins and divides by a hardcoded `6`**
(`drift.ts:62`), inflating `recentRate` by roughly 40-48% essentially
year-round; January instead *deflates* it by ~26%. The comment
`// Recent: Last 6 weeks` (`drift.ts:20`) is wrong every month of the year,
not occasionally. **Confirmed. The proposal's claim is correct and, if
anything, understated** — this isn't noise around a defensible 6-week
window, the window is *never* 6 weeks except by accident, and it moves in
the opposite direction across the January boundary. §1.1's "settles (a)" is
earned.

---

## 2. Cutting #21 is not rebuilding it — and no honest rebuild is available
from People + Check-Ins alone

The proposal is right to cut what's built. It is not entitled to call that
a settlement of round 1's ask. I asked for three things: school-year
awareness, small-group-vs-service distinction, and cliff exclusion. Here is
what's actually buildable from what Locus has (`People` + `Check-Ins`, no
`Groups`, per `feature-inventory.md:98-99`):

- **School-year awareness and cliff exclusion — buildable, no excuse not to
  ship it.** `Student.pcoGrade` exists and is exactly the field
  `automations.ts` already reads for grade promotion (`getPendingGradePromotions`,
  `automations.ts:67-96`). A drift screen can gate on grade 6-12, suppress
  itself entirely June 1-Aug 15 (the same window `automations.ts` already
  uses for the "after June 1st" promotion gate), and drop grade-12 students
  from the population starting in spring. None of that needs Groups. There
  is no excuse for shipping a rebuild without this — it's copy-paste from
  code the proposal already cites in §4.10.
- **Small-group-vs-service — NOT honestly buildable today.** Check-ins carry
  an `event` relationship and events have only a free-text `name`
  (`pco.ts`). The only mechanism in the entire codebase for turning an event
  name into a category is `classifyEvent` (`burnout.ts:11-25`), and the
  proposal's own §1.2 just proved that mechanism misfires on the single most
  common real-world PCO event name for a kids/student ministry
  ("Kids Ministry" → Serving, not Worship, because `'ministry'` is checked
  first). There is no PCO field, no Groups data, and no second taxonomy
  anywhere in the repo that says "this check-in was a small group, that one
  was big church." Building a "small group drift" signal today means either
  (a) reusing the already-proven-broken keyword classifier, which would
  produce exactly the false confidence I warned about in round 1 — a tool
  claiming to see small-group-specific drift while actually seeing
  whatever-matched-a-keyword — or (b) fabricating a distinction the data
  doesn't support.

**My answer to the press: the minimum viable student-drift signal Locus can
honestly ship is a total-disengagement signal, not a small-group signal.**
Concretely: absolute-zero check-ins of *any* kind, for students grades 6-12
(`pcoGrade` present), over a trailing window sized in *active ministry
weeks* not calendar weeks, with the report suppressed June 1-Aug 15 and
grade-12 students dropped from the population starting in their final
spring. Absolute-zero (Missing Volunteers' pattern, `missing.ts:39-98`), not
percentage-drop (Drift's current pattern) — percentage math is exactly what
generates the sports/custody false positives I named in round 1. This
signal catches "quit church entirely," which is real and worth a leader's
attention. It cannot and must not claim to catch "quit small group, still
shows up Sunday" — that is my highest-value case and it is not visible in
this data without either PCO Groups (explicitly out of scope per the
standing context) or a church-configured event-tagging step layered on top
of the `classifyEvent` config-ification the proposal already proposes in
§4.3 ("move keyword lists into `ConfigModal`"). If that config step ships
and a church tags its own small-group events, the signal becomes buildable
later — but that is a distinct, larger piece of work than "fix the window
bug," and the proposal should say so instead of implying the CUT closes the
question. **If §4.3's config-driven event tagging is never built, no
version of small-group-specific drift is honest, and CUT-without-replacement
is correct — permanently, not provisionally.**

---

## 3. #25's "Solo with minors" tier is the children's win, not mine — and
nothing in this proposal reaches a leader's phone

Correct to name it precisely: §3(c) and §4.7 build `servesMinors` and a
"Solo with minors" tier squarely to answer the children's agent's
two-adult-rule finding. Nothing in that tier is scoped to *my* population —
a solo high-school small-group leader is exactly as safeguarding-relevant as
a solo nursery worker, so I don't object to the mechanism, but I own zero of
the design decisions being made for it in §4.7 and the proposal doesn't
pretend otherwise. Fine — mark it "not my ask" rather than my win.

**Does the merged #20 serve my 40 leaders? No — verified, unchanged.** §4.6
keeps `BurnoutReport.tsx` as host and only renames the route
(`burnout` → `volunteer-risk`). It stays on the Intelligence workspace,
which round 1 established is desktop-only, no leader role, fixed 250px
sidebar (`IntelligenceLayout.tsx:17-31`). §4.4 repoints the Intelligence
landing view from `copilot` to the merged risk screen
(`App.tsx:83`, confirmed unchanged this round: still
`setCurrentView(role === 'core' ? 'dashboard' : 'copilot')`, i.e. the
proposal has *specified* the repoint but the repo state it's describing
still has the binary `'core' | 'intelligence'` split with no third role).
Making the burnout screen the landing page of a workspace leaders can't log
into is a bigger investment in the wrong door, not a fix.

**Does any of Area C reach a leader's phone under this proposal? No.** Every
one of the nine surviving decisions (§4.1-§4.10) operates inside
`Locus Intelligence`. Q5 in the proposal's own §5 asks this exact question
and explicitly declines to answer it — "either it is out of scope... or it
invalidates the value estimate on §4.6 and §4.7." That's not a finding, it's
a deferral of the one fact that determines whether a full day of engineering
(§4.6) and another full day (§4.7) are worth anything to the people who'd
actually act on them. Round 2 should not get to defer this a second time —
answer it: if pastoral-ops stays staff-only, say so and downgrade the
value-per-effort ranking in §4 accordingly, because "day of work, staff-only,
weekly cadence, no leader path" is not the same investment case the
proposal is currently selling it as.

---

## 4. Dropped / conceded

**Dropped:** the proposal never revisits my #23 background-check-gate
finding as a *severity* question — it's folded into §4.8 as one bullet
alongside softening the `worship >= 4` gate, which buries a
recruit-into-unsupervised-minor-contact risk next to a UX tuning nit. Same
weight, wrong shelf.

**Concede:** §1.1's arithmetic proof is a stronger and more falsifiable
reason to cut #21 than the model-shape argument I gave in round 1 — a
wrong number beats a debatable model every time in front of a skeptical
engineer, and the proposal earned that ground fair.

---

## Verdict deltas from r1

| # | r1 | r2 stance on proposal |
|---|----|------------------------|
| 21 | CUT (rebuild) | REJECT the "cut settles it" framing — CUT stands, but only as CUT-without-replacement, conditional on §4.3's config step never landing. Demand the concession be explicit in §5, not implied by silence. |
| 20/22 merge | — | REJECT as currently scoped — still Intelligence-only, still no leader path, Q5 unanswered. |
| 25 | SIMPLIFY | ACCEPT the minors tier; note it's the children's agent's win, not mine. |
