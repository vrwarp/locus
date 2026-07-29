# Area C — pastoral-ops — Round 2 (church-admin) — Adversarial Critique

Attacking `plans/audit/rounds/pastoral-ops/proposal-v1.md` against source and
against the real Planning Center People API.

---

## 1. Q1 settled: `background_check_expires_at` is fabricated, same as `prayer_topic`/`first_time_giver`

**Ruling: it is not a real PCO People attribute. The proposal's Q1 is answered
NO, and it flips the area's most-praised feature.**

Code trace, mirroring exactly the method I used on `prayer_topic` in round 1:

- `mock-api/data.js:81-93` generates it under the comment `// Simulate
  Background Check Expiry` with the same hand-rolled percentage buckets as
  `prayer_topic` (`:95-100`) and `first_time_giver` (`:102-108`) sitting three
  lines below it in the same loop, over the same synthetic adult record
  (`data.js:117-132`).
- `src/utils/pco.ts:17` declares `background_check_expires_at?: string | null`
  as a top-level field of `PcoAttributes` — the interface documenting what the
  code believes the real Person resource returns — alongside `prayer_topic` and
  `first_time_giver` at `:18-19`.
- `pco.ts:231` destructures it straight off `attributes` and `pco.ts:275` maps
  it 1:1 to `backgroundCheckExpiresAt` with no transform, no fallback fetch to
  a separate resource, nothing that would indicate the author knew this comes
  from anywhere other than the Person JSON:API attributes.

That is circumstantial but exact structural parity with the two fields already
proven fake. I went further and checked the real API:

- I pulled the documented Person attribute list (via a third-party
  generated-from-spec Dart binding, `PcoPeoplePerson`, and independently via a
  search-indexed mirror of the People API reference). Both list the same set:
  `given_name, first_name, nickname, middle_name, last_name, birthdate,
  anniversary, gender, grade, graduation_year, child, membership, status,
  inactivated_at, medical_notes, avatar, demographic_avatar_url,
  directory_status, remote_id, site_administrator, accounting_administrator,
  people_permissions, school_type, can_create_forms` — plus exactly **one**
  background-check-related attribute: **`passed_background_check` (boolean)**.
  There is no `background_check_expires_at`, no expiry date, on the Person
  resource in either source.
- Planning Center's own help documentation (`help.planningcenter.com` —
  "Manually track background checks") confirms background checks *do* carry
  a completion date, status, and **expiration date** — but as a structured
  sub-object surfaced through the People UI's badge/shield icon and the
  dedicated Background Checks feature, not as a bare `background_check_expires_at`
  string on the core Person attributes the People API v2 exposes. Locus invented
  both the field name and its shape.

**Consequence for #28:** the proposal calls the "Expired Background Checks"
lane "the single highest-stakes correct feature in this file" (§ intro) and
plans in §4.10 to "pin one safeguarding block above the lanes" built on exactly
this field, contrasting it with the fields it correctly cuts. That framing is
wrong. `getExpiringBackgroundChecks` / `getExpiredBackgroundChecks`
(`automations.ts:122-147`) filter on `s.backgroundCheckExpiresAt` being
truthy — a field that, against real PCO, is never populated by anything PCO
sends. Locus has no write path to it either (no screen in this app lets staff
enter a background-check date — confirmed by grep, zero matches for
`backgroundCheckExpiresAt` outside read paths in `automations.ts`,
`pco.ts`, and the report components). The lane is not "harden it" material —
it is **dead on arrival against a real PCO instance**, identical in kind to
the First-Time-Giver lane the proposal already cuts for the same reason. The
"never had a check" gap the proposal found (§1, "no critic caught it") is a
bug in a feature that cannot ever fire in production regardless.

**What changes:** §4.10 must cut the entire background-check block, not
harden it, unless Locus adds either (a) a real integration with PCO's
Background Checks feature/Checkr, which is a different API surface entirely
and a scoping decision this audit hasn't put on the table, or (b) an honest
manual custom-field workflow with a data-entry screen the church staffs
themselves — at which point it's a data-entry tool, not an "automation."
Shipping it as-is teaches the children's director to trust an "All Clear" that
is actually "field never existed." That is a worse failure than an empty
state, because it is a *confident* wrong answer on a safeguarding surface.

---

## 2. Other load-bearing claims — verified

**`classifyEvent` "ministry" bug (`burnout.ts:11-25`) — TRUE, verified by direct
read.** Line 15 checks Serving keywords (`team`, `volunteer`, `serving`,
`greeter`, `ministry`) before line 20's Worship keywords (`service`, `worship`,
`kids church`, `friday night live`). Any event containing "ministry" —
including a worship-context name like "Kids Ministry" — hits the Serving branch
first and never reaches the Worship check. The mock fixture's kids event is
named "Sunday Kids Church" (hits Worship at `:20`) specifically avoiding the
trap it ships with. I additionally confirmed the proposal's downstream claim:
`busFactor.ts:3` imports `classifyEvent` directly from `burnout.ts` and
`busFactor.ts:24` uses it unmodified to build `servingEventIds`, so the same
bug silently zeroes `soloCount` for any church whose kids/serving event names
collide with "ministry" — I read `busFactor.ts:13-125` end to end and the
proposal's mechanism (`teamSize === 1` never firing because children inflate
cluster size) is accurate.

**`subMonths(now, 1.5)` / divide-by-6 (`drift.ts:21,62`) — TRUE, verified by
running the actual code, not just reading it.** I ran `subMonths` from the
installed `date-fns@4.1.0` in this repo:

```
subMonths(2026-07-29, 1.5) -> 2026-05-29   (61 days back)
subMonths(2026-01-15, 1.5) -> 2025-12-15   (31 days back)
```

This exactly matches the proposal's numbers. Root cause (I read
`node_modules/date-fns/addMonths.js:34-73`): the function does no rounding or
truncation of the fractional `amount` at all — it feeds `1.5` straight into
`Date.setMonth(month + amount + 1, 0)` and lets the JS Date engine coerce it,
so the "half month" collapses unpredictably into either a 1-month or 2-month
jump depending on day-of-month and month length. `recentRate = recentCount / 6`
(`drift.ts:62`) then divides a count gathered over a window that is actually
31–61 days by a fixed 6-week (42-day) denominator. The proposal's "~45%
inflation on a normal month, window swings 31–61 days" claim is correct and I
can't find a case where it isn't. CUT is the right call on this alone, before
any seasonality argument.

**`copilot.ts:324` type error — TRUE, and I made it fail for real, not just by
inspection.** `npx tsc --noEmit -p tsconfig.app.json` reports:
`src/utils/copilot.ts(324,11): error TS2322: Type '{ label: string; view:
string; }' is not assignable to type 'string'.` — `CoPilotResponse.action`
is declared `action?: string` (`copilot.ts:23`) and the Spiritual Climate
branch assigns an `{ label, view }` object to it. This code has never
type-checked clean. Confirms the proposal's claim that CoPilot's promised
navigation was never wired to anything real.

**`App.tsx:83` copilot-as-landing-view — TRUE.** `setCurrentView(role ===
'core' ? 'dashboard' : 'copilot')` at `App.tsx:83`, confirmed by direct read.
Cutting #19 does force a landing-view change; the proposal is right to call
this out as something no round-1 critic (including me) flagged.

No corrections needed on any of these — the proposal's verification work this
round is solid.

---

## 3. What I attack

**§4.6 merge of #20+#22 keeps the adult/child gate as a TODO instead of a
blocker.** The proposal's own §4.6 bullet ("Add the adult gate `burnout.ts:79`
admits it lacks... a child in a 'Kids Ministry' event can currently be labelled
a High Risk burnout case") is listed as one line item among six in a
"~1 day" merge task. That is backwards. Until `classifyEvent` is fixed (§4.3)
*and* an explicit `!isChild` filter exists on the merged screen's population,
shipping "Volunteer Attendance Risk" is shipping a screen that can print a
child's name next to "High Risk" for a stranger to read. That is not a
polish item alongside removing `ui-avatars.com` — it is a precondition for
turning the screen back on at all. **Alternative: sequence §4.3 and the
`isChild` gate as a hard prerequisite gate before §4.6, not parallel work
inside it, and do not re-enable `burnout`/`missing` in the nav until both land
together.**

**§4.10's "pin one safeguarding block" undersells what Q1 just proved.** The
proposal treats the null-`backgroundCheckExpiresAt` gap as the headline defect
("no critic caught it... the largest false negative on the area's
most-praised feature"). Q1 shows the block has no true positives either, in a
real PCO instance — every case is a false negative, because the field cannot
be populated. **Alternative: cut the block entirely from v1, and file a
scoping ticket for a real Background Checks integration (PCO's actual
Background Checks module, or Checkr) as separate future work** — do not ship
a "safeguarding" UI element whose emptiness is indistinguishable from
compliance.

**§4.8's clearance gate has the same disease it's trying to cure.** The
proposal correctly identifies that `recruitment.ts:112` pushes people toward
Kids Ministry roles with no reference to `backgroundCheckExpiresAt`
(`§4.8`, "the second-strongest safety finding in the area after #27") and
proposes gating it on that field. Per Q1, that field will never carry real
data. **Alternative: the clearance badge must read "Not yet cleared /
requires manual check" for every candidate by default (i.e., fail closed on
missing data), not fail open the way `getExpiringBackgroundChecks`' truthy
filter already does — otherwise this "fix" just moves the same fabricated-data
trust hazard from #28 into #23's ask script.**

**§4.9 retention funnel MERGE-adjacent decision undersold: it's KEEP, not
SIMPLIFY-and-move-on.** Minor disagreement, not a hill — the proposal's own
verification (§ nothing contradicts my round-1 finding of zero PII risk) still
lands SIMPLIFY. I'd keep my round-1 KEEP: renaming "Member" and adding
drill-down are real improvements but this is the one screen in the area that
needed no defect finding to earn its slot, and folding it under the same
"SIMPLIFY" verdict as #23/#25 (which both have live safety findings) flattens
a meaningful distinction a church board would want preserved when deciding
what ships first.

---

## 4. Dropped / conceded

**Dropped:** the proposal drops my round-1 CSV-export concern entirely (#20/
#21/#22 all export named individuals with risk labels to loose CSVs,
`BurnoutReport.tsx:46-55`, `DriftReport.tsx:46-57`,
`MissingVolunteersReport.tsx:43-51`) — cutting #21 and merging #20+#22 doesn't
make the surviving merged screen's export path safe by itself, and §4.6 never
mentions it.

**Conceded:** the proposal's live `tsc` and `subMonths` verification (§1.1,
§1.4) is stronger evidence than anything I produced in round 1 — I asserted
defects from reading; the proposal proved two of them by execution. That is a
higher bar than domain critique alone and it settled arguments round 1 left
open.
