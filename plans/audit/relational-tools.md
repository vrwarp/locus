# Area F — `relational-tools` — Final Report

Features #44–#48: Prayer Partner Match, Small Group Sorter, Locus Public, the
landing/auth/role split, and the data layer. Reviewed over five rounds by a UX
researcher, a church operations director, a youth pastor and a children's
ministry director. All verdicts are final; no question is left open.

Every file and line reference below is verified against the working tree at
commit `0e6a9ec`, with the full suite green: **80 test files, 512 tests**.

---

## Verdict

**Area F is where the audit stopped being about screens.** Two of its five
features are deleted outright — Prayer Partner Match, which pairs a minor with an
adult stranger on a sensitive disclosure and offers a one-click contact reveal,
and Locus Public, an unauthenticated impersonation writer reachable from the
surface marketed as read-only. A third, the Small Group Sorter, survives as a
renamed and rebuilt tool whose 34-second main-thread genetic algorithm becomes a
~2ms bin-pack. The fourth, the data layer, is a straightforward if substantial
fix: no member PII on disk by default, field minimisation enforced at the single
`saveToCache` chokepoint, and a migrated re-key. The fifth — the landing page and
its two-workspace role split — is the finding that matters. **Locus Intelligence
is not a product. It is a second app shell, with its own sidebar, its own layout,
its own pre-credential workspace picker and its own duplicated auth flow, wrapped
around a client-side filter of Core's data.** After five areas' worth of
subtraction there is one write-capable tool left inside it, and after this area's
own cuts there is none. Fold it into Core as a role-gated view and delete the
shell. That conclusion was unanimous across all four critics for four
independent reasons, and it is the class of finding no single-area review could
have produced. It carries one hard precondition, and round 5's job was to attack
that precondition — which it did, successfully: **the guard as originally
specified covered three of the application's six write paths and missed the two
most destructive ones.** The correct guard is one line at the single API
chokepoint, and it is *less* work than the version that was wrong. Ship it first,
then fold.

---

## Per-feature decisions

| # | Feature | Verdict | Rationale | Rounds converged |
|---|---------|---------|-----------|------------------|
| — | **Locus Intelligence as a workspace** | **CUT — fold into Core as a role-gated view** | A duplicated sidebar, layout, auth overlay and pre-credential picker around a permission-scoped filter of Core's own data. Visible only after five areas' subtraction. | 4 (ratified 4/4 in r4, precondition corrected in r5) |
| 44 | Prayer Partner Match | **CUT** | Pairs minors with adult strangers on a sensitive disclosure and reveals contact details in one click. Domain veto from both youth and children's ministry. | 4 |
| 45 | Small Group Sorter → **Life Group Balancer** | **SIMPLIFY** | Safety condition met and shipped (input-time refusal). What remains is a performance and determinism rebuild: LPT bin-pack replaces the genetic algorithm, 34s → ~2ms. | 4 (verdict 3, safety condition closed in r4) |
| 46 | Locus Public | **CUT + write-path guard in the same commit** | An unauthenticated member-impersonation writer, reachable only from the shell marketed as read-only. Deletion is necessary; the guard is what makes it sufficient. | 5 (deletion 4 rounds; guard's *placement* corrected in r5) |
| 47 | Landing / auth / role split | **CUT — subsumed by the fold-in** | The picker asks a pastor to make a product decision before he has authenticated. Relabelling it was fixing the sign on a door that should be removed. | 3 |
| 48 | Data layer | **FIX** | Memory-first by default, minimisation enforced inside `saveToCache`, plaintext fallback removed, KDF re-keyed to `secret` with a migration pass. | 3 (shape), 2 (mechanics) |
| — | Per-user PCO OAuth | **NON-GOAL for this release** | Locus authenticates with one shared org-wide Application ID + Secret. Real per-user OAuth is a v2 project. Named, not implied. | 4/4 in r4 |
| — | `ui-avatars.com` egress | **FIX — shipped** | Seven sites sent member names to a third-party image host. Now a local SVG data URI. | 3 |
| — | Shared `isMinor` predicate + input-time refusal | **FIX — shipped** | `isChild` alone is wrong in both directions; the sorter now refuses rather than silently filtering. | 4 |
| — | Sandbox Mode toggle (owned by Area A) | **CUT the toggle** | A mode an operator can forget they are in is the exact failure the flag was convicted of. Mandatory preview replaces it. | 2, cross-area |

---

## The structural conclusion: fold Locus Intelligence into Locus Core

This is the audit's largest structural finding and it belongs in this area's
report because this area holds its precondition.

### What it is

Locus today ships two application shells. Which one you get is decided by a card
you click on `LandingPage.tsx` **before you have entered any credentials**, and
recorded in a single piece of React state, `userRole`, at `App.tsx:71`. Core
gets `CoreLayout` + `SidebarCore`; Intelligence gets `IntelligenceLayout` +
`SidebarIntelligence`. The branch is one line, `App.tsx:689`:

```
const Layout = userRole === 'core' ? CoreLayout : IntelligenceLayout;
```

Everything else about the two shells is duplicated by hand.

### Why it only became visible in round 4

The fold-in is a **residue** finding. It exists because of what the other areas
removed, not because of anything wrong with any one screen. Area D went to zero
routes. Area E dissolved. Area C cut five of ten. This area cuts Prayer Match and
Locus Public. Nine screens have been deleted across the audit — Global Pulse,
Giving River, Giving Trends, Emergency Alerts, Volunteer Web, Robert Report,
Genealogy, Sermon Sentiment and Sermon Correlator. What is left inside the
Intelligence shell is a long list of read-only analytic views and a "Tools"
section that, once Locus Public is deleted, contains exactly one entry:
Automations, a read-only report. **The shell now wraps nothing that a shell is
for.** No round-1 critique could have found this; it is the arithmetic of five
areas' subtraction.

### Why all four critics agreed, for four different reasons

* **UXR:** no single-area proposal can surface "the second app shell has no job
  left," because no single area owns the shell. Declining to act because a
  finding spans five areas is precisely the wrong reason to decline.
* **Church operations:** somebody has to explain to the executive pastor why one
  tool has two logins. The picker imposes a product decision on him before Locus
  has earned the first one. An audit that finds cross-cutting waste and orphans
  it because "no area owns it" is how two competing internal portals survive for
  years in a real IT shop.
* **Youth ministry:** one fewer login surface is one fewer place for a volunteer
  leader to be confused about which tool they are in on a Wednesday night.
* **Children's ministry, on safety grounds:** two shells around one weak boundary
  is not two levels of protection, and pretending otherwise is what invites "can
  we get children's ministry data in here too." One honestly-scoped boundary
  beats two chrome layers around the same client-side `if`.

### What it saves

An entire duplicated auth flow and app shell. Two sidebars become one
(`SidebarIntelligence.tsx`, 187 lines, deleted). Two layouts become one
(`layouts/IntelligenceLayout.tsx` + its test, deleted). The pre-credential
workspace picker disappears (`LandingPage.tsx` + `.css`, and the early return at
`App.tsx:685-687`). The layout branch at `App.tsx:689` collapses. The "which app
am I in?" question stops existing. `userRole` survives as a role flag on one
shell rather than as a routing concept. **This deletes a product, not a screen.**

### What it costs — stated plainly

1. **The write-path guard becomes the sole control.** Today, Intelligence users
   are partly protected by the accident that write-capable components are not
   mounted in their shell. Folding the shells removes that accident. The guard
   must ship first, with tests, or the fold-in is a net regression. This is a
   hard ordering constraint, not a preference.
2. **Core's sidebar absorbs the surviving report entries.** The role gate must
   **hide**, not grey out, or the cut reads to the user as a longer menu.
3. **The "Locus Intelligence" brand and its copy retire**, along with the
   `v6.1 - Symbiotic Intelligence` footer string. That is a product decision, not
   only an engineering one.
4. **~8 hours in this area.** Areas B–E own most of the surviving report views;
   the *count* of survivors is theirs, the *structure* is this item's and is
   independent of that number.

### The precondition, corrected in round 5

The proposal going into round 5 specified the guard as three `if (userRole !==
'core') throw` statements, at `handleSaveStudent` (`App.tsx:558`),
`executeCommit` (`App.tsx:331`) and `handleSaveStudentBulk` (`App.tsx:480`).
Round 5 was asked to attack the claim that this replaces the mounting accident.
**All four critics rejected it, and the reason is arithmetic rather than
judgement.** There are six write entry points, not three:

| Entry point | Reaches PCO via | Guarded by the original F2? |
|---|---|---|
| `executeCommit` (`App.tsx:331`) | `UpdateStudentCommand.ts:33` | yes |
| `handleSaveStudentBulk` (`App.tsx:480`) | `BatchUpdateCommand.ts:36` | yes |
| `handleSaveStudent` (`App.tsx:558`) | via `executeCommit` | yes |
| `handleArchiveGhosts` (`App.tsx:292`) | `archivePerson` → `pco.ts:445` | **no** |
| `handleFamilySwap` (`App.tsx:412`) | builds its own `BatchUpdateCommand`, `.execute()` at `App.tsx:445` | **no** |
| `handleHistoryUndo` / `handleHistoryRedo` (`App.tsx:649,655`) | `UpdateStudentCommand.ts:43`, `BatchUpdateCommand.ts:51` | **no** |

Worse, **the mounting accident does not currently protect the two unguarded
paths either.** The `userRole === 'core'` fence in `App.tsx` opens at `:982` and
closes at `:1008`; it contains only `SmartFixModal`, `ReviewMode` and
`GoldenRecordModal`. `GhostModal` (`App.tsx:1017-1024`) and `FamilyModal`
(`App.tsx:1026-1031`) are mounted **outside** it, for every role, today. They are
opened by `handleNavigation` (`App.tsx:666-676`), which already branches on
`'ghosts'` and `'families'` — and which is the single `onChangeView` passed to
*both* layouts. The only thing keeping an Intelligence user out of the bulk
archive dialog right now is that `SidebarIntelligence.tsx` has no button that
calls it. `SidebarCore.tsx:74,82` has both. **Merging the sidebars is exactly
what the fold-in does.**

What those two paths do, concretely:

* **Archive** sets `status: 'inactive'` on a live PCO person record, in bulk,
  from a dialog whose primary button is "archive them all"
  (`GhostModal.tsx:68-74`). For a child, "inactive" is the state that determines
  whether their record is findable at the check-in desk on Sunday morning.
* **Family swap** flips the `child` attribute on two people
  (`BatchUpdateCommand.ts:38-40`) with no confirmation step. That field is the
  first term of `isMinor` (`pco.ts:122-123`) — the predicate this area spent
  three rounds getting right and which the sorter's refusal, `sorter.ts:21` and
  `recruitment.ts:96` all depend on. **The one unguarded write path the proposal
  did not even mention is the path that changes who counts as a minor.**

**The correction, agreed 4/4 and cheaper than the version it replaces:** every
write in the application, without exception, funnels through one function —
`updatePerson` (`pco.ts:389`), called by `archivePerson` (`pco.ts:445-446`),
`UpdateStudentCommand.ts:33` and `:43`, and `BatchUpdateCommand.ts:36` and `:51`.
Guard there, once. Pass the role as a **required argument** so the compiler
refuses to build a new write path that forgot it. That is one function and five
call sites, versus three handlers covering half the surface — and it is the
type-level version of the lesson the de-vacuumed test mocks taught: a guard that
a stub can satisfy vacuously is not a guard.

Two secondary conditions came with it. The guard must **fail visibly** — a toast
using the existing pattern, with the same copy discipline as the sorter's refusal
panel — because this area has ruled three separate times that a safety behaviour
with no operator-visible artifact is not a safety behaviour. And
`UndoRedoControls` (`App.tsx:750-755`) currently renders in the global toolbar for
both shells; post-fold it must be gated on the same role flag, or every analytic
screen ships a permanently-disabled pair of buttons in its top-right corner.

**With that amendment, the precondition is genuinely met and the fold-in is safe
to execute. Without it, the fold-in is a net regression on the archive and
family-swap paths.**

### Owner

**Area F.** The write-path guard is the precondition, the guard is Area F's item,
and the area holding the precondition should hold the dependent. Areas B–E supply
the list of surviving report views; they do not each hold a veto on the shell.

---

## The work, in order

Ordered by value-per-effort. The one hard ordering constraint is marked. Roughly
**four working days** total for this area.

| # | Item | Effort | Constraint |
|---|------|--------|------------|
| 1 | Delete Locus Public **and** guard the write path at the chokepoint | ~2h | **Must precede the fold-in** |
| 2 | Delete Prayer Partner Match | ~1h | none |
| 3 | Loaded/total record count in the global toolbar | ~2h | cross-area, unowned |
| 4 | "No third-party requests" regression test | ~1h | none |
| 5 | Rebuild the sorter's solver; rename to Life Group Balancer | ~4h | none |
| 6 | Data layer: memory-first, minimised, migrated re-key | ~7h | re-key pass ships with or before the KDF change |
| 7 | Credential handling: split, indicated, time-bounded | ~4h | after item 1 |
| 8 | Fold Intelligence into Core; retire the picker | ~8h | **after item 1, with tests** |
| 9 | Adult pin / anti-pin on the Balancer | ~3h | **after item 6** |

### 1. Delete Locus Public and guard the write path

Highest value-per-hour remaining, and the precondition for the headline item.
Both halves in one commit.

* Delete `src/components/LocusPublic.tsx`, `.css`, `.test.tsx`; the import at
  `App.tsx:62`; the `currentView === 'locus-public'` arm at `App.tsx:968-972`;
  the nav entry at `SidebarIntelligence.tsx:163-169`.
* Add the role guard **inside `updatePerson` (`pco.ts:389`)**, with the role
  passed as a required argument so every call site must supply it. Update
  `archivePerson` (`pco.ts:445`), `UpdateStudentCommand.ts:33,43` and
  `BatchUpdateCommand.ts:36,51` to thread it through.
* The guard must **fail visibly**, via the existing toast pattern, naming what
  was refused and why. Not a console error, not a bare `throw`.
* Ships with tests that exercise all six entry points, including the archive
  and family-swap paths. A test that mocks the `pco` module wholesale does not
  count — that is precisely how the newsletter leak survived 93 test files.
* **This is load-bearing, not defence in depth.** `LocusPublic.tsx:79` calls
  `onSave`, wired at `App.tsx:970` to `handleSaveStudent` — the *single-record*
  path, which Area A explicitly scopes its batch-write preview out of. The
  confirm dialog would never have fired on this path at all.

### 2. Delete Prayer Partner Match

* Delete `src/components/PrayerMatch.tsx`, `.css`, `.test.tsx`,
  `src/utils/prayer.ts`, `prayer.test.ts`; the import at `App.tsx:29`; the
  `currentView === 'prayer'` arm at `App.tsx:909-913`;
  `SidebarIntelligence.tsx:146-152` and its `SidebarIntelligence.test.tsx`
  assertion.
* **The commit message must state that `Student.prayerTopic` remains ingested and
  cached after this deletion** (`pco.ts:87`, `:300`). Deleting the pairing UI ends
  the introduction risk, not the disclosure risk. **Area D inherits a named
  blocker** covering `pco.ts:18`, `:255`, `:300`.
* Locus should not ingest `prayer_topic` at all, and "dead in production" is not
  a safe answer: `pco.ts:18,255,300` reads a flat `prayer_topic` attribute while
  real PCO custom fields arrive as `field_data` keyed by `field_definition_id`,
  so the machinery is waiting on one mapping line — and `mock-api/data.js:96-128`
  fabricates the field for every persona.

### 3. Loaded/total record count in the global toolbar

Replaces the per-view "Load More Records" button at `App.tsx:813`, which exists
in exactly one of ~45 views. Every analytic screen in Locus silently reports on
at most 500 records of a 5,000-person church (`App.tsx:222`, `maxPages: 5`). One
toolbar element retires that complaint across all six areas. **Four rounds, zero
critic objections, still the highest cross-area value-per-hour item in the audit,
still unowned.**

### 4. "No third-party requests" regression test

A test asserting that no external host appears in `src/`'s outgoing URLs. The
`ui-avatars.com` pattern survived a full round of four critics and one synthesis
before being caught, and nearly survived an in-place rewrite of one of its host
files. **The mechanism, not the fix, is the point.**

### 5. Rebuild the sorter's solver; rename to Life Group Balancer

Turns a 34-second main-thread freeze into ~2ms.

* Replace `sortIntoGroups` with a deterministic LPT bin-pack: households by
  `size` descending, tie-break `averageAge` descending, assign to the least-loaded
  group, break load ties by nearest resulting mean age to the global target.
* Delete `evaluateFitness`, `createRandomChromosome`, `tournamentSelection`,
  `crossover`, `mutate` — retaining `evaluateFitness` as a **test helper proving
  the new solver beats the genetic algorithm on the GA's own objective**.
* Delete the `generations` control (`SmallGroupSorter.tsx:14,61-72`) and
  parameter; delete `isProcessing`, the `setTimeout` wrapper and the
  `NODE_ENV === 'test'` branch (`SmallGroupSorter.tsx:15,25-40`).
* **Keep `minorsInInput`, the disabled-button condition and the `role="alert"`
  panel intact through this refactor** (`SmallGroupSorter.tsx:23,26,76,82-92`).
  They are the shipped safety guard, they are trivially lost in a rewrite of the
  same function, and there must be a test that fails if they go.
* CSV export via the existing `downloadCSV`, flat
  `{ group, name, age, householdId }`.
* Two caveat lines on the results: coverage (`students.length`, and when
  `nextUrl` is non-null, "sorted from N loaded records — not the full roster")
  and stability ("Group assignments can change between runs as households join or
  leave. This is expected, not an error." — LPT is insertion-order-fragile).
* Rename to **Life Group Balancer** (`SidebarIntelligence.tsx:154-160`,
  `SmallGroupSorter.tsx:45-46`). Rename the files in the same commit or not at
  all.
* Still no grade, gender or leader-capacity logic.

### 6. Data layer — memory-first, minimised, migrated

1. **Default: no member PII on disk, at all.** Route `cache.ts`'s people cache
   and `api.ts`'s axios `localforage` store through a persistence switch that
   defaults to an in-memory `Map` scoped to the JS session.
2. **Opt-in: one "Trust this computer" toggle in `ConfigModal.tsx`**, off by
   default, per-device.
3. **Even when trusted, purge automatically.** `beforeunload` +
   `visibilitychange` handlers clearing the IndexedDB stores. Fix `cache.ts`'s
   **lazy** TTL: today an expired entry is deleted only on the next read of that
   same key, so an entry never read again persists indefinitely regardless of its
   5-minute TTL.
4. **Field minimisation enforced inside `saveToCache` (`cache.ts:22`) itself**,
   not at the call sites. `App.tsx:225` and the load-more path both persist **raw
   `PcoPerson` objects** — the `.map(transformPerson)` at `App.tsx:227` runs
   *after* the save, and its output is never what gets written. Strip inside that
   one function: `addresses`, `phone_numbers`, `email_addresses`,
   `background_check_expires_at`, `prayer_topic`, `avatar`. Refetch live via the
   existing `cache: false` pattern (`pco.ts:377`, `:441`) in the views that render
   them. **Acceptance criterion: the "Trust this computer" path calls the *same*
   stripped `saveToCache`. Test it; do not assume it falls out of "one function."**
5. **Remove the plaintext fallback** at `storage.ts:72-77`, `:109`, `:166`.
   Invert whatever `storage.test.ts` asserts about migration.
6. **Move the KDF password from `appId` to `secret`** throughout `storage.ts`
   and `cache.ts`. Four blocking migration requirements:
   * **(a) One-time re-key pass, attempted first.** On load, if a blob fails to
     decrypt under the new `secret`-keyed KDF, attempt the old `appId`-keyed KDF;
     on success, re-encrypt under `secret`. Only after *that* fails does any
     fallback run. Steps 5 and 6 must not ship in one release without this.
   * **(b) No silent reset to defaults.** If re-key fails, the app says so
     visibly and requires acknowledgement.
   * **(c) The config-load effect** (`App.tsx:139-155`, 500ms debounce) must be
     gated on both fields being non-empty and **must not treat "secret not yet
     typed" as "no data exists."**
   * **(d) Test against a production-shaped blob** — real config, populated
     health history, non-zero streak — not a fresh install.
7. **Keep `clearAllLocalData()` and its button**, demoted to the trusted-device
   escape hatch.
8. **Keep the rate limiter unchanged** (`api.ts:37-108`). 4/4 across four rounds.
9. Replace `alert("Failed to load more records.")` (`App.tsx:406`) with the
   existing toast pattern.

### 7. Credential handling — split, indicated, time-bounded

* Persist `appId` and `userRole` to `localStorage`; keep `secret` **in memory
  only**, cleared on refresh. With the KDF moving to `secret`, the credential
  overlay must resolve before config does, and the loading state should say so.
  *(Persisting `userRole` creates no escalation path — it was never a security
  boundary. Editing it in devtools yields a UI claiming elevated access and a
  write that still succeeds or fails on the shared `secret`.)*
* **Trusted-device toggle needs access control and visible state:** a persistent
  visible trusted-state indicator, not a settings checkbox nobody revisits; and
  `userRole === 'core'` to enable it. A front-desk kiosk and the admin's laptop do
  not carry the same risk.
* **Idle timeout, 15–30 minutes**, clearing `secret` from memory and re-showing
  the prompt. A memory-only secret protects against the machine being off; it does
  nothing for an unlocked, unattended tab in an office interrupted every four
  minutes.
* Add "Sign out" to the **surviving** layout footer (post-fold, `CoreLayout`):
  clears `secret` and `userRole`, calls `clearAllLocalData()`, resets
  `currentView`.
* Fix the auth-overlay flash (`App.tsx:696`): the condition becomes
  `apiStatus !== 'ok'`.
* Overlay copy: two bare inputs today, with no link to where in Planning Center
  to generate a token, no format example and no escape hatch. Add a deep link and
  a format example.
* Error messaging: only 401 gets a real message (`pco.ts:481-483`); network,
  CORS, DNS and PCO-outage failures fall through to a raw `e.message`
  (`App.tsx:196`). This becomes more urgent once item 6 adds purge and re-key
  failure surfaces.

### 8. Fold Intelligence into Core; retire the picker

Rationale, cost and saving above. Ships after item 1, with tests.

* **Delete** `src/components/LandingPage.tsx` + `.css`,
  `src/components/SidebarIntelligence.tsx` + `.test.tsx`,
  `src/layouts/IntelligenceLayout.tsx` + `.test.tsx`; the imports at
  `App.tsx:55` and `:57`; the `return <LandingPage .../>` at `App.tsx:685-687`;
  and the layout branch at `App.tsx:689`.
* **Move** the surviving read-only views into `CoreLayout`'s sidebar under a
  role-gated section that **hides** rather than disables. Areas B–E determine how
  many analytic entries survive; this item's structure is independent of that
  number.
* Gate `UndoRedoControls` (`App.tsx:750-755`) on the same role flag.
* **The commit message must carry the security sentence** (below): the role gate
  is a UI convenience, not a security boundary, until per-user PCO OAuth ships —
  and the folded-in view is not to be described as "Viewer-safe" for children's
  records.
* Retire the "Locus Intelligence" brand and the `v6.1 - Symbiotic Intelligence`
  footer string (`SidebarIntelligence.tsx:13,183`).

### 9. Adult pin / anti-pin on the Life Group Balancer

Keep a leader with their co-leader; keep apart a couple who just left a group over
a conflict. PCO Groups has no constraint-based assignment, so this is not
duplication. In scope, **after** the data layer rebuild, with four conditions —
one from each critic:

1. **A "your pins" panel inside the Balancer** — not a new nav entry — listing
   every active pin and whether it *applied* in the last run. A pin that could not
   be honoured (both parties not in the loaded roster, or the record dropped by the
   memory-first cache) must say so on the result. A pin that silently stops working
   is the same failure as a household that silently gets dropped.
2. **No free-text reason field, ever.** A pin is two person IDs and a direction
   (together / apart), plus an owner and a timestamp so the question "who decided
   this and when" has an answer. **Ninety-day expiry, or re-confirm** — a
   keep-apart from two years ago is stale pastoral information being enforced by
   software after the situation resolved.
3. **Pins are re-evaluated against `isMinor` at run time, not at creation time**,
   and the pin feature never becomes the reason anyone relaxes the sorter's
   input-time refusal. A request to soften that refusal so the tool can handle
   student groups is exactly the request the refusal exists to decline; the answer
   is a separate tool built to a youth-ministry policy.
4. **Pins never appear in an export.** The CSV added in item 5 must not carry
   them, and neither must any "why do the groups look like this" report. Church
   spreadsheets get emailed, forwarded and left on shared drives; a file leaving
   the building that names two members who must be kept apart is not acceptable.

### What Area F requires on top of Area A's `<BatchWriteConfirm>`

No new build; four constraints on someone else's component.

1. **The preview does not cover Locus Public's write path and must not be
   credited with doing so.** `LocusPublic.tsx:79` → `App.tsx:970` →
   `handleSaveStudent`, the single-record path Area A rules out of scope. The
   chokepoint guard is the only control there, and it ships regardless of Area A's
   sequencing.
2. **`<BatchWriteConfirm>` must read its before-state from the in-memory
   `students` array, never from `loadFromCache`** — otherwise the data layer's
   stripped contact fields render blank "before" values and the operator reviews a
   diff that is wrong *in the direction of looking safe*.
3. **The family swap is an unclassified batch write.** `handleFamilySwap`
   (`App.tsx:412`) changes two PCO records with no confirmation of any kind
   (`App.tsx:1030`). It is a batch of two that nobody counted as a batch. Area A
   should name it alongside `LocusPublic.tsx:79`.
4. **`pco.test.ts:254,276,698` assert that the `X-Locus-Sandbox` header is
   injected.** Those tests encode the bug. They must be rewritten to assert **zero
   requests issued**. Area A's proposal does not name them.

---

## Security posture — stated plainly

**The role split is a UI convenience, not a security boundary. It never was one,
and nothing in this work list makes it one.**

Locus authenticates to Planning Center with a single shared Application ID +
Secret pair via HTTP Basic auth, for the whole organisation
(`App.tsx:92`, `:182`). That credential is Manager-equivalent for every user
regardless of which card they clicked on the landing page. `userRole` is one
piece of React state (`App.tsx:71`) set by that click. A user labelled
"Intelligence" who opens devtools holds exactly the same write credential as core
staff.

Three consequences, all deliberate:

1. **Per-user PCO OAuth is an explicit non-goal for this release.** Provisioning,
   token refresh, mapping PCO Viewer/Manager roles onto Locus roles, and explaining
   to a volunteer why their PCO login now also logs them into Locus — that is a
   project of its own and a v2-of-the-product decision. It is named here as a
   target so that no phrasing anywhere implies it already exists. The role gate
   stops being a convenience and starts being a boundary on the day OAuth ships,
   and not before.
2. **The chokepoint guard prevents an accident, not a person.** It runs in the
   browser. Anyone who can open devtools can call `updatePerson` directly. It is
   worth building — it closes the gap the fold-in opens, it is cheap, and a
   required role argument makes it hard to forget on a future write path — but it
   must never be described as access control. It will *feel* like a boundary to
   whoever writes the release notes; it is not one.
3. **The folded-in view must never be described as "Viewer-safe" or
   "read-only-safe" for children's records.** This is a labelling prohibition with
   domain-veto weight, not a documentation nicety. Addresses, background-check
   status and allergy-adjacent fields are gated client-side only, on the same
   shared secret. The concrete harm: a church hands an "Intelligence" login to an
   outside volunteer coordinator or a part-time comms person *because the picker
   made it feel like a lesser, safer account*, and that person holds the same write
   credential as the children's director. The fold-in does not create this hole —
   it removes the last security-by-obscurity layer that was concealing it, which is
   why saying so out loud is part of the work.

A related finding, recorded for whoever builds the folded shell: the eventual
information architecture must be designed for a *cosmetic* gate, not a real one.
A real permission boundary supports a structural gate — a Viewer login can only
ever reach gated content, so the gate can be a different login screen. A cosmetic
one cannot. Do not design around a boundary that does not exist.

---

## Already shipped

Landed and committed during the review, with the full suite green (80 files, 512
tests). Not pending work.

| Item | Evidence |
|---|---|
| **`ui-avatars.com` egress removed at all seven sites** | `grep -rn ui-avatars src/` returns one hit: a comment at `src/utils/avatar.ts:28` recording what the code used to be. `initialsAvatar` (`avatar.ts:32-49`) renders a local SVG data URI; every call site keeps its `member.avatarUrl ||` short-circuit so PCO-hosted avatars still load. Member names were being sent to a third-party image host on every render. |
| **Shared `isMinor` predicate, unit-tested** | `pco.ts:122-123` — `person.isChild \|\| person.age < 18 \|\| person.age > 110` — with a doc comment (`:104-121`) explaining why `isChild` alone is insufficient in *both* directions (the teenager nobody flagged reads as an adult; last year's graduate is still marked a kid), why an upper age bound is needed to catch placeholder birthdates, and why the family audit must *not* use it. |
| **`sorter.ts` consumes it** | `sorter.ts:1,21` — `buildHouseholds` filters `students.filter(s => !isMinor(s))`, replacing a bare `!s.isChild`. Necessary, never sufficient. |
| **The sorter refuses at input rather than filtering silently** | `SmallGroupSorter.tsx:23` computes `students.filter(isMinor)`; `:26` returns early; `:76` disables the run button; `:82-92` renders a `role="alert"` panel naming the count and stating that the tool will not sort a list containing minors **and will not quietly leave them out either**, because grouping students needs leader ratios and keep-apart rules it does not have. No partial output. |
| **`recruitment.ts` had the same gap on the way out** | `recruitment.ts:96` — `if (isMinor(student)) return;`. Its candidate list previously excluded on the child flag alone, so a teenager nobody remembered to flag arrived on a staff member's "ask them about serving" list. Found only because the shared predicate made it greppable. |
| **Component tests no longer stub the whole `pco` module** | Seven test files now use `vi.mock('../utils/pco', async (importOriginal) => ({...}))` and mock only the network calls. Wholesale module stubs let a pure predicate that the minor guards depend on be replaced with `undefined` while the tests still passed — which is how a data leak survived 93 test files. |

### The area's signature defect, for whoever reviews this code next

Three separate features in this area were caught doing the same thing: **a safety
behaviour with no visible artifact.** The sandbox flag that silently simulated
writes. The synthesised dry-run that showed a diff it had not computed. The
hardened filter that silently dropped a minor from a group list — where a shorter
roster looks exactly like "not everyone signed up this week," which is the normal,
unremarkable case. Round 5 found a fourth: a write guard that fails by doing
nothing.

The ruling, made three times against three different features and now standing as
the area's rule: **a safety behaviour with no visible artifact is not a safety
behaviour; it is a silent behaviour that happens to be safe today.** The first
thing any future reviewer should grep for in this codebase is: *what does this
control show the operator?*

---

## What we could not settle

**Whether the surviving analytic views justify the folded-in section at all.**
This area established that the Intelligence *shell* has no job. It did not
establish that its contents do. That question belongs to Areas B–E view by view,
and the fold-in is deliberately structured to be indifferent to their answer — if
they cut everything, the role-gated section is empty and disappears; if they keep
fifteen entries, it is a long section. Either way the shell goes. But nobody in
this loop can tell you how long that sidebar will actually be.

**Whether a keep-apart pin should survive six months.** UXR wanted to know
whether a leader who sets one in January expects it to still be live in June, or
expects to be re-asked. The ninety-day expiry in item 9 is the operations
director's judgement, not an observed preference. It is the kind of thing one
session with two real small-group leaders would settle, and no amount of code
reading will.

**Plausibly-wrong dates of birth.** `isMinor` catches `age < 18` and the
implausible-record case at `age > 110`, but not a guessed "2000" on a child born
in 2011. No per-feature guard closes this; it is a data-quality problem that runs
underneath every age-derived decision in the product, including the sorter's
refusal. Routed to core hygiene as a standing caveat rather than solved.

**Bulk-archive error reporting.** `handleArchiveGhosts` (`App.tsx:292-332`)
swallows per-record failures to `console.error` (`:302`) and reports its outcome
with `alert()` (`:324,326`). A bulk archive that half-succeeds tells the operator
a count and nothing else — which members failed, and why, is not recoverable from
the UI. Flagged in round 5, not blocked on, not scheduled. It is the same defect
shape as the rest of this area and it will need fixing.

**Whether the fold-in survives contact with the "Locus Intelligence" brand.**
Retiring a product name is a commercial decision made by people who were not in
this loop. The engineering case is unanimous and the ordering constraint is now
correctly specified. If the brand has to stay, it stays as a section heading
inside one shell — but that is a decision this audit can recommend and cannot
make.
