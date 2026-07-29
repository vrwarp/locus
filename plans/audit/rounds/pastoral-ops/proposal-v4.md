# Area C — pastoral-ops — Proposal v4 (Round 4 synthesis)

Synthesised from `r4-all.md` (all four critics returned **CONVERGED — no
residual objections** on the ten verdicts of `proposal-v3.md` §2) plus one
cross-area finding routed in from Area D's round 4.

**Status: Area C is settled.** Every verdict is CONVERGED. Q9, Q11 and Q12 —
the only open questions v3 carried — are closed below. §6 is the final ordered
work list. Round 5 is a sign-off, not a debate; §8 lists the three things it
may still stamp.

---

## 1. Changes since v3

| What | v3 said | v4 says | Source |
|---|---|---|---|
| **Q9** key-volunteer gate | open for three rounds | **Closed.** `historyServingCount >= 2 OR soloCount > 0`, both configurable; skills-aware rarity named as an unbuildable data gap, not solved | admin ruling, youth concurrence |
| **Q11** clearance column | on `bus-factor`, gated on church-declared minors-facing teams | **Closed.** Clearance renders **only on Recruitment**. Column CUT; the minors-facing-team config step CUT with it | children's ruling |
| **Q12** N3 roster overlap | demoted below the fold, 40 lines relocated | **Closed. N3 is CUT.** `volunteerWeb.ts` dies entirely — no relocation | uxr ruling |
| `bus-factor` scope | solo list + clearance column + roster-overlap disclosure | **one section**: solo coverage | Q11 + Q12 |
| `Guest` check-ins dropped | not raised | folded in; see §4 | Area D r4 |
| §4.11 Retention | two defects | **three** — the third is the `Guest` defect class on the ship-first screen | §4 |
| Q9 buildability | — | the OR is a **no-op as literally specified**; the window has to widen too. See §3.2 | mine, this round |

**No darling killed this round.** v3's three rulings all survived contact with
four critics unchanged. The two corrections below are additive detail on
*how* to build what was already decided, not reversals.

---

## 2. Per-feature decisions — final

| # | Feature | Verdict | Rationale (one line) | Converged? |
|---|---------|---------|----------------------|-----------|
| 19 | Pastoral Co-Pilot | **CUT** | Keyword router returning wrong reports; `action` field no component can receive. | **Y** (4 rounds) |
| 20 | Burnout Risk | **MERGE** (host, renamed "Attendance Risk") | Same population, same `classifyEvent` dependency, same card DOM as #22. | **Y** (4 rounds) |
| 21 | Predictive Attrition (Drift) | **CUT** — permanent | Window math is 8.4–8.9wk over a hardcoded `6`; concept returns as a population toggle, never a screen. | **Y** (4 rounds) |
| 22 | Missing Volunteers | **MERGE** into #20 | A filter and a threshold, not a destination. | **Y** (4 rounds) |
| 23 | Recruitment Intelligence | **SIMPLIFY** | Candidate list + Ask Script sound; invented `Match Score` is the defect. **Now the sole home of clearance** (Q11). | **Y** |
| 24 | Retention Funnel (Newcomer) | **FIX** | Only screen in the area with zero live safety findings; ships first. **Third defect added this round** (§4). | **Y** |
| 25 | Bus Factor | **SIMPLIFY** (scope reduced again) | One section: teams running on one volunteer. Minors tier cut in v3, clearance column and roster-overlap cut in v4. | **Y** |
| 26 | Volunteer Web | **CUT** — no successor | 251 lines of physics with no legend, keyboard path or action; N3 successor also cut (Q12). | **Y** (4 rounds) |
| 27 | Emergency Alerts | **CUT — domain veto** | Fabricated success banner on a safety-critical send; no `isChild` filter, no guardian routing. | **Y** (4 rounds) |
| 28 | Automations | **CUT 3 lanes + SIMPLIFY the rest** | Both background-check lanes and First-Time-Giver read fabricated fields; survivors lose their fake writes. | **Y** (4 rounds) |

Nav effect, unchanged for the fourth round: **10 Intelligence slots → 5**
(`attendance-risk`, `recruitment`, `retention`, `bus-factor`, `automations`).
Five routes removed, zero added. N1 and N2 add zero nav slots. N3 is gone.

---

## 3. The three closed questions

### 3.1 Q12 — CLOSED. N3 is cut; delete `volunteerWeb.ts` entirely.

**Adopted in full.** UXR's decisive point is not "cheap things add up" (though
it said that too, correctly, and I had used "it is only ~15 lines" as my
reason to keep it — that reasoning is exactly what built the surfaces this
audit exists to cut). The decisive point is that the relocation was **not
reuse**: `busFactor.ts:19-31` already applies the identical serving filter
(`servingEventIds.has(eventId) || c.attributes.kind === 'Volunteer'`) and
`busFactor.ts:60-74` already clusters by a 60-minute time gap
(`differenceInMinutes`), which is a strictly better co-presence signal than
`volunteerWeb.ts:41-56`'s same-day `eventId:date` `shiftGroups` key.
Relocating would have added a second, worse implementation of clustering
`busFactor.ts` already has, to feed a below-the-fold list with a known
false-positive mode (pairwise `Set` intersection cannot see A—B—C) and no
person to act on. **Delete, do not relocate.**

### 3.2 Q9 — CLOSED as `historyServingCount >= 2 OR soloCount > 0` — but the OR as specified is a no-op for the case it was adopted to catch. Build note, not a reopening.

The ruling is right and I adopt it: the frequency floor stays as the
configurable default, OR'd with `soloCount > 0`, reusing a fact
`analyzeCluster` (`busFactor.ts:120-122`) already computes. No new proxy
field, no new keyword classifier — which is the whole point, given that every
proxy field in this area has been cut over three rounds.

**But the wiring does not work at `missing.ts:78` alone, and round 5 must not
inherit "one-line OR" as the estimate.** `missing.ts:41-45` builds
`recentCheckIns` from an **8-week slice**, and `personStats`
(`missing.ts:46-72`) is populated *only* from that slice. A person with zero
check-ins in the last 8 weeks never enters `personStats` and therefore can
never be emitted, whatever their `soloCount`. Youth's motivating case — the
leader who works retreats and Christmas Eve and nothing else — is exactly a
person with no check-in in 8 weeks. **As literally specified, the OR helps
only someone who served once in weeks 2–8 (floor of 2 not met, now caught)
and does nothing for the quarterly volunteer.**

The buildable form, which is what ships:

- `calculateMissingVolunteers` takes a fourth argument
  `soloEverPersonIds: Set<string>`, built by the caller from
  `calculateBusFactor(...).filter(c => c.soloCount > 0).map(c => c.person.id)`.
  One `calculateBusFactor` call already happens for `bus-factor`; the
  `attendance-risk` container makes its own.
- Build `personStats` over a **configurable `keyVolunteerLookbackWeeks`,
  default 26**, not the hardcoded 8. Keep `historyServingCount` scored only
  over weeks 2–8 (unchanged semantics, unchanged default). Keep the missing
  gate at `recentCount === 0` over 2 weeks (unchanged).
- `missing.ts:78` becomes
  `const isKeyVolunteer = stats.historyServingCount >= keyVolunteerThreshold || soloEverPersonIds.has(personId);`
- The 26-week lookback is what makes the `Math.max(2, missingWeeks)` floor
  (`missing.ts:94`) actively harmful rather than merely wrong — v3 §3.4
  already drops it, and longest-missing-first sort (also §3.4) is what keeps
  the widened list readable.
- Screen copy states the limit admin named: *"based on check-in frequency and
  solo coverage; Locus does not know who else is qualified for a role."*

**Skills-aware rarity is a named unbuildable gap** (§7), not a deferred task:
PCO Check-Ins exposes who logged into a role, never who is qualified for it.
Do not promise it in copy.

**Scope, per youth:** Q9 lives entirely in the Volunteers population. The
Students tab's predicate (`missing.ts:69`, `stats.recentCount`) has no
key-volunteer concept and must not grow one. Its 8-week window and its
independence from §4.3 and `!isChild` are unchanged from v3 §3.4.

### 3.3 Q11 — CLOSED. Clearance on Recruitment only. Cut the column and the config step.

**Adopted in full, and it is the cleanest kind of ruling: it deletes work from
two places at once.** The children's director's argument is the one this audit
has applied to every other item — a signal that in practice never varies for
the org looking at it is static UI impersonating a live one. A
declare-your-minors-facing-teams step in `ConfigModal` is one-time rollout
work that gets skipped and never revisited, so the column would render for
almost nobody; and gating a mostly-null boolean behind a config step that is
also usually empty multiplies two emptiness failures rather than fixing
either. That is N2's own defect, one layer up.

Recruitment has no such problem: `recruitment.ts:83-97` derives
`potentialRoles` unconditionally from household data (Kids Ministry for a
household child aged 5–10, Student Ministry 11–18, `recruitment.ts:104-110`)
with zero admin setup — and it is the moment clearance actually matters,
because an `Ask Script` (`recruitment.ts:132-176`) is about to name a person
and invite them to serve alongside children.

Consequences, both subtractive:

- **`bus-factor` ships with no clearance column.** Combined with Q12, the
  route ships as exactly one list: "Teams running on one volunteer".
- **The church-declared minors-facing team list is struck from §4.3's
  `ConfigModal` work.** It has no remaining consumer. §4.3 keeps only its
  original job: the event-classification keyword lists.
- **N2 survives, narrowed to one surface**, still fail-closed: "Not cleared"
  and "Unknown — verify before scheduling" only; `true` renders as nothing.
  No green check, ever.
- **`!isChild` in `analyzeCluster` is unaffected** and remains a precondition
  (`busFactor.ts:95-125`) — it protects the solo *count*, not a badge.

---

## 4. Cross-area fold-in — the `kind === 'Regular'` defect that drops `Guest`

Routed from Area D r4: the predicate silently excludes `Guest` check-ins and
recurs at `drift.ts:31`, `givingTrends.ts:26`, `sermons.ts:42`.

**All three occurrences are in files this audit already deletes. None of them
needs a `Guest` fix; fixing them would be work on deleted code.**

- `givingTrends.ts:26` — **deleted by Area D** (content-giving-comms
  `proposal-v3.md` #40 CUT, W-step deleting `GivingTrends.tsx/.css/.test.tsx`
  and `src/utils/givingTrends.ts`; CONVERGED 3 rounds).
- `sermons.ts:42` — **deleted by Area D** (#37/#38 CUT; W5 strips
  `correlateSermonsWithEngagement`, W6 deletes all of `src/utils/sermons.ts`
  including `SERMON_TOPICS`, plus `sermons.test.ts`; CONVERGED 3 rounds).
- `drift.ts:31` — **deleted here**, Area C's own §6 item 5 (#21 CUT,
  permanent, CONVERGED 4 rounds).

**The third one matters — but it is not one of the three named.** The same
defect class survives on a *keeper*, and on the screen this area ships first:

> `src/utils/retention.ts:16` — `if (checkIn.attributes.kind !== 'Regular') return;`

The comment above it states the intent: *"Only count Regular attendance, not
volunteering."* The code as written excludes `Volunteer` **and `Guest`**, and
`Guest` is precisely the kind a first-time visitor is checked in under. Two
consequences on `calculateNewcomerFunnel`, both in the wrong direction:

1. **Under-count.** Newcomers whose visits were all logged as `Guest` never
   enter `checkInsByPerson` at all, so the "1st Visit" denominator — the
   entire premise of the funnel — is systematically short.
2. **Mis-dating, which is worse than the under-count.** For a person whose
   first visit was `Guest` and whose later visits were `Regular`,
   `dates[0]` (`retention.ts:36-38`) becomes the *later* date, so the
   `isAfter(firstCheckIn, oneYearAgo)` newcomer test (`:39`) is applied to
   the wrong date. A long-time attender whose only recent change is a
   check-in kind flip can be classified a newcomer, and a real newcomer's
   funnel position is measured from the wrong start.

**Fix (one line, invert the predicate to match the stated intent):**
`if (checkIn.attributes.kind === 'Volunteer') return;`

**This is untestable on the demo data and that is the reason it survived four
rounds.** `grep -rn "Guest" src/ mock-api/` returns **zero matches**; the only
kinds present in `mock-api/data.js` are `'Regular'` and `'Volunteer'`. So the
fix must ship **with a `Guest` fixture** in `retention.test.ts` and a `Guest`
row in `mock-api/data.js` — otherwise the repair is unverified and the next
agent re-introduces the same predicate. Added to §6 item 6 (§4.11).

Surveyed the rest of Area C for the same class: `burnout.ts:58`,
`missing.ts:55`, `busFactor.ts:32` and `recruitment.ts:44` all use
`kind === 'Volunteer'` as an **additive** override (a union), never as an
exclusion, so `Guest` check-ins still count as attendance in each. No further
occurrences.

---

## 5. Files deleted — the complete list

Everything below leaves the tree. Nothing in Area C is relocated or stubbed.

**#27 Emergency Alerts:** `src/components/EmergencyAlerts.tsx`, `.css`,
`.test.tsx`; `App.tsx:929-933`; `SidebarIntelligence.tsx:198-206`
(`onChangeView('emergency')` at `:202`).

**#26 Volunteer Web + N3:** `src/utils/volunteerWeb.ts` (all 251 lines),
`src/utils/volunteerWeb.test.ts`, `src/components/VolunteerWeb.tsx`,
`src/components/VolunteerWeb.test.tsx`; the import at `App.tsx:19` and the
`currentView === 'network'` block at `App.tsx:866-871`;
`SidebarIntelligence.tsx:107-115` (`onChangeView('network')` at `:111`).
**Cross-area note:** `RobertReport.tsx:14` imports it and `:330` renders it.
`RobertReport.tsx/.css/.test.tsx` are themselves deleted by Area D
(content-giving-comms `proposal-v3.md` §269-270). If Area D lands first there
is nothing to edit; if Area C lands first, drop those two lines only.

**#21 Drift:** `src/utils/drift.ts`, `src/utils/drift.test.ts`,
`src/components/DriftReport.tsx`, `.css`, `.test.tsx`; `App.tsx:22` import and
`App.tsx:812-816`; `SidebarIntelligence.tsx:51-59`
(`onChangeView('attrition')` at `:55`).

**#19 Co-Pilot:** `src/components/CoPilot.tsx`, `.css`, `.test.tsx`;
`App.tsx:761-765`; `SidebarIntelligence.tsx:18-26`. Repoint the Intelligence
landing default to `retention`.

**#28 lanes:** `background_check_expires_at` from `pco.ts:17,86,231,275`;
`automations.ts:122-151` (both background-check lanes) and the First-Time-Giver
lane; the two fake write paths; the four associated test files.

**Struck from the build (never existed, now not to be built):** the
`servesMinors` field, the "Solo with minors" tier, the `bus-factor` clearance
column, the church-declared minors-facing team list in `ConfigModal`, and the
40-line `shiftGroups` relocation into `busFactor.ts`.

---

## 6. The final work list, ordered by value-per-effort

Deletions first — they are the highest-value, lowest-risk work in the area and
they shrink the surface every later item has to touch.

| # | Work | Effort | Status |
|---|---|---|---|
| 1 | **Delete #27 Emergency Alerts** (§5) | ~30 min | CONVERGED, unchanged 4 rounds |
| 2 | **Delete #26 Volunteer Web + N3** (§5) — no relocation, no successor | ~30 min | **changed by Q12** (was ~1 h with relocation) |
| 3 | **Cut three #28 lanes + both fake writes** (§5) | ~1 h | CONVERGED |
| 4 | **Cut #19 Co-Pilot**, repoint Intelligence landing → `retention` | ~1 h | CONVERGED |
| 5 | **Cut #21 Drift** incl. `drift.ts` — takes one `Guest` bug with it (§4) | ~1 h | CONVERGED |
| 6 | **#24 Retention FIX — first shippable change.** (a) rename "Member" → "4+ Visits" (`retention.ts:61-66`); (b) return person IDs per stage, props `{auth}` → `{auth, students}` so stages click through; (c) **`retention.ts:16` → `kind === 'Volunteer'`, plus a `Guest` fixture in `retention.test.ts` and a `Guest` row in `mock-api/data.js`** (§4); (d) document the household counting caveat | ~half day + ~1 h | **(c) new this round** |
| 7 | **Fix `classifyEvent`** (`burnout.ts:14-21`) — Worship keywords before Serving; `kind === 'Volunteer'` authoritative; emit `'Unknown'` counts so `BurnoutReport.tsx:74-78` stops printing "All Clear! 🎉" over unclassifiable data; keyword lists into `ConfigModal`. **Prerequisite for the Volunteers population and `bus-factor`; not for the Students tab.** Rationale is over-admission/masking, not "soloCount is 0" (v3 §1.2) | ~2 h | **reduced by Q11** — no minors-team config |
| 8 | **Thresholds into config** — `burnout.ts:86-91`, `missing.ts:76` and `:39-42`, `recruitment.ts:95`; **add `keyVolunteerThreshold` (default 2) and `keyVolunteerLookbackWeeks` (default 26)** per §3.2 | ~2 h | **extended by Q9** |
| 9 | **#23 Recruitment SIMPLIFY** — delete the invented `Match Score`; keep the candidate list and `Ask Script`; **N2 clearance renders here and only here** (§3.3), fail-closed, no green check; if the attribute is absent org-wide say so once at screen level and keep child-facing roles suppressed | ~1 day | **now sole clearance home** |
| 10 | **Merge #22 into #20 → `attendance-risk`** — split gate (Students tab exempt from §4.3/`!isChild`); route `burnout` → `attendance-risk`; title "Attendance Risk — Volunteers & Students"; the word **Students** in `SidebarIntelligence` with deep link `?population=students`; **write** the June 1 – Aug 15 suppression (two date comparisons in `missing.ts`; `automations.ts:67-96` contains no such window — do not cite it); drop grade-12 each spring; drop the `Math.max(2, …)` floor (`missing.ts:94`); longest-missing default sort on both tabs; flags array; group-by-team default; unified fetch depth; remove `ui-avatars.com`; CSV governance. **Plus §3.2's Q9 wiring: fourth arg `soloEverPersonIds`, widened `personStats` lookback, the OR at `missing.ts:78`, and the "does not know who else is qualified" copy** | ~1.5 days + ~2 h | **extended by Q9** |
| 11 | **#25 Bus Factor SIMPLIFY** — `!isChild` exclusion in `analyzeCluster` (`busFactor.ts:95-125`) as a **precondition**; §4.3's fix; headline "Teams running on one volunteer"; row = person, PCO team name, solo shifts / total shifts; align `.slice(0,5)` chart vs `.slice(0,10)` table; keyboard/ARIA on the tooltip with its content also present as table text. **One section. No clearance column, no roster-overlap disclosure, no minors language anywhere** | ~half day | **cut from ~1 day by Q11+Q12** |

**Deploy gate (unchanged, admin's condition):** `attendance-risk`'s Volunteers
population and `bus-factor` do not re-enter the nav until item 7
(`classifyEvent`) and the `!isChild` gates in both `burnout.ts:79` and
`busFactor.ts:95-125` have landed. The Students tab is exempt and may ship the
day its predicate lands. Item 6 is independent of all of it and ships first.

---

## 7. Named gaps — recorded, owned, not silent

Unchanged from v3 §5, plus one added by Q9.

- **Skills-aware rarity / role qualification.** `historyServingCount >= 2 OR
  soloCount > 0` misses the volunteer who always shares a shift with exactly
  one other person but is the only one of the two who can run sound. Catching
  it needs who-is-*qualified* data; PCO Check-Ins exposes only who logged in.
  **Data-availability gap, not a modeling gap. Do not promise it in copy.**
- **Re-screening cadence / clearance expiry.** `passed_background_check` is a
  boolean with no date; expiry lives in PCO's separate Background Checks
  resource and is not built here. Named future integration, owner required.
- **Emergency messaging.** We deleted the fake one and are building nothing.
  Check-in-scoped guardian messaging needs a messaging backend, guardian
  routing, split-household handling, an audit trail and confirmation. Explicit
  product gap with an owner.
- **Child-ratio / two-adult-rule compliance is out of reach** until Check-Ins
  data is joined across attendee and volunteer events by time window. No
  version of Locus answers "was this Sunday legal" today.
- **Small-group drift** unbuildable until item 7's config-driven tagging ships
  *and* a church tags its own small-group events.

---

## 8. Unresolved — what is left for round 5

**Nothing is contested.** All ten verdicts are CONVERGED across four rounds and
all three carried questions are closed. Round 5 is a sign-off. Three items are
new enough this round that they have had exactly one pass and should be
stamped rather than re-argued:

1. **`keyVolunteerLookbackWeeks` default of 26** (§3.2). Widening
   `personStats` from 8 to 26 weeks is what makes Q9's OR real, but it also
   admits people who left the church five months ago. 26 + longest-missing
   sort is my call; a critic who runs a volunteer roster may want 13.
2. **The `retention.ts:16` `Guest` fix** (§4) has been seen by zero Area C
   critics. It is a one-line inversion on the ship-first screen and it changes
   what the funnel counts, so it deserves one look — including whether the
   `Guest` row added to `mock-api/data.js` should also appear in the fixtures
   the other three Area C screens read.
3. **Confirmation that no Area C surface still renders clearance** after Q11 —
   a grep-level check at sign-off, not a design question.

---

## 9. New ideas earned this round

**None.** Round 4 produced three subtractions and one imported bug. Final
state of the carried ideas:

- **N1 `Cmd+K` route jump** (routes only, no person index) — replaces #19.
  **CONVERGED**, unchanged for three rounds.
- **N2 fetch `passed_background_check`** — replaces the fabricated
  `background_check_expires_at` read path; net-negative in code.
  **CONVERGED**, now scoped to **Recruitment only** (Q11), fail-closed
  negative states, no green "Cleared".
- **N3 team roster-overlap list — CUT** (Q12). `volunteerWeb.ts` is deleted
  outright; `busFactor.ts` already clusters co-presence better than the code
  N3 would have relocated.
- **Permanently retired:** the pinned safeguarding block (v2), the "Solo with
  minors" tier and any `servesMinors` classifier (v3), the `bus-factor`
  clearance column and the minors-facing team config (v4). If a future version
  re-attaches safeguarding language to the solo list before a real
  PCO-sourced audience field and populated clearance data both exist, it fails
  the same standard and should be cut on sight.
