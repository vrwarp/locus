# Area F — relational-tools — Proposal v2 (Round 2 synthesis)

Synthesis of `r2-uxr.md`, `r2-church-admin.md`, `r2-youth.md`, `r2-children.md`
against `proposal-v1.md`. Every claim below was re-verified against source in
this round, including claims I made myself in v1. New verifications this round
are marked **[V2]**. Items surviving two rounds unchanged are **CONVERGED**.

---

## 1. Changes since last round

### Both v1 [NEW] findings are settled — stop re-verifying them

* **Sandbox Mode is inert.** Confirmed independently by all four critics.
  `pco.ts:365-373` sets `X-Locus-Sandbox: true` and falls through to the same
  `api.patch`; `grep -rni sandbox mock-api/` = zero. Closed.
* **`storage.ts` plaintext fallback.** Confirmed by uxr, admin, children.
  `storage.ts:67-81`, `:104-113`, `:161-169`. Closed.
* **The GA benchmark replicated.** r2-uxr ported the hot loop independently and
  reproduced the result with a *weaker* LPT than F4 specifies (no age tie-break):
  LPT beats the GA's best by 3-10× on the GA's own fitness function, ~1ms vs
  4.5-39.7s, and reproduced the non-monotonic "Deep Search is worse than
  Balanced" result at a different seed. Premise holds under replication. Closed.

### Four rulings that change the proposal

**1. Sandbox is promoted out of Area F to a top-line, audit-wide finding.**
r2-children traced the blast radius and I verified it: `App.tsx:307` (Ghost
Protocol archive, Area A #6), `:356` (Smart Fix), `:442` (Review Mode), `:528`
(batch commit) all thread `config.sandboxMode || false` into the same
`updatePerson`/`archivePerson` that ignores it. The consequence is not "#46 has
no safety net" — it is **there is no safe way to trial any write-capable feature
in this product against real records**, which is the sentence the audit's
top-line findings need. r2-church-admin's escalation is adopted verbatim: every
write-path finding in any area that treated "the operator could have enabled
Sandbox Mode" as a mitigating factor is **void** until F1 lands, and the
core-hygiene round-1 documents that did so (`r1-children.md:236-239,399-420`,
`r1-church-admin.md:102,110,135,305,318,325`, `r1-uxr.md:200-207`,
`r1-youth.md:367-370,442`) need that note appended.

**2. The fix is the client-side short-circuit, not deletion.** v1 offered
delete as an equal-standing fallback. r2-church-admin is right that it isn't:
deleting the toggle removes the tool a trained admin reaches for before a bulk
session with a new volunteer, without removing the danger that made them reach
for it. Demoted to an emergency measure only — if the short-circuit cannot ship
this cycle, pull the checkbox and banner **immediately** as a mislabeled control,
and treat that as an outage, not a resolution.

**3. F2 was insufficient as scoped. [CORRECTION — my own]** v1 claimed deleting
Locus Public makes "read-only true by construction" and punted the write guard
to Q3 option (b). r2-church-admin is correct that this is a tidy accident, not a
boundary: `App.tsx:1010` gates three *modals*, and nothing gates
`handleSaveStudent` (`:546`), `executeCommit` (`:339`), or
`handleSaveStudentBulk` (`:488`). There is no reason to defer a same-file,
one-hour fix to a future round. The guard ships in the same commit as the
deletion, and the Idea-3 copy change does not ship before it.

**4. #45 keeps only with a hard minor-refusal guard.** r2-youth is right and I
did not interrogate `isChild` the way I interrogated `appId`-as-password.
Verified: `pco.ts:273` is `isChild: !!child` — a straight pass-through of PCO's
household-role flag (`mock-api/data.js:124,199` hardcodes it at generation, not
age-derived). It goes stale exactly for 17-18-year-olds with their own giving
record or household. `sorter.ts:21`'s `!s.isChild` filter is therefore a
*silent* filter on an unreliable field. Domain veto applies; SIMPLIFY is
conditional on the guard, and without it #45 moves to CUT.

**[V2] Sharpening the guard that neither r2-youth nor v1 stated:** `age`
(`pco.ts:245`) is not merely "more reliable" — it is *always present*.
`transformPerson` returns `null` for any record without a valid `birthdate`
(`pco.ts:233-239`), so every `Student` in the app has a birthdate-derived age.
An `age < 18` check has no null-handling case and no coverage gap. And the guard
must run on the **input** array before `buildHouseholds`, and the silent
`!s.isChild` filter at `sorter.ts:21` must be **removed** in the same change —
otherwise the filter strips the records before the guard can refuse on them, and
the guard never fires.

### One new cross-area finding, ruled on

**`ui-avatars.com` sends congregation members' real names to a third party on
render.** r2-children carried this forward from their r1 and I verified it:
7 call sites in 6 components — `PrayerMatch.tsx:65,87`,
`SmallGroupSorter.tsx:90`, `BurnoutReport.tsx:84`,
`MissingVolunteersReport.tsx:81`, `DriftReport.tsx:86`,
`RecruitmentReport.tsx:85`. All are the identical
`member.avatarUrl || https://ui-avatars.com/api/?name=${encodeURIComponent(...)}`
pattern, so the request fires precisely for members who have *no* PCO avatar —
the majority, and disproportionately children, who are least likely to have a
profile photo. **Ruling: FIX, globally, in one commit.** This is unconsented
egress of member names (plus a `Referer` disclosing which Locus view they
appeared in) to a service with no DPA, no consent screen, and no church
relationship, and it is cheap: replace with a local initials avatar. v1 dropped
it; that was an error.

### Two darlings killed

* **v1's F5 blanket "no credential persistence" was wrong.** r2-uxr is right
  that it contradicts my own F6 reasoning that `appId` is non-confidential and
  already visible in every Basic-Auth header. Refusing to persist it buys no
  margin against the shared-machine threat model and costs a two-field retype on
  every refresh. The dispute was never binary and I treated it as such. Adopting
  the split: persist `appId` + `userRole`, never `secret`.
* **v1's F4 claim that determinism gives grouping stability "for free" was
  wrong.** r2-uxr is right: LPT is insertion-order-fragile, and one added or
  removed household can cascade through the greedy fill and reshuffle everything
  after it. Determinism buys *reproducibility of a single run*, not *stability
  across roster changes*. The correct response is caveat copy, not a claim.

---

## 2. Per-feature decisions

| # | Feature | Verdict | Rationale | CONVERGED? |
|---|---------|---------|-----------|-----------|
| — | **Sandbox Mode** (promoted out of Area F) | **FIX — client-side short-circuit** | An inert safety control is categorically worse than mock data presented as insight: it misleads about what the tool itself will do to a real record when the operator explicitly asked it not to. Threads into every write path in the app. Delete-only is an emergency measure, not the fix. | **Y — 4/4 r2** |
| 44 | Prayer Partner Match | **CUT** | Pairs minors with adult strangers on a sensitive disclosure, discloses contact info on one click. Domain veto ×2. r2-uxr concedes their r1 softening was wrong. | **Y — 2 rounds, 4/4** |
| 45 | Small Group Sorter | **SIMPLIFY, conditional on a hard minor-refusal guard** → CUT if the guard is not shipped | Job is real; the GA is strictly dominated on its own objective; but `isChild` is a stale household-role flag, so "adults only" is currently an assertion, not a property. | **N** — verdict stable 2 rounds, scope changed this round |
| 46 | Locus Public | **CUT + write-path guard in the same commit** | Unauthenticated impersonation writer reachable only from the surface marketed as read-only. Deletion is necessary; on its own it is not sufficient. | **Y on CUT — 2 rounds, 4/4**; N on sufficiency |
| 47 | Workspace picker (was "Landing / auth / role split") | **FIX** — relabel + credential split + session boundary | It is a picker rendered before any credential exists. Relabeling without the F2 guard converts an open question into a false answer. | **Y on diagnosis — 2 rounds**; N on remedy |
| 48 | Data layer | **FIX — rescoped: memory-only by default** | v1's "encrypt what's there, add a button" is rejected by two critics on the same evidence: this codebase has now shipped two safety features that do nothing, so a control depending on a human remembering to click it is not a control. | **N** — persistence design replaced this round |
| — | **`ui-avatars.com` egress** (new, cross-area) | **FIX** | Unconsented third-party disclosure of member names including minors, on render, in 6 components. One-hour global fix. | New this round |

---

## 3. The concrete work, ordered by value-per-effort

Renumbered from v1 (v1 mapping noted). F1-F4 are all ≤2h each and all of them
either remove a live hazard or stop an active disclosure; they should land
before any of the larger rebuilds.

### F1. Make Sandbox Mode real — blocking, cross-area *(was v1 F3)*
*~2h. Blocks every other area's write-path verdicts.*

* In `pco.ts:365` `updatePerson` and `pco.ts:421` `archivePerson`: when
  `sandboxMode` is true, **return the synthesised response without issuing any
  request**. The short-circuit must be in the client. Keep the header for the
  mock API if desired; it is decorative.
* `pco.test.ts:254,276,698` assert the header is injected. Those tests encode the
  bug. Rewrite them to assert **no request is issued** — an axios mock with zero
  calls, not a header comparison.
* Extend the short-circuit to `createPerson`/`api.post` (`pco.ts:361`) in the
  same change. It has the same exposure and no critic has covered it.
* Amend the banner (`App.tsx:681-695`) only after the short-circuit lands. Do not
  ship banner copy changes ahead of the behaviour.
* **Emergency fallback only:** if this cannot ship this cycle, remove the
  checkbox (`ConfigModal.tsx:150-153`) and banner immediately and leave
  `sandboxMode` in the config type. Removing the *control* while leaving the
  inert plumbing is the correct interim state — it stops the lie without
  pretending the danger is gone.

### F2. Delete Locus Public **and** guard the write path *(was v1 F2, expanded)*
*~2h. Removes the only unauthenticated write path, and makes the read-only claim
enforced rather than incidental.*

* Delete `src/components/LocusPublic.tsx`, `.css`, `.test.tsx`; `App.tsx:70`
  (import); the `currentView === 'locus-public'` arm at `App.tsx:996-1000`;
  `SidebarIntelligence.tsx:204-211` and the now-possibly-empty `Tools` header.
* **In the same commit**, add a hard guard at the top of `handleSaveStudent`
  (`App.tsx:546`), `executeCommit` (`App.tsx:339`) and `handleSaveStudentBulk`
  (`App.tsx:488`): `if (userRole !== 'core') throw new Error(...)`. Independent
  of which component called it. This is the difference between "no button
  happens to be mounted" and "the write path refuses."
* Do **not** ship the Idea-3 "Reporting views only" copy until this guard is in.

### F3. Delete Prayer Partner Match *(was v1 F1)*
*~1h. Removes the area's only safeguarding-critical live path.*

* Delete `src/components/PrayerMatch.tsx`, `.css`, `.test.tsx`,
  `src/utils/prayer.ts`, `prayer.test.ts`; `App.tsx:36` (import); the
  `currentView === 'prayer'` arm at `App.tsx:926-930`;
  `SidebarIntelligence.tsx:188-194` and its assertion in
  `SidebarIntelligence.test.tsx`.
* **Adopt r2-youth's amendment:** the commit message must state plainly that
  `Student.prayerTopic` (`pco.ts:87,276`) *remains ingested and cached* after
  this deletion. Deleting the pairing UI ends the **introduction** risk; it does
  not end the **disclosure** risk of a minor's addiction/grief topic sitting in
  the local cache. Area D inherits a named blocker, not a footnote.
* **Answering Q1, adopting r2-children:** no — Locus should not ingest a
  per-person addiction/grief disclosure field at all without an access-control
  and consent model that does not exist here. "Dead in production" is not safe:
  `pco.ts:18,231,276` reads a flat `prayer_topic` attribute, while real PCO
  custom fields arrive as `field_data` keyed by `field_definition_id` — so the
  entire match/reveal/export machinery is built and wired, waiting on one mapping
  line. Meanwhile the mock (`mock-api/data.js:96-128`) fabricates the field for
  every persona, so anyone demoing off the mock server sees the feature "work"
  and produce real-looking cross-generational pairings. Q1 is **settled**.

### F4. Remove the `ui-avatars.com` egress, globally *(new)*
*~1h. Highest value-per-hour item in this proposal.*

* Add one `<InitialsAvatar name size />` component under `src/components/` that
  renders initials in a coloured circle (inline SVG or a styled `<div>`), and
  replace all 7 call sites: `SmallGroupSorter.tsx:90`, `BurnoutReport.tsx:84`,
  `MissingVolunteersReport.tsx:81`, `DriftReport.tsx:86`,
  `RecruitmentReport.tsx:85` (the two `PrayerMatch.tsx:65,87` sites disappear
  with F3). Preserve the `member.avatarUrl ||` short-circuit — PCO-hosted avatars
  are fine and stay.
* Do this as its own commit touching all files, **not** folded into the F6
  rewrite — two of the six components are CUT in other areas, and a
  cross-cutting privacy fix must not be lost when a host file is deleted or
  rebuilt. That is exactly how v1 dropped it.
* Add a lint rule or a test asserting no `ui-avatars.com` string survives in
  `src/`, so the pattern cannot be copied into the next report component.

### F5. #45 — the minor-refusal guard *(new; the condition on keeping the feature)*
*~1h. Ships even if F6 does not.*

* In `sortIntoGroups`'s entry point (or a new exported `assertAdultsOnly`),
  before `buildHouseholds`: scan the **input** `students` array; if any record
  has `isChild === true` **or** `age < 18`, **refuse to run** and render a
  visible error naming the count ("12 records in this view are minors or
  household children. This tool balances adult groups only."). Not a toast, not
  a filter — a refusal that blocks the result.
* **Delete the silent `!s.isChild` filter at `sorter.ts:21`.** With the guard in
  place it is dead; left in place it strips the records before the guard can see
  them and the guard never fires. This is the load-bearing detail.
* Rationale (r2-youth, adopted): `isChild` is a staffer-set household role, not a
  computed fact, and goes stale for exactly the 17-18-year-olds a
  cross-generational pairing would harm most. `age` is birthdate-derived and,
  per **[V2]** above, always present. The refusal also gives an operator who
  points this at a youth roster an explicit rejection instead of a
  plausible-looking, silently-thinned output.

### F6. Rebuild the sorter's solver; rename *(was v1 F4)*
*~4h. Turns a 34s main-thread freeze into ~2ms and a better answer.*

Unchanged from v1 F4 except as noted:

* Replace `sortIntoGroups` (`sorter.ts:111-189`) with deterministic LPT
  bin-pack: sort households by `size` desc (tie-break `averageAge` desc), assign
  to least-loaded group, break load ties by whichever group's resulting mean age
  lands nearest the global target.
* Delete `evaluateFitness`, `createRandomChromosome`, `tournamentSelection`,
  `crossover`, `mutate` (`sorter.ts:52-105`) — retain `evaluateFitness` only as a
  test helper proving the new solver's balance.
* Delete the `generations` control (`SmallGroupSorter.tsx:12,51-62`) and
  parameter (`sorter.ts:114`); delete `isProcessing`, the `setTimeout` wrapper
  and the `NODE_ENV === 'test'` branch (`SmallGroupSorter.tsx:13,16-30`).
* Add CSV export via the existing `downloadCSV` (`src/utils/export.ts`), flat
  `{ group, name, age, householdId }`.
* Coverage caveat: render `students.length` and, when `nextUrl` is non-null,
  "sorted from N loaded records — not the full roster."
* **[CHANGED — r2-uxr]** Add a second caveat line: *"Group assignments can change
  between runs as households join or leave. This is expected, not an error."*
  Bin-packing is insertion-order-fragile; v1's "determinism removes the
  unpredictability cost for free" over-promised, and Sarah should not discover
  this when the March re-sort doesn't match January's.
* **[CHANGED — r2-youth]** F5's guard, not this caveat, is the answer to the
  minor-safety gap. A disclosure banner is informational; a leak into
  cross-generational pairing needs a hard stop. Shipping only the coverage
  caveat would imply the input set is otherwise clean.
* Rename to **Life Group Balancer** (`SidebarIntelligence.tsx:196-202`,
  `SmallGroupSorter.tsx:35-36`), rename files in the same commit or not at all.
* Still **no** grade/gender/leader-capacity logic — see §4 Q2 for the narrowed
  version of this refusal.

### F7. Data layer — memory-first, not encrypt-and-hope *(was v1 F6, rescoped)*
*~6h. Converges r2-children's and r2-church-admin's rejections of v1's design.*

The two critics asked for the same thing from different ends: children's wants
in-memory-only by default with automatic purge; admin wants sessionStorage by
default with an explicit "Trust this computer" opt-in. Converged design:

1. **Default: no member PII on disk, at all.** Route `cache.ts`'s people cache
   and `api.ts`'s axios `localforage` store through a persistence switch that
   defaults to an in-memory `Map` scoped to the JS session. This *deletes* the
   shared-front-desk risk rather than mitigating it, needs no listener to fire,
   and — per r2-children's explicit condition — **does not depend on F8's logout
   control shipping first.** The warm-cache UX goal is met by memory surviving a
   tab session; it never required surviving a power cycle.
2. **Opt-in: one "Trust this computer" toggle in `ConfigModal.tsx`, off by
   default, per-device.** Only when on does anything persist past tab close.
   This is admin's control, and it is what preserves the genuine benefit for a
   staffer's own laptop.
3. **Even when trusted, purge automatically.** Add `beforeunload` +
   `visibilitychange` handlers that clear the IndexedDB stores, and fix
   `cache.ts:44-47`'s **lazy** TTL — today an expired entry is deleted only on
   the next read of that same key, so an entry never read again persists on disk
   indefinitely regardless of its 5-minute TTL. This also partly answers
   r2-church-admin's dropped idle-tab point (§4 of their critique): an idle tab
   that is backgrounded purges on `visibilitychange`.
4. **Field-level minimisation. [V2]** `App.tsx:233` saves **raw `PcoPerson`
   objects**, not transformed `Student`s — so the persisted blob carries every
   attribute PCO returned: `addresses`, `phone_numbers`, `email_addresses`,
   `background_check_expires_at`, `prayer_topic`. Strip those at the
   `saveToCache` boundary and refetch live (`cache: false`, the pattern already
   at `pco.ts:353,430`) in the views that render them.
5. **Remove the plaintext fallback** at `storage.ts:73-77, 108-112, 165-169`.
   Return defaults on decrypt failure. Invert whatever `storage.test.ts` asserts
   about migration.
6. **Change the KDF password from `appId` to `secret`** at
   `storage.ts:64,91,105,132,163,194` and `cache.ts:26,51`.
   **[V2] Two consequences v1 missed, both blocking on sequencing:**
   * The config effect at `App.tsx:143-162` is keyed `[appId]` and debounced
     500ms — it currently fires *while the user is typing the app ID*. It must be
     re-keyed to `[appId, secret]` and gated on both being non-empty.
   * Combining (5) and (6) **silently destroys existing users' config, health
     history and streak**: blobs encrypted under `appId` become undecryptable
     under `secret`, and the fallback that would have rescued them is being
     removed in the same change. Either land a one-time re-key pass (decrypt
     with `appId`, re-encrypt with `secret`) *before* removing the fallback, or
     explicitly `removeItem` the three keys and tell the user. Do not let it
     fail into "returns defaults" — that is a third silent safety behaviour in a
     codebase already carrying two.
7. **Keep `clearAllLocalData()` and the button — but demoted.** It is the
   trusted-device escape hatch, not the front line. r2-children is right that a
   manual button sequenced last is theater; it is fine once it is no longer the
   only thing standing between a shared machine and a cached congregation.
8. **Keep the rate limiter unchanged** (`api.ts:37-108`). 4/4 agree it is sound.
9. Replace `alert("Failed to load more records.")` (`App.tsx:414`) with the
   existing toast pattern.

### F8. Workspace picker honesty + credential split *(was v1 F5, changed)*
*~3h. Ships after F2's guard, never before.*

* Rename inventory row #47 to **Workspace picker**; drop "read-only" from
  `LandingPage.tsx:25-30` in favour of "Reporting & analytics views."
* **[CHANGED — r2-uxr wins]** Persist `appId` and `userRole` to `localStorage`;
  keep `secret` **in-memory only**, cleared on refresh. v1's blanket
  no-persistence rule contradicted my own finding that `appId` is already
  non-confidential and visible in every outgoing header, and cost a two-field
  retype for zero security margin. Note the interaction with F7(6): with the KDF
  moving to `secret`, config cannot load from a persisted `appId` alone, so the
  overlay must resolve before config does — this is correct behaviour, not a
  regression, and the loading state should say so.
* Add "Sign out / Switch workspace" to `CoreLayout` and `IntelligenceLayout`
  footers: clears `secret`, `userRole`, calls `clearAllLocalData()`, resets
  `currentView`.
* Fix the auth-overlay flash (`App.tsx:704`): condition becomes
  `apiStatus !== 'ok'`.
* **[NEW — adopting r2-uxr §4, dropped from v1]** Two #47 defects v1 did not
  mention and did not trade away:
  * **Overlay copy.** `App.tsx:704-733` gives no link to where in Planning Center
    to generate a token, no example format, no escape hatch. The Intelligence
    persona is explicitly not an API credential manager and this is the first
    thing they see. Add a deep link and a format example.
  * **Error messaging.** Only 401 gets a real message (`pco.ts:481-483`);
    network, CORS, DNS and PCO-outage failures fall through to raw `e.message`
    (`App.tsx:196`). This matters *more* after F7 adds new failure surfaces
    (purge, re-key) that a user must be able to interpret.

---

## 4. Unresolved disagreement — for Round 3

**Q1 — SETTLED.** Locus should not ingest `prayer_topic` at all. See F3.
Hands a named blocker to Area D covering `pco.ts:18,231,276` and `Student.prayerTopic`.

**Q4 — SETTLED, adopting r2-church-admin.** I left "does the Intelligence
persona hold their own token?" open; the codebase already answers it. There is
exactly one credential input in the entire app, so the shared-credential case is
not a hypothetical to resolve later — it is the only case that exists. F7's
purge work is P0, not contingent.

**Q2 (narrowed) — r2-church-admin is right that I answered the wrong question.**
v1 refused keep-apart logic using an argument about *youth safeguarding* (no
`custody`/`restricted_contact` field, no per-person auth, a keep-apart list would
be a second leaking safeguarding artifact). r2-church-admin's actual request was
different: **adult** small-group pins — keep a leader with their co-leader, keep
a couple apart who just left a group over conflict. That is not safeguarding
data; it is a two-column manual override on adult households, and the youth
argument does not dispose of it. **Round 3 must decide whether a
manual pin/anti-pin list on adult households is in scope for the Life Group
Balancer.** My current lean is yes-but-later: it is a UI problem (a pin list) on
top of a solver that F6 has not shipped yet, and F5's guard means the input is
adults-only by construction, which removes the objection I wrongly extended to
it. But it does add a persisted list of who-avoids-whom to a data layer F7 is
still rebuilding, so it should not land before F7.

**Q3 — partially settled, remainder sharpened.** F2's function-level guard is now
mandatory and in-cycle, which resolves the "is the claim enforced" half.
r2-church-admin's remaining point is architectural and I accept the diagnosis
without accepting it as this round's work: Locus uses one shared Application ID
+ Secret via Basic auth for the whole org (`App.tsx:100-103`), which is
Manager-equivalent for every user regardless of which card they clicked. A real
boundary means per-user PCO OAuth so the Intelligence login is a Viewer-scoped
PCO user and writes 403 at PCO's own API. **Round 3 must decide whether
per-user OAuth is the named target architecture or an explicit non-goal** — it
must not remain implied-to-exist by phrasing. It is bigger than this round's
budget either way.

**Q5 (new) — how much is a client-side short-circuit worth as a "sandbox"?**
F1 makes the toggle honest, but a client-side short-circuit is a *simulation of
nothing*: it returns a synthesised success and never exercises PCO's validation,
so a batch that would 422 in production appears to succeed in sandbox. That is
better than lying, and it is worse than a real dry-run. Round 3 should decide
whether the honest framing is "Preview mode — no changes are sent to Planning
Center" (accurate, modest) or whether a genuine dry-run against PCO's validation
is required before any write-capable feature can be trialled at a real church.
No critic has raised this; I am raising it against my own F1.

---

## 5. New ideas earned this round (3 max, each names what it replaces)

**Idea 1 — A persistence switch, not a purge button.** *Replaces:* v1's Idea 1
("Local Data panel with a Clear button") as the primary control, and the
disk-by-default behaviour in `cache.ts` and `api.ts`. *Job:* two critics
independently concluded that a control depending on a human remembering to press
it is not a control in this codebase, on the evidence that two convincing-looking
safety features already do nothing. One toggle, off by default, plus routing
existing writes through a `persistenceEnabled?` check — smaller than F7's own KDF
threading, and it removes the dependency on anyone clicking anything. The panel
and button survive as the trusted-device escape hatch.

**Idea 2 — Promote the loaded/total record count into the global toolbar.**
*Replaces:* the per-view "Load More Records" button at `App.tsx:798-804`, which
exists in one of ~45 views. *Job:* every analytic screen silently reports on ≤500
records of a 5,000-person church (`App.tsx:230`, `maxPages: 5`). One element at
`App.tsx:733-748` retires that complaint across all six areas. **Carried
unchanged from v1 — still the highest cross-area value-per-hour item in the
audit, and still unattacked by any critic in two rounds. CONVERGED.**

**Idea 3 — A "no third-party requests" test, not just a fix.** *Replaces:* the
ad-hoc per-component avatar fallback in 6 files. *Job:* the `ui-avatars.com`
pattern survived a full round of four critics and my own synthesis, and was
about to survive an in-place rewrite of one of its host files (F6 touching
`SmallGroupSorter.tsx:90`). A one-line test asserting no external host appears
in `src/` outgoing URLs converts a finding that keeps getting dropped into one
that cannot regress — and it is the mechanism, not the fix, that is the idea
here.
