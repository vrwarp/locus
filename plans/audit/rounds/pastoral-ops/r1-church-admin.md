# Area C — pastoral-ops — Round 1 (church-admin) — Discovery Critique

Reviewed against the real implementation: `src/components/CoPilot.tsx`,
`src/utils/copilot.ts`, `src/components/BurnoutReport.tsx`, `src/utils/burnout.ts`,
`src/components/DriftReport.tsx`, `src/utils/drift.ts`,
`src/components/MissingVolunteersReport.tsx`, `src/utils/missing.ts`,
`src/components/RecruitmentReport.tsx`, `src/utils/recruitment.ts`,
`src/components/NewcomerFunnel.tsx`, `src/utils/retention.ts`,
`src/components/BusFactorGraph.tsx`, `src/utils/busFactor.ts`,
`src/components/VolunteerWeb.tsx`, `src/utils/volunteerWeb.ts`,
`src/components/EmergencyAlerts.tsx`,
`src/components/AutomationsReport.tsx`, `src/utils/automations.ts`,
`src/utils/pco.ts`, `mock-api/data.js`.

**Load-bearing discovery for this entire area:** `mock-api/data.js:95-108` fabricates
`prayer_topic` (30% of adults, randomly assigned one of `Financial, Health, Grief,
Anxiety, Addiction`) and `first_time_giver`/`first_gift_date` (10% of adults,
random) with source comments literally reading "Simulate Prayer Topic" and
"Simulate First Time Giver". `src/utils/pco.ts:9-27` declares these as
`PcoAttributes` fields read straight off the real Person resource
(`prayer_topic`, `first_time_giver`, `first_gift_date` — `pco.ts:230-285`). None
of these three exist on the real Planning Center People API. This app has "no
Giving API access" per the audit's standing context, so `first_time_giver` can
only ever be populated by a manual custom field someone in the church invents
and maintains by hand — it will not arrive from PCO on its own. `prayer_topic`
is the same story: it is not a native field, and nowhere in this codebase is
there a screen that lets staff type a prayer request into that field. That means
**two of ten features in this area (CoPilot's "spiritual climate" intent, and
the First Time Giver lane of Automations) are permanently dead in a real church's
PCO instance** unless someone first builds a totally separate data-entry
workflow the app never mentions. In the demo, against `mock-api`, they look like
live pastoral insight. That is the single most dangerous property an audit like
this exists to catch.

---

## #19 — Pastoral Co-Pilot (`CoPilot.tsx`, `copilot.ts`)

**Verdict: DEMOTE**

**Would we actually open this?** Maybe once, out of curiosity. It is not a
model — it's a keyword router (`lowerQuery.includes('burnout')`, `.includes('ghost')`,
etc., `copilot.ts:26-336`) with a fake 600ms "typing" delay
(`CoPilot.tsx:82-96`) to simulate an AI that isn't there. Every intent it
serves already has its own dedicated report screen in this same sidebar
(Burnout, Missing Volunteers, Recruitment, Ghosts, Automations, Prayer Match,
Sentiment Pulse). It adds a chat shell on top of reports that already exist,
with worse discoverability — a volunteer coordinator has to guess the magic
words ("split household," "who is," "kindergarten") instead of clicking a
sidebar item they can see.

**PCO overlap:** None directly — PCO has no chatbot — but every *answer* it
gives duplicates a native Locus screen one click away, so its actual value-add
is zero. It's a UI skin over eight other features in this inventory.

**Governance / privacy risk:** Two of its ten intents (Sentiment/Spiritual
Climate — `copilot.ts:304-329`, and indirectly anything depending on
`prayerTopic`) run on fabricated data (see area-wide finding above). A staff
member typing "spiritual climate" into this box in production will get either
an empty result or, if someone hand-populates a `prayer_topic` custom field
per person, a chat surface displaying "Addiction," "Grief," "Anxiety" against
named humans with zero access control beyond whoever is logged into Locus.
Calling this a "Co-Pilot" primes staff to trust its output as if it reasoned
about the data, when it is fixed if/else string matching.

**What would make it worth the licence fee:** Cut it, or fold its intents into
a real search bar over the existing reports (type a name, jump to their
record) — that's a genuinely useful five-minute build, not a chat product.

---

## #20 — Burnout Risk (`BurnoutReport.tsx`, `burnout.ts`)

**Verdict: SIMPLIFY**

**Would we actually open this?** Yes — this is the most legitimate feature in
the area. A volunteer coordinator checking "who's serving a lot and not
worshipping" weekly-ish, then reaching out personally, is a real workflow.

**PCO overlap:** None built-in. PCO doesn't cross-reference Check-Ins kind
against event-name keywords for you. This is a real gap Locus fills.

**Governance / privacy risk:** Real. This assigns a named human a public-facing
`High/Medium/Low Risk` badge (`BurnoutReport.tsx:87`) based on
`classifyEvent()` (`burnout.ts:11-25`), which is keyword string-matching on
event *names* ("team," "volunteer," "greeter," "ministry" → Serving; "service,"
"worship," "kids church" → Worship). Any event whose name doesn't hit those
keywords silently falls into `'Unknown'` and is dropped from both buckets —
there is no way for a viewer of this report to know a given church's naming
convention ("Sunday AM," "9:15," a campus-specific label) just produced zero
signal for half their events. A "High Risk" label is exportable to CSV
(`handleExport`, `BurnoutReport.tsx:46-55`) with the person's real name — this
is a file that could end up forwarded, printed, or left in a shared drive with
"[Bob] — High Risk" attached to it. Would you show Bob this label? Almost
certainly not without a conversation first — and the tool gives you no
workflow for that conversation, just a badge and a table.

**What would make it worth the licence fee:** Ship it, but (1) surface how many
check-ins fell into 'Unknown' so staff know the signal is incomplete for their
event-naming scheme, (2) drop the public risk-level color badge in favor of a
"talk to this person" queue framing, (3) do not export names to a loose CSV by
default — route it to a note/task, not a spreadsheet.

---

## #21 — Predictive Attrition / Drift (`DriftReport.tsx`, `drift.ts`)

**Verdict: SIMPLIFY**

**Would we actually open this?** Occasionally — monthly, by a care pastor
deciding who to call. The underlying signal (attendance rate this month vs.
5-month baseline) is reasonable and not fabricated; it's arithmetic over real
Check-Ins data.

**PCO overlap:** PCO Lists can filter "last check-in before X" but cannot
compute a rolling baseline-vs-recent drop percentage. This is a real gap
filled, assuming the thresholds are sound.

**Governance / privacy risk:** This labels named people "Drifting / At Risk /
Gone" (`drift.ts:73-92`) — status words a member would find alarming or
offensive if they ever saw them ("Gone"?). The thresholds are fixed, invented
constants (50%/25% drop, 6-week vs 5-month windows, `drift.ts:20-24, 77-80`)
with no visible validation against a real church's seasonal attendance pattern
— e.g., every December, every attendee's "recent rate" will crater against a
fall baseline and this will flag half the church as "Drifting" over the
holidays with no seasonality adjustment. That is a false-alarm flood that
trains staff to ignore the tool. Also exportable to CSV with real names
(`DriftReport.tsx:46-57`).

**What would make it worth the licence fee:** Add a seasonality guard (holiday
weeks excluded from both windows) before this ships to a real church, and drop
"Gone" as a label — use "0 visits in 6 wks."

---

## #22 — Missing Volunteers (`MissingVolunteersReport.tsx`, `missing.ts`)

**Verdict: KEEP**

**Would we actually open this?** Yes, weekly, by whoever runs the volunteer
schedule. "Key volunteer served 2+ times, then vanished for 2+ weeks" is
exactly the kind of thing a spreadsheet-and-memory system misses and a real
coordinator would want flagged.

**PCO overlap:** PCO Check-Ins reporting can show individual attendance
history, but nothing surfaces "people who used to serve and stopped" as a
proactive list. Real gap filled.

**Governance / privacy risk:** Low relative to the rest of the area — this is
descriptive ("missing N weeks, last seen date") rather than a judgment label
like "risk" or "drifting." Still exports names + last-seen dates to CSV
(`MissingVolunteersReport.tsx:43-51`) — same "don't leave this on a shared
drive" caution as #20/#21, but the underlying claim is factual and reproducible
from real Check-Ins data, not invented.

**What would make it worth the licence fee:** Already close. Add a one-click
"log a follow-up" action so the list produces an actual next step instead of
just a read.

---

## #23 — Recruitment Intelligence / "Ministry Matchmaker" (`RecruitmentReport.tsx`, `recruitment.ts`)

**Verdict: SIMPLIFY**

**Would we actually open this?** Occasionally, by a volunteer coordinator
looking for warm leads. Frequent-worship/zero-serving is a fair heuristic.

**PCO overlap:** PCO Lists can build "attends often, not on any team" filters
manually with some effort; this automates it and adds a derived `score` and
`potentialRoles`. Modest but real value over doing it by hand in Lists.

**Governance / privacy risk:** The invented `score = worship*10 + isParent*20 +
tenure_bonus` (`recruitment.ts:120-123`) is presented as `Match Score: 40`
next to a real person's photo and name (`RecruitmentReport.tsx:93`) — another
instance of scoring humans with a number that has no stated meaning to anyone
outside the codebase. More pointed: `generateAskScript()`
(`recruitment.ts:141-176`) auto-drafts a personalized outreach message that
**names the candidate's actual children by first name** ("We love having Timmy
and Sue in our ministry areas...") pulled from `householdChildrenMap`. That's
a plausible, even warm, script for a coordinator who already knows the family —
but it is being auto-generated from inferred household/attendance data, not
typed by a human who actually knows the situation, and nothing stops it being
copy-pasted verbatim to someone the coordinator has never met. Would you want
your own kids' names appearing in a canned script generated by an attendance
algorithm about you? That's the test.

**What would make it worth the licence fee:** Keep the candidate list, drop
the numeric "Match Score" badge (replace with the plain "Worship 6x / Serving
0x" facts, which is all the score is built from anyway), and label the ask
script clearly as a *draft to edit*, not a message to send as-is.

---

## #24 — Retention Funnel / Newcomer Funnel (`NewcomerFunnel.tsx`, `retention.ts`)

**Verdict: KEEP**

**Would we actually open this?** Yes — a pastor or connections director
checking "are 1st-timers coming back for a 2nd/3rd visit" monthly is a
standard, non-controversial ministry metric.

**PCO overlap:** PCO doesn't ship a built-in newcomer retention funnel out of
Check-Ins; this is a genuine, low-risk analytical add.

**Governance / privacy risk:** None. This is the one feature in the whole area
that stays fully aggregate — no names, no individual scoring, just counts per
funnel stage (`retention.ts:61-66`). This is what a "safe" pastoral-ops feature
looks like; more of the area should look like this one.

**What would make it worth the licence fee:** Already fine as-is. Maybe add a
segment break (by campus/ministry) since that's the natural next question a
pastor asks after seeing the aggregate number.

---

## #25 — Bus Factor (`BusFactorGraph.tsx`, `busFactor.ts`)

**Verdict: DEMOTE**

**Would we actually open this?** Rarely. "Single point of failure" analysis
for volunteer scheduling is a real operational concern, but this tool answers
it by clustering check-in *timestamps* within a rolling 60-minute window per
event (`busFactor.ts:59-77`) — a fragile proxy for "was anyone else scheduled
with them," easily wrong if two people on the same team check in 61 minutes
apart, or if the same event serves multiple back-to-back services.

**PCO overlap:** PCO Services (if used) has an actual scheduling roster that
knows definitively who was scheduled together — this is Locus reverse-engineering
that from Check-Ins timing, worse data than PCO could give directly if the
church used the right module.

**Governance / privacy risk:** This is a chart with a real person's first name
on a bar labeled "solo shifts," red-highlighted for the top offender
(`BusFactorGraph.tsx:60-97`) — i.e., publicly ranking a named volunteer as the
biggest organizational risk in the building. If that volunteer ever saw this
screen, it reads as "you are a liability," not "we depend on you," even though
those are the same fact from two angles. Framing matters and this framing is
harsh for a tool anyone with Locus access can see.

**What would make it worth the licence fee:** Reframe as "teams that need a
second trained volunteer" (a team-level view) rather than naming and ranking
individuals as failure points. The team-level version is the one an executive
pastor could put in a staff meeting without flinching.

---

## #26 — Volunteer Web (`VolunteerWeb.tsx`, `volunteerWeb.ts`)

**Verdict: CUT**

**Would we actually open this?** Once, for the "ooh, neat" reaction, then
never again. It's a force-directed graph of who has served alongside whom
(hand-rolled physics simulation, `volunteerWeb.ts:142-251`, 300 iterations of
an O(n²) repulsion pass — this will visibly stutter past a couple hundred
volunteers). There is no decision this graph drives that isn't better answered
by Bus Factor's table or a plain "who's on this team" list already in PCO.

**PCO overlap:** None directly, but PCO Services/Teams rosters answer "who
serves with whom" more reliably (it's literally the scheduled team list)
without needing an inferred clustering heuristic.

**Governance / privacy risk:** Moderate. It's a real-time hover tooltip
exposing a named volunteer's team and connection count to anyone browsing
Locus (`VolunteerWeb.tsx:153-173`) — low stakes on its own, but it's
effort spent on a visualization with no action attached, in an area that is
supposed to be about pastoral care and volunteer operations, not data art.

**What would make it worth the licence fee:** Nothing short of attaching a
real action to it (e.g., "these two people never overlap — schedule them
together for mentorship") would justify the engineering cost. As shipped, cut
it and put the effort into #20 or #22, which staff will actually use weekly.

---

## #27 — Emergency Alerts (`EmergencyAlerts.tsx`)

**Verdict: CUT (as shipped) / MERGE if rebuilt on real infrastructure**

**Would we actually open this?** In a genuine emergency, maybe once a year —
which is exactly when a fake button is most dangerous. This is a big red "Send
SMS Blast" button (`EmergencyAlerts.tsx:65-71`) wired to a hardcoded
`setTimeout` that always reports success (`EmergencyAlerts.tsx:19-34`) —
literally `// Mock API call to Twilio`. There is no Twilio SDK, key, or network
call anywhere in this repo (`package.json` has no Twilio dependency; grep
confirms zero real integration). **If a staff member ever uses this screen
believing it sends a real SMS blast to "recipients.length members with valid
phone numbers," during an actual lockdown/weather/security event, nobody gets
a text and the UI tells the operator it worked.** That is the single worst
failure mode of the whole area, worse than any of the mock-data-as-insight
findings, because it's an active safety feature that silently does nothing.

**PCO overlap:** PCO has no built-in mass SMS either (this would usually be a
real Twilio integration or a service like ChurchText); the concept is sound,
the implementation is a landmine.

**Governance / privacy risk:** Beyond the false-success problem: it dumps
every member with any phone number on file (`recipients` filter,
`EmergencyAlerts.tsx:15-17`) into a single blast list with zero consent flag,
opt-out list, or rate-limiting — if this were ever wired to a real Twilio
account, it would be one click away from texting a minor's cell number (or a
parent's, without distinguishing) with no audit trail of who sent what, when.

**What would make it worth the licence fee:** Either wire it to a real,
tested Twilio account with a consent/opt-out list and a hard confirmation
step ("This will text 743 real phone numbers right now"), or remove the
feature entirely and tell the church to keep using their existing mass-notify
tool until Locus can do this for real. A fake emergency button is worse than
no emergency button.

---

## #28 — Automations: new baby / elderly rides / first-time giver, + birthday/promotion/background-check lanes (`AutomationsReport.tsx`, `automations.ts`)

**Verdict: SIMPLIFY** (birthday/promotion/background-check lanes) **+ CUT**
(DoorDash/Uber/Slack lanes as currently designed)

**Would we actually open this?** The birthday, grade-promotion, college
send-off, and background-check lanes: yes, weekly, by whoever manages the kids
database — these run on real fields (`birthdate`, `pcoGrade`,
`backgroundCheckExpiresAt`) and solve a genuine expiring-safety-check problem
(`automations.ts:122-147`) that a real church absolutely tracks. The
"Expired Background Checks" lane in particular (`AutomationsReport.tsx:242-267`)
is the single highest-stakes correct feature in this file — Safe Sanctuary
compliance is a real budget-and-liability line item.

The New Baby / Elderly Care / First Time Giver lanes: no, because two of the
three run on data that doesn't exist in real PCO (see area-wide finding), and
the third — "Send DoorDash Meal" / "Send Uber Ride" / "Notify Pastor in Slack" —
are buttons that currently do nothing but `alert('...Mocked action')`
(`AutomationsReport.tsx:84-94`) while implying they placed a real DoorDash
order or Uber ride using a church member's home address. **This is the
audit's third-party-egress question made concrete**: the button doesn't call
DoorDash or Uber today, but its entire UX is designed around the assumption
that it eventually will — meaning the day someone wires it up, a member's home
address (needed for both DoorDash delivery and Uber pickup) leaves PCO and
goes to two consumer gig-economy platforms with a single staff click, no
consent capture, no data processing agreement visible anywhere in this
codebase, and no confirmation step showing the operator what address is about
to be sent where.

**PCO overlap:** PCO Workflows already does "if X, assign a person a step" case
management natively, with an audit trail (who did what, when) that this report
does not have — every "Approve" click here is a client-side `alert()`, not a
logged action (`handleApprove`, `AutomationsReport.tsx:84-94`). A church
already on PCO Workflows for care-team follow-up would find this a strictly
worse version of what they have, minus the audit trail, for the four lanes
that work, and a non-functional decoy for the three that don't.

**Governance / privacy risk:** High for New Baby/Elderly/First-Time-Giver
specifically — (1) two of three run on fabricated data that will silently
never populate against real PCO, training staff to trust an empty "no actions
needed" state that isn't actually validated data, it's an absent field; (2) the
third is a template for shipping home addresses to third-party gig platforms
with no consent UI in sight. Low-to-moderate for the birthday/promotion/
background-check lanes, which are real data with a real, narrow, defensible
use.

**What would make it worth the licence fee:** Split this feature. Keep and
harden birthday/promotion/college/background-check lanes — add a real
audit-logged "approve" (not `alert()`), and they're worth shipping today.
Delete the DoorDash/Uber/Slack lanes entirely until there's an actual signed
integration, a consent flag on the member record, and a confirmation screen
that shows the exact address/message being sent before it goes. Do not ship
speculative third-party-integration UI with a member's home address behind it,
mocked or not — it teaches staff the workflow exists before it's safe to use.

---

## Verdict Summary

| # | Feature | Verdict |
|---|---------|---------|
| 19 | Pastoral Co-Pilot | DEMOTE |
| 20 | Burnout Risk | SIMPLIFY |
| 21 | Predictive Attrition (Drift) | SIMPLIFY |
| 22 | Missing Volunteers | KEEP |
| 23 | Recruitment Intelligence | SIMPLIFY |
| 24 | Retention Funnel (Newcomer) | KEEP |
| 25 | Bus Factor | DEMOTE |
| 26 | Volunteer Web | CUT |
| 27 | Emergency Alerts | CUT (as shipped) |
| 28 | Automations | SIMPLIFY + CUT (gig-economy lanes) |
