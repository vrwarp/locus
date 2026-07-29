# Area C — `pastoral-ops` — Final Report

Features #19–#28: the care and volunteer-operations half of Locus Intelligence.
Reviewed over five rounds by a UX researcher, a church operations director, a
youth pastor and a children's ministry director. All ten verdicts are final.

---

## Verdict

**Area C is nine-tenths ornament over one-tenth signal, and the ornament is
actively dangerous.** Five of the ten features are cut outright, two more are
merged into one screen, and the survivors ship materially smaller: the
Intelligence navigation drops from ten slots to five, with no new routes added
anywhere. The cuts are not taste. Emergency Alerts prints a success banner for a
message it never sends, with no filter to stop it "alerting" children. Two
Automations lanes and the Pastoral Co-Pilot report on
`background_check_expires_at`, a field Planning Center does not supply and Locus
invents — a fabricated safeguarding signal under a heading reading *Safe
Sanctuary*. Predictive Attrition computes an 8.4–8.9-week window against a
hardcoded `6`. Volunteer Web is 251 lines of force-directed physics with no
legend, no keyboard path and nothing to click. What remains — a newcomer funnel,
a merged attendance-risk list, a recruitment list with an ask script, and a
one-section bus-factor view — is genuinely worth the licence fee once the
arithmetic underneath it is fixed, and the arithmetic is broken in ways that are
invisible on the demo data: the retention funnel currently reports **100%
newcomer retention** because it silently discards every check-in not labelled
exactly `Regular`, and the demo fixture pins its entire designed newcomer cohort
to dates outside the window it measures. The deletions are the highest-value,
lowest-risk work in the area and should land first; the retention repair is the
first shippable improvement and is independent of everything else.

---

## Per-feature decisions

| # | Feature | Verdict | Rationale | Rounds converged |
|---|---------|---------|-----------|------------------|
| 19 | Pastoral Co-Pilot | **CUT** | Keyword router that returns the wrong report for plausible questions, and an `action` field no component is wired to receive. Also a consumer of the fabricated background-check field. | 4 |
| 20 | Burnout Risk | **MERGE** (becomes host screen, renamed *Attendance Risk*) | Same population, same broken `classifyEvent` dependency and same card DOM as #22. Two routes asking one question. | 4 |
| 21 | Predictive Attrition (Drift) | **CUT — permanent** | Window arithmetic yields 8.4–8.9 weeks against a hardcoded `6`. The underlying idea returns as a population toggle on #20, never as a screen. | 4 |
| 22 | Missing Volunteers | **MERGE** into #20 | It is a filter and a threshold, not a destination. | 4 |
| 23 | Recruitment Intelligence | **SIMPLIFY** | Candidate list and ask script are sound and derive from real household data; the invented `Match Score` is the defect. Becomes the sole home of clearance display. | 2 |
| 24 | Retention Funnel (Newcomer) | **FIX** | The only screen in the area with no live safety finding. Three arithmetic/labelling defects, all cheap. Ships first. | 2 |
| 25 | Bus Factor | **SIMPLIFY** (scope cut twice) | Keeps one job — teams running on a single volunteer. The minors tier, the clearance column and the roster-overlap section were all cut across rounds 3–4. | 2 |
| 26 | Volunteer Web | **CUT** — no successor | 251 lines of physics with no legend, no keyboard traversal and no action. The proposed cheap successor was cut too: `busFactor.ts` already clusters co-presence better than the code it would have reused. | 4 |
| 27 | Emergency Alerts | **CUT — domain veto** | Fabricated success banner on a safety-critical send path; no `isChild` filter, no guardian routing. A safeguarding failure, not a UX complaint. | 4 |
| 28 | Automations | **CUT 3 lanes + SIMPLIFY the rest** | Both background-check lanes and First-Time-Giver read fields that do not exist. Survivors lose their fake write paths. | 4 |

**Navigation effect:** 10 Intelligence routes → 5 (`attendance-risk`,
`recruitment`, `retention`, `bus-factor`, `automations`). Five routes removed,
zero added.

---

## The work, in order

Deletions first — highest value, lowest risk, and they shrink the surface every
later item has to touch. Total: roughly **five to six working days**, of which
items 1 and 2 have already landed.

### 1. Delete Emergency Alerts — ~30 min — **SHIPPED**
`src/components/EmergencyAlerts.tsx`, `.css`, `.test.tsx`; the `App.tsx` route
block; the `SidebarIntelligence.tsx` nav entry. All removed.

### 2. Delete Volunteer Web — ~30 min — **SHIPPED**
`src/utils/volunteerWeb.ts` (all 251 lines), `src/utils/volunteerWeb.test.ts`,
`src/components/VolunteerWeb.tsx`, `src/components/VolunteerWeb.test.tsx`, the
`App.tsx` import and `currentView === 'network'` block, and the
`SidebarIntelligence.tsx` nav entry are all removed. No relocation, no
successor. `RobertReport.tsx`, which imported and rendered it, was deleted in
the same change by Area D.

### 3. Cut three Automations lanes and both fake writes — ~1 h
`src/utils/automations.ts:122-151` (both background-check lanes) and the
First-Time-Giver lane; the two fake write paths; the corresponding blocks in
`src/components/AutomationsReport.tsx:215-260`; the four associated test files.
**Delete the field itself, not only its consumers:** `background_check_expires_at`
at `src/utils/pco.ts:17`, `:86`, `:299`, plus its test fixtures
(`pco.test.ts:64`, `automations.test.ts:171`, `AutomationsReport.test.tsx:9`,
`copilot.test.ts:90`). Both the admin and children's reviewers made this a
condition of sign-off: a nullable safeguarding-flavoured field with no data
source will be re-rendered by the next person who finds it.

### 4. Cut the Pastoral Co-Pilot — ~1 h
`src/components/CoPilot.tsx`, `.css`, `.test.tsx`; `src/utils/copilot.ts`
(including the background-check summary rows at `:252-253`);
`src/App.tsx:761-765`; `src/components/SidebarIntelligence.tsx:18-26`. Repoint
the Intelligence landing default to `retention`.

**Replacement for the job it was doing:** a `Cmd+K` route jump — routes only, no
person index, no natural-language parsing. Converged across three rounds.

### 5. Cut Predictive Attrition — ~1 h
`src/utils/drift.ts`, `src/utils/drift.test.ts`,
`src/components/DriftReport.tsx`, `.css`, `.test.tsx`; `src/App.tsx:22` and
`src/App.tsx:812-816`; `src/components/SidebarIntelligence.tsx:51-59`.

### 6. Retention Funnel — the first shippable improvement — ~half day + ~1.5 h
Independent of every other item; it does not wait on the deploy gate.

- **(a)** Rename the fourth stage "Member" → "4+ Visits"
  (`src/utils/retention.ts:61-66`). Four check-ins is not membership.
- **(b)** Return person IDs per stage; change props from `{auth}` to
  `{auth, students}` so the stages click through to the people in them
  (`src/components/NewcomerFunnel.tsx`).
- **(c)** **`src/utils/retention.ts:16` — invert the predicate.**
  `if (checkIn.attributes.kind !== 'Regular') return;` becomes
  `if (checkIn.attributes.kind === 'Volunteer') return;`, matching the stated
  intent on the line above it ("only count Regular attendance, not
  volunteering"). See *The retention defect* below. **Ships with fixtures:** a
  `Guest` case in `src/utils/retention.test.ts` (which today has an
  `excludes volunteers` case and no `Guest` case) and a `Guest` child check-in
  row in `mock-api/data.js` at the Sunday kids event (`:319-340`).
- **(d)** **Re-anchor the newcomer generator** in `mock-api/data.js:423-500` to
  `today`. Its 40 designed newcomer profiles are pinned to hardcoded 2024 dates
  (`:442-443`, `:486`) and fall entirely outside the funnel's 12-month window.
  ~20 min, and without it the fixture in (c) is unverifiable too.
- **(e)** Document the household caveat on the screen in one line: the funnel
  counts **persons**, not families — a family of four visiting once produces
  four "1st Visits".

### 7. Fix `classifyEvent` — ~2 h
`src/utils/burnout.ts:14-21`: match Worship keywords before Serving; treat
`kind === 'Volunteer'` as authoritative; emit `'Unknown'` counts so
`src/components/BurnoutReport.tsx:74-78` stops printing "All Clear! 🎉" over data
it could not classify. Move the keyword lists into
`src/components/ConfigModal.tsx`. **Prerequisite for the Volunteers population
and for Bus Factor; not for the Students tab.** The defect is over-admission and
masking, not merely an undercount.

### 8. Thresholds into config — ~2 h
`src/utils/burnout.ts:86-91`, `src/utils/missing.ts:76` and `:39-42`,
`src/utils/recruitment.ts:95`. Add `keyVolunteerThreshold` (default 2) and
`keyVolunteerLookbackWeeks` (default 26), both with the default visible in the
panel.

### 9. Recruitment — SIMPLIFY — ~1 day
`src/utils/recruitment.ts`, `src/components/RecruitmentReport.tsx`. Delete the
invented `Match Score`. Keep the candidate list and the ask script. **Clearance
renders here and only here**, fail-closed: "Not cleared" and "Unknown — verify
before scheduling" only; `true` renders as nothing, and there is never a green
check. If the attribute is absent org-wide, say so once at screen level and keep
child-facing roles suppressed. This requires fetching PCO's real
`passed_background_check` boolean — net-negative in code, since it replaces the
fabricated field deleted in item 3.

### 10. Merge Missing Volunteers into Burnout Risk → `attendance-risk` — ~1.5 days + ~2 h
The largest item. `src/utils/missing.ts`, `src/utils/burnout.ts`,
`src/components/BurnoutReport.tsx`, `src/components/MissingVolunteersReport.tsx`,
`src/components/SidebarIntelligence.tsx`, `src/App.tsx`.

- Split gate: the Students tab is exempt from `classifyEvent` and from the
  `!isChild` filter; the Volunteers population is not.
- Route `burnout` → `attendance-risk`; title *"Attendance Risk — Volunteers &
  Students"*; the word **Students** in the sidebar with a deep link
  `?population=students`.
- **Write** the June 1 – Aug 15 summer suppression — two date comparisons in
  `missing.ts`. (`automations.ts:67-96` contains no such window; it has been
  mis-cited as precedent.)
- Drop grade 12 each spring — graduating seniors are the goal, not attrition.
- Drop the `Math.max(2, missingWeeks)` floor (`missing.ts:94`); it prints
  "2 weeks" over someone last seen in February.
- Longest-missing-first default sort on both tabs; render the existing
  `stats.lastSeen` date on the row; flags array; group-by-team default; unified
  fetch depth; CSV governance.
- **Key-volunteer definition:** `calculateMissingVolunteers` takes a fourth
  argument `soloEverPersonIds: Set<string>`, built by the caller from
  `calculateBusFactor(...).filter(c => c.soloCount > 0)`. Build `personStats`
  over `keyVolunteerLookbackWeeks` (default 26) rather than the hardcoded 8 —
  without this the OR is a no-op, because a quarterly volunteer never enters
  `personStats` at all. `missing.ts:78` becomes
  `stats.historyServingCount >= keyVolunteerThreshold || soloEverPersonIds.has(personId)`.
- Screen copy states the window and the limit: *"No check-in in 2 weeks; served
  at least twice, or served solo at least once, in the last 26. Locus does not
  know who else is qualified for a role."*

### 11. Bus Factor — SIMPLIFY — ~half day
`src/utils/busFactor.ts`, `src/components/BusFactorGraph.tsx`. One section:
*"Teams running on one volunteer"*. Row = person, PCO team name, solo shifts /
total shifts. `!isChild` exclusion in `analyzeCluster`
(`busFactor.ts:95-125`) as a **precondition**, not a filter step. Align the
`.slice(0, 5)` chart against the `.slice(0, 10)` table. Keyboard and ARIA on the
tooltip, with its content also present as table text. Carry item 7's repair to
the empty state at `BusFactorGraph.tsx:51-58`, which currently renders "All
Clear!" without distinguishing *no solo coverage* from *we could not classify
your events*. **No clearance column, no roster-overlap section, no minors
language anywhere on this screen.**

### Deploy gate

`attendance-risk`'s Volunteers population and `bus-factor` do not re-enter the
navigation until item 7 (`classifyEvent`) and the `!isChild` gates in both
`burnout.ts:79` and `busFactor.ts:95-125` have landed. The Students tab is
exempt and may ship the day its predicate lands. Item 6 is independent of all of
it and ships first.

---

## The retention defect, in full

`src/utils/retention.ts:16` reads `if (checkIn.attributes.kind !== 'Regular')
return;` while the comment directly above states the intent as "only count
Regular attendance, not volunteering". The code excludes `Volunteer` **and
`Guest`** — and `Guest` is the kind a first-time visitor is checked in under.
Two consequences, both in the wrong direction:

1. **Under-count.** Visitors whose check-ins were all logged as `Guest` never
   enter the map at all, so the "1st Visit" denominator — the entire premise of
   the funnel — is systematically short. This lands hardest on the new-family
   moment: at a children's check-in desk the child is recorded first, often as a
   `Guest`, and the parents frequently are not recorded that week at all.
2. **Mis-dating, which is worse.** For a person whose first visit was `Guest`
   and whose later visits were `Regular`, `dates[0]` becomes the *later* date,
   so the newcomer test at `retention.ts:39` is applied to the wrong date. A
   long-time attender whose only recent change is a check-in-kind flip can be
   classified a newcomer, and a real newcomer's funnel position is measured from
   the wrong start.

The fix is one line, and its strongest justification is portability rather than
`Guest` specifically: **the current code is a whitelist of one label, the fix is
a blacklist of one label.** `kind` values come from each church's own Check-Ins
configuration — "Guest", "Visitor", "First Time", campus-specific labels — and
`kind !== 'Regular'` silently discards all of them at any church that did not
use the literal string `Regular`. `kind === 'Volunteer'` encodes the actual
intent and is correct whatever a church calls its visitors.

**This is invisible on demo data, which is why it survived four rounds.**
`grep -rn "Guest" src/ mock-api/` returns zero matches; the only kinds in
`mock-api/data.js` are `Regular` and `Volunteer`. Running the funnel's own logic
over the mock data returns `[28, 28, 28, 28]` — a perfectly flat funnel, which
`NewcomerFunnel.tsx:62-68` renders as **"Retention Rate 100%"**. The 28 are
long-time attenders and children who happen to have started just inside the
window; all 40 people the fixture generates *specifically to model retention*
are dated to 2024 and fall outside it. Hence items 6(c) and 6(d) together: the
fix and a fixture that can actually prove it.

---

## Already shipped

Landed and committed. Not pending work.

- **Emergency Alerts is deleted** (work item 1) — component, styles, tests,
  route and nav entry.
- **Volunteer Web is deleted** (work item 2) — all 251 lines of
  `src/utils/volunteerWeb.ts`, both components, both test files, the route and
  the nav entry. `RobertReport.tsx`, its only other consumer, went with it.
  Nothing was relocated.
- **`src/utils/recruitment.ts` excludes minors** via a shared `isMinor`
  predicate (`src/utils/pco.ts:122`) rather than the `child` flag alone. The
  candidate list is handed to staff as "people to ask about serving"; a teenager
  nobody remembered to flag has no business on it.
- **The `ui-avatars.com` name egress is closed** in `BurnoutReport`,
  `DriftReport`, `MissingVolunteersReport`, `RecruitmentReport` and elsewhere —
  congregant names were being sent to a third-party image host as URL parameters
  to render fallback avatars.
- **The zip-to-area-code table no longer maps Schenectady zip codes to `555`,**
  the reserved fictional area code.

---

## What we could not settle

Five gaps. The first three are permanent within the data Locus can reach; they
are recorded here so nobody re-proposes them as achievable, and so nobody
promises them in screen copy.

- **Skills-aware volunteer rarity.** The key-volunteer definition —
  `historyServingCount >= 2 OR soloCount > 0` — misses the volunteer who always
  shares a shift with exactly one other person but is the only one of the two
  who can actually run sound. Catching it needs data on who is *qualified* for a
  role; PCO Check-Ins exposes only who logged into one. **A data-availability
  gap, not a modelling gap.** The screen must say so rather than imply
  completeness.
- **Small-group-specific student drift.** The signal that matters for teenagers
  is not "missed three Sundays" — sports, custody schedules and jobs produce
  that constantly — it is dropping out of *small group*. Locus cannot see the
  difference until the config-driven event tagging in item 7 ships **and** a
  given church actually tags its own small-group events. Unbuildable until both
  are true, and the second is outside our control.
- **Background-check expiry / re-screening cadence.** PCO exposes
  `passed_background_check` as a boolean with no date; expiry lives in a separate
  Background Checks resource that Locus does not integrate. After item 3, Locus
  says nothing at all about clearance expiry. That is a real reduction in what
  the product appears to offer, and it **belongs in the release note, not only in
  this document** — the honest framing being that the previous warning was
  reading a field Planning Center never supplied. Named future integration;
  needs an owner.
- **Emergency messaging.** The fake one is deleted and nothing replaces it.
  Check-in-scoped guardian messaging needs a messaging backend, guardian
  routing, split-household handling, an audit trail and delivery confirmation.
  Explicit product gap; needs an owner before anything is built.
- **Child-ratio and two-adult-rule compliance** remain out of reach until
  Check-Ins data is joined across attendee and volunteer events by time window.
  No version of Locus can answer "was this Sunday adequately staffed" today.

Two smaller open items, recorded rather than resolved:

- **The 26-week key-volunteer lookback has a seasonal blind spot.** A leader
  whose only qualifying shifts were in the spring falls out of the window in
  autumn and stops being counted as key. The summer suppression protects the
  *missing* side of the calculation, not the *eligibility* side. This is a false
  negative — a leader who should have been called and was not — and it would be
  materially worse at 13 weeks. Accepted at 26; the window is stated on screen so
  the limitation is visible to whoever reads it.
- **The funnel does not split by age or ministry.** A youth pastor cannot see
  invited-friend retention inside it, which is the single highest-value newcomer
  signal in that ministry. Deliberately not fixed: a fourth population toggle on
  the area's simplest screen is not worth its cost. Recorded as a known limit.
