# Area E — Content, Giving and Communications (features #37–#43)

**Final report.** Five rounds, four domain critics (UX researcher, church
operations director, youth ministry director, children's ministry director) plus
synthesis. All verdicts converged; there are no open questions.

---

## Verdict

Seven surfaces were reviewed and **six should be deleted outright.** Five of the
six presented invented numbers as findings: Sermon Sentiment plots a giving
series computed as `attendance * 25` against sermon topics assigned by
`SERMON_TOPICS[index % 8]`; Sermon Correlator does arithmetic on those same
fabricated labels and prints the result back as "AI Insights"; Giving River drew
a six-figure Sankey from hardcoded constants and made no network request at all;
Giving Trends was branded Stripe, a vendor Locus does not integrate with, and had
never rendered anything because `App.tsx` passed it two empty arrays; the
Integrations Hub offered four toggles that make no call and render hardcoded
success text when switched on. The sixth, the Robert Report shell, was
already-dead code whose eleven tabs duplicated live routes and which was kept
looking healthy by a passing test suite. Locus has no Giving API access and no
model call anywhere in `src/`; every giving figure and every "AI" label in this
area was a literal or a formula. **One surface survives** — the Newsletter
Architect, renamed *Weekly Update Draft* — because it does a real recurring job
(a five-minute weekly time save), invents no numbers, and sends nothing anywhere.
It carried one blocking safeguarding defect, now fixed: it published minors'
names and birthdays into a broadcast artifact. The area's grouping name, "content
/ giving / comms", corresponds to nothing in the code and dissolves.

---

## Per-feature decisions

| # | Feature | Verdict | Rationale | Rounds converged |
|---|---|---|---|---|
| 37 | Sermon Sentiment | **CUT** | X-axis topics are `SERMON_TOPICS[i % 8]` — assigned by position, not by what was preached. The "Overlay Giving Volume" series is `attendance * 25`, multiplied by 2.5 when the topic string contains "generous". The one honest signal (attendance over time) already exists on Attendance Pulse. | 5 |
| 38 | Sermon Correlator | **CUT** | Every series is arithmetic on the same fabricated topic label. The "AI Insights" panel restates the code's own multipliers back to the reader as discovered findings. No model is called. | 5 |
| 39 | Giving River | **CUT** | `React.FC<{}>` — took no props, made no request. Six-figure fund-flow literals scaled by a dropdown multiplier. Locus has no Giving API access. | 5 |
| 40 | Stripe / Giving Trends | **CUT** (route + component + util) | Giving volume = `attendance * 25` × a sine wave, with the author's own comment "to look natural", under a Stripe header. Passed `[]`/`[]` by `App.tsx`, so it had never rendered. **Repairing the wiring would have shipped the worst screen in the area.** | 5 |
| 41 | Newsletter Architect → *Weekly Update Draft* | **FIX / SIMPLIFY** | The only surface here doing a real job. Passes the "would we open it?" and "does it invent numbers?" gates. Priced by the operations critic as worth one nav slot. | 5 |
| 42a | Robert Report shell | **CUT** | Dead code — its import in `App.tsx` was commented out. Ten of eleven tabs duplicated live routes. Its passing test suite implied it shipped. | 5 |
| 42b | Genealogy Graph | **CUT** — do not re-route | Edges are inferred from `householdId` co-membership alone. No role or relationship field exists in the data to fetch. Every line it drew was a guess drawn as a fact. | 5 |
| 43 | Integrations Hub | **CUT** → one static line in `ConfigModal.tsx` | Four toggles that make no network call and render "✅ Connected" text from a local boolean. | 5 |
| — | "Area E" as a grouping | **DISSOLVE** | Zero code corresponds to it. The features live under two unrelated sidebar sections. | 4 |

**Net: five routes deleted, one kept and renamed, none added.**

---

## Already shipped

These are committed with the full suite green. Do not re-do or re-open them.

- **Adults-only newsletter birthdays** (was blocking). A shared predicate
  `isMinor` in `src/utils/pco.ts` — child flag **OR** age < 18 **OR** age > 110 —
  consumed by `src/utils/newsletter.ts`. The upper bound catches placeholder
  birthdates like `1900-01-01`, which are valid dates that compute an implausible
  adult age. `src/utils/newsletter.test.ts` asserts exclusion for all three: a
  flagged child, an unflagged 13-year-old, and a sentinel birthdate. The prior
  suite had asserted those names **must** appear, i.e. it encoded the leak.
- **Screen copy corrected.** `src/components/NewsletterArchitect.tsx` heads
  *"Weekly Update Draft"*; the blurb no longer claims "AI-assisted", "calendar
  events" or "student birthdays", and now states that nothing is sent anywhere.
- **Small group sorter refuses rather than filters.**
  `src/components/SmallGroupSorter.tsx` names the count of under-18s in the
  roster and produces nothing until it is narrowed. `src/utils/sorter.ts` uses
  `isMinor`. Previously it gated adult small-group placement on the child flag
  alone, so an unflagged 14-year-old was algorithmically routed into an adult
  small group.
- **Volunteer recruitment uses `isMinor`** (`src/utils/recruitment.ts`). Its
  candidate list is handed to a staff member as "people to ask about serving";
  previously an unflagged teenager could land on it.
- **Giving River and Giving Trends deleted** — components, CSS, tests,
  `src/utils/giving.ts`, `src/utils/givingTrends.ts`, routes and nav entries.
- **Component tests no longer mock the whole `pco` module.** Wholesale mocking
  would replace `isMinor` with `undefined` and keep the suite green through a
  regression of the minor guarantee.

---

## Remaining work

Ordered by value per unit of effort. Locators are anchored on symbols; some line
numbers are moving under concurrent edits.

**1. Cut the newsletter events block** (highest value; the last defect on the
surviving screen). In `src/utils/newsletter.ts`: delete the `events` parameter,
`upcomingEvents`, the `## 📅 Upcoming Events` block including the empty state
*"No major events scheduled for this week."*, and the `PcoEvent` import. Emit
`## Announcements\n\n_[paste this week's announcements here]_` in its place.
Leave a comment naming why it cannot be repaired: Check-Ins **Events** are
recurring definitions with **no date field**; occurrence dates live in
`event_times`/`event_periods`, which nothing in `src/` or `mock-api/` fetches.
Against a real tenant the section is always empty, so the empty state is a false
statement of fact in the default case. In
`src/components/NewsletterArchitect.tsx`: delete the `fetchEvents` import, the
`events`/`loading`/`error` state, the `useEffect`, and both early returns — the
component then renders synchronously. In `src/utils/newsletter.test.ts`: delete
`mockEvents`, the two event assertions, and update the empty case, which asserts
the deleted string. **Do not touch `PcoEvent`/`fetchEvents` in `pco.ts`** —
seven live screens and six utils consume them. While here, rename the nav label
in `src/components/SidebarIntelligence.tsx` from *"Newsletter Architect"* to
match the screen heading.

**2. Delete `sermon-correlator`.** `src/App.tsx` (import + the
`currentView === 'sermon-correlator'` branch); the nav button in
`src/components/SidebarIntelligence.tsx`;
`src/components/SermonCorrelator.{tsx,css,test.tsx}`; and from
`src/utils/sermons.ts` the `correlateSermonsWithEngagement` function and the
`SermonEngagementData` interface.

**3. Delete `sermons`.** `src/App.tsx` (import + the `currentView === 'sermons'`
branch); the nav button in `src/components/SidebarIntelligence.tsx`;
`src/components/SermonSentiment.{tsx,css,test.tsx}`; then, after item 2, all of
`src/utils/sermons.ts` including `SERMON_TOPICS`, plus `src/utils/sermons.test.ts`.
This is the item that removes the last fabricated giving number in the codebase
(`givingVolume = attendance * 25`), not merely a sermon chart — do not leave it
for last. **Leave `GENERATIONS` in `src/utils/demographics.ts` alone** — Area D
(#33) consumes it.

**4. Delete `integrations`.** `src/App.tsx` (import + the
`currentView === 'integrations'` branch); the nav button in
`src/components/SidebarCore.tsx`;
`src/components/IntegrationsHub.{tsx,css,test.tsx}`. Add one read-only line to
`src/components/ConfigModal.tsx`: *"Integrations: not available in this
version."* No toggle, no status indicator, no "request this integration"
control. Leave `AppConfig.integrations` in `src/utils/storage.ts` inert.

**5. Delete the Robert Report shell and Genealogy.**
`src/components/RobertReport.{tsx,css,test.tsx}`;
`src/components/GenealogyGraph.{tsx,test.tsx}`; `src/utils/genealogy.ts` and its
test; the commented-out `RobertReport` import in `src/App.tsx`; and the dangling
`vi.mock` calls in `src/App.ghost.integration.test.tsx` and
`src/App.undo.integration.test.tsx`. *Note: `genealogy.ts` contains a third
bare-flag parent/child split — deleting the file resolves it. Do not "repair" it
first.* **At the time of writing these deletions are already staged in the
working tree by a concurrent relational-tools pass**; check before duplicating
the work.

**6. Newsletter draft persistence** (the only optional item). `src/utils/storage.ts`
gains `saveNewsletterDraft`/`loadNewsletterDraft` on the **existing
encrypted-per-`appId` pattern** — a plaintext `localStorage` write would be the
only unencrypted helper in that file, and `pastorNotes` is free text an operator
may type pastoral detail into. `NewsletterArchitect` gains an `appId` prop; load
on mount, debounce-save `{ sermonTopic, pastorNotes }`. **Stated limit:** no
predicate gates a name typed by hand into free text, and persistence adds no
publishing risk because the draft never leaves the browser. This does not extend
the minor guarantee over `pastorNotes`.

---

## The general rule this area produced

Applies across the codebase, not just here. There are **two categories of
`isChild` read and they must not share an implementation.**

- **Treatment reads — "may this person be treated as an adult?"** Broadcast
  inclusion, adult small-group placement, volunteer recruitment. Uncertainty must
  resolve to *minor*, because the costs are not symmetrical: leaving an adult off
  an adults-only list is a missing row, and putting a child on it is a
  safeguarding failure. **Use `isMinor`.** The flag is PCO's manually-maintained
  `child` attribute — not derived, wrong in both directions, and never revisited.
  Current sites: `newsletter.ts`, `sorter.ts`, `recruitment.ts`,
  `SmallGroupSorter.tsx`.
- **Claim reads — "what does this record claim, and does it agree with itself?"**
  The family audit and the flag-drift automations. These must read the raw flag
  and the raw age **separately, precisely so the two can disagree.** **Do not use
  `isMinor`.** Current sites, all correct as they stand: `family.ts`;
  `automations.ts` (`age === 18 && isChild` and `age === 0 && isChild` are
  literally disagreement detectors).

The boundary was found the hard way. Applying `isMinor` inside `family.ts` turned
an existing test red, because `family.test.ts` constructs a ten-year-old declared
a non-child "Dad" — exactly the disagreement `analyzeFamilies` exists to detect.
Folding the two fields together in a detector deletes the detector's own input.
The rule is documented in the `isMinor` doc comment in `src/utils/pco.ts` so the
next reader does not "finish the job" by propagating the predicate everywhere.

---

## Handed off to other areas

- **`firstTimeGiver`/`firstGiftDate` is fixture-only, and a live screen acts on
  it.** Owner: whoever holds Automations (#28). Detail in the next section.
- **Birthdate plausibility as app-wide hygiene.** Owner: Area A. `pco.ts` has
  anomaly detectors for email, phone and address and **none for birthdate**.
  `isMinor`'s `age > 110` bound closes the placeholder case at four call sites
  only; the general fix is a `detectBirthdateAnomaly` alongside the existing
  detectors, failing closed.
- **A declared-parent-under-18 detector.** Owner: whoever holds household/family
  logic. Nothing in `analyzeFamilies` sanity-checks a declared parent's age on
  its own, so a 10-year-old "parent" produces no anomaly unless paired with an
  older child — and can still become the household `familyName` source or a
  `checkSpouseGap` candidate. This is a **new detector**, not an application of
  `isMinor`.
- **Test-mocking hygiene.** Owner: whoever holds test hygiene. Any `vi.mock` of
  a module that also exports a safety predicate should use `importOriginal`.
  Whole-module mocking is the exact mechanism by which this repo has already
  been shown to certify a minor-safety defect green. Worth one grep.
- **Standing instruction, earned here and applicable everywhere:** no reviewer
  may accept "the tests pass" without reading what the tests assert. Three
  separate defects in this area were held in place by green suites that had been
  written from the same wrong assumption as the code.

---

## What we could not settle

- **Does anyone paste the newsletter draft anywhere?** The whole case for keeping
  the one surviving screen rests on an unobserved claim — that a five-minute
  weekly time save is real. One week of watching one admin would settle it, and
  no such observation exists. If the answer is no, the correct verdict for #41
  is CUT and this area deletes to zero.
- **`firstTimeGiver` is fixture-only and nobody has claimed it.** It is the
  oldest unowned item in the audit and it was not resolvable from inside this
  area. The facts: `first_time_giver`/`first_gift_date` are read off PCO People
  `attributes` in `pco.ts` and mapped onto `Student`. Nothing populates them but
  `mock-api/data.js`, which sets them randomly on 10% of adults. They are not
  documented PCO People attributes, Locus requests only
  `include=emails,phone_numbers,addresses,households`, and there is no Giving API
  call anywhere in the codebase. Against a real tenant they arrive `undefined`,
  `!!undefined` is `false`, and `getFirstTimeGivers` in `automations.ts` returns
  an empty array **every time**. The Automations screen then renders *"No new
  first time givers this week."* — a false negative stated as a positive fact,
  with no error and no empty-data signal — and contributes 0 to its "Pending
  Actions" count, which in the demo is non-zero. **The likely correct action is
  to delete the lane, the two `Student` fields and `getFirstTimeGivers`**, not to
  wire it up: PCO Giving is a separate product behind a separate and
  more-restricted OAuth scope that Locus does not request, and giving data is the
  single most access-controlled category in a church database. That call belongs
  to the Automations owner, not to us.
- **Sermon-topic annotation on Attendance Pulse was declined, not refuted.** The
  idea — mark the attendance series with what was preached — is reasonable and
  was declined on three grounds: it is a build in a subtraction pass, it deletes
  nothing, and with n=1 per topic and no control it is a memory aid rather than
  an answer. One of our earlier objections was **wrong and is withdrawn**: we
  claimed the join key would not survive, and it does — `WeeklyAttendance.date`
  *is* the week key and is already used for sorting. Whoever picks this up in
  Area D should know no type change is needed. Two conditions carry: it must
  disclose that its attendance series folds children's check-ins into a
  congregation-wide number, and it needs real sermon topics, which only accrue
  once the draft screen persists `sermonTopic` (remaining work item 6).
- **Minors' birthdays in the newsletter remain excluded with no path back in.**
  An admin-owned "include minors" checkbox was vetoed twice and the veto stands,
  but the reasoning is worth stating rather than leaving as a refusal: such a
  flag solves *access control*, not *consent*. A single boolean meaning "include
  all minors" still publishes every student's name into an artifact that leaves
  the app, with no per-family opt-in. Doing this properly needs per-student or
  per-guardian consent tracking, which no part of Locus models. Nothing in the
  code currently holds a place for it, and nothing should until that exists.
- **The regression guards behind the minor predicate are thinner than the
  predicate.** `isMinor` has no unit test of its own. Of its four call sites only
  the newsletter's is protected by fixtures that would fail if the predicate were
  reverted to the bare child flag: `recruitment.test.ts` and `sorter.test.ts`
  build every child fixture as flagged **and** at a plausible child age, and the
  sorter's new refusal path has no test at all. The code is correct; the tests
  would not notice if it stopped being correct. This is one fixture per file and
  belongs with the test-hygiene handoff above.
