# Area E — content-giving-comms — Round 5 — Final sign-off

Reviewed: `proposal-v4.md` against the working tree at `96daaa0`. All four
critics were asked for a ruling, not a re-litigation. All four sign off.

Note on the tree: it is mid-flight. `RobertReport.*`, `GenealogyGraph.*`,
`src/utils/genealogy.ts` (plus `EmergencyAlerts.*`, `VolunteerWeb.*`) are
**staged deletions** from a concurrent relational-tools pass, so W8/W9 may land
without Area E doing anything. Locators below are anchored on symbols, not line
numbers, because the numbers are moving.

---

## UXR

**Verdict: CONVERGED — SIGN-OFF. My round-4 objection is closed on disk.**

`NewsletterArchitect.tsx` now heads *"Weekly Update Draft"* with the blurb
*"A markdown starting point: this week's adult birthdays, plus whatever you type
in below. Nothing is sent anywhere — copy it out when you're happy with it."*
"AI-assisted" is gone, "calendar events" is gone, "student" is gone, and the
blurb now tells Sarah the one thing she needed to know and previously had to
guess: **nothing is sent anywhere.** That is better copy than W1b specified. No
objection to any verdict in §2.

Two **doubts**, neither blocking, both cheap, both for whoever picks up W2:

1. **The nav label and the screen heading now disagree.**
   `SidebarIntelligence.tsx` still reads *"Newsletter Architect"*; the screen
   says *"Weekly Update Draft"*. Sarah clicks a word that is not on the page she
   lands on. That is an information-scent regression created by the fix, and
   it costs one string. Do it with W2, not separately.
2. **W2 is still the load-bearing one for me.** `newsletter.ts` still emits
   *"No major events scheduled for this week."* when the events array is empty —
   and against a real PCO tenant it is *always* empty, because Check-Ins Events
   are recurring definitions with no date. A false statement of fact in the
   default state is worse than a missing section. Unchanged from v3; still the
   highest-value item left in this area.

**Open question, unchanged and unanswerable here:** does anyone paste this
draft anywhere? One week of watching one admin settles the whole screen.

---

## Church Administrator

**Verdict: CONVERGED — SIGN-OFF. Nothing further from my chair.**

Giving River and Giving Trends are gone — components, CSS, tests, `giving.ts`,
`givingTrends.ts`, routes and nav entries. That closes the item I cared most
about: a finance chair could no longer read a six-figure fund-flow number off a
Locus screen and repeat it in a stewardship conversation.

One thing I want on the record before this area closes, because it is the same
defect surviving in a different room: **a fabricated giving series is still
live.** `sermons.ts` computes `givingVolume = attendance * 25`, multiplied by
2.5 when the topic string contains "generous" or "giving", and
`SermonSentiment.tsx` renders it behind a checkbox labelled *"Overlay Giving
Volume"* on a right-hand axis labelled *"Giving Volume ($)"*. Locus has no
Giving API access. Deleting the two giving screens and leaving this is deleting
the sign and keeping the number. **This is already W6 in the plan** — I am not
adding work, I am saying W6 is a giving-integrity item and not merely a
sermon-chart item, and it should not be the last thing on the list.

Deletion budget re-checked: `SERMON_TOPICS` is still confined to
`sermons.ts`/`sermons.test.ts`; `AppConfig.integrations` is written only by
`IntegrationsHub.tsx` and defaulted inertly in `storage.ts`. Still clean.

---

## Youth Ministry

**Verdict: CONVERGED — SIGN-OFF.**

The `age > 110` clause I forced in is now in the shared predicate rather than
one file's filter, which is strictly better than what I asked for, and
`recruitment.ts` picking it up (H3-c) closes the case I would have escalated:
a 15-year-old who attends worship and doesn't serve is no longer surfaced to a
staff member as someone to ask about volunteering.

**One minor-safety flag, and it is about the tests, not the code.** H3's whole
point is that "tests pass" is not evidence. Applied to H3's own fixes:

- `isMinor` has **no unit test**. `pco.test.ts` never names it.
- `recruitment.test.ts` — the `excludes children` case builds
  `createPerson('3', 'Timmy Tiny', true, null, 10)`: flagged **and** age 10.
  Revert `isMinor(student)` to `student.isChild` and the suite stays green.
- `sorter.test.ts` — same shape. Every child fixture is `isChild: true` at a
  plausible child age.
- `SmallGroupSorter.test.tsx` — the new refusal path (the `role="alert"` banner
  and the disabled button) has **no test at all**; both fixtures are adults.

Only `newsletter.test.ts` actually holds the line, with its three guards. So
three of four `isMinor` call sites are protected by a predicate that nothing
asserts. That is the exact silence children's found in `sorter.test.ts` in round
four, one layer up. **Not a reason to reopen anything — the code is right.** It
is a one-fixture-per-file follow-on and it belongs with H3-d.

---

## Children's Ministry

**Verdict: CONVERGED — SIGN-OFF, including on being overruled.**

I recommended H3 be fixed identically in `sorter.ts` and `family.ts`. Ideation
overruled the second half and produced the failing test as proof:
`family.test.ts` constructs a ten-year-old declared a non-child "Dad", which is
exactly the disagreement `analyzeFamilies` exists to detect, and folding flag
and age together there deletes the detector's own input. **That is correct and I
withdraw the recommendation.** The rule as written in `pco.ts` — treatment reads
use `isMinor`, claim reads read both fields separately — is the right shape and
is the most portable thing this area produced.

What I asked for on the sorter landed better than I asked for it: it does not
filter minors out, it **refuses** — names the count and produces nothing until
the roster is narrowed. A tool that silently thins the list it was handed
teaches a volunteer to trust an output that isn't what they asked for. Refusing
is the correct behaviour at a folding table.

The narrower thing left in `family.ts` is unchanged and correctly routed:
nothing sanity-checks a declared parent's age on its own, so a 10-year-old
"parent" produces no anomaly unless paired with an older child, and can still
become the household `familyName` source or a `checkSpouseGap` candidate. That
needs a **new detector**, not the shared predicate. Handed off, not reopened.

**Safety impact of everything still pending in this area: none.** The remaining
items are deletions and one events block.

---

## Round 5 status

Four of four: **CONVERGED, sign-off, no residual objection.** Zero open
questions. Three follow-on notes, none blocking, all already owned by an
existing handoff or an existing work item: the nav-label/heading mismatch
(fold into W2), the fabricated `givingVolume` overlay (already W6, re-priced as
a giving-integrity item), and the missing regression fixtures behind three of
the four `isMinor` call sites (H3-d).
