# Area E — content-giving-comms — Proposal v2 (after Round 2)

Synthesis of `r2-uxr.md`, `r2-church-admin.md`, `r2-youth.md`, `r2-children.md`
against `proposal-v1.md`. Every claim below re-verified against source for this
synthesis; new verifications are marked **[VERIFIED]**.

---

## 1. Changes since last round

**Two of my v1 positions are dead. I am not defending either.**

* **W1's opt-in checkbox is withdrawn.** Both minor-safety specialists
  independently ruled against it, from different directions that reinforce
  rather than cancel: youth (`r2-youth.md §2`) — a single boolean applied to
  every minor at once is a light switch, not consent; children's
  (`r2-children.md §2`) — the switch sits behind **no access control at all**.
  I verified the access-control claim myself: `LandingPage.tsx:8-35` is two
  `<button>`s calling `onSelectRole` straight from `onClick`, with no
  permission check, no role-from-server, no gate of any kind; and
  `SidebarIntelligence.tsx:44-50` puts Newsletter Architect in the
  Intelligence list, which anyone holding valid PCO Basic-auth credentials
  reaches by clicking the second button at login. **[VERIFIED]** Youth's second
  leg also holds: `automations.ts:114-115` filters `s.age === 18 && s.isChild`
  with the comment *"Flag 18 year olds who are still marked as children"* — the
  codebase documents its own gate as going stale. A converged domain veto on
  the mechanism. **Adopted: unconditional `!isChild`, no UI toggle, no
  `includeChildBirthdays` option.** See W1.

* **N2 (Mailchimp/Bulletin export) is dropped, not re-scoped.** UXR did not
  defend it; children's (`§3`) and youth (`§5`) both rejected it as reopening
  the third-party durable-record risk W6 exists to close. They are right, and
  my own v1 §3 used "the same app advertising a Mailchimp sync one screen over"
  as an *argument for* the veto before §7 built a Mailchimp exporter into the
  surviving screen. That is incoherent and it was mine. Dropped.

**One thing nobody had checked, now checked, and it blocks the ship.**

* **[VERIFIED] The newsletter's "Upcoming Events" section is fabricated in
  exactly the sense #37–#40 were.** `PcoEvent` (`pco.ts:101-108`) carries
  `{ name, frequency? }` and **no date field of any kind**. `fetchEvents`
  (`pco.ts:492-505`) hits `/api/check-ins/v2/events` — PCO Check-Ins **event
  definitions**, i.e. the list of things people can be checked into, not dated
  occurrences. The mock confirms the shape: all five entries are
  `frequency: 'weekly'` standing definitions including *"Greeter Team"* and
  *"Kids Ministry Team"* (`mock-api/data.js:214-239`). `newsletter.ts:17` is
  `events.slice(0, 5)` under a comment claiming "next 7 days"
  (`newsletter.ts:15`) and a heading reading `## 📅 Upcoming Events`
  (`:51`). There is no date to sort on because the resource has none.
  **[VERIFIED, new — nobody caught this]** the *empty* state is a false claim
  too: `newsletter.ts:57` emits *"No major events scheduled for this week"*
  from a query that never asked about this week. And
  **[VERIFIED]** `event_times` / `event_periods` — the PCO Check-Ins resources
  that do carry occurrence dates — appear **nowhere** in `src/` or `mock-api/`.
  Locus has never fetched a dated event.

* **Q4 is closed, twice over, independently.** `PEOPLE_INCLUDES`
  (`pco.ts:444`) is `'emails,phone_numbers,addresses,households'`; households
  are parsed for `household_id` only (`pco.ts:193-222,274`). **[VERIFIED]**
  There is no per-member relationship role to fetch. W9 runs.

**Converged this round:** every CUT verdict (#37, #38, #39, #40, #42a, #42b,
#43) is now unopposed by all four critics for two consecutive rounds. Only #41
still carries live disagreement, and it has narrowed to implementation detail.

---

## 2. Per-feature decisions

| # | Feature | Verdict | Rationale | Converged? |
|---|---------|---------|-----------|-----------|
| 37 | Sermon Sentiment | **CUT** | X-axis is `SERMON_TOPICS[i % 8]`; right axis is `attendance * 25`. Honest residue (weekly attendance) is a strict subset of what `AttendancePulse.tsx:27-28` already renders live from the same fetch. | **Y** |
| 38 | Sermon Correlator | **CUT** | Every plotted series is arithmetic on a fabricated label; the "AI Insights" panel is static JSX restating the code's own multipliers as findings. | **Y** |
| 39 | Giving River | **CUT** | `React.FC<{}>` — zero props, zero fetch. Six-figure literals × a dropdown multiplier. No data path to repair. | **Y** |
| 40 | Stripe / Giving Trends | **CUT** (route + component + util) | Passed `[]`/`[]` at `App.tsx:918-922`; the nav item has never rendered a chart. Underlying formula is `attendance*25*sin` under a payment vendor's name. **Do not repair the wiring.** | **Y** |
| 41 | Newsletter Architect | **FIX** — two blocking gates, both now binding | Only Area E surface doing a real recurring job. Gate 1: publishes minors by name (veto). Gate 2: "Upcoming Events" is an undated check-in-definition list (new, §1). | N — mechanism contested, verdict agreed |
| 42a | Robert Report shell | **CUT** | Dead code (`App.tsx:11` commented import); ten of eleven tabs duplicate live routes; kept green by tests that imply it ships. | **Y** |
| 42b | Genealogy Graph | **CUT** — do not re-route | Spouse/parent/sibling edges inferred from `householdId` co-membership alone. Q4 now answered from source: no role exists to fetch. | **Y** |
| 43 | Integrations Hub | **CUT** → one static line in `ConfigModal.tsx` | Four toggles that make no network call render hardcoded success text ("Syncing 423 profiles"). An action UI lying about an action outranks every analytics defect here. | **Y** |
| — | "Area E" as a grouping | **DISSOLVE** | Admin's ruling, adopted. See §3 note — it costs zero code, because the nav section it describes does not exist. | **Y** |

Net: **5 routes deleted**, **1 route kept and repaired**, **0 routes added**,
**0 new screens**.

---

## 3. The concrete work, ordered by value-per-effort

### W1 — Newsletter minor gate (BLOCKING; ~8 lines + test rewrite)

Supersedes v1's W1 entirely. No option, no checkbox, no prop.

`src/utils/newsletter.ts`
* Line 20-21: `students.filter(s => s.birthdate)` →
  `students.filter(s => s.birthdate && !s.isChild)`.
* Do **not** add `includeChildBirthdays` to `NewsletterOptions` (`:4-7`).
* Emit site (`:63-66`) is unchanged — no first-name branch, because no minor
  reaches it.

`src/utils/newsletter.test.ts` — **must change in the same commit.**
* `:13-46` — all three of Alice/Bob/Charlie are `isChild: true`; `:62-63`
  assert `'Charlie (Mar 24)'` and `'Alice (Mar 26)'` appear. `:83-93`
  `Leapling` is `isChild: true` and `:96` asserts it appears. Four assertions
  currently *require* the defect. Flip the fixtures to `isChild: false`.
* Add the regression guard: a student with `isChild: true` and a birthday
  tomorrow produces `*No birthdays in the next 7 days.*`.

`src/components/NewsletterArchitect.tsx`
* No checkbox. **Delete nothing, add nothing** in `.newsletter-controls`
  (`:69-90`).
* `:65` — delete **"AI-assisted"** (no model call exists in this component or
  in `newsletter.ts`), and replace "student birthdays" with "birthdays"; the
  "student" wording is what made the age problem invisible to the person
  clicking Copy.

**If minors' birthdays are ever wanted**, it is an admin-owned flag on
`AppConfig` (`storage.ts:12`) set once through `ConfigModal.tsx` — children's
critic's stated floor — read by `isPublishable` (N1), never a run-time control
on the newsletter screen. Not in scope for this commit; recorded so the next
implementer does not re-derive the checkbox.

### W2 — Newsletter events block (BLOCKING; ruling on the second gate)

**Ruled: CUT the events section outright.** Church-admin offered (a) cut to
nothing or (b) relabel to "Standing Ministries"; UXR proposed relabel +
un-slice. I pick the cut, and (b) loses for a concrete reason: relabelling
leaves an accurate heading over a useless list — a congregational bulletin does
not want *"Greeter Team"* and *"Kids Ministry Team"* under any heading — **and
it leaves `fetchEvents` wired into the component, which is precisely the hook a
future agent "fixing upcoming events" would reach for.** Removing the fetch
removes the affordance to fake it.

`src/utils/newsletter.ts`
* Delete the `events: PcoEvent[]` parameter (`:10`), `upcomingEvents` (`:17`),
  the whole events block (`:51-59`) including the false empty-state string at
  `:57`, and the now-unused `PcoEvent` import (`:2`).
* In its place emit a static scaffold — `## Announcements\n\n_[paste this
  week's announcements here]_\n\n` — which preserves the paste-target job
  church-admin described without asserting anything.
* Add a one-line comment above the birthdays block: Check-Ins **Events** are
  recurring definitions with no date; occurrence dates live in
  `event_times`/`event_periods`, which Locus does not fetch. This is the
  comment that stops someone re-adding a fake date filter.

`src/components/NewsletterArchitect.tsx`
* Delete the `fetchEvents` import (`:2`), the `events` state (`:13`), the
  entire `useEffect` (`:21-38`), the `loading`/`error` state (`:14-15`) and
  both early returns (`:53-59`). With no fetch, the component has nothing to
  load — it renders synchronously from `students` and two text inputs.
* `generatedMarkdown` (`:40-45`) drops its `events` argument and its `events`
  dependency.

`src/utils/newsletter.test.ts`
* Delete `mockEvents` (`:49-52`) and the two event assertions (`:60-61`);
  update the empty-case test (`:67-72`) which asserts the deleted string.

Net effect: the newsletter renders **only** real, operator-entered or
PCO-measured content — adult birthdays from real `birthdate`, plus two fields
the user typed themselves.

### W3 — Delete `giving-trends`
* `src/App.tsx`: import at `:34`, route block at `:918-922`.
* `SidebarIntelligence.tsx:180-187` ("Stripe Trends").
* Delete `GivingTrends.tsx`, `.css`, `.test.tsx`, `src/utils/givingTrends.ts`
  (+ test). **Do not** add a `fetchRecentCheckIns` call to `App.tsx` first.

### W4 — Delete `giving-river`
* `src/App.tsx`: import at `:33`, route block at `:912-916`.
* `SidebarIntelligence.tsx:172-179`.
* Delete `GivingRiver.tsx`, `.css`, `.test.tsx`, `src/utils/giving.ts` (+ test).

### W5 — Delete `sermon-correlator`
* `src/App.tsx`: import at `:31`, route block at `:901-905`.
* `SidebarIntelligence.tsx:164-171`.
* Delete `SermonCorrelator.tsx`, `.css`, `.test.tsx`; from
  `src/utils/sermons.ts` delete `correlateSermonsWithEngagement` and
  `SermonEngagementData` (`:103-148`).

### W6 — Delete `sermons`
* `src/App.tsx`: import at `:30`, route block at `:896-900`.
* `SidebarIntelligence.tsx:156-163`.
* Delete `SermonSentiment.tsx`, `.css`, `.test.tsx`, and — after W5 — all of
  `src/utils/sermons.ts` incl. `SERMON_TOPICS`, plus `sermons.test.ts`.
* Leave `GENERATIONS` (`src/utils/demographics.ts`) alone — Area D (#33)
  consumes it.

### W7 — Delete `integrations`, replace with one static line
* `src/App.tsx`: import at `:68`, route block at `:938-942`.
* `src/components/SidebarCore.tsx:90-96`.
* Delete `IntegrationsHub.tsx`, `.css`, `.test.tsx`.
* `ConfigModal.tsx`: add one read-only line — *"Integrations: not available in
  this version."* **No toggle, no status string, no count, and — per admin's
  §4 objection, adopted — no "Request this integration" control.** v1's N3
  invented a lead-capture widget nobody asked for; that was scope creep on a
  cut and is withdrawn.
* Leave `AppConfig.integrations` (`storage.ts:5-12`) in place — inert once
  nothing writes it; removing it is a migration question, not a cleanup.

### W8 — Delete the Robert Report shell
* Delete `RobertReport.tsx`, `.css`, `.test.tsx`; `src/App.tsx:11` commented
  import; the dangling `vi.mock('./components/RobertReport', ...)` at
  `App.ghost.integration.test.tsx:60-61` and `App.undo.integration.test.tsx:64`.

### W9 — Delete Genealogy (**no longer contested — run it**)
* Delete `GenealogyGraph.tsx`, `GenealogyGraph.test.tsx`,
  `src/utils/genealogy.ts` (+ test). Follows W8; no other importer.

### W10 — Newsletter draft persistence (**accepted; v1's deferral was wrong**)

UXR is right that I declined this on scheduling, not merits. Accepted, with the
cost stated honestly because it is larger than "localStorage, same pattern as
gamification":

* `src/utils/storage.ts` — add `saveNewsletterDraft` / `loadNewsletterDraft`
  following the existing encrypted-per-`appId` pattern (`:54-92`). Every
  storage helper in this file takes `appId` and encrypts; a plaintext
  `localStorage.setItem` would be the odd one out, and `pastorNotes` is free
  text a user may type pastoral detail into.
* `src/components/NewsletterArchitect.tsx` — needs a new `appId` prop threaded
  from `App.tsx:991` (current props are `students`, `auth` only). Load on
  mount, debounce-save `{ sermonTopic, pastorNotes }` on change.
* **Stated limit:** `pastorNotes` is unstructured free text. N1's
  `isPublishable` gates *derived* identity fields; it cannot gate a name the
  operator types by hand. Persisting the draft does not create a publishing
  risk (it never leaves the browser), but nobody should read W10 as extending
  the minor gate over free text. It does not.

### Declined, with reasons (not deferrals)

* **Q2 — the sermon-topic annotation on Attendance Pulse. DECLINED as an Area E
  build.** UXR asked for a decision rather than a carry-forward; here it is, and
  UXR loses on three counts. (i) It is a *build* in a pass whose entire thesis
  is subtraction, and it deletes nothing. (ii) "Cost is smaller than W7" is not
  true: **[VERIFIED]** `aggregateCheckInsByWeek` computes an ISO week key
  (`attendance.ts:17`) and then **throws it away**, returning
  `week: format(date, 'MMM d')` (`:25`) — so the join key UXR's design needs
  does not survive into `WeeklyAttendance`; that is a type change in Area D,
  plus a new encrypted store, plus an `appId` prop on `AttendancePulse`
  (currently `auth`-only, `App.tsx:852`). (iii) Cold start: a per-week topic log
  shows nothing until the operator has used Newsletter Architect weekly for two
  months, and even then n=1 per topic with no control answers "did the sermon
  move attendance" only as a *memory aid* — which is a legitimate small job, but
  it is Area D's screen, Area D's owner, and Area D's round. **What I do concede
  to UXR costs nothing:** W10 persists `sermonTopic` as a side effect. If Area D
  wants the annotation later, the input data is already accumulating. Routed to
  Area D as a note, not built here.
  *Condition attached, from children's §4:* if any sermon-topic surface is ever
  revived, it must disclose that its attendance series folds children's
  check-ins into a congregation-wide number.
* **Any "Sample data" badge on #37-#40.** A badge is for a screen that earns its
  slot with one estimated series. None of these four do. Badging a fixture is a
  licence to keep it.

---

## 4. Note on dissolving "Area E" (admin's ruling — adopted, premise corrected)

Adopted in substance: one surviving weekly-use screen does not justify a
standing category. **Correction to the premise, which costs the implementer
nothing to know:** `SidebarIntelligence.tsx` has exactly **one** `nav-section`
header — `"Intelligence"` at `:18` — containing every item in the sidebar.
There is no "content-giving-comms" section in the nav to dissolve.
"Area E" is an artifact of this audit's own grouping, not of the product.
So the work is: delete the five nav buttons (W3-W7), leave Newsletter Architect
where it sits at `:44-50`, and stop treating content/giving/comms as a category
in the audit docs. Zero additional code.

---

## 5. Unresolved disagreement — the question Round 3 must settle

**Q1 (carried, narrowed to one point) — is `!isChild` sufficient given that the
codebase distrusts `isChild`?**
The mechanism dispute is settled: no checkbox, unconditional filter. But youth
(`§4`) lands a point that neither the veto nor W1 answers — N1 will ship as a
clean abstraction over a *dirty input*. `automations.ts:115` proves `isChild`
goes stale in the un-safe direction is bounded (an 18-year-old wrongly flagged
`isChild` gets *over*-protected, i.e. omitted from the newsletter — harmless).
**The unbounded direction is the one nobody has checked: can a genuine minor
carry `isChild: false`?** If PCO's `child` attribute is derived from household
role rather than birthdate, a teen in their own household, a minor with no
household, or a record never assigned a role would return `false` and be
published by name — the exact outcome the veto exists to prevent, with the gate
reporting success. Round 3 must answer from source: what populates
`pco.ts:273`, and is there a `birthdate`-derived belt-and-braces check
(`age < 18 || isChild`) that closes it? This is the only thing that could still
make W1 insufficient rather than merely minimal.

**Q3 (routed out, not settled here) — `firstTimeGiver`/`firstGiftDate` is
fixture-only.** Confirmed by UXR (`§2`) and admin (`§1`): populated exclusively
by `mock-api/data.js:103-107`, not a documented PCO People attribute. Area C's
Automations (#28) depends on it. Not Area E's to close; it must land on the
pastoral-ops critics with an owner, not evaporate because this area finished.

**Standing instruction earned this round (admin §3), applies to every area:**
a green test suite in this repo has now been shown to *certify* a real
minor-safety defect. No critic in any area may accept "tests pass" without
reading what the tests assert. Admin names two unverified sites of the same
pattern: `sorter.ts:21,117` and `family.ts:119-120` were cited as using
`isChild` correctly, but their tests were never read.

---

## 6. New ideas earned this round (down from 3 to 1)

**N1 — `src/utils/publishing.ts` → `isPublishable(person, config)`** *(carried,
CONVERGED in shape, amended in two ways)*
A single predicate governing whether a person's identity may be emitted into
any artifact that leaves the app. Today it encodes exactly `!person.isChild`.
Two amendments forced this round:
* Its signature takes **`config`, not per-call options** — if a minors' carve-out
  ever exists it is an admin-owned `AppConfig` flag, never a caller-supplied
  argument. This is what makes the "checkbox" unbuildable by construction rather
  than by convention.
* It ships with a **documented known-dirty input** (youth §4): `isChild` is
  distrusted by this codebase's own code, and Q1 above is the open question
  about which direction that dirt runs. The note goes in the file, not in a
  plan doc, cross-referenced to Area A hygiene.
*Replaces:* the scattered "add an `isChild` check here" patches across #41 and
#43. *Adds no screen, no route, no control.*

**Withdrawn:** N2 (Mailchimp export) — §1. **Withdrawn:** N3's
"Request this integration" control — W7; what survives of N3 is one static
line of text, which is not an idea, it is the absence of one.
