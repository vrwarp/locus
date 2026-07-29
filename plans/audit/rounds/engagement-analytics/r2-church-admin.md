# Area D — engagement-analytics — Round 2 (church-admin) — Adversarial Critique

Attacking `proposal-v1.md`. Not restating round 1; only what moved.

## 1. Fact-check

Re-verified against code, not against the proposal's citations:

- `fetchRecentCheckIns` default `maxPages=100` — confirmed, `pco.ts:507`.
  `AttendancePulse.tsx:27` calls it with no second arg (so 100 by default);
  `CheckInVelocity.tsx:22` calls it explicitly with `100`. Same call, same
  ceiling, both uncached. The "one feature charted twice" claim holds.
- `PcoCheckIn.attributes.kind: string` — confirmed, `pco.ts:115` (proposal
  cites `:113`, off by two but inside the interface block, not load-bearing).
  `relationships.event.data.id` — confirmed, `pco.ts:119`.
- **What the proposal did not check and should have:** `PcoCheckIn` has no
  location/room field, and `fetchRecentCheckIns` requests no
  `include=locations`. So even after D4's fix, the merged screen cannot
  produce a per-room number — only a whole-church weekly `kind` split. That
  matters for point 2 below.
- `fetchEvents` exists, `pco.ts:492` (proposal says "~495," close enough) and
  is genuinely unused by either #29 or #30 today — confirmed by grep.
- Everything else I checked (mock `kind` values at `mock-api/data.js:307` etc.,
  the Co-Pilot dependency at `copilot.ts:304-328`) matches the proposal. No
  load-bearing factual error found this round — a change from round 1, where
  UXR had two errors the proposal caught. Credit where due.

## 2. The question the whole area turns on

**PCO Check-Ins already ships this, and better than what D4 proposes.**

`kind: 'Regular' | 'Volunteer'` is not an obscure API field a Locus engineer
discovered — it is the backbone of Check-Ins' actual product pitch to
children's ministries: the live **Manage/Attendance view at the check-in
station** shows real-time headcount and volunteer-to-child ratio *per room*,
with a colour-coded warning when a room falls below the ratio a church sets.
That is the number a nursery/elementary director needs on a Sunday morning,
and PCO already puts it in front of them **live, at the point of use**, not
as a Thursday-planning historical chart. Native Attendance/Check-Ins reports
also already filter by event and by leader/volunteer check-in separately from
attendee check-in for historical trend pulls.

D4's fix — a `kind` toggle on a weekly aggregate, no room dimension because
`PcoCheckIn` carries no location relationship (see above) — cannot reach the
number that actually matters (room-level, live ratio). It reproduces, worse
and later, a number PCO already surfaces better and sooner. The proposal's
own text says the `kind` split "is what makes this screen beat PCO's native
report" (§3, line ~111). That's the claim I'm rejecting: it doesn't beat it,
it's a stale, coarser echo of it.

**Verdict: the gap does not close. Area D's attendance surface collapses to
CUT**, or to something that does not compete with PCO at all — see §3.

## 3. Attacking the decisions

**REJECT D4 (MERGE #29+#30 into `attendance`, kept as its own route).**
Concrete alternative: CUT both routes. If a shared `useCheckIns` hook (N2) is
worth keeping for rate-limit hygiene, keep the hook, not the nav slot — fold
a single small "check-in trend" sparkline into the Intelligence Home (N1) as
one card, unfiltered, with a link to "open in PCO Check-Ins" for anything
beyond a glance. Do not spend the `kind`-filter build effort (D4's biggest
line item) reproducing a ratio PCO already shows live — spend it, if at all,
on the one thing PCO's native report genuinely lacks per my r1: a giving or
first-time-guest overlay on the same week axis. Nobody in this proposal
picked that up.

**REJECT the anniversaries cut inside D7**, on process grounds. My r1 never
asked to cut anniversaries — only Deaths. The proposal's table marks Deaths
"4/4" converged and folds anniversaries into the same bullet without noting
it's 3/4 (youth + children explicit, UXR silent, me explicitly opposed —
I wanted it kept as a "who to send cards to" list). Silence isn't a vote.
Concrete alternative: keep anniversaries in the birthday-calendar demote,
gated behind the same placeholder detector as birthdays, and mark it
low-confidence in the UI ("often unpopulated") rather than deleting a real
PCO field's screen because two critics didn't need it for their lane.

**ATTACK the scope of D8/N1 (Intelligence Home as a new component/route).**
This is real net-new engineering inside an audit whose job is subtraction.
It may be justified, but the proposal doesn't do the "what would we cancel
to pay for this" math anywhere. Cheaper alternative that gets the same
result: the Intelligence role already lands on `copilot`
(`App.tsx:83`) — put the demoted cards (Demographics, Birthday Calendar, one
attendance sparkline, the coverage line) as a header strip *on top of*
`CoPilot.tsx`, not a new route + new component + new sidebar section. Ship it
if it's genuinely one new file; if it grows past that, it's Area C's
component to own, not Area D's, and shouldn't be scoped inside this proposal
at all.

## 4. Dropped from my round 1, still unresolved

- **My actual ask for #29** — "combine it with something PCO's native report
  doesn't do: giving, volunteer scheduling, or first-time guest counts on the
  same week axis" — was not picked up. D4 spent its whole budget on the
  `kind` split instead, which §2 shows doesn't clear the bar. This is the one
  that matters most; everything else in my r1 was addressed or improved on.
- **Open question 4** (does the birthday grid survive its own fix) is still
  open in the proposal itself. Round 2 should not defer it again: my answer
  is yes for birthdays specifically *only if* it ships as an exportable
  contact list ("cards to send this month"), because a heatmap grid you
  cannot act on is PCO Lists with worse ergonomics. If D7 ships without an
  export action, cut it — a picture of a cluster nobody can message is a
  demo screen with a data-hygiene fig leaf.

## 5. Concession

The cross-area Co-Pilot dependency on `calculateSentimentPulse`
(`copilot.ts:304-328`) is something I completely missed in round 1 — cutting
#36 without it would have shipped a dead deep-link, and the proposal caught
it cleanly.
