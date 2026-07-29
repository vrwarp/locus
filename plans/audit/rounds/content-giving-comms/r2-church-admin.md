# Area E — content-giving-comms — Round 2 (Adversarial) — church-admin

Responding to `proposal-v1.md`. I verified every load-bearing claim against source
before writing this. Findings below.

---

## 1. Fact-check of the proposal

**Newsletter test suite (§1, "the test suite codifies the minor-safety
defect"): CONFIRMED, exactly as stated.** Read `newsletter.test.ts:13-46` myself.
All three mock students — Alice (grade 8), Bob (grade 6), Charlie (grade 10) —
carry `isChild: true`. The test at line 55 asserts `md).toContain('Charlie (Mar
24)')` and `toContain('Alice (Mar 26)')`. This is not a defect the tests missed;
it is a defect the tests require. A CI run that stays green is proof the bug is
present, not proof it's absent. The proposal's framing is right and I am not
softening it.

**`App.tsx:918-922` wiring (§2.4): CONFIRMED.** Read the file directly —
`<GivingTrends checkIns={[]} events={[]} />` is exactly at those lines, and a
grep for `useState.*checkIns`, `const [events`, `fetchEvents`,
`fetchRecentCheckIns` in `App.tsx` returns zero hits, matching the proposal's
claim precisely. "Fix the wiring" is not a one-line job — there's no state to
wire. Correct call: delete, don't repair.

**Newsletter payload correction (§3, "full name + month/day, no year"):
CONFIRMED.** `newsletter.ts:64-65` — `dateStr` comes from
`toLocaleDateString('en-US', { month: 'short', day: 'numeric' })`. No year is
ever emitted. The proposal's correction of the minor critics' overstatement is
accurate and the veto correctly survives the correction anyway — a full name
tied to a specific calendar date is still enough for a stranger to find a
child at a specific point in the year, which is the part that matters.

**Genealogy inference (Q4): CONFIRMED, and I'll go further than the proposal
did.** I read `genealogy.ts:23-80` myself: every spouse/parent-child/sibling
edge is derived purely from `householdId` co-membership plus the `isChild`
boolean — nothing else. Then I checked `pco.ts` for what PCO household data
Locus actually fetches: only `household_id` (`pco.ts:274`, sourced from a
`households` relationship at `pco.ts:193-222`). There is no relationship-role
field anywhere in the fetch. So Q4's answer is not "unresolved, ask around" —
it's answerable from the code that's already in front of us: **PCO's
household resource in this codebase carries no role, and Locus does not fetch
one.** W9 (cut Genealogy, don't revive) is correct today, full stop, not
"contested pending an answer."

**`firstTimeGiver` / `firstGiftDate` (Q3): CONFIRMED fixture-only.**
`mock-api/data.js:103-107` synthesizes both fields locally; `pco.ts:19-20`
types them as attributes read off whatever `first_time_giver` /
`first_gift_date` the API returns, but neither is a documented PCO People
attribute. This is a real, if narrow, defect and belongs exactly where the
proposal routes it — Area C, against Automations (#28) — not here.

**One thing the proposal did not check and should have — the "Upcoming
Events" half of the newsletter is undated, not just possibly-stale.**
`PcoEvent` (`pco.ts:101-108`) has exactly two attributes: `name` and
`frequency`. No date field exists on the type at all. `fetchEvents`
(`pco.ts:492-505`) hits `/check-ins/v2/events` — PCO's Check-Ins **event
definitions** endpoint (the mock backs this with static entries like "Friday
Night Live," "Sunday Kids Church," "Greeter Team," each tagged
`frequency: 'weekly'`, `mock-api/data.js:214-239`) — not a calendar of
occurrences. This is PCO's list of *what kinds of things get checked into*,
not *what's happening next Sunday*. `events.slice(0, 5)` isn't a stale sort
bug that a date filter would fix — there is no date to filter on, because
Check-Ins Events don't carry one in this integration. The proposal's W7 hedges
("verify what date field `PcoEvent.attributes` actually carries first") — I
did that check for you. The answer is none. See §4 below for what this means
for the ship gate.

---

## 2. Is Area E worth keeping at all, with six of seven cut?

**Yes to the single screen, no to the "Area."** One weekly-use surface
surviving out of seven is not evidence content-giving-comms deserves to stand
as its own audit category or nav section going forward — it's evidence this
was a junk drawer to begin with (sermons, giving, comms, and a dead report
shell bolted together because they didn't fit anywhere else). Fold what
survives into wherever comms actually lives in the nav; don't keep a
one-item section standing just because the header used to have seven.

**The weekly job it does that PCO and Mailchimp don't:** neither PCO nor
Mailchimp will hand a volunteer a pre-drafted "this week's birthdays + this
week's events" block, because that requires joining People data (birthdates)
with Check-Ins data (attendance/events) — two different PCO products with no
native cross-report between them for this purpose. Today that join is a
person manually opening the People birthday report, cross-checking it against
the calendar, and retyping both into a Mailchimp draft — a real 15-20 minute
task, done weekly, by whoever writes the bulletin. Markdown output that
collapses that into copy-paste is a genuine time save and the only thing in
this area that is.

**But right now it only does half that job honestly.** The birthday half is
real (subject to the minor gate). The events half, per §1, is not "this
week's events" — it's an unsorted slice of the church's standing check-in
station list. Ship W1 (birthday gate) without also fixing the events section
and you've shipped a bulletin generator that still tells the volunteer
"Friday Night Live" and "Greeter Team" are "this week's events" every single
week regardless of what's actually happening, because that's literally all
the data source can say. That's a second credibility hazard sitting right
next to the one the proposal already caught — I should have flagged it in
round 1 and didn't.

---

## 3. What the test suite says about the rest of the codebase

If a churchgoing-minor-facing test file was written by asserting on the
code's actual output rather than a spec of correct behavior, and nobody
caught it, that is not an isolated newsletter bug — it's a demonstration that
"tests pass" in this repo is not a proxy for "safe to ship" anywhere consent,
minors, or PII-adjacent logic is involved. I'd want, at minimum, the same
check run against every other place `isChild` is supposed to gate something —
`sorter.ts:21,117` (Small Group Sorter) and `family.ts:119-120` (Family
Audit), both cited by the proposal as using the same flag correctly elsewhere.
"Used correctly elsewhere" was asserted, not verified against those tests the
same way newsletter's was. I'm not asking Area E to re-audit Area A and F —
I'm flagging that this finding should travel as a standing instruction to
every other area's critics: a green suite in this repo has already been shown
to certify a real defect once. Don't take "tests pass" as an answer anywhere
without reading what the test actually asserts.

---

## 4. Objections, with alternatives

**Reject: W7 treats the events-date problem as optional polish. It's a
second ship-blocker, same class as the birthday gate.** The proposal's own
conditional ("if it carries none, the honest fix is to change the heading")
resolves against it — I just proved it carries none. A vague "Events" heading
over an undated slice-of-5 static list is not honest, it's just less
specifically dishonest. Concrete alternative: block W1's ship gate on this
too. Either (a) source event dates from wherever Church Center schedules
services — not available in this codebase today — in which case the events
section should be cut down to nothing until that exists, and the newsletter
ships as a birthdays-only draft plus a manual "paste today's announcements
here" placeholder; or (b), cheaper and shippable this sprint, relabel the
section "Standing Ministries" (or similar) and stop calling it "Upcoming,"
with a one-line comment in the code explaining Check-Ins Events aren't
calendar occurrences so nobody "fixes" this into a fake date filter later.
Either is fine. Calling it a documentation nit and deferring it past W1, as
written, is not — it ships the second fabrication in the one screen the whole
area's justification rests on.

**Reject: N3's "Not Connected" card with a 'Request this integration' control
is scope creep on a cut, not a replacement.** Nobody in this audit — not me,
not UXR, not either minor critic — asked for a lead-capture widget inside
`ConfigModal.tsx`. The job here is "stop telling staff a sync happened when
it didn't." A single static line ("Integrations: not available in this
version") does that with zero new interaction surface to maintain, test, or
have someone eventually wire a fake "interest logged!" toast onto two years
from now. Concrete alternative: delete the route, delete the nav entry, add
nothing. If leadership wants a Mailchimp connector, that's a roadmap
conversation with the vendor question ("what would we cancel to pay for
this") attached to it — not a UI element that exists so the feature isn't
felt as "gone."

---

## 5. Concessions

- Children's critic (and by extension this proposal) beat me outright on the
  newsletter birthday block. I read the same `NewsletterArchitect.tsx` in
  round 1 and verdicted KEEP with only the "AI-assisted" label as my
  objection — I missed that it publishes minors by full name with no gate. The
  proposal is right to overrule my round-1 KEEP-as-is and bind it to the veto.
- The proposal correctly generalized my round-1 aside ("worth a literal 'copy
  to Mailchimp' affordance instead of the fake toggle") into N2 rather than
  letting it die as a one-line suggestion — that's a fair and useful pickup.

## 6. What it dropped

Nothing substantive from my round-1 findings was dropped — all five of my CUT
verdicts (#37, #38, #39, #40, #43) and the RobertReport shell CUT (#42a)
survive into §4 unchanged. The one place my round-1 position was overridden
(Genealogy KEEP-if-revived → CUT, §Q4) I now concur with after checking the
household-fetch code myself, per §1 above.
