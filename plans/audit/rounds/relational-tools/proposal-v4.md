# Area F — relational-tools — Proposal v4 (Round 4 synthesis)

Inputs: `proposal-v3.md`, `r4-all.md` (four personas in one file this round).
Item IDs F1–F9 stable since v2. **Every line number below re-verified against
the working tree at HEAD `4b80e00`** — `App.tsx` shifted ~3 lines and
`SidebarIntelligence.tsx` ~20 lines since v3, so v3's citations are stale and
v4's are current.

**Round 4's job was four questions and two verifications. Q6 came back 4/4 and
is the headline finding of the whole audit. Q3 came back 4/4 as a named
non-goal. The two verifications came back split: one DONE, one "the predicate
got smarter and the silence stayed" — and that objection has since been closed
in code.**

---

## 0. Headline: the audit's largest structural finding

### F9 is RATIFIED. Fold Intelligence into Core, retire the workspace picker. Area F owns it.

**Unanimous, 4/4, and unanimous for four different reasons** — which is the
strongest form this finding could have arrived in:

* **UXR:** no single area proposal could ever surface "the second app shell has
  no job left," because no single area owns the shell. Declining to ratify
  because it spans five areas is precisely the wrong reason to decline — it is
  the class of finding an audit exists to make and an area-by-area process
  structurally cannot.
* **Church admin:** the person who has to explain to Dr. Robert why one tool has
  two logins. The picker asks a pastor to make a product decision *before he has
  authenticated* — a second decision imposed before Locus has earned the first.
  And: an audit that finds cross-cutting waste and orphans it because "no area
  owns it" is how two competing internal portals survive for years in a real IT
  shop.
* **Youth:** one fewer login surface is one fewer place for a leader to be
  confused about which tool they are in on a Wednesday night. No independent
  objection.
* **Children's, on safety grounds:** two shells around one weak boundary is not
  two levels of protection, and pretending otherwise is what invites "can I get
  children's ministry data in here too." One honestly-scoped boundary beats two
  chrome layers around the same client-side `if`.

**Why it only became visible now.** F9 is a *residue* finding: it exists because
of what the other areas removed. Area D went to zero routes. Area E dissolved.
This area cut Prayer Match (#44) and Locus Public (#46). What is left inside the
Intelligence shell after all of that is ~20 read-only analytic nav entries and a
Tools section that at HEAD held exactly two items — Automations
(`SidebarIntelligence.tsx:191-198`) and Emergency Alerts (`:200-207`) — both
verified read-only, neither taking `onSave` nor calling a PCO write. **The shell
now wraps nothing that the shell is for.** No round-1 critique could have seen
this; it is the arithmetic of five areas' subtraction, and it is the answer to
"what was the audit for."

**And the arithmetic has moved again while this was being written.** A
concurrent session has since deleted `EmergencyAlerts.tsx`, `VolunteerWeb.tsx`,
`GenealogyGraph.tsx` and `RobertReport.tsx` with their tests and utils, and the
Tools section is now Locus Public + Automations (`SidebarIntelligence.tsx:176`,
`:177-183`, `:185-192`). **After F2 deletes Locus Public, Tools contains exactly
one entry: Automations, a read-only report.** The finding got stronger between
the round's critiques and this synthesis, in the direction it was already
pointing. Nothing in §0 depends on the exact count — but the count is now one.

**What it costs — stated plainly, not minimised.**

1. **F2's guard becomes the sole boundary.** Today Intelligence users are partly
   protected by the accident that write-capable components are not mounted in
   their shell. Fold the shells and that accident is gone. **F2 must ship first,
   with tests, or F9 is a net regression.** This is a hard ordering constraint,
   not a preference.
2. Core's sidebar absorbs the surviving report entries. The role gate must
   **hide**, not grey out, or the cut reads to the user as a longer menu.
3. The "Locus Intelligence" brand and its copy retire. That is a product
   decision, not only an engineering one.
4. ~8h in this area, but Areas B/C/D/E own most of the surviving report views;
   the *count* of survivors is theirs, the *structure* is F9's and is
   independent of that number.

**What it saves.** An entire duplicated auth flow and app shell: two sidebars
become one (`SidebarIntelligence.tsx`, 214 lines of nav, deleted), two layouts
become one (`layouts/IntelligenceLayout.tsx` deleted), the pre-credential
workspace picker disappears (`LandingPage.tsx` + `.css` deleted, `App.tsx:671`),
the `userRole === 'core' ? CoreLayout : IntelligenceLayout` branch at
`App.tsx:674` collapses, and the "which app am I in" question stops existing.
`userRole` survives as a role flag on one shell, not as a routing concept. This
is a navigation-cost cut of a different order from deleting nav entries — it
deletes a *product*, not a screen.

**Owner: Area F**, per church-admin's reasoning, which is the right one: F2's
write-path guard is the precondition, F2 is Area F's item, and the area holding
the precondition should hold the dependent. Areas B–E supply the surviving view
list; they do not each get a veto on the shell. **Q6 is CLOSED.**

---

## 1. Changes since v3

1. **Q6 ratified, owner assigned.** §0. Was "1 critic + audit-wide
   convergence"; now 4/4 with an owner and an ordering constraint. **CONVERGED.**
2. **Q3 answered: per-user PCO OAuth is an explicit NON-GOAL for this release.**
   4/4, and named rather than implied. §2.
3. **The input-time refusal was the round's live disagreement and is now
   CLOSED in code.** All four personas verified `sorter.ts`'s hardened filter and
   all four rejected it as sufficient. It has since been built. §3 F5, and the
   youth agent's standing objection on #45 is marked **CLOSED**.
4. **Five items moved from proposed to DONE this session** and are listed in §3
   so they cannot be re-proposed. They are *not* in the work list in §5.
5. **Q2 (adult pin/anti-pin) picks up one condition** from UXR and otherwise
   holds at yes-but-after-F7. §6.
6. **No new ideas earned.** Ideas 1 and 2 carry unchanged, both CONVERGED, both
   now four rounds unattacked. §7.

---

## 2. Q3 — per-user PCO OAuth is an explicit NON-GOAL. Say it in the commit.

4/4, with the strongest wording coming from the two domain specialists.

**The ruling.** Locus authenticates with one shared Application ID + Secret via
Basic auth for the whole org (`App.tsx:100-103`). That credential is
Manager-equivalent for every user regardless of which card they clicked. Real
per-user OAuth — provisioning, token refresh, mapping PCO Viewer/Manager roles
onto Locus roles, explaining to a volunteer why their PCO login now also logs
them into Locus — is a project of its own and a v2-of-the-product decision, not
a Round 4 fix. **So: non-goal for this release. Named target for whenever OAuth
is prioritised. Not implied-to-exist by phrasing.**

**The obligation that comes with the non-goal.** The role gate is a **UI
convenience, not a security boundary**, until per-user OAuth exists. This must
appear in the F9 commit message and in any internal doc describing the folded-in
view — because the moment Intelligence folds into Core, `userRole` stops meaning
"which app did you click" and starts *looking*, to anyone reading the code
casually, like an access-control system. It is not one. `secret` is shared
org-wide Basic Auth; a Viewer-labelled user holding it can open devtools and
write. F9 does not create this hole; it removes the last security-by-obscurity
layer (a component not being mounted) that was concealing it.

**[NEW — children's agent, adopted as a hard condition] The folded-in view must
not be marketed, described or documented as "Viewer-safe" or "read-only-safe"
for children's records.** It is not. Addresses, background-check status and
allergy/medical-adjacent fields are gated client-side only, on the same shared
`secret`. The concrete harm: a church hands an Intelligence-only login to an
outside volunteer coordinator or a part-time comms person *because the picker
made it feel like a lesser, safer account*, and that person holds the same write
credential as core staff. Youth names the same failure with a 19-year-old
volunteer leader and adds that "Viewer" specifically implied a safety boundary
around minors' data. **This is a labelling prohibition with domain-veto weight,
not a documentation nicety.**

**UXR's cost of leaving it unnamed**, recorded because it constrains F9's build:
a designer building the role-gated section in Core needs to know whether the
eventual gate is server-enforced or cosmetic, because a real boundary supports a
*structural* gate (a Viewer login can only ever see gated content — a different
login) and a cosmetic one does not. Answer: cosmetic, for now, by decision.
Build the IA accordingly and do not design around a boundary that does not exist.

**Q3 is CLOSED as a non-goal.** It reopens when OAuth is scheduled, not before.

---

## 3. DONE this session — verified, full suite green (88 files, 545 tests)

**These are shipped, not proposed. Do not carry them into round 5's work list.**
All six landed in commits `df8ee37` and `4b80e00`, are committed rather than
local edits, and were verified with the full suite green — **88 files, 545
tests** — at the shipping commit.

*Re-run caveat, recorded rather than hidden:* re-running the suite during this
synthesis returned 543 passing and one suite failing to resolve
`src/utils/volunteerWeb.test.ts`. That file does not exist: a **concurrent
session is deleting components in this working tree right now** (see §0), and
vitest globbed a path that was removed before it was imported. It is a race in a
moving tree, not a regression in the work above. Anyone re-verifying should do it
against `4b80e00` on a quiescent tree.

| # | Item | Evidence |
|---|------|----------|
| D1 | **`ui-avatars.com` egress fixed at all seven sites** | `grep -rn ui-avatars src/` returns one hit: a comment at `src/utils/avatar.ts:28` recording what the code used to be. `initialsAvatar` (`avatar.ts:32-49`) renders a local SVG data URI; every site keeps its `member.avatarUrl \|\|` short-circuit so PCO-hosted avatars still load. **CONVERGED and DONE across three rounds.** |
| D2 | **Shared `isMinor` predicate** | `pco.ts:122-123`: `person.isChild \|\| person.age < 18 \|\| person.age > 110`, with a doc comment (`:104-121`) stating why `isChild` alone is insufficient in *both* directions and why the costs are asymmetric. Youth verified and withdrew that half of its r3 finding. |
| D3 | **`sorter.ts` uses it** | `sorter.ts:1,21` — `buildHouseholds` filters `students.filter(s => !isMinor(s))`. Necessary; never sufficient (D4). |
| D4 | **The input-time refusal is BUILT. Youth objection CLOSED.** | `SmallGroupSorter.tsx:23` computes `students.filter(isMinor)`; `:26` returns early; `:76` disables the run button while the count is non-empty; `:82-92` renders a `role="alert"` panel naming the count and stating the tool **will not sort a list containing minors and will not quietly leave them out either**, because grouping students needs leader ratios and keep-apart rules it does not have. No partial output. This is the full-stop error state F5 §"Presentation" specified. |
| D5 | **`recruitment.ts` had the same gap on the way out** | Its candidate list excluded on the child flag alone, so a teenager nobody remembered to flag arrived on a staff member's "ask them about serving" list. Now `recruitment.ts:96` — `if (isMinor(student)) return;` with the reason in a comment. Found because D2 made the predicate greppable. |
| D6 | **Component tests no longer mock the whole `pco` module** | Seven test files (`CoPilot`, `Dashboard`, `NewcomerFunnel`, `RecruitmentReport`, `SermonSentiment`, `VolunteerWeb`, `NewsletterArchitect`) now use `vi.mock('../utils/pco', async (importOriginal) => ({...}))` and mock only the network calls. Wholesale module stubs let a pure predicate the minor guards depend on be replaced with `undefined` while the tests still passed — which is how the newsletter leak survived 93 test files. **A guard that a stub can satisfy vacuously is not a guard.** |

### Why D4 was not optional — the round's one real disagreement, ruled

All four personas were handed the hardened filter and all four refused it. The
ruling is worth recording because it is the same ruling this area has now made
three times against three different features:

> **A safety behaviour with no visible artifact is not a safety behaviour. It is
> a silent behaviour that happens to be safe today.** (children's agent,
> restating its own objection to the synthesised dry-run.)

* **UXR:** Sandbox Mode, F1 and this are the same shape. From the seat of the
  person using the tool, a safety behaviour with no signal is indistinguishable
  from no safety behaviour. The predicate got smarter; the UI got no better at
  telling anyone a household was dropped.
* **Church admin, the concrete cost:** a volunteer leader runs the sorter Tuesday
  night and gets 5 groups. A 16-year-old whose `isChild` was never set — the
  single most common data-hygiene problem in a real office — was quietly dropped
  rather than quietly included. She cannot tell which. **A shorter group list
  looks exactly like "not everyone signed up this week," which is the normal,
  unremarkable case.** The refusal is the only thing that converts "the roster
  looks a little short" into "someone go fix this record."
* **Youth:** F5 called the deletion of the old filter "load-bearing, not
  cosmetic" *precisely because* a guard anywhere but the input lets minors vanish
  while the operator reads a short list as clean. The hardened filter was the
  old failure with a better predicate doing the silent dropping.

**This is now the third instance of the same pattern in this area** — the inert
sandbox, the synthesised dry-run, the silent filter. It is the area's signature
defect and should be the first thing any future reviewer greps for: *what does
this control show the operator?*

---

## 4. Per-feature decisions

| # | Feature | Verdict | Rationale | CONVERGED? |
|---|---------|---------|-----------|-----------|
| — | **Intelligence as a workspace** | **CUT — fold into Core as a role-gated view; Area F owns** | Duplicated sidebar, layout, auth overlay and pre-credential picker around a permission-scoped filter of Core's data. Only visible after five areas' subtraction. | **Y — 4/4 r4, RATIFIED** |
| 47 | Workspace picker (`LandingPage.tsx`) | **CUT — folded into Core** | Subsumed by F9. Relabelling it was fixing the sign on a door that should be removed. | **Y — 2 rounds** |
| — | **Per-user PCO OAuth** | **NON-GOAL (named), role gate = UI convenience only** | 4/4. Real OAuth is a v2 project; the honest interim is to say the boundary is not one. Labelling prohibition attached. | **Y — 4/4 r4** |
| — | Sandbox Mode (owned by Area A) | **CUT the toggle; mandatory preview replaces it** | A mode an operator can forget they are in is the exact failure `sandboxMode` was convicted of. | **Y — 2 rounds, 4/4, cross-area** |
| 44 | Prayer Partner Match | **CUT** | Pairs minors with adult strangers on a sensitive disclosure; one-click contact reveal. Domain veto ×2. | **Y — 4 rounds, 4/4** |
| 45 | Small Group Sorter → **Life Group Balancer** | **SIMPLIFY — refusal condition SATISFIED** | Guard shipped (D4); youth's objection CLOSED. What remains is F6, a performance/determinism rebuild, not a safety item. | **Y — verdict 3 rounds; condition now met** |
| 46 | Locus Public | **CUT + write-path guard in the same commit** | Unauthenticated impersonation writer reachable only from the surface marketed read-only. Deletion necessary, guard sufficient — and per F1'(1) the guard is the *only* control on that path. | **Y — 4 rounds, 4/4, both halves** |
| 48 | Data layer | **FIX — memory-first + minimisation inside `saveToCache` + migrated re-key** | Shape converged 3 rounds; r3 closed the two mechanics; r4 raised no new objection. | **Y — shape 3 rounds, mechanics 2 rounds** |
| — | `ui-avatars.com` egress | **FIX — DONE** | Seven sites render locally from a data URI. | **Y — DONE** |
| — | `isMinor` predicate + input-time refusal | **FIX — DONE** | Predicate shared, sorter refuses, recruitment closed, tests de-vacuumed. | **Y — DONE** |

---

## 5. The work list — final, ordered, DONE items excluded

Everything in §3 is out. What follows is the complete remaining Area F build,
ordered by value-per-effort, with the one hard ordering constraint marked.

| Order | Item | Effort | Blocking constraint |
|-------|------|--------|---------------------|
| 1 | **F2** — delete Locus Public **and** guard the write path | ~2h | **Must precede F9.** |
| 2 | **F3** — delete Prayer Partner Match | ~1h | none |
| 3 | **Idea 1** — loaded/total record count in the global toolbar | ~2h | cross-area, unclaimed |
| 4 | **Idea 2** — "no third-party requests" regression test | ~1h | none |
| 5 | **F6** — rebuild the sorter solver; rename to Life Group Balancer | ~4h | none |
| 6 | **F7** — data layer: memory-first, minimised, migrated re-key | ~7h | (6a) re-key pass ships with or before the KDF change |
| 7 | **F8** — credential handling: split, indicated, time-bounded | ~4h | after F2 |
| 8 | **F9** — fold Intelligence into Core; retire the picker | ~8h | **after F2, with tests** |
| — | **F1'** — three constraints on Area A's `<BatchWriteConfirm>` | ~0h | consumed by Area A |

### F2. Delete Locus Public **and** guard the write path
*~2h. CONVERGED four rounds. Highest value-per-hour remaining, and now also the
precondition for the audit's headline item.*

* Delete `src/components/LocusPublic.tsx`, `.css`, `.test.tsx`; the import at
  `App.tsx:67`; the `currentView === 'locus-public'` arm at `App.tsx:976-980`;
  the nav entry at `SidebarIntelligence.tsx:184-190`.
* **Same commit:** hard guard at the top of `handleSaveStudent`
  (`App.tsx:543`), `executeCommit` (`App.tsx:336`) and `handleSaveStudentBulk`
  (`App.tsx:485`): `if (userRole !== 'core') throw new Error(...)`. Independent
  of the calling component.
* **Load-bearing, not defence in depth.** `LocusPublic.tsx:79` calls `onSave`,
  wired at `App.tsx:978` to `handleSaveStudent` — the *single-record* path, which
  Area A explicitly scopes the batch preview out of. The confirm dialog would
  never have fired here at all.
* **Ships with tests.** After F9 the "no button is mounted" incidental protection
  is gone for every report view; this guard is what replaces it. A test that
  mocks the module wholesale does not count (see D6).

### F3. Delete Prayer Partner Match
*~1h. CONVERGED four rounds, unchanged.*

* Delete `src/components/PrayerMatch.tsx`, `.css`, `.test.tsx`,
  `src/utils/prayer.ts`, `prayer.test.ts`; the import at `App.tsx:34`; the
  `currentView === 'prayer'` arm at `App.tsx:911-915`;
  `SidebarIntelligence.tsx:167-173` and its `SidebarIntelligence.test.tsx`
  assertion.
* Commit message must state that `Student.prayerTopic` (`pco.ts:87,276`)
  **remains ingested and cached** after this deletion. Deleting the pairing UI
  ends the introduction risk, not the disclosure risk. **Area D inherits a named
  blocker** covering `pco.ts:18,231,276`.
* Q1 stays settled: Locus should not ingest `prayer_topic` at all. "Dead in
  production" is not safe — `pco.ts:18,231,276` reads a flat `prayer_topic`
  attribute while real PCO custom fields arrive as `field_data` keyed by
  `field_definition_id`, so the machinery waits on one mapping line, and
  `mock-api/data.js:96-128` fabricates the field for every persona.

### F6. Rebuild the sorter's solver; rename
*~4h. CONVERGED three rounds. Turns a 34s main-thread freeze into ~2ms. No
longer gated on F5 — that condition is met.*

* Replace `sortIntoGroups` with deterministic LPT bin-pack: households by `size`
  desc, tie-break `averageAge` desc, assign to least-loaded group, break load
  ties by nearest resulting mean age to the global target.
* Delete `evaluateFitness`, `createRandomChromosome`, `tournamentSelection`,
  `crossover`, `mutate` — retain `evaluateFitness` as a **test helper proving the
  new solver beats the GA on the GA's own objective**.
* Delete the `generations` control (`SmallGroupSorter.tsx:14,61-72`) and
  parameter; delete `isProcessing`, the `setTimeout` wrapper and the
  `NODE_ENV === 'test'` branch (`SmallGroupSorter.tsx:15,25-40`). **Keep
  `minorsInInput`, the disabled-button condition and the `role="alert"` panel
  intact through this refactor** — they are the D4 guard and are easy to lose in
  a rewrite of the same function.
* CSV export via existing `downloadCSV`, flat `{ group, name, age, householdId }`.
* Two caveat lines: coverage (`students.length`, and when `nextUrl` is non-null,
  "sorted from N loaded records — not the full roster") and stability ("Group
  assignments can change between runs as households join or leave. This is
  expected, not an error." — LPT is insertion-order-fragile).
* Rename to **Life Group Balancer** (`SidebarIntelligence.tsx:174-181`,
  `SmallGroupSorter.tsx:45-46`); rename files in the same commit or not at all.
* Still no grade/gender/leader-capacity logic. See Q2.

### F7. Data layer — memory-first, minimised at the choke point, migrated
*~7h. Shape CONVERGED three rounds; mechanics CONVERGED two. Unchanged from v3
— no r4 critic reopened it. Reproduced in full so the work list is standalone.*

1. **Default: no member PII on disk, at all.** Route `cache.ts`'s people cache
   and `api.ts`'s axios `localforage` store through a persistence switch
   defaulting to an in-memory `Map` scoped to the JS session. Independent of F8.
2. **Opt-in: one "Trust this computer" toggle in `ConfigModal.tsx`**, off by
   default, per-device.
3. **Even when trusted, purge automatically.** `beforeunload` +
   `visibilitychange` handlers clearing the IndexedDB stores; fix
   `cache.ts:44-47`'s **lazy** TTL — today an expired entry is deleted only on
   the next read of that same key, so an entry never read again persists
   indefinitely regardless of its 5-minute TTL.
4. **Field minimisation enforced inside `saveToCache` itself**, not at the call
   sites: `App.tsx:217-233` and `App.tsx:403` both persist **raw `PcoPerson`**
   objects — the `.map(transformPerson)` runs *after* the save and its output is
   never what is written. Strip inside that one function: `addresses`,
   `phone_numbers`, `email_addresses`, `background_check_expires_at`,
   `prayer_topic`, `avatar`. Refetch live via the existing `cache: false` pattern
   (`pco.ts:353,430`) in the views that render them.
   **Acceptance criterion (children's agent, CONVERGED):** the "Trust this
   computer" path calls the *same* stripped `saveToCache`. Test it; do not assume
   it falls out of "one function."
5. **Remove the plaintext fallback** at `storage.ts:73-77, 108-112, 165-169`.
   Invert whatever `storage.test.ts` asserts about migration.
6. **KDF password `appId` → `secret`** at `storage.ts:64,91,105,132,163,194` and
   `cache.ts:26,51`. Four blocking migration requirements:
   * **(a) One-time re-key pass, attempted first.** On load, if a blob fails to
     decrypt under the new `secret`-keyed KDF, attempt the old `appId`-keyed KDF;
     on success re-encrypt under `secret`. **Only after that fails does any
     fallback run.** (5) and (6) must not ship in one release without this.
   * **(b) No silent reset to defaults.** If re-key fails the app says so
     visibly and requires acknowledgement. A third silent-safety behaviour that
     is a data-loss path instead of a plaintext-storage path is not progress.
   * **(c) The `[appId]` → `[appId, secret]` effect** (`App.tsx:143-162`, 500ms
     debounce) must be gated on both fields non-empty and **must not treat
     "secret not yet typed" as "no data exists."**
   * **(d) Test against a production-shaped blob** — real config, populated
     health history, non-zero streak — not a fresh install.
7. **Keep `clearAllLocalData()` and the button — demoted** to the trusted-device
   escape hatch.
8. **Keep the rate limiter unchanged** (`api.ts:37-108`). 4/4 across four rounds.
9. Replace `alert("Failed to load more records.")` (`App.tsx:414`) with the
   existing toast pattern.

### F8. Credential handling — split, indicated, time-bounded
*~4h. After F2. The picker-rename half of v2's F8 is superseded by F9.*

* Persist `appId` and `userRole` to `localStorage`; keep `secret` **in-memory
  only**, cleared on refresh. With the KDF moving to `secret`, the credential
  overlay must resolve before config does — correct, and the loading state should
  say so. *(Persisting `userRole` creates no escalation path: it was never a
  security boundary. Editing it in devtools yields a UI claiming elevated access
  and a write that still succeeds or fails on the shared `secret` — that is the
  Q3 finding, now formally a named non-goal, not a new hole.)*
* **Trusted-device toggle needs access control and visible state:** (a) a
  persistent visible trusted-state indicator, not a settings checkbox nobody
  revisits; (b) `userRole === 'core'` to enable it. A front-desk kiosk and
  Sarah's laptop do not carry the same risk.
* **Idle timeout, 15–30 min**, clearing `secret` from memory and re-showing the
  prompt. A memory-only secret protects against the machine being off; it does
  nothing for an unlocked unattended tab in an office interrupted every four
  minutes.
* Add "Sign out / Switch workspace" to the **surviving** layout footer (post-F9,
  `CoreLayout`): clears `secret`, `userRole`, calls `clearAllLocalData()`, resets
  `currentView`.
* Fix the auth-overlay flash (`App.tsx:701`): condition becomes
  `apiStatus !== 'ok'`.
* Overlay copy: two bare inputs today, no link to where in Planning Center to
  generate a token, no format example, no escape hatch. Add a deep link and a
  format example.
* Error messaging: only 401 gets a real message (`pco.ts:481-483`); network,
  CORS, DNS and PCO-outage failures fall through to raw `e.message`
  (`App.tsx:196`). More urgent once F7 adds purge and re-key failure surfaces.

### F9. Fold Intelligence into Core; retire the workspace picker
*~8h in this area. **Area F owns.** Ships after F2 with tests. Rationale, cost
and saving in §0; the edit list follows.*

* **Delete** `src/components/LandingPage.tsx` + `.css`,
  `src/components/SidebarIntelligence.tsx` + `.test.tsx`,
  `src/layouts/IntelligenceLayout.tsx` + `.test.tsx`; the imports at
  `App.tsx:60`; the `return <LandingPage .../>` at `App.tsx:671`; and the
  `userRole === 'core' ? CoreLayout : IntelligenceLayout` branch at
  `App.tsx:674`.
* **Move** the surviving read-only views into `CoreLayout`'s sidebar under a
  role-gated section that **hides** rather than disables. After F2 and the
  concurrent deletions (§0), the Tools section holds **one** entry — Automations,
  read-only. Areas B–E determine how many of the ~20 analytic entries survive;
  F9's structure is independent of that number.
* **Commit message must carry the Q3 sentence** (§2): the role gate is a UI
  convenience, not a security boundary, until per-user PCO OAuth ships — and the
  folded-in view is not to be described as "Viewer-safe" for children's records.
* Retire the "Locus Intelligence" brand and the `v6.1 - Symbiotic Intelligence`
  footer string.

### F1'. What Area F requires *on top of* Area A's `<BatchWriteConfirm>`
*~0h of new build. Three constraints. Do not re-specify the component; see
`plans/audit/rounds/core-hygiene/proposal-v3.md` §3.2.*

1. **The preview does not cover #46's write path and must not be credited with
   doing so.** `LocusPublic.tsx:79` → `App.tsx:978` → `handleSaveStudent`, the
   single-record path Area A rules out of scope. **F2's guard is the only control
   there** and ships regardless of Area A's sequencing.
2. **Ordering against F7's minimisation.** `<BatchWriteConfirm>` must read its
   before-state from the in-memory `students` array, never from `loadFromCache` —
   otherwise F7's stripped contact fields render blank "before" values and the
   operator reviews a diff that is wrong *in the direction of looking safe*.
3. **#45 got no benefit from the preview** — it has no write path; its
   minor-safety failure was an output leak upstream of any dialog. That is why D4
   was built separately, and it is the proof of this constraint rather than a
   pending item.
4. Carried: `pco.test.ts:254,276,698` assert the `X-Locus-Sandbox` header is
   injected. Those tests encode the bug and must be rewritten to assert **zero
   requests issued**. Area A's §3.2 does not name them.

---

## 6. Unresolved — for Round 5

**Q1, Q3, Q4, Q5, Q6 are all closed.** Q6 ratified with an owner (§0); Q3 named
as a non-goal with a labelling prohibition (§2). One question remains open and
one is flagged-not-blocking.

**Q2 — adult pin/anti-pin on the Life Group Balancer: in scope or not?** Open
since v2 and the only genuinely unsettled question left in this area. The request
is *adult* group pins — keep a leader with their co-leader; keep apart a couple
who just left a group over conflict. That is not safeguarding data and the youth
argument I wrongly extended to it does not dispose of it. My lean remains
**yes-but-after-F7**: D4 makes the input adults-only by refusal rather than by
assertion, which removes my original objection entirely — but a pin list adds a
persisted who-avoids-whom record to a data layer F7 is still rebuilding, and it
must not land before F7. **[NEW condition — UXR]** a pin is itself a small
persistent artifact, and it needs the same visibility discipline as everything
else in this area: if a pin silently expires, or silently fails to apply because
F7's memory-first cache dropped it, the leader who set it in January has no way
to know it stopped working in March. **Do not ship the pin-list UI without a
"your pins" summary view.** That is the same ruling as D4, applied pre-emptively.

**Q7 — plausible-but-wrong DOB. Flagged, not blocking.** `isMinor` catches
`age < 18` and `age > 110` but not a guessed "2000" on a kid born 2011. No
per-feature guard closes it; it is a data-quality problem. Routed to
core-hygiene as a standing caveat.

**What round 5 should actually do**, since only Q2 is open: stop generating
questions and pressure-test the *sequencing*. The single highest-risk claim in
this document is that **F2's guard is a sufficient replacement for the mounting
accident that F9 removes.** If that is wrong, F9 is a regression and the whole
headline finding is unsafe to execute. R5 should attack that, not re-litigate
the cuts.

---

## 7. Ideas — both carried, both CONVERGED, neither attacked in four rounds

**Idea 1 — promote the loaded/total record count into the global toolbar.**
*Replaces:* the per-view "Load More Records" button at `App.tsx:798`, present in
one of ~45 views. *Job:* every analytic screen silently reports on ≤500 records
of a 5,000-person church (`App.tsx:230`, `maxPages: 5`). One element retires that
complaint across all six areas. **Four rounds, zero critic objections, still the
highest cross-area value-per-hour item in the audit and still unowned. Stop
re-proposing it; schedule it.**

**Idea 2 — a "no third-party requests" test.** *Guards:* what D1 already fixed. A
test asserting no external host appears in `src/`'s outgoing URLs. The
`ui-avatars.com` pattern survived a full round of four critics and one synthesis
before being caught, and nearly survived an in-place rewrite of one of its host
files. **The mechanism, not the fix, is the idea** — and D6 is the same argument
arriving from the other direction: the tests that should have caught the
newsletter leak passed because the module was stubbed wholesale. Both are
"prove the guard can fail" work, and both are cheap.

*No third idea earned. Four rounds in, the remaining value is entirely in
shipping F2, then F9 — in that order.*
