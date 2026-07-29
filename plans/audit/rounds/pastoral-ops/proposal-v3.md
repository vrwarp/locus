# Area C — pastoral-ops — Proposal v3 (Round 3 synthesis)

Synthesised from `r3-uxr.md`, `r3-church-admin.md`, `r3-youth.md`,
`r3-children.md`, attacking `proposal-v2.md`. Every contested code claim
re-verified against source; corrections stated inline with line numbers.

---

## 1. Changes since v2

### 1.1 Killed darling: my Q6 lean is overturned. "Solo with minors" is dead as a safeguarding feature.

v2 §5 Q6 said *"I lean ship-with-caveats."* **Three critics ruled and none of
them supports the tier as specified. The lean loses.** The evidence, verified
myself rather than taken on report:

- `PcoEvent` (`src/utils/pco.ts:101-108`) carries exactly `name` and
  `frequency?`. There is no audience, age-group or ministry-type field anywhere
  in the event shape. **`servesMinors: boolean` could therefore only be a second
  keyword classifier over event names** — the identical mechanism whose
  `'ministry'`-before-`'service'` precedence bug (`burnout.ts:14-21`, verified:
  Serving keywords are tested first, so any event named `…Ministry…` returns
  `'Serving'` regardless of who attends) is the reason §4.3 exists. Layering an
  unbuilt, untested keyword heuristic onto a proven-wrong keyword heuristic, on
  a tier whose label reads as a safety assurance, is the exact pattern that got
  #21, #27 and three #28 lanes cut. (youth)
- `grep -rn "passed_background_check" src/ mock-api/` → **zero matches**,
  re-run and confirmed. The field is not merely sparse in the wild; it is null
  for **100% of the only dataset this application actually runs against**. N2's
  fourth state would fire unconditionally on every load forever. A badge that
  never varies is static UI text impersonating a live signal. (youth)
- The tier cannot count children present: kids check into `Sunday Kids Church`
  (`mock-api/data.js:223`) and adults serve on `Kids Ministry Team`
  (`data.js:234`) — two event IDs, and `calculateBusFactor` groups only by a
  single `eventId` (`busFactor.ts:41-47`), never joining events by time window.
  A tier named "Solo with minors" claims a child-ratio fact it structurally
  cannot compute. (uxr, children, admin — unanimous, and the load-bearing one)

**Ruling, converged across all three: the plain solo count survives as staffing
/ coverage information. The word "minors", the shield framing, every use of
"safeguarding" / "Safe Sanctuary" / ratio or two-adult-rule language, and any
`servesMinors` classifier are CUT.** Clearance survives only in N2's
fail-closed negative forms — **"Not cleared" and "Unknown — verify before
scheduling"** — and **never as a green "Cleared" checkmark**, because a
confident-looking checkmark over a field that is null everywhere recreates the
false-reassurance failure this audit cut everywhere else (uxr, explicitly;
admin's "no borrowed authority"; children's condition 3).

This also answers **Q7 in the same motion**: a lagging, honestly-captioned ops
list is fine; a lagging list wearing safeguarding language is theatre. Q7 is
closed, not carried.

The children's agent alone argued SHIP-CONDITIONAL with the minors framing
retained under three conditions. **Why that argument loses:** its conditions 1
and 3 (fix the `isChild` masking bug; render Unknown loudly) are adopted in
full below — they are about the *count* and the *clearance state*, and both
survive. Its condition 2 (a per-row "this is not a ratio count" caveat) is a
caveat purchased to make a label honest that we can simply not write. When the
choice is between a mandatory disclaimer under every row and deleting the claim
the disclaimer defends, subtraction wins. The director still sees the team name
(`Kids Ministry Team`) rendered on the row and draws the inference themselves;
Locus does not assert it.

### 1.2 Killed darling #2: v2's own `soloCount` claim was false

v2 §4.3 asserted *"`busFactor.ts` must trust `kind === 'Volunteer'` the same
way; without this, `teamSize === 1` never fires and `soloCount` is permanently
0."* **That is wrong and it was mine.** `busFactor.ts:32` already reads
`servingEventIds.has(eventId) || c.attributes.kind === 'Volunteer'`. The
override is already in the file; `busFactor.test.ts` confirms solo detection
works today on `kind: 'Volunteer'` fixtures. Children's agent caught it; I
verified it. **Round 4 must not inherit "soloCount is permanently 0" as fact.**

The dependency on §4.3 is real but runs the *other* direction, and this is the
corrected statement of it: the filter is a **union**, so an event
mis-classified `'Serving'` by the `'ministry'` precedence trap admits **every**
check-in on it — including child attendees — into `teamCheckIns`, inflating
`personIds.size` and turning genuine solos into non-solos. §4.3 is still a
precondition for the solo list; it is a **false-negative / masking** fix, not
an on-switch. Admin's hard condition (nav entry gated on §4.3 + `!isChild`)
therefore stands, on this corrected rationale.

### 1.3 Adopted without argument

- **#25 has become a dumping ground; the silo list comes back out** (uxr). Four
  reliability profiles on one table. See §3.2.
- **N3 does not replace Volunteer Web; relabel it** (uxr). Pairwise `Set`
  intersection is not graph reachability. See §3.3.
- **Split the gate on the Students tab** (youth). Verified: `missing.ts:69`
  (`stats.recentCount++`) counts *any* check-in, unfiltered by `classifyEvent`;
  only `historyServingCount` (`missing.ts:71`) consults it, and the student
  predicate replaces that gate entirely. The Students tab has **zero**
  dependency on §4.3. See §3.4.
- **The "reuse the date gate in `automations.ts:67-96`" claim was false**
  (youth). Verified: that range is `getPendingGradePromotions`, which checks
  only `isAfter(today, promotionSeasonStart)` with **no end date**;
  `getCollegeSendOffs` is August-only. **The June 1 – Aug 15 window must be
  written, not reused.** v2 claimed code reuse it did not have — the same rigor
  failure it demands elsewhere.
- **"Students" must be visible in the sidebar; default-sort longest-missing
  first** (youth). See §3.4.
- **Clearance stays in the product, on the real boolean, fail-closed, no
  expiry** (admin, children). N2 approved; scope narrowed by §1.1.
- **PCO's Background Checks resource (re-screening cadence / expiry) is a named
  future integration, not a silent loss** (children). Recorded in §5.
- **Q8 needs an explicit backlog line with an owner**, not a scoping decision
  made silently inside an audit doc (children). Recorded in §5.
- **#24 FIX, §4.4 thresholds-to-config, §4.8 CSV governance, §4.9 keyboard/ARIA
  all confirmed** (admin). All now CONVERGED.

---

## 2. Per-feature decisions

| # | Feature | Verdict | Rationale (one line) | Converged? |
|---|---------|---------|----------------------|-----------|
| 19 | Pastoral Co-Pilot | **CUT** | Keyword router returning wrong reports with an `action` field no component can receive; 4/4 for two rounds. | **Y** |
| 20 | Burnout Risk | **MERGE** (host, renamed "Attendance Risk") | Same population, same `classifyEvent` dependency, same card DOM as #22; uxr re-confirms this merge is *not* a dumping ground. | **Y** |
| 21 | Predictive Attrition (Drift) | **CUT** — permanent | Window math is 8.4–8.9wk over a hardcoded `6`; concept returns as a population toggle, never a screen. | **Y** |
| 22 | Missing Volunteers | **MERGE** into #20 | A filter and a threshold, not a destination. | **Y** |
| 23 | Recruitment Intelligence | **SIMPLIFY** | Candidate list + Ask Script sound; invented `Match Score` and the open clearance gate are the defects. | **Y** |
| 24 | Retention Funnel (Newcomer) | **FIX** | Only screen in the area with zero live safety findings; two named defects, no ornament; ships first. Admin re-confirmed. | **Y** |
| 25 | Bus Factor | **SIMPLIFY** (scope **reduced** this round) | Solo count survives as coverage ops info; minors tier CUT, silo list demoted below the fold, clearance narrowed to fail-closed states on config-declared teams. | **Y** (verdict); scope shrank |
| 26 | Volunteer Web | **CUT** | 251 lines of physics with no legend, keyboard path or action; successor ships relabelled and demoted. | **Y** |
| 27 | Emergency Alerts | **CUT — domain veto** | Fabricated success banner on a safety-critical send; no `isChild` filter, no guardian routing. 4/4 for three rounds. | **Y** |
| 28 | Automations | **CUT 3 lanes + SIMPLIFY the rest** | Both background-check lanes and First-Time-Giver read fabricated fields; survivors lose their fake writes. | **Y** |

Net nav effect unchanged for the third round: **10 Intelligence slots → 5**
(`attendance-risk`, `recruitment`, `retention`, `bus-factor`, `automations`).
Five routes removed, zero added. N1–N3 add **zero** nav slots.

**Every verdict in this table is now CONVERGED.** Rounds 4–5 have no verdict
work left in Area C — only the three questions in §4 and the sequencing in §3.

---

## 3. Settling this round

### 3.1 Q6 — resolved against my own lean (see §1.1). What actually ships on #25.

The surviving item on `bus-factor` is one list, in ops language:

- **Heading:** "Teams running on one volunteer" — not "single points of
  failure" (which ranks a named person as a liability), not "solo with minors".
- **Row:** person, team name as returned by PCO (`eventNameMap`), solo shifts /
  total shifts in the window. No shield, no risk score in the headline, no
  compliance verb.
- **No `servesMinors` field is added to `BusFactorCandidate`.** The team name is
  the only minors signal, and the reader supplies the inference.
- **Clearance column renders only for teams a church has explicitly declared
  minors-facing in `ConfigModal`** (the same config surface §4.3 builds for
  event classification) — **declared, never inferred from a name**. Until a
  church declares a team, the column does not render at all. This satisfies
  youth's objection (no new keyword classifier ever ships), children's
  narrowing (no clearance badges on production/hospitality rows, which train
  people to ignore the badge), and admin's need (a coordinator can still see
  clearance where it matters).
- **Clearance states on that column: "Not cleared" and "Unknown — verify before
  scheduling" only.** `true` renders as *nothing* — no green check, no
  "Cleared" word. The column exists to raise doubt, never to close it.
- **`analyzeCluster` gets the `!isChild` exclusion as a precondition, not a
  bullet** (children, promoted). Verified: `busFactor.ts:95-125` has no
  `isChild` filter today, so a 16-year-old helper checked in as
  `kind: 'Volunteer'` makes `teamSize === 2` and the adult never registers as
  solo — a false negative in the dangerous direction, the same failure class
  that got #21 and #27 cut.

### 3.2 UXR: #25 is a dumping ground — the silo list comes out

**Adopted.** v2 stacked four different reliability profiles into one table:
a real count, a name-pattern minors flag, a different metric family, and a
mostly-null boolean. §1.1 deletes the second. This deletes the third from the
primary table.

The team-silo list moves to a **collapsed secondary disclosure below the fold**
on `bus-factor`, with its own heading — "Team roster overlap" — its own row
format, and no "risk" vocabulary. It must not share a visual register with the
solo list. (I chose the collapsed-disclosure option over uxr's cheaper
"park it in Automations": Automations is a list of per-person action lanes, and
a team-level structural observation with no person to act on would be the same
category error one screen over.)

**#20+#22 is explicitly *not* a dumping ground** — uxr's own finding, adopted:
the student toggle reuses the identical `missing.ts` absolute-zero predicate
with one eligibility gate swapped, and CSV/threshold work is governance on the
existing job. No change to that merge.

### 3.3 UXR: N3 does not replace Volunteer Web — relabel, stop claiming it does

**Adopted; v2 overclaimed.** Two distinct losses, both real:

- Pairwise `Set` intersection cannot detect a path. If A and C never directly
  share a volunteer but both share one with B, the graph rendered one connected
  cluster; N3 will report "A and C have never shared a volunteer" — a
  false positive on exactly the claim the feature exists to make.
- `volunteerWeb.ts` edges required same-event-same-day co-presence
  (`shiftGroups` keyed `eventId:date`); N3's team-level sets answer
  "ever rostered on both", which is roster overlap, not co-presence.

**Ship it labelled "no shared roster history"** — never "have never worked
together", never "isolated from the volunteer network". State in the proposal
and in the UI copy that this is direct overlap between two named teams, not
network connectivity. True component connectivity is ~20 lines of union-find
over the same `shiftGroups` if anyone ever wants it; **it is not in scope and
v3 does not imply N3 is it.**

### 3.4 Youth: split the gate, write the date window, surface "Students"

**All three adopted.**

- **Gate split.** `missing.ts:69`'s `recentCount` never touches
  `classifyEvent`; the student predicate swaps out `historyServingCount >= 2`,
  the only consumer. **The Students tab ships the day the predicate lands and
  does not wait on §4.3 or the `!isChild` gate** (it is *for* `isChild`
  students). Only the Volunteers population and `bus-factor` stay behind §4.3 +
  `!isChild`.
- **Write the June 1 – Aug 15 suppression.** Two date comparisons in
  `missing.ts`; do not cite `automations.ts:67-96`, which contains no such
  window. Drop grade-12 from the population each spring.
- **Naming.** Route `burnout` → **`attendance-risk`** (not `volunteer-risk`);
  screen title "Attendance Risk — Volunteers & Students"; the
  `SidebarIntelligence` label must contain the word **Students** at the top
  level, with a deep link `?population=students` opening the tab directly. Zero
  new routes, zero new nav slots — the word simply has to exist where a
  scanning eye lands.
- **Default-sort the Students tab by longest-missing first** (youth's residual
  ask). Same for the Volunteers tab once the `Math.max(2, missingWeeks)` floor
  (`missing.ts:94`) is dropped.

### 3.5 Admin: deploy condition confirmed

`attendance-risk` and the `bus-factor` solo list **do not re-enter the nav**
until §4.3 (`classifyEvent`) and the `!isChild` gates in both `burnout.ts:79`
and `busFactor.ts:95-125` have landed. The Students tab is exempt (§3.4).
Otherwise the five-slot end state is deployable as specified.

---

## 4. The concrete work, ordered by value-per-effort

Unchanged from v2 §4 except where noted. Deletions first.

1. **§4.1 Delete Emergency Alerts** (~30 min) — CONVERGED, unchanged.
   `EmergencyAlerts.tsx/.css/.test.tsx`, `App.tsx:944-948`,
   `SidebarIntelligence.tsx:222-226`. No stub, no recipient count.
2. **§4.2 Cut three #28 lanes + both fake writes** (~1 h) — CONVERGED,
   unchanged. Includes deleting `background_check_expires_at` from
   `pco.ts:17,86,231,275`, `automations.ts:122-151`, and the four test files.
3. **§4.5 Cut #19; repoint Intelligence landing to `retention`** (~1 h) —
   CONVERGED, unchanged.
4. **§4.7 Cut #21 Drift including `drift.ts`** (~1 h) — CONVERGED, unchanged.
5. **§4.6 Cut #26 Volunteer Web**, keeping ~40 lines (`volunteerWeb.ts:30-56`,
   the serving filter and `shiftGroups` builder) relocated into `busFactor.ts`
   to feed the demoted N3 list (~1 h) — **changed:** the successor is a
   below-the-fold disclosure labelled "no shared roster history" (§3.2, §3.3).
6. **§4.11 #24 Retention FIX** (~half day, ships first) — CONVERGED, unchanged.
7. **§4.3 Fix `classifyEvent`** (~2 h) — **prerequisite for the Volunteers
   population and `bus-factor`, not for the Students tab.** Worship keywords
   before Serving; `kind === 'Volunteer'` authoritative; emit `'Unknown'` counts
   so `BurnoutReport.tsx:74-78` stops printing "All Clear! 🎉" over
   unclassifiable data; move keyword lists into `ConfigModal`. **Delete v2's
   "soloCount permanently 0" rationale (§1.2) and replace it with the
   over-admission/masking rationale.** Add to the same config section: the
   church-declared **minors-facing team list** that gates §3.1's clearance
   column.
8. **§4.4 Thresholds into config** (~2 h) — CONVERGED, unchanged
   (`burnout.ts:86-91`, `missing.ts:76` and `:39-42`, `recruitment.ts:95`).
9. **§4.8 Merge #22 into #20 → `attendance-risk`** (~1.5 days) — changed per
   §3.4: split gate, route/label rename, written date window, longest-missing
   default sort. Everything else stands (flags array, group-by-team default,
   unified fetch depth, `ui-avatars.com` removal, CSV governance).
10. **§4.10 #23 Recruitment** (~1 day) — CONVERGED, unchanged except that the
    fourth-state banner text must not imply a live signal it cannot be (§1.1):
    if the attribute is absent org-wide, say so once, at the screen level, and
    keep every child-facing role suppressed.
11. **§4.9 #25 Bus Factor** (~1 day, down from 1.5) — **scope reduced.**
    `!isChild` exclusion in `analyzeCluster` (precondition); §4.3's fix; headline
    to "Teams running on one volunteer"; align `.slice(0,5)` chart vs
    `.slice(0,10)` table; keyboard/ARIA on the tooltip with the content also
    present as table text. **Removed from scope:** `servesMinors`, the minors
    tier, all safeguarding language. **Demoted:** the roster-overlap list.

---

## 5. Named gaps — recorded, owned, not silent

Not questions. Decisions to state out loud so they are not mistaken for
oversights.

- **Re-screening cadence / clearance expiry.** `passed_background_check` is a
  boolean with no date. "This clearance is about to age out" lives in PCO's
  separate Background Checks resource and **is not built here**. A director
  seeing anything other than "Not cleared"/"Unknown" must not infer currency.
  Named future integration, owner required.
- **Emergency messaging.** We deleted the fake one and are building nothing.
  Check-in-scoped guardian messaging ("text the guardians of children currently
  checked into Room 204") needs a messaging backend, guardian routing,
  split-household handling, an audit trail and a confirmation step — none exist.
  **Explicit product gap with an owner, not a silent scoping decision.**
- **Child-ratio / two-adult-rule compliance is out of reach** until Check-Ins
  data is joined across the attendee event and the volunteer event by time
  window. No version of Locus answers "was this Sunday legal" today.
- **Small-group drift** remains unbuildable until §4.3's config-driven tagging
  ships *and* a church tags its own small-group events.

---

## 6. Unresolved — the only questions rounds 4–5 need to settle

**Q9 (carried, still genuinely open). Is `historyServingCount >= 2` in 6 weeks
the right definition of "key volunteer"?** §4.4 makes it configurable, which is
not an answer — a default that systematically misses the quarterly tech-booth
volunteer is still wrong for every church that never opens the config screen.
Does the gate need a *rarity-weighted* notion (serves seldom, but is the only
one who can) rather than a frequency floor? That is the same question the solo
count answers from the other side, so the two may want to be one computation.
Admin explicitly left it open; uxr raised it in r1 and r3. **Nobody has
answered it in three rounds — round 4 must, or state that it will not be.**

**Q11 (new, and it decides whether clearance ever renders at all). The
minors-facing team list is now church-declared config (§3.1). What does the
screen do for the churches that never fill it in?** If the honest answer is
"the clearance column never appears for most orgs", then N2's fetch is being
kept alive for Recruitment alone, and round 4 should say whether the column on
`bus-factor` is worth building at all versus keeping clearance solely on #23
where the ask-script actually invites someone into a child-facing role.

**Q12. Does the demoted roster-overlap list survive its own demotion?** UXR
names it the least load-bearing addition in the area, with a known
false-positive mode (§3.3), now sitting below the fold on a weekly-read staff
screen. It is ~15 lines, which is why I am keeping it — but "cheap" is the
argument that built the 45 surfaces this audit is cutting. If round 4 thinks a
collapsed section nobody opens is not worth the false positives, the honest
verdict is to cut N3 and delete `volunteerWeb.ts` entirely rather than keep 40
lines of it alive.

**Closed this round: Q6** (§1.1 — solo count ships as ops info, minors framing
cut), **Q7** (§1.1 — resolved with Q6, same motion), **Q8** (§5 — stated as an
owned product gap). Q1, Q3, Q4, Q5 closed in v2 and not reopened by any critic.

---

## 7. New ideas earned this round

**None.** No critic named an unserved job this round; all three rulings were
subtractions or corrections. Carrying forward:

- **N1 `Cmd+K` route jump** (routes only, no person index) — replaces #19.
  **CONVERGED**, unchanged for two rounds.
- **N2 fetch `passed_background_check`** — replaces the fabricated
  `background_check_expires_at` read path. **CONVERGED** as a data substitution
  (net-negative in code); **scope narrowed** by §1.1 and §3.1: fail-closed
  negative states only, no green "Cleared", column gated on church-declared
  teams, and subject to Q11.
- **N3 team roster-overlap list** — replaces the *rendering* of #26, not its
  connectivity question. **Relabelled and demoted** (§3.2, §3.3); on notice per
  Q12.
- **Retired in v2:** the pinned safeguarding block. **Retired in v3:** the
  "Solo with minors" tier and any `servesMinors` classifier — permanently,
  unless a real PCO-sourced audience field and populated clearance data both
  appear. If a future version re-attaches safeguarding language to this tier
  before the event join exists, it fails the standard again and should be cut
  on sight.
