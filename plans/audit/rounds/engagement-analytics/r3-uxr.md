# Area D — engagement-analytics — Round 3 UXR Critique (narrow scope)

Per instructions: D#29-31/35/36 are CONVERGED and not reopened. This round is the
three questions the proposal aimed at UXR specifically.

---

## 1. Does `city-distribution` earn its own nav slot? — No. Apply my own test, it fails.

**My test (stated in r2-uxr.md §2):** a nav slot is earned by "distinct, repeated,
time-pressured task completion," not by correctness or by needing screen real
estate. A card handles glanceable numbers; a route is for something a user
*returns to* as part of a recurring job.

Campus-siting is not a recurring job. It is a multi-year, board-level, project-
scoped decision — strictly rarer than the "once or twice a year" ministry-planning
cadence the proposal used to demote Demographics (`proposal-v2.md §2`, row 33). The
proposal's Q1 already spotted this asymmetry; verifying it: the only two things a
route offers that a card can't are (a) the threshold slider
(`MapView.tsx:52-61`, `range` input, `min="5" max="100" step="5"`) and (b) room to
show a suppressed-count disclosure once the k-anonymity floor lands (D9). Neither
requires *standing nav presence* — both require a page to exist somewhere. Those
are different problems. A route that a user reaches by clicking a sidebar item
every day is not the same UI object as a page reached once every few years by a
deliberate link. Locus already has the second pattern for D9's own demoted
siblings — nothing stops `city-distribution` from being that: a full page,
interactive slider and all, linked from the needs-attention card or a low-key
"Reports" entry point, but **not a permanently visible sidebar row**.

Counter-considered and rejected: "it's real data PCO doesn't provide" is a
correctness argument, not a frequency argument — the same one the proposal
correctly refused to accept for keeping #29/#30 as routes. Correctness earns the
feature the right to exist; frequency earns it the right to a standing nav slot.
Those are separately gated and city-distribution only clears the first gate.

**Ruling: Area D goes to zero *standing sidebar* routes.** Keep the page
(threshold slider, suppression disclosure, and all of D9's blocking fixes still
required if it ships at all), but remove it from `SidebarIntelligence.tsx` and
reach it only via a link (e.g., from the needs-attention card, or "Cities" as a
one-line stat + "Analyze campus sites →" affordance). This is not the "card 4"
option the proposal worried would blow the 3-card cap — it's a fourth *page*,
zero-th *nav row*. Net nav change for Area D becomes **8 → 0**, not 8 → 1.

---

## 2. The two new facts — verify

**`kind` collinear with event ID: CONFIRMED, exactly as stated.**
Traced `mock-api/data.js:225-419` check-in-by-check-in: every push for event `'1'`
and `'2'` (children) and `'3'` (adult worship) sets `kind: 'Regular'`
(`:250,266,371,383,392`); every push for event `'4'` (Kids Ministry) and `'5'`
(Greeter) sets `kind: 'Volunteer'` (`:305,319,335,349`). No code path mixes them.
The proposal's conclusion — two controls, one degree of freedom — holds.

**13 uncached consumers: count CONFIRMED, but the 6/7 split in the writeup is
wrong — and the true split is worse than stated, not better.**
Grepped `fetchRecentCheckIns` across `src/components`: 13 call sites, matching the
proposal exactly. But `fetchRecentCheckIns`'s default is `maxPages: number = 100`
(`pco.ts:507`), and the proposal's own list of "seven more run at 20 pages"
includes `BurnoutReport` — whose actual call is `fetchRecentCheckIns(auth)`
(`BurnoutReport.tsx:25`), no second argument, i.e. the **100-page default**, not
20. The real split is **7 components at ~10k records**
(`BurnoutReport.tsx:25`, `Dashboard.tsx:33`, `CoPilot.tsx:43`,
`RecruitmentReport.tsx:26`, `NewcomerFunnel.tsx:18`, `AttendancePulse.tsx:27`,
`CheckInVelocity.tsx:22`) and **6 at ~2k** (`MissingVolunteersReport.tsx:25`,
`DriftReport.tsx:26`, `BusFactorGraph.tsx:25`, `VolunteerWeb.tsx:43`,
`SermonCorrelator.tsx:29`, `SermonSentiment.tsx:29`) — 13 total either way, but one
more full-size pull than claimed.

This does not change the verdict, it strengthens it: the performance finding is
real, app-wide, and if anything under-stated. One nuance the proposal should
carry into D1: deleting `AttendancePulse.tsx` does not remove a consumer, it
relocates one — `IntelligenceHome`'s "Weekly Check-ins" card (D7) needs the same
weekly-aggregated check-in data `AttendancePulse` used to fetch, so Area D's own
call-site count only drops from 2 to 1 unless the new card is built against
`useCheckIns` from day one. Worth stating explicitly in D1 rather than implying
Area D nets to zero consumers.

**Verdict on the finding: ACCEPT, with the correction above.** This is a genuine
app-wide defect that escaped every round-1 area critique and is the single
highest-value item in this document, per my own agreement in r2-uxr.md.

---

## 3. Card cap and no-default-view-change — confirm acceptance; is the card set coherent?

**Confirmed accepted as stated.** §3.3 of proposal-v2.md restates my card budget
verbatim (3 cards, above the fold, fixed height, no internal scroll, no control
heavier than a toggle, no "Reports" overflow) and my default-view objection
(`App.tsx:83` — one line off from the proposal's `:82` citation but the same
statement, `handleSelectRole` still routes `intelligence` → `'copilot'`,
verified). Both hold in the codebase as read.

**Is the surviving 3-card set coherent, or a dumping ground?** Mostly coherent,
with one card riding on borrowed justification:

- **Weekly Check-ins (D7/N2)** — coherent. Weekly cadence, actionable
  (first-time-guest trend), matches the persona's actual return frequency.
- **Needs-attention (links to Area C)** — coherent, arguably the best card in the
  set: it's not a chart at all, it's a router to the surfaces that are actually
  urgent (burnout, attrition, missing volunteers), which is the one thing the
  flat 24-item sidebar this whole area started from could never do.
- **Demographics-mini (D8)** — the weak one. It is honest (real `calculatedGrade`
  data, per §3.1) but its own frequency argument — "ministry planning, once or
  twice a year" — is the same argument that just sent city-distribution to zero
  nav presence in §1 above. A card is cheaper than a route, so a lower bar is
  defensible, but this card is present in the fixed 3-slot, above-the-fold,
  every-single-day layout for a stat Robert has no reason to look at most weeks
  it's there. It survives less because Robert needs it weekly and more because
  the proposal needed a second card once #32 was cut and #33 was "the only
  honest chart in the area." That's filler logic, not task-completion logic —
  the same standard this document correctly applied against #31/#35/#36.

**Verdict: not a dumping ground** (the six cut components are actually gone, not
relocated into cards — that's the meaningful difference from v1) **but not fully
clean either.** The needs-attention card should be card 1, not card 3, if the
ordering communicates anything about priority; and demographics-mini is the card
most likely to be displaced the day someone proposes a genuinely weekly signal —
flag it as first-out under the "one new card in, one old card out" rule the
proposal already committed to.
