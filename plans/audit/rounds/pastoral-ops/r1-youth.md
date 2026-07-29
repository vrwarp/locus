# Round 1 — Youth Ministry Critique — Area C: pastoral-ops (#19-#28)

Standing fact checked before anything else: every feature in this area lives
**only** in `Locus Intelligence` (`src/components/SidebarIntelligence.tsx`,
routes `copilot`, `burnout`, `attrition`, `missing`, `recruitment`, `retention`,
`bus-factor`, `network`, `automations`, `emergency` — confirmed absent from
`SidebarCore.tsx`). `IntelligenceLayout.tsx:17-31` is a fixed 250px-sidebar
desktop shell with no responsive breakpoints. Login (`LandingPage.tsx`) forces
a binary choice of `'core' | 'intelligence'` — there is no leader role, no
mobile view, no export-to-leader path for any of it except CSV download
buttons meant for a desk. **None of #19-#28 can reach a small group leader on
a Wednesday night.** This single fact undermines every feature below before
its math is even considered, and I call it out once here instead of repeating
it ten times.

---

## #19 Pastoral Co-Pilot — `src/components/CoPilot.tsx`, `src/utils/copilot.ts`

**Verdict: MERGE**

A keyword-matched router (`copilot.ts:26-336`, `if (lowerQuery.includes(...))`
chains) that calls the exact same functions used by #20-#28 and reformats
their output as chat bubbles. It adds zero new analysis. It also fakes AI
theater it doesn't deliver: `CoPilot.tsx:82-96` wraps the synchronous
`processQuery` call in a hardcoded `setTimeout(..., 600)` purely "to simulate
processing delay for 'natural' feel" — a pastor will reasonably read that
delay as "thinking," when it's a static keyword match.

- **School year:** N/A — it only echoes whatever the underlying report says,
  so it inherits every seasonal defect below (attrition, burnout) without
  adding any calendar awareness of its own.
- **False positive/negative:** Same as whichever intent it routes to.
  Additional risk: the query router is fragile string matching — "I need a
  volunteer for missing kids ministry" would probably route to "missing
  volunteers" not "recruit," and there's no fallback disambiguation, so a
  pastor typing a real question gets a wrong-topic answer with full
  confidence and no "did you mean" flag.
- **Minor-safety flag:** The "sentiment / spiritual climate" intent
  (`copilot.ts:304-329`) will surface prayer-request themes (grief, anxiety,
  addiction, financial) verbatim in a plain-text chat transcript that is kept
  in component state indefinitely for the session with no access
  differentiation from a "what's my health score" query. Anyone with
  Intelligence login sees the same word-cloud of teen prayer topics as they'd
  see attendance counts.
- **What a leader needs:** N/A — leader can't reach this screen. Even a
  pastor gets nothing they couldn't get faster by clicking the actual report
  page directly.

Keep the useful bit (search-by-grade, search-by-person) as an actual search
box on a page a leader can reach; cut the chat theater.

---

## #20 Burnout Risk — `src/utils/burnout.ts`, `src/components/BurnoutReport.tsx`

**Verdict: SIMPLIFY**

`classifyEvent` (`burnout.ts:11-25`) buckets every PCO event into `Worship` or
`Serving` by keyword match on the event name (`'team'|'volunteer'|'serving'|
'greeter'|'ministry'` → Serving; `'service'|'worship'|'kids church'|'friday
night live'` → Worship). Risk rule: `serving >= 6` in 8 weeks with `worship
== 0` → High, `worship <= 2` → Medium (`burnout.ts:82-92`).

- **School year:** No calendar awareness at all — the 8-week window is purely
  "last 8 weeks of data present," so it silently includes summer-camp weeks,
  fall kickoff pushes, and Christmas/holiday spikes as if they were an
  ordinary steady-state, with no adjustment for the fact that youth ministry
  serving load is deliberately bursty around the school calendar (camp week,
  fall retreat) and that's expected, not burnout.
- **False positive cost — this is the big one for your 40 leaders:** a small
  group leader who runs Wednesday program every week and Sunday small group
  every week, and who *never attends "big church" worship* because their
  entire volunteer commitment is student ministry, will show `worship == 0`
  and `serving >= 6` almost every 8-week window by structural design, not
  burnout. The model assumes serving and worship are two different things a
  healthy volunteer alternates between — for a youth leader whose "worship"
  *is* Wednesday night, that's false. This will fire "High Risk" on your most
  faithful leaders repeatedly and burn credibility fast (per your own
  standing note: a leader chasing a fire that isn't there costs trust). No
  leader-role or team filter exists to exclude student-ministry-only serving
  from the worship-attendance expectation.
- **False negative cost:** A leader genuinely flaming out mid-semester who
  simply *stops showing up entirely* (0 serving, 0 worship) never appears
  here — they're `Low` risk by this math because the rule only fires on high
  serving + low worship, not on a cliff-drop in engagement. That pattern is
  what Drift (#21) is supposed to catch, but Drift explicitly filters to
  `kind === 'Regular'` check-ins, so a burning-out *volunteer's* dropout can
  fall into a gap between the two features.
- **Minor-safety flag:** avatar fallback (`BurnoutReport.tsx:84`) sends every
  flagged person's full name to `ui-avatars.com`, a third-party image
  service, purely to render a placeholder circle. If any of your ~40 leaders
  are high-school-age (co-leading with an adult, common in youth ministry),
  their name goes to a third party with no consent flow. Same pattern
  repeats in Drift, Missing Volunteers, and Recruitment (`avatarUrl ||
  https://ui-avatars.com/api/?name=...`).
- **What a leader needs:** Nothing today — it's staff-only. Even if surfaced,
  a leader needs the tool to know their team's actual expected "worship"
  event before it accuses them of skipping one they were never meant to
  attend.

---

## #21 Predictive Attrition / Drift — `src/utils/drift.ts`, `src/components/DriftReport.tsx`

**Verdict: CUT (as built — needs a ground-up rebuild, not a tweak)**

This is exactly the model your standing knowledge warns about: it is a
**total-attendance-count** model. `calculateDriftRisk` (`drift.ts:13-97`)
counts all `kind === 'Regular'` check-ins per person, computes a baseline
rate over months −7 to −2 and a recent rate over the last ~6 weeks, and flags
`Gone` (0 recent), `Drifting` (≥50% drop), `At Risk` (≥25% drop). There is no
signal anywhere in this file that distinguishes a *small group* check-in from
a *big-service* check-in, or a student ministry event from an adult one. Your
core rule — "a student who misses three Sundays is normal, a student who
stops coming to small group is in trouble" — is structurally impossible for
this model to express, because it only sees "check-ins," not which ministry
context they came from.

- **School year:** Fails completely. Baseline window is months −7 to −2,
  recent window is the trailing 6 weeks — a purely rolling calendar with zero
  knowledge of the school year. Concretely: every June, a normal summer
  attendance dip (sports camps, family vacation, no school-year small group
  rhythm) will read as a `dropPercentage >= 50` for a large fraction of your
  6-12 roster simultaneously, generating a flood of `Drifting`/`Gone` flags
  every single summer — a predictable annual false-positive storm that will
  train leaders to ignore the report by August. There is no seasonal
  baseline, no "expected summer dip" adjustment, and no exclusion for the
  cliffs your own knowledge names as real: 5th→6th, 8th→9th, and graduation.
  A senior whose attendance falls off in May/June because they are
  *graduating and headed to college* — explicitly not attrition, per your
  standing knowledge — gets flagged `Gone` the same as a 7th grader quietly
  disengaging. There is no `pcoGrade` or `age` check anywhere in this file.
- **False positive cost:** Concretely, a student with sports/custody-driven
  attendance (your named example) who goes from attending 3x/month to
  1x/month over the school year will very plausibly cross the 25% "At Risk"
  threshold from ordinary life, not disengagement — and a leader who chases
  that lead and gets "oh yeah, I've just had travel soccer" loses trust in
  the tool for the next real case.
- **False negative cost:** The one case this model is theoretically built for
  — steady attender suddenly disappearing — is real and it will catch it.
  But because it can't see "small group" specifically, a student who keeps
  showing up to the big Sunday service (to see friends, because parents make
  them) while quietly checking out of small group — your stated highest-value
  signal — will show a healthy `recentRate` and never appear here at all.
  That is the exact false negative your standing knowledge calls out as the
  costly one.
- **Minor-safety flag:** None beyond the shared avatar-URL leak
  (`DriftReport.tsx:86`).
- **What a leader needs:** Even setting aside that this view is
  Intelligence-only, a leader would need: (1) drift computed on small-group
  check-in specifically, not aggregate; (2) a summer-aware baseline that
  doesn't compare July to February; (3) automatic exclusion of grade-12
  seniors near graduation; (4) the actual list scoped to *their* small group
  only, on their phone, not a CSV export button on a desktop dashboard
  (`DriftReport.tsx:46-57`) meant for a pastor to open weeks later.

---

## #22 Missing Volunteers — `src/utils/missing.ts`, `src/components/MissingVolunteersReport.tsx`

**Verdict: SIMPLIFY**

Tighter and more defensible than Drift: flags anyone who served ≥2 times in
the 8-week lookback and then had 0 check-ins (of any kind) in the trailing 2
weeks (`missing.ts:39-98`). The 2-week absolute-zero threshold, rather than a
percentage drop, is a much saner rule for catching a leader who's genuinely
gone dark.

- **School year:** No explicit calendar logic, but the short 2-week trigger
  window is naturally less exposed to seasonal noise than Drift's 6-week
  window — it will still misfire around any 2+ week gap in the ministry
  calendar itself (e.g., a planned summer break in programming where nobody
  is expected to check in), since the tool has no concept of "there is no
  Wednesday program this week" vs. "the leader stopped showing up to a
  Wednesday program that is happening."
- **False positive cost:** A leader on pre-approved vacation or who
  volunteered at camp (off the normal check-in system) for two weeks reads
  identically to a leader quietly quitting. No way to mark "known absence."
- **False negative cost:** `isKeyVolunteer` requires 2+ *serving* check-ins in
  history (`missing.ts:77-78`) — reuses the same crude `classifyEvent`
  keyword matcher from burnout.ts, so a leader whose events don't happen to
  contain "team/volunteer/serving/greeter/ministry" in the name won't
  register as a "key volunteer" and can vanish silently with no alert at all.
- **Minor-safety flag:** Same avatar-URL leak (`MissingVolunteersReport.tsx:81`).
- **What a leader needs:** This is the one report in the area closest to
  being genuinely useful to a pastor managing 40 leaders week-to-week — it
  should be piped to a phone-reachable surface and scoped to "my team" rather
  than trapped on a desktop-only Intelligence page nobody but the pastor sees.

---

## #23 Recruitment Intelligence — `src/utils/recruitment.ts`, `src/components/RecruitmentReport.tsx`

**Verdict: SIMPLIFY — NOT primarily youth-ministry lane, but touches it**

Explicitly excludes children (`recruitment.ts:93`, `if (student.isChild)
return`) — this is about finding new *adult* volunteers generally, not
managing your existing 40. It does have a real youth-ministry hook: if the
candidate's household has an 11-18-year-old, it tags `potentialRoles` with
"Student Ministry" (`recruitment.ts:107-118`) and personalizes an ask script
with the actual child's first name (`generateAskScript`, `recruitment.ts:141-176`,
e.g. "We love having {kids} in our ministry areas").

- **School year:** Score weights tenure and 8-week worship frequency; no
  school-year concept, not really applicable to this feature's purpose.
- **False positive cost:** Low-stakes — worst case a "Ministry Matchmaker"
  suggestion is a bad fit and gets ignored.
- **False negative cost:** N/A for this pattern.
- **Minor-safety flag:** The single real one here: this tool generates a
  ready-to-send outbound message that names a specific minor by first name,
  to be copy-pasted by staff into an email/text to the *parent* — directed at
  the parent about their own kid, so not a contact-without-parent violation,
  but there is **no background-check gate**. A parent flagged as a "Student
  Ministry" fit purely on worship attendance and having a middle/high-school
  kid can be pushed straight to an "ask script" with zero linkage to
  `getExpiringBackgroundChecks`/`getExpiredBackgroundChecks` (#28) — the tool
  will happily recommend recruiting someone into unsupervised contact with
  minors before anyone checks whether they're clearable to do so.
- **What a leader needs:** N/A — this is a staff recruiting tool, not
  something a leader acts on directly.

---

## #24 Retention Funnel (Newcomer) — `src/utils/retention.ts`, `src/components/NewcomerFunnel.tsx`

**Verdict: DEMOTE**

A generic 4-step visit funnel (1st/2nd/3rd visit → "Member" at visit 4) over
`kind === 'Regular'` check-ins for anyone whose first check-in was in the
trailing 12 months (`retention.ts:10-67`). No `isChild`/`pcoGrade` split
anywhere — a kindergartner's first VBS visit, a new adult's first Sunday, and
a 9th grader's first Wednesday night all collapse into the same funnel and
the same "Member at visit 4" label.

- **School year:** None. A student who joins in September (natural
  school-year on-ramp) and one who visits once for a summer VBS week are
  scored on the same 12-month rolling window with the same "4 visits = a
  member" bar, which means nothing for a Wednesday-night youth program's
  actual rhythm.
- **False positive/negative cost:** The "Member" label at 4 visits is
  meaningless for teens specifically — a student can hit 4 Sunday
  big-service visits with their parents and be counted "retained" while never
  once attending small group, which is the actual retention question you
  care about. Conversely a student who visits small group 3 times but skips
  a Sunday or two never crosses into "Member" on this chart even though
  they're clearly engaging with the part that matters.
- **Minor-safety flag:** None directly — it's an aggregate chart, no names.
- **What a leader needs:** Nothing actionable — it's a single chart with no
  drill-down to who is stuck at which step, so even a pastor can't act on it,
  let alone a leader. There's no "these 6 newcomers are stuck at visit 2 —
  here they are" list, which is the only version of this feature that would
  ever change anyone's week.

---

## #25 Bus Factor — `src/utils/busFactor.ts`, `src/components/BusFactorGraph.tsx`

**Verdict: SIMPLIFY — reframe entirely**

Clusters serving check-ins by event + 60-minute time window and flags anyone
who was the *only* person clustered into a shift (`busFactor.ts:46-93`) as a
"single point of failure," styled as an operational succession-risk metric
("if they quit, the team is stuck").

- **School year:** N/A to the mechanic itself.
- **False positive/negative cost:** Reasonably tight clustering logic; main
  risk is the same crude `classifyEvent` keyword matching mis-bucketing which
  events count as "Serving" at all.
- **Minor-safety flag — this is the real finding for this feature:** for any
  team that serves *minors* (a Wednesday small group with one adult
  present), "solo serving" isn't a business-continuity inconvenience, it's a
  live two-adult-rule safeguarding violation happening *right now*. The tool
  presents a 7th-grade small group run alone by one leader identically to a
  parking-lot team missing a backup — same red bar chart, same "risk score,"
  same framing (`BusFactorGraph.tsx:69-72`, "single points of failure").
  Nothing in the code distinguishes teams serving minors from teams serving
  adults, and nothing escalates the minors case differently or flags it for
  immediate compliance follow-up rather than a "consider recruiting a
  backup" nudge.
- **What a leader needs:** For this to matter, "solo with minors" needs to be
  a same-day/that-Wednesday alert to whoever is responsible for compliance,
  not a bar chart on a desktop dashboard a pastor might open weeks later.

---

## #26 Volunteer Web — `src/utils/volunteerWeb.ts`, `src/components/VolunteerWeb.tsx`

**Verdict: DEMOTE**

A force-directed graph of who serves shifts together (`volunteerWeb.ts:22-140`,
`computeForceLayout` running a 300-iteration O(n²) physics sim client-side,
`volunteerWeb.ts:142-251`). Visually could reveal an isolated leader (few
connections, small node) but nothing in the code surfaces that as a finding —
it's a hover-tooltip-only artifact with no ranked "most isolated" list, no
export, no threshold-based alert.

- **School year:** N/A.
- **False positive/negative cost:** N/A — it makes no claims, just renders.
- **Minor-safety flag:** None.
- **What a leader needs:** Even a pastor gets nothing actionable without
  staring at the graph and eyeballing dot sizes. Turn the useful byproduct
  (isolated-leader detection) into a text list or cut it.

---

## #27 Emergency Alerts — `src/components/EmergencyAlerts.tsx`

**Verdict: CUT (as built)**

Entirely mocked — `setTimeout(..., 1500)` standing in for "Mock API call to
Twilio" (`EmergencyAlerts.tsx:25-33`) — so today it sends nothing. But the UX
is built and copy-complete ("Send SMS blast to N members," a big red button,
a success toast), which means the day someone wires the real Twilio call in,
this ships as-is with no additional review. As designed it is a live
safeguarding failure waiting to happen:

- **Minor-safety flag (the top finding for this feature):** Recipients are
  computed as `students.filter(s => s.phoneNumber && s.phoneNumber.trim() !==
  '')` (`EmergencyAlerts.tsx:15-17`) — **no `isChild` exclusion, no
  parent/guardian routing at all.** `Student.phoneNumber` (`pco.ts:91`,
  sourced from PCO's primary phone at `pco.ts:280`) does not distinguish a
  minor's own cell from a parent's number — PCO records vary household by
  household. Per your own standing knowledge, contacting a student directly
  without the parent in the loop is a safeguarding failure, not a UX choice —
  and this tool has no concept of that distinction at all. It will text
  whatever number is on file, minor or not, with a single unreviewed blast,
  and with zero handling of split households (divorced parents, two
  addresses, custody-driven phone-on-file ambiguity — your knowledge item
  #6) — one guardian gets texted, the other may not, with no way to tell
  which from this screen.
- **School year:** N/A.
- **False positive/negative cost:** N/A to the mechanic — the risk here is
  entirely in who receives it, not in whether it should have fired.
- **What a leader needs:** If a real emergency broadcast tool is wanted, it
  needs an explicit adult/guardian-only recipient list, per-household consent
  tracking, and an audit trail — none of which exist. Do not connect this to
  a real SMS provider in its current form.

---

## #28 Automations (grade promo / college send-off / background checks / new baby / elderly / first-time giver) — `src/utils/automations.ts`, `src/components/AutomationsReport.tsx`

**Verdict: SIMPLIFY**

A grab-bag of eight unrelated "lanes" in one view; only three touch youth
ministry (grade promotion, college send-off, background checks). The other
five (first-time giver, new baby, elderly Uber rides) are `NOT MY LANE` and
dilute the three that matter for you into an 8-wide triage list.

- **The "Promote" button is fake and dangerous for exactly the field you
  care most about.** `handleApprove` (`AutomationsReport.tsx:84-94`) just
  fires a browser `alert()` and locally dismisses the row from view — it does
  **not** call any PCO write. A pastor who clicks "Promote" for a
  grade-behind student sees a confirmation dialog and reasonably believes the
  record is fixed; PCO is untouched, and the row simply won't reappear in
  this component's session state. That is a false-confidence bug on the
  single field you called "worth more than every dashboard combined."
- **School year — partially aware, but narrowly:** `getPendingGradePromotions`
  (`automations.ts:67-96`) correctly gates on "after June 1st" and reuses the
  real `calculateExpectedGrade` from `grader.ts` (good — no duplicate
  promotion math). But it only flags students exactly **one** grade behind
  (`expectedGrade - currentGrade === 1`, line 94) — a record that's drifted 2+
  years stale (the realistic worst case for "half the errors in any church
  database are stale grades") is invisible here and only catchable via the
  Area A Data Health scatter, if anyone looks. `getCollegeSendOffs`
  (`automations.ts:102-117`) hardcodes `targetMonth === 7` (August only) —
  a senior who ages out or graduates in May/June (the actual typical
  timing) gets zero action items until August, and if nobody opens this
  exact tab in that exact single month, the whole cohort's send-off is
  silently skipped for the year with no persistence or backlog.
- **False positive cost:** Low for promotions/send-offs (informational
  nudges); background-check lanes are appropriately binary (expiring vs.
  expired) and low-noise.
- **False negative cost:** The one-grade-only promotion filter and
  August-only send-off window are both real false-negative sources — kids
  who need the most correction (multi-year stale, or aged-out outside
  August) are the ones this automation misses.
- **Minor-safety flag:** Handled reasonably here — expired background checks
  are surfaced as `critical-item` with a "Remove from Roster" action
  (`AutomationsReport.tsx:246-267`), which is the right instinct for a
  safeguarding gate. But like grade promotion, "Remove from Roster" is also
  just `handleApprove` → `alert()` → local dismiss (`AutomationsReport.tsx:84-94`)
  — it does not actually remove anyone from anything. A pastor believes an
  expired-background-check volunteer has been pulled from the roster; they
  have not been. For a safeguarding-critical action, that's the single worst
  fake-write in the entire area.
- **What a leader needs:** N/A directly — this is a staff back-office queue.
  It needs real writes before it needs anything else.

---

## Verdict Summary

| # | Feature | Verdict |
|---|---------|---------|
| 19 | Pastoral Co-Pilot | MERGE |
| 20 | Burnout Risk | SIMPLIFY |
| 21 | Predictive Attrition (Drift) | CUT (rebuild) |
| 22 | Missing Volunteers | SIMPLIFY |
| 23 | Recruitment Intelligence | SIMPLIFY |
| 24 | Retention Funnel | DEMOTE |
| 25 | Bus Factor | SIMPLIFY |
| 26 | Volunteer Web | DEMOTE |
| 27 | Emergency Alerts | CUT (as built) |
| 28 | Automations | SIMPLIFY |
