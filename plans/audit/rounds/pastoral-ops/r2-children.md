# Area C — pastoral-ops — Round 2 critique (children's ministry lens, adversarial)

## Verification of the two claims the proposal put on me

**1. `classifyEvent` order bug + `soloCount` zeroing — TRUE, confirmed by direct read.**
`burnout.ts:15` tests `'ministry'` (and `'team'`) before `burnout.ts:20` tests
Worship keywords — an event named "Kids Ministry" hits the Serving branch and
never reaches the Worship check at all. `busFactor.ts:30-33` admits any
check-in on a `servingEventIds`-matched event, and `analyzeCluster` builds
`teamSize` from every person in that 60-minute cluster (`busFactor.ts:102`),
with no `isChild` filter. Confirmed in the mock too: `mock-api/data.js:223`
and `:234` run two *separate* events — `Sunday Kids Church` (Worship) for
children and `Kids Ministry Team` (Serving) for volunteers — which is exactly
why the fixture never trips the bug. That naming split is a lucky accident of
the fixture author, not a property of real PCO orgs, where "Kids Ministry" as
the single check-in event name for the whole room (leaders and children alike)
is at least as common as the two-event split. **My round-1 claim that Bus
Factor "already computes" the ratio signal was wrong** — for any org that
names its kids event with "ministry," "team," or "volunteer" in the string,
`soloCount` for that team is mathematically incapable of firing, silently,
forever. I withdraw that claim.

**2. `background_check_expires_at` fabrication — TRUE, same pattern, same function.**
`mock-api/data.js:81-93` generates `backgroundCheckExpiresAt` inside the exact
same adult-loop, same object literal (`:127-130`), same
`Math.random()`-threshold technique as `prayer_topic` (:95-100) and
`first_time_giver`/`first_gift_date` (:102-108) — fields the admin agent
already proved fabricated. `pco.ts:231,275` reads it off the flat `attributes`
object from the standard `/api/people/v2/people` list response
(`pco.ts:446`) — no `include=`, no custom-field lookup, no call to PCO's
actual Background Checks resource. Real PCO exposes background checks as a
**separate relationship/resource** on a person, not a flat People-endpoint
attribute; nothing in this codebase's fetch path touches that resource. I
withdraw the KEEP on #28's background-check lanes as currently built.

**What replaces it:** the detection logic (`getExpiringBackgroundChecks`/
`getExpiredBackgroundChecks`) is sound and worth keeping *as a mechanism*, but
it must be re-pointed at a real data source before it ships to a real org:
either (a) a genuine PCO API call to the Background Checks relationship if
Locus's PCO scope can reach it, or (b) if not, an explicit
Settings-configured custom field, chosen by the org's admin, with a visible
"not verified against PCO" state in the UI when the field is absent — never a
silent, confident "All Clear." Per the proposal's own new finding
(§1, "never had a check"), even the current fabricated version can't see the
worst case; that gap gets worse, not better, once the field is real and most
volunteers in a real org have simply never had the custom field populated at
all. The pinned safeguarding block (N3) needs a fourth state: "clearance data
unavailable for this org" — distinct from "never checked" — or a director will
read an empty list as "everyone's clear."

## Decisions I contest

**ACCEPT #19 CUT, REJECT N1 as specified.** Cutting Co-Pilot is right. But N1
("Cmd+K palette... fuzzy on name... over `students`") is a straight
re-implementation of the exact minor-data hole I flagged in round 1 for
Co-Pilot's `who is`/grade intents — a name-fuzzy search over the full roster,
reachable from "anywhere in either layout," with no role check and no
distinction between an adult record and a child's. Deleting the chat window
and rebuilding the same unguarded lookup as a keyboard shortcut is not a fix,
it's a rename. N1 needs the same allowlist I asked for on #19: no age, no
grade, no child record surfaced by a bare name match unless the asker already
has PCO people-data access — which nothing in this app currently gates.

**REJECT §4.6 merge as insufficient on its own terms.** Folding #22 into #20
as a `flags` array fixes the vocabulary problem but drops the fix I actually
asked for in round 1: team-scoped output. "Jane: Overserving + Missing" is
still a person-level HR nudge; it still can't answer "is the 9am Pre-K room
short a volunteer this week." Concrete alternative: group the merged screen's
rows by `teamName` (the same field Bus Factor already derives from
`eventNameMap`) so a director can see team-level gaps, not just names in a
list, without waiting for a separate future feature to do it.

**ACCEPT §3(c) reframing of Bus Factor, with the correction above already conceded.**

**ACCEPT the Q1 answer path** (background-check re-verification) as consistent
with what I found above.

## What it dropped

Round 1 asked for a "text the parents of children currently checked in to
Room 204" scoping capability to eventually replace Emergency Alerts, not just
a deletion. The proposal's §4.1 deletes the send path cleanly (correct, and I
agree it must not ship as a stub with a textarea) but the "what replaces it"
work item — check-in-scoped, real-backend emergency messaging — isn't carried
into §6's new-ideas list at all. That's a real building's actual emergency
tool disappearing from the roadmap entirely, not just from this app version.

## Where it beat me

Round 1 asserted Bus Factor "already computes" a live ratio signal; the
proposal's §1.3/§3(c) correctly showed that claim was wrong for the exact
population it matters most for, and I've verified that above.
