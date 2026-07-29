# Area B — Gamification — Round 3 UXR (narrow)

## 1. The end-state experience: Emily, three hours into a Tuesday shift

After #12/#13/#14/#16/#17 are gone, what she can see is: the header widget
(`GamificationWidget.tsx`, B7-simplified to `Fixed today: {dailyFixes} ·
{anomaliesCount} flagged records left`) and the Contribution Graph
(`ContributionGraph.tsx`). Nothing else in Area B renders.

**Verdict: coherent, not empty — but the two survivors are not equally
earning their place, and the graph currently overstates.**

- **The one thing worth keeping is the widget.** It is the only surface that
  answers the question Emily actually has at hour three: "did I get anything
  done, and is there anything left." Two real, unclamped numbers, no
  claim of continuity or comparison. **What it must never claim:** a streak,
  a goal she can "complete" (no bounded percentage framing once the
  denominator is the real backlog), or anything implying a second person
  sees this number. Session-scoped, browser-scoped, and the copy must say so
  (N1b's tooltip is the right mechanism — ship it).
- **The graph is the weaker survivor.** It's honest about what happened, but
  it isn't something a volunteer mid-shift consults — it answers a
  look-back question, not an in-the-moment one. I'm not moving it to CUT
  (four-critic KEEP consensus, zero build cost to retain), but if the
  question is "which one thing carries the whole area," it's the widget, not
  the graph. Admin's instinct to spend the residual effort in Area A is
  reasonable; I'm not fighting it, I just don't think keeping the graph
  costs anything either.
- **New defect on the graph itself, in scope for "does it overstate":**
  `ContributionGraph.tsx:67` — `{isAllZero && <span className="subtitle">Start
  fixing to build your streak!</span>}`. B6 deletes `currentStreak` from
  `GamificationState` entirely and B7 deletes the streak chip; nothing called
  "streak" exists anywhere else in the product after this round's cuts. This
  line is the empty-state copy for the one surface the proposal calls "the
  honest one" — and it's the last place in the app still promising a
  mechanic that no longer exists. B8's a11y-only scope doesn't touch it.
  **Cheapest fix:** change the copy to `Start fixing to see it here` (or
  delete the subtitle entirely) in the same B8 pass — one line, not a
  reopened scope fight.

## 2. Bulk-path defect claim (`App.tsx:496-510`) — verified, ACCEPT

Read the live block. `handleSaveStudentBulk`'s `actionType` chain is exactly
lines 496–510:

```
496  let actionType: ... = 'general';
497  if (update.updated.name !== update.original.name) actionType = 'name';
498  else if (...phoneNumber...) actionType = 'phone';
499  else if (...email...) actionType = 'email';
500  else if (...address...) actionType = 'address';
```

No `grade` or `birthdate` branch — confirmed by direct comparison with
`handleSaveStudent`'s chain (`:566-578`), which checks grade first, then
birthdate, then falls through to the same four. A bulk grade correction
through Review Mode's bulk-fix path scores `'general'`, bypassing B3's
correctness gate entirely (a `'general'` action carries no
`detectXAnomaly` requirement — it always counts). The proposal's B3(d) fix
(single exported `deriveActionType` helper called from both paths, `null` ⇒
skip scoring) is the correct and minimal fix. **ACCEPT the defect claim as
stated.**

## 3. Surviving-surface overstatement — both round-2 objections fixed, ACCEPT

- **`dailyGoal` clamp (Attack 1): fixed.** B7 explicitly withdraws the
  clamped-denominator label and replaces it with two unclamped numbers,
  restricting the clamp (if used at all) to the progress bar's fill math,
  never to printed text. This closes the "12 of 25 against a real backlog of
  500" defect. ACCEPT.
- **`streak-master` surviving its own display (Attack 2): mooted, not
  patched — and that's the better outcome.** Rather than swap the badge
  slot as I proposed in r2, B6 deletes the entire badge engine (`BADGES`,
  `Badge` interface, badge-check block) as a consequence of #14 CUT, and
  deletes `currentStreak` from `GamificationState` in the same motion. There
  is no badge left to have a line-of-sight problem. ACCEPT — this resolves
  the objection more completely than my own suggested fix did.
- **New item found this round:** see §1 — `ContributionGraph.tsx:67`'s
  "build your streak!" empty-state copy is now the sole remaining overstatement
  in the surviving surfaces, orphaned by B6/B7's own deletions. Flag for B8.
