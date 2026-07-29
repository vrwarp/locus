# Area E — content-giving-comms — Round 4 — All Four Critics

Reviewed: `proposal-v3.md` + each persona's own `r3-*.md`, against the current
state of `src/` (not just the plan text — round 4 verifies claims against
disk). Ideation's position going in: all six CUTs converged, Newsletter
Architect FIX converged, "Area E" grouping dissolves, three items (H1/H2/H3)
handed off.

---

## UXR

**Verdict: OBJECTION — narrow, implementation-state, not plan-soundness.**

Round 3 accepted W1b (subtitle rewrite) as a same-commit companion to W1. I
checked current source: **W1 has shipped, W1b has not**, and the two are now
inconsistent in a way that makes the live screen actively misdescribe itself,
not just "not yet improved."

- `src/utils/newsletter.ts:32-33` — the filter is exactly the converged
  four-clause spec: `s.birthdate && !s.isChild && s.age >= 18 && s.age <= 110`,
  with the reasoning written into the code comment (`:19-31`) matching
  proposal-v3 nearly verbatim. **Verified shipped.**
- `src/utils/newsletter.test.ts:51-84` — three regression guards exist and
  match the proposal's spec exactly: flagged child (`:51-60`), unflagged teen
  (`:62-72`), placeholder DOB (`:74-84`). **Verified shipped, matches W1's
  stated requirement.**
- `src/components/NewsletterArchitect.tsx:65` — **still reads** *"AI-assisted
  markdown drafts based on upcoming calendar events and student birthdays."*
  This is the exact string flagged in `r3-uxr.md` §2. **Not shipped.**
- W2 (events-block deletion) also **not shipped**: `newsletter.ts:15-17`
  still computes `upcomingEvents`, `NewsletterArchitect.tsx:2,12-35` still
  imports `fetchEvents` and runs the full loading/error `useEffect`.

Net effect: the subtitle now says "student birthdays" on a screen whose own
filter, three lines below in the same file's history, was just hardened
specifically to *exclude* students. That's a worse inconsistency than the one
r3 flagged — it's no longer "the copy hasn't caught up to a future edit," it's
"the copy contradicts a change that already landed." Cheapest fix is still
exactly W1b as specified: rewrite `:65`, nothing else. Not blocking Area E's
closure, but whoever inherits the newsletter surface should not read
proposal-v3 and assume W1b is done because W1 is.

---

## Church Administrator

**Verdict: CONVERGED — NO RESIDUAL OBJECTIONS.**

Re-traced my own round-3 deletion-budget audit against current disk state,
since a stale-tests warning is now standing area doctrine and I should apply
it to my own prior claims, not just wait for someone else to:

- `App.tsx:11` — `RobertReport` import still commented out, still dead.
  Confirmed.
- `SERMON_TOPICS` — still appears nowhere outside `sermons.ts` /
  `sermons.test.ts`. Confirmed.
- `GenealogyGraph` — still reachable only via `RobertReport.tsx:16,338`,
  which is unreachable from any live route. Confirmed.

No change to my round-3 position: the newsletter survives as a five-minute
weekly time-save with no fabricated numbers, the four chart cuts and two
shell cuts stand, and the deletion budget is still clean. W1's shipped form
(`newsletter.ts:33`) matches the filter I amended W1 with in round 3
(`!s.isChild && s.age >= 18`) plus youth's `age <= 110` clause — I have no
objection to the final shape. UXR's W1b gap above is real but it's a
sequencing note for the implementer, not a governance or PCO-overlap
objection from my chair.

---

## Youth Ministry

**Verdict: CONVERGED — NO RESIDUAL OBJECTIONS.**

The one clause I forced into this plan in round 3 — `age <= 110` to catch a
placeholder DOB carrying a stale `isChild: false` — is not just accepted on
paper, it is **shipped verbatim**: `src/utils/newsletter.ts:33` and the
regression guard at `newsletter.test.ts:74-84` (`age: 124`, `isChild: false`,
asserts exclusion) match my round-3 spec exactly. I have nothing further to
add against the newsletter mechanism.

I looked for anything in v3 that touches grade, cliffs, or minor-safety
outside the newsletter and found nothing new — Q2 (sermon-topic annotation)
is declined and routed to Area D, correctly not my lane; the consent caveat I
attached to the parked `AppConfig` minors-flag idea (N1, §3) is carried
unchanged into v3's N1 writeup. No objection.

---

## Children's Ministry

**Verdict: CONVERGED — NO RESIDUAL OBJECTIONS** on proposal-v3 itself. All
of my round-3 positions (Q1 filter shape, Q2 cut, W10's stated limit, the
`age <= 110` follow-on hygiene item as H2) stand unchanged against the
current text and against what's shipped.

### H3 — assigned here: `sorter.ts:21,117` and `family.ts:119-120`

**Both have the identical staleness problem the newsletter filter was
hardened against, and neither has been fixed. This is squarely a household/
minor-safety finding, not a style note.**

`src/utils/sorter.ts:21` — `const adultStudents = students.filter(s =>
!s.isChild);` — and `:117` — `if (students.filter(s => !s.isChild).length
=== 0) {` — both gate "who counts as an adult for small-group assignment" on
`isChild` **alone**. No `age` cross-check exists anywhere in the file. Per
the newsletter's own hardened comment (`newsletter.ts:24-25`), `isChild` is
"PCO's manually-maintained `child` flag, not derived, so a teenager whose
record was never flagged reads as an adult." That exact minor — real age 14,
`isChild: false` from a data-entry gap — passes `sorter.ts:21` as an adult
and is placed into an adult small-group grouping (`buildHouseholds`,
consumed by `sortIntoGroups`). That is not a copy problem; it is a minor
being algorithmically routed into an adult social group. `sorter.test.ts`
(read in full) never constructs this case: every child fixture is
`isChild: true` at a plausible child age (`:31,54`), so the suite is silent
on the mismatch, not passing because it's been checked.

`src/utils/family.ts:119-120` — `const parents = members.filter(m =>
!m.isChild);` / `const children = members.filter(m => m.isChild);` — same
bare-flag split, feeding `checkSpouseGap` and the parent/child age-anomaly
checks. **`family.test.ts:40-41` inadvertently demonstrates the gap live**:
`mockStudent('1', 'Dad', 10, false, 'h1')` — a 10-year-old classified as a
non-child "Dad" — is accepted by the code with zero complaint on its own; the
test only asserts the *reverse* pairing (`'Son', 40, true`) trips the "child
older than parent" check. Flip the ages generating that fixture and a
10-year-old "parent" produces no anomaly at all, because nothing in
`analyzeFamilies` sanity-checks an adult's age independent of a paired
child — there is no equivalent of the newsletter's `age >= 18` floor. A real
minor misclassified this way could be treated as the household's
`familyName` source (`:121-122`, `firstParent`) or as a `checkSpouseGap`
candidate — the age-gap-between-spouses check would fire on real numbers
computed from a fictitious "spouse."

**Finding: yes, same problem, unfixed, in both files.** Neither is in Area
E's scope to fix, and I am not proposing to reopen Area E for it — this
confirms H3 as written and gives it the file:line detail admin's original
citation lacked. Recommend the owner who picks up H3 treat this as two
sites needing the newsletter's exact pattern (`!isChild && age`-bounded),
not one.

---

## Summary of round-4 status

Three of four critics: **CONVERGED, no residual objection.** UXR: one
narrow, verified objection — W1b has not shipped alongside W1, leaving the
newsletter subtitle actively contradicting its own (now-hardened) filter.
H3 is confirmed live in two more files, assigned here to children's ministry
as the safety-correctness owner of household/adult-child classification.
