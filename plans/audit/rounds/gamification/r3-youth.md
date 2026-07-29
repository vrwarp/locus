# Round 3 — Youth Ministry — Area B gamification

Scope per instructions: the grade-weight conflict, the bulk-path defect, and the
two verdicts (#14, #17) that moved without me. Converged items not reopened.

---

## 1. Grade weighting — RULING: grade joins birthdate at zero weight

Children's argument was that `calculateExpectedGrade(birthdate) === updated.pcoGrade`
is a "real, checkable correctness condition" because grade is derived from
birthdate and the derivation can be re-run. That is true, and it is exactly the
defect. A validator built from a public, deterministic formula does not check
that a human verified the record — it checks that the record matches the
formula's opinion. For the population where this matters most — held-back
kids, homeschool families whose PCO grade doesn't track age, IEP-driven delays
— the formula's opinion is *wrong by design*, because these students correctly
deviate from age-cohort grade. B3's gate would then actively reward moving a
correct exception record to match the formula, which is not an unverified fix,
it's a wrong one scored as right. That is worse than birthdate's problem, not
milder — birthdate's gate is merely absent; grade's proposed gate is present
and points the wrong direction for exactly its edge cases. Children's own test
for birthdate ("no validator can catch a validly-formatted but wrong value")
applies to grade with one twist: the validator that exists *actively certifies*
the wrong value for the exception cases. I am not deferring to the concession
anymore. **Grade is zero-weight, permanently, same treatment as B3(b) gives
birthdate**: skip `totalFixes`/`dailyFixes`/`currentStreak`/`verifiedFixes` for
`actionType === 'grade'`, write `fixHistory` only. Extend the deletion in
storage.ts to `gradesFixed` (`:41`, `:146`, `:175`) alongside `birthdatesFixed` —
same fate, same reasoning, no reason to keep one dead field and delete its twin.

**Does B3 survive the school year with this ruling?** Yes, better than before —
the field most likely to generate a false "verified" signal every August is now
inert for scoring, which is the actual point of an audit tool that has to
survive grade-promotion season.

**Is the scoring substrate still worth having at email/phone/address/name only?**
Yes, barely, and only because it's nearly free. Those four fields have real
format-based anomaly detectors (`hygiene.ts:4/43/120/167`) with no derivable
"correct" value a script could compute — someone has to type a plausible
replacement that clears the flag. That's a materially different risk profile
than grade's public formula. B3(d)'s classifier-unification work is required
regardless of my ruling (see §2), so the marginal cost of keeping the gate for
four fields is close to zero. I would not have proposed building this
substrate from scratch for four fields alone, but subtracting it now costs
more than keeping it.

**Minor-safety flag:** a formula-only grade gate that pays out identically for
a verified single correction and a blind bulk promotion is precisely the
mechanism that erases a held-back or IEP-delayed student's correct grade
without any human noticing, because the tool tells the volunteer they did
something right. Zero-weighting removes the incentive to run that pass at all.

---

## 2. Bulk-path defect (App.tsx:495–510) — CONFIRMED, and it's worse than stated

Read the loop directly: `actionType` (`:496`) only branches on
name/phone/email/address (`:497-500`); no `grade` or `birthdate` case exists,
so both fall through to `'general'`, which is unconditional credit in
`gamification.ts` (no `detectXAnomaly` gate exists for `'general'` at all,
today or in any B3 draft). Confirmed this is reachable: `ReviewMode.tsx:166-170`
calls `onSaveBulk` → `handleSaveStudentBulk`, i.e. Review Mode's bulk-fix
control, not a hypothetical script.

**Cost, concretely:** an August bulk grade promotion run through Review Mode's
bulk save scores *more* permissively than the single-record modal — it doesn't
even hit the (now zero-weighted, but still classifier-dependent) grade branch,
it scores as `'general'` with no gate at all. And this defeats my §1 ruling if
left unfixed: zero-weighting `'grade'`/`'birthdate'` only works if edits are
*classified* as such before scoring. Without B3(d)'s unification, bulk
grade/birthdate edits bypass the exclusion, not just the correctness check.
**ACCEPT the defect claim, and elevate B3(d) from "unify for consistency" to
"unify or the zero-weight ruling in §1 is cosmetic."**

---

## 3. #14 (CUT) and #17 (CUT) — judged, both ACCEPT

I run 40 volunteers and I said in round 2 that what retains one past week
three is a leader noticing, not a scoreboard — I'm holding myself to that.
Badges here are flat thresholds I already flagged in round 1 as unscaled to
roster size, and that ask was never met even in the DEMOTE draft; a badge that
structurally cannot unlock for a 40-kid roster (`archaeologist` at 50,
100-count field badges) isn't motivating, it's a permanent small reminder of
insufficiency. Deleting it is consistent with my own unresolved round-1
complaint, not opposed to it — CUT closes that gap rather than leaving it
open. #17 is mechanically downstream: confetti today fires only on
`newBadges.length > 0` (`App.tsx:585-588`), never on a bare successful fix, so
once badges are gone there is no organic trigger left to gate or fix.

This only holds because the *replacement* "something to notice with" survives
elsewhere: N1/N1b (`verifiedFixes` + provenance line) and B8's Contribution
Graph (KEEP). If either of those gets cut in a later round, reopen #14/#17 —
a volunteer team with literally zero in-app acknowledgment and no leader
dashboard either is a real retention risk. As proposed now, the graph plus an
honest count is what a leader glances at Wednesday night and says thank you
over; badges and confetti were never that mechanism.
