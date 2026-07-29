# Area D — engagement-analytics — Round 2 UXR Critique (adversarial)

## 1. Fact-check of the proposal's load-bearing claims

All three flagged corrections verified against code — **all three are correct**:

- **No Dashboard on Intelligence.** Confirmed: `SidebarIntelligence.tsx:17-` has zero
  `dashboard` nav entry, and `handleSelectRole` (`App.tsx:81-83`) routes the
  `intelligence` role to `'copilot'`, not `'dashboard'`. My R1 open question on
  #29 ("does he already get the same signal from the Dashboard") presupposed a
  screen this persona cannot reach. That's a real error in my own R1, not a
  nitpick — see §5.
- **birthdate-null loss lives in `transformPerson`.** Confirmed: `pco.ts:233-234`
  (`if (!birthdate) return null`) and `:239-240` (invalid-date `return null`),
  wired through `App.tsx:236-237` and `:397`. `GenerationStack`'s own `'Unknown'`
  bucket (`demographics.ts:26,30-38`) can now only be reached by a birth-year
  outside the `GENERATIONS` range (i.e., a future date) — I confirmed this by
  reading `calculateDemographics` line by line: every null/unparseable case is
  already gone before the array reaches the chart. My R1 framed this as a
  GenerationStack-local bug and proposed a per-chart caption; that undersells the
  blast radius. The proposal's "fix once, globally" (D9) is the correct scope.
- **Cutting #36 requires editing `copilot.ts`.** Confirmed: `copilot.ts:303-328`
  has a live "Sentiment / Spiritual Climate" intent that calls
  `calculateSentimentPulse` and deep-links `view: "sentiment-pulse"`, plus a
  reference in the fallback help string at `:334`. Deleting the component without
  this edit ships a Co-Pilot answer that routes to a 404. Correct catch, and one
  neither I nor any R1 critic made.

Also independently re-verified and confirmed accurate: the `fetchRecentCheckIns`
default `maxPages=100` / `per_page=100` (`pco.ts:507`) called separately by both
`AttendancePulse.tsx:27` and `CheckInVelocity.tsx:22` (duplicate ~10k-record
fetch); zero `kind`-field reads anywhere in the eight Area D files (grep
confirms); `MapView.tsx:28`'s unguarded `clusters.slice(0, 20)`; per-person (not
per-household) counting in `geospatial.ts:11`. I did not find any inaccurate
citation in the document. The proposal's fact-work this round is solid — better
verified than my own R1 in at least one place (#33).

## 2. Answering the open question directly — does merged Attendance earn a nav slot?

**No. It should not keep a standalone sidebar route.** Fold it into a card on
Intelligence Home (N1), not a full `attendance` screen.

The proposal's own argument for keeping it is circular: it justifies the slot by
promising engineering that doesn't exist yet (kind split, event filter,
`useCheckIns` hook) and defers the actual demote-to-card step "until there is an
Intelligence home" — but D8 builds that home in this same batch of work. There
is no reason D4 gets a permanent full-page route while D6 (Demographics) and D7
(Heatmap) — both of which the document itself judges "honest, correct" and worth
keeping — get demoted to cards. Correctness and real data aren't what earns a
nav slot; distinct, repeated, time-pressured task completion is (per the agent
brief's #1 principle). A weekly check-in count, even split by `kind` and
filterable by event, is exactly the kind of glanceable number a card handles:
"342 regular / 58 volunteer this week, ▾3% vs last" with a "view arrival-pace
detail" expand link for the rare person who wants the curve. If usage ever shows
Robert opens this page every week and the card is too cramped, promote it back —
but ship the smaller thing first. This pushes Area D's net nav change from "8 →
2" to **"8 → 1"** (Map View is the only screen with page-worthy interaction: a
threshold slider and a suppressed-count disclosure). Everything else lives on
Intelligence Home.

## 3. Decisions I contest

### 3a. N1 Intelligence Home has no size/interaction budget — REJECT as specified
D6 puts a bar chart with a two-option segmented control on the home page. D7
puts a 12×31 interactive grid (with hover tooltips and a placeholder-detection
overlay) on the home page. D4 (per my §2) should add an attendance card too.
That's three non-trivial interactive widgets stacked on one landing screen for a
persona the brief describes as having "the least time and least tolerance for
decorative screens." The proposal explicitly bans a new aggregate score
("no aggregate health score — that is what Global Pulse was") but never bans
*aggregate screen length*. Without a stated budget, N1 will regrow into the same
flat list it replaces, just rendered as boxes instead of nav rows — same
scroll-and-scan cost, same failure to answer "what needs my attention today,"
now with the sidebar *and* the home page both needing a redesign in round 3.
**Concrete alternative:** cap Intelligence Home at 3 cards above the fold
(attendance, demographics-mini, needs-attention list) with birthday
calendar/heatmap linked as a secondary "Reports" page, not inlined — and require
every card to render in a fixed height with no internal scroll or interactive
control heavier than a toggle.

### 3b. Default-view change to `intel-home` is an undisclosed cross-area edit — REJECT as scoped
D8/N1 changes `App.tsx:82` so the intelligence role lands on `intel-home`
instead of `copilot`. The document is careful to flag the *Sentiment Pulse*
cross-area dependency on `copilot.ts` but does not flag this one, even though
it's larger: it silently demotes Pastoral Co-Pilot from "the first thing the
exec sees" to one nav click away, which is Area C's territory (#19) and should
be settled with that area's proposal, not decided unilaterally inside Area D.
**Alternative:** land `intel-home` as an added route without touching the
default; let the Area C synthesis decide the landing screen once both proposals
exist.

### 3c. D4's kind/event filters are worth building only after §2's demote — not rejected, re-sequenced
Not objecting to the filters themselves — the `kind` split is the single best
new idea in this document (children's ask, real field, zero current reads,
cheap to add). I'm objecting to building it *behind* a full nav route before the
Q1 disagreement is settled. Build the split into the card first; only spend the
event-filter/tab engineering if the card proves the ratio number gets used.

## 4. What the proposal dropped from my R1 that I still consider unresolved

1. **Attendance's YoY/seasonal-context defect (R1 #29 defect 2).** D4 adds
   `kind` and event filters but never addresses "raw counts, no goal, no
   same-week-last-year comparison" — Robert still can't tell a normal seasonal
   dip from a real problem. Not fatal, but it's the one fix I proposed in R1
   that got no response at all, positive or negative.
2. **"Pulse" brand-word overload (R1 cross-cutting).** Global Pulse and
   Sentiment Pulse are cut, and Velocity's "real-time" is fixed — good — but the
   surviving merged screen keeps the name **"Attendance Pulse"** for a
   once-per-session static fetch. If the goal is a word that reliably signals
   "live," it still doesn't, and nothing in D4 renames it. Cheap fix: call it
   "Attendance" (matches the route rename precedent set for `map-view` →
   `city-distribution`).

## 5. Where the proposal beat me — conceded

- The Dashboard-doesn't-exist correction is right and exposes a real gap in my
  own R1 reasoning (§1). Conceded without qualification.
- Scoping the honest-denominator fix to `transformPerson`/area-wide (D9) instead
  of my per-chart caption is the better fix — one place, not eight captions.
  Conceded.
- The safeguarding veto on #36 (CUT, not my R1's DEMOTE-to-bar-chart) is correct
  once the re-identification risk in a small congregation is on the table — a
  cleaner bar chart still shows the rarest topic as the most prominent one.
  Conceded.
- D5's household-dedup and min-cluster-size fixes for Map View are sharper than
  anything in my R1, which only caught the naming problem, not the undercounting
  or re-identification math. Conceded.
