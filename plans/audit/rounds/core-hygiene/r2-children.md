# Area A — core-hygiene: Children's Ministry critique (Round 2, adversarial)

Reviewer: children's ministry director (birth–5th grade), Planning Center
Check-Ins user. Responding to `proposal-v1.md`, not restating round 1.

---

## 0. Verification: `Student.createdAt`

**The field does not exist today and the proposal never claims it does** — it
labels it "a new `Student.createdAt`" and lists the work to add it. Checked
`src/utils/pco.ts:71-99` (`Student` interface): no `createdAt`. `transformPerson`
(`pco.ts:229-289`) never reads `attributes.created_at`. So the repair is not
resting on a phantom field — it correctly scopes this as new work. Confirmed sound
on that narrow point.

Two problems underneath it that the proposal gets partly wrong:

1. **Real PCO does return `created_at` on Person by default.** Verified against
   an independent generated PCO API client (`PcoPeoplePerson` class,
   `planningcenter_api` Dart package): `created_at` is a standard read-only
   Person attribute, alongside `updated_at`. The proposal's "real PCO People
   returns it by default" claim (`proposal-v1.md:99`) holds up. This is not
   invented plumbing.
2. **The fixture claim is wrong in a way that matters for testing.** The
   proposal says "today only check-in fixtures carry it (`data.js:306,330,354`)."
   False: `mock-api/data.js:467` — the newcomer-adult generator — already sets
   `created_at` on a Person, with a comment that says outright *"Metadata for
   'Newcomer' status if we used that field."* But the main household generator
   (`data.js:117-208`), which produces every child fixture and most adult
   fixtures in the mock, sets `created_at` on **none** of them. Practically: once
   this ships, every fixture child in the dev/demo environment has an *undefined*
   `createdAt`, which under the proposal's own "fail closed" rule means `isGhost`
   returns `false` for all of them regardless of tenure — the exact scenario the
   repair is supposed to demonstrate becomes untestable against the existing
   fixtures without also touching the children in the household generator, which
   §3.1 does not mention.

**Verdict on the dependency: sound in principle, incompletely scoped in
practice.** Fine to build on; the fixture work is bigger than one line
("Add `created_at` to the person fixtures") states.

---

## 1. Ghost Protocol repair — is a tenure floor + checkbox list enough?

Verified against current source (`ghost.ts:12-27`, `GhostModal.tsx:1-82`,
`App.tsx:271, 300-336`): every specific defect §3.1 cites is real and cited
correctly — `!lastCheckInAt` fires before any threshold check, the modal's "No
Groups" copy is dead, `.slice(0,10)` previews while `onArchive(students)` acts
on the full array, and `handleArchiveGhosts` never touches
`commandManagerRef`. Round 1 said CUT the one-click archive outright. I'm
revising that.

**Partial concession.** What §3.1 actually proposes is not "add a tenure floor
to the existing button" — it's: default-empty per-record selection (no more
acting on unreviewed records), typed confirmation above ~5 records, a real
`ArchiveCommand` with a working `undo()`, the full list rendered instead of
truncated, and a fail-closed rule for missing `createdAt`. That is not the
same one-click blast radius I cut in round 1. A batch action that requires a
volunteer to individually check names, type a count to confirm, and can be
undone is a materially different risk profile than a single click on an
unreviewed 47-record array with no recovery path. **I'll accept batch
archival existing in this shape** — my objection was to the *unreviewed,
irreversible* version, and this repair removes both properties.

**What I still won't concede, and what §3.1 dropped:**

1. **The reward loop survives untouched.** `handleArchiveGhosts`
   (`App.tsx:314-324`) calls `updateGamificationState(gamificationState,
   'ghost', successCount)`, and `gamification.ts:40-46` defines "The Exorcist"
   👻 — a badge for clearing 1,000 ghosts, plus confetti on any badge threshold
   crossed. Nothing in §3.1's R1–R5 touches this. So after the repair: a
   volunteer selects records, types a confirm count, the archive executes — and
   the app throws confetti and can award a life-safety-adjacent action a
   collectible. That's an incentive to find more people to archive sitting
   directly under a feature the proposal itself calls "the highest-risk
   workflow in the area." This should have been caught by the same repair that
   fixed the confirm flow; it wasn't. **Name it as dropped, not resolved.**
2. **Still no household context.** My round 1 point stands unaddressed: a
   ghost sweep is still per-individual. A tenure floor stops *new* records from
   being swept, but it does nothing for the case I actually described — one
   child in an otherwise-active family of four who personally hasn't checked in
   in 24 months (irregular attender, different service, went through the other
   parent's check-in flow under a different profile in a merge situation). The
   repair adds `ghostReason` and `createdAt` display per row (§3.1 R2/R3), which
   is real progress on *why*, but nothing shows "3 of 4 people at this address
   are active." A checkbox list of names in isolation is still asking the
   volunteer to make a household-level judgment from individual-level data.
3. **Typed confirmation is a proxy, not a safeguard, for `isChild` specifically.**
   The batches-over-5 confirmation is sized by count, not by whether any
   selected record is a child. A volunteer archiving 3 children needs the same
   deliberateness as archiving 30 adults; the proposal's threshold doesn't
   distinguish. I'd want the confirm string to name the children in the batch,
   not just require typing the batch size.

**Ruling:** ACCEPT the mechanical repair (§3.1 R1–R5) as sufficient to lift my
round-1 CUT to a KEEP-with-fixes. REJECT it as complete — the gamification tie
(#1 above) is a real omission on the exact feature the proposal calls
highest-risk, and should be pulled into this same repair, not left for a later
round to rediscover.

---

## 2. Family Audit — detection cut vs. auto-write cut

**Verified: the proposal cuts three detection rules but does not cut the
auto-write.** `handleFamilySwap` (`App.tsx:420-462`) is explicitly kept
(`proposal-v1.md:249-253`, "Keep `handleFamilySwap`... but add an explicit
confirm naming both people"). Only `checkSpouseGap`, the `<15y` warning, and
`checkSplitHouseholds` are cut; the age-inversion check and its "Swap Roles"
fix action both survive, moved from a dedicated modal into the Review Mode
anomaly queue.

This is not close to my round 1 position, whatever the framing implies — round
1 said **CUT the auto-write**. The proposal keeps it and adds a confirm
dialog. I want to be precise about why that's not the same thing and where I'll
still concede ground.

**Where I concede:** cutting `checkSpouseGap` and `checkSplitHouseholds`
outright, rather than reworking their thresholds, is right, and better than my
own round 1 ask (I said "rephrase... drop the thresholds," which keeps the
checks alive under softer language; the proposal removes them). Age inversion
(`ageDiff < 0`, `family.ts:134-148`) is also a genuinely different case from the
other three: it doesn't require knowing the *relationship type* to know
something is wrong — a person flagged `isChild: true` who is chronologically
older than every non-child person sharing their household is a data
inconsistency regardless of who anyone actually is to whom. I did not carve
this distinction out in round 1 and the proposal is right to.

**Where I still object:** the *detection* being defensible does not make the
*fix* defensible. "Swap Roles" doesn't fix "these two records are
inconsistent" — it makes one specific, unverified assumption about the
correction: that the right repair is inverting the `child` boolean on
exactly these two people. Consider the same household shape I raised in round
1 — a working 17-year-old marked `isChild: false` living with two younger
siblings, one of whose birthdate has a typo that makes them read as 20. Age
inversion fires. "Swap Roles" is one click away from marking the 17-year-old a
*child* (removing them from whatever downstream logic treats non-children as
supervising adults) and marking the mis-typed 8-year-old an *adult* — which is
worse than doing nothing, and a name-confirm dialog ("swap Jane and Bob?")
gives the volunteer no signal that the birthdate, not the flag, is probably
the actual error. `isChild` is used throughout the codebase to segment
children from adults for reporting (recruitment, sorter, family grouping —
confirmed via grep across `src/`), and in the real PCO/check-in context it is
what ratio, background-check and security-tag logic keys off. A flag this
consequential being auto-corrected by a one-click swap — even confirmed by
name — is not proportionate when the actual fix (usually a birthdate
correction, occasionally a genuine flag error, rarely an actual swap) can't be
distinguished by the tool.

There's also an unaddressed architecture gap: ReviewMode operates on exactly
one `Student` per card (`currentStudent = students[currentIndex]`,
`ReviewMode.tsx:78`). "Fold the age inversion into the anomaly queue as an
additional card type" (§3.5) is not a drop-in — every other anomaly type in
that queue is single-record; this one needs two people and household context
shown together. The proposal doesn't note this is a different shape of card,
which makes me doubt the confirm-and-fold plan was checked against the actual
component it's being folded into.

**Ruling:** ACCEPT the DEMOTE and the cut of the three relationship-inferring
checks. REJECT "keep Swap Roles, add a name-confirm" as sufficient — I want the
fix action changed from "auto-swap the two flags" to "surface the
inconsistency and require the volunteer to open the record and correct
whichever field is actually wrong" (birthdate or flag), not pre-select
`isChild` inversion as the answer. A confirm dialog that asks "are you sure"
about the wrong fix is not a safeguard.

---

## 3. Other load-bearing claims — spot-checked, hold up

- **Bulk fixes are on the command stack, ghost archive isn't** (§1.2): verified.
  `commandManagerRef` appears at the cited lines and is absent from
  `handleArchiveGhosts`. Correct, and the sharpened round-1 finding is accurate.
- **`fixName` only touches all-caps/all-lowercase input** (§1.3): consistent
  with what I said in round 1; I have nothing to add or subtract here.
- **Golden Record never opens** (§1.4): not independently re-verified this
  round (not my lane's contested claim), no reason to doubt it given the CUT
  rationale is sound either way.
- **`archivePerson` is `updatePerson(id, {status:'inactive'})`** (`pco.ts:421-423`):
  verified, so the proposed `ArchiveCommand.undo()` reusing `updatePerson(id,
  {status:'active'})` is a legitimate two-line inverse — no objection to the
  mechanism.

---

## 4. What I'm conceding, plainly

- Ghost Protocol: my round-1 blanket CUT of one-click batch archive was too
  broad. A reviewed, confirmed, undoable batch action is a different feature
  than what I cut, and I accept it in that shape (with the gap named above).
- Family Audit: the age-inversion check is legitimately different from the
  other three and the proposal is right to keep it while cutting the rest — I
  didn't draw that line in round 1 and should have.
- The proposal's `Student.createdAt` foundation is real, not invented — I
  checked it against outside evidence, not just the repo.

## 5. What I'm still attacking

- Ghost Protocol's gamification tie (badge + confetti for archive volume) is
  untouched by a repair that otherwise fixed everything else about this
  feature. This is a drop, not a disagreement on judgment.
- "Swap Roles" as an auto-write, confirm dialog or not, remains a
  one-assumption fix for a safeguarding-relevant flag on a check that can't
  tell a flag error from a birthdate error. I want the fix action itself
  changed, not just gated.
- The plan to fold a two-person swap into a single-record review queue has an
  unacknowledged architecture mismatch.
