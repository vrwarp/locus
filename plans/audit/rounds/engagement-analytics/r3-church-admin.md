# Round 3 — church-admin — Area D (engagement-analytics)

Scope per instructions: three questions only. All other v2 verdicts are
CONVERGED and are not reopened here.

---

## 1. Is first-time-guest actually buildable, or is it the `first_time_giver` trap again?

**Verified clean. It is not the same trap.**

Traced the two code paths side by side:

- **The trap** (`giving`/`anniversary` fields): `transformPerson`
  (`src/utils/pco.ts:231,284-286`) destructures `first_time_giver`,
  `first_gift_date`, `anniversary` straight out of a Person's `attributes`
  blob, with no `field_data` custom-field traversal. `PcoAttributes`
  (`pco.ts:19-21`) declares them as if they were core PCO People fields. They
  are not — PCO People has no such core attributes, Locus has no Giving API
  access, and the only place these fields are populated is
  `mock-api/data.js`. That's fabrication dressed as a schema.
- **First-time-guest**: `calculateNewcomerFunnel` (`src/utils/retention.ts:10-43`)
  derives "newcomer" status entirely from `PcoCheckIn.attributes.created_at`
  and `PcoCheckIn.relationships.person.data.id` (`pco.ts:110-121`) — the
  `id`, timestamp, and person-relationship on every row `fetchRecentCheckIns`
  already pulls (`pco.ts:507-527`). `created_at` and the person/event
  relationships are core, documented attributes of the PCO Check-Ins v2
  `check_ins` endpoint, not something synthesized only in the fixture to make
  a chart look real. N2's proposed `firstTimeCount` reducer is a groupBy over
  data already in memory — no new fetch, no new field, no `attributes`
  guessing.

Conclusion: N2 (first-time-guest series) is real. It is the one surviving
argument from my R1 ask, and it survives because it is built on check-in
identity data, not a fabricated People attribute. I withdraw nothing here —
this is the correct ruling and I'd have made the same cut on the giving and
anniversary overlays myself.

---

## 2. `fetchRecentCheckIns`, 13 uncached call sites, 6 at ~10k records

Confirmed by grep: 13 non-test call sites. Six at the 100-page default
(`Dashboard.tsx:33`, `CoPilot.tsx:43`, `RecruitmentReport.tsx:26`,
`NewcomerFunnel.tsx:18`, `AttendancePulse.tsx:27`, `CheckInVelocity.tsx:22`),
seven at 20 pages. `fetchRecentCheckIns` (`pco.ts:507-527`) issues one HTTP
request per 100-record page — the 100-page default is up to **100 separate
API calls** per component mount, not one.

I am the one who holds the PCO Personal Access Token this app runs under,
and PCO enforces a hard, shared rate ceiling per token across every app
using it — this app is not the only consumer; check-in station iPads and any
PCO-native automations share the same budget. A 1,200-attender church
clears 10,000 check-ins well within a year, so this isn't a fixture
artifact, it's the real-scale case. An exec pastor who opens Co-Pilot, then
clicks into Dashboard, Burnout, Missing Volunteers, and Drift in one sitting
— a completely ordinary ten minutes on a Monday — refires the full 10k pull
up to six times over, on top of the 20-page pulls, with zero caching between
them. On a Sunday morning, when check-in station traffic against the same
token is at its weekly peak, this is exactly when Locus should be doing
less, not most. If this trips a 429, the failure mode isn't a Locus error
screen, it's the check-in station degrading — that is a pastoral-risk-grade
outage, not a UI bug.

**`useCheckIns` alone is not the fix. It needs a TTL, not just a session
cache.** A pure module-level "once per session" cache (as D1 currently
specs it) is wrong in the other direction: Dashboard and Co-Pilot are both
opened *during* live Sunday check-in, and Sarah will notice — correctly —
if the count on screen doesn't move while families are still checking in
downstairs, and won't trust the app the second time that happens. A cache
with no expiry trades a rate-limit problem for a silent-staleness problem in
the same surfaces that most need to be current. Give it a short TTL (5
minutes is reasonable — long enough to survive a burst of navigation clicks,
short enough that a Sunday-morning check reflects the last few minutes) and
an explicit "as of HH:MM" or manual refresh affordance so staff know they're
looking at a cached number rather than assuming live.

**ACCEPT the `useCheckIns` hook direction, with the TTL requirement attached
as a blocking condition, not a nice-to-have.** Also endorse Q4 as written:
if no cross-area owner takes it, flag it to whoever owns Area D once more —
this is the single highest-value item in the whole document and it does not
get built by accident.

---

## 3. Does Map View earn the area's last route, or does Area D go to zero?

**Area D goes to zero routes.** City-distribution does not earn the slot.

Apply my own frequency test, which the proposal already used to demote
Demographics: how often is this opened, by whom, and what do they do next?
Demographics was demoted at "once or twice a year." Campus siting is a
board-level, capital-expenditure decision — new land, a new lease, a new
staff team — made on a multi-year cycle, not annually. When a church
actually does this work, it's done with a consultant, county growth
projections, drive-time isochrones and financial modeling, not a bar chart
of `Student.address.city` counted per household. Nobody sits down and opens
Locus to make this call; at most, someone screenshots this chart once into a
deck somebody else is building. That is an export's job, not a nav item's.

The proposal's own counter-argument — that the threshold slider and
suppression disclosure "need more room than a card" — doesn't hold once you
accept the frequency argument, because it assumes the value is in ongoing
interactive tuning. It isn't. A decision made once every several years
doesn't need a live slider session; it needs one trustworthy number pulled
on demand. A static top-N table (post-householding, post-k-anonymity-floor,
with the suppressed count stated in text) satisfies the same job as an
export or a Data Health / admin-tools artifact, without spending Area D's
last nav slot and without adding a fourth card that breaks UXR's hard cap
of three.

Governance point while I'm here: even after the householding fix in D9,
this is still a per-family location roster including minors' addresses,
rendered as a chart, on a route anyone with Intelligence access can open
whenever they like — for a decision made once a half-decade. The exposure
doesn't buy proportionate value. An export a director pulls the one year it
matters is the right shape; a permanent bar chart in the sidebar is not.

**Ruling: CUT the route. Ship `calculateCityClusters` /
`suggestCampusLocations` output (with the D9 householding + k-anonymity
fixes still mandatory if built at all) as a CSV/table export reachable from
settings or Data Health, not as a nav destination and not as a fourth
Intelligence Home card.** Area D's net nav change becomes **8 → 0** routes.
