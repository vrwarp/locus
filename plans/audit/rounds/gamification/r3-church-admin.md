# Area B — Gamification — Round 3 (church-admin)

Scope: the four questions posed. Converged items (#12, #13, #16, #18, scoring
substrate) not reopened.

## 1. #14/#17 CUT — confirm. Durability — N1b is enough, close it.

Confirm both. #14 (Achievement Case) landing on CUT is exactly my round-2
position (I rejected the proposal's own DEMOTE and asked for CUT); no reason
to relitigate my own win. #17 following it down is the correct mechanical
consequence — a confetti layer with no remaining trigger except an opt-in,
default-off click toy doesn't earn a `matchMedia` gate, it earns a delete.

Durability: I asked in r1/r2 whether the surviving surface admits it's a
single-browser counter that silently zeroes. N1b's answer —
`Counted in this browser since {firstActiveDate}` on the widget tooltip — is
the right shape of fix: it doesn't pretend to solve sync (no backend, no
export, correctly out of scope for this area), it just stops the UI from
implying durability it doesn't have. Verified the mechanism is plausible:
`lastActiveDate` already exists in `GamificationState` (`storage.ts`), so
`firstActiveDate` is one more field of the same kind, set once. That closes
my open item. I will reopen it only if a future round tries to promote
`verifiedFixes` into anything that looks like a performance record without
this label attached — a raw number with no provenance string next to it is
not acceptable in a volunteer's file, a labeled one is.

## 2. Bulk-path defect — verified, and it costs more than the proposal states

Verified in source. `App.tsx:496-510` (`handleSaveStudentBulk`) classifies
only `name`/`phone`/`email`/`address`, defaulting to `'general'` for anything
else — including a grade-only or birthdate-only change. Confirmed against
`handleSaveStudent`'s classifier (`App.tsx:564-578` in the current tree, `grade`
checked first) and against `updateGamificationState`
(`src/utils/gamification.ts:148-154`), which increments `totalFixes`
unconditionally on `count` regardless of `actionType` — there is no gate
inside that function itself; gating only exists as the per-actionType checks
the proposal is adding in B3. A `'general'` classification from a bulk grade
edit therefore gets none of B3's grade-specific handling and none of the
email/phone/address anomaly check either, because none of those fields
changed. It scores as a free, unverified fix.

What this costs: this is the exact failure mode B3/N1 exist to close. Review
Mode's bulk-fix path is not an edge case — for grade corrections at
scale (a new school year, a homeschool co-op re-enrollment) it is the
realistic primary path, more likely to be used for volume grade work than the
single-record modal. If it bypasses the gate, `verifiedFixes` inherits the
same credibility problem `totalFixes` has today, just with the trophy shelf
removed. I am the one who has to be able to say a number in this tool means
what it claims when a coordinator asks about it — I cannot sign off on
`verifiedFixes` while there is a documented, unfixed path that populates it
without verification.

What closes it: B3(d) as written — extract one classifier helper covering
grade/birthdate/name/phone/email/address, call it from both
`handleSaveStudent` and `handleSaveStudentBulk`, `null` result skips
`updateGamificationState` entirely. This is not optional polish on top of
B3 — it is part of B3's definition of done. Do not ship N1's `verifiedFixes`
chip against a scoring path that still has two classifiers.

## 3. Inert Sandbox Mode — verified, changes my view of scoring writes

Verified independently: `pco.ts:365-373` sets `X-Locus-Sandbox: true` on the
request header when `config.sandboxMode` is on, then calls the same
`api.patch`/`api.post` against the live PCO endpoint regardless —
`mock-api/` has no sandbox-aware handling (grep empty), so nothing on either
end actually diverts the write. The UI shows a persistent orange "SANDBOX
MODE" banner (`App.tsx:681`) telling the operator the opposite of what is
true.

This is an Area A defect, not mine to fix here, but it does change my answer
on scoring: gamification credit is applied on the local save action
(optimistically, ahead of and independent of PCO write success per the
existing `executeCommit`/undo flow), not gated on any real/sandbox
distinction. A volunteer who toggles Sandbox Mode believing they can practice
risk-free will (a) mutate real PCO records and (b) accumulate real
`verifiedFixes` credit for edits they never intended as production work —
silently, on both counts. That is worse for the "honest number" premise this
area now rests on than the bulk-path gap in §2, because it is not a modeling
gap, it is the tool lying about what mode it is in. I am not asking Area B to
fix Sandbox Mode. I am flagging that N1b's provenance string
("counted in this browser since...") should not be read as covering this —
it discloses *where* the count lives, not *whether the write was real*, and
right now there is no such thing as an unreal write. Area A must fix or
remove the Sandbox Mode toggle before I would tell a volunteer coordinator
it's safe to "try things" in this tool.

## 4. Ruling on remaining engineering budget

**Yes — build the correctness gate as an Area A data-integrity fix, full
stop, independent of whether a single Area B surface survives.** Strip out
every gamification framing and what's left is: the app currently records that
a field was "fixed" whenever it changes, whether the new value is right or
wrong, and that record persists (as `totalFixes`, and as whatever
`fixHistory`/graph data downstream consumers read) with no correction path
when the edit is later reverted or was never verified. That is a data-quality
audit trail with a hole in it. A coordinator reviewing "what got cleaned up
this quarter" — with or without a widget — is reading a number that is wrong
today. B3(a)-(d) (change-requirement on grade, birthdate zero-weight,
undo/rollback parity across both undo paths and the commit-failure path,
unified single/bulk classifier) is the fix for that hole. It costs the same
whether it lands under an Area A ticket or an Area B one; I have no
preference on which backlog it sits in, but it does not get cut alongside the
UI it's currently filed next to. If every remaining Area B surface (widget,
graph) were deleted tomorrow, I would still ask for B3 to be built, because
the underlying `updateGamificationState`/classifier logic is shared
substrate that other counts (`fixHistory`, anomaly backlog accounting) read
from — an ungated version keeps producing wrong numbers even with no
gamification screen left to display them on.

The two-number widget and the Contribution Graph are cheap enough (0
components added, a11y-only diffs) that I am not spending more budget
arguing over them. The correctness gate is the one piece of this area with
real engineering cost, and it is the one piece that survives every version
of Area B I can imagine, including the empty one.
