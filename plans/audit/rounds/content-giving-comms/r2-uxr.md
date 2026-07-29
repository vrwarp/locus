# Area E — content-giving-comms — Round 2 (UXR adversarial)

## 1. Fact-check of the two corrections against me

Both hold, verified independently.

- **App.tsx state.** `grep -n "useState\|fetchEvents\|fetchRecentCheckIns" src/App.tsx`
  shows the only `checkIns`/`events` tokens in the file are the two literal `[]`
  arguments at `App.tsx:920` itself. No `useState` for either, no call to
  `fetchEvents`/`fetchRecentCheckIns` anywhere in the file. Proposal is right:
  "fix the wiring" is not a one-line argument swap, it's adding a fetch the
  component tree doesn't have. My round-1 "typo" framing was wrong.
- **Newsletter birth year.** `newsletter.ts:64` — `toLocaleDateString('en-US',
  { month: 'short', day: 'numeric' })`. No `year` key requested, no year in
  output. Confirmed: month/day only, never birth year.

## 2. Stress-testing the six cuts — is Area E over-corrected?

Checked against the standing fact (no Giving API) plus what the code actually
fetches:

- `PcoEvent` (`pco.ts:101-108`) has exactly two fields: `name`, `frequency`.
  It comes from the Check-Ins v2 `/events` endpoint — recurring service
  *definitions*, not dated occurrences. There is no date field to sort on
  anywhere in the type, which matters for §4 below.
- `firstTimeGiver`/`firstGiftDate` (`pco.ts:19-20, 95-96`) is the only
  giving-adjacent signal that exists, and it's populated exclusively by
  `mock-api/data.js:103-130`, not a documented PCO People attribute. I looked
  for a way to build an honest #40-replacement out of it (e.g., "new givers
  this week" as a count, no dollars) and concluded I can't recommend it — it
  has the identical fixture-only problem the proposal already flagged as Q3.
  This is not new ground; it confirms the proposal's own routing to Area C
  was correct, not a dodge.
- `GivingRiver` at `GivingRiver.tsx:34` is `React.FC<{}>` — literally zero
  props, no `auth`, no `fetch` in the file or in `giving.ts`. There is no
  honest residue to salvage; agree CUT.
- Sermon Sentiment's honest residue (attendance only) is a strict subset of
  what `AttendancePulse.tsx` already renders live off the same
  `fetchRecentCheckIns` call (`AttendancePulse.tsx:27-28`). Agree CUT doesn't
  lose real value — it duplicates a live screen.

**Where I think it under-corrected, not over-corrected:** Q2. The proposal
identifies that the honest input for "did the sermon move engagement" already
exists — a free-text `sermonTopic` field the pastor types into Newsletter
every week (`NewsletterArchitect.tsx:71-79`) — and then declines to build
anything with it, parking it as an open question for round 3. That's the one
real pastoral question in this area ("did attendance move around what I
preached last week") that Locus could answer honestly today, cheaply, and
chose not to commit to. See §4.

## 3. Decisions I contest

**REJECT — leaving Q2 unresolved.** Persist `sermonTopic` per week (a map
keyed by ISO week, stored the same way `pastorNotes` drafts would be) and
render it as a text label on `AttendancePulse`'s existing real chart —
"Week of Mar 24: 'Faith Over Fear'" under the real attendance line. No new
screen, no synthetic multiplier, no second y-axis. This is materially
different from the deleted #37/#38: the topic is operator-entered fact, not
`SERMON_TOPICS[index % 8]`, and nothing is computed *from* it — it's an
annotation, not a correlation. Cost is smaller than W7. Round 2's job is to
force a decision, not carry a question to round 3 that has enough evidence to
close now.

**REJECT — declining Newsletter draft persistence as "wrong round."**
This is not polish, it's the same class of defect as the birthday gate: a
real Thursday-night user moment (Sarah loses a typed `pastorNotes` paragraph
to an accidental tab close) that costs nothing to fix (`localStorage`, same
pattern the gamification widget already uses for persisted state) and was
flagged in round 1 without a factual rebuttal — it was declined on scheduling
grounds only. Bundle it into W1 since that commit already touches this file
and its options object.

**REJECT (partial) — W7's "~10 lines" estimate for event ordering.**
Verified: `PcoEvent` never carries a date (`pco.ts:101-108`), and `fetchEvents`
hits the Check-Ins v2 `/events` endpoint, which returns recurring event
*definitions* (name + frequency), not dated instances. There is no field to
sort by — this isn't a missing filter, it's a missing API call to a different
resource (event *times*/periods) that Locus has never fetched. The proposal's
own hedge ("if it carries none, change the heading instead") is the correct
call and should be the *committed* fix, not a conditional — rename "Upcoming
Events" → "Events" and cut `.slice(0, 5)` down to whatever's returned, full
stop, this round. Treating real date-sorting as a deferred, separately-scoped
feature (new fetch + new PCO include) rather than bundling it at "~10 lines"
next to the heading rename.

## 4. What it dropped from round 1 that's still unresolved

- **Draft persistence** (above) — explicitly declined rather than argued
  against on the merits.
- **Q2** carries forward my round-1 open question about manual sermon
  tagging but stops short of deciding it despite having identified the exact
  mechanism (the discarded `sermonTopic` field) that would make it honest.

## 5. Concession

The test-suite catch — `newsletter.test.ts:13-46` builds three mock students
all `isChild: true` and asserts their names+dates appear in output
(`:59-63`), meaning the current tests actively enforce the privacy defect and
any "keep tests green" fix silently reverts it — is a sharper, more
actionable finding than anything in my round 1, which flagged the missing
gate but never looked at whether the test suite would fight the fix.
