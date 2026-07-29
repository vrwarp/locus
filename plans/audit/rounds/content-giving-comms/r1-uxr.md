# Area E — content-giving-comms — Round 1 (UXR discovery critique)

Standing fact for this area: Locus has **no Giving API access at all** (per
audit brief and `plans/01_vision_and_strategy.md` — People + Check-Ins only).
Every dollar figure rendered anywhere in features #37–#40 is therefore
synthesized client-side, never fetched. That single fact governs four of the
seven verdicts below.

Surface placement matters here: #37, #38, #39, #40, #41 all live in
**Locus Intelligence**, the read-only dashboard built for Dr. Robert, the
executive pastor persona who by design cannot click into a record to check it
(`SidebarIntelligence.tsx:20-186`). He is the audience for the fabricated
numbers. #43 lives in Locus Core, Sarah's admin surface.

---

## #37 Sermon Sentiment (`src/components/SermonSentiment.tsx`)

**Verdict: CUT**

**Evidence:**
- Attendance bars are real, pulled from `fetchEvents`/`fetchRecentCheckIns`
  (`SermonSentiment.tsx:27-30`).
- Sermon **topics** are not sermon data at all — they're `SERMON_TOPICS[index % 8]`,
  a hardcoded 8-item array cycled by week index, with the comment "Mock mapping
  of dates to sermon topics since we don't have a real endpoint for this"
  (`src/utils/sermons.ts:12-22, 82-84`). Locus never ingests a sermon topic,
  title, or transcript from anywhere.
- The chart's x-axis, its entire reason for existing ("sermon topic"), is
  fiction wearing a real y-axis.
- "Overlay Giving Volume" checkbox (`SermonSentiment.tsx:63-72`) renders a line
  computed as `attendance * 25` (`sermons.ts:87`) — there is no Giving API, so
  this is arithmetic on attendance, not giving.

**Top defects:**
1. **Fabricated x-axis presented as fact.** Dr. Robert reads "Faith Over Fear:
   412 attendance" and reasonably concludes Locus knows what he preached that
   week and how it landed. It doesn't — it round-robined a static list. There
   is zero UI signal (no badge, no asterisk, no tooltip) that the topic axis is
   synthetic while the bar height is real. This is exactly the "presenting a
   simulation as an insight" failure the brief calls out, and it's the worst
   version of it because the real half (attendance) and fake half (topic) sit
   on the same bar, indistinguishable.
2. **Giving overlay is a second fabrication layered on the first**, off a
   feature (Giving) Locus cannot see. A pastor toggling this on gets a green
   line he will read as "giving went up when I preached generosity" — a
   causal claim about congregant money, invented from an attendance count.
3. Demographic multi-select filters real check-in data against fake topics —
   filtering doesn't fix the fabrication, it just produces a more precisely
   fabricated chart.

**Cheapest fix:** Delete the topic axis and the giving overlay entirely.
What's left is "worship attendance by week," which Attendance Pulse (#29)
already shows better. There is no version of this feature that earns its
slot without a real sermon-topic data source (manual tagging, a PCO custom
field, or a CMS integration), and none exists today.

**Open question:** Would a pastor actually want to *manually tag* each
week's sermon topic against an attendance chart? If yes, that's a different,
honest feature (user-entered metadata, not "correlation").

---

## #38 Sermon Correlator (`src/components/SermonCorrelator.tsx`)

**Verdict: CUT**

**Evidence:**
- Same fake-topic dependency as #37 via `correlateSermonsWithEngagement`
  (`sermons.ts:110-148`), which itself calls `correlateSermonsAndAttendance`
  for its baseline.
- `smallGroupSignups` and `volunteerApplications` are not fetched from
  anywhere — they are `attendance * 0.05` and `attendance * 0.02`, with a
  1.5x multiplier if the (fake, cycled) topic string contains "community" and
  a 4x multiplier if it contains "serve"/"purpose" (`sermons.ts:125-135`).
  Locus has no PCO Forms/registrations integration; these are pure
  arithmetic on a fake label.
- The "AI Insights" panel (`SermonCorrelator.tsx:125-131`) is **hardcoded
  copy**, not generated: `"Sermons addressing 'Community' correlate with a
  50% increase in Small Group Signups"` and `"'Finding Purpose' ... 400%
  spike in Volunteer Applications"` are static JSX strings that literally
  restate the `1.5x` and `4.0x` multipliers the code itself just applied one
  function up (`sermons.ts:130,134`). The code writes the answer, then the UI
  calls it "AI Insight" and reports it back as a discovery.

**Top defects:**
1. **This is the single worst trust violation in the area.** It is not "data
   that happens to be simulated" — it is a hardcoded conclusion, engineered
   to match a hardcoded multiplier, labeled "AI Insights," shown to the one
   persona in the app who cannot see the code. Dr. Robert, prepping for a
   deacons' meeting, could cite "sermons on purpose 4x volunteer signups" as
   a real finding from his data platform. It is a string constant.
2. Same fake-topic-axis defect as #37, compounded — two fabricated metrics
   stacked on one fake label instead of one.
3. No visual or copy distinction between this and a genuinely-computed
   correlation elsewhere in the app (e.g., real attendance trend lines) —
   users have no way to calibrate trust per-screen.

**Cheapest fix:** Delete outright. There is no cheap partial fix — the
"insight" is the multiplier is the fake data; removing any one collapses the
other two. Nothing here is salvageable without (a) real sermon topics and
(b) a real forms/signups source, neither of which Locus has or is scoped to
get.

**Open question:** none needed — this should not survive to round 2 in any
form; verify no other area's Round 1 critic is relying on "Sermon Correlator"
as a template for what a legitimate correlation feature looks like.

---

## #39 Giving River (`src/components/GivingRiver.tsx`, `src/utils/giving.ts`)

**Verdict: CUT**

**Evidence:**
- `GivingRiver` takes **zero props** (`GivingRiver.tsx:34`) and calls
  `getGivingFlowData(dateRange)` (`giving.ts:18-52`), which returns a
  hand-authored Sankey graph: fixed node names (`Tithe`, `Offerings`,
  `Building Fund`...) and fixed dollar values (`500000`, `200000`...),
  scaled only by a per-range multiplier (`1`, `0.3`, `0.05`) that has no
  relationship to any church's actual size, fund structure, or giving
  history (`giving.ts:19-25, 41-49`).
- No church-specific data enters this component at any point — not even
  attendance count, which every other "giving" feature in this area at least
  uses as a scaling seed. A 40-person plant and a 4,000-person megachurch see
  the identical $500,000 tithe node.
- Per audit brief, Locus has no Giving API — so there is no honest path to
  real numbers here today.

**Top defects:**
1. A pastor at a real church sees "Tithe → General Fund: $500,000" on first
   load with no login-specific data behind it whatsoever. This is the
   starkest violation of the trust principle in the whole area: it isn't
   "attendance-derived and therefore plausible-looking," it's a fixture with
   a date-range dropdown bolted on to make it look interactive/live.
   Discovering this (trivial — just resize the window to "This Month" and
   watch the same funds scale by a flat 5%) destroys credibility for every
   other chart in Locus Intelligence in one click.
2. No labeling anywhere ("Sample data," "Illustrative only") — the header
   says "Visualizing the flow of generosity," present tense, first person,
   as if it's this church's generosity.
3. Sankey diagrams are also a poor form for an executive skim in general —
   dense, requires hover-per-link to get numbers, no aggregate takeaway
   visible without study.

**Cheapest fix:** Delete. If leadership wants a giving visualization, it
needs to wait on real Giving API access; shipping a static fixture under a
real church's login is worse than shipping nothing.

**Open question:** None — this is not a judgment call given no Giving API
exists; confirm with product that no church-specific config secretly feeds
`giving.ts` before deletion (a `grep` of the file shows it does not).

---

## #40 Stripe / Giving Trends (`src/components/GivingTrends.tsx`, `src/utils/givingTrends.ts`)

**Verdict: CUT**

**Evidence:**
- **Dead on arrival in production**: `App.tsx:920` renders
  `<GivingTrends checkIns={[]} events={[]} />` — hardcoded empty arrays, not
  the app's real `checkIns`/`events` state (compare to every sibling route in
  the same switch, e.g. `SermonSentiment` at `App.tsx:898` which is passed
  real `students`). `calculateGivingTrends([], [])` immediately returns `[]`
  because `events.find(...)` on an empty array is `undefined`
  (`givingTrends.ts:15-20`). The component's `data.length === 0` branch
  (`GivingTrends.tsx:25-36`) is therefore the **only** state any user of this
  build has ever seen: "Not enough check-in data to visualize trends."
- Even if wired correctly, the underlying data is fabricated: giving volume
  is `attendance * 25` run through `1 + sin(index*1.5)*0.15` "to look
  natural" — that phrase is a code comment, not my characterization
  (`givingTrends.ts:54-60`).
- The feature is branded **"Stripe Giving Trends"** in both the component
  header (`GivingTrends.tsx:47`) and the sidebar label "Stripe Trends"
  (`SidebarIntelligence.tsx:185`) — invoking a specific, real, named
  third-party payment processor that Locus has no integration with anywhere
  in the codebase (confirmed: no `stripe` package, no Stripe API calls
  exist).

**Top defects:**
1. **Broken navigation item**: clicking "Stripe Trends" in the sidebar today
   always shows an empty state, regardless of the church's real data. This
   is a plain defect independent of the trust question — the wiring bug
   (`checkIns={[]}`) means this nav item currently does nothing for anyone.
2. **If the wiring bug were fixed**, the next thing a user would see is a
   sine-wave-smoothed fabrication branded with a specific real company's
   name. That's a strictly worse outcome than the current broken state —
   fixing the bug without fixing the data would make the trust problem
   *live*. This is the sharpest example in the whole audit of "the empty
   state is accidentally the safest state."
3. Naming a fake feature after a specific real payment vendor is a
   reputational/legal exposure distinct from generic mock-data concerns —
   it implies a business relationship or integration Locus does not have.

**Cheapest fix:** Delete the route and sidebar entry. Do not fix the `[]`
wiring bug — that would only make the fabrication visible. If real Stripe
data ever exists, this needs a full rebuild and a rename away from a vendor
name Locus doesn't have a relationship with.

**Open question:** Is "Stripe" even the church's actual processor in the
target market (many use PCO Giving directly, or Tithe.ly, etc.)? If so this
feature would be misnamed even with real data.

---

## #41 Newsletter Architect (`src/components/NewsletterArchitect.tsx`, `src/utils/newsletter.ts`)

**Verdict: KEEP** (with a fix)

**Evidence:**
- Genuinely useful, genuinely real: pulls `fetchEvents` (real PCO events) and
  the app's real `students` list, lists the next 5 events verbatim and any
  student with a birthday in the next 7 days, with optional free-text sermon
  topic / pastor notes fields the user types themselves
  (`NewsletterArchitect.tsx:21-45`, `newsletter.ts:9-75`). Nothing here is
  invented by the app — event names and birthdates come straight from PCO,
  and the "sermon topic" is user-authored, not machine-guessed (unlike #37/38
  where it's silently synthesized).
  Output is a markdown draft with a working copy-to-clipboard.
  This is the one feature in the area that does what its label promises.

**Top defects:**
1. `upcomingEvents = events.slice(0, 5)` (`newsletter.ts:17`) takes the
   first 5 events in whatever order `fetchEvents` returns, with **no date
   filter and no sort** — the comment even admits "Assuming events provided
   are active." If PCO returns past or far-future events first, the
   newsletter can silently list stale or premature events as "this week's."
   A real user moment: Sarah generates Sunday's bulletin copy Thursday
   night, doesn't proofread against the calendar, and ships a newsletter
   listing an event that already happened.
2. Birthdays are pulled from the full `students` roster and put in a
   ministry-wide newsletter draft with no opt-out/privacy flag check — any
   member who asked not to have their birthday shared still shows up as a
   suggested newsletter line. Locus has no visible birthday-privacy toggle
   feeding into this filter.
3. No persistence — closing the tab loses the draft; `pastorNotes` and
   `sermonTopic` live only in component state.

**Cheapest fix:** For defect 1, filter `events` to the actual date window
described by the header (e.g., events within the next 7 days, sorted by
start date) instead of "first 5 in API order" — a few lines in
`generateNewsletter`. That alone fixes the most user-facing risk.

**Open question:** Does PCO expose a "hide birthday publicly" flag on a
person record Locus already ingests but ignores here? If yes, defect 2
should gate on it before this ships broader.

---

## #42 Robert Report (+ Genealogy tab) (`src/components/RobertReport.tsx`, `src/components/GenealogyGraph.tsx`)

**Verdict: CUT** (as currently shipped — it isn't shipped)

**Evidence:**
- `RobertReport` is **imported nowhere live**. The only reference in
  `App.tsx` is a commented-out import: `// import { RobertReport } from
  './components/RobertReport' // Deprecated in favor of direct views`
  (`App.tsx:11`). `grep` for `RobertReport` across `src/` turns up only the
  component file itself and its own test files
  (`RobertReport.test.tsx`) plus two unrelated integration test files that
  don't render it in the app tree.
  Every capability inside its 11 tabs (Health, Demographics, Burnout,
  Recruiting, Pulse, Retention, Bus Factor, Velocity, Heatmap, Network,
  Attrition) duplicates a live standalone route already in the sidebar
  (confirmed against `SidebarIntelligence.tsx` — every one of those names
  has its own nav item), which matches the "deprecated in favor of direct
  views" comment.
- **Genealogy is the one tab with no live counterpart.**
  `GenealogyGraph` (`GenealogyGraph.tsx`) and its data builder
  `src/utils/genealogy.ts` are real, working code — household-colored
  family-tree rendering with spouse/sibling/parent-child edge styling — but
  it is reachable **only** through the dead `RobertReport` modal. No sidebar
  item, no other import path exists (`grep` confirms `GenealogyGraph` is
  used only inside `RobertReport.tsx` and its own test).

**Top defects:**
1. The inventory lists this as a live "export" feature (#42); it is dead
   code. If any stakeholder believes "Robert Report" is what Dr. Robert
   uses, that belief is wrong today — he uses the direct sidebar routes.
   This is a documentation/inventory accuracy defect as much as a product
   one.
2. Genealogy — which looks like a genuinely differentiated, functioning
   visualization (family structure by household, real relationship data) —
   is orphaned behind dead code. It gets zero real-world usage and zero
   critique-loop attention it would get as a live surface, purely by
   accident of routing.

**Cheapest fix:** Two honest options, pick one: (a) delete
`RobertReport.tsx` entirely since every tab but Genealogy is a live
duplicate, and give Genealogy its own sidebar route/nav item if the product
believes in it; or (b) if nobody advocates for Genealogy, delete both files.
Leaving it half-wired as unreachable dead code is the worst of both options
— it costs bundle size and maintenance surface for zero user value.

**Open question:** Was Genealogy intentionally shelved (privacy concerns
about rendering family trees?) or just orphaned when `RobertReport` was
deprecated? That materially changes whether the fix is "give it a route" or
"delete it."

---

## #43 Integrations Hub (`src/components/IntegrationsHub.tsx`)

**Verdict: CUT**

**Evidence:**
- Four cards (Mailchimp, Zoom, Eventbrite, Typeform), each a checkbox toggle
  bound only to local `config.integrations[key]` boolean
  (`IntegrationsHub.tsx:13-22`). Toggling calls `onSaveConfig` — a local
  config write. **No network call, no API client, no OAuth flow exists
  anywhere in the codebase for any of these four services** (confirmed: no
  `mailchimp`/`zoom`/`eventbrite`/`typeform` references outside this file).
- The instant a user flips the switch on, the UI renders a specific,
  invented, quantified success message as fact: *"Syncing 423 profiles. 12
  ghosts paused."* for Mailchimp, *"Event 'Fall Retreat' mapped. 54 tickets
  synced."* for Eventbrite (`IntegrationsHub.tsx:64,66`). These numbers are
  hardcoded JSX strings, not derived from `students.length` or any app
  state — every church that flips this switch sees the identical "423
  profiles."

**Top defects:**
1. **This is a fake confirmation of a real-sounding action**, categorically
   worse than a mock chart: Sarah, the admin, believes she has just
   connected Locus to her church's actual Mailchimp account and that 12 real
   contacts got correctly paused from a real email send. Nothing happened.
   If she later gets a bounce complaint from an actual ghost record because
   Mailchimp *wasn't* touched, she will have a specific, falsifiable claim
   from Locus's own UI to point to ("it said 12 ghosts were paused").
   This is the highest-severity trust violation of anything read in this
   area, because it's not analytics being wrong — it's an action UI lying
   about performing an action.
2. No disabled/"Coming soon" affordance distinguishes this from a real
   settings toggle elsewhere in Core (e.g., `ConfigModal.tsx`). Visually
   it's indistinguishable from a functioning integrations page.
3. Toggling back off just says "Disconnected" — implying a real connection
   existed to sever.

**Cheapest fix:** Either (a) delete the route until real integrations exist,
or (b) if the product wants to gauge demand, replace the toggle+fake-status
pattern with a plain "Request this integration" button that does nothing
but log interest — never render a fabricated status string tied to a
specific quantity for an action that didn't happen.

**Open question:** Was this built as a sales/demo prop (i.e., intentionally
fake for a pitch) rather than production UI? If the audience is real church
admins in a real login, that context doesn't change the verdict, but it
changes who needs to hear this finding first.

---

## Area summary

| # | Feature | Verdict |
|---|---------|---------|
| 37 | Sermon Sentiment | CUT |
| 38 | Sermon Correlator | CUT |
| 39 | Giving River | CUT |
| 40 | Stripe / Giving Trends | CUT |
| 41 | Newsletter Architect | KEEP (fix event ordering) |
| 42 | Robert Report (+ Genealogy) | CUT (dead code; salvage Genealogy as its own route if wanted) |
| 43 | Integrations Hub | CUT |

Six of seven features in this area either fabricate data and present it as
insight, fabricate a completed action and present it as fact, or are
unreachable dead code mislabeled as live in the inventory. Only Newsletter
Architect does what its label says using only real data. This is the
lowest-trust area of the app audited so far by a wide margin, and it sits
entirely on the one dashboard (Locus Intelligence) whose entire value
proposition is that a non-technical executive can trust it without
verification.
