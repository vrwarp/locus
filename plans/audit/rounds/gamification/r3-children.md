# Area B — Gamification: Children's Ministry Round 3

Reviewer: children's-ministry-agent. Responding to `proposal-v2.md` §3.1, §0.8,
and the cross-area Sandbox finding. Not re-opening #12, #13, #16, #18, or the
scoring-substrate verdict.

---

## 1. Grade weighting — I withdraw my concession. Grade joins birthdate at zero weight.

I conceded too fast in round 2 by testing the gate against the wrong failure
mode. I checked "can a validator catch a wrong grade" and answered yes,
because `calculateExpectedGrade` re-derives it. Youth checked "can the gate
distinguish a verified fix from an unverified one that happens to satisfy the
formula" and the answer is no — and that's the question that matters for a
credit-bearing counter, not a display badge.

Re-read `src/utils/grader.ts` and `pco.ts:243-245` myself this round.
`calculateExpectedGrade` is a pure function of birthdate + today's date +
Sept-1 cutoff. It is the app's *only* definition of correct. There is no
independent signal — no "checked against printed roster," no staff
sign-off. So B3's gate does not verify a human looked at the kid; it verifies
a formula was re-run. A script (or a rushed volunteer on August 30th) that
sets `pcoGrade = calculateExpectedGrade(birthdate)` for all 200 kids passes
every single one with `delta === 0` and earns full credit for zero judgment.

That's not a hypothetical for my domain — it's the exact failure mode I
described in round 1 for Promotion Sunday: a held-back kid, a homeschool
family whose PCO grade doesn't track the formula, an IEP-driven delay. Those
are precisely the records a human check catches and a formula-satisfying
bulk pass papers over. B3's gate doesn't just fail to solve that — it hands
the bulk-promotion script a *cleaner* pass condition (public, computable,
zero-diff-required) than "any diff" gave it before. Making the gate more
"correct" made the automatable path more attractive, not less.

Grade drives room placement at Promotion Sunday the same way birthdate drives
nursery age-banding. If a formula-only pass can earn full gamification
credit without a human ever confirming a kid's actual grade, the counter is
rewarding exactly the behavior — mass re-derivation instead of individual
verification — that produces the placement errors I'm accountable for at the
door. Birthdate's problem was "a validator can't tell right from
plausible-but-wrong." Grade's problem is worse: a formula *can* tell
right-by-formula from wrong-by-formula, and that's not the same thing as
right. A gate that can be satisfied by re-running the church's own derivation
function is not a correctness gate for this purpose; it's a determinism
check.

**Ruling: grade joins birthdate at zero weight.** Same treatment as B3(b) —
skip `updateGamificationState` scoring for `actionType === 'grade'`, still
write to `fixHistory` so the Contribution Graph stays honest. B3 reduces to
`email`/`phone`/`address`/`name`, gated on `detectXAnomaly` flipping, as the
only scoreable fields. Youth wins on the merits; I was the vote in the way and
I'm changing it.

---

## 2. The bulk-path defect (§0.8) — CONFIRMED, and it's moot under §1

Read `App.tsx:488-509` directly. The bulk loop's `actionType` chain is:

```
let actionType: ... = 'general';
if (update.updated.name !== update.original.name) actionType = 'name';
else if (update.updated.phoneNumber !== update.original.phoneNumber) actionType = 'phone';
else if (update.updated.email !== update.original.email) actionType = 'email';
else if (JSON.stringify(update.updated.address) !== JSON.stringify(update.original.address)) actionType = 'address';
```

No `grade`, no `birthdate` branch — confirmed, matches the proposal exactly.
Compare `handleSaveStudent`'s single-record chain at `App.tsx:565-576`, which
checks grade first, then birthdate. Two classifiers, and today they disagree.

Under the current (round-2) spec this is a live veto bypass exactly as I
flagged in round 1: a bulk grade/birthdate edit falls through to `'general'`,
which still scores full credit through `totalFixes`/`dailyFixes` — worse than
either named branch, since `'general'` has no gate at all. Under my ruling in
§1 above it's less catastrophic (grade would be zero-weight either way now)
but the underlying defect stands and must still close: with grade and
birthdate both zero-weight, a bulk grade/birthdate edit *must* fall into a
branch that scores zero, and today it falls into `'general'`, which scores
full. The unified classifier in B3(d) is the correct fix and is not
optional — it's the only way §1's ruling is enforceable outside the modal.
**ACCEPT B3(d)** as written, on condition the extracted helper's grade branch
is deleted per §1 rather than kept as a scoring branch.

---

## 3. Sandbox Mode is inert — this changes how I read every scored write

Verified independently: `src/utils/pco.ts:365-373` sets `X-Locus-Sandbox:
true` as a plain header and then proceeds to the same `PATCH`/`POST` calls
against live PCO collection endpoints (`writeContact`, the person-attribute
call above it) regardless of that header's value. `grep -rin sandbox
mock-api/` returns nothing — the mock server has no sandbox branch to honor
it, and nothing in the real PCO API is a Locus-defined header it would
recognize either. So "Sandbox Mode" does not sandbox anything; every write
that reaches `updatePerson` lands on the real record whether or not the
toggle is on.

This matters for my domain specifically, not just as a general defect. A
volunteer or trainee who believes Sandbox Mode is safe to practice in will
correct — or miscorrect — a live child's birthdate, grade, guardian phone, or
address on production PCO while thinking nothing is being written. Combined
with §1: if grade/birthdate scoring is removed, gamification stops being the
lever that pushes someone to make that kind of edit in a hurry, but Sandbox
Mode's falseness is independent of gamification entirely — it's a trust
failure in the write path itself; it exists whether or not any score is on
the line. That's out of Area B's scope to fix, but I'm flagging it because
`updatePerson`'s signature literally threads `sandboxMode` through the exact
same call path that B3's gate scores, and any reviewer who reads B3's gate as
"safe because it's gated" should not also assume Sandbox Mode makes the
write itself reversible-in-testing. It doesn't. **ACCEPT the finding as
stated** — this belongs to whoever owns write-path safety (not gamification),
but B3's scoring fix does not mitigate it and should not be read as if it
does.

---

## 4. Scope note

Nothing above reopens #12, #13, #16, #18, or the scoring-substrate verdict.
§1 changes B3's spec (grade added to the zero-weight list alongside
birthdate); §2 and §3 are ACCEPT on the proposal's own claims, verified
independently against source.
