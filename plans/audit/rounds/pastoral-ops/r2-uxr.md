# Area C — pastoral-ops — Round 2 UXR Critique (adversarial pass on proposal-v1)

## 1. Verifying the three load-bearing claims

All three checked against source and reproduce exactly as stated.

- **`classifyEvent` precedence bug** (`burnout.ts:11-25`) — confirmed by reading:
  the Serving branch (`:15`, includes `'ministry'`) runs before the Worship
  branch (`:20`). An event literally named "Kids Ministry" hits `.includes('ministry')`
  and returns `'Serving'`, full stop. This is not a hypothetical — "Kids
  Ministry" and "[X] Ministry Team" are two of the most common PCO event-name
  patterns in real usage, more common than the mock fixture's "Sunday Kids
  Church" dodge. Proposal is right, and it's the highest-leverage single fix
  named in either round.
- **`subMonths(now, 1.5)` window bug** (`drift.ts:21`) — reproduced with node
  against the actual `date-fns` install in this repo: `2026-07-29 →
  2026-05-29` (61 days), `2026-01-15 → 2025-12-15` (31 days). Confirms the
  proposal's arithmetic and its claim that the window length is not a stable
  "6 weeks" but swings by calendar month. `recentRate = recentCount / 6`
  (`:62`) then treats whatever that variable window returned as if it were
  exactly 6 weeks. This is a correctness bug in the headline number, not a
  modeling debate.
- **Co-Pilot nav `action` never compiled** — ran `npx tsc --noEmit` directly:
  `src/utils/copilot.ts(324,11): error TS2322: Type '{ label: string; view:
  string; }' is not assignable to type 'string'.` Confirmed against
  `copilot.ts:23` (`action?: string`). I went further than the proposal did:
  `CoPilot.tsx:13-19`'s `Message` interface has no `action` field *at all* —
  so even if the type error were fixed, nothing would ever read it. The
  proposal calls this "dead code that never compiled"; it's actually two
  independent dead ends stacked on each other. Worse than stated, not better.

All three stand. Round 1 (all four critics, myself included) missed all
three. Noted in §5.

## 2. Is the #20+#22 merge one screen, or panels sharing a route?

One screen — the design in §4.6 clears the bar I set in round 1. It specifies
a single person list, one row per person, a `flags:
('Overserving'|'Missing')[]` array rather than two competing vocabularies,
one export, one avatar treatment, one (to-be-unified) fetch depth. That's a
real merge, not a tab bar wearing a shared `<h3>`. Verified the two source
components are structurally identical enough to support it —
`MissingVolunteersReport.tsx:14-30` and `BurnoutReport.tsx:14-41` have the
same `{loading, error, list}` shape, same `Promise.all([fetchEvents,
fetchRecentCheckIns])` pattern, same avatar/card DOM — this was already
half-merged by convergent evolution.

Two things keep it from full marks:

1. **The correlation payoff changed, and the proposal doesn't say so.** My
   round-1 "headline feature" was Burnout+Drift co-occurring on one person
   (someone drifting in worship while still overserving). That pairing is
   gone because #21 is cut. What's left is Burnout+Missing co-occurring,
   which is a *different* and narrower story: someone who served ≥6 times in
   the first 6 of the last 8 weeks, then vanished for the most recent 2 —
   i.e., burned out and then quit, not merely drifting. That's arguably a
   sharper, more actionable signal than what I originally proposed (it's an
   ending, not a trend), but the proposal presents it as a like-for-like
   continuation of my idea when the underlying story is materially
   different. Say that explicitly in the spec, or the person who builds this
   will overclaim it in the PR description.
2. **Only the keyword-classifier config is unified; the numeric thresholds
   aren't.** §4.3 moves the Worship/Serving keyword lists into config (good,
   answers my round-1 ask). It does not touch the `serving >= 6` / `worship
   <= 2` risk cutoffs (`burnout.ts:86-91`) or the `served ≥2 in 6wk` "key
   volunteer" gate (`missing.ts`) — my round-1 defect #2 on Burnout
   ("thresholds baked into code with no way for an admin to say our normal is
   different") is carried into the merged screen unresolved, just now
   shared by two flags instead of one.

Verdict on the merge itself: **ACCEPT**, with the correlation-story caveat
above as a spec note, not a blocker.

## 3. Attacking the cuts — #19 Co-Pilot and #26 Volunteer Web

**#19 Co-Pilot → N1 Cmd+K.** I proposed this exact replacement in round 1
("Replace with a single command-palette-style search"), so I'm not going to
manufacture disagreement with my own idea. What I will flag: my round-1 open
question was "does anyone actually type free text here more than once —
instrument before deciding." The proposal skips that instrumentation and
ships N1 as a confident replacement anyway. For a chat surface this is low
risk (Cmd+K is strictly cheaper and strictly safer than a keyword router with
wrong-answer collisions), so I won't block on it, but the proposal is
guilty of the same "ship the plausible thing without checking usage" pattern
it correctly nails Recruitment's `Match Score` and Retention's funnel shape
for. Nothing of substance is lost by cutting #19 — every intent it served
has a strictly better dedicated screen, confirmed again this round.

**#26 Volunteer Web → N2 "solo with minors" tier on #25.** Here something
*is* lost, and the proposal doesn't name it. Bus Factor answers "who is
alone on a shift" — a per-shift, per-person fact. Volunteer Web answers a
structurally different question that only a graph layout can show at a
glance: **which teams never share a volunteer with any other team** — i.e.,
which ministries are informal silos with zero cross-pollination, so if one
team's volunteers all leave at once nobody else in the church has ever
worked alongside them. That's a network-connectivity property (bridging /
component structure), not a per-shift solo count, and Bus Factor's table
(`busFactor.ts:13-125`, strictly per-`(person,event)`) cannot represent it —
there's no join across events in that computation, so no successor screen
in this proposal answers "which teams are isolated" at all. I agree the
*code* deserves to die — no legend, no keyboard path, no click-through, 251
lines of hand-rolled physics for a screen nobody could act on — but the
*question* it uniquely could answer isn't picked up by N2 or anything else
in §4. If team-silo detection matters, it's a `Set`-intersection over
`buildVolunteerGraph`'s team assignments (a page of code, no physics, no
SVG) surfaced as a short list ("Kids Ministry and Production Team have never
shared a volunteer"), not a graph. Cheapest fix: fold that one list into the
same #25 screen alongside the solo-with-minors tier, or explicitly say in
the proposal that team-silo detection is out of scope for this round rather
than silently dropping it.

Verdict: **ACCEPT** both cuts as code decisions. **REJECT** the implicit
claim that N2 is a full replacement for #26 — it replaces the isolation
question, not the connectivity question, and the proposal should say that
gap exists rather than let the reader assume nothing was lost.

## 4. What round 1 raised that this proposal still leaves open

1. **Bus Factor's keyboard/screen-reader gap** (round-1 #25 defect 2: custom
   tooltip is a raw `<div>`, mouse-only, no ARIA, no keyboard path) is not
   in §4.7's rewrite list at all. §4.7 adds a severity tier and aligns
   cutoffs but doesn't touch accessibility on a screen the proposal itself
   is expanding into "the compliance item" (§3(c)) — that's the wrong screen
   to leave keyboard-inaccessible.
2. **Numeric thresholds still hardcoded** (see §2.2 above) — carried
   forward unresolved from round 1, not mentioned as a gap anywhere in §5's
   question list.
3. **"Key volunteer" definition mismatch** (round-1 #22 open question:
   does ≥2 serves/6wk match how staff actually think about "key," or does it
   undercount someone who serves rarely but critically, e.g. quarterly tech
   booth) — dropped entirely, not even carried into §5 as an open question,
   despite the merge in §4.6 making this gate more load-bearing (it now
   decides ligibility for a *flag* on the shared screen, not just a
   separate report's population).

## 5. Concession

The proposal's three independently-verified code defects — `classifyEvent`
keyword precedence, the `subMonths(1.5)` window bug, and the Co-Pilot
`action` field being dead on arrival at the type-checker — are all real, all
missed by every round-1 critic including me, and each is more damaging to
its screen's credibility than anything I found in round 1; on evidentiary
rigor this round outguns mine.

## 6. Verdicts on contested decisions

| # | Decision | My call |
|---|----------|---------|
| 20+22 merge into one screen | ACCEPT | coherent single screen, not panels; correlation story needs restating |
| 21 cut outright | ACCEPT | window bug settles it past "arguable model" |
| 19 cut → Cmd+K | ACCEPT | nothing lost; instrumentation step skipped but low-risk |
| 26 cut → folded into #25 | ACCEPT cut / REJECT "nothing lost" framing | team-silo/connectivity question has no successor anywhere in §4 |
