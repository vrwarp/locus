# Area E — content-giving-comms — Round 1 (Youth Ministry critique)

Reviewer: youth-ministry-agent (grades 6-12, multi-campus, Wednesday night + Sunday
small group + ~40 volunteer leaders). Files read: `SermonSentiment.tsx`,
`SermonCorrelator.tsx`, `GivingRiver.tsx`, `GivingTrends.tsx`, `utils/giving.ts`,
`utils/givingTrends.ts`, `utils/sermons.ts`, `NewsletterArchitect.tsx`,
`utils/newsletter.ts`, `RobertReport.tsx`, `GenealogyGraph.tsx`, `utils/genealogy.ts`,
`IntegrationsHub.tsx`, `App.tsx` (routing), `utils/pco.ts` (`Student` type).

Standing fact that shapes every finding below: the `Student` type
(`src/utils/pco.ts:71-99`) is not scoped to youth — it is every PCO Person record
in the database, adult and minor alike, distinguished only by a boolean `isChild`
(`pco.ts:84`, sourced from PCO's `child` attribute, `pco.ts:15,273`). There is no
`guardian`, `parent_id`, `consent`, or `opt_out` field anywhere in the codebase
(confirmed by grep across `src/`). Every feature in this area that touches
"students" is actually touching the whole congregation, unfiltered by age.

---

## #37 — Sermon Sentiment (`src/components/SermonSentiment.tsx`)

**Verdict: NOT MY LANE.**

This correlates the "worship" / "sunday" event (`utils/sermons.ts:31-33`, event
name must literally contain "worship" or "sunday") against check-in counts. It
has zero mechanism to touch Wednesday night youth programming — the worship-event
lookup means it structurally cannot see a `Student Ministries Wednesday` event
unless that event's name happens to contain "sunday" or "worship", which it won't.
A youth pastor gets nothing here: no attendance number in this component will
ever reflect Wednesday night.

One thing worth flagging even though it's not mine to own: `SERMON_TOPICS`
(`utils/sermons.ts:13-22`) is a hardcoded 8-item list cycled by `index %
SERMON_TOPICS.length` (`sermons.ts:83`) — it is not derived from any real sermon
record. The chart presents this as "Correlating historical sermon topics with
worship attendance spikes." It isn't correlating anything; it's assigning
labels round-robin to real attendance counts. That's a data-integrity concern
for whoever owns pastoral/comms credibility, not a youth-safety concern.

- **Survives the school year?** N/A — no youth data path exists.
- **False positive/negative cost:** N/A for my area.
- **Minor-safety flag:** none directly; demographic filter (`Gen Alpha`/`Gen Z`
  breakdown, `SermonSentiment.tsx:81-83`) does let a user isolate attendance by
  generation including minors, but the underlying data (worship-only) never
  includes youth Wednesday attendance, so there's no real minor data exposed
  that a Sunday adult-service chart wouldn't already show.
- **What a leader would need:** nothing — this tool has no path to a Wednesday
  night decision.

## #38 — Sermon Correlator (`src/components/SermonCorrelator.tsx`)

**Verdict: NOT MY LANE.**

Same worship-only event gate as #37 (reuses `correlateSermonsWithEngagement`,
built on top of `correlateSermonsAndAttendance`, `utils/sermons.ts:110-148`).
"Small Group Signups" and "Volunteer Applications" here are not read from PCO
at all — they're synthesized as flat percentages of adult-worship attendance
(5% and 2% respectively, `sermons.ts:125-126`) with hardcoded multipliers keyed
to whether the topic string contains "community"/"together" (×1.5) or
"serve"/"purpose" (×4.0) (`sermons.ts:129-134`). The "AI Insights" panel
(`SermonCorrelator.tsx:126-131`) then states these manufactured multipliers back
to the user as discovered facts ("Sermons addressing 'Community' correlate with
a 50% increase," "'Finding Purpose' resulted in a 400% spike") — this is the
comment in the source admitting it ("To simulate this... we will derive a
deterministic number... The vision doc says...", `sermons.ts:116-119`) surfaced
as a confident insight card with no disclaimer.

This has no youth small-group or youth-volunteer-application data behind it —
it's all-church, all-synthetic. Not my lane to fix, but flagging since a
pastor could plausibly forward this "insight" to a youth leader as if it said
something about teen small groups. It says nothing about teens.

- **Survives the school year?** N/A.
- **False positive/negative cost:** N/A for my area — but for whoever owns
  this: presenting a fixed multiplier as "the sermon caused a 400% spike" every
  single time a topic contains "serve" is a standing false-positive machine.
- **Minor-safety flag:** none — no youth-identifiable data reaches this screen.
- **What a leader would need:** nothing usable here.

## #39 — Giving River (`src/components/GivingRiver.tsx`, `utils/giving.ts`)

**Verdict: NOT MY LANE.**

`getGivingFlowData` (`utils/giving.ts:18-52`) is 100% hardcoded numbers
(`500000 * multiplier`, `200000 * multiplier`, etc.) with no query against PCO
or any giving API — confirmed by the standing context note that Locus has no
Giving API access at all. "Youth Ministry" and "Kids Ministry" appear as two of
the nine flow nodes (`giving.ts:35-37`) with static dollar figures
($75,000 and $125,000 respectively before the date-range multiplier) that never
change regardless of what's actually happening in student ministry. If a youth
pastor ever cited this number in a budget conversation it would be citing a
constant baked into source code. Not my lane to own, but I will not let it pass
silently: this is not "simulated for demo," it's presented in-product with no
label indicating it is fake.

- **Survives the school year?** N/A — static.
- **False positive/negative cost:** N/A for my area.
- **Minor-safety flag:** none — no individual/minor data involved.
- **What a leader would need:** nothing; this screen cannot inform any Wednesday
  night decision.

## #40 — Giving Trends / "Stripe Giving Trends" (`src/components/GivingTrends.tsx`, `utils/givingTrends.ts`)

**Verdict: NOT MY LANE.**

Same pattern as #39, one layer more convincing: `calculateGivingTrends`
(`utils/givingTrends.ts:10-70`) takes *real* worship check-in counts and
multiplies by a fabricated `$25`/attendee constant, then applies a sine-wave
"variance" (`givingVolume = baseGiving * (1 + Math.sin(index * 1.5) * 0.15)`,
`givingTrends.ts:58-60`) explicitly "so it doesn't change on re-render" and
"looks natural" — the code comment says this outright. The UI is titled
"Stripe Giving Trends" (`GivingTrends.tsx:29,47`) though Locus has no Stripe or
giving integration per the standing context. This is real attendance data
wearing a fake financial costume. Outside my lane to fix, but I'll note for the
record: nothing here is scoped to student ministry, and nothing here is real.

- **Survives the school year?** N/A.
- **False positive/negative cost:** N/A for my area.
- **Minor-safety flag:** none.
- **What a leader would need:** nothing.

## #41 — Newsletter Architect (`src/components/NewsletterArchitect.tsx`, `utils/newsletter.ts`)

**Verdict: CUT (as built) / DEMOTE if kept.**

This is squarely my lane and it's the most important finding in the area.

Mechanically, the tool cannot itself contact anyone: `generateNewsletter`
(`utils/newsletter.ts:9-75`) produces a markdown string, and the only action in
the component is `navigator.clipboard.writeText` behind a "Copy Markdown"
button (`NewsletterArchitect.tsx:47-51`). There is no send, no recipient list, no
audience picker, no integration call. So in isolation it cannot be the
mechanism that contacts a student without a parent in the loop — it has no send
path at all.

But that's also its indictment as a *feature*: it produces zero value a
volunteer leader could use on a Wednesday night. There is no way to scope
output to "my small group," no phone/email inclusion, no filter by grade,
campus, or ministry. It is a whole-church bulletin generator that happens to
list events and birthdays. A leader who wants to text six kids "see you
Wednesday, bring $5 for pizza" gets nothing from this screen.

The concrete minor-safety issue is the birthday block. `generateNewsletter`
pulls `students` — the full congregation, per the `Student` type note above —
filters only by `birthdate` presence and a 7-day window (`newsletter.ts:20-38`),
and prints **full name + birthdate** for every match with zero `isChild` check,
zero minimum-age suppression, and zero consent/opt-out gate (none exists in the
data model). Whatever staffer copies this markdown into an actual send tool —
and `IntegrationsHub.tsx` explicitly advertises Mailchimp sync in this same
area (#43) — is one copy-paste away from broadcasting a 12-year-old's full name
and birthdate to a mailing list of unknown size, with no household ever having
agreed to that specific use. Church birthday shout-outs are common practice,
but "common practice" for adults doesn't waive the minor-specific bar my
persona (and most child-protection policies) sets: a name+DOB pairing about a
minor going out over a channel nobody scoped or consented to is exactly the
"awkward for adults, unacceptable for a 13-year-old" pattern I was told to
watch for.

- **Survives the school year?** No school-year logic exists or is needed —
  birthdays are a fixed calendar fact. Irrelevant to grade promotion. But note:
  "upcoming events" is `events.slice(0, 5)` (`newsletter.ts:17`) with **no date
  filter at all** — it takes the first five events returned by the API in
  whatever order they arrive, not "next 7 days" as the code comment above it
  claims (`newsletter.ts:15`). A leader trusting this for "what's coming up"
  could publish a stale or out-of-order event list.
- **False positive/negative cost:** False positive = a minor's name+birthdate
  goes out in a mass communication the family never opted into; there's no way
  to catch this before publish because there's no review/audience step at all.
  False negative = a leader who actually needed to reach specific families
  (e.g., "permission slips due Wednesday") gets no targeting tool and falls
  back to a spreadsheet, which is what they were already doing.
- **Minor-safety flag: YES.** Name + birthdate for minors, unfiltered,
  unconsented, copy-pasted toward an unspecified and possibly third-party
  (Mailchimp) send channel. No parent/guardian is "in the loop" by construction
  — the tool has no concept of a guardian to loop in.
- **What a volunteer leader would need:** an audience scope (my small group /
  my campus / my grade), and if any minor-identifying detail is included, an
  explicit statement of who receives it and confirmation that's the intended
  list. As built, no leader below the person who owns the mailing tool can use
  this at all.

## #42 — Robert Report (+ Genealogy Graph) (`src/components/RobertReport.tsx`, `src/components/GenealogyGraph.tsx`, `src/utils/genealogy.ts`)

**Verdict: CUT (dead code) — but the design underneath is a minor-safety problem if it's ever reconnected.**

First and most important: **this feature is unreachable in the running app.**
`App.tsx:11` imports it as a comment: `// import { RobertReport } from
'./components/RobertReport' // Deprecated in favor of direct views`. Nothing in
`App.tsx`'s `currentView` switch or either sidebar renders `genealogy` as a
route. The only live callers are its own test files
(`RobertReport.test.tsx`, `GenealogyGraph.test.tsx`). So today, no leader,
pastor, or admin can open this screen. It should not be inventoried as a
present-tense "feature" — it's a maintained-but-orphaned component, which is
its own hygiene problem (tests keep it green, giving false confidence that this
UI is in the product).

Assuming it's a candidate for reconnection (it clearly still gets engineering
attention), the design is worth stopping now rather than after it ships:

`buildGenealogyGraph` (`utils/genealogy.ts:22-94`) draws parent-child, spouse,
and sibling edges purely from `householdId` + `isChild`, with no distinction
between a legal guardian and, say, an adult sibling or a live-in relative who
shares a household ID in PCO for administrative reasons. `GenealogyGraph.tsx`
then renders every person as a hoverable node whose tooltip states name, exact
age, and `isChild ? 'Child' : 'Parent'` (`GenealogyGraph.tsx:149-153`) — for
every minor in the database, plotted in a force-directed layout that visually
clusters and color-codes each household (`getHouseholdColor`,
`GenealogyGraph.tsx:15-22`). That is a household-structure map of every minor
in the church, including exact age on hover, with no gating found anywhere in
`RobertReport.tsx` beyond it being inside `userRole === 'core'`-only UI. There
is no household-messiness handling at all — divorced parents each showing up
as "spouse"-linked to whoever else shares their `household_id`, foster
placements or non-parent guardians rendered identically to biological parents
with a plain "Parent" label — so the graph will assert wrong family structure
with visual confidence exactly in the cases (divorce, guardianship, foster
care) where getting it wrong is most damaging.

- **Survives the school year?** N/A — structural, not calendar-based. But
  "age" recomputes correctly since it's derived live from birthdate; no stale
  grade-adjacent issue here.
- **False positive/negative cost:** A staff member reading "Parent" on a
  hover tooltip for someone who is actually a stepparent with no custody, or a
  household-mate with no legal relationship to the minor, could act on that
  (e.g., release a child to them, share information with them) based on a
  labeling the tool asserts with no underlying legal-guardian data. That's a
  real safeguarding risk if this ever becomes visible to anyone below the app's
  top admin tier.
- **Minor-safety flag: YES, if reconnected.** Full household graph of minors,
  exact age exposed on hover, parent/child role asserted from a same-household-ID
  heuristic with no verification, no guardian/custody distinction. This is
  exactly category 5 and 6 from my brief (location/structure exposure for
  minors; messy households rendered as clean two-parent boxes).
- **What a leader would need:** nothing — this was never designed for
  volunteer leaders, and it shouldn't be; it's already gated to `core` role. My
  objection is to the underlying data model, not the access tier, should this
  ever ship live.

## #43 — Integrations Hub (`src/components/IntegrationsHub.tsx`)

**Verdict: NOT MY LANE for the feature generally, DEMOTE-worthy flag on Mailchimp/Typeform specifically.**

This is a settings screen with four toggle cards (Mailchimp, Zoom, Eventbrite,
Typeform). Each toggle only flips a boolean in local config
(`handleToggle`, `IntegrationsHub.tsx:13-22`) — none of them make a real network
call. But the "active" status text is hardcoded fabricated detail regardless of
what's actually connected: "Syncing 423 profiles. 12 ghosts paused." for
Mailchimp, "54 tickets synced" for Eventbrite (`IntegrationsHub.tsx:64-67`) —
flip the switch, get a fake success report. That's a general trust problem,
not specifically a youth-ministry one, so I'll leave the general critique to
whoever owns integrations/finance.

What is my lane: the Mailchimp card's own description is "Sync tags and lists
based on data health score... Automatically pause sends to ghosts"
(`IntegrationsHub.tsx:64`). Given `Student` = the entire PCO roster with no
`isChild` exclusion anywhere in the sync logic (there is no sync logic —
there's a boolean and a lie), if this were ever wired up for real, one toggle
would push minors' names/emails to a third-party marketing platform with no
minor-exclusion filter and no guardian consent gate — precisely the "anything
sent to a third-party service" case flagged as a hard line for minors. Same
concern applies to Typeform ("Feed survey responses directly into custom
profile fields") if a student-facing form's freeform answers ever landed here
unfiltered.

- **Survives the school year?** N/A.
- **False positive/negative cost:** N/A — no live sync exists to misfire yet.
- **Minor-safety flag:** Latent, not active — flagging now so it's on record
  before anyone wires the Mailchimp toggle to a real API: any real
  implementation needs an explicit minor-exclusion or guardian-consent gate
  before a single sync call goes out.
- **What a leader would need:** nothing — this is an admin settings screen,
  correctly gated away from volunteer leaders.

---

## Summary verdicts (inventory order)

| # | Feature | Verdict |
|---|---------|---------|
| 37 | Sermon Sentiment | NOT MY LANE |
| 38 | Sermon Correlator | NOT MY LANE |
| 39 | Giving River | NOT MY LANE |
| 40 | Giving Trends ("Stripe") | NOT MY LANE |
| 41 | Newsletter Architect | CUT (as built) / DEMOTE if rebuilt with audience scoping |
| 42 | Robert Report + Genealogy Graph | CUT — dead code; minor-safety redesign required before any reconnection |
| 43 | Integrations Hub | NOT MY LANE, with a latent minor-safety flag on Mailchimp/Typeform sync |
