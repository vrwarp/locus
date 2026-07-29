# Area E — content-giving-comms — Proposal v3 (after Round 3)

Synthesis of `r3-uxr.md`, `r3-church-admin.md`, `r3-youth.md`, `r3-children.md`
against `proposal-v2.md`.

**Status: this area is effectively settled.** Every verdict in §2 is CONVERGED.
Q1 — the one live disagreement carried out of Round 2 — is closed with all three
ruling critics converging on the same filter shape, and youth supplying the one
clause the other two missed. What remains for Rounds 4–5 is not disagreement
about Area E; it is three items that must be *handed to an owner outside this
area* (§5) and will otherwise evaporate when this area stops meeting. I am not
manufacturing a Round 4 question to keep the loop warm.

---

## 1. Changes since last round

**One of my v2 reasons was factually false. I am not defending it.**

* **The Q2 cost rebuttal (v2 §3 "Declined" (ii)) was wrong, and UXR caught it.**
  I claimed `aggregateCheckInsByWeek` computes an ISO week key at
  `attendance.ts:17` and "throws it away," so Q2 would require a type change in
  Area D. **[VERIFIED — UXR is right, I was wrong]** `Object.entries(counts)`
  (`attendance.ts:22`) iterates the map keyed by `weekKey`, and `dateStr` is
  written straight back out as `date: dateStr` (`:26`) into a field declared
  `// ISO date string for sorting` (`:6`) and already consumed by the sort at
  `:32`. The join key survives into every `WeeklyAttendance` the app renders. No
  Area D type change is needed and Q2 is *cheaper* than I represented, not
  costlier. Reason (ii) is struck. See §3 "Declined" for the decline as it now
  stands on its two surviving legs.

**Q1 is closed. Three critics ruled, all three converge, and the filter grew a
fourth clause.**

* Admin answered the source question: `isChild` (`pco.ts:273`) is `!!child`,
  read straight off PCO's own admin-set `child` checkbox — not derived from
  household role, not computed by Locus. So the specific failure mode Q1 posited
  (a minor in their own household returning `false` by derivation) does not
  exist; what exists instead is a plain data-hygiene risk, an admin who never
  ticked the box. Children's and youth independently traced the other half:
  `transformPerson` returns `null` for a missing (`pco.ts:233-235`) or
  unparseable (`:237-241`) birthdate, so **no `Student` that exists anywhere in
  this app has an undefined `age`** — the fail-open/fail-closed question simply
  never arises. `newsletter.ts:21`'s `s.birthdate &&` is redundant, harmless.
* **Youth found the hole the other two missed, and it changes the filter.** A
  *placeholder* birthdate (`1900-01-01`, the standard ChMS "DOB unknown"
  sentinel) is a syntactically valid date. It clears both `transformPerson`
  guards, yields `age ≈ 126`, and `age >= 18` waves it through. Paired with a
  stale `isChild: false`, a genuine 14-year-old publishes by name under
  admin's and children's proposed three-clause filter. Hence the plausibility
  ceiling. **Adopted verbatim into W1.**

**UXR's two accepted amendments.**

* The screen's copy still overclaims after W1+W2 in a way neither work item
  fixed — the `:65` subtitle promises "upcoming calendar events" that W2 deletes
  outright. **[VERIFIED]** `NewsletterArchitect.tsx:65` reads *"AI-assisted
  markdown drafts based on upcoming calendar events and student birthdays."*
  W1 only removed "AI-assisted" and "student"; applied as written the screen
  ships advertising a data source it no longer touches. Folded into W1 as a
  full subtitle rewrite, plus a rename (W1b).
* My reason for cutting rather than relabelling the events block was weak, and
  UXR supplied a better one. Replaced in W2; conclusion unchanged.

**Deletion budget audited clean.** Admin traced every file: `PcoEvent` /
`fetchEvents` stay in `pco.ts` (7 live screens + 6 utils consume them — W2
deletes only the *import and usage* in the newsletter); `SERMON_TOPICS` appears
nowhere outside `sermons.ts`/`sermons.test.ts`; `genealogy.ts` is reachable only
via `GenealogyGraph` ← `RobertReport`, already dead at `App.tsx:11`. **No
cross-area dependency severed by W3–W9.**

**Nothing else in v2 drew an objection from any of the four critics.**

---

## 2. Per-feature decisions

| # | Feature | Verdict | Rationale | Converged? |
|---|---------|---------|-----------|-----------|
| 37 | Sermon Sentiment | **CUT** | X-axis is `SERMON_TOPICS[i % 8]`; right axis is `attendance * 25`. Honest residue is a strict subset of what `AttendancePulse.tsx:27-28` already renders live. | **CONVERGED** (3 rounds) |
| 38 | Sermon Correlator | **CUT** | Every plotted series is arithmetic on a fabricated label; "AI Insights" is static JSX restating the code's own multipliers as findings. | **CONVERGED** (3 rounds) |
| 39 | Giving River | **CUT** | `React.FC<{}>` — zero props, zero fetch. Six-figure literals × a dropdown multiplier. No data path to repair. | **CONVERGED** (3 rounds) |
| 40 | Stripe / Giving Trends | **CUT** (route + component + util) | Passed `[]`/`[]` at `App.tsx:918-922`; has never rendered a chart. Formula is `attendance*25*sin` under a payment vendor's name. Do not repair the wiring. | **CONVERGED** (3 rounds) |
| 41 | Newsletter Architect | **FIX/SIMPLIFY** — three edits (W1, W1b, W2) | Only Area E surface doing a real recurring job. All four critics now agree it survives both gates; admin and UXR independently priced the residue as worth its one nav slot. | **CONVERGED** (verdict); mechanism now settled too |
| 42a | Robert Report shell | **CUT** | Dead code (`App.tsx:11` commented import); ten of eleven tabs duplicate live routes; kept green by tests implying it ships. | **CONVERGED** (3 rounds) |
| 42b | Genealogy Graph | **CUT** — do not re-route | Spouse/parent/sibling edges inferred from `householdId` co-membership alone; no role field exists to fetch. Already unreachable from any live route. | **CONVERGED** (3 rounds) |
| 43 | Integrations Hub | **CUT** → one static line in `ConfigModal.tsx` | Four toggles that make no network call render hardcoded success text. An action UI lying about an action outranks every analytics defect here. | **CONVERGED** (3 rounds) |
| — | "Area E" as a grouping | **DISSOLVE** | Costs zero code: `SidebarIntelligence.tsx:18` has exactly one `nav-section`, so there is no such section in the nav to dissolve. | **CONVERGED** (2 rounds) |

Net: **5 routes deleted**, **1 route kept, renamed and repaired**, **0 routes
added**, **0 new screens**.

---

## 3. The concrete work, ordered by value-per-effort

### W1 — Newsletter minor gate (BLOCKING; ~6 lines + test rewrite) — **FINAL**

`src/utils/newsletter.ts`, line 21. Replace `.filter(s => s.birthdate)` with:

```js
// Safety veto, not a targeting filter: any one clause failing must suppress.
// Do NOT rewrite as the AND-idiom used elsewhere (automations.ts:169,176;
// sorter.ts:21) — those pick a target group; this excludes on any doubt.
.filter(s =>
    s.birthdate &&      // redundant (transformPerson returns null without one) — defense in depth
    !s.isChild &&       // PCO's admin-set `child` checkbox (pco.ts:273 = !!child); trusted, but staleable
    s.age >= 18 &&      // catches a real minor whose isChild was never ticked
    s.age <= 110        // catches a placeholder DOB (1900-01-01 etc.) that computes age ~126 and clears >=18
)
```

**Why each clause, since the next implementer will be tempted to trim it:**

1. `s.birthdate` — structurally unreachable as a `false` case: `transformPerson`
   (`pco.ts:229-241`) returns `null` for any missing or unparseable birthdate,
   so no `Student` in this app lacks one. Kept as defense-in-depth against a
   future second construction path, and free.
2. `!s.isChild` — the primary gate, from the Round 2 converged domain veto. Not
   sufficient alone: `automations.ts:114-115` documents in its own comment that
   this field goes stale, and `BatchUpdateCommand.ts:30-32` confirms it is
   directly admin-editable through Locus's own UI.
3. `s.age >= 18` — closes clause 2's unsafe direction: a genuine minor whose
   `child` box was never ticked in PCO. Costs four characters; `age` is already
   on `Student` (`pco.ts:243`, `differenceInYears`).
4. `s.age <= 110` — **the clause that only youth caught, and the one most
   likely to be deleted as noise by someone who doesn't know why it is there.**
   A sentinel DOB is a *valid* date; it survives both `transformPerson` guards
   and clears `>= 18` by a century. Without this bound, `!isChild && age >= 18`
   still publishes a 14-year-old carrying `1900-01-01`. 110 almost never
   excludes a real elder; a false negative costs one omitted birthday, a false
   positive costs a safeguarding incident.

**Add, adjacent to the filter, the limit youth insisted be stated in code and
not only in a plan doc:** a placeholder DOB that lands *inside* the plausible
adult range (a guessed "2000" for a child born 2011) is a plausible adult age
and is not catchable by any birthdate-shaped filter. It is a PCO data-quality
problem. The age bound is a floor, not a fix.

`src/utils/newsletter.test.ts` — **must change in the same commit.**
* `:13-46` — Alice/Bob/Charlie are all `isChild: true`; `:62-63` assert
  `'Charlie (Mar 24)'` and `'Alice (Mar 26)'` appear. `:83-93` `Leapling` is
  `isChild: true` and `:96` asserts it appears. **Four assertions currently
  require the defect.** Flip fixtures to `isChild: false` with adult ages.
* Add three regression guards, one per non-redundant clause: (a) `isChild:
  true` + birthday tomorrow → `*No birthdays in the next 7 days.*`; (b)
  `isChild: false`, age 14 → same; (c) `isChild: false`, `birthdate:
  '1900-01-01'` → same.

`src/components/NewsletterArchitect.tsx` — no checkbox, no prop, nothing added
to `.newsletter-controls` (`:69-90`).

**If minors' birthdays are ever wanted**, it is an admin-owned `AppConfig` flag
(`storage.ts:12`) read by `isPublishable` (N1), never a run-time control.
**Youth's Round 3 amendment, recorded so the next implementer does not
misread the parked idea:** admin-ownership solves *access control*, not
*consent*. A single boolean meaning "include all minors" still publishes every
student's name into an artifact that leaves the app with no per-family opt-in —
the same light-switch the Round 2 veto killed, moved one layer up the stack. If
ever built it needs per-student/per-guardian consent tracking. Not in scope.

### W1b — Stop the screen overclaiming (UXR, adopted; same commit as W1/W2)

W1 and W2 fix the *content*; the frame still promises what was just deleted.
**[VERIFIED]** `NewsletterArchitect.tsx:65` currently reads *"AI-assisted
markdown drafts based on upcoming calendar events and student birthdays."*
Applying only v2's W1 edit leaves *"markdown drafts based on upcoming calendar
events and birthdays"* — advertising a fetch W2 removes entirely.

* `:65` — replace the whole subtitle, not part of it:
  *"Weekly markdown draft with real birthdays and space for your own notes."*
  ("AI-assisted" goes because no model call exists in this component or in
  `newsletter.ts`; "calendar events" goes because W2 deletes the fetch;
  "student" goes because it is what made the age problem invisible to the
  person clicking Copy.)
* `:64` header and `SidebarIntelligence.tsx:44-50` nav label — rename
  **"Newsletter Architect" → "Weekly Bulletin Draft."** "Architect" implies
  composition intelligence that two text inputs and one date filter do not
  have. Non-blocking, but shipping a screen named for a capability it lacks is
  the same species of overclaim (#43's fake toggles, #37's fake correlation)
  that five of this area's six cuts were made for. Do not cut this edit as
  cosmetic — it is the last instance of the defect pattern in the surviving
  surface.
* Route id `'newsletter'` stays; renaming it touches `App.tsx` view-state
  plumbing for zero user-visible gain.

### W2 — Newsletter events block (BLOCKING) — **reason replaced, ruling unchanged**

**Ruled: CUT the events section outright.** My v2 reason — "leaving `fetchEvents`
wired in is the hook a future agent would reach for" — is downgraded to a
secondary note. UXR is right that it does not carry the decision: W2 ships a
warning comment either way, and that comment prevents the recurrence identically
whether or not the fetch survives. (Children's accepted the decay argument;
UXR's rebuttal is the stronger reading and does not change the outcome, so this
is a reason swap, not a re-litigation.)

**The reason that does hold — a present-tense UI defect, not a future-decay
one:** a relabelled "Standing Ministries" block fed by `/check-ins/v2/events`
would render *the identical five lines* — "Sunday Worship Service," "Kids
Ministry Team," "Greeter Team" (`mock-api/data.js:214-239`, all
`frequency: 'weekly'`) — **every week, forever**, because the resource has no
date dimension to vary on. Inside an artifact whose entire premise is "this
week's update," a block with zero variance carries zero information and
duplicates the standing-ministries list already in the church's bulletin
template. It also keeps a network dependency, a loading spinner and an error
state (`:52-59`) alive in a component that should render synchronously. Youth
independently confirmed a relabel buys their audience nothing either: a real
Wednesday-night events surface needs `event_times`/`event_periods`, not a
rename.

`src/utils/newsletter.ts`
* Delete the `events: PcoEvent[]` parameter (`:10`), `upcomingEvents` (`:17`),
  the whole events block (`:51-59`) including the false empty-state string at
  `:57` — *"No major events scheduled for this week"* is a claim about this
  week emitted from a query that never asked about a week — and the now-unused
  `PcoEvent` import (`:2`).
* Emit in its place a static scaffold: `## Announcements\n\n_[paste this week's
  announcements here]_\n\n`. Preserves the paste-target job admin described
  while asserting nothing.
* Add the comment that stops re-introduction: Check-Ins **Events** are recurring
  definitions with **no date field**; occurrence dates live in
  `event_times`/`event_periods`, which Locus fetches nowhere in `src/` or
  `mock-api/`. Do not add a date filter here.

`src/components/NewsletterArchitect.tsx`
* Delete the `fetchEvents` import (`:2`), `events` state (`:13`), the entire
  `useEffect` (`:21-38`), `loading`/`error` state (`:14-15`) and both early
  returns (`:53-59`). With no fetch the component renders synchronously from
  `students` and two text inputs.
* `generatedMarkdown` (`:41`) drops its `events` argument and dependency.
* `PcoEvent` type import becomes unused — remove it too.
* **Do not touch `PcoEvent`/`fetchEvents` in `pco.ts`** — admin verified 7 live
  screens and 6 utils depend on them.

`src/utils/newsletter.test.ts` — delete `mockEvents` (`:49-52`) and the two
event assertions (`:60-61`); update the empty-case test (`:67-72`), which
asserts the deleted string.

### W3 — Delete `giving-trends`
`App.tsx` import `:34`, route `:918-922`; `SidebarIntelligence.tsx:180-187`;
delete `GivingTrends.tsx`, `.css`, `.test.tsx`, `src/utils/givingTrends.ts`
(+ test). **Do not** add a `fetchRecentCheckIns` call first.

### W4 — Delete `giving-river`
`App.tsx` import `:33`, route `:912-916`; `SidebarIntelligence.tsx:172-179`;
delete `GivingRiver.tsx`, `.css`, `.test.tsx`, `src/utils/giving.ts` (+ test).

### W5 — Delete `sermon-correlator`
`App.tsx` import `:31`, route `:901-905`; `SidebarIntelligence.tsx:164-171`;
delete `SermonCorrelator.tsx`, `.css`, `.test.tsx`; from `src/utils/sermons.ts`
delete `correlateSermonsWithEngagement` and `SermonEngagementData` (`:103-148`).

### W6 — Delete `sermons`
`App.tsx` import `:30`, route `:896-900`; `SidebarIntelligence.tsx:156-163`;
delete `SermonSentiment.tsx`, `.css`, `.test.tsx`, and — after W5 — all of
`src/utils/sermons.ts` incl. `SERMON_TOPICS` (admin: referenced nowhere else),
plus `sermons.test.ts`. Leave `GENERATIONS` (`src/utils/demographics.ts`) alone
— Area D (#33) consumes it.

### W7 — Delete `integrations`, replace with one static line
`App.tsx` import `:68`, route `:938-942`; `SidebarCore.tsx:90-96`; delete
`IntegrationsHub.tsx`, `.css`, `.test.tsx`. `ConfigModal.tsx`: add one read-only
line — *"Integrations: not available in this version."* No toggle, no status
string, no count, no "Request this integration" control. Leave
`AppConfig.integrations` (`storage.ts:5-12`) in place — inert once nothing
writes it; removing it is a migration question.

### W8 — Delete the Robert Report shell
Delete `RobertReport.tsx`, `.css`, `.test.tsx`; the commented import at
`App.tsx:11`; the dangling `vi.mock('./components/RobertReport', ...)` at
`App.ghost.integration.test.tsx:60-61` and `App.undo.integration.test.tsx:64`.

### W9 — Delete Genealogy
Delete `GenealogyGraph.tsx`, `GenealogyGraph.test.tsx`, `src/utils/genealogy.ts`
(+ test). Follows W8; admin confirmed no live route reaches it.

### W10 — Newsletter draft persistence
* `src/utils/storage.ts` — add `saveNewsletterDraft` / `loadNewsletterDraft` on
  the existing encrypted-per-`appId` pattern (`:54-92`). A plaintext
  `localStorage.setItem` would be the only unencrypted helper in the file, and
  `pastorNotes` is free text an operator may type pastoral detail into.
* `src/components/NewsletterArchitect.tsx` — new `appId` prop threaded from
  `App.tsx:991` (props today are `students`, `auth`). Load on mount,
  debounce-save `{ sermonTopic, pastorNotes }`.
* **Stated limit (children's confirms this must be explicit):** `pastorNotes` is
  unstructured free text. N1's `isPublishable` gates *derived* identity fields;
  it cannot gate a name the operator types by hand. Persisting the draft creates
  no publishing risk (it never leaves the browser), but W10 does not extend the
  minor gate over free text.

### Declined, with reasons

* **Q2 — sermon-topic annotation on Attendance Pulse. DECLINED as an Area E
  build, on two legs, not three.** ~~(ii) the join key does not survive into
  `WeeklyAttendance`~~ — **struck as false**; see §1. `WeeklyAttendance.date`
  (`attendance.ts:26`) *is* `weekKey` (`:17`) and is already used for sorting
  (`:32`), so the join key exists today and Q2 needs no Area D type change. The
  real cost is the same shape as W10: an `appId` prop plus one encrypted store.
  The decline stands on (i) it is a *build* in a pass whose thesis is
  subtraction, and it deletes nothing; and (iii) cold start — a per-week topic
  log shows nothing until Newsletter Architect has been used weekly for two
  months, and even then n=1 per topic with no control makes it a memory aid, not
  an answer to "did the sermon move attendance." It is Area D's screen, Area D's
  owner, Area D's round. W10 accumulates `sermonTopic` as a side effect, so the
  input data will already exist if Area D wants it. **Whoever picks up the Area D
  note must be told the join key already exists** — the corrected §1 text is the
  point of this entry.
  *Condition attached (children's, carried):* any revived sermon-topic surface
  must disclose that its attendance series folds children's check-ins into a
  congregation-wide number.
* **Any "Sample data" badge on #37-#40.** A badge is for a screen that earns its
  slot with one estimated series. None of these four do. Badging a fixture is a
  licence to keep it.

---

## 4. Note on dissolving "Area E" (CONVERGED)

One surviving weekly-use screen does not justify a standing category.
`SidebarIntelligence.tsx` has exactly one `nav-section` header — `"Intelligence"`
at `:18` — containing every item. There is no "content-giving-comms" section in
the nav to dissolve; it is an artifact of this audit's grouping. The work is:
delete five nav buttons (W3–W7), leave the surviving screen where it sits at
`:44-50` under its new name (W1b), and stop treating content/giving/comms as a
category in the audit docs. Zero additional code.

---

## 5. What genuinely remains — three handoffs, zero open questions

**Area E has no unresolved disagreement left.** Q1 is closed by three converging
rulings; Q2's mechanism is settled; Q4 was closed in Round 2 from source; every
verdict is CONVERGED. I will not invent a Round 4 question. What follows are
items this area *found* and cannot *own* — each needs a named owner in Rounds
4–5 or it dies with this area's last meeting.

**H1 — `firstTimeGiver`/`firstGiftDate` is fixture-only.** Confirmed by UXR and
admin: populated exclusively by `mock-api/data.js:103-107`, not a documented PCO
People attribute. **Area C's Automations (#28) depends on it** — a live screen
acting on a field that only mock data supplies. Not Area E's to close. Needs an
owner on the pastoral-ops critics, not a mention.

**H2 — birthdate plausibility as app-wide hygiene.** Children's names the gap
precisely: `pco.ts:255-258` has anomaly detectors for email, phone and address,
and **none for birthdate**. W1's `age <= 110` closes the sentinel-DOB case for
the newsletter only. The general fix is a `detectBirthdateAnomaly` alongside the
existing detectors, fail-closed. Area A (hygiene) owns this, and it is the
generalisation of the one clause of W1 that a future refactorer is most likely
to delete without understanding.

**H3 — the standing instruction earned in Round 2, still unverified in two
places.** A green test suite in this repo has been shown to *certify* a real
minor-safety defect (`newsletter.test.ts` has four assertions requiring it). No
critic in any area may accept "tests pass" without reading what the tests
assert. Admin named two sites of the same pattern that nobody has yet read:
`sorter.ts:21,117` and `family.ts:119-120` were cited as using `isChild`
correctly, **but their tests were never read.** That is a two-file read, not a
research project, and it is the single highest-value unclaimed task leaving this
area.

**If Rounds 4–5 want to spend Area E's remaining budget usefully**, spend it on
H3 then H1. Re-opening #37–#43 would be churn.

---

## 6. New ideas — one, carried and now final

**N1 — `src/utils/publishing.ts` → `isPublishable(person, config)`**
*(CONVERGED in shape across three rounds)*
A single predicate governing whether a person's identity may be emitted into any
artifact leaving the app. It encodes exactly W1's four clauses, and W1 becomes
its first caller (`#41`), with `#43`'s scattered `isChild` patches folded in.
Three properties, all forced by critic rulings rather than chosen:
* **Signature takes `config`, not per-call options.** If a minors' carve-out ever
  exists it is an admin-owned `AppConfig` flag, never a caller-supplied
  argument. This makes the vetoed checkbox unbuildable by construction rather
  than by convention.
* **It ships with its known-dirty input documented in the file, not in a plan
  doc:** `isChild` is admin-editable through Locus's own UI
  (`BatchUpdateCommand.ts:30-32`), documented as staleable by this codebase's
  own comment (`automations.ts:114-115`), and unchecked in the unsafe direction
  anywhere in the repo. Cross-reference H2.
* **It documents what it does *not* close** (youth): a placeholder DOB inside
  the plausible adult range is indistinguishable from a real adult by any
  birthdate-shaped filter, and free text an operator types is outside its reach
  entirely (W10's stated limit).

*Replaces:* the scattered "add an `isChild` check here" patches across #41 and
#43. *Adds no screen, no route, no control.*

**Withdrawn in v2, still withdrawn:** N2 (Mailchimp/Bulletin export) — reopens
the third-party durable-record risk. N3's "Request this integration" control —
scope creep on a cut; what survives is one static line of text, which is the
absence of an idea rather than one.
