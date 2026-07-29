# Area F — relational-tools — Proposal v1 (Round 1 synthesis)

Synthesis of `r1-uxr.md`, `r1-church-admin.md`, `r1-youth.md`, `r1-children.md`.
Every load-bearing claim below was re-verified against source before being built
on. Corrections to the critics are marked **[CORRECTION]**; findings none of the
four critics made are marked **[NEW]**.

---

## 1. Changes since last round

This is Round 1; there is no prior proposal. What changed is the critics' record.

**Verified and adopted:**

* `src/utils/prayer.ts:9-53` has no `isChild` filter — confirmed. `App.tsx:928`
  passes the unfiltered `students` array. `PrayerMatch.tsx:72,94` render
  `email || phone` and `:65,87` render name+avatar on reveal.
* `sorter.ts:21` does filter `!s.isChild` — confirmed. #45 is adults-only.
* `LocusPublic.tsx:100-111` maps the entire unfiltered `students` array into a
  `<select>`; `handleUpdate:79` → `onSave` → `App.tsx:998` → `handleSaveStudent`
  (`App.tsx:546`) → `executeCommit` → `updatePerson` (`pco.ts:365`). Confirmed.
* `storage.ts:64,91,105,132,163,194` and `cache.ts:26,51` pass `appId` as the
  PBKDF2 password. `crypto.ts` itself is competent (PBKDF2-SHA256 100k, random
  16-byte salt, random 12-byte IV, AES-256-GCM). Wrong password, right primitive.
* `api.ts:16-35` is a second, unencrypted `localforage` HTTP cache, ttl 1h
  (`api.ts:32`). Confirmed. No logout, no purge, anywhere in the codebase.

**[CORRECTION] — critic errors not to propagate:**

1. **r1-youth is wrong that Prayer Match sits behind "logged into Locus Core."**
   `SidebarCore.tsx` has no entry for `prayer`, `small-groups` or `locus-public`
   (grep: zero matches). All three are reachable **only** from
   `SidebarIntelligence.tsx:188-194, 196-202, 205-211`. This makes the finding
   *worse*, not better: the adult-to-minor pairing tool and the impersonation
   writer both live exclusively on the surface `LandingPage.tsx:23-30` sells as
   "Executive Dashboard / Boardroom Ready Analytics." r1-children got this right.
2. **r1-church-admin is wrong that `SmallGroupSorter` uses a "fake 500ms
   setTimeout."** It is 50ms (`SmallGroupSorter.tsx:28`), and it is not
   manufactured latency — it is a paint-flush before a genuinely long synchronous
   block. r1-uxr got this right. The "theater" charge is still sustained, but on
   different evidence (§5 below): the GA is *slower and worse* than a 2ms
   deterministic pass, which is a stronger argument than the one made.
3. **r1-uxr's "cheapest fix" for #45 — "cap Deep Search generations" — is
   unnecessary.** Measured below: fewer generations is not a tradeoff, because
   the GA loses to a deterministic solver at every generation count.

**[NEW] — two findings no critic made, both blocking:**

4. **Sandbox Mode is a placebo.** `pco.ts:371-373` implements `sandboxMode` by
   adding a request header `X-Locus-Sandbox: true` — and then issues the PATCH
   anyway. Nothing consumes that header: `grep -rni sandbox mock-api/` returns
   **zero matches**, and real Planning Center has no such header. So the banner
   at `App.tsx:681-695` — "⚠️ SANDBOX MODE ACTIVE — Changes are simulated" — is
   false: writes land in production PCO with the toggle on. This invalidates
   r1-uxr's and r1-church-admin's proposed repair for #46 ("gate it behind the
   sandbox toggle"). There is no safety net to gate anything behind. Sandbox must
   be fixed or removed before it is cited as mitigation for anything in this area.
5. **The at-rest encryption is not an integrity control and is trivially
   downgraded.** `storage.ts:73-77, 108-112, 165-169` catch a decryption failure
   and fall back to `JSON.parse(stored)`. Anyone who can write to `localStorage`
   can therefore write *plaintext* JSON that the app accepts without any
   authentication of the blob. Combined with the `appId`-as-password defect, the
   config / health-history / gamification encryption defends against nothing and
   cannot be described to a church as "encrypted at rest."

**Converged across all four critics (mark CONVERGED, stop re-litigating):**

* #44 must not pair minors with adults and must not disclose contact info. (4/4)
* #46 must not ship as built. (4/4)
* The Core/Intelligence split is not a permission boundary. (4/4)

---

## 2. Per-feature decisions table

| # | Feature | Verdict | Rationale | Converged? |
|---|---------|---------|-----------|-----------|
| 44 | Prayer Partner Match | **CUT** | Pairs minors with adult strangers on a sensitive disclosure and hands over contact info on one click. Domain veto from both ministry specialists. No persistence, no consent, no action path. Delete the surface; keep nothing. | Y (4/4) |
| 45 | Small Group Sorter | **SIMPLIFY** (keep the job, delete the algorithm) + **rename** | The job is real and PCO-native-free. The genetic algorithm is measurably *worse* than a 2ms deterministic solver on its own fitness function, while blocking the main thread for up to 37s. Salvageable — but only the objective survives, not the implementation. | N (settled here, §5) |
| 46 | Locus Public | **CUT** | An unauthenticated impersonation writer that can select any child by name and PATCH their contact record, reachable only from the surface documented as read-only. Domain veto ×2. Church Center already does the real job. | Y (4/4) |
| 47 | Landing / auth / role split | **FIX** (stop claiming it is a boundary) + **SIMPLIFY** | It is a workspace picker rendered *before* any credential is entered. Honest re-labelling plus a real session boundary (logout + purge). A true permission boundary is out of scope client-side. | Y on diagnosis, N on remedy |
| 48 | Data layer | **FIX** | Two caches, one weakly-keyed and one plaintext, both holding full congregation PII including minors, neither purgeable. Rate limiting is genuinely good and stays. | Y (4/4) |

---

## 3. The concrete work, ordered by value-per-effort

### F1. Delete Prayer Partner Match entirely — **do this first**
*Effort: ~1 hour. Value: removes the area's only safeguarding-critical live path.*

Both ministry specialists independently reached CUT on minor-safety grounds; per
the synthesis rules a domain veto outranks the UX argument that it could survive
as "Prayer Topic Groups" with a CSV export. That argument loses because the
export makes the disclosure *more* portable, not less, and because the underlying
`prayer_topic` custom field is speculative (`mock-api/data.js:96-99` invents it;
it is not a stock PCO field). Do not soften this to a filter — an `!isChild`
guard would fix the minor case and leave adult-stranger pairing on Addiction and
Grief with zero consent, which r1-church-admin correctly calls a harm vector.

* Delete `src/components/PrayerMatch.tsx`, `src/components/PrayerMatch.css`,
  `src/components/PrayerMatch.test.tsx`, `src/utils/prayer.ts`,
  `src/utils/prayer.test.ts`.
* Delete `App.tsx:36` (import) and the `currentView === 'prayer'` arm at
  `App.tsx:926-930`.
* Delete `SidebarIntelligence.tsx:188-194`; update `SidebarIntelligence.test.tsx`
  ("renders all intelligence specific items").
* **Do not delete `Student.prayerTopic`** (`pco.ts:87,276`) in this change —
  `SentimentPulse.tsx` (#36, Area D) also consumes it. Hand Area D the question
  of whether the field should be ingested at all; flag it as a cross-area
  dependency rather than resolving it here.

### F2. Delete Locus Public entirely
*Effort: ~1 hour. Value: removes the only unauthenticated write path in the app.*

r1-uxr offers option (a) "disable Save and label it a preview." That loses: a
preview of a product with no auth model is not a preview of anything, and
`plans/progress.md:95` shows the roadmap intent is to *extend* it to household
restructuring. r1-church-admin's point is decisive — PCO Church Center already
ships this, member-authenticated and free with the plan.

* Delete `src/components/LocusPublic.tsx`, `LocusPublic.css`,
  `LocusPublic.test.tsx`.
* Delete `App.tsx:70` (import) and the `currentView === 'locus-public'` arm at
  `App.tsx:996-1000`.
* Delete `SidebarIntelligence.tsx:204-211` — and the now-empty `Tools` section
  header at `:204` if `automations` is the only remaining child.
* This removes the last consumer of `handleSaveStudent` from the Intelligence
  surface. After F1+F2, `handleSaveStudent` is reachable only from
  `SmartFixModal` / `ReviewMode`, both already gated by
  `userRole === 'core'` (`App.tsx:1010`) — so the read-only claim becomes
  *true by construction* rather than by convention. That is the real prize here
  and the reason F2 outranks the #47/#48 work.

### F3. Fix or remove Sandbox Mode — **blocking, and it blocks other repairs**
*Effort: ~2 hours. Value: the app currently tells users writes are simulated when they are not.*

Mock data presented as insight is a defect; a *safety control* presented as real
when it is inert is strictly worse. Two acceptable outcomes:

* **(preferred) Make it real client-side:** in `pco.ts:365` `updatePerson` and
  `pco.ts:421` `archivePerson`, when `sandboxMode` is true, return the
  synthesised response **without issuing the request**. Keep the header for the
  mock API's benefit if desired, but the short-circuit must be in the client.
  `pco.test.ts:254,276,698` assert the header is injected — those tests encode
  the bug and must be rewritten to assert *no request is issued*.
* **(fallback) Delete it:** remove `sandboxMode` from `storage.ts:15`,
  `ConfigModal.tsx:21,37,55,150`, the banner at `App.tsx:681-695`, and the
  parameter threading at `App.tsx:307,356,442,528`.

Do not ship #47/#48 messaging that references sandbox as a mitigation until this
lands.

### F4. Rebuild the Small Group Sorter's solver; rename the feature
*Effort: ~4 hours. Value: turns a 37-second tab freeze into a 2ms deterministic result that is also more accurate.*

See §5 for the measurements that justify this. Concretely:

* **Replace `sortIntoGroups` (`sorter.ts:111-189`) with a deterministic
  longest-processing-time bin-pack.** Keep the exported signature and
  `buildHouseholds` (`sorter.ts:20-46`) unchanged — households, `!isChild`
  filtering and the `HouseholdInfo`/`SmallGroup` types are all correct and stay.
  Algorithm: sort households by `size` descending (tie-break `averageAge`
  descending for stability); assign each to the currently least-loaded group;
  break ties among equally-loaded groups by whichever group's resulting mean age
  lands closest to the global target mean. Deterministic, O(n log n + nk), no RNG.
* **Delete** `evaluateFitness`, `createRandomChromosome`, `tournamentSelection`,
  `crossover`, `mutate` (`sorter.ts:52-105`). Keep `evaluateFitness` only if it
  is retained as a *test assertion helper* to prove the new solver's balance —
  that is its one remaining honest use.
* **Delete the `generations` control** (`SmallGroupSorter.tsx:12,51-62`) and the
  `generations` parameter (`sorter.ts:114`). "Quick / Balanced / Deep Search" is
  a choice between three worse answers.
* **Delete `isProcessing` and the `setTimeout` wrapper**
  (`SmallGroupSorter.tsx:13,16-30`), including the `NODE_ENV === 'test'` branch
  at `:19-22` which exists solely to work around the timer. A 2ms call needs
  neither. `SmallGroupSorter.test.tsx:79` ("triggers sorting and displays results
  on click") simplifies to a synchronous assertion.
* **Add export**, reusing the existing helper: `import { downloadCSV } from
  '../utils/export'` (`src/utils/export.ts`, already used by
  `DuplicatesReport`, `BurnoutReport`, `MissingVolunteersReport`, `DriftReport`).
  Flatten to `{ group, name, age, householdId }`. This is the one "no way to hand
  the result to anyone" complaint that is cheap to close, and the pattern is
  already established in four sibling components.
* **Add a coverage caveat** to `SmallGroupSorter.tsx` header: render
  `students.length` and, when `nextUrl` is non-null, the text "sorted from N
  loaded records — not the full roster." This requires threading `nextUrl` into
  the component as a new prop from `App.tsx:983`. This is the minimum honest
  disclosure given §F6.
* **Rename** to **Life Group Balancer** (`SidebarIntelligence.tsx:196-202` label,
  `SmallGroupSorter.tsx:35` heading). r1-youth is right that "Small Group Sorter"
  means a student roster in a youth department and this tool cannot produce one.
  Amend the body copy at `SmallGroupSorter.tsx:36` to drop "Genetic algorithm"
  and say what it does: "Balances adult households across N groups by size and
  age." Rename the files in the same commit or not at all — do not leave
  `SmallGroupSorter.tsx` exporting `LifeGroupBalancer`.
* **Do not** add grade / gender / leader-capacity / keep-apart logic here.
  See §4, Q2 — that is a different product and must not be bolted onto this one.

### F5. Make the honesty of the role split match the code (#47)
*Effort: ~3 hours.*

* **Re-label, do not re-architect.** `LandingPage.tsx:8-32` renders *before* any
  credential exists (`App.tsx:673-675` returns it when `!userRole`; the auth
  overlay is inside `Layout` at `App.tsx:704`). It is a workspace picker.
  Rename the inventory row #47 from "Landing / auth / role split" to
  "Workspace picker" and drop "read-only" from `LandingPage.tsx:25-30`
  in favour of "Reporting & analytics views." After F2 the Intelligence surface
  genuinely has no write path — but it is enforced by *there being no write
  component mounted*, not by a permission check, and the copy should not imply
  otherwise.
* **Add a real session boundary.** There is no logout anywhere in the codebase
  (verified). Add a "Sign out / Switch workspace" control to the `Layout` footer
  (both `CoreLayout.tsx` and `IntelligenceLayout.tsx`) that: clears `appId`,
  `secret`, `userRole` (`App.tsx:73-74,79`), calls the new purge from F6, and
  resets `currentView`. This also closes r1-uxr's defect #47.4 (picking the wrong
  card is currently a full re-auth).
* **Fix the auth-overlay flash** (`App.tsx:704`): change the condition from
  `!appId || !secret || apiStatus === 'idle' || apiStatus === 'error'` to
  `apiStatus !== 'ok'`. During `'checking'` the chrome currently renders
  underneath unauthenticated. One-line change, verified against the four
  `apiStatus` states at `App.tsx:100`.
* **Explicitly out of scope:** persisting credentials across refresh
  (r1-uxr defect #47.2). r1-uxr wants a "remember me"; r1-church-admin wants no
  persistent credential on a shared front-desk machine. Church-admin wins on the
  shared-machine threat model, which is the scenario this round was asked about.
  Not persisting the secret is the *correct* behaviour and should be documented
  as intentional in the overlay copy, not fixed.

### F6. Collapse the two caches and add a purge (#48)
*Effort: ~4 hours.*

* **Change the KDF password from `appId` to `secret`** at `storage.ts:64,91,105,
  132,163,194` and `cache.ts:26,51`. Thread `secret` through the call sites in
  `App.tsx`. This is the one-line-per-site change r1-church-admin identified and
  it is correct — but it is *not sufficient*, see the next two bullets.
* **Remove the plaintext fallback** at `storage.ts:73-77, 108-112, 165-169`
  **[NEW]**. On decrypt failure, return defaults; do not `JSON.parse` the blob.
  While the fallback exists, the encryption provides no integrity and the key
  change buys nothing. `storage.test.ts` almost certainly asserts the migration
  fallback — that assertion encodes the defect and should be inverted.
* **Encrypt or eliminate the second cache.** `api.ts:16-27` builds a
  `localforage` store holding raw PCO responses in plaintext for 1h
  (`api.ts:32`), including every field of every person: address, birthdate,
  phone, email, `background_check_expires_at`, `prayer_topic`. Preferred: delete
  it. The `cache.ts` IndexedDB layer already serves the bulk `fetchAllPeople`
  path (`App.tsx:215-233`, 5-min TTL) and the axios cache is redundant with it —
  r1-church-admin's "two caches with different TTLs against the same data, and
  nothing reconciles them" correctness argument stands on its own even before the
  privacy argument. If it is kept for request dedup, wrap `find`/`set`
  (`api.ts:17-26`) in `encryptData`/`decryptData`.
* **Add `clearAllLocalData()`** — new export in `src/utils/storage.ts` — that
  removes `locus_config`, `locus_health_history`, `locus_gamification`
  (`storage.ts:50-52`), deletes the `locus-db` IndexedDB database
  (`cache.ts:4`), and calls `localforage.clear()`. Wire it to the F5 logout
  control and to a "Clear local data" button in `ConfigModal.tsx`.
* **Surface the record-count cliff.** `App.tsx:230` fetches
  `fetchAllPeople(auth, undefined, 5)` = 500 records; "Load More" exists only in
  the Data Health view (`App.tsx:798-804`). Move a `N loaded / more available`
  indicator into the shared toolbar at `App.tsx:733-748`, next to
  `UndoRedoControls`, so it is visible from every view rather than one. This
  single move retires the "silent partial data" complaint that r1-uxr raised
  separately against #44, #45 and every other analytic screen.
* **Replace `alert("Failed to load more records.")`** (`App.tsx:414`) with the
  existing toast pattern (`UndoToast` / `BadgeToast`). Only native dialog in the
  reviewed code.
* **Keep the rate limiter unchanged.** `api.ts:37-108` — global 429 backoff,
  `Retry-After` parsing, exponential fallback, shared `globalBackoffPromise`.
  All four critics agree it is sound. The only addition worth making is surfacing
  the backoff window to the UI, and that is lower value than everything above.

---

## 4. Unresolved disagreement — questions Round 2 must settle

**Q1 — Does `prayer_topic` exist in any real church's PCO, and should Locus
ingest it at all?** r1-uxr frames #44 as possibly-dead-code depending on the
answer; both ministry critics say the field's *existence* is the hazard
regardless. F1 deletes the consumer either way, but `Student.prayerTopic`
(`pco.ts:87,276`) survives for `SentimentPulse` (#36, Area D). **Round 2 must
decide whether a church should be encouraged to store per-person addiction and
grief disclosures in a PCO custom field that Locus reads into a browser cache at
all.** If no, the deletion extends into Area D and `pco.ts:18,231,276`. This is
the one Area F decision that reaches outside Area F.

**Q2 — Is a youth small-group builder a product Locus should have?** r1-youth
says #45 is "not my lane" and that a student version would need grade bands,
gender as a hard constraint, leader capacity, and keep-apart pairs as
`-Infinity` constraints. F4 deliberately refuses to add any of that. **Round 2
must decide: is the youth roster tool (a) a separate feature to scope, (b)
explicitly out of scope for Locus, or (c) a reason to cut #45 too?** My position
is (b) — a keep-apart list is safeguarding-critical data that Locus has no field
for (`Student`, `pco.ts:71-99`, has no `restricted_contact` or `custody`), and
building a roster tool that *silently lacks* the constraint is worse than not
building one. But r1-youth's warning that an operator will point the existing
tool at student data is unanswered by a rename alone.

**Q3 — After F2, is "Locus Intelligence is read-only" a claim worth making?**
It becomes true by construction (no write component mounted) but is enforced by
nothing (the `currentView` switch at `App.tsx:755-1005` is shared across roles;
only `App.tsx:1010`'s modal block is role-gated, and it gates three modals, not
the view arms). **Round 2 must decide whether to (a) market it, (b) harden it by
moving the view arms into the layouts so the role gate is structural, or (c) drop
the claim.** r1-church-admin wants (c) plus honest marketing; r1-children wants
(b). This is a ~1 day refactor either way and should not be decided by default.

**Q4 — Who is the Intelligence persona and do they hold a PCO token?**
r1-uxr's open question, unaddressed by the others, and it determines whether the
F5 credential-UX work matters at all. If an admin always hands the executive a
shared credential out of band, then the shared-credential threat model in F6 is
the *normal* case, not the edge case, and the purge-on-logout work becomes higher
priority than stated.

---

## 5. Settling the open question: is #45 salvageable?

**Yes — the objective is salvageable, the implementation is not.** I benchmarked
a faithful port of `sorter.ts`'s hot loop rather than accept either critic's
estimate. Node 20, popSize 100 as hardcoded at `sorter.ts:135`, k=8, household
sizes 1-3, run against realistic congregation scales:

| Congregation | Households | Quick (100) | Balanced (500) | Deep Search (2000) |
|---|---|---|---|---|
| ~500 people | 200 | 196 ms | 1.0 s | 4.1 s |
| ~2,000 people | 800 | 804 ms | 3.9 s | 16.2 s |
| ~5,000 people | 1,800 | 2.4 s | 9.3 s | **34.5 s** |

All of it synchronous on the main thread after the 50ms paint flush
(`SmallGroupSorter.tsx:24-29`). r1-uxr's freeze concern is confirmed and
`plans/small_group_sorter_implementation.md:19` — "Even for thousands of
congregants, the time complexity on the client machine is negligible" — is false.

The decisive result is the comparison against a deterministic LPT bin-pack,
scored **by the GA's own `evaluateFitness` function** (higher is better, 0 is
perfect):

| Households | LPT greedy | GA @ 500 gen | GA @ 2000 gen |
|---|---|---|---|
| 200 | **-12.90** (1 ms) | -62.63 (1.0 s) | -55.05 (3.9 s) |
| 800 | **-1.64** (2 ms) | -103.84 (3.6 s) | -101.46 (14.4 s) |
| 1,800 | **-3.05** (2 ms) | -158.74 (8.7 s) | -187.54 (37.5 s) |

Three conclusions, all of which change the verdict from what any critic argued:

1. The deterministic solver is **10-60× more accurate** on the GA's own
   objective, in ~2 ms instead of up to 37 s. The genetic algorithm is not a
   speed/accuracy tradeoff — it is strictly dominated. r1-uxr's proposed repair
   ("cap Deep Search generations") and r1-church-admin's ("drop the GA cosplay
   for a fast deterministic solver") both point the right way, but only the
   latter is justified, and neither knew the GA was *losing*.
2. **"Deep Search" is not more accurate than "Balanced."** At 1,800 households
   2000 generations scored -187.54 against 500 generations' -158.74. The
   accuracy dropdown sells a monotonic quality dial that does not exist. It is
   not merely slow — it is misleading. Delete it, per F4.
3. Non-determinism has a real cost independent of speed: r1-church-admin's
   "Sarah cannot defend a grouping to a family who asks why they aren't with the
   Andersons anymore" is the correct framing, and the deterministic solver
   removes it for free rather than as a tradeoff.

**So: SIMPLIFY, not CUT, and not DEMOTE.** r1-church-admin's DEMOTE loses
because there is no existing screen this belongs on — it is a twice-a-year job
with a real output, and a demoted card cannot produce a group roster. It keeps
its nav slot, loses its algorithm, its accuracy dropdown, its loading state, its
name, and its silence about partial data.

---

## 6. New ideas earned this round (3 max, each names what it replaces)

**Idea 1 — A single "Local Data" panel in Settings.**
*Replaces:* nothing in nav; folds into `ConfigModal.tsx`, and **replaces the
scattered, invisible cache behaviour** described in F6 (`cache.ts`, `api.ts`,
`storage.ts`, three different lifetimes, zero user-facing surface).
*Job it serves:* r1-church-admin and r1-children both say a church on a shared
office machine needs to purge cached PII "on day one, not as a v2 feature," and
neither can currently see that any caching happens. One panel: what is cached,
how old it is, how many records, and a "Clear local data" button calling
`clearAllLocalData()` from F6. Not a new screen — a section in an existing modal.

**Idea 2 — Promote the loaded/total record count into the global toolbar.**
*Replaces:* the per-view "Load More Records" button at `App.tsx:798-804`, which
exists in exactly one of ~45 views.
*Job it serves:* r1-uxr's #48.1 — every analytic screen in the app silently
reports on ≤500 of a 5,000-person church with no indicator. One toolbar element
at `App.tsx:733-748` retires that complaint across all six audit areas at once,
which is why it is listed here rather than buried in F6. This is plausibly the
highest cross-area value item in the entire audit and it is a few hours' work.

**Idea 3 — A "who can write" line in the workspace picker.**
*Replaces:* the "read-only Executive Dashboard" claim at `LandingPage.tsx:26-30`
and in `feature-inventory.md:12`.
*Job it serves:* all four critics independently discovered the same thing — that
the split is a client-side `if` — by reading code, because the product asserts a
security property in marketing copy and nowhere in the UI. After F2 the
Intelligence surface has no write components mounted; state that plainly on the
card ("Reporting views only — no record editing") and drop the security framing.
This is a copy change contingent on Q3, and should not ship before F2.
