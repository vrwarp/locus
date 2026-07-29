# Area E — Round 3 — Children's Ministry

## 1. Q1 — the filter, ruled from source

**Verdict: `age < 18 || isChild` is the right compound gate, and the "missing
birthdate" fail-open/fail-closed question does not arise at `newsletter.ts` —
it is already closed, application-wide, one layer upstream.**

`transformPerson` (`pco.ts:229-241`) returns `null` — not a `Student` with an
unknown age — whenever `birthdate` is absent (`:233-235`) or fails
`Date`-parsing (`:237-241`). `pco.test.ts:150-161,179-190` pin this: "returns
null if birthdate is missing" / "if birthdate is invalid." Both `App.tsx:237`
and `:397` map-and-filter through `transformPerson` before anything downstream
ever sees a `Student`. So a record with no usable birthdate never becomes a
`Student` at all, for the whole app, not just the newsletter — `age` is
therefore **never undefined on any `Student` that exists**. There is no
ambiguous case for `newsletter.ts` to fail open or closed on; it's foreclosed
by construction, verified from source, and it's a global guarantee, not a
newsletter-local one. (`newsletter.ts:21`'s `s.birthdate &&` guard is now
dead/redundant — harmless to keep, not required.)

**Exact spec:**
```
students.filter(s => s.birthdate && !s.isChild && s.age >= 18)
```
equivalently: exclude when `s.isChild || s.age < 18`. This is an **OR-gated
exclusion**, not the AND-gated inclusion pattern the rest of the codebase uses
(`automations.ts:169` `age===0 && isChild`, `:176` `!isChild && age>=75`,
`sorter.ts:21` `!isChild` alone) — those pick a target group where both
signals agreeing is the point; this is a safety veto where either signal alone
must be enough to suppress. Don't copy the AND idiom here.

**The residual risk missing-birthdate handling can't touch:** a *present but
wrong* birthdate — the classic "entered as 1/1" placeholder this agent already
flags as systemic (item 4 of what I know). That parses as valid, yields a
concrete but false age, and if it lands ≥18 while `isChild` is independently
stale/false, both halves of the compound gate pass and a minor still
publishes. No birthdate/isChild-only check can distinguish a true adult from a
mis-dated child. There's no `detectBirthdateAnomaly` in `pco.ts` the way there
is for email/phone/address (`:255-258`). I am not blocking W1 on this — it's a
pre-existing, app-wide data-integrity defect, not something W1 introduces —
but it should be logged as a follow-on hygiene item, same family as the
existing anomaly detectors, with a plausibility ceiling (e.g. age > 100 →
treat as suspect, exclude rather than trust) as the fail-closed default when
it's eventually built.

## 2. Q2 — CUT vs. relabel the events block

**ACCEPT.** The reasoning is sound and matches this audit's own standard for
#37-40: a structurally undated resource (`PcoEvent` has no date field, and
`event_times`/`event_periods` are fetched nowhere in `src/` or `mock-api/`)
cannot be relabelled into honesty, and leaving `fetchEvents` wired in is
exactly the kind of live hook a future "just add the date filter" patch
reaches for without re-deriving that the data can't support it. Deleting the
fetch is the correct way to make that mistake harder to make again.

## 3. Anything else objected to

None. W10's stated limit (draft persistence does not extend the minor gate
over free-text `pastorNotes`) is correct and necessary to say explicitly.
Q2's condition — any revived sermon-topic surface must disclose it folds
children's check-ins into a congregation-wide attendance number — is carried
correctly. `BatchUpdateCommand.ts:30-32` confirms `isChild` is a directly
admin-editable field via the UI, reinforcing why it can't be trusted alone.
