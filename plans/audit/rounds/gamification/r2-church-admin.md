# Area B — Gamification — Round 2 (church-admin, adversarial)

## 1. Fact-check against source

Re-ran everything load-bearing. The proposal is accurate on every claim I checked:

- **§0.1 correction (undo vs. failure) — verified true.** `handleUndo`
  (`App.tsx:629-631`) does restore `prevGamificationState`. `executeCommit`'s
  `catch` (`App.tsx:369-378`) reverts only the React Query cache, never
  `gamificationState`, `alert()`s the user, and leaves the score standing. My
  round-1 wording overstated the surface area. See §5 concession.
- **§0.4 Bounty Board type-system claim — verified true, one nit.** `tsc -p
  tsconfig.app.json --noEmit` reports 188 distinct errors (not 205 — 205 is the
  raw output *line* count including wrapped multi-line messages; sloppy but not
  false). I count 23 individual Bounty-related errors across 20 distinct source
  lines, not 19 — the proposal appears to have counted lines, not errors. Either
  way: `Bounty` is not exported from `storage.ts`, `bounties` is not a field of
  `GamificationState`, and the feature only runs because Vite doesn't
  type-check. Verdict CUT stands regardless of the exact number.
- **B3 validators — verified they exist as named.** `detectEmailAnomaly:43`,
  `detectPhoneAnomaly:167`, `detectAddressAnomaly:120`, `detectNameAnomaly:4` in
  `hygiene.ts`, and `calculateExpectedGrade`/`delta` in `pco.ts:244-245` — real,
  already computed, not invented for this proposal.
- **B4 reduced-motion claim — verified.** `grep -rn matchMedia|prefers-reduced-motion
  src/` returns exactly `App.css:30`, a CSS-only rule (`no-preference` query,
  gating an animation *in*, not out). No JS gate exists anywhere. Confirmed.
- **B4 ghost-confetti claim — verified.** `handleArchiveGhosts`
  (`App.tsx:315-323`) fires `setShowConfetti(true)` off the `ghost` actionType,
  and `the-exorcist` badge is real (`gamification.ts:39-45`).
- **GoldenRecordModal dead-code claim — verified.** `setIsGoldenRecordOpen` is
  called exactly once, from its own `onClose` (`App.tsx:1034`). Unreachable.

No load-bearing claim in this proposal is wrong. That itself narrows what
round 2 can contest to judgment calls, not facts.

## 2. The central question — ruling

The proposal frames my round-1 position as "no identity/no server → all seven
go, everything past B5 is wasted." That overstates what I actually said. My
round-1 verdicts were CUT on three (Campus Cup, Bounty Board, Avatar) and
**SIMPLIFY/DEMOTE** — not CUT — on the other four. The distinction I drew,
and still draw, is not "does this touch gamification" but **does this claim to
measure a person across time or against other people, when the app cannot
identify a person across time.** Campus Cup claims cross-campus comparison.
Bounty Board claims team assignment. Avatar's level claims durable seniority
("Data Deity"). Those are the ones that lie about what they measure, and they
should die regardless of how good the underlying number becomes. A backlog
countdown ("41 flagged records left, right now, in this browser") makes no
identity claim at all — it's a work-queue readout, not a game, and it survives
even in a single-shared-login church office.

**Ruling: do not delete Area B. Keep a minimal, privately-scoped, honest
backlog signal. Do not build the rest of what's proposed.**

B3 (correctness gate) is not optional and is not really a "gamification"
line item — it is a data-integrity fix. Right now the app credits garbage
edits identically to real fixes and calls the result "Total Fixes" on a
dashboard a staff member might reference in a volunteer's year-end review.
That has to be fixed whether or not a single badge survives. Once it's fixed,
showing the honest number (N1/N2's `verifiedFixes` chip) costs nothing extra
— it's the same computation already running.

Past that, I stop agreeing with the proposal's scope. See §3.

## 3. Where I attack the decisions

**REJECT B7 (demote + retune + migrate Achievement Case).** The proposal's own
logic against Avatar ("permanent chrome that can never complete for any real
roster") applies just as hard to a 5-badge case with an id-migration map
someone now has to maintain forever. This is engineering spent making a solo
trophy shelf *slightly more honest* rather than asking whether a trophy shelf
earns a build slot in a shared-login church tool at all. My verdict: **CUT**,
not demote. Fold anything worth keeping ("you cleared your first record")
into N3's Shift Recap as a single sentence, not a component with its own CSS,
tests, and migration logic.

**REJECT the four-surface stacking this leaves on the dashboard.** After
B6+B7+B8+N2+N3, the dashboard renders: a backlog chip, a Contribution Graph, a
collapsed Achievement Case, and a Shift Recap card — four different views of
one counter, in one screen, none of which is a task queue with names attached.
Per my own "would we actually open this" test, a volunteer coordinator opens
*one* of these on a Tuesday: "what's left to fix." Ship the backlog chip and
the correctness gate. Contribution Graph can stay as-is (it's cheap, honest,
ambient, and someone genuinely might glance at it) but Shift Recap is a new
build to replace something (Achievement Case) that should just be deleted, not
replaced. **Do not build N3.** Spend B7/B8/N3's effort in Area A instead —
that is where "what would we cancel to pay for this" points every time.

**PARTIAL ACCEPT B8.** The `aria-label`/`role="img"` fix is a few lines and a
legitimate accessibility floor — do it. The org-relative intensity thresholds
and dark-mode CSS are cosmetic polish on a widget nobody takes an action from;
correctly flagged by the proposal itself as lower priority ("do not spend
effort until [dark theme] is answered") — hold it there, don't schedule it.

## 4. What it dropped from round 1, still unresolved

**Durability.** My round-1 finding — everything lives in one browser's
`localStorage`, no sync, no export, silently zeroes on cleared site data or a
new machine — is acknowledged only as open question #5 ("does identity land
on any roadmap?") and answered by no B-item. B3 fixes *correctness*; nothing
in this proposal fixes *survival*. For a volunteer team that rotates machines
(stated in the persona's own operating knowledge, restated in my r1), a
backlog chip that can silently reset to a wrong number with no warning is
still a problem the proposal ships around, not through. At minimum: the chip
needs a "last synced" or provenance note so nobody mistakes a reset counter
for zero real progress. Not asking for a backend — asking for the UI to admit
what it is.

## 5. Concession

The proposal is right that I overstated the failure-divergence bug as
happening on undo; it only happens on a failed PCO write, which is real but
narrower than I wrote in round 1.
