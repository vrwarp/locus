# Area A — core-hygiene — Round 3 (children's ministry)

Scope per round brief: Q-A (Sandbox Mode), confirm/correct the Family Audit
swap replacement, and settle grade promotion build-or-delete. Not re-opening
any CONVERGED row.

---

## Q-A — Sandbox Mode: IMPLEMENT

**Verdict:** IMPLEMENT (client-side, per §3.2 option 1), scoped at minimum to
the two new bulk paths — `ArchiveCommand` and the promotion `BatchUpdateCommand`
(`src/commands/BatchUpdateCommand.ts`, already used by `handleFamilySwap` at
`App.tsx:439-450` and slated for the promotion write in §3.3).

**Would I use it?** Yes, and not as a novelty. I am not asking for a generic
"try the app risk-free" toggle — nobody opens that. I am asking for a preview
of one specific event: a batch write that touches dozens of children's records
at once, run by whichever volunteer or part-time admin is clearing the queue
that week, on data where a false positive (an active kid archived, a
correctly-held-back kid bumped a grade) is not a UI annoyance, it is a wrong
room on Sunday. Before I let that run for real against production PCO, I want
to see the whole blast radius first. That is a real workflow, not a checkbox
nobody opens — but only if the dry run produces something I can actually read
before committing, not just a toggle in Settings that quietly does nothing and
trusts me to remember it was on.

**Safety impact if shipped half-built (current state):** high. A control
labelled "Sandbox" that silently PATCHes production (`pco.ts:365-373`) is worse
than no control — a volunteer believes they tested an archive batch, sees no
error, and only learns three weeks later that the Petersons vanished from the
roster because nobody attends 4th grade the week the dad had surgery.

**What the dry run must show to be worth it** (this is the bar, not a
nice-to-have):

1. **The full per-record list, not a count.** "23 records would be archived"
   is useless; I need name, `ghostReason`/field changing, before → after value,
   for every record in the batch, before I decide to flip Sandbox off and run
   it live.
2. **Children called out separately from adults**, same as A3 in §3.1 — if any
   row has `isChild: true`, that child's name surfaces above the fold, not
   buried in a scrollable table with the household's adults.
3. **The list must be reviewable, not just logged.** §5.1's ledger satisfies
   this only if it is shown inline immediately after the dry run completes —
   exportable CSV is a nice second copy, not a substitute for seeing it on
   screen before deciding to go live.
4. **An unmistakable state indicator** that Sandbox is currently on — the
   standing banner in §3.2 is necessary, not optional. The failure mode I
   actually fear is not "the dry run confuses me," it is "I forgot Sandbox was
   on and I'm now looking at a real archive that never happened."

Without all four, this is the same lie the current checkbox already tells,
just slower. With all four, it is the thing I would reach for every single
time before an end-of-quarter ghost sweep or a promotion-week batch.

---

## Item 2 — `handleFamilySwap` deletion, confirmed

Yes — this is exactly what I meant, and the replacement is correct as
specified in §3.6.

Confirmed correct:
- Deleting the atomic two-person `BatchUpdateCommand` swap
  (`App.tsx:420-462`) with no name-confirm anywhere is right. A confirm dialog
  cannot tell a volunteer which of two unverified facts is the actual error,
  and "are you sure" about a coin flip is not a safeguard.
- The two-candidate repair card, **neither option preselected**, is the
  correct shape. Pre-selecting either one re-creates the exact failure I
  objected to in Round 1 — the UI nudging toward the wrong repair with the
  confidence of a default.
- Ordering birthdate-correction before flag-change matches reality at my
  desk: a wrong birthdate (typo, guessed, 1/1 placeholder) is the common case;
  a genuinely mis-set `isChild` flag is rare and usually already known to
  staff by the time it would surface here.
- Each action writing one field on one person through
  `UpdateStudentCommand` is the right architecture — it also means a bad
  repair costs one wrong record, not two, and undo is a single-field inverse.

**One addition, not a correction:** the card's copy for option (b) — change
the child/adult flag — must state the downstream consequence in the same
sentence, not just the field name. Something like *"This changes ratio
counts, security-tag color, and background-check requirements for this
person."* `isChild` is not cosmetic data; a volunteer who doesn't already know
that will click it as casually as a birthdate fix. That single line is cheap
and belongs in this change, not a follow-up.

---

## Item 3 — Grade promotion: BUILD

**Verdict:** BUILD (§3.3's six-point spec), not delete.

Promotion Sunday is the one week a year every room's roster, ratio math,
security-tag batch, and allergy/medical-note carryover all move at once. A
button that fires `alert('...(Mocked action)')` and locally dismisses the row
(`AutomationsReport.tsx:84`, `handleDismissPromotion`) is worse than having no
button — the volunteer working the queue believes the roster rolled over in
PCO and stops checking. The gap surfaces the following Sunday as a 2nd-grader
whose printed label still says 1st grade, at a table with no cross-reference
to catch it. Delete-the-button is the wrong fallback here specifically because
this is the one automation in the whole area where "silently does nothing"
has a same-week, in-person consequence, not a some-week-later one.

**The one thing it must not do:** auto-include, in any batch write, a child
whose grade is a **manual override already confirmed correct in PCO** —
exactly the §5.2 "confirmed correct" population, which is disproportionately
held-back and redshirted kids. `automations.ts:89`'s current `=== 1` filter
already mishandles this cohort by dropping them from the *anomaly* view; the
danger in the *promotion* write path is the opposite failure — silently
including them in a bulk grade bump because their `expectedGrade` disagrees
with the deliberately-set PCO grade. That single write is the one that puts a
9-year-old who was intentionally held back into a room with 11-year-olds,
past a ratio and security-tag boundary that exists for a reason. §3.3 point 3
("honour the override flag first... ships with the flag or not at all") is
therefore not a nice-to-have gate, it is the load-bearing precondition for
this being safe to build at all. If §5.2 doesn't ship in the same change,
grade promotion doesn't ship either — that would be building the dangerous
half.
