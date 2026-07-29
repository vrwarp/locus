# Area E — Round 3 — Youth Ministry

## 1. Q1 — the exact filter, including missing/placeholder birthdate

Traced `transformPerson` (`pco.ts:229-289`): `if (!birthdate) return null;` at
`:233-235`, and again `if (isNaN(dob.getTime())) return null;` at `:239-241`.
**A person with no birthdate, or an unparseable one, never becomes a `Student`
at all** — they are absent from `students[]` system-wide, not just from the
newsletter. So "missing birthdate" is not reachable inside `newsletter.ts`;
`s.birthdate &&` (`:21`) is redundant defense-in-depth, not the real gate.
Confirmed `students` passed to `generateNewsletter` is exactly this
transformed array (`NewsletterArchitect.tsx` → `App.tsx`) — no second
construction path bypasses `transformPerson`.

**Placeholder birthdate is the live danger**, and it's a *different* failure
mode than "missing": a placeholder like `1900-01-01` (the standard ChMS
sentinel for "DOB unknown") is a syntactically valid date. It survives both
`transformPerson` guards, produces `age ≈ 126`, and — because `isChild` is
independently maintained and can be stale in *either* direction — nothing
stops a real 14-year-old with that sentinel DOB from carrying `isChild:
false`. `age < 18` doesn't catch this either: 126 is not less than 18. This
is a genuine minor that both proposed checks (`!isChild` alone, and
`age < 18 || isChild`) let through.

I checked the codebase's only other stale-`isChild` cross-check —
`automations.ts:115`, `.filter(s => s.age === 18 && s.isChild)` — and it only
catches the *safe* direction (over-flagged adults), confirming nobody has
ever written the unsafe-direction check anywhere in this repo.

**Ruling — fail closed on implausibility, not just on age threshold:**

```js
students.filter(s =>
  s.birthdate &&
  !s.isChild &&
  s.age >= 18 &&
  s.age <= 110
)
```

The upper bound is not decorative. Without it, `!isChild && age >= 18` still
publishes the sentinel-DOB minor, because 126 clears 18 easily. 110 is chosen
to almost never exclude a real elder while catching every placeholder date
I've seen in practice (1900, 1901, 1/1/1970-epoch-zero substitutes). The cost
of a false negative here (an actual centenarian's birthday omitted one week)
is trivial; the cost of a false positive is a safeguarding incident.

**What this does NOT close, and I won't pretend it does:** a placeholder DOB
that lands inside the plausible adult range (someone guesses "2000" for a kid
whose real birth year is 2011) is not catchable by any birthdate-shaped
filter — it *is* a plausible adult age. That residual risk is a data-quality
problem (accurate `isChild` maintenance at the PCO-admin level), not
something `newsletter.ts` can solve. Say so in the code comment next to the
filter, not just in this doc, so the next implementer doesn't think the age
bound is a complete fix.

## 2. Q2 — cutting the events block entirely

**ACCEPT**, and it costs my Wednesday-night audience nothing, because the
block was never useful to me even in a hypothetically-fixed form. Two
independent reasons:

1. This newsletter is a whole-congregation bulletin (adult birthdays, generic
   sermon topic, pastor notes) — it was never a youth-ministry surface. I
   don't hand a "Weekly Ministry Update" to a small group leader on a
   Wednesday; I need dated student-ministry events (retreat, lock-in, DNow),
   not congregation-wide birthdays.
2. Even a *repaired* events block couldn't carry what I'd actually need. The
   proposal is right that PCO Check-Ins `events` are recurring definitions
   with no date field, and that dated occurrences live in
   `event_times`/`event_periods`, which Locus fetches nowhere. A relabel to
   "Standing Ministries" doesn't get me a retreat date either — that requires
   a real build against a resource this app has never touched, which is
   correctly out of scope for a subtraction pass.

If leadership wants a real Wednesday-night events surface later, it needs
`event_times`/`event_periods`, not a rename of what's here. Note that for
whoever inherits this, not a build-now ask.

## 3. Other objections to v2 — brief

One, minor, forward-looking: §3/W1's parked idea of an admin-owned
`AppConfig` flag to someday include minors' birthdays is described as
solving the access-control problem (admin-only, no runtime toggle). It
doesn't solve the *consent* problem — a blanket "include all minors" switch
still publishes every student's name and DOB into an artifact that leaves
the app, with no per-family opt-in. If it's ever built, it needs
per-student/per-guardian consent tracking, not a single boolean, or it
reintroduces the exact light-switch problem I vetoed in Round 2 one layer up
the stack. Not blocking — it's explicitly deferred and unbuilt — but don't
let "admin-owned" be mistaken for "consent-shaped" when someone picks this
back up.

Nothing else in v2 draws an objection. #37-#43 verdicts and the area
dissolution stand as converged.
