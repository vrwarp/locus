# Area F — relational-tools — Round 2 (youth-ministry rebuttal)

Responding to `plans/audit/rounds/relational-tools/proposal-v1.md`. Verified
against source before writing anything below.

---

## 1. The correction — conceded, and it is worse than the proposal even says

Checked: `grep -n "prayer\|small-groups\|locus-public" src/components/SidebarCore.tsx
src/components/SidebarIntelligence.tsx` returns zero hits in `SidebarCore.tsx`
and six in `SidebarIntelligence.tsx` (`:189-190, 197-198, 206-207`). I was wrong
in r1 to describe Prayer Match as reachable from "logged into Locus Core" — it
isn't reachable from Core at all. **Conceded.**

The proposal is also right that this makes it worse, and I'll sharpen why.
`SidebarIntelligence.tsx:188-201` places "Prayer Partner Match" and "Small Group
Sorter" back-to-back, immediately before the `Tools` section header at `:204`,
inside the sidebar `LandingPage.tsx:26-30` sells as "Executive Dashboard /
Boardroom Ready Analytics." The persona who opens that workspace is a pastor or
board member consuming reports, not the data custodian who spends their day
inside `isChild` edge cases and household hygiene. That person is *less*
equipped to catch a cross-generational pairing on a grief/addiction topic than
the Core-side staff I originally (wrongly) assumed had it. Fewer safety-literate
eyes on the one feature in the app that auto-introduces a minor to an adult
stranger. Agreed: worse, not better.

---

## 2. #45 — the question the proposal names me on

**My answer: (b), out of scope for Locus — but I reject that a rename is
sufficient, and I'm attaching a condition the proposal doesn't have.**

Agreed with the proposal's refusal to bolt on grade/gender/leader-capacity/
keep-apart logic. I said this myself in r1 ("worse than not sorting at all")
and the proposal's own reason is correct and I'll extend it: `Student`
(`pco.ts:71-99`) has no `gender` field *at all* — I checked further than the
proposal did. `grep -ni "gender" src/utils/pco.ts mock-api/data.js` returns
nothing. Real PCO People has a gender field; Locus doesn't ingest it. So a
"hard gender constraint" isn't a missing line of code, it's a missing pipeline.
A "keep-apart pairs" list is worse: there is no incident/safeguarding data store
anywhere in this codebase, and per my r1 finding on #47, there is no per-person
auth to gate who could read or write such a list if one existed. Building
keep-apart into a system with a shared org-wide credential and (per this
proposal's own F6 finding) a plaintext fallback on decrypt failure would create
a second, worse safeguarding artifact: a list of which teens must be kept apart,
sitting in the same weakly-protected local cache as everything else. I will not
trade a missing-constraint tool for a leaking-constraint-list tool. Scoping a
separate youth tool (option a) is premature until #47/#48 have a real answer,
not this round.

**Where I diverge: rename is not sufficient, and the proposal doesn't test its
own assumption.** The proposal's safety argument rests entirely on
`buildHouseholds` (`sorter.ts:21`) filtering `!s.isChild`. I checked what
`isChild` actually is: `pco.ts:273` — `isChild: !!child` — a direct pass-through
of PCO's household-relationship flag (`mock-api/data.js:124,199` — hardcoded at
generation, not age-derived). This is exactly the field type I flagged in my own
agent brief (point 1: grade is volatile and wrong; point 6: household structure
is messy) — a household "child" designation is a role a staffer sets, not a
computed fact, and it goes stale constantly for 17-18-year-old seniors: a
self-supporting student, a teen given their own giving record, a household typo.
Any such student is *not* excluded by `buildHouseholds` and lands in the adult
pool to be algorithmically paired with 40-, 60-, 70-year-old strangers with zero
warning — the exact harm the proposal already conceded is unacceptable for #44,
now reachable through #45's supposedly-safe filter. A rename changes what the
sidebar link says; it does nothing to this code path.

**Condition for keeping #45 in the product at all:** add a hard input-time
guard, not a silent filter — refuse to run (visible error, not a quietly smaller
output) if the input set contains any record with `isChild === true` **or**
computed `age < 18` (use `age`, `pco.ts:245`, which is birthdate-derived and far
more reliable than the household-role flag). This does two things a rename
can't: it closes the stale-flag leak, and it gives an operator who tries to
point this at a youth roster an explicit "adults only" rejection instead of a
plausible-looking, silently-thinned output they might mistake for correct.
Without this guard, I do not accept SIMPLIFY — I'd move to CUT on the same
minor-safety logic that closed #44.

---

## 3. Decisions I attack, with alternatives

**Attack — F4's "coverage caveat" doesn't cover the gap that matters to me.**
The proposal adds a "sorted from N loaded records — not the full roster" notice
for the 500-record pagination cliff. That's a different problem than the
isChild-staleness leak above; shipping it as the *only* caveat implies the input
set is otherwise clean. **Alternative:** the guard in §2, not a disclosure
banner — a banner is informational, a leak into cross-generational pairing needs
a hard stop.

**Attack — F1 (delete Prayer Match) is right but incomplete on the shared
field.** The proposal correctly declines to delete `Student.prayerTopic` in
this change and punts to Area D. Fine as a sequencing call, but the proposal
should say plainly, in this document, that `prayerTopic` remains ingested from
PCO and cached (per its own F6 finding, in at least one plaintext store) even
after Prayer Match is deleted — the disclosure risk for a minor's addiction/grief
topic doesn't end when the pairing UI is deleted, only the *introduction* risk
does. **Alternative:** F1 should include a one-line flag in the commit that says
this explicitly, so Area D doesn't have to rediscover it from scratch.

---

## 4. Dropped / conceded

**Dropped:** the proposal never revisits whether `isChild` is a trustworthy
safety boundary anywhere in the document — it's treated as ground truth in F4
and nowhere interrogated the way `appId`-as-password or the sandbox header was.

**Conceded:** the correction in §1, and the proposal's core F4 argument that a
genetic algorithm bolted onto an adults-only sorter should not be extended with
fake safeguarding logic — I said the same in r1 and the proposal's framing
("silently lacking the constraint is worse than not building one") is a cleaner
statement of my own point than I made it.
