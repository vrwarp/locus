# Area E — content-giving-comms — Round 1 (Children's Ministry)

Reviewer: children's ministry director persona (birth–5th grade, 300 kids,
two services, four volunteers, a label printer). Standing here is narrow —
most of this area is sermons and money. I'm reading it for one thing: does
any of it touch the kid roster, and if so, does it touch it safely.

---

## #37 — Sermon Sentiment (`src/components/SermonSentiment.tsx`)

**Verdict:** NOT MY LANE

This correlates sermon topics with worship attendance, optionally overlaid
with (fake) giving volume, filtered by generation including "Gen Alpha."
It pulls `fetchRecentCheckIns` — the same check-in stream check-in desk
volunteers scan wristbands into — but only to count bodies in seats, not to
touch names, allergies, or guardians. No safety surface here.

- **Safety impact:** none.
- **Sunday-morning cost:** none — this is a staff dashboard, never touches the desk.
- **Household/guardian correctness:** N/A.
- **Minor-data flag:** none directly, but see the cross-cutting note at the
  bottom about "Gen Alpha" check-in counts being folded into adult-oriented
  content analytics without anyone asking whether that's appropriate.
- **What would make it worth a volunteer's attention:** nothing — this is a
  preaching-team tool, not a check-in tool.

## #38 — Sermon Correlator (`src/components/SermonCorrelator.tsx`)

**Verdict:** NOT MY LANE

Same shape as #37 — sermon topic vs. small-group signups and volunteer
applications, plus a canned "AI Insights" panel (`SermonCorrelator.tsx:126-131`)
with two hardcoded bullets ("50% increase," "400% spike") that render
identically regardless of the data passed in. That's a data-integrity problem
for whoever owns Area E, not a children's-ministry problem.

- **Safety impact:** none.
- **Sunday-morning cost:** none.
- **Household/guardian correctness:** N/A.
- **Minor-data flag:** none.
- **What would make it worth a volunteer's attention:** nothing.

## #39 — Giving River (`src/components/GivingRiver.tsx`, `src/utils/giving.ts`)

**Verdict:** NOT MY LANE (flagged for the giving-owning critic)

I'll note it and move on: `getGivingFlowData()` (`src/utils/giving.ts:18-52`)
is 100% hardcoded fund totals — `Tithe`, `Offerings`, and yes, a
`Kids Ministry` line at a flat `$125,000 * multiplier` — with no connection
to any PCO or Stripe data at all. It exists as a Sankey diagram of numbers
nobody entered. If a children's director were ever shown this chart in a
board meeting believing "Kids Ministry" reflects real designated-giving
totals, that would be a real credibility problem for our budget ask — but
that's a giving-integrity finding, not a safety one.

- **Safety impact:** none.
- **Sunday-morning cost:** none.
- **Household/guardian correctness:** N/A.
- **Minor-data flag:** none.
- **What would make it worth a volunteer's attention:** nothing, until the
  numbers are real — then it's a finance/board tool, not mine.

## #40 — Stripe / Giving Trends (`src/components/GivingTrends.tsx`, `src/utils/givingTrends.ts`)

**Verdict:** NOT MY LANE (flagged for the giving-owning critic)

Also synthetic: `calculateGivingTrends()` (`src/utils/givingTrends.ts:54-60`)
takes real weekly worship attendance and multiplies by "~$25/person" run
through a sine wave "to look natural," labeled "Stripe Giving Trends" with
no Stripe integration anywhere in the codebase (confirmed — Locus has no
Giving API access per the inventory's standing context). It reuses
`PcoCheckIn` attendance data, which is adjacent to the check-in stream I
care about, but only as a headcount — no child identifiers surface here.

- **Safety impact:** none.
- **Sunday-morning cost:** none.
- **Household/guardian correctness:** N/A.
- **Minor-data flag:** none.
- **What would make it worth a volunteer's attention:** nothing.

## #41 — Newsletter Architect (`src/components/NewsletterArchitect.tsx`, `src/utils/newsletter.ts`)

**Verdict:** CUT the birthday feature as built (or DEMOTE the whole feature
until it's fixed)

This is squarely my lane and it is the worst finding in this area. The
Newsletter Architect drafts a markdown newsletter meant to be copy-pasted
(`handleCopy`, `NewsletterArchitect.tsx:47-51`) and sent out to the
congregation. Its "Upcoming Birthdays" section (`generateNewsletter`,
`src/utils/newsletter.ts:20-38, 61-69`) iterates the **entire `students`
array** — which per `src/utils/pco.ts:71-99` is the whole congregation
roster, adults and children together, each record carrying an explicit
`isChild: boolean` — and lists **full name + birthdate** for anyone with a
birthday in the next 7 days. There is no filter on `isChild` anywhere in
`generateNewsletter`. That means a 4-year-old in the nursery has exactly the
same chance of being listed, by full name and with a computed exact
birthdate, in a document a volunteer is one click away from pasting into
Mailchimp or a church-wide email, as a 70-year-old deacon does.

This fails my child-protection policy floor directly:
- No age gate. A feature explicitly built for "students" (the type name
  used for the *entire* congregation, not literally students — but note the
  UI copy: "based on upcoming calendar events and **student birthdays**,"
  `NewsletterArchitect.tsx:65` — the product's own language conflates
  "student" with "child" and still applies no filter) will happily
  broadcast a minor's name-plus-birthdate to whoever receives the
  newsletter — which, for a church newsletter, is often the public internet
  once mirrored to a website or social post.
- No guardian consent flag consulted. Some households have children under
  custody restrictions, foster placements, or safety orders where even a
  first name and age becoming public is a real risk to that child. This
  code has no concept of "do not publish" at the person level.
- No distinction for grandparents/foster/blended households: it doesn't
  matter for this bug specifically (it doesn't touch household structure at
  all), but it compounds the identity-exposure problem — birthdate + full
  name is enough to reconstruct a child's exact age and infer grade/room
  placement for anyone reading the newsletter who also attends the church.

- **Safety impact:** not a pickup or allergy issue, but this is a genuine
  minor-data exposure vector — the single largest one in this area.
- **Sunday-morning cost:** zero — this tool is never used at the check-in
  table. It's produced by a volunteer with clipboard access sometime during
  the week.
- **Household/guardian correctness:** N/A — no household logic used.
- **Minor-data flag:** YES — full name + exact birthdate of children,
  copy-pasted into a mass-distribution artifact, with zero opt-out,
  zero age filter, zero consent check. This alone should block ship.
- **What would make this worth a volunteer's attention:** filter
  `upcomingBirthdays` to `!person.isChild` by default, with an explicit
  opt-in toggle (off by default) if a ministry wants first-name-only "happy
  birthday" shoutouts for kids — never last name, never exact birthdate for
  a minor, ever.

## #42 — Robert Report + Genealogy Graph (`src/components/RobertReport.tsx`, `src/components/GenealogyGraph.tsx`, `src/utils/genealogy.ts`)

**Verdict:** CUT the inference logic before it ships anywhere (currently DEMOTE is moot — it's dead code)

First, the good news: this is not reachable in the running app. `RobertReport`'s
import in `src/App.tsx:11` is commented out ("`// Deprecated in favor of
direct views`"), and nothing else mounts `RobertReport` or `GenealogyGraph`
outside of their own test files. So today, no volunteer or director can
open this. That matters for verdict weighting — but the code still exists,
is still tested, and is one revert away from being live, so I'm reviewing
it as if it will be re-enabled.

`buildGenealogyGraph` (`src/utils/genealogy.ts:22-94`) is exactly the naive
household-inference logic point #5 in my brief warns about. It groups
`Student[]` by `householdId` only and then fabricates relationship edges
from co-membership alone:
- Every non-child in a household is linked to every other non-child as
  `'spouse'` (`genealogy.ts:56-66`) — pairwise, unconditionally. A
  grandmother and her adult grandson sharing a household, two roommates who
  happen to be entered as one PCO household, a widow living with her adult
  daughter — all get drawn as married.
- Every non-child is linked to every child as `'parent-child'`
  (`genealogy.ts:69-77`) — no distinction between a legal guardian, a
  step-parent, an unrelated adult in the house, or a grandparent with no
  custody authority. The graph draws the same solid dark line for all of
  them (`GenealogyGraph.tsx:89`).
- Every child is linked to every other child in the household as
  `'sibling'` (`genealogy.ts:80-90`) — a foster child and a biological
  child placed in the same home, or two children from a blended family with
  different surnames and no blood relation, get drawn as full siblings with
  no signal that the inference is synthetic.
- Cross-household relationships don't exist in this model at all. A child
  in joint custody who is entered under one parent's household in PCO (the
  common case) will appear to have exactly one household, one set of
  "parents," and no visible connection whatsoever to the other legal
  guardian. The tool doesn't say "we don't know" — it silently renders a
  complete, confident-looking family tree that is wrong by omission.

The hover tooltip (`GenealogyGraph.tsx:149-153`) then labels these inferred
nodes "Parent" / "Child" as if that's ground truth read from PCO, not a
guess derived from same-household membership. A director or volunteer
looking at this for five seconds would read it as "this is who this kid's
parents are" — which is precisely the wrong takeaway for a custody-sensitive
family, and precisely the harm my brief calls out by name.

- **Safety impact:** could contribute to a wrong-pickup-adjacent error if
  anyone ever treated this as an authority source for "who is this child's
  guardian" — it isn't one, but nothing in the UI says so. Currently zero
  impact because it's unreachable.
- **Sunday-morning cost:** none — never appears at the check-in desk, and
  shouldn't; this is architecturally a back-office visualization, not a
  check-in tool.
- **Household/guardian correctness:** fails outright. See above — assumes
  every household is a nuclear family, assumes co-residence implies both
  marriage and biological parentage, has no representation for split
  custody, blended surnames, foster placements, or grandparent caregivers.
- **Minor-data flag:** children's ages and inferred family position
  rendered in a shared-screen visualization (`Age: {hoveredNode.age}` at
  `GenealogyGraph.tsx:150`) with no access control shown in this component
  — access control would have to live at the modal/route level, and today
  there's no route at all.
- **What would make this worth a volunteer's attention:** nothing in its
  current form. If revived, it needs to (a) read actual PCO household
  relationship roles (parent/guardian/other) instead of inferring from
  co-membership, (b) visually distinguish inferred from confirmed links,
  (c) never claim "Parent" as a label unless PCO says so, and (d) be gated
  behind the same access tier as any other guardian-authority data — it is
  not a general-staff toy.

## #43 — Integrations Hub (`src/components/IntegrationsHub.tsx`)

**Verdict:** DEMOTE — dangerous shape even though it does nothing today

This is the one place in Area E where congregation data — including every
child's record, since `Student[]` has no adults-only carve-out anywhere in
this codebase — would actually leave the building. As built, it's four
toggle cards (Mailchimp, Zoom, Eventbrite, Typeform) that flip a boolean in
local config (`handleToggle`, `IntegrationsHub.tsx:13-22`) and then display
a **hardcoded** "active" status string regardless of what's actually
connected: flipping the Mailchimp switch always shows "Syncing 423
profiles. 12 ghosts paused." (`IntegrationsHub.tsx:64`) even though no
network call happens anywhere in this component or its test file. Today
that's a UI-integrity problem (fabricated status), not a data-safety one —
nothing actually syncs.

But the design itself is the concern for my lane: the Mailchimp card
promises to "sync tags and lists based on data health score" for the whole
database, with a single all-or-nothing switch. There is no field-level or
population-level scoping control anywhere in this UI — no "exclude
children," no "adults only," no per-list mapping. If this toggle is ever
wired to a real API, the default shape of this feature is "push the entire
People database, kids included, into a third-party email marketing tool,"
with the only guard being whether a single admin remembers to think about
it. For a database that includes birthdates, addresses, and (elsewhere in
the app) allergy/medical-adjacent fields on minors, "one switch, no
scoping" is the wrong default to build toward even as a mock.

- **Safety impact:** none today (nothing actually syncs). High latent risk
  if wired up as designed — no child-data exclusion exists to wire up.
  Missing entirely, not misconfigured.
- **Sunday-morning cost:** none — this is a settings-page feature, not a
  check-in one.
- **Household/guardian correctness:** N/A.
- **Minor-data flag:** YES, structurally — the feature's data model
  (`config.integrations`, `src/utils/storage.ts:24`) has no concept of
  "exclude minors" or "adults-only list," which needs to exist before any
  of these toggles do anything real.
- **What would make this worth a volunteer's attention:** it's not a
  volunteer-facing feature — it's a director/admin one, and it needs a
  visible, mandatory "children excluded by default" scoping control before
  any of these four integrations are allowed to move from mock to live.

---

## Cross-cutting note

Not a per-feature item, but worth naming once: multiple Area E features
(#37, #38, #40) pull `Student[]`/check-in counts that include children —
"Gen Alpha" is a selectable demographic filter in both sermon tools — and
fold that headcount into sermon-topic and giving analytics with no
disclosure that a meaningful share of "attendance" in those charts is
nursery and kids' check-ins, not adults in the sanctuary hearing the
sermon. That's a measurement-validity problem for whoever owns those
charts, not a safety one, but it means "Gen Alpha spikes 40% on Sermon X"
is likely just kids' ministry running a promo that week, misread as
content resonance.
