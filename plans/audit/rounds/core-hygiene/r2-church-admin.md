# Area A — core-hygiene — Round 2 — church-admin

## 0. Verification pass on the proposal's load-bearing claims

Checked every cited line against source before responding.

- `ghost.ts:12-27` — matches exactly as quoted, including the dead
  Groups-rescue comment and the fact `!lastCheckInAt` returns `true` with no
  tenure test. Confirmed.
- `GhostModal.tsx` — `.slice(0, 10)` at line 40, `onArchive(students)` at
  line 69 (the full, unsliced array), "Inactive > 24m AND No Groups" copy at
  line 32. Confirmed exactly as described.
- `App.tsx:300-336` `handleArchiveGhosts` — bare `for` loop, `archivePerson`
  per record, `alert()` on completion, **no `commandManagerRef` reference
  anywhere in the function** while it appears at lines 365/454/533 in every
  other write path. Confirmed — this is a real, singular gap, not a rounding
  error.
- `archivePerson` (`pco.ts:421-423`) is confirmed to be a one-line wrapper
  around `updatePerson(id, {status:'inactive'})` — the inverse write really
  is as cheap as the proposal claims.
- `Student` has no `createdAt` field today (`pco.ts:71-99`); `PcoAttributes`
  has no `created_at` either (`pco.ts:9-27`) — the proposal is right that
  this is new plumbing, not a rename.
- `ConfigModal.tsx:21` `sandboxMode = useState(false)`, and `App.tsx:75`
  initializes config without `sandboxMode` set — confirmed, fresh install
  writes to production PCO from the first click.
- One thing the proposal did **not** cite, in the same function it's
  repairing: `handleArchiveGhosts` (`App.tsx:314-324`) calls
  `updateGamificationState(gamificationState, 'ghost', successCount)` on
  every successful archive, which can fire a badge and confetti
  (`gamification.ts:45`, `159-160`, tracking `ghostsCleared`). Archiving real
  children's and adults' records is a scored, badge-eligible action in this
  build. That is not addressed anywhere in §3.1's R1-R5. See §2 below.

No claim in the proposal's Ghost Protocol section was wrong. This is a
well-verified repair plan. My disagreement is about whether it's sufficient,
not whether it's accurate.

---

## 1. Ruling on Q1 — does Data Health rebuild a free PCO feature?

Settling this from operating PCO People daily, not from the repo.

**What PCO's Grade Promotion actually is.** It is an organization-level
setting (People → household/org settings, admin-only) that lets you set a
promotion cutoff date and turn on automatic grade calculation from
birthdate. Two things matter that neither critic nor the proposal got fully
right:

1. **It is not a once-a-year batch job.** When the auto-calculate toggle is
   on, `grade` behaves as a continuously computed field tied to birthdate and
   the cutoff — it does not drift, ever, for any record with a birthdate on
   file, because there is nothing to promote annually; it is always current.
   "Annual Grade Promotion" is the marketing name; the mechanism is
   closer to a derived field than a scheduled job.
2. **It supports a manual per-person override.** A family can lock a
   redshirted, held-back, or grade-skipped kid's grade so auto-calc stops
   touching it. This is exactly the case the youth critic raised in round 1
   and the proposal's §5.1 "confirmed correct" flag is trying to reinvent
   from scratch, in the app layer, for a problem PCO already solved at the
   data layer.

**Is it universally on?** No — and this is the part that actually decides
the area. In my experience, a meaningful share of PCO churches — especially
ones that onboarded before this setting existed, or whose admin never found
it in org settings, or who are wary of flipping a switch that silently
reassigns every kid's check-in room the week before promotion Sunday — still
promote grade **manually**, once a year, off a spreadsheet or a bulk List
edit. For that population, drift between real age and posted grade is
routine and real, and nothing in native PCO catches it between promotions.

**Ruling: the Diagonal of Truth is a real job, but not the job the product
claims, and not for the population the nav implies.** It is legitimate
reconciliation tooling for (a) churches that have not turned on PCO's
auto-calculate, and (b) as an override/off-cycle-drift catcher even for
churches that have, since a manual override is invisible to Locus's grader
today. It is close to worthless — worse, actively noisy — for a church with
auto-calculate on and no overrides, because in that case any nonzero
anomaly count is not a data problem, it's Locus's own independently
configured cutoff (`ConfigModal.tsx` grade cutoff, never reconciled against
PCO's actual setting) disagreeing with PCO's live-correct field. **The
proposal's §3.9 exclusion-accounting work is worth doing regardless. What's
missing is a step before it: Locus has no way to know, and never asks,
whether the tenant it's running against has auto-calculate on.** Add that
question to onboarding/Settings (`ConfigModal.tsx`, next to the grade
cutoff fields it's already SIMPLIFYing in §3.7) and, if the answer is yes,
demote the scatter and the Health Score contribution from "Data Health" to
"override and off-cycle exceptions" — a smaller, honestly-scoped claim. This
also resolves Q1 as posed: it's settleable, and the answer is conditional,
not binary — the proposal was right to flag it as the largest open question
and wrong only in calling it unsettleable.

This also sharpens Q2. **Duplicate Detective's grade-scoping is not a design
choice, it's inherited debt from a filter (`App.tsx:793`,
`pcoGrade !== null`) built for the grader, applied to a feature that has no
semantic reason to be grade-scoped at all.** Name-and-email/phone matching
doesn't care whether either record has a grade. I'd go further than the
proposal's "worth checking" and rule it now: run Duplicate Detective over
`fetchAllPeople`'s full result, not the `students` grade-filtered subset. It
costs nothing (no new data source) and it's the difference between a tool
that can find a duplicated grandmother and one that structurally cannot.

---

## 2. Ghost Protocol repair — accountable-for-the-records judgment

R1 (tenure floor), R2 (per-record reason), R3 (checkbox selection, default
unchecked, no truncation), R4 (`ArchiveCommand` on the undo stack, typed
confirm over 5) is the right shape and I'd sign off on shipping it as a
floor. It closes the two things I'd have blocked a release over in round 1:
an unbounded silent bulk write, and zero exceptions for a brand-new record.

**It is not sufficient as the accountable party, for two reasons the
proposal's own analysis elsewhere contradicts:**

1. **The undo it's wired into is admitted, in the same document (§2, item 9
   discussion, "in-memory/session state... a refresh doesn't strand a
   mistake in production"), to not survive a page reload.** Routing
   `ArchiveCommand` through `commandManagerRef` fixes the confirm-and-select
   problem but inherits this exact durability gap for the one action in the
   whole area where "the mistake is already three weeks old before anyone
   notices" is the realistic failure mode — nobody audits an inactive-status
   change the day it happens; someone notices when a family stops showing up
   on a class roster. A confirm dialog protects against a fat-fingered click
   in the moment. It does nothing for the volunteer who confirms correctly,
   archives 12 people who genuinely looked like ghosts because the tenure
   window was still being tuned, closes the laptop, and three weeks later
   nobody — not Locus, which only remembers for the session — can produce a
   list of who was touched and why. **I want a durable record that outlives
   the tab: minimum bar, a downloadable CSV logged at archive time (who,
   when, reason, config values used); better, a one-line note written to
   each PCO person record via the same PATCH ("Archived by Locus
   [date]: no check-in since [x], on file since [y]") so the reason travels
   with the record into PCO itself, not just Locus's session state.** That
   is durable in the way `ArchiveCommand`'s undo is not, and it is cheap —
   it reuses the same write.
2. **The gamification hook is untouched.** `handleArchiveGhosts` still calls
   `updateGamificationState(..., 'ghost', successCount)` after the proposed
   repair, same as today. A checkbox list with nothing selected by default
   is good design right up until it sits next to a system (Area B: Bounty
   Board, Campus Cup, streaks) that scores clearing ghosts. That is a
   structural incentive to select more, not fewer, records — pointed
   directly at the one write path in the app that affects real people's
   active/inactive status. This needs to be cut from this action
   specifically, confirm dialog or not. I don't need every governance
   feature audited on gamification grounds, but this specific pairing —
   score points for archiving member records — is not something I would
   accept in production regardless of how good the selection UI is.

**Do I want a two-person rule or a hard batch cap?** No, and I'll concede
this rather than pile on. PCO itself doesn't require dual sign-off for a
manual status change, a two-person rule won't survive volunteer turnover
(a fresh volunteer with nobody to countersign just won't use the feature,
which defeats the point), and the tenure floor plus default-unchecked
selection plus typed confirm over 5 already does the real work of making
"archive everyone" require deliberate, itemized action instead of one
click. A hard cap is redundant on top of default-unchecked selection — the
selection list already caps a batch at "however many the volunteer
individually checked." **Export/log durability and killing the gamification
hook are the two non-negotiables; two-person rule and hard cap are not
needed on top of what's proposed.**

---

## 3. What I'm conceding

- The three corrections in §1 of the proposal (Speed Run + Smart Fix All
  unreachable, bulk fixes already on the undo stack, `fixName` only firing
  on all-caps/all-lowercase) are all verified against source and correct.
  I did not re-check my own round 1 claims that got overturned here beyond
  confirming the proposal's correction — they're right, I was wrong on the
  compound Speed Run scenario and on `fixName`'s actual trigger condition.
- Cutting Speed Run outright over the UXR's SIMPLIFY: agreed, and the
  reasoning in §3.4 (nothing distinguishing survives removing the timer and
  score) is sound.
- The ZIP third-party call cut (§3.2) and `fixName` casing fix (§3.3):
  agreed, no changes.
- Family Audit cut-three-keep-one (§3.5): agreed. The split-household check
  labeling joint custody as an error was exactly my read in round 1 and the
  proposal's framing is sharper than mine — I'd said "worth checking with
  PCO," the proposal correctly just calls it what it is.

## 4. What I think it dropped

- The gamification-for-archiving hook (§2 above) — not mentioned anywhere in
  §3.1 despite being three lines below the code the repair rewrites.
- Duplicate Detective's grade-scoping as a bug, not an open question — see
  §1. The proposal parked this in Q2 as unresolved; I'm resolving it: widen
  the population, it's a filter-reuse accident, not a deliberate boundary.
- No durability story for `ArchiveCommand`'s undo, despite the proposal's
  own §2/item-9 analysis identifying session-scoped undo as a known
  weakness elsewhere in the same document.

---

## 5. Verdicts

**ACCEPT** §3.1 R1, R2, R3 (tenure floor, per-record reason, selection list)
as written — no changes.

**REJECT-AS-INCOMPLETE** §3.1 R4. `ArchiveCommand` on the command stack is
necessary but not sufficient: add an archive-time durable log (CSV export or
a PCO note written per record) independent of session state, and strip the
`updateGamificationState('ghost', ...)` call from `handleArchiveGhosts`
entirely. Ship R4 with those two additions, not without them.

**ACCEPT** Q1 as posed, resolved: Data Health is a real, narrower job —
override/off-cycle drift and manual-promotion churches — not a
congregation-wide flagship. Add a PCO-grade-auto-calculate onboarding
question; demote framing accordingly.

**ACCEPT** Q2 resolved for Duplicate Detective specifically: run it over the
full person set, not the grade-filtered `students` subset. Reject leaving
this as an open question — it's a filter-reuse bug, not a design tradeoff.

**ACCEPT** everything else in §3 (2, 3, 4, 5-cut-cases, 6, 7, 8, 9, 10, 11)
as verified and correctly scoped.

**No position change** on two-person rule / hard batch cap for Ghost
Protocol: not needed on top of what's proposed (§2 above).
