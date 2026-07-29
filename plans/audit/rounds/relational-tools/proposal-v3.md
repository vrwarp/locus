# Area F — relational-tools — Proposal v3 (Round 3 synthesis)

Synthesis of `r3-uxr.md`, `r3-church-admin.md`, `r3-youth.md`, `r3-children.md`
against `proposal-v2.md`. Items surviving two or more rounds unchanged are
**CONVERGED**. Round 3 is where this area's headline item (Sandbox) leaves the
area entirely and where its structural conclusion (Intelligence) is stated.

---

## 1. Changes since v2

### Q5 is settled against me. F1 is superseded, not amended. [DARLING KILLED]

All four critics ruled the same way and none of them ruled for my F1. **Delete
the standing Sandbox toggle; adopt Area A's mandatory per-record before/after
preview inside every batch-write confirm dialog.** v1 and v2 spent two rounds
establishing that "a control depending on a human remembering to click it is not
a control in this codebase" and then proposed to fix `sandboxMode` by making the
remembered-mode work. r3-uxr's sentence is the one that closes it: *v2's own F1
rationale already convicts this shape; it just didn't apply the sentence to
itself.* r3-church-admin adds the office version — a mode is one more piece of
state to track across a session, and PCO's own bulk pattern (Lists, Workflows,
mass-update) is preview-then-confirm at the moment of the write, never a mode set
earlier. Locus should not invent a second pattern next to the one staff know.

**Area A has already specified the implementation and this proposal does not
re-specify it.** See `plans/audit/rounds/core-hygiene/proposal-v3.md` §3.2: the
`dryRun` intercept in `updatePerson` (`pco.ts:365`, replacing the
`X-Locus-Sandbox` no-op at `:372-374`), inherited by `archivePerson`
(`pco.ts:421`); deletion of the checkbox (`ConfigModal.tsx:150-153`, plus
`:21,37,55`), the type field (`storage.ts:15`) and the standing banner
(`App.tsx:681`), after which `App.tsx:307,356,442,528` stop reading
`config.sandboxMode`; and one shared `<BatchWriteConfirm>` serving both bulk
paths with the full per-record list and `isChild` rows sectioned above the fold.
**Area F's v2 F1 is struck.** What Area F additionally requires is in §3 F1'.

### Q5's residual gap, recorded honestly rather than resolved

Neither shape exercises PCO's validation. The three critics split usefully and
the split is the answer:

* **r3-uxr:** neither the short-circuit nor a diff-only dialog closes it, so it
  is an additive enhancement to Area A's dialog (a validation pass feeding the
  same UI), not grounds to keep a rememberable mode.
* **r3-church-admin:** what breaks trust in an office is not a 422 — that is
  visible and recoverable — it is a batch nobody looked at going out. Label the
  dialog *"This is what will change. Nothing has been sent to Planning Center
  yet"* and **do not claim it predicts a PCO rejection.** Most person-write
  endpoints have no dry-run call to make.
* **r3-children:** a local-only preview is untrustworthy for batches touching
  child records **without a real per-record diff with children called out
  separately** — which is exactly what Area A §3.2(2)(3) specifies. Their
  objection is therefore satisfied by the adopted shape; what survives is the
  validation gap alone, not the preview's adequacy.

**Recorded residual, product-wide:** the confirm dialog is a *review* control,
not a *validation* control. A malformed `household_id` or a guardian relationship
PCO would reject still reads clean until the live write. This is stated in the
dialog copy and carried as a known gap, not as future-work vapour.

### UXR's structural finding is promoted above this area

r3-uxr verified the end state and it is bigger than #44-#48: with Area D at zero
routes, Area E dissolving, and #44/#46 deleted here, the "Tools" section of
`SidebarIntelligence.tsx:204-224` contains only Automations and Emergency Alerts,
**both read-only report components** (neither takes `onSave` or calls a PCO
write). What remains of Intelligence is 20-odd read-only analytic nav entries
plus **duplicated app chrome**: a second sidebar (`SidebarIntelligence.tsx`), a
second layout (`layouts/IntelligenceLayout.tsx`), a second auth overlay path, and
a workspace picker (`LandingPage.tsx`) rendered *before any credential exists*.

**Finding, stated as the structural conclusion this audit has been converging
on: Intelligence no longer justifies being a separate workspace. Fold it into
Core as a role-gated view and retire the picker.** Its original job — "read-only
executive view, walled off from write risk" — is done more honestly and more
completely by F2's function-level `userRole !== 'core'` guard than by a second
app shell. See §3 F9 for cost and saving.

### Adopted without argument

* **r3-church-admin's KDF migration requirement** (F7 item 6, rewritten).
* **r3-church-admin's two surviving objections** on the trusted-device toggle and
  the unattended tab (F8).
* **r3-children's minimisation list**, moved *inside* `saveToCache` so it governs
  the opt-in path too, and extended with `avatar` (F7 item 4).
* **r3-youth's final refusal form** for #45, extended with the `age > 110`
  placeholder-DOB upper bound (F5).

### One item is DONE, not pending

**`ui-avatars.com` egress is fixed.** Verified in source this round: `grep -rn
ui-avatars src/` returns exactly one hit, a comment in `src/utils/avatar.ts:28`
recording what the code used to be. All seven call sites across six components
(`PrayerMatch.tsx:66,88`, `SmallGroupSorter.tsx:91`, `BurnoutReport.tsx:85`,
`MissingVolunteersReport.tsx:82`, `DriftReport.tsx:87`,
`RecruitmentReport.tsx:86`) now render initials locally from a data URI via
`initialsAvatar` (`src/utils/avatar.ts:32`), each preserving the
`member.avatarUrl ||` short-circuit so PCO-hosted avatars still load. **CONVERGED
and DONE.** The only residue is Idea 3's regression test, which is still worth
shipping precisely because this finding was dropped once already.

---

## 2. Per-feature decisions

| # | Feature | Verdict | Rationale | CONVERGED? |
|---|---------|---------|-----------|-----------|
| — | **Sandbox Mode** (owned by Area A) | **CUT the toggle; preview replaces it** | A mode an operator can forget they are in is the exact failure `sandboxMode` was convicted of. 4/4 r3. Area A owns the build. | **Y — 4/4 r3, unanimous across two areas** |
| 44 | Prayer Partner Match | **CUT** | Pairs minors with adult strangers on a sensitive disclosure; one-click contact reveal. Domain veto ×2, unchanged 3 rounds. | **Y — 3 rounds, 4/4** |
| 45 | Small Group Sorter → **Life Group Balancer** | **SIMPLIFY, conditional on the minor-refusal guard** → CUT without it | Job real, GA strictly dominated on its own fitness function; `isChild` is a stale staffer-set flag so "adults only" is an assertion until the guard exists. Refusal form now final. | **Y — verdict and guard stable 2 rounds; r3-youth "no surviving objection"** |
| 46 | Locus Public | **CUT + write-path guard in the same commit** | Unauthenticated impersonation writer reachable only from the surface marketed read-only. Deletion necessary, guard makes it sufficient. | **Y — 3 rounds, 4/4, both halves** |
| 47 | Workspace picker | **CUT — folded into Core** *(was FIX)* | Escalated this round: it is a picker for a workspace that no longer earns separate existence. Relabelling it was fixing the sign on a door that should be removed. | **N — new verdict this round** |
| 48 | Data layer | **FIX — memory-first + minimisation inside `saveToCache` + migrated re-key** | Shape converged 2 rounds; r3 closed the two open mechanics (strip location, KDF migration). | **Y on shape — 2 rounds; N on the two new mechanics** |
| — | `ui-avatars.com` egress | **FIX — DONE** | Seven call sites now render locally from a data URI. Verified in source. | **Y — DONE, verify-only from here** |
| — | Intelligence as a workspace | **CUT — fold into Core as a role-gated view** | Duplicated sidebar, layout, auth overlay and picker around a permission-scoped filter of Core's data. Cross-area; needs an audit-level ratification. | **N — new this round, 1 critic + audit-wide convergence** |

---

## 3. The concrete work, ordered by value-per-effort

F1' and F2 are the same commit-sized hazard removals as before; F9 is the large
structural item and deliberately last in effort order, not in importance.

### F1'. What Area F requires *on top of* Area A's `<BatchWriteConfirm>`
*~0h of new build. Three constraints that make Area A's component correct for
this area's paths. Do not re-specify the component.*

1. **The preview does not cover #46's write path, and must not be credited
   with doing so.** Area A scopes preview to batch writes and explicitly rules
   single-record writes out (a Review Mode Fix is covered by the 5-second
   never-written window instead). `LocusPublic.tsx:79` calls `onSave`, wired at
   `App.tsx:998` to **`handleSaveStudent`** — the single-record path. So the
   confirm dialog would never have fired on the unauthenticated writer at all.
   **F2's function-level `userRole !== 'core'` guard is not belt-and-braces on
   top of the preview; on this path it is the only control.** It ships regardless
   of Area A's sequencing.
2. **Ordering against F7's minimisation.** The dialog renders `before → after`
   for contact fields. F7 strips `addresses`, `phone_numbers` and
   `email_addresses` at the cache boundary. If the diff sources its "before"
   from cache rather than from the in-memory `Student` array, it renders blank
   before-values and the operator reviews a diff that is wrong in the direction
   of looking safe. **Acceptance criterion: `<BatchWriteConfirm>` reads its
   before-state from in-memory `students`, never from `loadFromCache`.**
3. **#45 gets no benefit from the preview and still needs F5.** The sorter has no
   write path; its minor-safety failure is an *output* leak into a
   cross-generational group, upstream of any dialog. Do not let "we built the
   preview" retire F5.

Also carried: `pco.test.ts:254,276,698` assert the `X-Locus-Sandbox` header is
injected — those tests encode the bug and must be rewritten to assert **zero
requests issued**, not a header comparison. Area A's §3.2 does not name them.

### F2. Delete Locus Public **and** guard the write path
*~2h. CONVERGED, unchanged from v2. Highest value-per-hour remaining.*

* Delete `src/components/LocusPublic.tsx`, `.css`, `.test.tsx`; `App.tsx:70`
  (import); the `currentView === 'locus-public'` arm at `App.tsx:996-1000`;
  `SidebarIntelligence.tsx:205-212`.
* **Same commit:** hard guard at the top of `handleSaveStudent`
  (`App.tsx:546`), `executeCommit` (`App.tsx:339`) and `handleSaveStudentBulk`
  (`App.tsx:488`): `if (userRole !== 'core') throw new Error(...)`. Independent
  of the calling component. This is the difference between "no button happens to
  be mounted" and "the write path refuses" — and per F1'(1) it is load-bearing,
  not defence in depth.
* **Raised in priority by F9:** if Intelligence folds into Core, the "no button
  is mounted" incidental protection disappears entirely for every report view.
  The guard must land before F9, with tests, not alongside it.

### F3. Delete Prayer Partner Match
*~1h. CONVERGED, unchanged.*

* Delete `src/components/PrayerMatch.tsx`, `.css`, `.test.tsx`,
  `src/utils/prayer.ts`, `prayer.test.ts`; `App.tsx:36`; the `currentView ===
  'prayer'` arm at `App.tsx:926-930`; `SidebarIntelligence.tsx:188-194` and its
  assertion in `SidebarIntelligence.test.tsx`.
* Commit message must state that `Student.prayerTopic` (`pco.ts:87,276`)
  **remains ingested and cached** after this deletion. Deleting the pairing UI
  ends the introduction risk, not the disclosure risk. Area D inherits a named
  blocker covering `pco.ts:18,231,276`.
* Q1 stays settled: Locus should not ingest `prayer_topic` at all. "Dead in
  production" is not safe — `pco.ts:18,231,276` reads a flat `prayer_topic`
  attribute while real PCO custom fields arrive as `field_data` keyed by
  `field_definition_id`, so the machinery waits on one mapping line, and
  `mock-api/data.js:96-128` fabricates the field for every persona so any demo
  off the mock server produces real-looking cross-generational pairings.

### F5. #45 — the minor-refusal guard *(final form; ships even if F6 does not)*
*~1h. r3-youth reports no surviving objection on #45.*

* **Delete `sorter.ts:21`** — `students.filter(s => !s.isChild)` inside
  `buildHouseholds`. Verified in source this round. It runs before any age check
  exists in the file, so a guard placed anywhere else never fires: the minors are
  stripped from the input, the group list comes back one household short, and the
  operator reads that as a clean roster. **Load-bearing, not cosmetic.**
* Refuse at **input time**, on the `students` array before `buildHouseholds`, if
  any record satisfies `isChild === true || age < 18 || age > 110`.
* **The `age > 110` bound is new this round (r3-youth).** A placeholder DOB like
  `1900-01-01` is the standard "unknown DOB" ChMS convention and is a *valid*
  birthdate string: `transformPerson` accepts it, `differenceInYears` returns
  ~126, and `age < 18` is false. A real minor with a placeholder birthdate sails
  through as a 126-year-old adult into a cross-generational group. Same failure
  the newsletter fix closed with `age <= 110`; same response — implausibly old
  and implausibly young both mean "this record's age cannot be trusted to gate a
  minor-safety check."
* **Presentation:** a full-stop error state in `SmallGroupSorter.tsx`, not a
  toast, naming the count and the reason, with **no partial group output
  alongside it** — *"N records in this roster are minors or household children
  (isChild, age < 18, or an implausible age). This tool sorts adult small groups
  only — remove them from the source view and re-run."*
* `age` needs no null-handling: `transformPerson` returns `null` for any record
  without a valid `birthdate` (`pco.ts:233-239`), so every `Student` in the app
  has a birthdate-derived age (`pco.ts:243`).

### F6. Rebuild the sorter's solver; rename
*~4h. CONVERGED, unchanged from v2. Turns a 34s main-thread freeze into ~2ms.*

* Replace `sortIntoGroups` (`sorter.ts:111-189`) with deterministic LPT
  bin-pack: households by `size` desc, tie-break `averageAge` desc, assign to
  least-loaded group, break load ties by nearest resulting mean age to the global
  target.
* Delete `evaluateFitness`, `createRandomChromosome`, `tournamentSelection`,
  `crossover`, `mutate` (`sorter.ts:52-105`) — retain `evaluateFitness` as a test
  helper proving the new solver's balance on the GA's own objective.
* Delete the `generations` control (`SmallGroupSorter.tsx:12,51-62`) and
  parameter (`sorter.ts:114`); delete `isProcessing`, the `setTimeout` wrapper and
  the `NODE_ENV === 'test'` branch (`SmallGroupSorter.tsx:13,16-30`).
* CSV export via existing `downloadCSV` (`src/utils/export.ts`), flat
  `{ group, name, age, householdId }`.
* Two caveat lines: coverage (`students.length`, and when `nextUrl` is non-null,
  "sorted from N loaded records — not the full roster") and stability ("Group
  assignments can change between runs as households join or leave. This is
  expected, not an error." — LPT is insertion-order-fragile).
* Rename to **Life Group Balancer** (`SidebarIntelligence.tsx:196-202`,
  `SmallGroupSorter.tsx:35-36`); rename files in the same commit or not at all.
* Still no grade/gender/leader-capacity logic. See §4 Q2.

### F7. Data layer — memory-first, minimised at the choke point, migrated
*~7h (up from 6: the re-key pass is real work). Shape CONVERGED; two mechanics
newly closed this round.*

1. **Default: no member PII on disk, at all.** Route `cache.ts`'s people cache
   and `api.ts`'s axios `localforage` store through a persistence switch
   defaulting to an in-memory `Map` scoped to the JS session. Does not depend on
   F8's logout control shipping first.
2. **Opt-in: one "Trust this computer" toggle in `ConfigModal.tsx`**, off by
   default, per-device. Only when on does anything persist past tab close.
3. **Even when trusted, purge automatically.** `beforeunload` +
   `visibilitychange` handlers clearing the IndexedDB stores, and fix
   `cache.ts:44-47`'s **lazy** TTL — today an expired entry is deleted only on
   the next read of that same key, so an entry never read again persists on disk
   indefinitely regardless of its 5-minute TTL.
4. **Field minimisation — [CHANGED, r3-children] enforced inside `saveToCache`
   itself, not at the call sites.** Verified: `App.tsx:217-233` and
   `App.tsx:403` both persist **raw `PcoPerson`** objects — the
   `.map(transformPerson)` that produces `Student` runs *after* the save and its
   output is never what is written. Both threads run through the one
   `saveToCache` in `cache.ts`, which is the only choke point. Strip, inside that
   function: **`addresses`** (`pco.ts:25`), **`phone_numbers`** (`:24`),
   **`email_addresses`** (`:23`), **`background_check_expires_at`** (`:17`),
   **`prayer_topic`** (`:18`), and **`avatar`** (new this round — PCO-hosted so
   fetching it for display is fine, but the URL is a link to a minor's photo and
   the `Student` view that needs it can hold it in memory for the session).
   Refetch live via the existing `cache: false` pattern (`pco.ts:353,430`) in the
   views that render them.
   **Acceptance criterion, explicit (r3-children's surviving objection):** the
   "Trust this computer" path must call the *same* stripped `saveToCache`, not a
   raw write that bypasses it. The opt-in is about surviving a tab close, not
   about widening what gets persisted. Test it, do not assume it falls out of
   "one function."
5. **Remove the plaintext fallback** at `storage.ts:73-77, 108-112, 165-169`.
   Invert whatever `storage.test.ts` asserts about migration.
6. **KDF password `appId` → `secret`** at `storage.ts:64,91,105,132,163,194` and
   `cache.ts:26,51`. **[REWRITTEN — r3-church-admin] Four migration requirements,
   all blocking:**
   * **(a) One-time re-key pass, attempted first.** On load, if a blob exists and
     fails to decrypt under the new `secret`-keyed KDF, attempt decrypt under the
     old `appId`-keyed KDF; on success, re-encrypt under `secret` and proceed.
     **Only after that attempt fails does any fallback path run.** (5) and (6)
     must not ship in the same release without this step.
   * **(b) No silent reset to defaults.** If re-key fails, the app says so
     explicitly and visibly — "We couldn't read your saved settings; you'll need
     to reconnect and your streak will restart" — and requires it be seen. A
     third silent safety behaviour that happens to be a data-loss path instead of
     a plaintext-storage path is not progress.
   * **(c) The `[appId]` → `[appId, secret]` effect** (`App.tsx:143-162`, 500ms
     debounce, currently fires while the user types the app ID) must be gated on
     both fields non-empty, and **must not treat "secret not yet typed" as "no
     data exists."** Reading "no blob for this key" mid-retype and concluding
     "new user" reads to the operator as "my history is gone" while the blob sits
     intact under the old key.
   * **(d) Test against a production-shaped blob** — real config, populated
     health history, non-zero streak — not a fresh-install empty state. The empty
     state is the one path this change cannot break by definition.
   * Stakes, in the admin's words: the config blob is the Application ID and
     Secret Sarah had to get IT or the account owner to issue. Nobody files a
     ticket for "the app forgot my settings"; they stop opening it.
7. **Keep `clearAllLocalData()` and the button — demoted** to the trusted-device
   escape hatch rather than the front line.
8. **Keep the rate limiter unchanged** (`api.ts:37-108`). 4/4 across three rounds.
9. Replace `alert("Failed to load more records.")` (`App.tsx:414`) with the
   existing toast pattern.

### F8. Credential handling — split, indicated, and time-bounded
*~4h (up from 3). Ships after F2's guard, never before. Note: the picker-rename
half of v2's F8 is superseded by F9.*

* Persist `appId` and `userRole` to `localStorage`; keep `secret` **in-memory
  only**, cleared on refresh. With the KDF moving to `secret`, config cannot load
  from a persisted `appId` alone, so the credential overlay must resolve before
  config does — correct behaviour, and the loading state should say so.
  *(r3-church-admin heads off a non-issue: persisting `userRole` creates no
  privilege-escalation path, because it was never a security boundary — `secret`
  is what makes a PCO write succeed and it stays memory-only. Editing `userRole`
  in devtools yields a UI claiming elevated access and a write that still fails
  at PCO. That is the Q3 shared-Basic-Auth finding, not a new hole.)*
* **[NEW — r3-church-admin objection 1] The "Trust this computer" toggle needs
  access control and visible state.** As written, anyone reaching `ConfigModal`
  can flip it, and nothing afterward reminds them the machine now holds
  congregation data across sessions. It is exactly as likely to get flipped on
  the front-desk kiosk as on Sarah's laptop, and those machines do not carry the
  same risk. Require **(a)** a persistent, visible trusted-state indicator — not
  a settings checkbox nobody revisits — and **(b)** `userRole === 'core'` to
  enable it. Lands with F7/F8; not deferred as polish.
* **[NEW — r3-church-admin objection 2] Idle timeout.** A memory-only `secret`
  protects against the machine being off; it does nothing for an unlocked,
  unattended tab, which is the more common exposure in an office interrupted
  every four minutes. Add a 15-30 minute idle timeout that clears `secret` from
  memory and re-shows the credential prompt. New scope, not a blocker on the
  rest of F8 shipping.
* Add "Sign out / Switch workspace" to the surviving layout footer: clears
  `secret`, `userRole`, calls `clearAllLocalData()`, resets `currentView`.
* Fix the auth-overlay flash (`App.tsx:704`): condition becomes
  `apiStatus !== 'ok'`.
* Overlay copy (`App.tsx:704-733`): two bare inputs today, no link to where in
  Planning Center to generate a token, no format example, no escape hatch. Add a
  deep link and a format example.
* Error messaging: only 401 gets a real message (`pco.ts:481-483`); network,
  CORS, DNS and PCO-outage failures fall through to raw `e.message`
  (`App.tsx:196`). More urgent after F7 adds purge and re-key failure surfaces a
  user must be able to interpret.

### F9. Fold Intelligence into Core; retire the workspace picker
*~8h in this area, but cross-area — Areas B/C/D/E own most of the surviving
report views and this cannot be executed by Area F alone. Needs audit-level
ratification in R4.*

* **Delete** `src/components/LandingPage.tsx` + `.css`,
  `src/components/SidebarIntelligence.tsx` + `.test.tsx`,
  `src/layouts/IntelligenceLayout.tsx` + `.test.tsx`, and the
  `userRole === 'core' ? CoreLayout : IntelligenceLayout` branch at
  `App.tsx:677`. `userRole` survives as a role flag on one shell, not as a
  routing concept.
* **Move** the surviving read-only views into `CoreLayout`'s sidebar under a
  role-gated section that **hides** rather than disables. `SidebarIntelligence`
  currently lists 22 analytic entries plus a 3-entry Tools section; after this
  area's cuts, Tools holds only Automations and Emergency Alerts — both verified
  read-only components taking `students` and rendering, with no `onSave` and no
  PCO write call. Areas B-E determine how many of the 22 survive; F9's structure
  is independent of that number.
* **What it saves:** an entire duplicated auth flow and app shell — two sidebars
  become one, two layouts become one, the pre-credential workspace picker
  disappears, and the "which app am I in" question stops existing. This is a
  navigation-cost cut of a different order than deleting nav entries.
* **What it costs, stated plainly:**
  1. **F2's guard becomes the sole boundary.** Today, Intelligence users are
     partly protected by the accident that write-capable components are not
     mounted in their shell. Fold the shells together and that accident is gone.
     F2 must ship first, with tests, or F9 is a regression.
  2. Core's sidebar absorbs the surviving report entries; the role gate must
     hide, not grey out, or the cut reads as a longer menu.
  3. The "Locus Intelligence" brand and its copy retire — a product decision,
     not only an engineering one.
  4. It is not Area F's to execute unilaterally.
* **Why it is right anyway:** Intelligence's stated job — a read-only executive
  view walled off from write risk — is done better by a function-level guard on
  the write path than by a second app shell, because the guard holds regardless
  of which component is mounted and the shell does not.

---

## 4. Unresolved disagreement — for Rounds 4-5

Genuinely open, not carried for form. **Q1, Q4 and Q5 are closed** (Q1: do not
ingest `prayer_topic`; Q4: one credential exists, so purge work is P0 not
contingent; Q5: mandatory preview, no standing toggle, validation gap recorded).

**Q2 — adult pin/anti-pin on the Life Group Balancer: in scope or not?**
Unchanged from v2 and still unanswered by any r3 critic. The request is *adult*
group pins — keep a leader with their co-leader, keep apart a couple who just
left a group over conflict. That is not safeguarding data and the youth argument
I wrongly extended to it does not dispose of it. My lean remains yes-but-later:
it is a pin-list UI on a solver F6 has not shipped, and F5 makes the input
adults-only by construction, which removes my original objection — but it adds a
persisted who-avoids-whom list to a data layer F7 is still rebuilding, so it must
not land before F7.

**Q3 — is per-user PCO OAuth the named target architecture, or an explicit
non-goal?** Locus uses one shared Application ID + Secret via Basic auth for the
whole org (`App.tsx:100-103`), which is Manager-equivalent for every user
regardless of which card they clicked. A real boundary means the Intelligence
login is a Viewer-scoped PCO user and writes 403 at PCO's own API. **F9 raises
the stakes on this question rather than settling it:** with one shell and one
role flag, "the boundary is a client-side `if`" becomes the whole story. R4 must
name it as target or non-goal — it must not remain implied-to-exist by phrasing.

**Q6 (new) — does F9 belong to this audit's scope, and who executes it?** One
critic named it; the structural argument is strong and the whole audit has been
converging on it; but it spans five areas and no area owns it. R4 must either
ratify it as an audit-level recommendation with an owner, or record it as a
finding the audit declines to act on. Leaving it as an Area F paragraph is the
one outcome that wastes it.

**Q7 (new, flagged not blocking) — plausible-but-wrong DOB.** F5's bounds catch
`age < 18` and `age > 110`, but not a guessed "2000" on a kid born 2011 — the
same residual the newsletter fix left open. r3-youth is right that no per-feature
guard closes it; it is a data-quality problem. Route to core-hygiene as a
standing caveat, not a blocker on F5.

---

## 5. New ideas earned this round

**Idea 1 — CONVERGED, carried unchanged for three rounds: promote the
loaded/total record count into the global toolbar.** *Replaces:* the per-view
"Load More Records" button at `App.tsx:798-804`, which exists in one of ~45
views. *Job:* every analytic screen silently reports on ≤500 records of a
5,000-person church (`App.tsx:230`, `maxPages: 5`). One element at
`App.tsx:733-748` retires that complaint across all six areas. Still the highest
cross-area value-per-hour item in the audit and still unattacked by any critic in
three rounds. **Stop re-proposing it; schedule it.**

**Idea 2 — A "no third-party requests" test, kept even though the fix has
landed.** *Replaces:* nothing now — it guards what F4 already fixed. The
`ui-avatars.com` pattern survived a full round of four critics and one synthesis
before being caught, and was about to survive an in-place rewrite of one of its
host files. A test asserting no external host appears in `src/` outgoing URLs
converts a finding that already got dropped once into one that cannot regress.
The mechanism, not the fix, is the idea — and the fix landing is the argument
for it, not against it.

**Idea 3 — retired.** v2's "persistence switch, not a purge button" is no longer
an idea; it is F7 items 1-3 with acceptance criteria. Folding it back into the
ideas list would be double-counting.

*(No third new idea earned. Three rounds in, the remaining value is in shipping
F2, F5 and F7, and in getting an answer to Q6.)*
