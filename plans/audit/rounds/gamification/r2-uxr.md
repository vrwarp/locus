# Area B — Gamification — Round 2 UXR Critique (adversarial)

## 1. Verifying the three claims no critic found

**(a) Undo reverts gamification; commit-failure doesn't. TRUE, confirmed.**
`handleUndo` (`App.tsx:629-631`) does call `setGamificationState(current.prevGamificationState)` +
`saveGamificationState(...)`. `executeCommit`'s `catch` (`App.tsx:369-378`) only
calls `queryClient.setQueryData` — no gamification touch anywhere in that block.
The proposal's framing is accurate and narrower than church-admin's r1 claim, as
stated. No correction needed.

**(b) `Bounty` type doesn't exist, causing ~19-23 TS errors. TRUE, confirmed —
undercounted if anything.** Ran `npx tsc -p tsconfig.app.json --noEmit`: 205
total error lines, of which I count 23 containing `bounties`/`Bounty`
(`App.tsx:464,465,473,482`×2, `BountyBoard.tsx:3,19,20,21`,
`BountyBoard.test.tsx:12,49`, `gamification.ts:176,177`×2,
`gamification.test.ts:180,208,209,212,213,220,223,224`). The proposal's "19" is
a slight undercount, not an overstatement. Directionally solid — this was never
a taste call, it's dead-on-arrival code that only runs because Vite skips
type-checking.

**(c) `GoldenRecordModal` is unreachable. TRUE, confirmed.**
`grep -rn "setIsGoldenRecordOpen" src/` returns exactly two hits: the `useState`
declaration (`App.tsx:91`) and the modal's own `onClose` handler
(`App.tsx:1034`) calling it with `false`. Nothing calls it with `true`. Also
confirmed the `colors` prop it passes to `<Confetti>` (`GoldenRecordModal.tsx:15`)
isn't in `ConfettiProps` (`Confetti.tsx:3-7`: only `origin`, `duration`,
`theme`) — so even in the counterfactual where it were reachable, its signature
gold palette silently does nothing. All three checks pass. Proposal's factual
work this round is trustworthy.

---

## 2. The central question: does the correctness gate save Area B, or does no-identity/no-server mean zero?

**Neither extreme. The question as posed conflates two independent defects,
and answering it as a single binary is itself the error.**

No-identity/no-server kills exactly one *class* of claim: anything that implies
a second person can see or verify your number — team bounties, a cross-campus
leaderboard, "your team" framing. That argument has zero purchase against a
widget that only ever claims to describe *this session, this browser*.
Contribution Graph never claimed multiplayer. Neither does a "records left to
fix" chip. Deleting those on identity grounds is not defensible on
user-experience terms — it removes the one thing in this area that answers a
real task-completion question ("did I get anything done tonight," "is there
anything left") for exactly the persona this audit centers, Emily on a Tuesday
shift, with a number she can watch fall to zero and *leave*.

The correctness gate (B3/N1) fixes a *different* axis — accuracy of a
single-user count — and it does not touch the identity problem at all, because
nothing about `verifiedFixes` becomes any more shared or durable than
`totalFixes` was. So B3 does not "save" Bounty Board or Campus Cup; it was
never asked to, and the proposal correctly still CUTs both. Where B3 earns its
keep is on the four features that survive — it stops Achievement Case,
Contribution Graph, and the new backlog chip from rewarding a diff instead of a
fix, which is a real trust defect on its own, independent of multiplayer.

**My position: keep a hard-pruned Area B — Contribution Graph, a session recap,
a backlog-remaining chip, correctness-gated — and CUT everything that implies a
second observer. That is what the proposal already does. I am not endorsing
"zero," but I am attacking two places below where the surviving pieces still
say more than the data supports.**

---

## 3. Decisions I attack, with a concrete alternative

### Attack 1 — B6's `dailyGoal` formula misstates the very backlog N1 exists to make honest

`dailyGoal={Math.max(5, Math.min(25, anomalies.length))}` feeds a label the
proposal itself rewrites to `Fixed today: {dailyFixes} of {dailyGoal} flagged
records` (`App.tsx:744-747`, B6). "Flagged records" reads as *the total open
backlog*. But the number is clamped to a 5–25 window regardless of the true
count. A church with 500 real anomalies (`App.tsx:272`) would show "12 of 25
flagged records" — understating the actual queue by 20x, in the exact style of
confident-but-wrong number this whole round is supposed to be eliminating. This
is the identical failure mode Campus Cup got CUT for (a plausible-looking
number that doesn't mean what its label says), just smaller in blast radius.
It also directly contradicts N2 in the same document, which wants the
*unclamped* `anomalies.length` shown honestly as "Backlog remaining." Two
sections of one proposal derive two different numbers from the same source and
give the smaller, wrong one the more totalizing label.

**Alternative:** Don't clamp for the label. Show two real numbers:
`Fixed today: {dailyFixes} · Backlog: {anomalies.length}`. If a bounded
progress-bar visual is wanted, use the clamp only for the *bar's* min/max fill
math, never in the printed denominator.

### Attack 2 — B7 keeps `streak-master`, a badge for a metric B6 just made invisible

B6 deletes the streak chip and states plainly: "`currentStreak` stays in
`GamificationState`... it simply stops being displayed. If round 2 kills that
badge, delete the field." B7's kept-badge list is "`first-fix`, `streak-master`,
`daily-grind`, `archaeologist`, and one field badge" — so round 2's own
proposal keeps `streak-master` while removing its only visible surface. This is
worse than the unreachable-badge problem the proposal just fixed for
`the-exorcist`/`the-golden-record`: those were visible-but-unreachable (bad,
but at least legible as "far away"). `streak-master` is now *invisible until
it fires* — a volunteer gets a random confetti+toast for a number they were
never shown building, with no line-of-sight at all. That's a regression
against Achievement Case's own stated design virtue in r1 ("locked badges show
name/description... reasonable line of sight to next goal"), because there's
no longer a streak number anywhere on screen for the locked-badge description
to point at.

**Alternative:** kill `streak-master` in the same motion as the streak chip
(both are casualties of "the browser is not the identity," §1 of the
proposal's own #15 reasoning) — swap the fifth badge slot for one of the
100-count field badges the proposal is already keeping one of. Don't ship a
badge whose progress bar was deleted three sections earlier in the same
document.

### Attack 3 — B7 only removes the three most extreme badge thresholds, not the pattern

Round 1 defect #14-2 was general: any flat, org-size-blind threshold reads as a
false claim once a church's total fixable population is smaller than the
number. B7 removes 1,000/500/10,000 but keeps `archaeologist` (50 total fixes)
and one 100-count field badge (addresses/phones/emails/names, pick one). A
small church with, say, 30 total email anomalies in its entire history will
never see "You fixed 100 Emails!" — same defect, smaller number, still
permanently false for that church. The proposal treated this as "cut the
worst three" rather than "the threshold model itself doesn't scale," which is
what I actually flagged.

**Alternative:** at minimum, cap the kept field badge's copy to something
size-relative ("You cleared every flagged email the system found" at
`emailsFixed >= min(100, totalEmailAnomaliesEverSeen)`) rather than shipping
one more fixed constant into the next round.

---

## 4. What round 1 raised that this proposal still hasn't resolved

The badge-scaling gap above (Attack 3) is the clearest drop — B7 treats my r1
defect as "which specific badges are unreachable," fixes those three, and
declares the category closed, without addressing the underlying claim that
*any* flat threshold is a size-blind false claim once it outlives the org's
real population. That's not new territory for round 3 to open; it's the same
finding, half-applied.

Smaller and lower-stakes: my r1 open question — whether "team" framing needs a
sweep beyond Area B (shared logins, `appId`/`secret` implying one
identity per church) — is correctly still open (proposal's own §3.5), not
dropped, just unresolved. I'm not re-raising it as new; noting it stays live.

---

## 5. Where the proposal beat me

Catching that `executeCommit`'s failure path — not `handleUndo` — is where
gamification state actually desyncs from PCO is a sharper, more precisely
scoped finding than anything in my round 1, which didn't examine the commit
pipeline at all.
