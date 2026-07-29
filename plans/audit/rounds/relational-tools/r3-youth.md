# Area F — Round 3 — youth-ministry

## 1. #45 guard — reasoning confirmed, final refusal form

Verified: `pco.ts:233` `transformPerson` returns `null` when `!birthdate`, so
every `Student` that exists in the app has a birthdate-derived `age`
(`pco.ts:243`, `differenceInYears`). No null/undefined case for `age < 18` to
miss. `isChild` (`pco.ts:273`, `!!child`) is the unreliable one — a
staffer-set household role, stale for exactly the 17-18-year-olds with their
own giving record.

`sorter.ts:21` — `students.filter(s => !s.isChild)` — runs *before*
`buildHouseholds` and before any age check exists in this file today. If F5's
guard is added anywhere else (a wrapper, the component) but this line stays,
the minors are silently dropped from the *input* before the guard ever sees
them: no refusal fires, the group list just comes back one household short,
and the operator reads that as "clean roster," not "a minor was here." The
proposal's instruction to delete this line is correct and load-bearing, not
cosmetic.

**Final refusal, as it should appear to the operator:** a full-stop error
state in `SmallGroupSorter.tsx`, not a toast — something a leader glances at
mid-Wednesday-night and understands without asking staff: *"N records in this
roster are minors or household children (isChild or age < 18). This tool
sorts adult small groups only — remove them from the source view and re-run."*
No partial group output alongside it.

## 2. Placeholder-birthdate hole — yes, same upper bound is needed here too

Confirmed elsewhere in this audit (`content-giving-comms/proposal-v3.md`,
`r3-church-admin.md:39-43`, `r3-youth.md:16-51`): a placeholder DOB like
`1900-01-01` — the standard "unknown DOB" ChMS convention — is a *valid*
birthdate string. `transformPerson` accepts it, `differenceInYears` returns
~126, and `age < 18` is false. A real minor whose record got a placeholder
instead of a true birthdate (or whose `isChild` was never ticked *and* whose
birthdate is a placeholder) sails through F5's guard as a 126-year-old
"adult" and lands in a cross-generational group. This is the identical
failure mode the newsletter fix closed with `age <= 110`.

**The sorter guard needs the same upper bound.** Refuse condition becomes:
`isChild === true || age < 18 || age > 110`. Implausibly old is not a
different kind of problem than implausibly young here — both mean "this
record's age cannot be trusted to gate a minor-safety check," and the correct
response is the same refusal, not a pass-through.

## 3. Surviving objection

None on #45 itself. One scope note: F5 as drafted checks age bounds only; it
still says nothing about a *plausible-but-wrong* DOB inside the adult range
(a guessed "2000" for a kid born 2011) — same residual gap proposal-v3 named
for the newsletter. That's a data-quality problem no per-feature guard closes
alone; flag it for core-hygiene, not a blocker on F5 shipping.
