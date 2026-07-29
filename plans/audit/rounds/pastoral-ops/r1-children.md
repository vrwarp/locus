# Area C — pastoral-ops — Round 1 critique (children's ministry lens)

Reviewer: children's-ministry-agent (birth–5th grade director, ~300 kids/2 services,
PCO Check-Ins desk operator). Standing context confirmed by code read: all ten of
these features live only under **Locus Intelligence**
(`src/components/SidebarIntelligence.tsx:21,53,61,69,77,85,109,117,214,222`), sold on
the landing page as "Boardroom Ready Analytics" (`src/components/LandingPage.tsx:29`).
Getting there is a single button click after PCO Basic-auth login
(`src/App.tsx:674,677`) — there is no separate permission check gating "Executive
Dashboard" from anyone who has org PCO credentials. Every finding below should be read
against that: nothing in this area is scoped down for the sensitivity of what it shows.

---

## #19 Pastoral Co-Pilot — `src/components/CoPilot.tsx`, `src/utils/copilot.ts`

**Verdict: DEMOTE**

**Safety impact:** None directly — it's read-only, no writes to PCO. But it is a
plain-text search box over the full congregation including children, gated by
nothing but "which workspace did you click." `who is <name>` and `<n>th grade`
intents (`copilot.ts:165-228`) return a child's name, age, and grade to whoever is
typing, with no distinction between an admin and anyone who has a login at all.

**Sunday-morning cost:** None — this is not a check-in-desk tool, it's a chat window
in the executive dashboard.

**Household/guardian correctness:** The "split household" intent
(`copilot.ts:72-94`) delegates to `analyzeFamilies`, inheriting whatever that
util's surname/address-matching assumptions are (reviewed under Area A, not here) —
but presenting its output conversationally, in prose, makes a probabilistic guess
read like a confident finding. A `secondary` string like "shares email/phone across
households" next to "Smith Family" invites a well-meaning volunteer to *act* on a
guess about who lives with whom.

**Minor-data flag:** `who is` / grade search returns a child's full name + age
+ grade to anyone who can type in the box (`copilot.ts:206-228`, `165-189`). No
role check, no redaction, no "this is a minor" gate. It also fields "Ghosts" and
"Automations" queries that quote a child's age directly in the response line
(`copilot.ts:133-140`).

**What would make this worth a volunteer's attention:** Nothing here is desk-facing.
If it survives, it needs a hard allowlist of what it will say about a minor (no age,
no grade, no name unless the asker already has record access), and it needs to sit
behind whatever permission actually gates PCO people-data access today (none does,
per the auth review above) — not a landing-page button.

---

## #20 Burnout Risk — `src/components/BurnoutReport.tsx`, `src/utils/burnout.ts`

**Verdict: SIMPLIFY**

**Safety impact:** **Real, and currently invisible.** `calculateBurnoutRisk`
(`burnout.ts:27-111`) flags anyone serving ≥6 times in 8 weeks with low/zero
worship attendance, sorts them "High" first, and stops. It never looks at
`Student.backgroundCheckExpiresAt` (`pco.ts:86`), which the codebase clearly has
and clearly tracks elsewhere (`automations.ts:122-147`). A volunteer flagged
"High Risk — burning out" in this report could simultaneously have an **expired**
background check and this tool would never say so. The one list a children's
director actually needs — "who is serving kids this week without current
clearance" — doesn't exist; this one is adjacent to it and silent on it.

**Sunday-morning cost:** Zero — desk volunteers never see this.

**Household/guardian correctness:** N/A, adults only by construction (no explicit
adult filter, actually — `personStats.forEach` at `burnout.ts:74-102` runs over
*any* person matching the serving/worship pattern, comment on line 79 admits "We
focus on adults/volunteers usually, but let's just flag anyone matching the
pattern." A teenage helper checked into "Kids Ministry Team" six times could show
up as a burnout risk with no adult/child distinction at all.

**Minor-data flag:** None directly, but see above — no child/adult gate on who gets
classified as a "volunteer."

**What would make this worth a volunteer's attention:** Join this against
`backgroundCheckExpiresAt` and roster/clearance status. "Burning out AND clearance
lapses in 12 days" is an action; "burning out" alone is a Wednesday-staff-meeting
curiosity that nobody at the check-in table can do anything with.

---

## #21 Predictive Attrition (Drift) — `src/components/DriftReport.tsx`, `src/utils/drift.ts`

**Verdict: NOT MY LANE**

**Safety impact:** None. `calculateDriftRisk` (`drift.ts:13-97`) only looks at
`kind === 'Regular'` check-ins (`drift.ts:31`) — it explicitly excludes volunteer
serving records ("Volunteer burnout is handled elsewhere") — so it never touches
roster/ratio/clearance concerns. This is general-congregation attendance-trend
analytics, not a children's-ministry or volunteer-ops tool.

**Sunday-morning cost:** None.

**Household/guardian correctness:** N/A.

**Minor-data flag:** Children are not filtered out of the input (`students`
passed in unfiltered by `DriftReport.tsx:14-41` includes both adults and kids), so
a child whose attendance has dropped 50% over 6 weeks would appear on an
"attrition" list next to adults leaving the church — which is a different, more
alarming category (custody change? family stopped attending entirely? kid moved to
a different service?) that this tool can't distinguish and doesn't try to. Worth
flagging to whoever owns Area D/engagement-analytics, but not something I'll score
on safety since it's not check-in/roster-adjacent.

**What would make this worth a volunteer's attention:** Not for me to say — pass to
whichever critic owns general engagement.

---

## #22 Missing Volunteers — `src/components/MissingVolunteersReport.tsx`, `src/utils/missing.ts`

**Verdict: SIMPLIFY**

**Safety impact:** This is the closest thing in Area C to an actual ratio-gap
alert, and it doesn't know it. `calculateMissingVolunteers` (`missing.ts:11-102`)
flags a "key volunteer" (≥2 serves in the prior 6 weeks) who has 0 check-ins in the
last 2 weeks — but it has no concept of *which team* they served on, whether that
team is a kids' room, or whether anyone backfilled the slot. A children's director
does not need "Jane hasn't checked in for 2 weeks" as a generic HR nudge; she needs
"the 9am Pre-K room is down a volunteer this week" *before* Sunday, cross-referenced
against ratio requirements. This tool answers a different, softer question and
dresses it up as the urgent one ("Missing Person Alert" header, 🚨 icon in CoPilot at
`copilot.ts:114`).

**Sunday-morning cost:** Zero as built — it's a Tuesday report, not a Sunday tool,
and by the time it fires (2 full weeks of absence) the ratio gap it should have
predicted already happened at least once, unwarned.

**Household/guardian correctness:** N/A.

**Minor-data flag:** None.

**What would make this worth a volunteer's attention:** Team-scoped output ("Nursery
team, 2 down") with a same-week or next-Sunday lookahead, not a lagging 2-week
trailing indicator. Right now it tells you a fire already happened.

---

## #23 Recruitment Intelligence — `src/components/RecruitmentReport.tsx`, `src/utils/recruitment.ts`

**Verdict: SIMPLIFY**

**Safety impact:** This is the one place in the app that explicitly recommends
specific parents for **Kids Ministry** placement (`potentialRoles.push('Kids
Ministry')` at `recruitment.ts:112`, driven purely by "has a child aged 5–10 in
the household") — and generates a canned outreach script
(`generateAskScript`, `recruitment.ts:141-176`) inviting them to serve *in that
room with children they may not have clearance to be alone with yet*. Nothing here
checks `backgroundCheckExpiresAt`, nothing warns that recruiting into a kids' room
means "start the clearance process," and the copy-paste "Ask Script"
(`RecruitmentReport.tsx:44-50`) makes it trivially easy for someone to send this and
have the parent show up expecting to walk straight into a classroom next Sunday.

**Sunday-morning cost:** None at the desk, but real downstream: a recruited-and-
excited parent arriving unannounced without a badge or clearance is exactly the
kind of thing that turns into an awkward door-of-the-nursery conversation.

**Household/guardian correctness:** Parent inference is via shared `householdId`
only (`recruitment.ts:57-65, 97`) — reasonable as a household join (matches PCO's
own model) but the tool never distinguishes a legal guardian from, say, a live-in
grandparent or a step-parent without documented custody — irrelevant for
"recommend serving," but the script it generates ("we love having Emma and Jack in
our ministry areas") assumes a stable, uncomplicated household narrative that
doesn't always hold.

**Minor-data flag:** Child first names are surfaced into recruitment scoring and
scripting (`childNames` built at `recruitment.ts:104-118`, used at
`recruitment.ts:155-159` and rendered in the UI at `RecruitmentReport.tsx:89`) for
a feature that lives in the un-gated "Intelligence" workspace. A named list of
"which kids belong to which prospective volunteer" is more child-identifying data
than this workspace's access model should be handing out.

**What would make this worth a volunteer's attention:** Attach a clearance-status
badge and "Kids Ministry recruits automatically start background check" step to the
script itself. Right now it's a matchmaking feature that skips the one gate that
actually matters for the match it's making.

---

## #24 Retention Funnel (Newcomer) — `src/components/NewcomerFunnel.tsx`, `src/utils/retention.ts`

**Verdict: NOT MY LANE**

**Safety impact:** None. `calculateNewcomerFunnel` (`retention.ts:10-67`) only
counts `kind === 'Regular'` check-ins and produces an aggregate 4-step funnel with
no per-person output at all — nothing identifying, nothing actionable at the
individual level.

**Sunday-morning cost:** None.

**Household/guardian correctness:** N/A — aggregate counts only.

**Minor-data flag:** Children are included in the underlying check-in counts
(nothing filters `isChild`), so a family's first Sunday shows up as multiple
"newcomers" (parent + each kid checked into kids' service) rather than one
household — inflates the funnel numbers but isn't a minor-data exposure, just a
counting-methodology question for whoever owns growth analytics.

**What would make this worth a volunteer's attention:** Not mine to say.

---

## #25 Bus Factor — `src/components/BusFactorGraph.tsx`, `src/utils/busFactor.ts`

**Verdict: SIMPLIFY**

**Safety impact:** **This is the single most important finding in the area.**
`calculateBusFactor` (`busFactor.ts:13-125`) clusters check-ins into "shifts" by
event + 60-minute time window and flags anyone who was the *only* person checked
into a serving shift (`soloCount`, incremented when `teamSize === 1` at
`busFactor.ts:120-121`). Where `classifyEvent` (`burnout.ts:11-25`) tags an event
"Serving" by keyword match on "team"/"ministry"/"volunteer"/"greeter" — which
plainly includes something like "Kids Ministry Team" or "Nursery Volunteer" — a
solo check-in there is not a *continuity* risk, a "what if this person quits"
concern. **It is a live, already-occurred ratio breach**: one adult, alone, with
children, unwitnessed. The tool packages that exact event as "The Bus Factor Risk"
— continuity/succession framing (`BusFactorGraph.tsx:69-72`, "single points of
failure") — and buries it in a bar chart on an executive dashboard nobody looks at
until the following week, if ever. The data to catch this in real time already
exists (check-in kind + event name); it's being computed for the wrong question.

**Sunday-morning cost:** Zero today — this is the problem. A ratio breach that
happened at 9:15am should be a same-day or same-hour signal to a director standing
at the check-in table, not a retrospective chart in a boardroom deck days later.

**Household/guardian correctness:** N/A.

**Minor-data flag:** None beyond the general room exposure above.

**What would make this worth a volunteer's attention:** Split this feature in two.
Keep "single point of failure on the parking team" as low-urgency ops trivia if you
want. But any solo-check-in cluster on an event whose name matches kids/nursery
classification needs to be a same-day ratio-breach alert to the children's director,
not a "bus factor" bar chart. As shipped, this is arguably worse than not having the
feature: it computes exactly the signal I need and mislabels it as something else,
which means it will never be looked at by the person who needs it.

---

## #26 Volunteer Web — `src/components/VolunteerWeb.tsx`, `src/utils/volunteerWeb.ts`

**Verdict: CUT**

**Safety impact:** None achieved, though it sits on data that could carry some.
`buildVolunteerGraph` (`volunteerWeb.ts:22-140`) clusters the same serving
check-ins as Bus Factor into a force-directed graph of "who serves together." It
is a pure visualization — no thresholds, no alerts, no export, nothing
actionable — of exactly the same shift-clustering logic #25 already computes for
an actual purpose. It doesn't distinguish a kids' room team from an usher team,
doesn't surface ratio, doesn't surface clearance. It's an aesthetic view of data
that #25 is already sitting on and putting to (mislabeled) use.

**Sunday-morning cost:** None — decorative dashboard piece.

**Household/guardian correctness:** N/A.

**Minor-data flag:** Node hover tooltip (`VolunteerWeb.tsx:167-171`) shows a
volunteer's name and team — low sensitivity on its own, but it's identical
underlying data to #25 with none of the safety value, in the same ungated
workspace.

**What would make this worth a volunteer's attention:** Nothing, as built. If the
underlying shift-clustering computation gets redirected toward the ratio-breach
alerting #25 needs, this graph is a nice-to-have visualization *of that*, not a
separate feature. Standalone, it's a demo-day chart.

---

## #27 Emergency Alerts — `src/components/EmergencyAlerts.tsx`

**Verdict: CUT (as built — do not ship this to a building with 300 kids in it)**

**Safety impact:** **High, and in the wrong direction.** This is a mass-SMS blast
tool (`handleSend`, `EmergencyAlerts.tsx:19-34`) whose recipient list is: every
`Student` record in the entire loaded roster with a non-empty `phoneNumber` field
(`recipients`, `EmergencyAlerts.tsx:15-17`) — no filter on `isChild`, no filter on
role, no filter on "checked in today," no filter on "this campus," no consent/opt-
out flag anywhere in the `Student` type. There is no confirmation step between
typing a message and firing it (`btn-send-alert` calls `handleSend` directly,
`EmergencyAlerts.tsx:65-71`) — no "you are about to text N people" modal, no
undo. For an actual emergency in a building with 300 kids checked in across two
services, this is exactly backwards from what's needed: the thing a children's
director needs in a lockdown/evacuation/medical event is "text the parents of
children currently checked in to Room 204," scoped and immediate. What's built is
"text everyone in the database who has ever had a phone number," with no way to
scope down to who is *actually in the building right now* — the one list PCO
Check-Ins data could actually answer and this feature never asks it.

It is also entirely fake: `setTimeout(...)` with a comment `// Mock API call to
Twilio` (`EmergencyAlerts.tsx:25-26`). Nothing sends. If a director trained on this
screen ever needs it for a real emergency, it will silently do nothing while
reporting success ("SMS blast sent successfully to N members!",
`EmergencyAlerts.tsx:45-47`).

**Sunday-morning cost:** If real, this is the single highest-stakes screen in the
whole app on an actual Sunday. As built, it's worse than not having it, because a
director could reasonably believe it works.

**Household/guardian correctness:** None applied — no attempt to route a message
to "child's guardians" vs. "the child's own number if a teen has one." A blast to
"everyone with a phone number" will text some children directly if their record
happens to carry a phone number, with no household-aware suppression.

**Minor-data flag:** Fails outright. A tool that can text a child's own phone
number directly, with no consent field, no role filter, and no real backend, sitting
one click past a landing page with no auth gate, is not something I'd let near a
real children's ministry roster.

**What would make this worth a volunteer's attention:** Full rebuild, not a fix:
(1) real Twilio wiring behind a confirmation step that states recipient count and
scope, (2) recipient scoping by "checked in today / this campus / this service" —
which the check-in data already supports — not "has a phone number," (3) a
guardian-routing rule so a child's own number is never a direct blast target, (4) an
audit log of who sent what to how many people and when, (5) role-gating tighter than
a landing-page button click. Until then this should not be presented as a working
feature to a customer.

---

## #28 Automations (new baby / elderly rides / first-time giver) — `src/components/AutomationsReport.tsx`, `src/utils/automations.ts`

**Verdict: KEEP (the background-check lanes) / SIMPLIFY (new-baby) / DEMOTE (rest)**

Breaking this feature apart, since it bundles unrelated workflows into one screen:

**New Baby Alert (`getNewBabies`, `automations.ts:168-170`):** Correctly identifies
this as a high-value moment (per my own priors), but the detection logic is
`s.age === 0 && s.isChild` — age is `differenceInYears(new Date(), dob)`
(`pco.ts:243`), so *any* child under 12 months reads as `age === 0`, whether born
yesterday or 11 months ago. There's no "born in the last N days" window, so a family
whose baby is 10 months old will show up in "New Baby Alert" indefinitely (well,
until the birthday flips it to `age === 1`), and a family whose baby was born
yesterday gets the exact same "send DoorDash" treatment as one whose baby is nearly
a year old — the moment this is supposed to catch (the fresh, overwhelmed first two
weeks) isn't distinguished at all. Also: **birthdate is exactly the field this
persona document (and the code's own author, per `pco.ts:233-236` early-return on
missing birthdate) flags as most likely to be a guessed or placeholder value for an
infant** — a grandparent checking in a newborn under stress is a prime candidate for
a placeholder 1/1 birthdate, which would either silently exclude the baby from this
feature (record dropped entirely by `transformPerson`'s `!birthdate` guard) or
compute a wrong age. This is the exact "least-trained person enters data on a phone"
failure mode I'd expect, applied to the highest-value automation in the list.

**Background Check lanes (`getExpiringBackgroundChecks` / `getExpiredBackgroundChecks`,
`automations.ts:122-147`):** These are the best-aligned features in the entire
Area C inventory with what a children's director actually needs — and they're
undermined by being one lane among eight equally-weighted lanes on a scrolling
dashboard (`AutomationsReport.tsx:106-322`) instead of a standalone, elevated
alert. "Expired Background Checks (Safe Sanctuary)" carries a `critical-item`
CSS class (`AutomationsReport.tsx:254`) but its one-click resolution is
`alert('Action "Remove from Roster" approved...')` — a browser `alert()`, no real
PCO write, no confirmation of consequence (removing someone from a serving roster
before their next shift is exactly the kind of change that needs a real audit
trail, not a JS `alert()` that vanishes on dismiss). Nothing here cross-references
which *team* the expired-check volunteer serves — a lapsed check on the greeter
team and a lapsed check on the nursery team are not the same emergency, and this
list treats them identically.

**Elderly Care / First-Time Giver:** Fine as generic care-team utilities; not a
children's-ministry concern, not evaluated further here beyond noting they occupy
equal visual weight with the two safety-critical lanes above, which dilutes the
one thing on this screen that's actually urgent.

**Safety impact:** Real (background-check lanes), muted by (a) the mocked
one-click resolution and (b) the flat, undifferentiated lane layout that gives
"first time giver" the same visual priority as "expired background check on a kids'
volunteer."

**Sunday-morning cost:** None — this is a back-office triage screen, correctly kept
out of the check-in desk flow.

**Household/guardian correctness:** New Baby lane has no household framing at all —
it lists the baby, not "the [Surname] family, new baby [name]," which is the actual
unit a care team acts on.

**Minor-data flag:** New Baby cards show a child's name and age directly on a
dashboard reachable via the same ungated Intelligence workspace as everything
else in this area.

**What would make this worth a volunteer's attention:** Split expired/expiring
background checks into their own top-of-app alert, not a lane on a general
automations board — that is the one piece of Area C that's actually a
"stop what you're doing" item. Fix new-baby detection to use a real "born in the
last N days" window with a graceful fallback for missing/placeholder birthdates
instead of a fragile `age === 0` check that silently mishandles exactly the record
class most likely to be sloppy.

---

## Summary

| # | Feature | Verdict |
|---|---------|---------|
| 19 | Pastoral Co-Pilot | DEMOTE |
| 20 | Burnout Risk | SIMPLIFY |
| 21 | Predictive Attrition (Drift) | NOT MY LANE |
| 22 | Missing Volunteers | SIMPLIFY |
| 23 | Recruitment Intelligence | SIMPLIFY |
| 24 | Retention Funnel (Newcomer) | NOT MY LANE |
| 25 | Bus Factor | SIMPLIFY |
| 26 | Volunteer Web | CUT |
| 27 | Emergency Alerts | CUT |
| 28 | Automations (new baby / elderly / first-time giver) | KEEP background-check lanes / SIMPLIFY new-baby / DEMOTE rest |
