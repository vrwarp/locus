# Area C — pastoral-ops — Round 4 (all four critics)

Scope per moderator: all ten feature verdicts in `proposal-v3.md` §2 are
CONVERGED and not reopened. This round exists solely to close Q9, Q11, Q12
from `proposal-v3.md` §6. Each persona below was read and adopted in full
before writing its section.

---

## UXR

**CONVERGED — NO RESIDUAL OBJECTIONS** on the ten feature verdicts and on
§3.1–§3.5's settled mechanics. Nothing in v3 misstates the code I checked
(`busFactor.ts`, `volunteerWeb.ts`, `App.tsx`, `RobertReport.tsx`).

### Q12 — does N3 survive its own demotion, or does `volunteerWeb.ts` die entirely?

**Ruling: N3 does not survive. Cut it. Delete `volunteerWeb.ts` (all 251
lines) entirely, along with `VolunteerWeb.tsx`, `VolunteerWeb.test.tsx`,
`volunteerWeb.test.ts`, and the references in `App.tsx` and
`RobertReport.tsx`. Do not relocate the 40-line filter/`shiftGroups` builder
into `busFactor.ts`.**

Applying my own output contract's first criterion — task completion, not
feature count — a collapsed, below-the-fold section on a weekly-cadence staff
screen, with no action attached (it names two teams, not a person to follow
up with) and an admitted false-positive mode (§3.3: pairwise `Set`
intersection reports "no roster overlap" between A and C even when both share
a volunteer with B), is a feature nobody acts on. That is the exact failure
mode criterion #1 in my own brief names: "a feature that produces a beautiful
[list] nobody acts on is a failure." Keeping 15–40 lines alive "because
cheap" is the reasoning that built the 45 surfaces this audit exists to cut —
v3 §6 names this tension itself and I am resolving it against keeping the
code.

The "relocate 40 lines" plan is also not the savings it appears to be.
`busFactor.ts:19-31` already filters check-ins to serving events
(`servingEventIds.has(eventId) || c.attributes.kind === 'Volunteer'`) and
already clusters them by time (`differenceInMinutes(currentTime, lastTime) >
60`, `busFactor.ts:60-74`) — a materially better co-presence signal than
`volunteerWeb.ts:41-56`'s same-day `shiftGroups` key. Relocating
`volunteerWeb.ts`'s filter would not be reuse of a capability `busFactor.ts`
lacks; it would be a second, worse implementation of clustering logic
`busFactor.ts` already has, built only to feed a list that has no reader
action behind it. There is no cheap version of N3 worth keeping — the
`shiftGroups`-vs-cluster distinction that made N3 attractive for reuse
evaporates once you actually diff the two files.

Net nav/code effect: unchanged nav count (N3 was never a nav slot); the
`bus-factor` route ships with one section — solo coverage — not two.

---

## Church-Admin

**CONVERGED — NO RESIDUAL OBJECTIONS** on the ten verdicts, on N1/N2, or on
the deploy condition in §3.5.

### Q9 (joint with youth) — is `historyServingCount >= 2` in 6 weeks the right definition of "key volunteer"?

**Ruling: the frequency floor stays as the configurable default (§4.4
already does this), but it is insufficient alone and must be OR'd with the
signal `busFactor.ts` already computes — a person who has ever covered a
serving cluster alone (`soloCount > 0`, `busFactor.ts:120-122`) is a key
volunteer regardless of how many times they've served in the trailing
window.** This is not new heuristic work; `analyzeCluster` already produces
this fact for the Bus Factor screen. Wiring `calculateMissingVolunteers`
(`missing.ts:78`, `const isKeyVolunteer = stats.historyServingCount >= 2`) to
also treat a `soloCount > 0` history as key-volunteer-qualifying answers the
rarity question with data already on hand, not a new proxy field — which
matters, because every new keyword/proxy field in this area (`classifyEvent`,
a hypothetical `servesMinors`) has been the exact thing this audit spent
three rounds cutting. This is the "same computation from both sides" merge
v3 §6 gestures at and never commits to; I am committing to it.

What this does *not* fix, and I am naming the limit rather than pretending it
doesn't exist: a volunteer who shares a shift with exactly one other person —
never solo, never below the frequency floor either if they show up twice —
who is nonetheless the only one of the two who can actually run sound, is
invisible to both signals. Catching that needs roster-capability data (who
is *qualified* to run a role, not just who logged into it) that nothing in
PCO Check-Ins exposes. That is a real gap but it is a data-availability
problem, not a modeling problem this audit can spend more rounds solving —
name it as a limitation in the screen's own copy ("based on check-in
frequency and solo coverage; does not know who else is qualified for a
role") rather than pretend the floor+solo-OR is complete. `historyServingCount
>= 2 OR soloCount > 0` is worth shipping now; a true skills-aware rarity
model is not buildable from data this app has and should not be promised.

This does not touch the Students tab — its predicate (`missing.ts:69`,
`stats.recentCount`) is unrelated to `historyServingCount` and stays as
specified in v3 §3.4.

---

## Youth Ministry

**CONVERGED — NO RESIDUAL OBJECTIONS.**

### Q9 (joint with admin) — concurrence, from the leader side

I agree with admin's ruling: `historyServingCount >= 2 OR soloCount > 0`.
From my seat this matters for exactly the case I'd otherwise lose — a
volunteer leader who only works retreats and Christmas Eve (well under any
2-in-6-week floor) but who was the only adult on a small-group shift at some
point registers via the `soloCount` path, not the frequency path. That is
the quarterly-volunteer failure mode I would have flagged if admin hadn't
already closed it, so I have nothing to add beyond confirming the fix covers
the case my domain cares about.

One scope note, not an objection: this ruling is entirely inside the
Volunteers population of `attendance-risk`. The Students tab's predicate
(zero check-ins of any kind, `missing.ts:69`) has no "key volunteer" concept
and should not grow one — a student isn't "key" by attendance frequency, and
importing this logic onto the Students tab would reintroduce the exact
adult-attendance-model-applied-to-teenagers error I spent rounds 1–3
objecting to. Q9's answer stays scoped to the Volunteers population, as v3
already scopes it.

---

## Children's Ministry

**CONVERGED — NO RESIDUAL OBJECTIONS** on the ten verdicts, on N2's
fail-closed clearance boolean, or on the `!isChild` precondition in
`analyzeCluster` (`busFactor.ts:95-125`, promoted from bullet to precondition
in v3 §3.1 — my r3 ask, adopted).

### Q11 — does the clearance column on Bus Factor ever render for orgs that never fill in the declared minors-facing team list, or does clearance belong only on Recruitment?

**Ruling: clearance belongs only on Recruitment. Cut the clearance column
from `bus-factor` entirely, and cut the church-declared minors-facing team
list from §4.3's `ConfigModal` work — it has no other consumer once the
column is gone.**

The honest answer to the first half of the question is yes, it sits empty
for most orgs, and I know this from running the office, not just reading the
code: `ConfigModal` (`src/components/ConfigModal.tsx`) is a settings screen,
and per admin's own standing finding, "anything requiring training beyond
one screen of instructions will not survive the volunteer turnover cycle" —
a declare-your-minors-facing-teams step is exactly the kind of one-time setup
work that gets skipped at rollout and never revisited. That produces the
same failure v3 itself just cut N2 for on the org-wide `null` boolean: a
badge presented as live that in practice never varies for the org looking at
it. Building a second config gate on top of the first (declare minors-facing
teams, *then* the boolean has somewhere to render) doubles the odds nobody
ever sees the column, for a UI element that costs real engineering time in
§4.3 to gate correctly.

Recruitment does not have this problem, because it does not need a config
step at all. `recruitment.ts:83-97` already derives `potentialRoles`
unconditionally from real household data — a candidate is tagged "Kids
Ministry" when a child in their household is age 5–10, "Student Ministry"
for ages 11–18 (`recruitment.ts:104-110`) — with no admin setup, no declared
list, nothing to forget to fill in. That is precisely the moment clearance
matters most: someone is about to be asked, by name, in an `Ask Script`
(`recruitment.ts:132-176`), to serve alongside children. Clearance rendered
there, fail-closed per N2, reaches every org on day one. Clearance rendered
on `bus-factor`, gated behind a second config step, reaches whichever
fraction of orgs happens to complete setup — and I'd bet against most.

This also simplifies §4.3: the "church-declared minors-facing team list"
line item in the config work goes away, and `bus-factor` ships as the plain
solo-coverage list v3 already reduced it to, with no clearance column at all.
The `!isChild` precondition in `analyzeCluster` stays regardless — that one
protects the solo *count* itself, not a clearance badge, and is unrelated to
this ruling.
