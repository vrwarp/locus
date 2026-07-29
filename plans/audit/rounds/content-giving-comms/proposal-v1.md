# Area E — content-giving-comms — Proposal v1 (after Round 1)

Synthesis of `r1-uxr.md`, `r1-church-admin.md`, `r1-youth.md`, `r1-children.md`.
Every load-bearing claim below was re-verified against source; corrections to the
critics are marked **[CORRECTION]**.

---

## 1. Changes since last round

**Initial proposal — no prior round.** Nothing is CONVERGED yet; every row in the
table is first-stated here and must survive Round 2 to converge.

Two things the critics did not have, established by re-reading source for this
synthesis:

* **[NEW] The test suite codifies the minor-safety defect.**
  `src/utils/newsletter.test.ts:13-46` builds three mock students, **all three
  with `isChild: true`** (grades 8, 6, 10), and lines 59-63 assert
  `expect(md).toContain('Charlie (Mar 24)')` and `expect(md).toContain('Alice
  (Mar 26)')`. The suite therefore *requires* that minors be published by name.
  Any agent told to "keep tests green" will re-introduce the defect. The repair
  is a code change **and** a test change, and the test change is the load-bearing
  half.
* **[NEW] `App.tsx` has no `checkIns`/`events` state at all.** Grep for
  `useState.*checkIns`, `const [events`, `fetchEvents`, `fetchRecentCheckIns` in
  `src/App.tsx` returns **zero hits**. See §2.4 — this changes what "fix the
  wiring bug" would actually cost.

---

## 2. Settled question (b): what is real and what is synthesised in #37–#40

`Student[]` and `auth` are real throughout. The question is what each *rendered
series* is.

| # | Fetches real data? | Real (measured) | Synthesised (invented in-app) |
|---|---|---|---|
| 37 Sermon Sentiment | **Yes**, itself | Left y-axis: weekly unique worship attendees, from `fetchEvents` + `fetchRecentCheckIns(auth, 20)` (`SermonSentiment.tsx:27-30`), deduped per person per week (`sermons.ts:60-75`). Generation filter uses real `birthdate` (`sermons.ts:45-57`). | **X-axis** — `SERMON_TOPICS[index % 8]` (`sermons.ts:83-84`), a hardcoded 8-item array cycled by week ordinal. **Right y-axis** — `givingVolume = attendance * 25`, ×2.5 if the fake topic contains "generous"/"giving" (`sermons.ts:87-90`). |
| 38 Sermon Correlator | **Yes**, via #37's baseline | Only the *hidden* attendance baseline (`sermons.ts:122`). Nothing measured is drawn. | **Every plotted series.** `smallGroupSignups = round(attendance*0.05)`, `volunteerApplications = round(attendance*0.02)`, ×1.5 on "community"/"together", ×4.0 on "serve"/"purpose" (`sermons.ts:125-135`). Plus the "AI Insights" panel — static JSX restating those same multipliers as discoveries. |
| 39 Giving River | **No.** Zero props (`GivingRiver.tsx:34`), no `fetch`, no `auth`, no PCO call anywhere in the component or `giving.ts`. | **Nothing.** | **Everything.** `getGivingFlowData(range)` (`giving.ts:18-52`) returns literal constants — `500000`, `200000`, `150000`, `125000` (Kids Ministry), `75000` (Youth Ministry) — multiplied by `{all-time:1, this-year:0.3, this-month:0.05}`. Not even attendance-seeded. Identical output for a 40-person plant and a 4,000-person megachurch. |
| 40 Giving Trends | **No — it is passed `[]`.** See §2.4. | Nothing, in the shipped build. *If wired:* weekly unique worship attendees (same logic as #37). | `givingVolume = attendance * 25 * (1 + sin(index*1.5)*0.15)` (`givingTrends.ts:58-60`), comment: *"to look natural"*. Headline "Avg Giving per Attendee: $25.xx" (`GivingTrends.tsx:47-50`) is that constant read back. Branded "Stripe Giving Trends" with no Stripe package or API call in the repo. |

**Ranking of dishonesty** (sharpest first, for anyone who must triage):
#43 > #38 > #39 > #40 > #37. #43 tops it because it is an *action* UI claiming a
completed action, not analytics being wrong.

### 2.4 `App.tsx:920`, exactly

```
src/App.tsx:918-922
{currentView === 'giving-trends' && (
    <div className="view-container fade-in">
        <GivingTrends checkIns={[]} events={[]} />
    </div>
)}
```

Three facts, each verified:

1. **Literal empty array literals**, not app state. Sibling routes in the same
   switch pass real values: `App.tsx:898` `<SermonSentiment auth={auth}
   students={students} />`, `:903` `<SermonCorrelator auth={auth}
   students={students} />`, `:940` `<IntegrationsHub config={config} ... />`.
2. **[CORRECTION to UXR]** This is *not* a "forgot to pass the variable" typo.
   `App.tsx` holds no `checkIns` or `events` state and never calls `fetchEvents`
   or `fetchRecentCheckIns` — there is no variable to pass. `GivingTrends` is the
   only Area E component that takes check-in data as **props**; #37, #38 and #41
   fetch their own inside a `useEffect`. Repairing the wiring means *adding a
   fetch*, not correcting an argument. Both church-admin and UXR called it a
   one-line wiring bug; it is not, and that matters because "just fix the wiring"
   is exactly the cheap-looking action that would make the fabrication live.
3. **Consequence chain, confirmed:** `calculateGivingTrends([], [])` →
   `events.find(...)` → `undefined` → guard at `givingTrends.ts:20`
   `if (!worshipEvent) return []` → `data.length === 0` →
   `GivingTrends.tsx:25-36` empty state. The **"Stripe Trends" nav item**
   (`SidebarIntelligence.tsx:180-187`) has never rendered a chart for any user of
   this build. UXR's "the empty state is accidentally the safest state" is
   correct and is upheld: **do not fix the wiring; delete the route.**

---

## 3. Settled question (a): Newsletter Architect — the veto and what it forces

**The split:** UXR KEEP (fix event ordering) · church-admin KEEP (fix
"AI-assisted" claim) · youth CUT-as-built/DEMOTE · children CUT-the-birthday-block
/ DEMOTE-until-fixed.

**Verdict: FIX, under a binding domain veto on the birthday block.**

### Why the veto is real, and its exact scope

`generateNewsletter` (`newsletter.ts:20-38`) filters `students` on
`s.birthdate` presence and a 0-7 day window **only**. There is no `isChild`
check. `isChild` exists on the type (`pco.ts:84`), is populated from PCO's
`child` attribute (`pco.ts:273`), and is *already used as a filter elsewhere in
the app* — `sorter.ts:21,117` and `family.ts:119-120`. So the gate is available,
idiomatic, and simply absent here.

Grep across all of `src/` for `guardian`, `consent`, `opt_out`, `optOut`,
`doNotPublish`: **zero hits.** This settles UXR's open question — no, PCO does
not hand Locus a "hide birthday" flag it is ignoring. Locus ingests no such
field. `isChild` is the only gate that exists today.

**[CORRECTION to children's critic, twice over]** The emitted line is
`` `- ${b.person.name} (${dateStr})` `` where `dateStr` is
`toLocaleDateString('en-US', { month: 'short', day: 'numeric' })`
(`newsletter.ts:64-65`). The payload is **full name + birth month/day. The birth
year is never printed.** "Full name + birthdate", "computed exact birthdate" and
"enough to reconstruct a child's exact age" are all overstated. Round 2 must
argue from the true payload or the veto will be dismissed as sloppy.

**The veto survives the correction.** A minor's full name paired with a calendar
birth date, emitted into a copy-to-clipboard artifact explicitly destined for
mass distribution, in a product whose data model has no opt-out concept, with the
same app advertising a Mailchimp sync one screen over (#43) — that is still below
the bar, and the bar is not mine to trade against usability.

### What the veto forces (and what it does not)

**Forces:**

1. `upcomingBirthdays` defaults to `!person.isChild`. Minors are not emitted.
2. If a ministry wants kid shout-outs, it is **opt-in, off by default,
   first-name-only, no date** — children's critic's own stated remedy, adopted
   verbatim rather than invented.
3. `src/utils/newsletter.test.ts` must be rewritten in the same commit. Its
   current assertions are the defect written down.
4. Any future integration sync (#43's latent risk, flagged by both minor critics)
   goes through the same predicate, not a second copy of the check.

**Does not force:** cutting or demoting the feature.

### Where the critics lose, and why

* **Youth's CUT loses.** The argument is "a volunteer leader can't scope output
  to their small group, can't text six kids about pizza." True, and irrelevant —
  that is a critique of a targeted-messaging tool this isn't. The tool has no
  send path at all (youth's own finding: only `navigator.clipboard.writeText`,
  `NewsletterArchitect.tsx:47-51`), which is precisely why it is *not* the
  contact-a-minor-without-a-parent vector. Cutting the one honest surface in the
  area for failing to be a different product points subtraction at the wrong
  target.
* **DEMOTE loses.** After §4's deletions, Area E has one nav item left. You
  cannot demote a screen into a container that no longer exists — and its job
  (weekly bulletin copy) is the only recurring job in the area.
* **UXR and church-admin's KEEP is upheld on the job, overruled on the ship
  gate.** Both read the birthday block and neither flagged the age problem. KEEP
  is right about what the feature is for; it is not a licence to ship the block
  as written.

---

## 4. Per-feature decisions

| # | Feature | Verdict | Rationale | Converged? |
|---|---------|---------|-----------|-----------|
| 37 | Sermon Sentiment | **CUT** | Real attendance plotted against a round-robin fake x-axis, plus an `attendance*25` "giving" line. Honest residue = attendance-by-week, which Attendance Pulse (#29) already does better. | N |
| 38 | Sermon Correlator | **CUT** | Every plotted series is arithmetic on a fabricated label; the "AI Insights" panel is static JSX restating the code's own multipliers as discoveries. No partial fix — removing any one piece collapses the other two. | N |
| 39 | Giving River | **CUT** | Zero props, zero fetch. Literal six-figure constants × a dropdown multiplier. There is no data path to repair, only a route to delete. | N |
| 40 | Stripe / Giving Trends | **CUT** (route + component + util) | Nav item has never rendered a chart; the formula underneath is `attendance*25*sin` under a real payment vendor's name. Explicitly: **do not repair the wiring.** | N |
| 41 | Newsletter Architect | **FIX** — under binding minor-safety veto | Only Area E surface doing a real weekly job entirely from real data. Birthday block publishes minors by name with no age gate, and the test suite asserts that it must. | N |
| 42a | Robert Report shell | **CUT** | Unreferenced dead code (`App.tsx:11` commented import). Ten of eleven tabs duplicate live sidebar routes. Kept green by tests, giving false confidence it ships. | N |
| 42b | Genealogy Graph | **CUT** — do not re-route | Spouse/parent/sibling edges inferred from `householdId` co-membership alone; no guardian, custody or confirmed-relationship concept exists in the data model. Both minor critics veto reconnection. | N |
| 43 | Integrations Hub | **CUT** → one static "Not Connected" card in `ConfigModal.tsx` | Four toggles that make no network call render hardcoded success text ("Syncing 423 profiles. 12 ghosts paused."). An action UI lying about an action outranks every analytics defect in this area. | N |

Net: **5 routes deleted** (`sermons`, `sermon-correlator`, `giving-river`,
`giving-trends`, `integrations`), **1 route kept and repaired** (`newsletter`),
**0 routes added.**

---

## 5. The concrete work, ordered by value-per-effort

### W1 — Newsletter minor gate (blocking; ~20 lines across 2 files)

`src/utils/newsletter.ts`
* Add to `NewsletterOptions`: `includeChildBirthdays?: boolean` (default
  `false`).
* In `generateNewsletter`, line 20-21, change
  `students.filter(s => s.birthdate)` → `students.filter(s => s.birthdate &&
  (!s.isChild || options?.includeChildBirthdays))`.
* At the emit site (line 63-66): when `b.person.isChild`, emit
  `` `- ${b.person.firstName}\n` `` — first name only, **no date**. `firstName`
  already exists on the type (`pco.ts:75`).

`src/utils/newsletter.test.ts` **(must change in the same commit)**
* Lines 13-46: flip the three mock students to `isChild: false`, or add adult
  fixtures. Add a new test asserting that with default options a student with
  `isChild: true` and a birthday tomorrow does **not** appear in the output at
  all — the regression guard that keeps this from being silently undone.

`src/components/NewsletterArchitect.tsx`
* Add a checkbox in `.newsletter-controls` (alongside the existing
  `sermonTopic` / `pastorNotes` groups, lines 69-90) bound to
  `includeChildBirthdays`, default `false`, labelled to state the payload:
  "Include children's birthdays (first name only, no date)".

### W2 — Delete `giving-trends`

* `src/App.tsx`: delete the `import { GivingTrends }` at line 34 and the route
  block at 918-922.
* `src/components/SidebarIntelligence.tsx`: delete the "Stripe Trends" button,
  lines 180-187.
* Delete `src/components/GivingTrends.tsx`, `GivingTrends.css`,
  `GivingTrends.test.tsx`, `src/utils/givingTrends.ts` (+ any test).
* **Do not** add a `fetchRecentCheckIns` call to `App.tsx` to "fix" it first.

### W3 — Delete `giving-river`

* `src/App.tsx`: import at line 33, route block at 912-916.
* `SidebarIntelligence.tsx`: "Giving River" button, lines 172-179.
* Delete `GivingRiver.tsx`, `.css`, `.test.tsx`, `src/utils/giving.ts` (+ test).

### W4 — Delete `sermon-correlator`

* `src/App.tsx`: import at line 31, route block at 901-905.
* `SidebarIntelligence.tsx`: lines 164-171.
* Delete `SermonCorrelator.tsx`, `.css`, `.test.tsx`.
* From `src/utils/sermons.ts` delete `correlateSermonsWithEngagement` and
  `SermonEngagementData` (lines 103-148).

### W5 — Delete `sermons`

* `src/App.tsx`: import at line 30, route block at 896-900.
* `SidebarIntelligence.tsx`: lines 156-163.
* Delete `SermonSentiment.tsx`, `.css`, `.test.tsx`, and — after W4 — the whole
  of `src/utils/sermons.ts` including `SERMON_TOPICS`, plus `sermons.test.ts`.
* Check `GENERATIONS` (`src/utils/demographics.ts`) has other consumers before
  assuming it is orphaned — Area D (#33) uses it; leave it.

### W6 — Delete `integrations`, replace with an honest card

* `src/App.tsx`: import at line 68, route block at 938-942.
* `src/components/SidebarCore.tsx`: "Integrations" button, lines 90-96. Check
  whether the `System` section header at line 88 is left with only `settings`
  under it — if so it still reads fine, keep it.
* Delete `IntegrationsHub.tsx`, `.css`, `.test.tsx`.
* In `src/components/ConfigModal.tsx`, add a read-only "Not Connected" block:
  static text listing Giving, Mailchimp, Zoom, Eventbrite, Typeform as
  unavailable. **No toggle, no status string, no count.** Leave
  `AppConfig.integrations` in `src/utils/storage.ts` alone for now — it is
  inert once nothing writes it, and removing it is a migration question, not a
  cleanup.

### W7 — Newsletter honesty pass (~10 lines)

* `newsletter.ts:17`: replace `events.slice(0, 5)` with an actual date filter
  and sort — events whose start falls in the next 7 days, ascending — matching
  the comment at line 15-16 that currently describes behaviour the code does not
  have. Verify what date field `PcoEvent.attributes` actually carries first; if
  it carries none, the honest fix is to change the *heading* from "Upcoming
  Events" to "Events" and say the list is unordered, not to fake a window.
* `NewsletterArchitect.tsx:65`: delete **"AI-assisted"** — there is no model
  call in this component or in `newsletter.ts`. Replace "student birthdays" with
  "birthdays"; the "student" wording is what makes the age problem invisible to
  the person clicking Copy.

### W8 — Delete the Robert Report shell

* Delete `RobertReport.tsx`, `RobertReport.css`, `RobertReport.test.tsx`.
* `src/App.tsx:11`: delete the commented-out import line.
* `src/App.ghost.integration.test.tsx:60-61` and
  `src/App.undo.integration.test.tsx:64`: delete the now-dangling
  `vi.mock('./components/RobertReport', ...)` calls.

### W9 — Delete Genealogy (lowest effort, contested — see Q4)

* Delete `GenealogyGraph.tsx`, `GenealogyGraph.test.tsx`,
  `src/utils/genealogy.ts` (+ test). Must follow W8; it has no other importer.

### Declined

* UXR's newsletter draft **persistence** (localStorage for `pastorNotes` /
  `sermonTopic`). Real annoyance, wrong round — it is polish on a feature whose
  ship gate is not yet cleared. Revisit after W1.
* Any "Sample data" badge on #37-#40. A badge is what you add when the screen
  earns its slot and one series is estimated. None of these four do. Badging a
  fixture is a licence to keep it.

---

## 6. Unresolved disagreement — questions Round 2 must settle

**Q1 — Where exactly is the minor-birthday line?**
Children's critic proposes first-name-only opt-in as an acceptable floor; youth
demands explicit audience scoping ("who receives this, confirmed") which is
unimplementable — the tool has no recipient concept and no send path. W1 adopts
the children's floor. Does the youth critic accept first-name-only-opt-in, or
does the absence of an audience model mean *no* minor identifier may be emitted
under any option? A binary answer, please — W1's checkbox exists or it doesn't.

**Q2 — Is a user-entered sermon-topic log worth building, and does it revive #37?**
UXR: "no version earns its slot without a real sermon-topic source." Church-admin:
"even a manually-entered log per Sunday" would. **The honest input already
exists** — `NewsletterArchitect.tsx:71-79` is a free-text "Sermon Topic" field
the user types, thrown away on tab close. If that were persisted per week, #37's
x-axis becomes real for the first time. Is that worth it, or does the topic
belong as a **label on Attendance Pulse (#29)** — an annotation, not a screen?
I am inclined to the latter and did not build it into §5; argue me out of it.

**Q3 — Is `firstTimeGiver` / `firstGiftDate` real? (cross-area, needs an owner)**
`Student` carries `firstTimeGiver: boolean` and `firstGiftDate: string | null`
(`pco.ts:95-96`, populated at `:284-285` from a `first_time_giver` /
`first_gift_date` person attribute). These are **not standard PCO People
attributes** and are populated in this repo only by `mock-api/data.js:103-107`.
This is the *only* giving-adjacent signal in Locus, and **Area C's Automations
(#28) "first-time giver" rule depends on it.** Is it a real church-configurable
PCO custom field, or fixture-only? If fixture-only, "Locus has no giving data"
stops being an Area E finding and becomes a live defect in Area C. Area E cannot
settle this; it needs routing to the pastoral-ops critics.

**Q4 — Does PCO expose confirmed household *roles*, and does that reopen Genealogy?**
UXR and church-admin both floated giving Genealogy its own route; both minor
critics veto the inference model (co-residence ⇒ marriage, ⇒ parentage, ⇒
siblinghood; no custody, no cross-household child). I ruled CUT (W9). But the
veto is against *inference*, not against the visualization. If PCO's household
membership resource carries a relationship role Locus does not currently fetch,
the correct verdict is REBUILD-on-real-roles rather than CUT, and W9 should not
run. Round 2 must check what `src/utils/pco.ts` could fetch and does not, and say
which. Until that answer exists, W9 stays last in the order for a reason.

---

## 7. New ideas earned this round (3 max; each names what it replaces)

**N1 — `src/utils/publishing.ts` → `isPublishable(person, opts)`**
A single predicate governing whether a person's identity may be emitted into any
artifact that leaves the app. Today the only rule it encodes is `!isChild`
(plus the opt-in carve-out); when a consent field ever exists it goes here and
every caller inherits it.
*Replaces:* the four independent "add an `isChild` check here" patches the
critics asked for across #41 and #43, and the latent #43 minor-sync hole both
minor critics flagged. *Job left unserved:* both minor critics found the same
missing gate in two places independently — the gate needs one home, not two
copies. Adds no screen.

**N2 — Bulletin Block: rescope #41 around the paste target**
Keep the `newsletter` route; add a second copy button that emits
Mailchimp-friendly HTML alongside the markdown, and label the destination
explicitly on the button.
*Replaces:* #43's fake Mailchimp card. Church-admin named this exact trade —
"worth a literal 'copy to Mailchimp' affordance instead of the fake Mailchimp
toggle in #43." *Job left unserved:* the actual endpoint for this markdown is an
email tool; today the app pretends to integrate with one and doesn't help you
paste into it. Adds no route; deletes one (`integrations`).

**N3 — "Not Connected" as a first-class, boring state in `ConfigModal.tsx`**
A static list — Giving, Mailchimp, Zoom, Eventbrite, Typeform — each marked not
connected, with no toggle and no status string. If demand-gauging is wanted, a
"Request this integration" control that logs interest and says so; never a
quantified status for an action that did not occur.
*Replaces:* the `integrations` route (`IntegrationsHub.tsx`) outright, and gives
`GivingRiver` / `GivingTrends` an honest place to have never existed. *Job left
unserved:* every critic asked the same question of every screen in this area —
"is this real?" — and had to read source to answer. Three routes collapse to one
card in a screen that already exists. Net −2 routes against a zero-route add.
