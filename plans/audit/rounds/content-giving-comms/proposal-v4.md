# Area E — content-giving-comms — Proposal v4 (after Round 4)

Synthesis of `r4-all.md` against `proposal-v3.md`, **verified against the
working tree at commit `df8ee37`**, not against the plan text.

**Status: SETTLED.** Three critics returned CONVERGED with no residual
objection. UXR's single objection (W1b unshipped) has since been fixed on disk
and is closed. Every verdict in §2 is CONVERGED for three or more rounds. There
is no open question in this area. **Round 5 is a sign-off, not a working
round** — re-opening #37–#43 would be churn, and this document is written so
that the only honest Round 5 output is "confirmed, nothing further."

The one thing v4 adds that v3 could not: a clean line between **what is now
DONE in the working tree** (§0, §3a) and **what remains proposed** (§3b). A
future reader of v3 alone would assume W1 implies W1b implies W2. Two of those
are now true and one is not.

---

## 0. Working-tree state — what is actually on disk

| Item | State | Evidence (verified this round) |
|---|---|---|
| **W1** minor gate on newsletter birthdays | **DONE** | `newsletter.ts:25` — `.filter(s => s.birthdate && !isMinor(s))`; `pco.ts:122-123` defines `isMinor`; `newsletter.test.ts:51-84` asserts exclusion in all three cases |
| **W1b** stop the screen overclaiming | **DONE** | `NewsletterArchitect.tsx:64-65` — heading now *"Weekly Update Draft"*, blurb now *"…this week's adult birthdays…"* |
| **H3 / sorter half** | **DONE** | `sorter.ts:1,22,118` now import and use `isMinor` |
| **H3 / family half** | **DELIBERATELY NOT DONE** | `family.ts:119-120` still reads the bare flag — see §1 finding F1 |
| Newsletter test isolation | **DONE (unbudgeted)** | `NewsletterArchitect.test.tsx` mocked the *whole* `pco` module, which would have stubbed out `isMinor` and let the adults-only guarantee lapse green; now only `fetchEvents` is mocked |
| **W2** (events block), **W3–W9** (six deletions), **W10** (draft persistence) | **NOT SHIPPED** | `newsletter.ts:11,18,55-62` still take and render `events`; all six component families still present in `src/components/`; `App.tsx:896,901,912,918,938` still route all five views |

Net: the **blocking safety item and its copy companion are closed**. The
subtraction pass — the bulk of this area's value — is entirely unstarted.

---

## 1. Changes since last round

**W1 shipped, and it shipped in a better shape than I specified. My v3 spec is
superseded, not fulfilled.** v3 §3 W1 prescribed a literal four-clause inline
filter with a warning not to trim it. What landed instead is one exported
predicate — `isMinor` (`pco.ts:122-123`) — consumed by `newsletter.ts:25` and
`sorter.ts:22,118`:

```ts
export const isMinor = (person: Pick<Student, 'isChild' | 'age'>): boolean =>
  person.isChild || person.age < 18 || person.age > 110;
```

Semantics are identical to the converged spec (child flag OR under-18 OR
implausible age ⇒ treat as minor; `s.birthdate &&` retained at the call site as
the defense-in-depth clause). The four paragraphs of reasoning v3 demanded live
in the doc comment at `pco.ts:101-121`, including youth's `age > 110`
placeholder-DOB clause and the explicit statement of what the filter cannot
close. **The clause most likely to be deleted by a future refactorer is now
deleted-proof by being defined once, next to its reason, with two callers.**

**W1b shipped, closing UXR's only objection.** UXR's round-4 point was sharper
than round 3's: for one commit the screen said *"student birthdays"* on a
surface whose filter had just been hardened to exclude students — copy
contradicting a landed change, not copy lagging a future one. Fixed at
`NewsletterArchitect.tsx:64-65`. The v3 rename target *"Weekly Bulletin Draft"*
shipped as *"Weekly Update Draft"*; the route id `'newsletter'` was correctly
left alone. Objection closed on disk.

**H3 is confirmed live and half-resolved.** Children's ministry did the two-file
read v3 asked for and found the standing instruction vindicated: `sorter.ts:21`
and `:117` gated adult small-group placement on the bare flag, so an unflagged
14-year-old was **algorithmically routed into an adult small group** — and
`sorter.test.ts` was silent, every child fixture being `isChild: true` at a
plausible child age. Fixed with the shared predicate.

**F1 — the finding this round actually earned: where the shared predicate
belongs.** `family.ts:119-120` was *not* changed, and the reason is a real
boundary, not a scoping dodge. Applying `isMinor` there turned the existing
"child older than parent" test red — because `family.test.ts:40` constructs
`mockStudent('1', 'Dad', 10, false, 'h1')`, a **ten-year-old declared a
non-child "Dad"**, exactly the disagreement `analyzeFamilies` exists to detect.
Folding flag and age together in the detector makes the detector's own input
disappear. So there are two categories of `isChild` read, and they must not
share an implementation:

* **"May this person be *treated as* an adult?"** — broadcast inclusion, adult
  group placement, volunteer recruitment. Uncertainty must resolve to *minor*.
  **Use `isMinor`.** Sites: `newsletter.ts:25` ✅, `sorter.ts:22,118` ✅,
  `recruitment.ts:93` ❌ (see H3-c).
* **"What does this record *claim*, and does it agree with itself?"** — the
  family audit and the flag-drift automations. These must read the raw flag and
  the raw age *separately* precisely so the two can disagree. **Do not use
  `isMinor`.** Sites, all correct as-is: `family.ts:81,119-120`;
  `automations.ts:115` (`age === 18 && isChild`, literally a disagreement
  detector); `automations.ts:169`.

Children's recommended H3's owner "treat this as two sites needing the exact
same pattern." I am overruling half of that, and stating why the losing argument
loses: the second site is not the same pattern, and the test going red is the
proof. This distinction is now written into `pco.ts:116-120` so the next agent
does not "finish the job" by propagating the predicate into the detector.

**Nothing else moved.** No critic raised a new objection to any verdict, to the
deletion budget, or to the handoffs.

---

## 2. Per-feature decisions — all CONVERGED, none re-litigated

| # | Feature | Verdict | Rationale | Converged? | Shipped? |
|---|---------|---------|-----------|-----------|----------|
| 37 | Sermon Sentiment | **CUT** | X-axis is `SERMON_TOPICS[i % 8]`; right axis is `attendance * 25`. Honest residue ⊂ `AttendancePulse.tsx:27-28`. | **CONVERGED (4)** | No |
| 38 | Sermon Correlator | **CUT** | Every series is arithmetic on a fabricated label; "AI Insights" restates the code's own multipliers as findings. | **CONVERGED (4)** | No |
| 39 | Giving River | **CUT** | `React.FC<{}>` — zero props, zero fetch. Six-figure literals × a dropdown multiplier. | **CONVERGED (4)** | No |
| 40 | Stripe / Giving Trends | **CUT** (route + component + util) | Passed `[]`/`[]` at `App.tsx:918-922`; has never rendered a chart. Do not repair the wiring. | **CONVERGED (4)** | No |
| 41 | Newsletter Architect → *Weekly Update Draft* | **FIX/SIMPLIFY** (W1 ✅, W1b ✅, W2 ✗) | The only Area E surface doing a real recurring job. Survives both gates; admin priced the residue as worth one nav slot. | **CONVERGED (4)** | **Partly (2 of 3)** |
| 42a | Robert Report shell | **CUT** | Dead code (`App.tsx:11`); ten of eleven tabs duplicate live routes; kept green by tests implying it ships. | **CONVERGED (4)** | No |
| 42b | Genealogy Graph | **CUT** — do not re-route | Edges inferred from `householdId` co-membership alone; no role field exists to fetch. | **CONVERGED (4)** | No |
| 43 | Integrations Hub | **CUT** → one static line in `ConfigModal.tsx` | Four toggles that make no network call render hardcoded success text. | **CONVERGED (4)** | No |
| — | "Area E" as a grouping | **DISSOLVE** | Zero code: `SidebarIntelligence.tsx:18` has exactly one `nav-section`. | **CONVERGED (3)** | n/a |

Net when complete: **5 routes deleted, 1 kept/renamed/repaired, 0 added.**
Admin re-audited the deletion budget against current disk this round —
`App.tsx:11` still commented, `SERMON_TOPICS` still confined to
`sermons.ts`/`sermons.test.ts`, `GenealogyGraph` still reachable only via
`RobertReport.tsx:16,338`. **Still clean; no cross-area dependency severed.**

---

## 3. The concrete work

### 3a. DONE — do not re-do, do not re-open

**W1 — newsletter minor gate (was BLOCKING).** `newsletter.ts:25` +
`pco.ts:101-123` + `newsletter.test.ts:51-84`. The four v3 assertions that
*required* the defect (Alice/Bob/Charlie/Leapling as `isChild: true` with
"must appear" assertions) are gone; the fixture factory now defaults
`isChild: false` and carries a comment (`newsletter.test.ts:5-8`) naming why the
old suite encoded the leak. Three regression guards exist, one per
non-redundant clause: flagged child, unflagged 13-year-old, `1900-03-26`
sentinel. **Youth's `age > 110` clause shipped verbatim and is guarded.**

**W1b — screen copy.** `NewsletterArchitect.tsx:64-65`. "AI-assisted" gone (no
model call exists), "calendar events" gone from the blurb, "student" gone.

**H3-a — sorter.** `sorter.ts:1,22,118`.

**Unbudgeted but load-bearing — test isolation.**
`NewsletterArchitect.test.tsx` now mocks only `fetchEvents` via
`importOriginal`, so `isMinor` runs for real in the component test. A
whole-module mock is the exact mechanism by which this repo has already been
shown to certify a minor-safety defect green; worth generalising (see H3-d).

### 3b. REMAINS PROPOSED — unchanged from v3, ordered by value-per-effort

Nothing below has been touched. All specs stand as written in `proposal-v3.md`
§3; repeated here only in locator form so v4 is self-sufficient.

1. **W2 — cut the newsletter events block** (BLOCKING; the last item on the
   surviving screen). `newsletter.ts` — delete the `events` param (`:11`),
   `upcomingEvents` (`:18`), the block (`:55-63`) incl. the false empty-state
   *"No major events scheduled for this week."* (`:61`), and the `PcoEvent`
   import (`:3`). Emit `## Announcements\n\n_[paste this week's announcements
   here]_` in its place. Add the comment that stops re-introduction: Check-Ins
   **Events** are recurring definitions with **no date field**; occurrence dates
   live in `event_times`/`event_periods`, fetched nowhere in `src/` or
   `mock-api/`. `NewsletterArchitect.tsx` — delete `fetchEvents` import,
   `events`/`loading`/`error` state, the `useEffect`, both early returns
   (`:53-59`); the component then renders synchronously. `newsletter.test.ts`
   — delete `mockEvents` (`:33-36`), the two event assertions (`:44-45`), and
   update the empty-case test (`:86-91`), which asserts the deleted string.
   **Do not touch `PcoEvent`/`fetchEvents` in `pco.ts`** — 7 live screens and 6
   utils consume them.
2. **W3** — delete `giving-trends`: `App.tsx:34`, `:918-922`;
   `SidebarIntelligence.tsx:180-187`; `GivingTrends.{tsx,css,test.tsx}`,
   `src/utils/givingTrends.ts` (+test). Do **not** wire `fetchRecentCheckIns` first.
3. **W4** — delete `giving-river`: `App.tsx:33`, `:912-916`;
   `SidebarIntelligence.tsx:172-179`; `GivingRiver.{tsx,css,test.tsx}`,
   `src/utils/giving.ts` (+test).
4. **W5** — delete `sermon-correlator`: `App.tsx:31`, `:901-905`;
   `SidebarIntelligence.tsx:164-171`; `SermonCorrelator.{tsx,css,test.tsx}`;
   from `sermons.ts` delete `correlateSermonsWithEngagement` /
   `SermonEngagementData` (`:103-148`).
5. **W6** — delete `sermons`: `App.tsx:30`, `:896-900`;
   `SidebarIntelligence.tsx:156-163`; `SermonSentiment.{tsx,css,test.tsx}`;
   after W5, all of `sermons.ts` incl. `SERMON_TOPICS`, plus `sermons.test.ts`.
   Leave `GENERATIONS` (`demographics.ts`) — Area D (#33) consumes it.
6. **W7** — delete `integrations`: `App.tsx:68`, `:938-942`;
   `SidebarCore.tsx:90-96`; `IntegrationsHub.{tsx,css,test.tsx}`. Add one
   read-only line to `ConfigModal.tsx`: *"Integrations: not available in this
   version."* No toggle, no status, no request-control. Leave
   `AppConfig.integrations` (`storage.ts:5-12`) inert.
7. **W8** — delete the Robert Report shell: `RobertReport.{tsx,css,test.tsx}`;
   the commented import `App.tsx:11`; the dangling `vi.mock` at
   `App.ghost.integration.test.tsx:60-61` and `App.undo.integration.test.tsx:64`.
8. **W9** — delete Genealogy: `GenealogyGraph.{tsx,test.tsx}`,
   `src/utils/genealogy.ts` (+test). Follows W8. *(Note: `genealogy.ts:52-53`
   is a third bare-flag parent/child split — W9 deletes the file, so it needs
   no separate fix. Do not "repair" it; delete it.)*
9. **W10** — newsletter draft persistence: `storage.ts` gains
   `saveNewsletterDraft`/`loadNewsletterDraft` on the existing
   encrypted-per-`appId` pattern (`:54-92`) — a plaintext `localStorage` write
   would be the only unencrypted helper in the file, and `pastorNotes` is free
   text an operator may type pastoral detail into. `NewsletterArchitect.tsx`
   gains an `appId` prop from `App.tsx:991`; load on mount, debounce-save
   `{ sermonTopic, pastorNotes }`. **Stated limit:** `pastorNotes` is
   unstructured free text — no predicate gates a name typed by hand. Persisting
   creates no publishing risk (it never leaves the browser); W10 does not extend
   the minor gate over free text.

### Declined, unchanged

* **Q2 — sermon-topic annotation on Attendance Pulse. DECLINED as an Area E
  build, on two legs.** ~~(ii) the join key does not survive~~ — **struck as
  false in v3 and it stays struck**: `WeeklyAttendance.date` (`attendance.ts:26`)
  *is* the `weekKey` (`:17`) and is already used for sorting (`:32`). Whoever
  picks up the Area D note must be told the join key exists today and no type
  change is needed. Declined on (i) it is a build in a subtraction pass and
  deletes nothing, and (iii) cold start — n=1 per topic with no control makes it
  a memory aid, not an answer. W10 accumulates `sermonTopic` as a side effect,
  so the data will exist if Area D wants it. *Condition carried (children's):*
  any revived sermon-topic surface must disclose that its attendance series
  folds children's check-ins into a congregation-wide number.
* **Any "Sample data" badge on #37–#40.** A badge is for a screen that earns its
  slot with one estimated series. None of these four do. Badging a fixture is a
  licence to keep it.

---

## 4. Unresolved disagreement

**None.** Q1 closed in Round 3 by three converging rulings and is now shipped;
Q2's mechanism is settled and routed; Q4 closed in Round 2 from source. Round 4
produced one objection (UXR/W1b), which is resolved on disk. Children's
recommendation that H3 be fixed identically in two files is **overruled in
part** — §1 F1 states the reason and the failing test that proves it — and that
is a correction I am making to a critic, not a dispute I am leaving open; the
boundary is now documented in code at `pco.ts:116-120`.

I am not manufacturing a Round 5 question. **The correct Round 5 output for
Area E is a sign-off confirming §0 and §3b.**

---

## 5. Handoffs — the only live items leaving this area

**H1 — `firstTimeGiver`/`firstGiftDate` is fixture-only.** Populated
exclusively by `mock-api/data.js:103-107`; not a documented PCO People
attribute. **Area C's Automations (#28) acts on it** — a live screen driving
behaviour off a field only mock data supplies. Needs a named owner on the
pastoral-ops critics. **Still unowned after four rounds.**

**H2 — birthdate plausibility as app-wide hygiene.** `pco.ts:255-258` has
anomaly detectors for email, phone and address and **none for birthdate**.
`isMinor`'s `age > 110` closes the sentinel case at two call sites only; the
general fix is a `detectBirthdateAnomaly` alongside the existing detectors,
fail-closed. **Area A (hygiene) owns this.**

**H3 — the standing instruction: no critic may accept "tests pass" without
reading what the tests assert.** Status after this round:
* **H3-a `sorter.ts:21,117`** — confirmed, **fixed**.
* **H3-b `family.ts:119-120`** — confirmed as a bare-flag read, **deliberately
  left alone**; §1 F1. What *is* open there is narrower than children's framed
  it: nothing in `analyzeFamilies` sanity-checks a declared parent's age on its
  own, so a 10-year-old "Dad" produces no anomaly unless paired with an older
  child, and can still become `familyName` source (`family.ts:121-122`) or a
  `checkSpouseGap` candidate. The fix is a **new detector** ("declared parent
  under 18"), not the shared predicate. **Hand to the household/family owner
  with that framing.**
* **H3-c `recruitment.ts:93` — NEW this round, unclaimed.** `if
  (student.isChild) return;` under the comment `// Filter: Adults only`. This is
  category one (may-be-treated-as-an-adult): an unflagged minor with high
  worship attendance and low serving is surfaced as a **volunteer recruitment
  candidate**. Same class as the sorter defect, same one-line fix
  (`if (isMinor(student)) return;`), different area's file. Also check
  `recruitment.test.ts` for the sorter's silence pattern — its factory
  (`:8`) takes `isChild` and `age` as *independent* parameters defaulting to
  `(_, 30)`, so the mismatch case is constructible but almost certainly never
  constructed.
* **H3-d — the mechanism, generalised.** `NewsletterArchitect.test.tsx`
  whole-module-mocked `pco`, which would have stubbed `isMinor` and kept the
  suite green through a regression of the guarantee. Any `vi.mock` of a module
  that also exports a safety predicate should use `importOriginal`. Worth one
  grep by whoever owns test hygiene; not Area E's to run.
* Explicitly **not** defects, recorded so Round 5 does not churn on them:
  `automations.ts:115` (`age === 18 && isChild` — a disagreement detector,
  must read raw), `:169` (`age === 0 && isChild`), `:124,139` (the
  `backgroundCheckExpiresAt` clause already implies an adult record; a minor
  with one is itself an anomaly for H2/H3-b, not for `isMinor`), `family.ts:81`
  (declared-role read). `automations.ts:176` (`!isChild && age >= 75`) would
  admit a sentinel-DOB record into elderly care — that is an H2 data-quality
  cost, not a safeguarding one, and does not justify a fix here.

**If Round 5 has budget beyond sign-off, spend it on H3-c then H1** — H3-c is a
one-line fix with a named file and a live minor-safety consequence, and H1 is
the oldest unowned item in the audit.

---

## 6. New ideas — one, and it is a retraction

**N1 is superseded by what shipped. I am withdrawing my own proposal rather
than defending it.** v3's N1 was `src/utils/publishing.ts` →
`isPublishable(person, config)`: a new file, a new module, and a `config`
parameter whose job was to make the vetoed minors-checkbox unbuildable by
construction. `isMinor` (`pco.ts:122-123`) does the actual work in one line,
with no new file, no `config` argument, and no `AppConfig` coupling — and it
already has two callers. The `config` parameter existed to hold a door open for
a feature three critics vetoed and nobody has asked for since. **Building it
now would be adding a parameter to prevent a feature from being added.** N1 is
retired; the ideas it carried survive where they belong — the staleness
documentation and the statement of what the filter *cannot* close are in the
`isMinor` doc comment (`pco.ts:101-121`), not in a plan file.

**N1′ (replacement, and the only new idea claimed this round) — the two-category
rule for `isChild`, as a written convention rather than a module.** §1 F1: reads
that decide *treatment* use `isMinor` and resolve uncertainty to minor; reads
that inspect what a record *claims* use the raw flag and raw age separately so
they can disagree. This is earned by a job no critic's proposal served: v3 and
children's round-4 note both assumed one predicate should absorb every
`isChild` site, and the family-audit test going red is the counterexample.
*Replaces:* N1's proposed module, and the "propagate the predicate everywhere"
reading of H3. *Adds no screen, no route, no control, no file* — it is a
comment already in the tree plus a rule for triaging the remaining sites in §5.

**Still withdrawn:** N2 (Mailchimp/Bulletin export) — reopens the third-party
durable-record risk. N3's "Request this integration" control — scope creep on a
cut; what survives is one static line, which is the absence of an idea.

**If minors' birthdays are ever wanted**, the Round 2 veto and youth's Round 3
amendment stand together: an admin-owned flag solves *access control*, not
*consent*. A single boolean meaning "include all minors" still publishes every
student's name into an artifact that leaves the app with no per-family opt-in —
the vetoed light-switch moved one layer up the stack. It would need
per-student/per-guardian consent tracking. Not in scope, and no code currently
holds a place for it.
