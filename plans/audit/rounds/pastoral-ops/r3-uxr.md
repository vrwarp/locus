# Area C — Round 3 — UXR

Scope: three questions only, per round-3 instructions. All other v2 verdicts
CONVERGED and not reopened.

---

## 1. Does N3 preserve the question Volunteer Web uniquely answered?

**No — it preserves a narrower question wearing the same name, and the gap is
the same one I flagged in r2, still unaddressed.**

Verified `volunteerWeb.ts:22-140` against `busFactor.ts:13-125` and N3's spec
(`proposal-v2.md:379-382`). Two distinct losses, not one:

- **Transitive connectivity vs. pairwise isolation.** My r2 framing (`r2-uxr.md:89-115`)
  was: Volunteer Web's graph shows *component structure* — if Team A and Team C
  never directly share a volunteer but both share one with Team B, the force
  layout renders A–B–C as one connected cluster, i.e. the church is **not**
  actually siloed even though no single pair overlaps. N3 is `Map<teamName,
  Set<personId>>` with pairwise `Set` intersection (`proposal-v2.md:379-382`) —
  it will list "A and C have never shared a volunteer" as a silo finding even
  when A and C are one hop apart through B. That is a real false-positive risk
  for the exact claim the feature exists to make ("nobody here has ever worked
  alongside them"). Pairwise intersection cannot detect a path; only graph
  reachability can. This is not a nitpick — it inverts the headline in the
  two-hop case.
- **Co-shift vs. ever-rostered.** `volunteerWeb.ts:41-56`'s edges require two
  people in the *same event, same day* (`shiftGroups` keyed
  `eventId:date`) — a fact about people who have actually met. N3's team-level
  `Set<personId>` (built from the relocated `shiftGroups`, per §4.6) answers
  "has anyone ever rostered on both teams," which is a roster-overlap fact, not
  a co-presence fact. Weaker claim, different claim — should be labelled
  "no shared roster history," not implied to mean "have never worked together."

**Verdict: N3 answers a cheaper, adjacent question — direct roster overlap
between two named teams — not "which teams are isolated from the rest of the
volunteer network," which was the one graphs uniquely showed. Ship it, but
relabel it ("X and Y have no roster overlap") and do not claim it replaces
the connectivity finding. If true component-connectivity matters later, it's
a ~20-line BFS/union-find over the same `shiftGroups`, not a new screen — but
v2 should stop implying N3 already is that.**

---

## 2. Has the merged risk surface become a dumping ground?

**Yes, on #25 Bus Factor specifically — not on #20+#22.** The round-3 prompt
lumps five jobs onto "the merged risk screen," but per proposal-v2 §4.8 vs
§4.9 they split across two routes, and the two routes are not equally guilty.

**#20+#22 "Volunteer Attendance Risk" (`proposal-v2.md:326-365`) — still
coherent.** Burnout + Missing merge on the original r1 rationale (same
population, same `classifyEvent` dependency, same DOM — `proposal-v2.md:86`)
and that rationale still holds after the merge. The student-population toggle
is not a third job bolted on; §3.1 shows it is *the same predicate*
(`missing.ts:76`, `stats.recentCount === 0`) with one gate swapped — genuine
reuse, not scope creep. CSV export and thresholds are governance/config
overhead on the existing job, not new jobs. This one earns KEEP-as-merged.

**#25 Bus Factor (`proposal-v2.md:367-392`) — yes, dumping ground.** One route
now answers four qualitatively different questions with four different
reliability profiles on one table: (a) solo-count — real, once §4.3 lands;
(b) "serves minors" — a name-pattern proxy, same category of heuristic as
`classifyEvent`, which is *why* §4.3 exists; (c) team-silo — a different
metric family entirely (§1 above — network structure, not per-shift fact),
absorbed here only because #26 needed a home; (d) clearance — a boolean null
for most rows. This is exactly the pattern I argued for merging #20/#22 to
avoid in round 1: unrelated jobs sharing a route because deleting their
screens left them homeless, not because they belong together.

**What comes back out: the team-silo list.** It is the one addition with no
computational kinship to solo-counting (§1's distinction), it is admittedly
the least load-bearing (an ops/culture insight, not a safety fact), and its
false-positive risk (§1) makes it the worst thing to co-render next to a
safety-adjacent tier — a reader scanning down the Bus Factor table for
safeguarding risk should not also be reading team-culture trivia in the same
visual register. Demote it to a collapsed/secondary disclosure below the fold,
separately labelled, or — cheaper — park it as a link out of Automations'
"real detectors" list instead of a peer section on Bus Factor. Either way it
should not share a row format or a "risk" heading with solo-with-minors.
Clearance and solo-with-minors stay; they share both population and stakes.

---

## 3. Does "Solo with minors" survive the standard that cut #21/#27/three #28 lanes?

**No, not as safety framing. The solo-count survives; the "with minors" +
clearance framing does not.**

The standard applied elsewhere this round: cut when an unreliable computation
is presented with the confidence of a safety-relevant answer
(`proposal-v2.md:425-436`, Q6). Checked against the three admitted defects:

1. **Cannot count children present** — confirmed structurally, not just
   claimed: kids check into `Sunday Kids Church` (`mock-api/data.js:220-222`,
   `id: '2'`), adults serve on `Kids Ministry Team` (`data.js:233-236`,
   `id: '4'`) — two different event IDs, and `calculateBusFactor` never joins
   across events by time window (`busFactor.ts:13-125` — grouping key is
   always a single `eventId`). A tier named "Solo with minors" implies a
   child-ratio fact it structurally cannot compute.
2. **`servesMinors: boolean` doesn't exist yet and would be built the same
   way `classifyEvent` is** — team-name keyword matching. That is the exact
   mechanism whose "ministry" precedence bug just got cut for #21/#27's
   siblings. Layering one keyword heuristic (serves-minors) on top of another
   already proven wrong (classifyEvent) on a safety-labelled tier is the
   pattern, not an exception to it.
3. **Clearance is the one piece that *does* survive**, because N2's four-state
   fail-closed design (§3.2) is built precisely so a null reads as "Unknown —
   verify manually," not "cleared." That is the opposite failure mode from
   #21/#27 (confident wrong answer) — it is an honest "we don't know."

Net: the *measurement claim* in "Solo with minors" (child ratio, minors
present) fails the standard the same way #21's window math and #27's
recipient list did. The *plain fact* (one adult, alone, on a team) is real
once §4.3 lands and is worth keeping as ops information. **Resolution: ship
the solo-count as an ops list ("this team has only one trained volunteer this
period"), drop "with minors" and any safeguarding/ratio language entirely,
and keep the clearance badge only in its fail-closed "Unknown" form, never as
a green "Cleared" checkmark on this tier** — a confident-looking checkmark
built on a field that's null for most records recreates the exact
false-reassurance failure this proposal cut everywhere else. This also
answers Q7 in the same direction: a lagging, honestly-captioned ops list is
fine; a lagging list wearing safeguarding language is theatre.
