# Round 3 — pastoral-ops — children's ministry critique of proposal-v2

Scope per instructions: rule on Q6 ("Solo with minors"), verify and judge N2
(`passed_background_check`), flag anything else briefly. #19–#23, #26, #27 not
reopened.

---

## 1. Q6 — Does "Solo with minors" survive the standard that cut #21/#27/#28?

**Ruling: SHIP-CONDITIONAL.** Not cut, and not the vague "ship-with-caveats" v2
offered without confidence. There are three hard conditions below; without all
three this reverts to CUT.

### First: two of the three admissions in Q6 don't hold up. I checked.

I read `src/utils/busFactor.ts` line by line against `mock-api/data.js` before
ruling, because I am the person who would act on this number.

- **"Returns zero until `classifyEvent` is fixed" — false, verified.**
  `busFactor.ts:30-33` already reads:
  `servingEventIds.has(eventId) || c.attributes.kind === 'Volunteer'`.
  It already trusts `kind === 'Volunteer'` independent of name-keyword
  classification — the fix §4.3 proposes for this file is already in the file.
  I confirmed against the mock data's built-in scenario for exactly this case:
  `mock-api/data.js:347-357` has Linda serving "Kids Ministry" (event id `4`)
  alone in ~95% of simulated weeks with `kind: 'Volunteer'`, and event `4`'s
  name ("Kids Ministry Team") is already correctly classified `'Serving'` by
  the current keyword list (`burnout.ts:15`, matches on `team`/`ministry`).
  `busFactor.test.ts` independently confirms solo detection works today with
  `kind: 'Volunteer'` fixtures. The tier is not silently disabled. This
  specific claim in v2 should be corrected, not carried into round 4.

- **"Cannot count children present" — true, and it is the load-bearing
  objection, not a side one.** Kids check into event `2` ("Sunday Kids Church");
  volunteers check into event `4` ("Kids Ministry Team") — two different event
  IDs (`mock-api/data.js:213-234`), and `calculateBusFactor` never joins them
  by time window. This is not a data-quality bug to fix later; it is a
  structural gap in what Check-Ins records. No version of this feature can
  answer "was this legal" without that join.

- **"Clearance null for most real records" — true in general, weaker for this
  specific population, still not a green light.** The volunteers who land in a
  "solo with minors" tier are, by construction, exactly the people a
  functioning Safe Sanctuary program has already run background checks on. A
  well-run children's ministry has *higher* completion on this subgroup than
  the org-wide average the proposal cites. But "well-run" is precisely what
  this alert exists to catch the failure of — so I will not assume the
  population that needs the alert most is the population with the best data.
  Unknown must render loud, not reassuring-by-omission.

### What I found instead, and it changes the shape of the ruling

`analyzeCluster` (`busFactor.ts:106-125`) has **no `!isChild` filter on cluster
membership today.** A 16-year-old helper checked in as `kind: 'Volunteer'` on
the same team currently makes `teamSize === 2`, so the adult does **not**
register as solo. That is a false *negative* on the one question this tier
exists to answer — the same failure class that got #21, #27, and three
Automations lanes cut this round: a confident answer that is wrong in the
dangerous direction. §4.9 already lists the `isChild` exclusion as a bullet;
I am promoting it from a bullet to a **precondition**, same treatment §3.6
gave the `isChild` gate on the merged risk screen.

### Why ship and not cut

This is a Tuesday report, not a Sunday alert (§1.4, staff-only, no
notifications) — cutting it does not prevent an in-the-moment ratio breach,
because nothing in this proposal does that today. The real choice is between
"a director gets a retrospective worklist of who served alone on a
minors-facing team" and "nothing." Unlike the cut items, this doesn't invent a
number (soloCount is a real count of a real thing: distinct adults on a
cluster of real check-ins) — it's honest about what it *doesn't* know. That
is the distinguishing test versus #21/#27/#28, and on that test it passes,
conditionally.

### The three conditions to ship

1. **Fix the `isChild` masking bug first** (`busFactor.ts:106-125` — exclude
   `student.isChild` from cluster membership). Without this, "not solo" is
   sometimes a lie, and that is worse than an admitted unknown.
2. **The "not a ratio count" caveat must render on every row, not live in this
   document.** "1 adult logged alone" next to a name reads as a completed
   safety check to a volunteer coordinator skimming a list at 9pm on a
   Tuesday. It must say, inline, every time: *this counts logged-in adults on
   this team, not children in the room — verify in person.*
3. **Clearance renders as a loud "Unknown — verify manually" badge (N2's
   fail-closed default), never blank, never green-by-omission**, specifically
   in this tier — this is the one place in the whole app where an unknown
   clearance sits directly next to a child-facing team name.

### What the failure mode costs on a real Sunday

If it ships without condition 1: a genuinely solo adult with an unvetted teen
"helper" reads as fully staffed, and nobody follow-up-calls that volunteer —
the exact miss the tier exists to prevent, self-inflicted by the tool. If it
ships without conditions 2–3: a director sees "Solo: 1, Cleared" (from a
`null`-rendered-as-blank clearance) and treats a genuinely unverified
situation as closed. If it is cut entirely: the status quo — nobody has even a
retrospective worklist, and the two-adult rule is enforced by whichever
volunteer happens to notice, which is the same as not being enforced. Cutting
trades a bounded, honestly-labeled tool for silence; I'd rather have the
bounded tool.

---

## 2. N2 — fetch `passed_background_check`, build the fail-closed gate on it

**Verified independently — the proposal's claim is exactly right and slightly
understates it:**

```
grep -rn "passed_background_check" src/ mock-api/   →  zero matches, anywhere
grep -rn "background_check_expires_at|backgroundCheckExpiresAt" src/ mock-api/
  →  pco.ts:17, :86, :231, :275; automations.ts:124,126,139,141;
     AutomationsReport.test.tsx:9; automations.test.ts:171; pco.test.ts:64;
     copilot.test.ts:90; mock-api/data.js:85,88,90,92,127
```

`mock-api/data.js:81-93` generates the fabricated field under the literal
comment `// Simulate Background Check Expiry`, `Math.random()`-bucketed
(40% `null`, i.e. "not applicable," even in the mock's own generator) — three
lines from `prayer_topic`, in the same fabricated-field family already
established in round 1. The real field is never fetched, not once, in this
entire codebase, despite being the one Person-resource attribute PCO actually
exposes for this purpose.

**Judgment: yes, build the four-state gate on the boolean. It is worth it, for
reasons stronger than "it's real data":**

- The safety-critical question I actually ask at the folding table is "is
  this person cleared *right now*," not "how many days until their clearance
  lapses." The boolean answers the question I ask more directly than the
  fabricated date ever did — the date only ever answered "how many days until
  a number that was never real reaches zero."
- Fail-closed on this field is cheap to get right precisely because it's a
  boolean: three of the four states (`true`/`false`/`null`) fall directly out
  of the value, no derived math, no expiry-window arithmetic to get wrong.
- **What is genuinely lost, and it should be named on the roadmap, not just in
  this document:** re-screening cadence. Most Safe Sanctuary policies require
  periodic re-clearance (commonly every 3 years); a boolean with no date
  cannot tell a director "this clearance is about to age out," only "is it on
  file at all today." That capability lives in PCO's separate Background
  Checks resource (with real expiry dates) and is explicitly out of scope
  here. I want it recorded as a **named future integration**, not folded
  silently into "N2 done" — a director who sees "Cleared" on this boolean
  should not assume it also means "current," because the boolean cannot
  express staleness.

Net: substitution accepted. A real, always-current yes/no on the exact
question I ask most often is worth more than a fabricated countdown that was
never wired to anything, even though it costs the renewal-nudge use case.
That gap should be a tracked follow-on, not a silent loss.

---

## 3. Anything else in v2 I object to

- **§4.3's busFactor.ts fix description is stale** — see §1 above. Don't let
  round 4 inherit "soloCount is permanently 0" as fact; it isn't, for the
  scenario the mock data itself was built to demonstrate. The real defect in
  that file is the missing `isChild` exclusion, which v2 already lists but
  under-weights.
- **§4.9's clearance column is specified for "rows in the solo-with-minors
  tier" only.** Good — don't widen it to every row on Bus Factor. Clearance
  badges on adult-only teams (production, hospitality) with no minors present
  are noise that trains people to ignore the badge everywhere, including where
  it matters.
- **Q8 (Emergency Alerts replacement) — agree with v2's framing, want it
  sharper.** "We deleted the fake one and built nothing" needs an explicit
  backlog line with an owner, not a scoping decision made silently inside an
  audit doc. Check-in-scoped messaging ("text guardians of children currently
  in Room 204") is the actual emergency tool a building needs; a generic
  broadcast never was.
